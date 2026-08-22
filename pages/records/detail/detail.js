const { records, findRecordById, moveRecordToTrash, fetchRecords, refreshRecordDisplayNames } = require('../../../data/records')
const { getContactRecordById } = require('../../../data/contacts')

function getTextVisualLength(text) {
  return `${text || ''}`.split('').reduce((total, char) => {
    return total + (/[\u4e00-\u9fff]/.test(char) ? 2 : 1)
  }, 0)
}

function needsWrap(text) {
  return getTextVisualLength(text) > 34
}

Page({
  data: {
    record: null,
    showDeleteDialog: false,
    previewVisible: false,
    previewImage: '',
    showSaveSheet: false,
    savingImage: false
  },

  async onLoad(options) {
    this.recordId = options.id
    if (!records.length) await fetchRecords()
    refreshRecordDisplayNames()
    this.loadRecord()
  },

  async onShow() {
    if (!this.recordId) return
    this.loadRecord()
    await fetchRecords()
    this.loadRecord()
  },

  loadRecord() {
    refreshRecordDisplayNames()
    const record = findRecordById(this.recordId) || getContactRecordById(this.recordId)
    if (!record) {
      wx.showToast({ title: '记录不存在', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 800)
      return
    }
    const images = Array.isArray(record.images) ? record.images : []
    const value = `${record.value || ''}`.trim()
    const scene = `${record.scene || ''}`.trim()
    const remark = `${record.remark || ''}`.trim()
    const estimatedValue = `${record.estimatedValue || ''}`.trim()
    const cost = `${record.cost || ''}`.trim()
    const longValue = needsWrap(value)
    const longScene = needsWrap(scene)
    const longRemark = needsWrap(remark)

    this.setData({
      record: {
        ...record,
        value,
        scene,
        remark,
        estimatedValue,
        cost,
        images,
        valueWrapClass: longValue ? 'long' : 'short',
        sceneClass: longScene ? 'long' : 'short',
        hasRemark: Boolean(remark),
        isLongRemark: longRemark,
        remarkClass: longRemark ? 'long' : 'short',
        hasImages: images.length > 0,
        hasEstimatedValue: Boolean(estimatedValue),
        hasCost: Boolean(cost)
      }
    })
  },

  editRecord() {
    if (!this.data.record) return
    wx.navigateTo({
      url: `/pages/records/edit/edit?id=${this.data.record.id}`
    })
  },

  openDeleteDialog() {
    this.setData({ showDeleteDialog: true })
  },

  closeDeleteDialog() {
    this.setData({ showDeleteDialog: false })
  },

  async confirmDelete() {
    if (!this.data.record) return

    try {
      await moveRecordToTrash(this.data.record.id)
      this.setData({ showDeleteDialog: false })
      wx.showToast({ title: '已删除', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 800)
    } catch (e) {
      wx.showToast({ title: '删除失败', icon: 'none' })
    }
  },

  openImagePreview(event) {
    const src = event.currentTarget.dataset.src
    if (!src) return

    this.setData({
      previewVisible: true,
      previewImage: src,
      showSaveSheet: false,
      savingImage: false
    })
  },

  closeImagePreview() {
    if (this.data.showSaveSheet) return

    this.setData({
      previewVisible: false,
      previewImage: '',
      showSaveSheet: false,
      savingImage: false
    })
  },

  openSaveImageSheet() {
    if (!this.data.previewImage) return

    this.setData({
      showSaveSheet: true
    })
  },

  closeSaveImageSheet() {
    if (this.data.savingImage) return

    this.setData({
      showSaveSheet: false
    })
  },

  noop() {},

  getLocalImagePath(src) {
    if (!/^https?:\/\//.test(`${src || ''}`)) {
      return Promise.resolve(src)
    }

    return new Promise((resolve, reject) => {
      wx.downloadFile({
        url: src,
        success(res) {
          if (res.statusCode >= 200 && res.statusCode < 300 && res.tempFilePath) {
            resolve(res.tempFilePath)
            return
          }

          reject(new Error('图片下载失败'))
        },
        fail: reject
      })
    })
  },

  saveImageToAlbum(filePath) {
    return new Promise((resolve, reject) => {
      wx.saveImageToPhotosAlbum({
        filePath,
        success: resolve,
        fail: reject
      })
    })
  },

  async savePreviewImage() {
    if (this.data.savingImage || !this.data.previewImage) return

    this.setData({ savingImage: true })

    try {
      const filePath = await this.getLocalImagePath(this.data.previewImage)
      await this.saveImageToAlbum(filePath)

      wx.showToast({ title: '已保存', icon: 'success' })
      this.setData({
        showSaveSheet: false,
        savingImage: false
      })
    } catch (error) {
      console.error('save image failed', error)
      this.setData({ savingImage: false })
      wx.showToast({
        title: '保存失败，请检查相册权限',
        icon: 'none'
      })
    }
  }
})
