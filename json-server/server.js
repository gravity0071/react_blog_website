const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 8888;

// Middleware for parsing JSON requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const db = {
    tokens: [],
    users: [{ id: '1', name: 'User1', email: 'user1@example.com' }],
    channels: [{ id: '1', name: 'Channel1' }],
    articles: []
};

// Custom POST endpoint for authentication
app.post('/authorizations', (req, res) => {
    const { mobile, code } = req.body;

    const tokenEntry = db.tokens.find(entry => entry.mobile === mobile && entry.code === code);
    if (tokenEntry) {
        return res.status(200).json({
            token: tokenEntry.token,
            message: "Authentication successful"
        });
    }

    return res.status(400).json({ message: "Invalid phone number or code" });
});

// GET endpoint for user profile
app.get('/user/profile', (req, res) => {
    const token = getTokenFromHeaders(req);
    if (!isTokenValid(token)) {
        return res.status(401).json({ message: "Unauthorized person" });
    }

    const userProfile = db.users[0];
    res.status(200).json({ data: userProfile, message: "Authentication successful" });
});

// GET endpoint for channels
app.get('/channels', (req, res) => {
    const token = getTokenFromHeaders(req);
    if (!isTokenValid(token)) {
        return res.status(401).json({ message: "Unauthorized person" });
    }

    res.status(200).json({ data: db.channels, message: "Authentication successful" });
});

// POST endpoint for creating articles
app.post('/mp/articles', (req, res) => {
    const { title, status } = req.body;

    const newArticle = {
        id: Date.now().toString(),
        title,
        status: status || 1,
        content: req.body.content || null,
        comment_count: req.body.comment_count || 0,
        pubdate: req.body.pubdate || new Date().toISOString(),
        cover: req.body.cover || { images: [], type: 1 },
        like_count: req.body.like_count || 0,
        read_count: req.body.read_count || 0,
        channel_id: req.body.channel_id || null,
        draft: req.query.draft !== 'false',
        created_at: new Date().toISOString()
    };

    db.articles.push(newArticle);
    res.status(201).json({ message: 'Article created successfully', article: newArticle });
});

// GET endpoint for retrieving articles
app.get('/mp/articles', (req, res) => {
    const { status, channel_id, begin_pubdate, end_pubdate, page = 1, per_page = 4 } = req.query;

    let filteredArticles = [...db.articles];
    if (status) filteredArticles = filteredArticles.filter(article => String(article.status) === status);
    if (channel_id) filteredArticles = filteredArticles.filter(article => String(article.channel_id) === channel_id);
    if (begin_pubdate) filteredArticles = filteredArticles.filter(article => new Date(article.pubdate) >= new Date(begin_pubdate));
    if (end_pubdate) filteredArticles = filteredArticles.filter(article => new Date(article.pubdate) <= new Date(end_pubdate));

    const startIndex = (page - 1) * per_page;
    const paginatedArticles = filteredArticles.slice(startIndex, startIndex + parseInt(per_page));

    res.status(200).json({
        data: {
            page: parseInt(page),
            per_page: parseInt(per_page),
            results: paginatedArticles,
            total_count: filteredArticles.length
        },
        message: "OK"
    });
});

// DELETE endpoint for articles
app.delete('/mp/articles/:id', (req, res) => {
    const { id } = req.params;
    const index = db.articles.findIndex(article => article.id === id);
    if (index === -1) {
        return res.status(404).json({ message: 'Article not found' });
    }

    db.articles.splice(index, 1);
    res.status(200).json({ message: 'Article deleted successfully' });
});

// PUT endpoint for updating articles
app.put('/mp/articles/:id', (req, res) => {
    const { id } = req.params;
    const updatedData = req.body;

    const article = db.articles.find(article => article.id === id);
    if (!article) {
        return res.status(404).json({ message: 'Article not found' });
    }

    Object.assign(article, updatedData);
    res.status(200).json({ message: 'Article updated successfully', article });
});

// GET endpoint for specific article
app.get('/mp/articles/:id', (req, res) => {
    const { id } = req.params;
    const article = db.articles.find(article => article.id === id);
    if (!article) {
        return res.status(404).json({ message: 'Article not found' });
    }

    res.status(200).json({ data: article, message: 'OK' });
});

// Static file serving and file upload
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

app.post('/upload', upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'Please upload a file' });

    const fileUrl = `http://localhost:${PORT}/uploads/${req.file.filename}`;
    res.status(201).json({ message: 'File uploaded successfully', fileUrl });
});

// Utility functions
function getTokenFromHeaders(req) {
    const authHeader = req.headers['authorization'];
    return authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
}

function isTokenValid(token) {
    return db.tokens.some(entry => entry.token === token);
}

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
