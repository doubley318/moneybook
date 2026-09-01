const { ensureToken } = require('./utils/auth')
const { track } = require('./utils/analytics')

App({
  onLaunch(options) {
    track('mini_program_launch_uv', {
      scene: options && options.scene ? options.scene : ''
    })

    ensureToken().catch((error) => {
      console.error('initial login failed', error)
    })
  },

  onHide() {
    track('mini_program_end')
  }
})
