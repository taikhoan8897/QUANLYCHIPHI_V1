/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useExpense } from '../context/ExpenseContext';
import { formatVND } from '../utils/exportUtils';
import {
  MonthlyBarChart,
  UnitMonthlyGroupedChart,
  CategoryPieChart,
  TopSuppliersChart,
} from '../components/charts/ExpenseCharts';
import {
  Calendar,
  Layers,
  Building,
  Briefcase,
  TrendingUp,
  FileSpreadsheet,
  Printer,
  CreditCard,
  SlidersHorizontal,
} from 'lucide-react';
import { THACO_COLORS } from '../theme/thacoBrand';

// Unit brand colors for chart lines & bars
const UNIT_COLORS: Record<string, string> = {
  DV01: '#00692B', // THACO AGRI (Primary Forest Green)
  DV02: '#82C341', // HNG (Light Fresh Green)
  DV03: '#d48806', // THAGRICO (Warm Amber)
  DV04: '#389e0d', // VPĐH Pleiku (Medium Green)
  DV05: '#08979c', // VP Sadora (Teal Green)
};

const GROUP_COLORS: Record<string, string> = {
  '3002-001': '#00692B', // Thiết bị điện tử
  '3002-002': '#82C341', // Điện gia dụng
  '3002-003': '#389e0d', // Tin học
  '3002-004': '#d48806', // Nội thất
  '3002-005': '#faad14', // VPP vật tư
  '4003-001': '#08979c', // Phương tiện vận tải
  'C04': '#005422',      // Chi phí VP
  'C02': '#5b8c00',      // Giao tế
};

