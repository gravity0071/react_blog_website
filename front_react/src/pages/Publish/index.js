import {
  Card,
  Breadcrumb,
  Form,
  Button,
  Input,
  Space,
  Select,
  Radio,
  Upload,
  message
} from 'antd'
import { Link, useSearchParams } from 'react-router-dom'
import './index.scss'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import { useEffect, useState } from 'react'
import { createArticleAPI, getAriticleById, updateArticleAPI } from '@/apis/article'
// Import PlusOutlined from antd icons
import { PlusOutlined } from '@ant-design/icons'
import { useChannel } from '@/hooks/useChannel'

const { Option } = Select

const Publish = () => {
  const { channelList } = useChannel()

  const onFinish = async (formValue) => {
    // console.log(imageList)
    if (imageList.length !== imageType)
      return message.warning('uncompatible number of images')
    const { title, content, channel_id } = formValue
    const reqData = {
      title,
      content,
      cover: {
        type: imageType,
        images: imageList.map(item => {
          if (item.response)
            return item.response.fileUrl
          else
            return item.url
        })
      },
      channel_id
    }
    // console.log(reqData)
    if (articleId)
      await updateArticleAPI({ ...reqData, id: articleId })
    else
      await createArticleAPI(reqData)
    message.success('post successfully')
  }

  const [imageList, setImageList] = useState([])
  //upload image
  const onChange = (value) => {
    console.log('uploading', value)
    setImageList(value.fileList)
  }

  const [imageType, setImageType] = useState(0)
  const onTypeChange = (value) => {
    setImageType(value.target.value)
  }

  const [searchParams] = useSearchParams();
  const articleId = searchParams.get('id');

  const [form] = Form.useForm();

  useEffect(() => {
    async function getArticleDetail() {
      if (articleId) {
        const res = await getAriticleById(articleId);
        form.setFieldsValue({
          ...res.data,
          type: res.data.cover.type
        })
        setImageType(res.data.cover.type)
        setImageList(res.data.cover.images.map(url => {
          return { url }
        }))
      }
    }
    getArticleDetail();
  }, [articleId, form]);

  return (
    <div className="publish">
      <Card
        title={
          <Breadcrumb items={[
            { title: <Link to={'/'}>Home</Link> },
            { title: articleId ? 'Edit Article' : 'Publish Article' },
          ]}
          />
        }
      >
        <Form
          labelCol={{ span: 4 }}
          wrapperCol={{ span: 16 }}
          initialValues={{ type: { imageType } }}
          onFinish={onFinish}
          form={form}
        >
          <Form.Item
            label="Title"
            name="title"
            rules={[{ required: true, message: 'Please enter the article title' }]}
          >
            <Input placeholder="Please enter the article title" style={{ width: 400 }} />
          </Form.Item>

          <Form.Item
            label="Channel"
            name="channel_id"
            rules={[{ required: true, message: 'Please select an article channel' }]}
          >
            <Select placeholder="Please select an article channel" style={{ width: 400 }}>
              {channelList.map(item => <Option key={item.id} value={item.id}>{item.name}</Option>)}
            </Select>
          </Form.Item>

          <Form.Item label="Cover">
            <Form.Item name="type">
              <Radio.Group onChange={onTypeChange}>
                <Radio value={1}>Single Image</Radio>
                <Radio value={3}>Three Images</Radio>
                <Radio value={0}>No Image</Radio>
              </Radio.Group>
            </Form.Item>
            {imageType > 0 && <Upload listType="picture-card"
              showUploadList
              action={'http://localhost:8888/upload'}
              name='image'
              onChange={onChange}
              maxCount={imageType}
              fileList={imageList}>
              <div style={{ marginTop: 8 }}>
                <PlusOutlined />
              </div>
            </Upload>}
          </Form.Item>

          {/* Bind ReactQuill to the Form */}
          <Form.Item
            label="Content"
            name="content"
            rules={[{ required: true, message: 'Please enter the article content' }]}
          >
            <ReactQuill
              className="publish-quill"
              theme="snow"
              placeholder="Input passage content"
            />
          </Form.Item>

          <Form.Item wrapperCol={{ offset: 4 }}>
            <Space>
              <Button size="large" type="primary" htmlType="submit">
                Publish Article
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default Publish
