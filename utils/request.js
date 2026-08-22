// 本地开发使用这个：
// const BASE_URL = 'http://127.0.0.1:3000/moneybook/api/v1'
// 上线使用这个：
const BASE_URL = 'http://api.shyren.xyz:2523/moneybook/api/v1'

function getToken() {
  try {
    return wx.getStorageSync('moneybook_token') || ''
  } catch (e) {
    return ''
  }
}

function request(method, path, data) {
  return new Promise((resolve, reject) => {
    const header = { 'Content-Type': 'application/json' }
    const token = getToken()
    if (token) header.Authorization = `Bearer ${token}`

    wx.request({
      url: BASE_URL + path,
      method,
      data: data || {},
      header,
      timeout: 15000,
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
          return
        }

        reject({
          statusCode: res.statusCode,
          data: res.data,
          message: (res.data && (res.data.message || res.data.error)) || '请求失败'
        })
      },
      fail(error) {
        reject({
          statusCode: 0,
          data: error,
          message: error && error.errMsg ? error.errMsg : '网络异常'
        })
      }
    })
  })
}

module.exports = {
  get: (path, params) => request('GET', path, params),
  post: (path, data) => request('POST', path, data),
  patch: (path, data) => request('PATCH', path, data),
  del: (path) => request('DELETE', path)
}