export const DashboardPage: React.FC = () => {
  const { expenses, units, costGroups, suppliers } = useExpense();

  const [selectedMonth, setSelectedMonth] = useState<number>(10);
  const [selectedYear, setSelectedYear] = useState<number>(2026);

  // Period scope for Section 3 table to prevent horizontal scrolling
  const [unitTablePeriod, setUnitTablePeriod] = useState<'q4' | 'all' | 'm10'>('q4');
  const [unitTableUnit, setUnitTableUnit] = useState<'vnd' | 'million'>('vnd');

  // Active months for unit table
  const unitActiveMonths = useMemo(() => {
    if (unitTablePeriod === 'm10') return [10];
    if (unitTablePeriod === 'q4') return [10, 11, 12];
    return Array.from({ length: 12 }, (_, i) => i + 1);
  }, [unitTablePeriod]);

  const formatUnitCell = (amt: number): string => {
    if (amt === 0) return '-';
    if (unitTableUnit === 'million') {
      const m = amt / 1000000;
      return `${m.toFixed(m % 1 === 0 ? 0 : 1)} tr`;
    }
    return formatVND(amt);
  };

  // 1. Current Month KPI (CHI PHÍ THÁNG HIỆN TẠI)
  const currentMonthExpenses = useMemo(() => {
    return expenses.filter(item => {
      const parts = item.ngayPhatSinh.split('-');
      const y = Number(parts[0]);
      const m = Number(parts[1]);
      return y === selectedYear && m === selectedMonth;
    });
  }, [expenses, selectedYear, selectedMonth]);

  const currentMonthTotal = useMemo(() => {
    return currentMonthExpenses.reduce((sum, item) => sum + item.soTien, 0);
  }, [currentMonthExpenses]);

  // 2. BẢNG TỔNG HỢP THEO KỲ (12 Tháng)
  const monthlySummary = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const monthNum = i + 1;
      const monthExpenses = expenses.filter(item => {
        const parts = item.ngayPhatSinh.split('-');
        return Number(parts[0]) === selectedYear && Number(parts[1]) === monthNum;
      });
      const amount = monthExpenses.reduce((sum, item) => sum + item.soTien, 0);
      return {
        month: monthNum,
        label: `Tháng ${monthNum < 10 ? `0${monthNum}` : monthNum}`,
        amount,
        count: monthExpenses.length,
      };
    });
  }, [expenses, selectedYear]);

  const yearTotalAmount = useMemo(() => {
    return monthlySummary.reduce((sum, item) => sum + item.amount, 0);
  }, [monthlySummary]);

  // 3. Matrix theo Đơn vị kết hợp kỳ (tháng)
  const unitMatrix = useMemo(() => {
    const matrix: Record<string, Record<number, number>> = {};
    const unitTotals: Record<string, number> = {};

    units.forEach(u => {
      matrix[u.maDonVi] = {};
      unitTotals[u.maDonVi] = 0;
      for (let m = 1; m <= 12; m++) {
        matrix[u.maDonVi][m] = 0;
      }
    });

    expenses.forEach(item => {
      const parts = item.ngayPhatSinh.split('-');
      const y = Number(parts[0]);
      const m = Number(parts[1]);
      if (y === selectedYear && matrix[item.maDonVi]) {
        matrix[item.maDonVi][m] = (matrix[item.maDonVi][m] || 0) + item.soTien;
        unitTotals[item.maDonVi] = (unitTotals[item.maDonVi] || 0) + item.soTien;
      }
    });

    return { matrix, unitTotals };
  }, [expenses, units, selectedYear]);

  // 4. Tổng chi phí theo nhóm hàng hóa/dịch vụ (cho tháng đang chọn)
  const categorySummaryForMonth = useMemo(() => {
    const groupAmounts: Record<string, { amount: number; count: number }> = {};

    costGroups.forEach(g => {
      groupAmounts[g.maNhom] = { amount: 0, count: 0 };
    });

    currentMonthExpenses.forEach(item => {
      let matchedGroup = costGroups.find(g => item.maDanhMucChiPhi.startsWith(g.maNhom));
      if (!matchedGroup) matchedGroup = costGroups[0];
      if (matchedGroup) {
        if (!groupAmounts[matchedGroup.maNhom]) {
          groupAmounts[matchedGroup.maNhom] = { amount: 0, count: 0 };
        }
        groupAmounts[matchedGroup.maNhom].amount += item.soTien;
        groupAmounts[matchedGroup.maNhom].count += 1;
      }
    });

    return costGroups.map(g => ({
      maNhom: g.maNhom,
      tenNhom: g.tenNhom,
      amount: groupAmounts[g.maNhom]?.amount || 0,
      count: groupAmounts[g.maNhom]?.count || 0,
      color: GROUP_COLORS[g.maNhom] || '#8c8c8c',
    }));
  }, [currentMonthExpenses, costGroups]);

  // 5. Chi phí theo nhà cung cấp (TOP NHÀ CUNG CẤP & Biểu đồ)
  const topSuppliersData = useMemo(() => {
    const map: Record<string, { maNCC: string; tenNCC: string; amount: number; count: number }> = {};

    suppliers.forEach(s => {
      map[s.maNCC] = { maNCC: s.maNCC, tenNCC: s.tenNCC, amount: 0, count: 0 };
    });

    expenses.forEach(item => {
      if (!map[item.maNCC]) {
        map[item.maNCC] = {
          maNCC: item.maNCC,
          tenNCC: item.tenNCC,
          amount: 0,
          count: 0,
        };
      }
      map[item.maNCC].amount += item.soTien;
      map[item.maNCC].count += 1;
    });

    return Object.values(map)
      .filter(s => s.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [expenses, suppliers]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-8">
      {/* Title & Period Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-emerald-900/10 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-[#00692B] text-lg uppercase tracking-wide">
              THACO AGRI
            </span>
            <span className="text-slate-300">|</span>
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-tight">
              Dashboard Quản Trị Chi Phí
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tổng hợp dữ liệu chi phí đa chiều theo kỳ (tháng), pháp nhân chịu chi phí, nhóm danh mục và đối tác
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded px-3 py-1.5 text-xs">
            <Calendar className="w-3.5 h-3.5 text-[#00692B]" />
            <span className="font-semibold text-slate-700">Năm tài chính:</span>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              className="bg-transparent font-mono font-bold text-[#00692B] focus:outline-none"
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
            </select>
          </div>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded transition-colors shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>In Dashboard</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: CHI PHÍ THÁNG HIỆN TẠI (Page 2 Replica with THACO Green) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#00692B] uppercase tracking-wider flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00692B]"></span>
            1. Chi phí tháng hiện tại (Tháng {selectedMonth < 10 ? `0${selectedMonth}` : selectedMonth})
          </h3>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-600 font-semibold">Chọn tháng xem nhanh:</label>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(Number(e.target.value))}
              className="text-xs bg-white border border-slate-300 rounded px-2.5 py-1 text-slate-800 font-bold focus:ring-1 focus:ring-[#00692B]"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>
                  Tháng {m < 10 ? `0${m}` : m} {m === 10 ? '(Mặc định PDF)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* THACO AGRI Dashboard Box */}
        <div className="max-w-md bg-white border border-[#82C341]/60 rounded-xl shadow-xs overflow-hidden">
          <div className="bg-[#00692B] text-[#FFFCD5] text-center py-2.5 px-4 font-extrabold text-xs uppercase tracking-wider border-b border-[#82C341]/40">
            DASHBOARD CHI PHÍ · THACO AGRI
          </div>
          <div className="grid grid-cols-2 divide-x divide-slate-200 p-5 text-center bg-gradient-to-b from-[#FFFCD5]/30 to-white">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tổng chi phí</span>
              <div className="text-xl sm:text-2xl font-black font-mono text-[#00692B] mt-1 tabular-nums">
                {formatVND(currentMonthTotal)}
              </div>
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Số giao dịch</span>
              <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 mt-1">
                {currentMonthExpenses.length} khoản
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: BẢNG TỔNG HỢP THEO KỲ & BIỂU ĐỒ CỘT CÁC THÁNG (Page 2) */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-[#00692B] uppercase tracking-wider flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00692B]"></span>
          2. Tổng hợp chi phí theo kỳ (12 Tháng) & Biểu đồ cột
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* BẢNG TỔNG HỢP THEO KỲ */}
          <div className="lg:col-span-5 bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
            <div className="bg-[#00692B] text-[#FFFCD5] px-4 py-2.5 font-bold text-xs uppercase tracking-wider flex items-center justify-between">
              <span>Bảng Tổng Hợp Theo Kỳ</span>
              <span className="text-[10px] text-emerald-100 font-mono">12 Tháng</span>
            </div>
            <table className="w-full text-xs text-slate-700 border-collapse">
              <thead className="bg-slate-100 text-slate-800 font-semibold text-[11px]">
                <tr>
                  <th className="py-2 px-3 text-center w-12 border-r border-slate-200">Tháng</th>
                  <th className="py-2 px-3 text-left border-r border-slate-200">Kỳ báo cáo</th>
                  <th className="py-2 px-3 text-right">Tổng chi phí (VNĐ)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {monthlySummary.map(row => (
                  <tr
                    key={row.month}
                    className={`hover:bg-emerald-50/50 transition-colors ${
                      row.month === selectedMonth ? 'bg-[#FFFCD5]/80 font-bold' : ''
                    }`}
                  >
                    <td className="py-2 px-3 text-center font-mono text-slate-500 border-r border-slate-100">
                      {row.month}
                    </td>
                    <td className="py-2 px-3 font-semibold text-slate-800 border-r border-slate-100">
                      {row.label}
                    </td>
                    <td
                      className={`py-2 px-3 text-right font-mono tabular-nums ${
                        row.amount > 0 ? 'text-[#00692B] font-extrabold' : 'text-slate-400'
                      }`}
                    >
                      {formatVND(row.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                <tr>
                  <td className="py-2 px-3 text-center border-r border-slate-300">Tổng</td>
                  <td className="py-2 px-3 text-left border-r border-slate-300">Cả năm</td>
                  <td className="py-2 px-3 text-right font-mono text-[#00692B] tabular-nums font-extrabold">
                    {formatVND(yearTotalAmount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* BIỂU ĐỒ CỘT CÁC THÁNG */}
          <div className="lg:col-span-7">
            <MonthlyBarChart data={monthlySummary} currentMonth={selectedMonth} />
          </div>
        </div>
      </div>

      {/* SECTION 3: DASHBOARD CHI PHÍ THEO ĐƠN VỊ KẾT HỢP KỲ (THÁNG) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-xs font-bold text-[#00692B] uppercase tracking-wider flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00692B]"></span>
            3. Dashboard chi phí theo đơn vị kết hợp kỳ (tháng)
          </h3>

          {/* Period selector for Unit Table to prevent horizontal scroll */}
          <div className="flex items-center gap-2 self-start sm:self-auto text-xs">
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-md border border-slate-200">
              <button
                onClick={() => setUnitTablePeriod('q4')}
                className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                  unitTablePeriod === 'q4'
                    ? 'bg-[#00692B] text-white font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Quý 4 (T10-T12) - Bảng gọn gàng, không cuộn ngang"
              >
                Quý 4
              </button>
              <button
                onClick={() => setUnitTablePeriod('m10')}
                className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                  unitTablePeriod === 'm10'
                    ? 'bg-[#00692B] text-white font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tháng 10
              </button>
              <button
                onClick={() => setUnitTablePeriod('all')}
                className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                  unitTablePeriod === 'all'
                    ? 'bg-[#00692B] text-white font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                12 Tháng
              </button>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-md border border-slate-200">
              <button
                onClick={() => setUnitTableUnit('vnd')}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer ${
                  unitTableUnit === 'vnd' ? 'bg-white text-[#00692B] shadow-2xs' : 'text-slate-600'
                }`}
              >
                VNĐ
              </button>
              <button
                onClick={() => setUnitTableUnit('million')}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer ${
                  unitTableUnit === 'million' ? 'bg-white text-[#00692B] shadow-2xs' : 'text-slate-600'
                }`}
              >
                Triệu đ
              </button>
            </div>
          </div>
        </div>

        {/* Bảng tổng hợp theo kỳ x Đơn vị */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
          <div className="bg-[#00692B] text-[#FFFCD5] px-4 py-2.5 font-bold text-xs uppercase tracking-wider flex items-center justify-between border-b border-[#82C341]/40">
            <span>Tổng chi phí theo pháp nhân (Đơn vị chịu chi phí)</span>
            <span className="text-[11px] text-emerald-100 font-mono">
              {unitTableUnit === 'million' ? 'Đơn vị: Triệu VNĐ' : 'Đơn vị: VNĐ'}
            </span>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-xs text-slate-700 border-collapse table-auto">
              <thead className="bg-slate-100 text-slate-800 font-semibold text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-2 px-2.5 text-center w-12 border-r border-slate-200 sticky left-0 bg-slate-100 z-10 shadow-[2px_0_4px_rgba(0,0,0,0.04)]">
                    Tháng
                  </th>
                  <th className="py-2 px-3 text-left w-24 border-r border-slate-200">Kỳ báo cáo</th>
                  {units.map(u => (
                    <th
                      key={u.maDonVi}
                      className="py-2 px-3 text-right border-r border-slate-200 whitespace-nowrap"
                    >
                      {u.tenDonVi}
                    </th>
                  ))}
                  <th className="py-2 px-3 text-right font-bold text-slate-900 bg-slate-50">Tổng cộng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {unitActiveMonths.map(monthNum => {
                  const monthTotal = units.reduce(
                    (sum, u) => sum + (unitMatrix.matrix[u.maDonVi]?.[monthNum] || 0),
                    0
                  );

                  return (
                    <tr
                      key={monthNum}
                      className={`hover:bg-emerald-50/40 transition-colors ${
                        monthNum === selectedMonth ? 'bg-[#FFFCD5]/70 font-semibold' : ''
                      }`}
                    >
                      <td className="py-2 px-2.5 text-center font-mono text-slate-400 border-r border-slate-100 sticky left-0 bg-white z-10 shadow-[2px_0_4px_rgba(0,0,0,0.04)]">
                        {monthNum}
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-700 border-r border-slate-100 whitespace-nowrap">
                        Tháng {monthNum < 10 ? `0${monthNum}` : monthNum}
                      </td>
                      {units.map(u => {
                        const val = unitMatrix.matrix[u.maDonVi]?.[monthNum] || 0;
                        return (
                          <td
                            key={u.maDonVi}
                            className={`py-2 px-3 text-right font-mono tabular-nums border-r border-slate-100 whitespace-nowrap ${
                              val > 0 ? 'text-[#00692B] font-bold' : 'text-slate-300'
                            }`}
                          >
                            {formatUnitCell(val)}
                          </td>
                        );
                      })}
                      <td
                        className={`py-2 px-3 text-right font-mono tabular-nums whitespace-nowrap bg-slate-50 ${
                          monthTotal > 0 ? 'text-[#00692B] font-extrabold' : 'text-slate-400'
                        }`}
                      >
                        {formatUnitCell(monthTotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-[#00692B] text-[#FFFCD5] font-bold border-t-2 border-[#82C341]">
                <tr>
                  <td className="py-2.5 px-2.5 text-center border-r border-[#005422] sticky left-0 bg-[#00692B] z-10 text-[#FFFCD5]">
                    Tổng
                  </td>
                  <td className="py-2.5 px-3 text-left border-r border-[#005422] text-[#FFFCD5]">Cả năm</td>
                  {units.map(u => (
                    <td
                      key={u.maDonVi}
                      className="py-2.5 px-3 text-right font-mono text-[#FFFCD5] border-r border-[#005422] tabular-nums whitespace-nowrap"
                    >
                      {formatUnitCell(unitMatrix.unitTotals[u.maDonVi] || 0)}
                    </td>
                  ))}
                  <td className="py-2.5 px-3 text-right font-mono text-[#FFFCD5] text-sm tabular-nums whitespace-nowrap bg-[#005422]">
                    {formatUnitCell(yearTotalAmount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Biểu đồ hình trụ */}
        <UnitMonthlyGroupedChart
          months={monthlySummary.map(m => ({ month: m.month, label: m.label }))}
          units={units.map(u => ({
            maDonVi: u.maDonVi,
            tenDonVi: u.tenDonVi,
            color: UNIT_COLORS[u.maDonVi] || '#00692B',
          }))}
          matrixData={unitMatrix.matrix}
        />
      </div>

      {/* SECTION 4: TỔNG CHI PHÍ THEO NHÓM HÀNG HÓA/DỊCH VỤ */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-[#00692B] uppercase tracking-wider flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00692B]"></span>
          4. Tổng chi phí theo nhóm hàng hóa/dịch vụ & Biểu đồ hình tròn
        </h3>

        <CategoryPieChart
          data={categorySummaryForMonth}
          selectedMonth={selectedMonth}
          onSelectMonth={setSelectedMonth}
          totalMonthAmount={currentMonthTotal}
        />
      </div>

      {/* SECTION 5: CHI PHÍ THEO NHÀ CUNG CẤP */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-[#00692B] uppercase tracking-wider flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00692B]"></span>
          5. Chi phí theo nhà cung cấp & Biểu đồ Top 10 NCC
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* BẢNG TOP NHÀ CUNG CẤP */}
          <div className="lg:col-span-6 bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
            <div className="bg-[#00692B] text-[#FFFCD5] px-4 py-2.5 font-bold text-xs uppercase tracking-wider flex items-center justify-between border-b border-[#82C341]/40">
              <span>Bảng Top Nhà Cung Cấp</span>
              <span className="text-[11px] text-emerald-100 font-normal">Xếp theo tổng chi</span>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-xs text-slate-700 border-collapse table-auto md:table-fixed">
                <thead className="bg-slate-100 text-slate-800 font-semibold text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 text-left">Top Nhà Cung Cấp</th>
                    <th className="py-2.5 px-3 text-center w-24">Số giao dịch</th>
                    <th className="py-2.5 px-3 text-right w-36">Tổng chi phí (VNĐ)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {topSuppliersData.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-slate-400">
                        Chưa có dữ liệu nhà cung cấp phát sinh
                      </td>
                    </tr>
                  ) : (
                    topSuppliersData.map((item, idx) => (
                      <tr key={item.maNCC} className="hover:bg-emerald-50/40 transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${
                                idx === 0
                                  ? 'bg-[#00692B] text-[#FFFCD5]'
                                  : idx < 3
                                  ? 'bg-[#82C341] text-[#012A12]'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {idx + 1}
                            </span>
                            <span className="font-semibold text-slate-800 truncate" title={item.tenNCC}>
                              {item.tenNCC}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-medium text-slate-700">
                          {item.count}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                          {formatVND(item.amount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {topSuppliersData.length > 0 && (
                  <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                    <tr>
                      <td className="py-2.5 px-3 uppercase text-[11px]">Tổng cộng:</td>
                      <td className="py-2.5 px-3 text-center font-mono">
                        {topSuppliersData.reduce((s, i) => s + i.count, 0)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-[#00692B]">
                        {formatVND(topSuppliersData.reduce((s, i) => s + i.amount, 0))}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* BIỂU ĐỒ HIỂN THỊ RA TỐI ĐA 10 NCC CÓ CHI PHÍ CAO NHẤT */}
          <div className="lg:col-span-6">
            <TopSuppliersChart topSuppliers={topSuppliersData} />
          </div>
        </div>
      </div>
    </div>
  );
};
