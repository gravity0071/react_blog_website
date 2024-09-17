// Import Axios
import axios from "axios";
import { getToken, removeToken } from "./token";
import router from "@/router";

// Create an Axios instance with default configuration
const request = axios.create({
    baseURL: 'http://localhost:8888/', // Base URL for all requests
    timeout: 5000 // Timeout set to 5 seconds
})

// Add request interceptor
request.interceptors.request.use((config) => {
    const token = getToken()
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
}, (error) => {
    return Promise.reject(error)
})

// Add response interceptor
request.interceptors.response.use((response) => {
    // This function will be triggered for status codes in the range of 2xx.
    // Do something with the response data
    return response.data
}, (error) => {
    //token expired: 401
    if (error.response.status === 401) {
        removeToken()
        router.navigate('/login')
        window.location.reload()
    }
    return Promise.reject(error)
})

// Export the request object
export { request }
