const PROFILE_STORAGE_KEY = 'moneybook_profile'

const defaultProfile = {
  nickname: '微信用户',
  id: '1234567',
  avatar: '/assets/icons/default-avatar.svg'
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
  const profile = {
    ...defaultProfile,
    ...getStoredProfile()
  }
  if (profile.nickname === '我微信用户') profile.nickname = defaultProfile.nickname
  return profile
}

function saveProfile(profile) {
  const nextProfile = {
    ...getProfile(),
    ...profile
  }
  delete nextProfile.phone

  if (typeof wx !== 'undefined' && wx.setStorageSync) {
    wx.setStorageSync(PROFILE_STORAGE_KEY, nextProfile)
  }

  return nextProfile
}

module.exports = {
  getProfile,
  saveProfile
}
