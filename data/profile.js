const { get, patch, post, buildUrl } = require('../utils/request')
const { ensureToken } = require('../utils/auth')

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

function normalizeRemoteProfile(profile) {
  return {
    id: profile && profile.id ? String(profile.id) : defaultProfile.id,
    nickname: profile && profile.nickname ? profile.nickname : defaultProfile.nickname,
    avatar: profile && profile.avatar_url ? buildUrl(profile.avatar_url) : defaultProfile.avatar
  }
}

async function fetchProfile() {
  await ensureToken()
  const profile = normalizeRemoteProfile(await get('/account/profile'))
  saveProfile(profile)
  return profile
}

async function updateRemoteProfile(profile) {
  await ensureToken()
  const remoteProfile = await patch('/account/profile', {
    nickname: profile.nickname,
    avatar_url: profile.avatarUrl || profile.avatar || ''
  })
  const normalized = normalizeRemoteProfile(remoteProfile)
  saveProfile(normalized)
  return normalized
}

async function uploadAvatar(filePath) {
  await ensureToken()

  const fileSystem = wx.getFileSystemManager()
  const data = fileSystem.readFileSync(filePath, 'base64')
  const lowerPath = `${filePath || ''}`.toLowerCase()
  const contentType = lowerPath.endsWith('.png')
    ? 'image/png'
    : lowerPath.endsWith('.webp')
    ? 'image/webp'
    : 'image/jpeg'

  const result = await post('/account/avatar', {
    filename: filePath.split('/').pop() || 'avatar.jpg',
    content_type: contentType,
    data
  })

  return result && result.avatar_url ? buildUrl(result.avatar_url) : ''
}

module.exports = {
  getProfile,
  saveProfile,
  fetchProfile,
  updateRemoteProfile,
  uploadAvatar
}
