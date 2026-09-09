function truncateText(value, limit) {
  const text = `${value || ''}`
  return text.length > limit ? `${text.slice(0, limit)}...` : text
}

function formatRecord(record, truncate) {
  if (!truncate) return record

  return {
    ...record,
    displayScene: truncateText(record.scene, 7),
    displayValue: truncateText(record.value, 8)
  }
}

function formatYearGroups(yearGroups, truncate) {
  if (!truncate) return yearGroups

  return (yearGroups || []).map((yearGroup) => ({
    ...yearGroup,
    days: (yearGroup.days || []).map((dayGroup) => ({
      ...dayGroup,
      records: (dayGroup.records || []).map((record) => formatRecord(record, true))
    }))
  }))
}

Component({
  properties: {
    yearGroups: {
      type: Array,
      value: []
    },
    records: {
      type: Array,
      value: []
    },
    plain: {
      type: Boolean,
      value: false
    },
    embedded: {
      type: Boolean,
      value: false
    },
    hideYear: {
      type: Boolean,
      value: false
    },
    selectable: {
      type: Boolean,
      value: false
    },
    centerEmpty: {
      type: Boolean,
      value: false
    },
    truncateText: {
      type: Boolean,
      value: false
    },
    disableTap: {
      type: Boolean,
      value: false
    },
    hideArrow: {
      type: Boolean,
      value: false
    },
    emptyText: {
      type: String,
      value: '暂无记录'
    },
    emptyIcon: {
      type: String,
      value: ''
    }
  },

  observers: {
    'yearGroups, records, truncateText': function (yearGroups, records, truncate) {
      this.setData({
        displayYearGroups: formatYearGroups(yearGroups, truncate),
        displayRecords: (records || []).map((record) => formatRecord(record, truncate))
      })
    }
  },

  data: {
    displayYearGroups: [],
    displayRecords: []
  },

  methods: {
    handleRecordTap(event) {
      if (this.data.selectable) {
        this.triggerEvent('selectrecord', {
          id: event.currentTarget.dataset.id
        })
        return
      }

      if (this.data.disableTap) return

      this.triggerEvent('recordtap', {
        id: event.currentTarget.dataset.id
      })
    }
  }
})
