/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Generates an auto-incrementing, non-colliding expense code in the format:
 * EXP-YYYYMM-XXX (e.g. EXP-202610-029)
 *
 * @param dateString Date in 'YYYY-MM-DD' format (or any ISO string)
 * @param existingExpenses List of existing expenses with `maChiPhi`
 * @param excludeExpenseId Optional ID/code to exclude if editing
 */
export function generateNextExpenseCode(
  dateString: string,
  existingExpenses: Array<{ maChiPhi: string }>,
  excludeCode?: string
): string {
  let yearMonth = '';
  if (dateString) {
    const parts = dateString.split('-');
    if (parts.length >= 2) {
      const yyyy = parts[0].padStart(4, '0');
      const mm = parts[1].padStart(2, '0');
      yearMonth = `${yyyy}${mm}`;
    }
  }

  // Fallback if date is invalid or empty
  if (!yearMonth) {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    yearMonth = `${yyyy}${mm}`;
  }

  const prefix = `EXP-${yearMonth}-`;
  let maxSeq = 0;

  existingExpenses.forEach(item => {
    if (!item.maChiPhi) return;
    if (excludeCode && item.maChiPhi === excludeCode) return;

    if (item.maChiPhi.startsWith(prefix)) {
      const suffix = item.maChiPhi.substring(prefix.length);
      const num = parseInt(suffix, 10);
      if (!isNaN(num) && num > maxSeq) {
        maxSeq = num;
      }
    }
  });

  let nextSeq = maxSeq + 1;
  let candidate = `${prefix}${String(nextSeq).padStart(3, '0')}`;

  // Strict collision check: guarantee uniqueness
  while (
    existingExpenses.some(
      e => e.maChiPhi === candidate && (!excludeCode || e.maChiPhi !== excludeCode)
    )
  ) {
    nextSeq += 1;
    candidate = `${prefix}${String(nextSeq).padStart(3, '0')}`;
  }

  return candidate;
}
