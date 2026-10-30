// Table exports. No dependencies: Excel goes out as SpreadsheetML, PDF via the browser's own
// print-to-PDF, so nothing new has to be installed or kept up to date.
import { formatDate } from './format'

function download(filename, blob) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

const esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export function exportCSV(filename, header, rows) {
  const cell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const csv = [header, ...rows].map((r) => r.map(cell).join(',')).join('\r\n')
  // The BOM makes Excel open UTF-8 correctly (Kinyarwanda names, RWF, en dashes).
  download(`${filename}.csv`, new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }))
}

/** Excel 2003 SpreadsheetML: a real .xls workbook Excel and LibreOffice both open without warnings. */
export function exportExcel(filename, title, header, rows) {
  const row = (cells, type) => `<Row>${cells.map((c) => `<Cell${type ? ` ss:StyleID="${type}"` : ''}><Data ss:Type="String">${esc(c)}</Data></Cell>`).join('')}</Row>`
  const xml = `<?xml version="1.0"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="head"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#0B2B5B" ss:Pattern="Solid"/></Style>
 </Styles>
 <Worksheet ss:Name="${esc(title).slice(0, 31) || 'Export'}">
  <Table>${row(header, 'head')}${rows.map((r) => row(r)).join('')}</Table>
 </Worksheet>
</Workbook>`
  download(`${filename}.xls`, new Blob([xml], { type: 'application/vnd.ms-excel' }))
}

/**
 * Opens a clean, branded print sheet. The browser's print dialog saves it as PDF,
 * which is also exactly what someone wanting a paper copy needs.
 */
export function printTable(title, header, rows, { subtitle } = {}) {
  const win = window.open('', '_blank', 'width=1024,height=720')
  if (!win) {
    return false
  }
  win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>
    *{box-sizing:border-box}
    body{margin:32px;font:13px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;color:#15202b}
    header{display:flex;align-items:flex-end;justify-content:space-between;border-bottom:2px solid #0B2B5B;padding-bottom:12px;margin-bottom:18px}
    h1{margin:0;font-size:19px;color:#0B2B5B}
    .meta{font-size:11px;color:#5b6b7c;text-align:right}
    table{width:100%;border-collapse:collapse}
    th{background:#0B2B5B;color:#fff;font-size:11px;text-transform:uppercase;letter-spacing:.04em;text-align:left;padding:8px 10px}
    td{padding:7px 10px;border-bottom:1px solid #e4e9ef;vertical-align:top}
    tbody tr:nth-child(even){background:#f7f9fb}
    tfoot{font-size:11px;color:#5b6b7c}
    @page{margin:14mm}
    @media print{body{margin:0}thead{display:table-header-group}tr{page-break-inside:avoid}}
  </style></head><body>
    <header>
      <div><h1>Needibi Serve</h1><div style="font-size:14px;font-weight:600;margin-top:2px">${esc(title)}</div></div>
      <div class="meta">${esc(subtitle ?? '')}<br>${esc(formatDate(new Date()))} · ${rows.length} row${rows.length === 1 ? '' : 's'}</div>
    </header>
    <table><thead><tr>${header.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead>
    <tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>
  </body></html>`)
  win.document.close()
  win.focus()
  setTimeout(() => win.print(), 250)
  return true
}
