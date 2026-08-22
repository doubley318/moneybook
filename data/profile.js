const PROFILE_STORAGE_KEY = 'moneybook_profile'

const defaultProfile = {
  nickname: '用户名',
  id: '1234567',
  avatar: '/assets/icons/default-avatar.svg',
  phone: '12345678910'
}

function getStoredProfile() {
  if (typeof wx === 'undefined' || !wx.getStorageSync) return {}

  try {
    const profile = wx.getStorageSync(PROFILE_STORAGE_KEY)
    return profile && typeof profile === 'object' ? profile : {}
  } catch (error) {
    return {}
  }
}

function getProfile() {
  return {
    ...defaultProfile,
    ...getStoredProfile()
  }
}

function saveProfile(profile) {
  const nextProfile = {
    ...getProfile(),
    ...profile
  }

  if (typeof wx !== 'undefined' && wx.setStorageSync) {
    wx.setStorageSync(PROFILE_STORAGE_KEY, nextProfile)
  }

  return nextProfile
}

module.exports = {
  getProfile,
  saveProfile
}
