const { track } = require('../../utils/analytics')
const CREATE_START_TIME_STORAGE_KEY = 'record_create_start_time'

Page({
  onShow() {
    track('create_page_view')
  },

  goCreateEdit(event) {
    const type = event.currentTarget.dataset.type
    if (!type) return
    const createStartTime = Date.now()

    try {
      wx.setStorageSync(CREATE_START_TIME_STORAGE_KEY, createStartTime)
    } catch (error) {}

    track('record_create_type_click', {
      record_type: type
    })

    wx.navigateTo({
      url: `/pages/create/edit/edit?type=${type}&from=create`
    })
  }
})
