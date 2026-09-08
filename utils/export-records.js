const { fetchRecords, loadCachedRecords, records } = require('../data/records')

const sheetConfigs = [
  {
    name: '礼金',
    typeKey: 'cash',
    headers: ['序号', '姓名', '来往', '日期', '金额', '事由', '备注'],
    toRow: (record, index) => [
      index + 1,
      record.name,
      getDirection(record),
      getRecordDate(record),
      colorValueCell(record),
      record.scene,
      record.remark
    ]
  },
  {
    name: '礼物',
    typeKey: 'gift',
    headers: ['序号', '姓名', '来往', '日期', '礼物', '事由', '预估值', '备注'],
    toRow: (record, index) => [
      index + 1,
      record.name,
      getDirection(record),
      getRecordDate(record),
      colorValueCell(record),
      record.scene,
      record.estimatedValue,
      record.remark
    ]
  },
  {
    name: '请客',
    typeKey: 'meal',
    headers: ['序号', '姓名', '来往', '日期', '请客', '事由', '消费金额', '备注'],
    toRow: (record, index) => [
      index + 1,
      record.name,
      getDirection(record),
      getRecordDate(record),
      colorValueCell(record),
      record.scene,
      record.cost,
      record.remark
    ]
  }
]

const CRC_TABLE = makeCrcTable()

function pad(value) {
  return `${value}`.padStart(2, '0')
}

function todayKey() {
  const now = new Date()
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

function getDirection(record) {
  return record.valueClass === 'expense' ? '送出' : '收到'
}

function getRecordDate(record) {
  return record.fullDate || record.fullDateText || ''
}

function colorValueCell(record) {
  return {
    value: record.value,
    style: record.valueClass === 'expense' ? 2 : 3
  }
}

function getCellValue(cell) {
  return cell && typeof cell === 'object' && Object.prototype.hasOwnProperty.call(cell, 'value')
    ? cell.value
    : cell
}

function getCellStyle(cell, isHeader) {
  if (isHeader) return 1
  return cell && typeof cell === 'object' && cell.style ? cell.style : 0
}

function escapeXml(value) {
  return `${value == null ? '' : value}`
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function columnName(index) {
  let value = index + 1
  let name = ''

  while (value > 0) {
    const remainder = (value - 1) % 26
    name = String.fromCharCode(65 + remainder) + name
    value = Math.floor((value - 1) / 26)
  }

  return name
}

function buildCell(value, rowIndex, columnIndex, isHeader) {
  const cellRef = `${columnName(columnIndex)}${rowIndex + 1}`
  const style = ` s="${getCellStyle(value, isHeader)}"`
  return `<c r="${cellRef}" t="inlineStr"${style}><is><t>${escapeXml(getCellValue(value))}</t></is></c>`
}

function buildWorksheetXml(rows) {
  const sheetRows = rows.map((row, rowIndex) => {
    const cells = row.map((value, columnIndex) => buildCell(value, rowIndex, columnIndex, rowIndex === 0))
    return `<row r="${rowIndex + 1}">${cells.join('')}</row>`
  })

  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">',
    '<cols>',
    '<col min="1" max="1" width="8" customWidth="1"/>',
    '<col min="2" max="4" width="14" customWidth="1"/>',
    '<col min="5" max="8" width="18" customWidth="1"/>',
    '</cols>',
    `<sheetData>${sheetRows.join('')}</sheetData>`,
    '</worksheet>'
  ].join('')
}

function buildWorkbookXml() {
  const sheets = sheetConfigs.map((sheet, index) => (
    `<sheet name="${escapeXml(sheet.name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`
  ))

  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">',
    `<sheets>${sheets.join('')}</sheets>`,
    '</workbook>'
  ].join('')
}

function buildWorkbookRelsXml() {
  const worksheetRels = sheetConfigs.map((sheet, index) => (
    `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`
  ))

  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
    worksheetRels.join(''),
    `<Relationship Id="rId${sheetConfigs.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>`,
    '</Relationships>'
  ].join('')
}

