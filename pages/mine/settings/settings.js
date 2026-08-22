Page({
  data: {
    showClearCacheDialog: false,
    showCancelAccountDialog: false,
    sections: [
      {
        title: '缓存管理',
        items: [
          { key: 'clear-cache', label: '清除缓存' }
        ]
      },
      {
        title: '法律条款',
        items: [
          { key: 'agreement', label: '用户协议' },
          { key: 'privacy', label: '隐私政策' }
        ]
      },
      {
        title: '账号管理',
        items: [
          { key: 'cancel-account', label: '注销账号' }
        ]
      }
    ]
  },

  handleSettingTap(event) {
    const key = event.currentTarget.dataset.key
    const label = event.currentTarget.dataset.label

    if (key === 'clear-cache') {
      this.setData({ showClearCacheDialog: true })
      return
    }

    if (key === 'cancel-account') {
      this.setData({ showCancelAccountDialog: true })
      return
    }

    if (key === 'agreement') {
      wx.navigateTo({
        url: '/pages/mine/settings/agreement/agreement'
      })
      return
    }

    if (key === 'privacy') {
      wx.navigateTo({
        url: '/pages/mine/settings/privacy/privacy'
      })
      return
    }

    wx.showToast({
      title: `${label}待接入`,
      icon: 'none'
    })
  },

  closeClearCacheDialog() {
    this.setData({ showClearCacheDialog: false })
  },

  confirmClearCache() {
    wx.clearStorageSync()
    this.setData({ showClearCacheDialog: false })
    wx.showToast({
      title: '缓存已清除',
      icon: 'none'
    })
  },

  closeCancelAccountDialog() {
    this.setData({ showCancelAccountDialog: false })
  },

  confirmCancelAccount() {
    this.setData({ showCancelAccountDialog: false })
    wx.showToast({
      title: '注销账号待接入',
      icon: 'none'
    })
  }
})
