Page({
  goCreateEdit(event) {
    const type = event.currentTarget.dataset.type
    if (!type) return

    wx.navigateTo({
      url: `/pages/create/edit/edit?type=${type}`
    })
  }
})
