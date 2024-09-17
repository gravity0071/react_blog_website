const express = require('express'); // Import express
const jsonServer = require('json-server');
const multer = require('multer');
const path = require('path');

const server = express();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();

server.use(middlewares);
server.use(jsonServer.bodyParser);

// Custom POST endpoint to receive phone number and code, return a token
server.post('/authorizations', (req, res) => {
    const { mobile, code } = req.body;

    const db = router.db;
    const tokens = db.get('tokens'); // assuming 'tokens' is a collection in db.json

    // Check if the mobile and code exist in the database
    const existingEntry = tokens.find({ mobile, code }).value();

    if (existingEntry) {
        // Mobile and code found, return the existing token
        console.log('token exists,', existingEntry.token);
        return res.status(200).json({
            token: existingEntry.token,
            message: "Authentication successful"
        });
    } else {
        // Mobile and code not found, return 400 error
        return res.status(400).json({
            message: "Invalid phone number or code"
        });
    }
});

server.get('/user/profile', (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.slice(7) // Remove 'Bearer ' (7 characters)
        : null;
    const db = router.db;
    const user = db.get('users');
    const existingEntry = user.first().value();
    const tokens = db.get('tokens');
    const tokenEntry = tokens.find({ token }).value();
    if (!tokenEntry) {
        return res.status(401).json({
            message: "unauthorised person"
        });
    }

    return res.status(200).json({
        data: existingEntry,
        message: "Authentication successful"
    });
});

server.get('/channels', (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.slice(7) // Remove 'Bearer ' (7 characters)
        : null;
    const db = router.db;
    const channels = db.get('channels');
    const tokens = db.get('tokens');
    const tokenEntry = tokens.find({ token }).value();
    if (!tokenEntry) {
        return res.status(401).json({
            message: "unauthorised person"
        });
    }

    return res.status(200).json({
        data: channels,
        message: "Authentication successful"
    });
});

server.post('/mp/articles', (req, res) => {
    const { title, status } = req.body;

    // Set default values for other fields
    const newArticle = {
        id: Date.now().toString(), // Use timestamp as string ID
        title,
        status: 1,
        content: req.body.content || null,
        comment_count: req.body.comment_count || 0,
        pubdate: req.body.pubdate || new Date().toISOString(),
        cover: req.body.cover || { images: [], type: 1 },
        like_count: req.body.like_count || 0,
        read_count: req.body.read_count || 0,
        channel_id: req.body.channel_id || null,
        draft: req.query.draft === 'false' ? false : true, // Determine if it's a draft based on request query
        created_at: new Date().toISOString()
    };

    // Access the database
    const db = router.db;
    const articles = db.get('articles'); // Assume 'articles' is a collection in db.json

    // Save the article to the database
    articles.push(newArticle).write();

    // Return a successful response
    return res.status(201).json({
        message: 'Article created successfully',
        article: newArticle
    });
});

// Setup static file serving
server.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Destination folder for uploaded files
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname); // Get the file extension
        const basename = path.basename(file.originalname, ext); // Get the file name without extension
        const uniqueName = `${basename}-${Date.now()}${ext}`; // Create a unique file name
        cb(null, uniqueName); // Set the file name
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // Limit file size to 5MB
    },
});

// Endpoint to handle file uploads
server.post('/upload', upload.single('image'), (req, res) => {
    const file = req.file;

    if (!file) {
        return res.status(400).json({
            message: 'Please upload a file',
        });
    }

    // Construct the file URL (assuming you're serving the uploads folder statically)
    const fileUrl = `http://localhost:8888/uploads/${file.filename}`;

    // Send a successful response with the uploaded file's URL
    return res.status(201).json({
        message: 'File uploaded successfully',
        fileUrl: fileUrl,
    });
});

// Handle GET request for article list
server.get('/mp/articles', (req, res) => {
    const {
        status = '',
        channel_id = '',
        begin_pubdate = '',
        end_pubdate = '',
        page = 1,
        per_page = 4
    } = req.query;

    const db = router.db; // Get the database
    let articles = db.get('articles'); // Assuming 'articles' is the collection in db.json

    // Apply filters based on the passed parameters
    if (status) {
        articles = articles.filter(article => String(article.status) === status);
    }
    if (channel_id) {
        articles = articles.filter(article => String(article.channel_id) === channel_id);
    }
    if (begin_pubdate) {
        articles = articles.filter(article => new Date(article.pubdate) >= new Date(begin_pubdate));
    }
    if (end_pubdate) {
        articles = articles.filter(article => new Date(article.pubdate) <= new Date(end_pubdate));
    }

    // Ensure each article has the necessary properties with fallback defaults
    const ensureArticleProps = article => ({
        id: article.id || '',
        title: article.title || '',
        status: article.status || 0,
        comment_count: article.comment_count || 0,
        pubdate: article.pubdate || new Date().toISOString(),
        cover: article.cover || { images: [], type: 0 },
        like_count: article.like_count || 0,
        read_count: article.read_count || 0,
        content: article.content || ''
    });

    // Paginate the results
    const startIndex = (page - 1) * per_page;
    const paginatedArticles = articles.slice(startIndex, startIndex + per_page).map(ensureArticleProps);

    // Prepare the final response
    const response = {
        data: {
            page: Number(page),
            per_page: Number(per_page),
            results: paginatedArticles,
            total_count: articles.size().value() // Total number of filtered articles
        },
        message: "OK"
    };

    res.status(200).json(response);
});

// Delete article by ID
server.delete('/mp/articles/:id', (req, res) => {
    const { id } = req.params;
    const db = router.db; // Get access to the database

    const articles = db.get('articles'); // Assuming 'articles' is the collection in db.json

    // Find the article by id
    const article = articles.find({ id }).value();

    if (!article) {
        return res.status(404).json({ message: 'Article not found' });
    }

    // Remove the article from the database
    articles.remove({ id }).write();

    // Send success response
    res.status(200).json({ message: 'Article deleted successfully' });
});

server.get('/mp/articles/:id', (req, res) => {
    const { id } = req.params;
    const db = router.db; // Get access to the database

    const article = db.get('articles').find({ id }).value(); // Find article by ID

    if (!article) {
        return res.status(404).json({ message: 'Article not found' });
    }

    // Return the found article
    res.status(200).json({ data: article, message: 'OK' });
});

server.put('/mp/articles/:id', (req, res) => {
    const { id } = req.params;
    const updatedData = req.body;

    const db = router.db; // Get access to the database
    const articles = db.get('articles'); // Assuming 'articles' is the collection in db.json

    // Find the article by id
    const article = articles.find({ id }).value();

    if (!article) {
        return res.status(404).json({ message: 'Article not found' });
    }

    // Update the article with new data
    articles.find({ id }).assign(updatedData).write();

    // Return a successful response with the updated article
    return res.status(200).json({
        message: 'Article updated successfully',
        article: { ...article, ...updatedData }
    });
});


// Use default router
server.use(router);

server.listen(8888, () => {
    console.log('JSON Server is running');
});
