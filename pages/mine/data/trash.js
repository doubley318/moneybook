const {
  fetchTrashRecords,
  getYearGroups,
  restoreRecordsFromTrash,
  deleteTrashRecords
} = require('../../../data/records')
const { track } = require('../../../utils/analytics')

Page({
  data: {
    yearGroups: [],
    trashRecords: [],
    managing: false,
    selectedIds: [],
    allSelected: false
  },

  async onShow() {
    track('trash_page_view')
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
    if (managing) {
      track('trash_manage_click')
    }

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
    track('trash_restore_click')

    if (!this.data.selectedIds.length) {
      wx.showToast({ title: '请选择记录', icon: 'none' })
      return
    }

    const recordCount = this.data.selectedIds.length

    try {
      await restoreRecordsFromTrash(this.data.selectedIds)
      track('trash_restore_success', {
        record_count: recordCount
      })

      wx.showToast({ title: '已恢复', icon: 'none' })
      this.setData({ managing: false, selectedIds: [], allSelected: false }, () => {
        this.refreshTrashRecords()
      })
    } catch (e) {
      wx.showToast({ title: '恢复失败', icon: 'none' })
    }
  },

  async deleteSelected() {
    track('trash_delete_click')

    if (!this.data.selectedIds.length) {
      wx.showToast({ title: '请选择记录', icon: 'none' })
      return
    }

    const recordCount = this.data.selectedIds.length

    try {
      await deleteTrashRecords(this.data.selectedIds)
      track('trash_delete_success', {
        record_count: recordCount
      })

      wx.showToast({ title: '已删除', icon: 'none' })
      this.setData({ managing: false, selectedIds: [], allSelected: false }, () => {
        this.refreshTrashRecords()
      })
    } catch (e) {
      wx.showToast({ title: '删除失败', icon: 'none' })
    }
  }
})
