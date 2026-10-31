/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useExpense } from '../context/ExpenseContext';
import { ExpenseRecord, CostClassification } from '../types';
import { ExpenseModal } from '../components/expenses/ExpenseModal';
import { formatVND, formatDate, exportToCSV, exportToExcelTable } from '../utils/exportUtils';
import {
  Plus,
  Download,
  Search,
  Filter,
  Edit2,
  Trash2,
  FileSpreadsheet,
  Building,
  User,
  Calendar,
  AlertCircle,
  Eye,
  LayoutGrid,
  Table,
  Columns,
} from 'lucide-react';

type ViewMode = 'compact' | 'full' | 'cards';

export type PeriodFilter =
  | 'ALL_YEAR'
  | 'CURRENT_MONTH'
  | 'H1'
  | 'H2'
  | 'Q1'
  | 'Q2'
  | 'Q3'
  | 'Q4';

const checkDateInPeriod = (dateStr: string, period: PeriodFilter): boolean => {
  if (period === 'ALL_YEAR') return true;
  if (!dateStr) return false;
  const parts = dateStr.split('-');
  if (parts.length < 2) return true;
  const month = parseInt(parts[1], 10);
  if (isNaN(month)) return true;

  switch (period) {
    case 'CURRENT_MONTH':
      return month === 10; // Kỳ hạch toán hiện tại trong hệ thống (Tháng 10)
    case 'H1':
      return month >= 1 && month <= 6; // 6 tháng đầu năm
    case 'H2':
      return month >= 7 && month <= 12; // 6 tháng cuối năm
    case 'Q1':
      return month >= 1 && month <= 3; // Quý 1
    case 'Q2':
      return month >= 4 && month <= 6; // Quý 2
    case 'Q3':
      return month >= 7 && month <= 9; // Quý 3
    case 'Q4':
      return month >= 10 && month <= 12; // Quý 4
    default:
      return true;
  }
};

