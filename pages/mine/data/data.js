const { records, fetchRecords, loadCachedRecords, moveRecordsToTrash } = require('../../../data/records')
const { track } = require('../../../utils/analytics')

Page({
  data: {
    showClearDataDialog: false,
    showExportDialog: false,
    showExportToast: false,
    clearing: false,
    actions: [
      { key: 'export', label: '导出数据' },
      { key: 'clear', label: '清空数据' },
      { key: 'trash', label: '回收站' }
    ]
  },

  onLoad() {
    loadCachedRecords()
  },

  handleAction(event) {
    const key = event.currentTarget.dataset.key
    const label = event.currentTarget.dataset.label

    if (key === 'trash') {
      track('trash_entry_click')

      wx.navigateTo({
        url: '/pages/mine/data/trash'
      })
      return
    }

    if (key === 'clear') {
      this.setData({ showClearDataDialog: true })
      return
    }

    if (key === 'export') {
      track('data_export_click')
      this.openExportDialog()
    }
  },

  openExportDialog() {
    clearTimeout(this.exportToastTimer)
    clearTimeout(this.exportDialogTimer)
    this.setData({
      showExportToast: true,
      showExportDialog: false
    })

    this.exportToastTimer = setTimeout(() => {
      this.setData({ showExportToast: false })
      this.exportDialogTimer = setTimeout(() => {
        this.setData({ showExportDialog: true })
      }, 120)
    }, 1500)
  },

  closeExportDialog() {
    clearTimeout(this.exportToastTimer)
    clearTimeout(this.exportDialogTimer)
    this.setData({
      showExportDialog: false,
      showExportToast: false
    })
  },

  noop() {},

  downloadLocal() {
    track('data_export_action_click', {
      action_type: 'download_local'
    })

    this.closeExportDialog()
    wx.showToast({
      title: '本地下载待接入',
      icon: 'none'
    })
  },

  sendToFriend() {
    track('data_export_action_click', {
      action_type: 'share_friend'
    })

    this.closeExportDialog()
    wx.showToast({
      title: '发送给好友待接入',
      icon: 'none'
    })
  },

  closeClearDataDialog() {
    if (this.data.clearing) return
    this.setData({ showClearDataDialog: false })
  },

  async confirmClearData() {
    if (this.data.clearing) return

    loadCachedRecords()
    if (!records.length) await fetchRecords()

    const recordIds = records.map((record) => record.id)
    if (!recordIds.length) {
      wx.showToast({ title: '暂无可清空数据', icon: 'none' })
      this.setData({ showClearDataDialog: false })
      return
    }

    this.setData({ clearing: true })

    try {
      await moveRecordsToTrash(recordIds)
      wx.showToast({ title: '已清空', icon: 'none' })
      this.setData({
        showClearDataDialog: false,
        clearing: false
      })
    } catch (error) {
      console.error('clear data failed', error)
      this.setData({ clearing: false })
      wx.showToast({ title: '清空失败，请重试', icon: 'none' })
    }
  }
})
