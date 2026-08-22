const { getProfile, saveProfile } = require('../../../../data/profile')

Page({
  data: {
    avatar: '',
    defaultAvatar: '/assets/icons/default-avatar.svg',
    nickname: 'XXX',
    phone: '12345678910',
    saving: false
  },

  onLoad() {
    const profile = getProfile()
    this.setData({
      avatar: profile.avatar === this.data.defaultAvatar ? '' : profile.avatar,
      nickname: profile.nickname,
      phone: profile.phone
    })
  },

  chooseAvatar() {
    const updateAvatar = (path) => {
      if (!path) return
      this.setData({ avatar: path })
    }

    if (wx.chooseMedia) {
      wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          const file = res.tempFiles && res.tempFiles[0]
          updateAvatar(file && file.tempFilePath)
        }
      })
      return
    }

    wx.chooseImage({
      count: 1,
      sourceType: ['album', 'camera'],
      success: (res) => {
        updateAvatar(res.tempFilePaths && res.tempFilePaths[0])
      }
    })
  },

  updateNickname(event) {
    this.setData({
      nickname: event.detail.value
    })
  },

  unbindPhone() {
    wx.showToast({
      title: '解绑手机号待接入',
      icon: 'none'
    })
  },

  saveProfile() {
    if (this.data.saving) return

    const nickname = this.data.nickname.trim()

    if (!nickname) {
      wx.showToast({
        title: '请输入昵称',
        icon: 'none'
      })
      return
    }

    this.setData({ saving: true })

    saveProfile({
      nickname,
      avatar: this.data.avatar || this.data.defaultAvatar,
      phone: this.data.phone
    })

    wx.showToast({
      title: '保存成功',
      icon: 'success'
    })

    setTimeout(() => {
      wx.navigateBack()
    }, 800)
  }
})
