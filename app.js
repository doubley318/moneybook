const { ensureToken } = require('./utils/auth')

App({
  onLaunch() {
    ensureToken().catch((error) => {
      console.error('initial login failed', error)
    })
  }
})
