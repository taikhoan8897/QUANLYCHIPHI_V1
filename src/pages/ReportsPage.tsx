/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useExpense } from '../context/ExpenseContext';
import { formatVND, formatDate, exportToCSV, exportToExcelTable } from '../utils/exportUtils';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  Filter,
  Layers,
  Building,
  Briefcase,
  Target,
  FileText,
  ChevronDown,
  ChevronRight,
  Maximize2,
  SlidersHorizontal,
} from 'lucide-react';
import { THACO_COLORS } from '../theme/thacoBrand';

type ReportTab =
  | 'catalog_matrix' // 1. Báo cáo tổng hợp kỳ theo danh mục hàng hóa/dịch vụ (Page 2)
  | 'unit_matrix'    // 2. Báo cáo tổng hợp kỳ theo đơn vị chịu chi phí
  | 'supplier_matrix'// 3. Báo cáo tổng hợp kỳ theo nhà cung cấp
  | 'object_matrix'  // 4. Báo cáo tổng hợp kỳ theo đối tượng chi phí
  | 'detail_time';   // 5. Báo cáo chi phí chi tiết theo loại hàng hóa/dịch vụ (chọn thời gian)

type PeriodScope = 'all_year' | 'q1' | 'q2' | 'q3' | 'q4' | 'h1' | 'h2' | 'current_m10';
type DisplayUnit = 'vnd' | 'million';

