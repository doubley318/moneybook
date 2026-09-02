const { getContactDetail, updateContactName } = require('../../../data/contacts')
const { fetchRecords, loadCachedRecords, moveRecordsToTrash, records } = require('../../../data/records')

Page({
  data: {
    contactId: '',
    name: '',
    recordIds: [],
    showDeleteDialog: false,
    deleting: false,
    saving: false
  },

  async onLoad(options) {
    loadCachedRecords()
    if (!records.length) await fetchRecords()
    const contact = getContactDetail(options.id)
    if (!contact) {
      wx.showToast({ title: '联系人不存在', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 800)
      return
    }

    this.setData({
      contactId: contact.id,
      name: contact.name,
      recordIds: (contact.records || []).map((record) => record.id)
    })
  },

  updateName(event) {
    this.setData({
      name: event.detail.value
    })
  },

  goBack() {
    wx.navigateBack()
  },

  async saveContact() {
    if (this.data.saving) return

    const name = this.data.name.trim()

    if (!name) {
      wx.showToast({ title: '请输入对方姓名', icon: 'none' })
      return
    }

    this.setData({ saving: true })

    try {
      await updateContactName(this.data.contactId, name)
      wx.navigateBack()
    } catch (error) {
      console.error('save contact failed', error)
      this.setData({ saving: false })
      wx.showToast({ title: '保存失败，请重试', icon: 'none' })
    }
  },

  openDeleteDialog() {
    if (this.data.deleting) return
    this.setData({ showDeleteDialog: true })
  },

  closeDeleteDialog() {
    if (this.data.deleting) return
    this.setData({ showDeleteDialog: false })
  },

  async confirmDelete() {
    if (this.data.deleting) return

    const recordIds = this.data.recordIds || []
    if (!recordIds.length) {
      wx.showToast({ title: '暂无可删除记录', icon: 'none' })
      this.setData({ showDeleteDialog: false })
      return
    }

    this.setData({ deleting: true })

    try {
      await moveRecordsToTrash(recordIds)
      this.setData({ showDeleteDialog: false })
      wx.showToast({ title: '已删除', icon: 'none' })
      setTimeout(() => {
        wx.redirectTo({
          url: '/pages/contacts/contacts'
        })
      }, 800)
    } catch (error) {
      console.error('delete contact failed', error)
      this.setData({ deleting: false })
      wx.showToast({ title: '删除失败，请重试', icon: 'none' })
    }
  }
})
