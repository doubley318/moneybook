const { fetchRecords, loadCachedRecords, records } = require('../data/records')

const csvHeaders = [
  '记录ID',
  '类型',
  '方向',
  '姓名',
  '日期',
  '事由',
  '金额/内容',
  '礼物估值',
  '请客花费',
  '备注',
  '图片数量',
  '图片地址'
]

function pad(value) {
  return `${value}`.padStart(2, '0')
}

function todayKey() {
  const now = new Date()
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

function escapeCsvCell(value) {
  const text = `${value == null ? '' : value}`.replace(/\r?\n/g, ' ')
  if (!/[",\n\r]/.test(text)) return text
  return `"${text.replace(/"/g, '""')}"`
}

function getDirection(record) {
  return record.valueClass === 'expense' ? '送出' : '收到'
}

function recordToRow(record) {
  const images = Array.isArray(record.images) ? record.images : []
  return [
    record.id,
    record.type || record.typeKey,
    getDirection(record),
    record.name,
    record.fullDate || record.fullDateText,
    record.scene,
    record.value,
    record.estimatedValue,
    record.cost,
    record.remark,
    images.length,
    images.join(' ')
  ]
}

function buildRecordsCsv(sourceRecords) {
  const lines = [
    csvHeaders,
    ...sourceRecords.map(recordToRow)
  ]

  return `\ufeff${lines.map((row) => row.map(escapeCsvCell).join(',')).join('\n')}`
}

async function getExportRecords() {
  loadCachedRecords()
  await fetchRecords()
  return records.slice().sort((left, right) => {
    const leftDate = left.fullDate || ''
    const rightDate = right.fullDate || ''
    if (leftDate === rightDate) return String(right.id).localeCompare(String(left.id))
    return rightDate.localeCompare(leftDate)
  })
}

async function createRecordsCsvFile() {
  const exportRecords = await getExportRecords()
  if (!exportRecords.length) {
    throw new Error('暂无可导出的数据')
  }

  const fileName = `moneybook-records-${todayKey()}.csv`
  const filePath = `${wx.env.USER_DATA_PATH}/${fileName}`
  const csvContent = buildRecordsCsv(exportRecords)

  wx.getFileSystemManager().writeFileSync(filePath, csvContent, 'utf8')

  return {
    fileName,
    filePath,
    recordCount: exportRecords.length
  }
}

module.exports = {
  buildRecordsCsv,
  createRecordsCsvFile
}
