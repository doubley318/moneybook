const { getContactGroups, getContacts } = require('../../data/contacts')
const { fetchRecords, loadCachedRecords } = require('../../data/records')

const groupOrder = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#'.split('')
const fallbackGroupLetter = '#'

function compareGroupLetter(left, right) {
  const fallbackIndex = groupOrder.indexOf(fallbackGroupLetter)
  const leftIndex = groupOrder.indexOf(left)
  const rightIndex = groupOrder.indexOf(right)
  return (leftIndex === -1 ? fallbackIndex : leftIndex) - (rightIndex === -1 ? fallbackIndex : rightIndex)
}

function sortContactGroups(sourceGroups) {
  return sourceGroups
    .map((group) => ({
      ...group,
      contacts: [...group.contacts].sort((left, right) => left.name.localeCompare(right.name, 'zh-Hans-CN'))
    }))
    .sort((left, right) => compareGroupLetter(left.letter, right.letter))
}

Page({
  data: {
    keyword: '',
    contactGroups: [],
    suggestions: [],
    total: 0
  },

  onLoad() {
    loadCachedRecords()
    this.refreshContacts()
  },

  async onShow() {
    this.refreshContacts()
    await fetchRecords()
    this.refreshContacts()
  },

  refreshContacts() {
    const contacts = getContacts()

    this.setData({
      contactGroups: sortContactGroups(getContactGroups()),
      suggestions: this.buildSuggestions(this.data.keyword, contacts),
      total: contacts.length
    })
  },

  buildSuggestions(keyword, sourceContacts = getContacts()) {
    const value = `${keyword || ''}`.trim()
    if (!value) return []

    return sourceContacts
      .filter((contact) => (
        contact.name.includes(value) ||
        `${contact.count}`.includes(value) ||
        `${contact.amount}`.includes(value)
      ))
      .slice(0, 6)
  },

  updateKeyword(event) {
    const keyword = event.detail.value.trim()

    this.setData({
      keyword,
      suggestions: this.buildSuggestions(keyword)
    })
  },

  chooseSuggestion(event) {
    this.goContactDetail(event)
  },

  goContactDetail(event) {
    const id = event.currentTarget.dataset.id
    if (!id) return
    wx.navigateTo({
      url: `/pages/contacts/detail/detail?id=${id}`
    })
  },

  clearKeyword() {
    this.setData({
      keyword: '',
      suggestions: []
    })
  }
})
