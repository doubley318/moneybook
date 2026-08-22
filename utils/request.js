const LOCAL_RECORDS_KEY = 'moneybook_local_records'
const LOCAL_FEEDBACK_KEY = 'moneybook_local_feedback'

function readStorage(key, fallback) {
  try {
    const value = wx.getStorageSync(key)
    return value || fallback
  } catch (error) {
    return fallback
  }
}

function writeStorage(key, value) {
  try {
    wx.setStorageSync(key, value)
  } catch (error) {}
}

function readLocalRecords() {
  const records = readStorage(LOCAL_RECORDS_KEY, [])
  return Array.isArray(records) ? records : []
}

function writeLocalRecords(records) {
  writeStorage(LOCAL_RECORDS_KEY, records)
}

function createLocalRecord(payload) {
  const now = Date.now()
  return {
    id: String(now),
    type_key: payload.type_key,
    value_class: payload.value_class,
    name: payload.name,
    scene: payload.scene,
    value: payload.value,
    full_date: payload.full_date,
    remark: payload.remark || '',
    estimated_value: payload.estimated_value || '',
    cost: payload.cost || '',
    images: Array.isArray(payload.images) ? payload.images : [],
    deleted_at: '',
    is_deleted: false,
    created_at: new Date(now).toISOString(),
    updated_at: new Date(now).toISOString()
  }
}

function updateLocalRecord(record, payload) {
  return {
    ...record,
    type_key: payload.type_key,
    value_class: payload.value_class,
    name: payload.name,
    scene: payload.scene,
    value: payload.value,
    full_date: payload.full_date,
    remark: payload.remark || '',
    estimated_value: payload.estimated_value || '',
    cost: payload.cost || '',
    images: Array.isArray(payload.images) ? payload.images : [],
    updated_at: new Date().toISOString()
  }
}

function parseRecordId(path, suffix) {
  const pattern = suffix
    ? new RegExp(`^/records/([^/]+)/${suffix}$`)
    : /^\/records\/([^/]+)$/
  const match = `${path || ''}`.match(pattern)
  return match ? decodeURIComponent(match[1]) : ''
}

function localRequest(method, path, data) {
  const records = readLocalRecords()

  if (method === 'GET' && path === '/records') {
    const includeDeleted = !!(data && data.include_deleted)
    return includeDeleted ? records : records.filter((record) => !record.is_deleted)
  }

  if (method === 'POST' && path === '/records') {
    const record = createLocalRecord(data || {})
    writeLocalRecords([record].concat(records))
    return record
  }

  if (method === 'PATCH') {
    const id = parseRecordId(path)
    const index = records.findIndex((record) => String(record.id) === id)
    if (index === -1) throw { statusCode: 404, message: '记录不存在' }

    const nextRecord = updateLocalRecord(records[index], data || {})
    records.splice(index, 1, nextRecord)
    writeLocalRecords(records)
    return nextRecord
  }

  if (method === 'DELETE') {
    const permanentId = parseRecordId(path, 'permanent')
    if (permanentId) {
      const nextRecords = records.filter((record) => String(record.id) !== permanentId)
      writeLocalRecords(nextRecords)
      return { ok: true }
    }

    const id = parseRecordId(path)
    const index = records.findIndex((record) => String(record.id) === id)
    if (index === -1) return { ok: true }

    records[index] = {
      ...records[index],
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    writeLocalRecords(records)
    return { ok: true }
  }

  if (method === 'POST') {
    const restoreId = parseRecordId(path, 'restore')
    if (restoreId) {
      const index = records.findIndex((record) => String(record.id) === restoreId)
      if (index !== -1) {
        records[index] = {
          ...records[index],
          is_deleted: false,
          deleted_at: '',
          updated_at: new Date().toISOString()
        }
        writeLocalRecords(records)
      }
      return { ok: true }
    }

    if (path === '/feedback') {
      const feedback = readStorage(LOCAL_FEEDBACK_KEY, [])
      const list = Array.isArray(feedback) ? feedback : []
      writeStorage(LOCAL_FEEDBACK_KEY, list.concat({
        ...(data || {}),
        id: String(Date.now()),
        created_at: new Date().toISOString()
      }))
      return { ok: true }
    }
  }

  throw { statusCode: 404, message: '本地接口不存在' }
}

function request(method, path, data) {
  return Promise.resolve().then(() => localRequest(method, path, data))
}

module.exports = {
  get: (path, params) => request('GET', path, params),
  post: (path, data) => request('POST', path, data),
  patch: (path, data) => request('PATCH', path, data),
  del: (path) => request('DELETE', path)
}
