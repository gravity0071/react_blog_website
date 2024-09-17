import './index.scss'
import { Card, Form, Input, Button, message } from 'antd'
import logo from '@/assets/logo.png'
import { useDispatch } from 'react-redux'
import { fetchLogin } from '@/store/modules/user'
import { useNavigate } from 'react-router-dom'

const Login = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const onFinish = async (values) => {
    // console.log(values)
    await dispatch(fetchLogin(values))
    //jump to main page
    navigate('/')
    //remaind user that he has login successfully
    message.success('login successfully')
  }
  return (
    <div className="login">
      <Card className="login-container">
        <img className="login-logo" src={logo} alt="" />
        {/* Login form */}
        <Form validateTrigger='onBlur' onFinish={onFinish}>
          <Form.Item
            name="mobile"
            rules={[
              {
                required: true,
                message: 'please input your phone number!'
              },
              {
                pattern: /^\d{10}$/,
                message: 'please input valid phone number!'
              }
            ]}>
            <Input size="large" placeholder="Enter phone number" />
          </Form.Item>

          <Form.Item
            name="code"
            rules={[
              {
                required: true,
                message: 'please input your verification code!'
              },
            ]}>
            <Input size="large" placeholder="Enter verification code" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" size="large" block>
              Login
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default Login
