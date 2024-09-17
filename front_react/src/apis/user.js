const { request } = require("@/utils");

//login
export function loginAPI(formData) {
    return request({
        url: '/authorizations',
        method: 'POST',
        data: formData
    })
}

//userInfo
export function getProfileAPI() {
    return request({
        url: '/user/profile',
        method: 'GET'
    })
}