export const ReportsPage: React.FC = () => {
  const {
    expenses,
    costCatalog,
    costGroups,
    units,
    suppliers,
    costObjects,
    currentUser,
    currentUserPermissions,
  } = useExpense();

  // Scope data for USER role (strictly personal expenses)
  const canViewAll = currentUserPermissions?.viewAllExpenses ?? true;
  const effectiveExpenses = useMemo(() => {
    if (!canViewAll && currentUser) {
      return expenses.filter(e => e.nguoiPhuTrach === currentUser.maNV);
    }
    return expenses;
  }, [expenses, canViewAll, currentUser]);

  const [activeTab, setActiveTab] = useState<ReportTab>('catalog_matrix');
  const [selectedYear, setSelectedYear] = useState<number>(2026);

  // Responsive Controls: eliminates horizontal scrolling!
  const [periodScope, setPeriodScope] = useState<PeriodScope>('q4'); // Defaults to Q4 (Oct-Dec) so all 3 active months fit nicely on screen without scrolling!
  const [displayUnit, setDisplayUnit] = useState<DisplayUnit>('vnd');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Filters for Tab 5 (Detailed report with time range)
  const [detailFromDate, setDetailFromDate] = useState<string>('2026-10-01');
  const [detailToDate, setDetailToDate] = useState<string>('2026-10-31');
  const [detailCategoryCode, setDetailCategoryCode] = useState<string>('ALL');
  const [detailUnitCode, setDetailUnitCode] = useState<string>('ALL');

  // Determine active months to render based on periodScope
  const activeMonths = useMemo(() => {
    switch (periodScope) {
      case 'q1':
        return [1, 2, 3];
      case 'q2':
        return [4, 5, 6];
      case 'q3':
        return [7, 8, 9];
      case 'q4':
        return [10, 11, 12];
      case 'h1':
        return [1, 2, 3, 4, 5, 6];
      case 'h2':
        return [7, 8, 9, 10, 11, 12];
      case 'current_m10':
        return [10];
      case 'all_year':
      default:
        return Array.from({ length: 12 }, (_, i) => i + 1);
    }
  }, [periodScope]);

  // Format currency according to display unit
  const formatAmount = (amt: number): string => {
    if (amt === 0) return '-';
    if (displayUnit === 'million') {
      const millions = amt / 1000000;
      return `${millions.toFixed(millions % 1 === 0 ? 0 : 1)} tr`;
    }
    return formatVND(amt);
  };

  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  // ==========================================
  // REPORT 1: BÁO CÁO CHI PHÍ THEO THÁNG VÀ THEO LOẠI HÀNG HÓA
  // ==========================================
  const catalogMatrixData = useMemo(() => {
    const groupsWithItems = costGroups
      .filter(g => g.maNhom !== 'A' && g.maNhom !== '3002')
      .map(group => {
        const items = costCatalog.filter(c => c.maNhom === group.maNhom);
        
        const itemsWithMonthly = items.map(item => {
          const monthlyAmounts: Record<number, number> = {};
          let rowPeriodTotal = 0;

          activeMonths.forEach(m => {
            const sum = effectiveExpenses
              .filter(e => {
                const parts = e.ngayPhatSinh.split('-');
                return (
                  Number(parts[0]) === selectedYear &&
                  Number(parts[1]) === m &&
                  e.maDanhMucChiPhi === item.maChiPhi
                );
              })
              .reduce((s, e) => s + e.soTien, 0);

            monthlyAmounts[m] = sum;
            rowPeriodTotal += sum;
          });

          return {
            ...item,
            monthlyAmounts,
            rowPeriodTotal,
          };
        });

        const groupMonthlySubtotals: Record<number, number> = {};
        let groupPeriodTotal = 0;

        activeMonths.forEach(m => {
          const subtotal = itemsWithMonthly.reduce((s, itm) => s + (itm.monthlyAmounts[m] || 0), 0);
          groupMonthlySubtotals[m] = subtotal;
          groupPeriodTotal += subtotal;
        });

        return {
          group,
          items: itemsWithMonthly,
          groupMonthlySubtotals,
          groupPeriodTotal,
        };
      });

    const grandMonthlyTotals: Record<number, number> = {};
    let grandPeriodTotal = 0;

    activeMonths.forEach(m => {
      const sum = groupsWithItems.reduce((s, g) => s + (g.groupMonthlySubtotals[m] || 0), 0);
      grandMonthlyTotals[m] = sum;
      grandPeriodTotal += sum;
    });

    return {
      groupsWithItems,
      grandMonthlyTotals,
      grandPeriodTotal,
    };
  }, [costGroups, costCatalog, effectiveExpenses, selectedYear, activeMonths]);

  // ==========================================
  // REPORT 2: BÁO CÁO TỔNG HỢP KỲ THEO ĐƠN VỊ CHỊU CHI PHÍ
  // ==========================================
  const unitReportData = useMemo(() => {
    const list = units.map(unit => {
      const monthlyAmounts: Record<number, number> = {};
      let rowTotal = 0;

      activeMonths.forEach(m => {
        const sum = effectiveExpenses
          .filter(e => {
            const parts = e.ngayPhatSinh.split('-');
            return (
              Number(parts[0]) === selectedYear &&
              Number(parts[1]) === m &&
              e.maDonVi === unit.maDonVi
            );
          })
          .reduce((s, e) => s + e.soTien, 0);

        monthlyAmounts[m] = sum;
        rowTotal += sum;
      });

      return {
        unit,
        monthlyAmounts,
        rowTotal,
      };
    });

    const monthlyGrand: Record<number, number> = {};
    let grandTotal = 0;
    activeMonths.forEach(m => {
      const sum = list.reduce((s, u) => s + (u.monthlyAmounts[m] || 0), 0);
      monthlyGrand[m] = sum;
      grandTotal += sum;
    });

    return { list, monthlyGrand, grandTotal };
  }, [units, effectiveExpenses, selectedYear, activeMonths]);

  // ==========================================
  // REPORT 3: BÁO CÁO TỔNG HỢP KỲ THEO NHÀ CUNG CẤP
  // ==========================================
  const supplierReportData = useMemo(() => {
    const list = suppliers.map(sup => {
      const monthlyAmounts: Record<number, number> = {};
      let rowTotal = 0;

      activeMonths.forEach(m => {
        const sum = effectiveExpenses
          .filter(e => {
            const parts = e.ngayPhatSinh.split('-');
            return (
              Number(parts[0]) === selectedYear &&
              Number(parts[1]) === m &&
              e.maNCC === sup.maNCC
            );
          })
          .reduce((s, e) => s + e.soTien, 0);

        monthlyAmounts[m] = sum;
        rowTotal += sum;
      });

      return {
        sup,
        monthlyAmounts,
        rowTotal,
      };
    });

    const monthlyGrand: Record<number, number> = {};
    let grandTotal = 0;
    activeMonths.forEach(m => {
      const sum = list.reduce((s, u) => s + (u.monthlyAmounts[m] || 0), 0);
      monthlyGrand[m] = sum;
      grandTotal += sum;
    });

    return { list, monthlyGrand, grandTotal };
  }, [suppliers, effectiveExpenses, selectedYear, activeMonths]);

  // ==========================================
  // REPORT 4: BÁO CÁO TỔNG HỢP KỲ THEO ĐỐI TƯỢNG CHI PHÍ
  // ==========================================
  const objectReportData = useMemo(() => {
    const list = costObjects.map(obj => {
      const monthlyAmounts: Record<number, number> = {};
      let rowTotal = 0;

      activeMonths.forEach(m => {
        const sum = effectiveExpenses
          .filter(e => {
            const parts = e.ngayPhatSinh.split('-');
            return (
              Number(parts[0]) === selectedYear &&
              Number(parts[1]) === m &&
              e.maDoiTuong === obj.maDoiTuong
            );
          })
          .reduce((s, e) => s + e.soTien, 0);

        monthlyAmounts[m] = sum;
        rowTotal += sum;
      });

      return {
        obj,
        monthlyAmounts,
        rowTotal,
      };
    });

    const monthlyGrand: Record<number, number> = {};
    let grandTotal = 0;
    activeMonths.forEach(m => {
      const sum = list.reduce((s, u) => s + (u.monthlyAmounts[m] || 0), 0);
      monthlyGrand[m] = sum;
      grandTotal += sum;
    });

    return { list, monthlyGrand, grandTotal };
  }, [costObjects, effectiveExpenses, selectedYear, activeMonths]);

  // ==========================================
  // REPORT 5: BÁO CÁO CHI TIẾT THEO LOẠI HÀNG HÓA (CHỌN THỜI GIAN)
  // ==========================================
  const detailedTransactions = useMemo(() => {
    return effectiveExpenses.filter(item => {
      if (detailFromDate && item.ngayPhatSinh < detailFromDate) return false;
      if (detailToDate && item.ngayPhatSinh > detailToDate) return false;
      if (detailCategoryCode !== 'ALL' && item.maDanhMucChiPhi !== detailCategoryCode) return false;
      if (detailUnitCode !== 'ALL' && item.maDonVi !== detailUnitCode) return false;
      return true;
    });
  }, [effectiveExpenses, detailFromDate, detailToDate, detailCategoryCode, detailUnitCode]);

  const detailTotal = useMemo(() => {
    return detailedTransactions.reduce((s, i) => s + i.soTien, 0);
  }, [detailedTransactions]);

  // EXPORT HANDLER
  const handleExportCurrentReport = (type: 'csv' | 'excel') => {
    const periodLabel = periodScope === 'all_year' ? '12_Thang' : periodScope.toUpperCase();
    if (activeTab === 'catalog_matrix') {
      const title = `THACO AGRI - BÁO CÁO CHI PHÍ THEO THÁNG VÀ LOẠI HÀNG HÓA - ${periodLabel} NĂM ${selectedYear}`;
      const headers = [
        'Mã hàng hóa',
        'Tên loại hàng hóa/dịch vụ',
        'Phân loại',
        ...activeMonths.map(m => `Tháng ${m < 10 ? `0${m}` : m}`),
        'Tổng kỳ',
      ];
      const rows: (string | number)[][] = [];

      catalogMatrixData.groupsWithItems.forEach(g => {
        rows.push([g.group.maNhom, `[NHÓM] ${g.group.tenNhom}`, '', ...activeMonths.map(m => g.groupMonthlySubtotals[m] || 0), g.groupPeriodTotal]);
        g.items.forEach(itm => {
          rows.push([
            itm.maChiPhi,
            itm.tenDanhMuc,
            itm.phanLoai,
            ...activeMonths.map(m => itm.monthlyAmounts[m] || 0),
            itm.rowPeriodTotal,
          ]);
        });
      });
      rows.push(['TỔNG CỘNG', 'TOÀN BỘ CHI PHÍ TRONG KỲ', '', ...activeMonths.map(m => catalogMatrixData.grandMonthlyTotals[m] || 0), catalogMatrixData.grandPeriodTotal]);

      if (type === 'csv') exportToCSV(`THACO_AGRI_BaoCao_Ky_HangHoa_${periodLabel}_${selectedYear}`, headers, rows);
      else exportToExcelTable(`THACO_AGRI_BaoCao_Ky_HangHoa_${periodLabel}_${selectedYear}`, title, headers, rows);
    } else if (activeTab === 'unit_matrix') {
      const title = `THACO AGRI - BÁO CÁO CHI PHÍ THEO ĐƠN VỊ - ${periodLabel} NĂM ${selectedYear}`;
      const headers = ['Mã ĐV', 'Tên đơn vị chịu chi phí', ...activeMonths.map(m => `Tháng ${m < 10 ? `0${m}` : m}`), 'Tổng cộng'];
      const rows = unitReportData.list.map(u => [
        u.unit.maDonVi,
        u.unit.tenDonVi,
        ...activeMonths.map(m => u.monthlyAmounts[m] || 0),
        u.rowTotal,
      ]);
      rows.push(['TỔNG', 'Tất cả đơn vị', ...activeMonths.map(m => unitReportData.monthlyGrand[m] || 0), unitReportData.grandTotal]);

      if (type === 'csv') exportToCSV(`THACO_AGRI_BaoCao_DonVi_${periodLabel}_${selectedYear}`, headers, rows);
      else exportToExcelTable(`THACO_AGRI_BaoCao_DonVi_${periodLabel}_${selectedYear}`, title, headers, rows);
    } else if (activeTab === 'supplier_matrix') {
      const title = `THACO AGRI - BÁO CÁO CHI PHÍ THEO NHÀ CUNG CẤP - ${periodLabel} NĂM ${selectedYear}`;
      const headers = ['Mã NCC', 'Tên nhà cung cấp', 'MST', ...activeMonths.map(m => `Tháng ${m < 10 ? `0${m}` : m}`), 'Tổng cộng'];
      const rows = supplierReportData.list.map(s => [
        s.sup.maNCC,
        s.sup.tenNCC,
        s.sup.mst,
        ...activeMonths.map(m => s.monthlyAmounts[m] || 0),
        s.rowTotal,
      ]);
      rows.push(['TỔNG', 'Tất cả NCC', '', ...activeMonths.map(m => supplierReportData.monthlyGrand[m] || 0), supplierReportData.grandTotal]);

      if (type === 'csv') exportToCSV(`THACO_AGRI_BaoCao_NCC_${periodLabel}_${selectedYear}`, headers, rows);
      else exportToExcelTable(`THACO_AGRI_BaoCao_NCC_${periodLabel}_${selectedYear}`, title, headers, rows);
    } else if (activeTab === 'object_matrix') {
      const title = `THACO AGRI - BÁO CÁO CHI PHÍ THEO ĐỐI TƯỢNG - ${periodLabel} NĂM ${selectedYear}`;
      const headers = ['Mã đối tượng', 'Tên đối tượng chi phí', ...activeMonths.map(m => `Tháng ${m < 10 ? `0${m}` : m}`), 'Tổng cộng'];
      const rows = objectReportData.list.map(o => [
        o.obj.maDoiTuong,
        o.obj.tenDoiTuong,
        ...activeMonths.map(m => o.monthlyAmounts[m] || 0),
        o.rowTotal,
      ]);
      rows.push(['TỔNG', 'Tất cả đối tượng', ...activeMonths.map(m => objectReportData.monthlyGrand[m] || 0), objectReportData.grandTotal]);

      if (type === 'csv') exportToCSV(`THACO_AGRI_BaoCao_DoiTuong_${periodLabel}_${selectedYear}`, headers, rows);
      else exportToExcelTable(`THACO_AGRI_BaoCao_DoiTuong_${periodLabel}_${selectedYear}`, title, headers, rows);
    } else if (activeTab === 'detail_time') {
      const title = `THACO AGRI - BÁO CÁO CHI TIẾT CHI PHÍ TỪ ${formatDate(detailFromDate)} ĐẾN ${formatDate(detailToDate)}`;
      const headers = [
        'Mã chi phí',
        'Ngày phát sinh',
        'Số chứng từ',
        'Danh mục hàng hóa',
        'Phân loại',
        'Diễn giải',
        'Đơn vị chịu chi phí',
        'Đối tượng chi phí',
        'Nhà cung cấp',
        'Số tiền (VNĐ)',
        'Người phụ trách',
      ];
      const rows = detailedTransactions.map(t => [
        t.maChiPhi,
        formatDate(t.ngayPhatSinh),
        t.soChungTu || '',
        t.tenDanhMuc,
        t.phanLoai,
        t.dienGiai,
        t.tenDonVi,
        t.tenDoiTuong,
        t.tenNCC,
        t.soTien,
        t.tenNguoiPhuTrach,
      ]);
      rows.push(['TỔNG CỘNG', '', '', '', '', `${detailedTransactions.length} khoản chi phí`, '', '', '', detailTotal, '']);

      if (type === 'csv') exportToCSV(`THACO_AGRI_BaoCao_ChiTiet_${detailFromDate}_${detailToDate}`, headers, rows);
      else exportToExcelTable(`THACO_AGRI_BaoCao_ChiTiet_${detailFromDate}_${detailToDate}`, title, headers, rows);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-emerald-900/10 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-[#00692B] text-lg uppercase tracking-wide">
              THACO AGRI
            </span>
            <span className="text-slate-300">|</span>
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-tight">
              Trung Tâm Báo Cáo Tài Chính & Chi Phí
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Báo cáo tổng hợp đa chiều theo kỳ (tháng/quý), pháp nhân và đối tác. Tối ưu vừa khít màn hình, loại bỏ cuộn ngang bất tiện.
          </p>
        </div>

        {/* Global Export & Print Tools */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs">
            <span className="font-semibold text-slate-600">Năm:</span>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              className="font-mono font-bold text-[#00692B] bg-transparent focus:outline-none"
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
            </select>
          </div>

          <button
            onClick={() => handleExportCurrentReport('excel')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#00692B] bg-[#FFFCD5]/80 hover:bg-[#FFFCD5] border border-[#82C341] rounded transition-colors shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#00692B]" />
            <span>Xuất Excel (.xls)</span>
          </button>

          <button
            onClick={() => handleExportCurrentReport('csv')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded transition-colors shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Xuất CSV</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded transition-colors shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>In</span>
          </button>
        </div>
      </div>

      {/* Role-based scope notice for USER role */}
      {!canViewAll && currentUser && (
        <div className="bg-[#FFFCD5]/70 border border-[#82C341] rounded-lg p-3.5 text-xs text-[#00692B] flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="font-bold uppercase tracking-wider text-[11px] bg-[#00692B] text-white px-2 py-0.5 rounded shadow-xs">
              Dữ liệu cá nhân
            </span>
            <span>
              Báo cáo đang trích lọc dữ liệu chi phí của người phụ trách: <strong>{currentUser.tenNV} ({currentUser.maNV})</strong>. Số liệu tổng hợp và chi tiết được giới hạn cho tài khoản của bạn.
            </span>
          </div>
        </div>
      )}

      {/* Tabs navigation for all 5 reports defined in PDF */}
      <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-lg border border-slate-200">
        <button
          onClick={() => setActiveTab('catalog_matrix')}
          className={`px-3 py-2 text-xs font-bold rounded-md transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'catalog_matrix'
              ? 'bg-[#00692B] text-white shadow-xs'
              : 'text-slate-600 hover:text-[#00692B] hover:bg-white/80'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-[#82C341]" />
          <span>Theo hàng hóa/dịch vụ (Mẫu PDF)</span>
        </button>

        <button
          onClick={() => setActiveTab('unit_matrix')}
          className={`px-3 py-2 text-xs font-medium rounded-md transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'unit_matrix'
              ? 'bg-[#00692B] text-white font-bold shadow-xs'
              : 'text-slate-600 hover:text-[#00692B] hover:bg-white/80'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>Theo đơn vị chịu chi phí</span>
        </button>

        <button
          onClick={() => setActiveTab('supplier_matrix')}
          className={`px-3 py-2 text-xs font-medium rounded-md transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'supplier_matrix'
              ? 'bg-[#00692B] text-white font-bold shadow-xs'
              : 'text-slate-600 hover:text-[#00692B] hover:bg-white/80'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>Theo nhà cung cấp</span>
        </button>

        <button
          onClick={() => setActiveTab('object_matrix')}
          className={`px-3 py-2 text-xs font-medium rounded-md transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'object_matrix'
              ? 'bg-[#00692B] text-white font-bold shadow-xs'
              : 'text-slate-600 hover:text-[#00692B] hover:bg-white/80'
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          <span>Theo đối tượng chi phí</span>
        </button>

        <button
          onClick={() => setActiveTab('detail_time')}
          className={`px-3 py-2 text-xs font-medium rounded-md transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'detail_time'
              ? 'bg-[#00692B] text-white font-bold shadow-xs'
              : 'text-slate-600 hover:text-[#00692B] hover:bg-white/80'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Chi tiết chứng từ (chọn thời gian)</span>
        </button>
      </div>

      {/* Responsive View Control Strip (Fixes Horizontal Scrolling) */}
      {activeTab !== 'detail_time' && (
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          {/* Period Scope Selector */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-700 flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#00692B]" />
              <span>Phạm vi hiển thị kỳ:</span>
            </span>
            <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-0.5 rounded-md">
              <button
                onClick={() => setPeriodScope('current_m10')}
                className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                  periodScope === 'current_m10'
                    ? 'bg-[#00692B] text-white font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tháng hiện tại (T10)
              </button>
              <button
                onClick={() => setPeriodScope('h1')}
                className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                  periodScope === 'h1'
                    ? 'bg-[#00692B] text-white font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                6 Tháng đầu năm
              </button>
              <button
                onClick={() => setPeriodScope('h2')}
                className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                  periodScope === 'h2'
                    ? 'bg-[#00692B] text-white font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                6 Tháng cuối năm
              </button>
              <button
                onClick={() => setPeriodScope('q1')}
                className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                  periodScope === 'q1'
                    ? 'bg-[#00692B] text-white font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Quý 1
              </button>
              <button
                onClick={() => setPeriodScope('q2')}
                className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                  periodScope === 'q2'
                    ? 'bg-[#00692B] text-white font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Quý 2
              </button>
              <button
                onClick={() => setPeriodScope('q3')}
                className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                  periodScope === 'q3'
                    ? 'bg-[#00692B] text-white font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Quý 3
              </button>
              <button
                onClick={() => setPeriodScope('q4')}
                className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                  periodScope === 'q4'
                    ? 'bg-[#00692B] text-white font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Quý 4
              </button>
              <button
                onClick={() => setPeriodScope('all_year')}
                className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                  periodScope === 'all_year'
                    ? 'bg-[#00692B] text-white font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Xem cả 12 tháng (cột mã được cố định bên trái khi cuộn)"
              >
                Cả 12 tháng
              </button>
            </div>
          </div>

          {/* Unit Toggle & Expand All */}
          <div className="flex items-center gap-3 self-end md:self-auto">
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-md">
              <span className="text-[11px] text-slate-500 font-medium px-1">Đơn vị:</span>
              <button
                onClick={() => setDisplayUnit('vnd')}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                  displayUnit === 'vnd'
                    ? 'bg-white text-[#00692B] shadow-2xs'
                    : 'text-slate-600'
                }`}
              >
                VNĐ
              </button>
              <button
                onClick={() => setDisplayUnit('million')}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                  displayUnit === 'million'
                    ? 'bg-white text-[#00692B] shadow-2xs'
                    : 'text-slate-600'
                }`}
                title="Rút gọn số tiền thành Triệu VNĐ (tr) giúp bảng siêu gọn, không tràn màn hình"
              >
                Triệu VNĐ (tr.đ)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 1: BÁO CÁO CHI PHÍ THEO THÁNG VÀ THEO LOẠI HÀNG HÓA */}
      {/* ======================================================== */}
      {activeTab === 'catalog_matrix' && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
          <div className="bg-[#00692B] text-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-[#82C341]">
            <div>
              <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#FFFCD5]">
                BÁO CÁO CHI PHÍ THEO THÁNG VÀ THEO LOẠI HÀNG HÓA
              </h3>
              <p className="text-[11px] text-emerald-100 mt-0.5">
                Bảng ma trận đối soát danh mục hàng hóa (Mẫu chuẩn Trang 2 PDF) · Đơn vị tính: {displayUnit === 'million' ? 'Triệu VNĐ' : 'VNĐ'}
              </p>
            </div>
            <span className="text-xs text-[#FFFCD5] font-mono font-bold self-start sm:self-auto bg-[#00481E] px-2.5 py-1 rounded border border-[#82C341]/40">
              Năm {selectedYear} · {periodScope === 'all_year' ? '12 Tháng' : periodScope.toUpperCase()}
            </span>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-xs text-slate-700 border-collapse table-auto">
              <thead className="bg-slate-100 text-slate-800 font-semibold text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 text-left border-r border-slate-200 whitespace-nowrap w-28 sticky left-0 bg-slate-100 z-10 shadow-[2px_0_4px_rgba(0,0,0,0.04)]">
                    Mã hàng hóa
                  </th>
                  <th className="py-2.5 px-3 text-left border-r border-slate-200 min-w-[200px]">
                    Tên loại hàng hóa/dịch vụ
                  </th>
                  {activeMonths.map(m => (
                    <th
                      key={m}
                      className="py-2.5 px-2 text-right border-r border-slate-200 whitespace-nowrap min-w-[75px]"
                    >
                      Tháng {m < 10 ? `0${m}` : m}
                    </th>
                  ))}
                  <th className="py-2.5 px-3 text-right font-bold text-slate-900 min-w-[95px] bg-slate-50">
                    Tổng kỳ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {catalogMatrixData.groupsWithItems.map(groupBlock => {
                  const isCollapsed = collapsedGroups[groupBlock.group.maNhom];

                  return (
                    <React.Fragment key={groupBlock.group.maNhom}>
                      {/* Group Header Row styled with THACO Ivory Cream #FFFCD5 and Dark Green #00692B */}
                      <tr
                        onClick={() => toggleGroupCollapse(groupBlock.group.maNhom)}
                        className="bg-[#FFFCD5]/70 hover:bg-[#FFFCD5] font-bold text-[#00692B] border-t-2 border-b border-[#82C341]/60 cursor-pointer transition-colors"
                      >
                        <td className="py-2.5 px-3 font-mono border-r border-emerald-900/10 sticky left-0 bg-[#FFFCD5] z-10 shadow-[2px_0_4px_rgba(0,0,0,0.04)]">
                          <div className="flex items-center gap-1">
                            {isCollapsed ? (
                              <ChevronRight className="w-3.5 h-3.5 text-[#00692B]" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-[#00692B]" />
                            )}
                            <span>{groupBlock.group.maNhom}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 border-r border-emerald-900/10 uppercase tracking-wide text-[11px]">
                          {groupBlock.group.tenNhom}
                          <span className="text-[10px] text-slate-500 font-normal ml-2">
                            ({groupBlock.items.length} mục)
                          </span>
                        </td>
                        {activeMonths.map(m => (
                          <td
                            key={m}
                            className="py-2.5 px-2 text-right font-mono tabular-nums border-r border-emerald-900/10"
                          >
                            {formatAmount(groupBlock.groupMonthlySubtotals[m] || 0)}
                          </td>
                        ))}
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#00692B] font-extrabold bg-[#FFFCD5]">
                          {formatAmount(groupBlock.groupPeriodTotal)}
                        </td>
                      </tr>

                      {/* Group Child Items (only when not collapsed) */}
                      {!isCollapsed &&
                        groupBlock.items.map(item => (
                          <tr key={item.maChiPhi} className="hover:bg-emerald-50/30 transition-colors">
                            <td className="py-1.5 px-3 font-mono text-[11px] text-slate-500 border-r border-slate-100 sticky left-0 bg-white z-10 shadow-[2px_0_4px_rgba(0,0,0,0.04)]">
                              {item.maChiPhi}
                            </td>
                            <td className="py-1.5 px-3 text-slate-800 border-r border-slate-100">
                              <span className="font-medium">{item.tenDanhMuc}</span>
                              <span className="text-[10px] text-slate-400 ml-1.5 font-mono">
                                ({item.phanLoai})
                              </span>
                            </td>
                            {activeMonths.map(m => {
                              const amt = item.monthlyAmounts[m] || 0;
                              return (
                                <td
                                  key={m}
                                  className={`py-1.5 px-2 text-right font-mono tabular-nums border-r border-slate-100 ${
                                    amt > 0 ? 'text-[#00692B] font-bold' : 'text-slate-300'
                                  }`}
                                >
                                  {formatAmount(amt)}
                                </td>
                              );
                            })}
                            <td
                              className={`py-1.5 px-3 text-right font-mono tabular-nums bg-slate-50/50 ${
                                item.rowPeriodTotal > 0 ? 'text-slate-900 font-bold' : 'text-slate-300'
                              }`}
                            >
                              {formatAmount(item.rowPeriodTotal)}
                            </td>
                          </tr>
                        ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
              <tfoot className="bg-[#00692B] text-white font-bold border-t-2 border-[#82C341]">
                <tr>
                  <td className="py-3 px-3 uppercase border-r border-[#005422] font-mono sticky left-0 bg-[#00692B] z-10 shadow-[2px_0_4px_rgba(0,0,0,0.15)] text-[#FFFCD5]">
                    TỔNG
                  </td>
                  <td className="py-3 px-3 uppercase border-r border-[#005422] tracking-wider text-[#FFFCD5]">
                    Tổng cộng toàn bộ chi phí:
                  </td>
                  {activeMonths.map(m => (
                    <td
                      key={m}
                      className="py-3 px-2 text-right font-mono text-[#FFFCD5] border-r border-[#005422] tabular-nums"
                    >
                      {formatAmount(catalogMatrixData.grandMonthlyTotals[m] || 0)}
                    </td>
                  ))}
                  <td className="py-3 px-3 text-right font-mono text-[#FFFCD5] text-sm tabular-nums bg-[#005422]">
                    {formatAmount(catalogMatrixData.grandPeriodTotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: BÁO CÁO THEO ĐƠN VỊ CHỊU CHI PHÍ */}
      {/* ======================================================== */}
      {activeTab === 'unit_matrix' && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
          <div className="bg-[#00692B] text-white p-4 border-b-2 border-[#82C341]">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#FFFCD5]">
              Báo Cáo Tổng Hợp Kỳ Theo Đơn Vị Chịu Chi Phí
            </h3>
            <p className="text-xs text-emerald-100 mt-0.5">
              Phân bổ số tiền thực chi theo pháp nhân doanh nghiệp qua các kỳ · Đơn vị tính: {displayUnit === 'million' ? 'Triệu VNĐ' : 'VNĐ'}
            </p>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-xs text-slate-700 border-collapse table-auto">
              <thead className="bg-slate-100 text-slate-800 font-semibold text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 text-left border-r border-slate-200 w-20 sticky left-0 bg-slate-100 z-10 shadow-[2px_0_4px_rgba(0,0,0,0.04)]">
                    Mã ĐV
                  </th>
                  <th className="py-2.5 px-3 text-left border-r border-slate-200 min-w-[180px]">
                    Đơn vị chịu chi phí
                  </th>
                  {activeMonths.map(m => (
                    <th
                      key={m}
                      className="py-2.5 px-2 text-right border-r border-slate-200 whitespace-nowrap min-w-[75px]"
                    >
                      Tháng {m < 10 ? `0${m}` : m}
                    </th>
                  ))}
                  <th className="py-2.5 px-3 text-right font-bold text-slate-900 min-w-[95px] bg-slate-50">
                    Tổng kỳ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {unitReportData.list.map(row => (
                  <tr key={row.unit.maDonVi} className="hover:bg-emerald-50/40 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-slate-500 border-r border-slate-100 sticky left-0 bg-white z-10 shadow-[2px_0_4px_rgba(0,0,0,0.04)]">
                      {row.unit.maDonVi}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 border-r border-slate-100">
                      <div>{row.unit.tenDonVi}</div>
                      <span className="text-[10px] text-slate-400 font-normal">{row.unit.tenDayDu}</span>
                    </td>
                    {activeMonths.map(m => {
                      const val = row.monthlyAmounts[m] || 0;
                      return (
                        <td
                          key={m}
                          className={`py-2.5 px-2 text-right font-mono tabular-nums border-r border-slate-100 ${
                            val > 0 ? 'text-[#00692B] font-bold' : 'text-slate-300'
                          }`}
                        >
                          {formatAmount(val)}
                        </td>
                      );
                    })}
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-[#00692B] tabular-nums bg-slate-50">
                      {formatAmount(row.rowTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-[#00692B] text-white font-bold border-t-2 border-[#82C341]">
                <tr>
                  <td className="py-3 px-3 uppercase border-r border-[#005422] sticky left-0 bg-[#00692B] z-10 text-[#FFFCD5]">
                    TỔNG
                  </td>
                  <td className="py-3 px-3 uppercase border-r border-[#005422] text-[#FFFCD5]">Tổng cả năm:</td>
                  {activeMonths.map(m => (
                    <td
                      key={m}
                      className="py-3 px-2 text-right font-mono text-[#FFFCD5] border-r border-[#005422] tabular-nums"
                    >
                      {formatAmount(unitReportData.monthlyGrand[m] || 0)}
                    </td>
                  ))}
                  <td className="py-3 px-3 text-right font-mono text-[#FFFCD5] text-sm tabular-nums bg-[#005422]">
                    {formatAmount(unitReportData.grandTotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: BÁO CÁO THEO NHÀ CUNG CẤP */}
      {/* ======================================================== */}
      {activeTab === 'supplier_matrix' && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
          <div className="bg-[#00692B] text-white p-4 border-b-2 border-[#82C341]">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#FFFCD5]">
              Báo Cáo Tổng Hợp Kỳ Theo Nhà Cung Cấp
            </h3>
            <p className="text-xs text-emerald-100 mt-0.5">
              Tổng hợp công nợ và chi phí phát sinh theo đối tác cung ứng hàng hóa/dịch vụ
            </p>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-xs text-slate-700 border-collapse table-auto">
              <thead className="bg-slate-100 text-slate-800 font-semibold text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 text-left border-r border-slate-200 w-24 sticky left-0 bg-slate-100 z-10 shadow-[2px_0_4px_rgba(0,0,0,0.04)]">
                    Mã NCC
                  </th>
                  <th className="py-2.5 px-3 text-left border-r border-slate-200 min-w-[200px]">
                    Tên nhà cung cấp & MST
                  </th>
                  {activeMonths.map(m => (
                    <th
                      key={m}
                      className="py-2.5 px-2 text-right border-r border-slate-200 whitespace-nowrap min-w-[75px]"
                    >
                      Tháng {m < 10 ? `0${m}` : m}
                    </th>
                  ))}
                  <th className="py-2.5 px-3 text-right font-bold text-slate-900 min-w-[95px] bg-slate-50">
                    Tổng kỳ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {supplierReportData.list.map(row => (
                  <tr key={row.sup.maNCC} className="hover:bg-emerald-50/40 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-slate-500 border-r border-slate-100 sticky left-0 bg-white z-10 shadow-[2px_0_4px_rgba(0,0,0,0.04)]">
                      {row.sup.maNCC}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 border-r border-slate-100">
                      <div>{row.sup.tenNCC}</div>
                      <span className="text-[10px] text-slate-400 font-mono font-normal">MST: {row.sup.mst}</span>
                    </td>
                    {activeMonths.map(m => {
                      const val = row.monthlyAmounts[m] || 0;
                      return (
                        <td
                          key={m}
                          className={`py-2.5 px-2 text-right font-mono tabular-nums border-r border-slate-100 ${
                            val > 0 ? 'text-[#00692B] font-bold' : 'text-slate-300'
                          }`}
                        >
                          {formatAmount(val)}
                        </td>
                      );
                    })}
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-[#00692B] tabular-nums bg-slate-50">
                      {formatAmount(row.rowTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-[#00692B] text-white font-bold border-t-2 border-[#82C341]">
                <tr>
                  <td className="py-3 px-3 uppercase border-r border-[#005422] sticky left-0 bg-[#00692B] z-10 text-[#FFFCD5]">
                    TỔNG
                  </td>
                  <td className="py-3 px-3 uppercase border-r border-[#005422] text-[#FFFCD5]">Tổng cả năm:</td>
                  {activeMonths.map(m => (
                    <td
                      key={m}
                      className="py-3 px-2 text-right font-mono text-[#FFFCD5] border-r border-[#005422] tabular-nums"
                    >
                      {formatAmount(supplierReportData.monthlyGrand[m] || 0)}
                    </td>
                  ))}
                  <td className="py-3 px-3 text-right font-mono text-[#FFFCD5] text-sm tabular-nums bg-[#005422]">
                    {formatAmount(supplierReportData.grandTotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: BÁO CÁO THEO ĐỐI TƯỢNG CHI PHÍ */}
      {/* ======================================================== */}
      {activeTab === 'object_matrix' && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
          <div className="bg-[#00692B] text-white p-4 border-b-2 border-[#82C341]">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#FFFCD5]">
              Báo Cáo Tổng Hợp Kỳ Theo Đối Tượng Chi Phí
            </h3>
            <p className="text-xs text-emerald-100 mt-0.5">
              Theo dõi chi phí phân bổ cho các dự án, khối ban nghiệp vụ và mục tiêu vận hành
            </p>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-xs text-slate-700 border-collapse table-auto">
              <thead className="bg-slate-100 text-slate-800 font-semibold text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 text-left border-r border-slate-200 w-24 sticky left-0 bg-slate-100 z-10 shadow-[2px_0_4px_rgba(0,0,0,0.04)]">
                    Mã ĐT
                  </th>
                  <th className="py-2.5 px-3 text-left border-r border-slate-200 min-w-[180px]">
                    Tên đối tượng chi phí
                  </th>
                  {activeMonths.map(m => (
                    <th
                      key={m}
                      className="py-2.5 px-2 text-right border-r border-slate-200 whitespace-nowrap min-w-[75px]"
                    >
                      Tháng {m < 10 ? `0${m}` : m}
                    </th>
                  ))}
                  <th className="py-2.5 px-3 text-right font-bold text-slate-900 min-w-[95px] bg-slate-50">
                    Tổng kỳ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {objectReportData.list.map(row => (
                  <tr key={row.obj.maDoiTuong} className="hover:bg-emerald-50/40 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-slate-500 border-r border-slate-100 sticky left-0 bg-white z-10 shadow-[2px_0_4px_rgba(0,0,0,0.04)]">
                      {row.obj.maDoiTuong}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 border-r border-slate-100">
                      <div>{row.obj.tenDoiTuong}</div>
                      <span className="text-[10px] text-slate-400 font-normal">{row.obj.moTa}</span>
                    </td>
                    {activeMonths.map(m => {
                      const val = row.monthlyAmounts[m] || 0;
                      return (
                        <td
                          key={m}
                          className={`py-2.5 px-2 text-right font-mono tabular-nums border-r border-slate-100 ${
                            val > 0 ? 'text-[#00692B] font-bold' : 'text-slate-300'
                          }`}
                        >
                          {formatAmount(val)}
                        </td>
                      );
                    })}
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-[#00692B] tabular-nums bg-slate-50">
                      {formatAmount(row.rowTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-[#00692B] text-white font-bold border-t-2 border-[#82C341]">
                <tr>
                  <td className="py-3 px-3 uppercase border-r border-[#005422] sticky left-0 bg-[#00692B] z-10 text-[#FFFCD5]">
                    TỔNG
                  </td>
                  <td className="py-3 px-3 uppercase border-r border-[#005422] text-[#FFFCD5]">Tổng cả năm:</td>
                  {activeMonths.map(m => (
                    <td
                      key={m}
                      className="py-3 px-2 text-right font-mono text-[#FFFCD5] border-r border-[#005422] tabular-nums"
                    >
                      {formatAmount(objectReportData.monthlyGrand[m] || 0)}
                    </td>
                  ))}
                  <td className="py-3 px-3 text-right font-mono text-[#FFFCD5] text-sm tabular-nums bg-[#005422]">
                    {formatAmount(objectReportData.grandTotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: BÁO CÁO CHI TIẾT THEO LOẠI HÀNG HÓA (CHỌN THỜI GIAN) */}
      {/* ======================================================== */}
      {activeTab === 'detail_time' && (
        <div className="space-y-4">
          {/* Time & Filter Box */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
            <div className="font-bold text-xs text-[#00692B] uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#00692B]" />
              <span>Thiết lập khoảng thời gian & Điều kiện lọc chi tiết</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Từ ngày</label>
                <input
                  type="date"
                  value={detailFromDate}
                  onChange={e => setDetailFromDate(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-2.5 py-2 font-mono text-slate-900 focus:bg-white focus:ring-1 focus:ring-[#00692B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Đến ngày</label>
                <input
                  type="date"
                  value={detailToDate}
                  onChange={e => setDetailToDate(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-2.5 py-2 font-mono text-slate-900 focus:bg-white focus:ring-1 focus:ring-[#00692B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Loại hàng hóa/dịch vụ
                </label>
                <select
                  value={detailCategoryCode}
                  onChange={e => setDetailCategoryCode(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-2.5 py-2 text-slate-900 focus:bg-white focus:ring-1 focus:ring-[#00692B]"
                >
                  <option value="ALL">Tất cả hàng hóa/dịch vụ</option>
                  {costCatalog.map(c => (
                    <option key={c.maChiPhi} value={c.maChiPhi}>
                      [{c.maChiPhi}] {c.tenDanhMuc}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Đơn vị chịu phí</label>
                <select
                  value={detailUnitCode}
                  onChange={e => setDetailUnitCode(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-2.5 py-2 text-slate-900 focus:bg-white focus:ring-1 focus:ring-[#00692B]"
                >
                  <option value="ALL">Tất cả đơn vị</option>
                  {units.map(u => (
                    <option key={u.maDonVi} value={u.maDonVi}>
                      {u.tenDonVi}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Detailed Transaction Ledger (Responsive: no horizontal scrolling on standard screens) */}
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
            <div className="bg-[#00692B] text-white p-4 flex items-center justify-between border-b-2 border-[#82C341]">
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#FFFCD5]">
                  Sổ Chi Tiết Chi Phí Theo Hàng Hóa & Thời Gian
                </h3>
                <p className="text-xs text-emerald-100 mt-0.5">
                  Từ ngày {formatDate(detailFromDate)} đến ngày {formatDate(detailToDate)} ·{' '}
                  {detailedTransactions.length} chứng từ
                </p>
              </div>
              <span className="text-sm font-bold font-mono text-[#FFFCD5] bg-[#005422] px-3 py-1 rounded">
                Tổng: {formatVND(detailTotal)}
              </span>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-xs text-slate-700 border-collapse table-auto md:table-fixed">
                <thead className="bg-slate-100 text-slate-800 font-semibold text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 text-center w-10">STT</th>
                    <th className="py-2.5 px-3 text-left w-36">Chứng từ & Ngày</th>
                    <th className="py-2.5 px-3 text-left">Hàng hóa & Phân loại</th>
                    <th className="py-2.5 px-3 text-left w-36 hidden md:table-cell">Đơn vị</th>
                    <th className="py-2.5 px-3 text-left w-44 hidden lg:table-cell">Nhà cung cấp</th>
                    <th className="py-2.5 px-3 text-right w-36">Số tiền (VNĐ)</th>
                    <th className="py-2.5 px-3 text-left w-28 hidden md:table-cell">Người tạo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {detailedTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        Không có phát sinh chi phí nào trong khoảng thời gian đã chọn
                      </td>
                    </tr>
                  ) : (
                    detailedTransactions.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-emerald-50/40 transition-colors">
                        <td className="py-2.5 px-3 text-center font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-2.5 px-3">
                          <div className="font-mono font-bold text-[#00692B]">{item.maChiPhi}</div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">{formatDate(item.ngayPhatSinh)}</div>
                          {item.soChungTu && <div className="text-[10px] text-slate-400 font-mono">HĐ: {item.soChungTu}</div>}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-slate-900">{item.tenDanhMuc}</span>
                            <span className="text-[10px] font-bold bg-[#FFFCD5] text-[#00692B] border border-[#82C341]/60 px-1.5 py-0.5 rounded">
                              {item.phanLoai}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">{item.dienGiai}</p>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800 hidden md:table-cell">
                          {item.tenDonVi}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 truncate hidden lg:table-cell" title={item.tenNCC}>
                          {item.tenNCC}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                          {formatVND(item.soTien)}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 hidden md:table-cell">
                          {item.tenNguoiPhuTrach}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {detailedTransactions.length > 0 && (
                  <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                    <tr>
                      <td colSpan={3} className="py-3 px-4 text-right uppercase text-[11px]">
                        Tổng cộng ({detailedTransactions.length} khoản chi tiết):
                      </td>
                      <td colSpan={2} className="hidden md:table-cell"></td>
                      <td className="py-3 px-3 text-right font-mono text-[#00692B] text-sm tabular-nums">
                        {formatVND(detailTotal)}
                      </td>
                      <td className="hidden md:table-cell"></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
