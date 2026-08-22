const { getProfile } = require('../../data/profile')

Page({
  data: {
    user: {
      name: '用户名',
      id: '1234567',
      avatar: '/assets/icons/default-avatar.svg'
    },
    menuItems: [
      { key: 'share', label: '分享给好友', icon: 'share', iconSrc: '/assets/icons/mine-share.svg' },
      { key: 'about', label: '关于我们', icon: 'about', iconSrc: '/assets/icons/mine-about.svg' },
      { key: 'data', label: '数据管理', icon: 'data', iconSrc: '/assets/icons/mine-data.svg' },
      { key: 'feedback', label: '意见反馈', icon: 'feedback', iconSrc: '/assets/icons/mine-feedback.svg' },
      { key: 'settings', label: '系统设置', icon: 'settings', iconSrc: '/assets/icons/mine-settings.svg' }
    ]
  },

  onLoad() {
    this.refreshProfile()
  },

  onShow() {
    this.refreshProfile()
  },

  refreshProfile() {
    const profile = getProfile()
    this.setData({
      user: {
        name: profile.nickname,
        id: profile.id,
        avatar: profile.avatar
      }
    })
  },

  editProfile() {
    wx.navigateTo({
      url: '/pages/mine/profile/edit/edit'
    })
  },

  handleMenuTap(event) {
    const key = event.currentTarget.dataset.key
    const label = event.currentTarget.dataset.label

    if (key === 'about') {
      wx.navigateTo({
        url: '/pages/mine/about/about'
      })
      return
    }

    if (key === 'data') {
      wx.navigateTo({
        url: '/pages/mine/data/data'
      })
      return
    }

    if (key === 'feedback') {
      wx.navigateTo({
        url: '/pages/mine/feedback/feedback'
      })
      return
    }

    if (key === 'settings') {
      wx.navigateTo({
        url: '/pages/mine/settings/settings'
      })
      return
    }

    wx.showToast({
      title: `${label}待接入`,
      icon: 'none'
    })
  }
})
