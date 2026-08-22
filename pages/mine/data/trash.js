const {
  fetchTrashRecords,
  getYearGroups,
  restoreRecordsFromTrash,
  deleteTrashRecords
} = require('../../../data/records')

Page({
  data: {
    yearGroups: [],
    trashRecords: [],
    managing: false,
    selectedIds: [],
    allSelected: false
  },

  async onShow() {
    await this.refreshTrashRecords()
  },

  async refreshTrashRecords() {
    const trashRecords = (await fetchTrashRecords())
      .sort((prev, next) => `${next.fullDate}`.localeCompare(`${prev.fullDate}`))
      .map((record) => ({
        ...record,
        selected: this.data.selectedIds.includes(record.id)
      }))
    const allSelected = trashRecords.length > 0 && trashRecords.every((r) => r.selected)

    this.setData({
      trashRecords,
      yearGroups: getYearGroups(trashRecords),
      allSelected
    })
  },

  toggleManage() {
    const managing = !this.data.managing
    this.setData({
      managing,
      selectedIds: managing ? this.data.selectedIds : [],
      allSelected: false
    }, () => { this.refreshTrashRecords() })
  },

  handleSelectRecord(event) {
    const id = event.detail.id
    const selectedIds = this.data.selectedIds.includes(id)
      ? this.data.selectedIds.filter((item) => item !== id)
      : [...this.data.selectedIds, id]

    this.setData({ selectedIds }, () => { this.refreshTrashRecords() })
  },

  toggleSelectAll() {
    const selectedIds = this.data.allSelected
      ? []
      : this.data.trashRecords.map((r) => r.id)

    this.setData({ selectedIds }, () => { this.refreshTrashRecords() })
  },

  async restoreSelected() {
    if (!this.data.selectedIds.length) {
      wx.showToast({ title: '请选择记录', icon: 'none' })
      return
    }

    try {
      await restoreRecordsFromTrash(this.data.selectedIds)
      wx.showToast({ title: '已恢复', icon: 'none' })
      this.setData({ managing: false, selectedIds: [], allSelected: false }, () => {
        this.refreshTrashRecords()
      })
    } catch (e) {
      wx.showToast({ title: '恢复失败', icon: 'none' })
    }
  },

  async deleteSelected() {
    if (!this.data.selectedIds.length) {
      wx.showToast({ title: '请选择记录', icon: 'none' })
      return
    }

    try {
      await deleteTrashRecords(this.data.selectedIds)
      wx.showToast({ title: '已删除', icon: 'none' })
      this.setData({ managing: false, selectedIds: [], allSelected: false }, () => {
        this.refreshTrashRecords()
      })
    } catch (e) {
      wx.showToast({ title: '删除失败', icon: 'none' })
    }
  }
})
