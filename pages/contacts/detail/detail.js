const { getContactDetail } = require('../../../data/contacts')
const { fetchRecords, loadCachedRecords } = require('../../../data/records')

function truncateText(value, limit) {
  const text = `${value || ''}`
  return text.length > limit ? `${text.slice(0, limit)}...` : text
}

function formatContactDetail(contact) {
  if (!contact) return contact

  return {
    ...contact,
    records: (contact.records || []).map((record) => ({
      ...record,
      displayScene: truncateText(record.scene, 7),
      displayValue: truncateText(record.value, 8)
    }))
  }
}

Page({
  data: {
    contact: null
  },

  onLoad(options) {
    this.contactId = options.id
    loadCachedRecords()
    this.refreshContact()
    // onShow 会接管后续的网络刷新
  },

  async onShow() {
    this.refreshContact()
    await fetchRecords()
    this.refreshContact()
  },

  refreshContact() {
    this.setData({
      contact: formatContactDetail(getContactDetail(this.contactId))
    })
  },

  goRecordDetail(event) {
    const id = event.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/records/detail/detail?id=${id}`
    })
  },

  editContact() {
    if (!this.data.contact) return

    wx.navigateTo({
      url: `/pages/contacts/edit/edit?id=${this.data.contact.id}`
    })
  },

  addRecord() {
    if (!this.data.contact) return

    wx.navigateTo({
      url: `/pages/create/edit/edit?from=contact&name=${encodeURIComponent(this.data.contact.name)}`
    })
  }
})
