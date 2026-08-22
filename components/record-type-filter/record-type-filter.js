Component({
  properties: {
    options: {
      type: Array,
      value: []
    },
    selectedType: {
      type: String,
      value: 'all'
    },
    selectedLabel: {
      type: String,
      value: '全部'
    },
    open: {
      type: Boolean,
      value: false
    },
    sortOptions: {
      type: Array,
      value: []
    },
    selectedSort: {
      type: String,
      value: 'desc'
    },
    sortOpen: {
      type: Boolean,
      value: false
    },
    sortLabel: {
      type: String,
      value: '正序'
    }
  },

  methods: {
    noop() {},

    toggleType() {
      this.triggerEvent('toggle')
    },

    selectType(event) {
      this.triggerEvent('select', {
        value: event.currentTarget.dataset.value
      })
    },

    toggleSort() {
      this.triggerEvent('sorttoggle')
    },

    selectSort(event) {
      this.triggerEvent('sortselect', {
        value: event.currentTarget.dataset.value
      })
    }
  }
})