function buildContentTypesXml() {
  const worksheetOverrides = sheetConfigs.map((sheet, index) => (
    `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
  ))

  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">',
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>',
    '<Default Extension="xml" ContentType="application/xml"/>',
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>',
    '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>',
    worksheetOverrides.join(''),
    '</Types>'
  ].join('')
}

function buildRootRelsXml() {
  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>',
    '</Relationships>'
  ].join('')
}

function buildStylesXml() {
  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">',
    '<fonts count="4">',
    '<font><sz val="11"/><name val="Calibri"/></font>',
    '<font><b/><sz val="11"/><name val="Calibri"/></font>',
    '<font><sz val="11"/><color rgb="FFB83232"/><name val="Calibri"/></font>',
    '<font><sz val="11"/><color rgb="FF2F855A"/><name val="Calibri"/></font>',
    '</fonts>',
    '<fills count="3">',
    '<fill><patternFill patternType="none"/></fill>',
    '<fill><patternFill patternType="gray125"/></fill>',
    '<fill><patternFill patternType="solid"><fgColor rgb="FFEDEDED"/><bgColor indexed="64"/></patternFill></fill>',
    '</fills>',
    '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>',
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>',
    '<cellXfs count="4">',
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>',
    '<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>',
    '<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>',
    '<xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>',
    '</cellXfs>',
    '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>',
    '<dxfs count="0"/>',
    '<tableStyles count="0" defaultTableStyle="TableStyleMedium2" defaultPivotStyle="PivotStyleLight16"/>',
    '</styleSheet>'
  ].join('')
}

function buildWorkbookFiles(sourceRecords) {
  const files = {
    '[Content_Types].xml': buildContentTypesXml(),
    '_rels/.rels': buildRootRelsXml(),
    'xl/workbook.xml': buildWorkbookXml(),
    'xl/_rels/workbook.xml.rels': buildWorkbookRelsXml(),
    'xl/styles.xml': buildStylesXml()
  }

  sheetConfigs.forEach((sheet, index) => {
    const sheetRecords = sourceRecords.filter((record) => record.typeKey === sheet.typeKey || record.type === sheet.name)
    const rows = [
      sheet.headers,
      ...sheetRecords.map(sheet.toRow)
    ]
    files[`xl/worksheets/sheet${index + 1}.xml`] = buildWorksheetXml(rows)
  })

  return files
}

function makeCrcTable() {
  const table = []

  for (let i = 0; i < 256; i += 1) {
    let crc = i
    for (let j = 0; j < 8; j += 1) {
      crc = (crc & 1) ? (0xedb88320 ^ (crc >>> 1)) : (crc >>> 1)
    }
    table[i] = crc >>> 0
  }

  return table
}

function crc32(bytes) {
  let crc = 0xffffffff

  for (let i = 0; i < bytes.length; i += 1) {
    crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8)
  }

  return (crc ^ 0xffffffff) >>> 0
}

function encodeUtf8(text) {
  const bytes = []
  const value = `${text == null ? '' : text}`

  for (let i = 0; i < value.length; i += 1) {
    let codePoint = value.charCodeAt(i)

    if (codePoint >= 0xd800 && codePoint <= 0xdbff && i + 1 < value.length) {
      const next = value.charCodeAt(i + 1)
      if (next >= 0xdc00 && next <= 0xdfff) {
        codePoint = 0x10000 + ((codePoint - 0xd800) << 10) + (next - 0xdc00)
        i += 1
      }
    }

    if (codePoint < 0x80) {
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      bytes.push(0xc0 | (codePoint >> 6), 0x80 | (codePoint & 0x3f))
    } else if (codePoint < 0x10000) {
      bytes.push(0xe0 | (codePoint >> 12), 0x80 | ((codePoint >> 6) & 0x3f), 0x80 | (codePoint & 0x3f))
    } else {
      bytes.push(0xf0 | (codePoint >> 18), 0x80 | ((codePoint >> 12) & 0x3f), 0x80 | ((codePoint >> 6) & 0x3f), 0x80 | (codePoint & 0x3f))
    }
  }

  return bytes
}

function pushUint16(bytes, value) {
  bytes.push(value & 0xff, (value >>> 8) & 0xff)
}

function pushUint32(bytes, value) {
  bytes.push(value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff)
}

function concatBytes(parts) {
  const totalLength = parts.reduce((sum, part) => sum + part.length, 0)
  const result = new Uint8Array(totalLength)
  let offset = 0

  parts.forEach((part) => {
    result.set(part, offset)
    offset += part.length
  })

  return result
}

function toUint8Array(bytes) {
  return bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
}

function makeLocalFileHeader(nameBytes, contentBytes, crc) {
  const bytes = []
  pushUint32(bytes, 0x04034b50)
  pushUint16(bytes, 20)
  pushUint16(bytes, 0x0800)
  pushUint16(bytes, 0)
  pushUint16(bytes, 0)
  pushUint16(bytes, 0)
  pushUint32(bytes, crc)
  pushUint32(bytes, contentBytes.length)
  pushUint32(bytes, contentBytes.length)
  pushUint16(bytes, nameBytes.length)
  pushUint16(bytes, 0)
  return toUint8Array(bytes)
}

function makeCentralDirectoryHeader(nameBytes, contentBytes, crc, offset) {
  const bytes = []
  pushUint32(bytes, 0x02014b50)
  pushUint16(bytes, 20)
  pushUint16(bytes, 20)
  pushUint16(bytes, 0x0800)
  pushUint16(bytes, 0)
  pushUint16(bytes, 0)
  pushUint16(bytes, 0)
  pushUint32(bytes, crc)
  pushUint32(bytes, contentBytes.length)
  pushUint32(bytes, contentBytes.length)
  pushUint16(bytes, nameBytes.length)
  pushUint16(bytes, 0)
  pushUint16(bytes, 0)
  pushUint16(bytes, 0)
  pushUint16(bytes, 0)
  pushUint32(bytes, 0)
  pushUint32(bytes, offset)
  return toUint8Array(bytes)
}

function makeEndOfCentralDirectory(fileCount, centralDirectorySize, centralDirectoryOffset) {
  const bytes = []
  pushUint32(bytes, 0x06054b50)
  pushUint16(bytes, 0)
  pushUint16(bytes, 0)
  pushUint16(bytes, fileCount)
  pushUint16(bytes, fileCount)
  pushUint32(bytes, centralDirectorySize)
  pushUint32(bytes, centralDirectoryOffset)
  pushUint16(bytes, 0)
  return toUint8Array(bytes)
}

function createZip(files) {
  const localParts = []
  const centralParts = []
  let offset = 0

  Object.keys(files).forEach((fileName) => {
    const nameBytes = toUint8Array(encodeUtf8(fileName))
    const contentBytes = toUint8Array(encodeUtf8(files[fileName]))
    const crc = crc32(contentBytes)
    const localHeader = makeLocalFileHeader(nameBytes, contentBytes, crc)
    const centralHeader = makeCentralDirectoryHeader(nameBytes, contentBytes, crc, offset)

    localParts.push(localHeader, nameBytes, contentBytes)
    centralParts.push(centralHeader, nameBytes)
    offset += localHeader.length + nameBytes.length + contentBytes.length
  })

  const centralDirectoryOffset = offset
  const centralDirectory = concatBytes(centralParts)
  const end = makeEndOfCentralDirectory(Object.keys(files).length, centralDirectory.length, centralDirectoryOffset)
  const zipBytes = concatBytes([...localParts, centralDirectory, end])

  return zipBytes.buffer
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

async function createRecordsWorkbookFile() {
  const exportRecords = await getExportRecords()
  if (!exportRecords.length) {
    throw new Error('暂无可导出的数据')
  }

  const fileName = `随礼日记 ${todayKey()}.xlsx`
  const filePath = `${wx.env.USER_DATA_PATH}/${fileName}`
  const workbookContent = createZip(buildWorkbookFiles(exportRecords))

  wx.getFileSystemManager().writeFileSync(filePath, workbookContent)

  return {
    fileName,
    filePath,
    recordCount: exportRecords.length
  }
}

module.exports = {
  createRecordsWorkbookFile
}
