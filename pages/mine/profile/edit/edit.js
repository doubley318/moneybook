const { getProfile, saveProfile } = require('../../../../data/profile')

Page({
  data: {
    avatar: '',
    defaultAvatar: '/assets/icons/default-avatar.svg',
    nickname: '微信用户',
    saving: false
  },

  onLoad() {
    const profile = getProfile()
    this.setData({
      avatar: profile.avatar === this.data.defaultAvatar ? '' : profile.avatar,
      nickname: profile.nickname
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
      avatar: this.data.avatar || this.data.defaultAvatar
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