export const HomePage: React.FC = () => {
  const { currentUser, currentUserPermissions, users, units, expenses, deleteExpense } = useExpense();
  const canViewAll = currentUserPermissions.viewAllExpenses;

  // Display mode: 'compact' (auto-fits screen, no horizontal scroll), 'full' (all 12 columns with sticky header/left), 'cards' (grid cards)
  const [viewMode, setViewMode] = useState<ViewMode>('compact');

  // Filters
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>(
    canViewAll ? 'ALL' : currentUser?.maNV || 'ALL'
  );
  const [selectedUnitFilter, setSelectedUnitFilter] = useState<string>('ALL');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('ALL_YEAR');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewDetailExpense, setViewDetailExpense] = useState<ExpenseRecord | null>(null);

  // If role is normal user, strictly restrict view to own expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter(item => {
      // Role Người dùng (không xem toàn bộ): Chỉ hiển thị chi phí của chính user nhập
      if (!canViewAll && currentUser) {
        if (item.nguoiPhuTrach !== currentUser.maNV) return false;
      }

      // Có quyền xem toàn bộ: Có lọc theo user
      if (canViewAll && selectedUserFilter !== 'ALL') {
        if (item.nguoiPhuTrach !== selectedUserFilter) return false;
      }

      // Unit filter
      if (selectedUnitFilter !== 'ALL' && item.maDonVi !== selectedUnitFilter) {
        return false;
      }

      // Classification filter
      if (selectedClassFilter !== 'ALL' && item.phanLoai !== selectedClassFilter) {
        return false;
      }

      // Period filter (tháng hiện tại, 6 tháng đầu năm, 6 tháng cuối năm, theo 4 quý, cả 12 tháng)
      if (!checkDateInPeriod(item.ngayPhatSinh, periodFilter)) {
        return false;
      }

      // Date range filter
      if (startDate && item.ngayPhatSinh < startDate) return false;
      if (endDate && item.ngayPhatSinh > endDate) return false;

      // Keyword search
      if (searchKeyword.trim()) {
        const q = searchKeyword.toLowerCase();
        const match =
          item.maChiPhi.toLowerCase().includes(q) ||
          item.tenDanhMuc.toLowerCase().includes(q) ||
          item.dienGiai.toLowerCase().includes(q) ||
          item.tenNCC.toLowerCase().includes(q) ||
          item.tenDonVi.toLowerCase().includes(q) ||
          item.tenNguoiPhuTrach.toLowerCase().includes(q) ||
          (item.soChungTu && item.soChungTu.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [
    expenses,
    canViewAll,
    currentUser,
    selectedUserFilter,
    selectedUnitFilter,
    selectedClassFilter,
    periodFilter,
    startDate,
    endDate,
    searchKeyword,
  ]);

  // Aggregate stats
  const totalAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, item) => sum + item.soTien, 0);
  }, [filteredExpenses]);

  // Handle Export CSV
  const handleExportCSV = () => {
    const filename = canViewAll
      ? `Bao_Cao_Chi_Phi_Tong_Hop_${new Date().toISOString().slice(0, 10)}`
      : `Bao_Cao_Chi_Phi_Cua_User_${currentUser?.maNV}_${new Date().toISOString().slice(0, 10)}`;

    const headers = [
      'Mã chi phí',
      'Ngày phát sinh',
      'Số chứng từ',
      'Danh mục hàng hóa/dịch vụ',
      'Phân loại',
      'Diễn giải',
      'Đơn vị chịu chi phí',
      'Đối tượng chi phí',
      'Nhà cung cấp',
      'Số tiền (VNĐ)',
      'Người phụ trách',
    ];

    const rows = filteredExpenses.map(item => [
      item.maChiPhi,
      formatDate(item.ngayPhatSinh),
      item.soChungTu || '',
      item.tenDanhMuc,
      item.phanLoai,
      item.dienGiai,
      item.tenDonVi,
      item.tenDoiTuong,
      item.tenNCC,
      item.soTien,
      item.tenNguoiPhuTrach,
    ]);

    exportToCSV(filename, headers, rows);
  };

  // Handle Export Excel (.xls)
  const handleExportExcel = () => {
    const title = canViewAll
      ? `BÁO CÁO QUẢN TRỊ CHI PHÍ DOANH NGHIỆP`
      : `BÁO CÁO CHI PHÍ CỦA NHÂN VIÊN: ${currentUser?.tenNV?.toUpperCase()} (${currentUser?.maNV})`;

    const filename = canViewAll ? 'BaoCao_ChiPhi_ToanDoanhNghiep' : `BaoCao_ChiPhi_${currentUser?.maNV}`;

    const headers = [
      'Mã chi phí',
      'Ngày phát sinh',
      'Số chứng từ',
      'Tên hàng hóa/dịch vụ',
      'Phân loại',
      'Diễn giải nội dung',
      'Đơn vị chịu chi phí',
      'Đối tượng chi phí',
      'Nhà cung cấp',
      'Số tiền (VNĐ)',
      'Người tạo',
    ];

    const rows = filteredExpenses.map(item => [
      item.maChiPhi,
      formatDate(item.ngayPhatSinh),
      item.soChungTu || '',
      item.tenDanhMuc,
      item.phanLoai,
      item.dienGiai,
      item.tenDonVi,
      item.tenDoiTuong,
      item.tenNCC,
      item.soTien,
      item.tenNguoiPhuTrach,
    ]);

    exportToExcelTable(filename, title, headers, rows);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner & Context Description */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">
              {canViewAll ? 'Quản Lý Toàn Bộ Chi Phí Doanh Nghiệp' : 'Quản Lý Chi Phí Cá Nhân'}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {canViewAll
              ? 'Hiển thị chi phí của tất cả các user. Hỗ trợ lọc theo user, quản lý và xuất báo cáo cấp quản trị.'
              : 'Hiển thị các khoản chi phí do chính bạn tạo. Hỗ trợ thêm mới, chỉnh sửa, xóa và xuất báo cáo của user.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => {
              setEditingExpense(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#FFFCD5] bg-[#00692B] hover:bg-[#005422] rounded-md transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#82C341]" />
            <span>Thêm chi phí</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition-colors shadow-xs cursor-pointer"
            title="Xuất file CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>{canViewAll ? 'Xuất CSV' : 'XUẤT BÁO CÁO CỦA USER'}</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#00692B] bg-[#FFFCD5]/80 hover:bg-[#FFFCD5] border border-[#82C341] rounded-md transition-colors shadow-xs cursor-pointer"
            title="Xuất bảng tính Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#00692B]" />
            <span>Xuất Excel (.xls)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Tổng chi phí phát sinh
          </span>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
            {formatVND(totalAmount)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {filteredExpenses.length} khoản chi phí ghi nhận
          </span>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Chi phí bình quân / khoản
          </span>
          <div className="text-xl font-bold font-mono text-blue-700 mt-1 tabular-nums">
            {formatVND(filteredExpenses.length > 0 ? Math.round(totalAmount / filteredExpenses.length) : 0)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Dựa trên danh sách đang hiển thị</span>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Tài khoản hiện tại
          </span>
          <div className="text-base font-bold text-slate-800 mt-1 truncate">
            {currentUser?.tenNV}
          </div>
          <span className="text-[11px] text-slate-500 font-mono mt-1 block">
            Mã NV: {currentUser?.maNV} · {currentUser?.phongBan}
          </span>
        </div>
      </div>

      {/* Filter Toolbar & View Mode Switcher */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-3">
        {/* Row 1: Filters */}
        <div className="space-y-3">
          {/* Quick Period Selector Pills (tháng hiện tại, 6 tháng đầu năm, 6 tháng cuối năm, theo 4 quý, cả 12 tháng) */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-50/80 rounded-lg border border-slate-200">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-700 mr-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#00692B]" />
                Kỳ thời gian:
              </span>
              {[
                { id: 'CURRENT_MONTH', label: 'Tháng hiện tại' },
                { id: 'H1', label: '6 tháng đầu năm' },
                { id: 'H2', label: '6 tháng cuối năm' },
                { id: 'Q1', label: 'Quý 1' },
                { id: 'Q2', label: 'Quý 2' },
                { id: 'Q3', label: 'Quý 3' },
                { id: 'Q4', label: 'Quý 4' },
                { id: 'ALL_YEAR', label: 'Cả 12 tháng' },
              ].map(p => {
                const isActive = periodFilter === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPeriodFilter(p.id as PeriodFilter)}
                    className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#00692B] text-[#FFFCD5] shadow-xs font-bold border border-[#82C341]'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => {
                setSearchKeyword('');
                setSelectedUserFilter(canViewAll ? 'ALL' : currentUser?.maNV || 'ALL');
                setSelectedUnitFilter('ALL');
                setSelectedClassFilter('ALL');
                setPeriodFilter('ALL_YEAR');
                setStartDate('');
                setEndDate('');
              }}
              className="text-xs text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 font-medium py-1 px-2.5 rounded transition-colors cursor-pointer"
            >
              Đặt lại bộ lọc
            </button>
          </div>

          {/* Grid Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* Keyword Search */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Tìm kiếm chứng từ, diễn giải
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Nhập mã, tên hàng hóa, NCC, người tạo..."
                  value={searchKeyword}
                  onChange={e => setSearchKeyword(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded pl-8 pr-3 py-2 text-slate-900 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            {/* User Filter */}
            {canViewAll ? (
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Lọc theo Người phụ trách
                </label>
                <select
                  value={selectedUserFilter}
                  onChange={e => setSelectedUserFilter(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-2.5 py-2 text-slate-900 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none font-medium"
                >
                  <option value="ALL">Tất cả user ({users.length})</option>
                  {users.map(u => (
                    <option key={u.maNV} value={u.maNV}>
                      [{u.maNV}] {u.tenNV}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Người phụ trách
                </label>
                <input
                  type="text"
                  value={`${currentUser?.tenNV} (${currentUser?.maNV})`}
                  disabled
                  className="w-full text-xs bg-slate-100 border border-slate-200 rounded px-2.5 py-2 text-slate-600 font-medium cursor-not-allowed"
                />
              </div>
            )}

            {/* Unit Filter */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Đơn vị chịu chi phí
              </label>
              <select
                value={selectedUnitFilter}
                onChange={e => setSelectedUnitFilter(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-2.5 py-2 text-slate-900 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
              >
                <option value="ALL">Tất cả đơn vị</option>
                {units.map(u => (
                  <option key={u.maDonVi} value={u.maDonVi}>
                    {u.tenDonVi}
                  </option>
                ))}
              </select>
            </div>

            {/* Classification Filter */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Phân loại chi phí
              </label>
              <select
                value={selectedClassFilter}
                onChange={e => setSelectedClassFilter(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-2.5 py-2 text-slate-900 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
              >
                <option value="ALL">Tất cả phân loại</option>
                <option value="CC-DC">CC-DC</option>
                <option value="CC-DC/TS">CC-DC/TS</option>
                <option value="VATTU">VATTU</option>
                <option value="TS">TS</option>
                <option value="DICHVU">DICHVU</option>
                <option value="GIAOTE">GIAOTE</option>
              </select>
            </div>
          </div>
        </div>

        {/* Row 2: View Mode Switcher to prevent horizontal scroll */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500">
            <span className="font-semibold text-slate-700">Chế độ hiển thị bảng:</span>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 self-start sm:self-auto">
            <button
              onClick={() => setViewMode('compact')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                viewMode === 'compact'
                  ? 'bg-white text-[#00692B] shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Bảng tối ưu vừa khít màn hình, không cần cuộn ngang"
            >
              <Columns className="w-3.5 h-3.5 text-[#82C341]" />
              <span>Thích ứng (Không cuộn)</span>
            </button>

            <button
              onClick={() => setViewMode('full')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                viewMode === 'full'
                  ? 'bg-white text-[#00692B] shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Xem đầy đủ 12 cột chi tiết có cố định mã bên trái"
            >
              <Table className="w-3.5 h-3.5" />
              <span>Đầy đủ 12 cột</span>
            </button>

            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white text-[#00692B] shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Xem dạng thẻ (phù hợp máy tính bảng và di động)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Dạng thẻ</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. COMPACT RESPONSIVE TABLE VIEW (NO HORIZONTAL SCROLL) */}
      {/* ========================================================= */}
      {viewMode === 'compact' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Danh Sách Chi Phí ({filteredExpenses.length} bản ghi) · Chế Độ Thích Ứng Màn Hình
            </span>
            <span className="text-xs text-slate-500">
              Tổng cộng: <strong className="font-mono text-slate-900">{formatVND(totalAmount)}</strong>
            </span>
          </div>

          <table className="w-full text-left text-xs text-slate-700 border-collapse table-auto md:table-fixed">
            <thead className="bg-slate-100/90 text-slate-700 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 w-10 text-center">STT</th>
                <th className="py-3 px-3 w-40 sm:w-44">Chứng từ & Ngày</th>
                <th className="py-3 px-3">Nội dung chi phí & Phân loại</th>
                <th className="py-3 px-3 w-36 sm:w-44 hidden md:table-cell">Đơn vị & Đối tượng</th>
                <th className="py-3 px-3 w-44 hidden lg:table-cell">Đối tác & Người tạo</th>
                <th className="py-3 px-3 w-36 text-right">Số tiền (VNĐ)</th>
                <th className="py-3 px-3 w-24 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <p className="text-sm font-medium">Không tìm thấy khoản chi phí nào phù hợp</p>
                    <p className="text-xs mt-1">Bấm "Thêm chi phí" để tạo mới phiếu chi đầu tiên.</p>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp, idx) => (
                  <tr key={exp.id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="py-3 px-3 text-center font-mono text-slate-400">{idx + 1}</td>
                    
                    {/* Column: Code, Date, Invoice */}
                    <td className="py-3 px-3">
                      <div className="font-mono font-bold text-blue-700">{exp.maChiPhi}</div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {formatDate(exp.ngayPhatSinh)}
                      </div>
                      {exp.soChungTu && (
                        <div className="text-[10px] text-slate-400 font-mono">
                          HĐ: {exp.soChungTu}
                        </div>
                      )}
                    </td>

                    {/* Column: Goods name, Classification, Description */}
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-semibold text-slate-900">{exp.tenDanhMuc}</span>
                        <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          {exp.phanLoai}
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px] mt-1 line-clamp-2 leading-relaxed" title={exp.dienGiai}>
                        {exp.dienGiai}
                      </p>
                      {/* Mobile extra info when hidden */}
                      <div className="mt-1 md:hidden text-[10px] text-slate-500">
                        {exp.tenDonVi} · {exp.tenNguoiPhuTrach}
                      </div>
                    </td>

                    {/* Column: Unit & Cost Object */}
                    <td className="py-3 px-3 hidden md:table-cell">
                      <div className="font-medium text-slate-900">{exp.tenDonVi}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 truncate" title={exp.tenDoiTuong}>
                        {exp.tenDoiTuong}
                      </div>
                    </td>

                    {/* Column: Supplier & Creator */}
                    <td className="py-3 px-3 hidden lg:table-cell">
                      <div className="font-medium text-slate-800 truncate" title={exp.tenNCC}>
                        {exp.tenNCC}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Tạo bởi: {exp.tenNguoiPhuTrach}
                      </div>
                    </td>

                    {/* Column: Amount */}
                    <td className="py-3 px-3 text-right">
                      <span className="font-mono font-bold text-slate-900 text-sm tabular-nums">
                        {formatVND(exp.soTien)}
                      </span>
                    </td>

                    {/* Column: Actions */}
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setViewDetailExpense(exp)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 rounded hover:bg-slate-100 transition-colors"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingExpense(exp);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-amber-600 rounded hover:bg-slate-100 transition-colors"
                          title="Chỉnh sửa chi phí"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingId(exp.id)}
                          className="p-1.5 text-slate-500 hover:text-red-600 rounded hover:bg-slate-100 transition-colors"
                          title="Xóa chi phí"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredExpenses.length > 0 && (
              <tfoot className="bg-slate-100/90 font-bold text-slate-900 border-t border-slate-200">
                <tr>
                  <td colSpan={3} className="py-3 px-4 uppercase tracking-wider text-[11px]">
                    Tổng cộng ({filteredExpenses.length} khoản chi):
                  </td>
                  <td colSpan={2} className="hidden md:table-cell"></td>
                  <td className="py-3 px-3 text-right font-mono text-blue-900 text-sm tabular-nums">
                    {formatVND(totalAmount)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. FULL 12-COLUMN VIEW (WITH STICKY LEFT CODE COLUMN) */}
      {/* ========================================================= */}
      {viewMode === 'full' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Danh Sách Đầy Đủ 12 Cột (Cột mã chi phí được cố định bên trái khi cuộn)
            </span>
            <span className="text-xs text-slate-500">
              Tổng cộng: <strong className="font-mono text-slate-900">{formatVND(totalAmount)}</strong>
            </span>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs text-slate-700 border-collapse min-w-[1250px]">
              <thead className="bg-slate-100 text-slate-700 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 w-10 text-center sticky left-0 bg-slate-100 z-10">STT</th>
                  <th className="py-3 px-3 whitespace-nowrap sticky left-10 bg-slate-100 z-10 border-r border-slate-200 shadow-[2px_0_4px_rgba(0,0,0,0.05)]">
                    Mã chi phí
                  </th>
                  <th className="py-3 px-3 whitespace-nowrap">Ngày phát sinh</th>
                  <th className="py-3 px-3 whitespace-nowrap">Danh mục hàng hóa/dịch vụ</th>
                  <th className="py-3 px-3 whitespace-nowrap">Phân loại</th>
                  <th className="py-3 px-3 min-w-[200px]">Diễn giải</th>
                  <th className="py-3 px-3 whitespace-nowrap">Đơn vị</th>
                  <th className="py-3 px-3 whitespace-nowrap">Đối tượng</th>
                  <th className="py-3 px-3 whitespace-nowrap">Nhà cung cấp</th>
                  <th className="py-3 px-3 text-right whitespace-nowrap">Số tiền (VNĐ)</th>
                  <th className="py-3 px-3 whitespace-nowrap">Người phụ trách</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap w-24">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.map((exp, idx) => (
                  <tr key={exp.id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="py-3 px-3 text-center font-mono text-slate-400 sticky left-0 bg-white z-10">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-blue-700 whitespace-nowrap sticky left-10 bg-white z-10 border-r border-slate-200 shadow-[2px_0_4px_rgba(0,0,0,0.05)]">
                      {exp.maChiPhi}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap text-slate-600 font-mono">
                      {formatDate(exp.ngayPhatSinh)}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-900 whitespace-nowrap">
                      <div>{exp.tenDanhMuc}</div>
                      <span className="text-[10px] text-slate-400 font-mono">{exp.maDanhMucChiPhi}</span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                        {exp.phanLoai}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600 max-w-xs truncate" title={exp.dienGiai}>
                      {exp.dienGiai}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-800 whitespace-nowrap">
                      {exp.tenDonVi}
                    </td>
                    <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                      {exp.tenDoiTuong}
                    </td>
                    <td className="py-3 px-3 text-slate-700 max-w-[180px] truncate" title={exp.tenNCC}>
                      {exp.tenNCC}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 tabular-nums whitespace-nowrap">
                      {formatVND(exp.soTien)}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="font-medium text-slate-800">{exp.tenNguoiPhuTrach}</div>
                      <span className="text-[10px] text-slate-400 font-mono">{exp.nguoiPhuTrach}</span>
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setViewDetailExpense(exp)}
                          className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-slate-100"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingExpense(exp);
                            setIsModalOpen(true);
                          }}
                          className="p-1 text-slate-400 hover:text-amber-600 rounded hover:bg-slate-100"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingId(exp.id)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-slate-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. CARD GRID VIEW (ZERO HORIZONTAL SCROLL) */}
      {/* ========================================================= */}
      {viewMode === 'cards' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>Hiển thị {filteredExpenses.length} thẻ chi phí</span>
            <span>Tổng cộng: <strong className="font-mono text-blue-700 text-sm">{formatVND(totalAmount)}</strong></span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredExpenses.map((exp, idx) => (
              <div
                key={exp.id}
                className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs hover:border-blue-300 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2 mb-2">
                    <span className="font-mono font-bold text-xs text-blue-700">{exp.maChiPhi}</span>
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                      {exp.phanLoai}
                    </span>
                  </div>

                  <h4 className="font-semibold text-slate-900 text-sm">{exp.tenDanhMuc}</h4>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">{exp.dienGiai}</p>

                  <div className="mt-3 space-y-1 text-xs text-slate-500 border-t border-slate-50 pt-2">
                    <div className="flex justify-between">
                      <span>Đơn vị:</span>
                      <span className="font-medium text-slate-800">{exp.tenDonVi}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Đối tác:</span>
                      <span className="font-medium text-slate-800 truncate max-w-[180px]">{exp.tenNCC}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ngày:</span>
                      <span className="font-mono text-slate-700">{formatDate(exp.ngayPhatSinh)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Người tạo:</span>
                      <span className="text-slate-700">{exp.tenNguoiPhuTrach}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-semibold">Số tiền</span>
                    <span className="font-mono font-bold text-base text-slate-900">
                      {formatVND(exp.soTien)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setViewDetailExpense(exp)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 rounded hover:bg-slate-100"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingExpense(exp);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-amber-600 rounded hover:bg-slate-100"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingId(exp.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-slate-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add / Edit Expense Modal */}
      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingExpense(null);
        }}
        expenseToEdit={editingExpense}
      />

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-2">Xác nhận xóa chi phí?</h3>
            <p className="text-xs text-slate-600 mb-5 leading-relaxed">
              Thao tác này sẽ xóa vĩnh viễn khoản chi phí khỏi hệ thống. Báo cáo và bảng tổng hợp sẽ tự động cập nhật ngay lập tức.
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  deleteExpense(deletingId);
                  setDeletingId(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded transition-colors"
              >
                Xóa ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Detail Modal */}
      {viewDetailExpense && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Chi Tiết Chứng Từ Chi Phí</h3>
                <p className="text-xs text-blue-600 font-mono font-semibold">{viewDetailExpense.maChiPhi}</p>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                Đã duyệt
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Ngày phát sinh:</span>
                <span className="font-mono font-semibold text-slate-800">{formatDate(viewDetailExpense.ngayPhatSinh)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Số chứng từ:</span>
                <span className="font-mono font-semibold text-slate-800">{viewDetailExpense.soChungTu || 'Chưa cập nhật'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Danh mục hàng hóa/dịch vụ:</span>
                <span className="font-semibold text-slate-900 text-right">{viewDetailExpense.tenDanhMuc}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Phân loại:</span>
                <span className="font-semibold text-slate-800">{viewDetailExpense.phanLoai}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Đơn vị chịu chi phí:</span>
                <span className="font-semibold text-slate-900">{viewDetailExpense.tenDonVi}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Đối tượng chi phí:</span>
                <span className="font-semibold text-slate-800">{viewDetailExpense.tenDoiTuong}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Nhà cung cấp:</span>
                <span className="font-semibold text-slate-900 text-right">{viewDetailExpense.tenNCC}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Người phụ trách (tạo):</span>
                <span className="font-semibold text-slate-800">{viewDetailExpense.tenNguoiPhuTrach} ({viewDetailExpense.nguoiPhuTrach})</span>
              </div>
              <div className="py-2 border-b border-slate-100">
                <span className="text-slate-500 block mb-1">Diễn giải nội dung:</span>
                <p className="text-slate-800 bg-slate-50 p-2.5 rounded text-xs leading-relaxed border border-slate-200">
                  {viewDetailExpense.dienGiai}
                </p>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-sm font-bold text-slate-900">Tổng số tiền:</span>
                <span className="text-lg font-bold font-mono text-blue-700">{formatVND(viewDetailExpense.soTien)}</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setViewDetailExpense(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
