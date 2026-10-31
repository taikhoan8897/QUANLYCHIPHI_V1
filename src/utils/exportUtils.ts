/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(amount) + ' đ';
}

export function formatNumberOnly(amount: number): string {
  if (amount === 0) return '0 đ';
  return new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: 0,
  }).format(amount) + ' đ';
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  try {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  } catch {
    return dateString;
  }
}

/**
 * Downloads data as a CSV file encoded in UTF-8 with BOM (\uFEFF)
 * so Microsoft Excel automatically recognizes Vietnamese accents.
 */
export function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]): void {
  const processCell = (cell: string | number) => {
    let str = cell === null || cell === undefined ? '' : String(cell);
    str = str.replace(/"/g, '""');
    if (str.search(/("|,|\n)/g) >= 0 || str.includes(';')) {
      str = `"${str}"`;
    }
    return str;
  };

  const csvContent =
    '\uFEFF' +
    [
      headers.map(processCell).join(','),
      ...rows.map(row => row.map(processCell).join(',')),
    ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports tabular data as an Excel XML spreadsheet file (.xls)
 * which Excel opens natively with styles and headers intact.
 */
export function exportToExcelTable(filename: string, title: string, headers: string[], rows: (string | number)[][]): void {
  const headerHtml = headers.map(h => `<th style="background:#003366;color:#ffffff;border:1px solid #cccccc;padding:8px;font-weight:bold;">${h}</th>`).join('');
  const rowsHtml = rows
    .map(
      (row, idx) =>
        `<tr style="background:${idx % 2 === 0 ? '#ffffff' : '#f9f9f9'}">` +
        row.map(cell => `<td style="border:1px solid #cccccc;padding:6px;${typeof cell === 'number' ? 'text-align:right;' : ''}">${cell}</td>`).join('') +
        `</tr>`
    )
    .join('');

  const template = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>BaoCao</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
        <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
      </head>
      <body>
        <h2 style="font-family: Arial, sans-serif; color: #003366;">${title}</h2>
        <p style="font-family: Arial, sans-serif; font-size: 12px; color: #666;">Ngày xuất: ${new Date().toLocaleDateString('vi-VN')} ${new Date().toLocaleTimeString('vi-VN')}</p>
        <table border="1" style="border-collapse:collapse;font-family:Arial, sans-serif;font-size:13px;">
          <thead><tr>${headerHtml}</tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </body>
    </html>
  `;

  const blob = new Blob(['\uFEFF' + template], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
