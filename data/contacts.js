const { patch } = require('../utils/request')
const { ensureToken } = require('../utils/auth')
const { records, updateRecordNamesForContact } = require('./records')
const { getNameInitial, fallbackInitial } = require('../utils/pinyin')

const groupOrder = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#'.split('')
const fallbackGroupLetter = fallbackInitial

function contactIdFromName(name) {
  const normalized = `${name || ''}`.trim()
  return encodeURIComponent(normalized || 'unknown')
}

function contactIdFromRecord(record) {
  return record && record.contactId ? String(record.contactId) : contactIdFromName(record && (record.rawName || record.name))
}

function isBackendContactId(id) {
  return /^\d+$/.test(`${id || ''}`)
}

function isUnauthorizedError(error) {
  return error && (error.statusCode === 401 || error.statusCode === 403)
}

async function requestWithAuthRetry(requester) {
  await ensureToken()

  try {
    return await requester()
  } catch (error) {
    if (!isUnauthorizedError(error)) throw error

    await ensureToken(true)
    return requester()
  }
}

function compareGroupLetter(left, right) {
  const fallbackIndex = groupOrder.indexOf(fallbackGroupLetter)
  const leftIndex = groupOrder.indexOf(left)
  const rightIndex = groupOrder.indexOf(right)
  return (leftIndex === -1 ? fallbackIndex : leftIndex) - (rightIndex === -1 ? fallbackIndex : rightIndex)
}

function amountOf(record) {
  const value = Number.parseFloat(record.value)
  return Number.isNaN(value) ? 0 : value
}

function pad(value) {
  return `${value}`.padStart(2, '0')
}

function formatFullDate(fullDate) {
  const [year, month = '01', day = '01'] = `${fullDate || ''}`.split('-')
  return year ? `${year}.${Number(month)}.${Number(day)}` : ''
}

function createEmptyTotal() {
  return {
    cashIn: 0,
    cashOut: 0,
    giftIn: 0,
    giftOut: 0,
    mealIn: 0,
    mealOut: 0
  }
}

function toContactRecord(record) {
  return {
    id: record.id,
    type: record.type,
    typeKey: record.typeKey,
    direction: record.valueClass === 'expense' ? 'send' : 'receive',
    scene: record.scene,
    date: formatFullDate(record.fullDate),
    fullDate: record.fullDate,
    value: record.value,
    remark: record.remark || '',
    estimatedValue: record.estimatedValue || '',
    cost: record.cost || '',
    images: Array.isArray(record.images) ? record.images : []
  }
}

function resolveContactDisplayName(contact) {
  const rawName = contact.rawName
  const displayNames = contact.displayNames.filter(Boolean)

  if (!displayNames.length || displayNames.includes(rawName)) return rawName
  return displayNames[0]
}

function buildContacts() {
  const contactMap = {}

  records.forEach((record) => {
    const rawName = `${record.rawName || record.name || ''}`.trim()
    if (!rawName) return

    const id = contactIdFromRecord(record)
    const displayName = record.name || rawName

    if (!contactMap[id]) {
      contactMap[id] = {
        id,
        rawName,
        name: rawName,
        displayNames: [],
        count: 0,
        amount: 0,
        total: createEmptyTotal(),
        records: []
      }
    }

    const contact = contactMap[id]
    const direction = record.valueClass === 'expense' ? 'send' : 'receive'
    contact.displayNames.push(displayName)
    contact.count += 1
    contact.records.push(toContactRecord(record))

    if (record.typeKey === 'cash') {
      const amount = Math.abs(amountOf(record))
      contact.amount += amount
      if (direction === 'send') {
        contact.total.cashOut += amount
      } else {
        contact.total.cashIn += amount
      }
    } else if (record.typeKey === 'gift') {
      if (direction === 'send') {
        contact.total.giftOut += 1
      } else {
        contact.total.giftIn += 1
      }
    } else if (record.typeKey === 'meal') {
      if (direction === 'send') {
        contact.total.mealOut += 1
      } else {
        contact.total.mealIn += 1
      }
    }
  })

  return Object.values(contactMap)
    .map((contact) => ({
      ...contact,
      name: resolveContactDisplayName(contact),
      displayNames: undefined,
      amount: Math.round(contact.amount),
      records: contact.records.sort((left, right) => `${right.fullDate}`.localeCompare(`${left.fullDate}`))
    }))
    .sort((left, right) => left.name.localeCompare(right.name, 'zh-Hans-CN'))
}

function getContacts() {
  return buildContacts()
}

function getContactGroups() {
  const groups = []

  getContacts().forEach((contact) => {
    const letter = getNameInitial(contact.name)
    let group = groups.find((item) => item.letter === letter)
    if (!group) {
      group = {
        letter,
        contacts: []
      }
      groups.push(group)
    }
    group.contacts.push(contact)
  })

  return groups.sort((left, right) => {
    return compareGroupLetter(left.letter, right.letter)
  })
}

function getContactDetail(id) {
  return getContacts().find((contact) => contact.id === id) || null
}

async function updateContactName(id, name) {
  const nextName = `${name || ''}`.trim()
  if (!id || !nextName) return null

  if (isBackendContactId(id)) {
    await requestWithAuthRetry(() => patch(`/contacts/${id}`, {
      display_name: nextName
    }))
  }

  updateRecordNamesForContact(id, nextName)

  return getContactDetail(id)
}

function getContactRecordById(id) {
  for (const contact of getContacts()) {
    const record = contact.records.find((item) => item.id === id)
    if (!record) continue

    const [year, month, day] = `${record.fullDate || ''}`.split('-')
    const typeAmountLabels = {
      cash: record.direction === 'send' ? '送礼金额' : '收礼金额',
      gift: '礼物',
      meal: '请客'
    }

    return {
      ...record,
      name: contact.name,
      fullDate: record.fullDate,
      date: `${Number(month)}.${Number(day)}`,
      dateLabel: `${Number(month)}.${Number(day)}`,
      fullDateText: formatFullDate(record.fullDate),
      year,
      valueClass: record.direction === 'send' ? 'expense' : 'income',
      amountLabel: typeAmountLabels[record.typeKey] || '内容',
      remark: record.remark || ''
    }
  }

  return null
}

module.exports = {
  getContactGroups,
  getContacts,
  getContactDetail,
  getContactRecordById,
  updateContactName
}
