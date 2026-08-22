const { pinyin } = require('./vendor/pinyin-pro')

const fallbackInitial = '#'

function getNameInitial(name) {
  const first = `${name || ''}`.trim().charAt(0)
  if (!first) return fallbackInitial
  if (/^[a-z]$/i.test(first)) return first.toUpperCase()
  if (!/^[\u4e00-\u9fff]$/.test(first)) return fallbackInitial

  const result = pinyin(first, {
    pattern: 'first',
    toneType: 'none',
    type: 'array'
  })
  const initial = Array.isArray(result) ? result[0] : result
  const letter = `${initial || ''}`.charAt(0).toUpperCase()

  return /^[A-Z]$/.test(letter) ? letter : fallbackInitial
}

module.exports = {
  getNameInitial,
  fallbackInitial
}
