const TOKEN_KEY = 'moneybook_token'
const LOCAL_TOKEN = 'local-dev-token'

function getToken() {
  try {
    return wx.getStorageSync(TOKEN_KEY) || ''
  } catch (e) {
    return ''
  }
}

function setToken(token) {
  try {
    wx.setStorageSync(TOKEN_KEY, token)
  } catch (e) {}
}

function clearToken() {
  try {
    wx.removeStorageSync(TOKEN_KEY)
  } catch (e) {}
}

async function ensureToken(forceRefresh = false) {
  if (forceRefresh) clearToken()
  if (getToken()) return
  setToken(LOCAL_TOKEN)
}

module.exports = { getToken, setToken, clearToken, ensureToken }
