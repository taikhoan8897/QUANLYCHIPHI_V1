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

import * as XLSX from 'xlsx';

/**
 * Exports tabular data as a genuine modern Microsoft Excel spreadsheet (.xlsx)
 * with full Vietnamese Unicode support and clean column widths.
 */
export function exportToExcelTable(
  filename: string,
  title: string,
  headers: string[],
  rows: (string | number)[][]
): void {
  const wsData: (string | number)[][] = [
    [title],
    [`Ngày xuất: ${new Date().toLocaleDateString('vi-VN')} ${new Date().toLocaleTimeString('vi-VN')}`],
    [],
    headers,
    ...rows,
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Auto calculate reasonable column widths
  const colWidths = headers.map((h, colIdx) => {
    let maxLen = h.length;
    rows.forEach(r => {
      const cellVal = r[colIdx];
      if (cellVal !== undefined && cellVal !== null) {
        const len = String(cellVal).length;
        if (len > maxLen) maxLen = len;
      }
    });
    return { wch: Math.min(Math.max(maxLen + 3, 10), 60) };
  });
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Báo Cáo Chi Phí');

  XLSX.writeFile(wb, `${filename}.xlsx`, { bookType: 'xlsx' });
}
