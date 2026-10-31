/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useExpense } from '../../context/ExpenseContext';
import { ExpenseRecord, CostClassification } from '../../types';
import { X, Check, Calculator } from 'lucide-react';
import { formatVND } from '../../utils/exportUtils';
import { THACO_COLORS } from '../../theme/thacoBrand';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenseToEdit?: ExpenseRecord | null;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  expenseToEdit,
}) => {
  const {
    currentUser,
    costCatalog,
    units,
    costObjects,
    suppliers,
    users,
    addExpense,
    updateExpense,
  } = useExpense();

  const isEdit = !!expenseToEdit;

  // Form states
  const [maChiPhi, setMaChiPhi] = useState('');
  const [ngayPhatSinh, setNgayPhatSinh] = useState('');
  const [maDanhMucChiPhi, setMaDanhMucChiPhi] = useState('');
  const [tenDanhMuc, setTenDanhMuc] = useState('');
  const [phanLoai, setPhanLoai] = useState<CostClassification>('CC-DC');
  const [dienGiai, setDienGiai] = useState('');
  const [maDonVi, setMaDonVi] = useState('');
  const [maDoiTuong, setMaDoiTuong] = useState('');
  const [maNCC, setMaNCC] = useState('');
  const [soTien, setSoTien] = useState<number>(0);
  const [soTienStr, setSoTienStr] = useState('');
  const [nguoiPhuTrach, setNguoiPhuTrach] = useState('');
  const [soChungTu, setSoChungTu] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Initialize or reset form
  useEffect(() => {
    if (expenseToEdit) {
      setMaChiPhi(expenseToEdit.maChiPhi);
      setNgayPhatSinh(expenseToEdit.ngayPhatSinh);
      setMaDanhMucChiPhi(expenseToEdit.maDanhMucChiPhi);
      setTenDanhMuc(expenseToEdit.tenDanhMuc);
      setPhanLoai(expenseToEdit.phanLoai);
      setDienGiai(expenseToEdit.dienGiai);
      setMaDonVi(expenseToEdit.maDonVi);
      setMaDoiTuong(expenseToEdit.maDoiTuong);
      setMaNCC(expenseToEdit.maNCC);
      setSoTien(expenseToEdit.soTien);
      setSoTienStr(expenseToEdit.soTien.toLocaleString('vi-VN'));
      setNguoiPhuTrach(expenseToEdit.nguoiPhuTrach);
      setSoChungTu(expenseToEdit.soChungTu || '');
    } else {
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const randomSuffix = Math.floor(100 + Math.random() * 900);

      setMaChiPhi(`EXP-${yyyy}${mm}-${randomSuffix}`);
      setNgayPhatSinh(`${yyyy}-${mm}-${dd}`);
      const defaultCatalog = costCatalog[0];
      if (defaultCatalog) {
        setMaDanhMucChiPhi(defaultCatalog.maChiPhi);
        setTenDanhMuc(defaultCatalog.tenDanhMuc);
        setPhanLoai(defaultCatalog.phanLoai);
      }
      setDienGiai('');
      setMaDonVi(units[0]?.maDonVi || '');
      setMaDoiTuong(costObjects[0]?.maDoiTuong || '');
      setMaNCC(suppliers[0]?.maNCC || '');
      setSoTien(10000000);
      setSoTienStr('10.000.000');
      setNguoiPhuTrach(currentUser?.maNV || users[0]?.maNV || 'NV001');
      setSoChungTu(`HD-${Math.floor(1000 + Math.random() * 9000)}`);
    }
    setErrorMsg('');
  }, [expenseToEdit, isOpen, currentUser]);

  const handleCatalogChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCode = e.target.value;
    setMaDanhMucChiPhi(selectedCode);
    const item = costCatalog.find(c => c.maChiPhi === selectedCode);
    if (item) {
      setTenDanhMuc(item.tenDanhMuc);
      setPhanLoai(item.phanLoai);
    }
  };

  const handleMoneyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, '');
    const num = Number(rawVal) || 0;
    setSoTien(num);
    setSoTienStr(num > 0 ? num.toLocaleString('vi-VN') : '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dienGiai.trim()) {
      setErrorMsg('Vui lòng nhập diễn giải chi phí.');
      return;
    }
    if (soTien <= 0) {
      setErrorMsg('Số tiền chi phí phải lớn hơn 0.');
      return;
    }

    const unitObj = units.find(u => u.maDonVi === maDonVi);
    const costObj = costObjects.find(o => o.maDoiTuong === maDoiTuong);
    const supplierObj = suppliers.find(s => s.maNCC === maNCC);
    const inchargeUser = users.find(u => u.maNV === nguoiPhuTrach);

    const recordData = {
      maChiPhi: maChiPhi.trim() || `EXP-${Date.now()}`,
      ngayPhatSinh,
      maDanhMucChiPhi,
      tenDanhMuc,
      phanLoai,
      dienGiai: dienGiai.trim(),
      maDonVi,
      tenDonVi: unitObj ? unitObj.tenDonVi : maDonVi,
      maDoiTuong,
      tenDoiTuong: costObj ? costObj.tenDoiTuong : maDoiTuong,
      maNCC,
      tenNCC: supplierObj ? supplierObj.tenNCC : maNCC,
      soTien,
      nguoiPhuTrach,
      tenNguoiPhuTrach: inchargeUser ? inchargeUser.tenNV : nguoiPhuTrach,
      soChungTu: soChungTu.trim(),
      trangThai: expenseToEdit?.trangThai || 'DA_DUYET',
    };

    if (isEdit && expenseToEdit) {
      updateExpense(expenseToEdit.id, recordData);
    } else {
      addExpense(recordData);
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-emerald-900/20 overflow-hidden my-8">
        {/* Header with THACO AGRI Styling */}
        <div className="px-6 py-4 bg-[#00692B] text-white flex items-center justify-between border-b-2 border-[#82C341]">
          <div>
            <h3 className="text-base font-bold text-[#FFFCD5]">
              {isEdit ? 'Chỉnh Sửa Chứng Từ Chi Phí' : 'Thêm Mới Phát Sinh Chi Phí'}
            </h3>
            <p className="text-xs text-emerald-100 mt-0.5">
              Hạch toán chi phí THACO AGRI theo đúng phân loại danh mục chuẩn
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-emerald-200 hover:text-white hover:bg-[#005422] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mã chi phí <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={maChiPhi}
                onChange={e => setMaChiPhi(e.target.value)}
                required
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-3 py-2 font-mono text-slate-900 focus:bg-white focus:ring-1 focus:ring-[#00692B] focus:outline-none font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ngày phát sinh <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={ngayPhatSinh}
                onChange={e => setNgayPhatSinh(e.target.value)}
                required
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-900 focus:bg-white focus:ring-1 focus:ring-[#00692B] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Danh mục hàng hóa/dịch vụ <span className="text-red-500">*</span>
              </label>
              <select
                value={maDanhMucChiPhi}
                onChange={handleCatalogChange}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-900 focus:bg-white focus:ring-1 focus:ring-[#00692B] focus:outline-none font-medium"
              >
                {costCatalog.map(item => (
                  <option key={item.maChiPhi} value={item.maChiPhi}>
                    [{item.maChiPhi}] {item.tenDanhMuc} — ({item.phanLoai})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phân loại chi phí (Tự động từ danh mục)
              </label>
              <input
                type="text"
                value={phanLoai}
                readOnly
                className="w-full text-xs bg-[#FFFCD5]/60 border border-[#82C341]/60 rounded px-3 py-2 text-[#00692B] font-bold cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Số hóa đơn / Chứng từ gốc
              </label>
              <input
                type="text"
                placeholder="VD: HD-00918"
                value={soChungTu}
                onChange={e => setSoChungTu(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-900 focus:bg-white focus:ring-1 focus:ring-[#00692B] focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Đơn vị chịu chi phí (Pháp nhân) <span className="text-red-500">*</span>
              </label>
              <select
                value={maDonVi}
                onChange={e => setMaDonVi(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-900 focus:bg-white focus:ring-1 focus:ring-[#00692B] focus:outline-none font-semibold"
              >
                {units.map(u => (
                  <option key={u.maDonVi} value={u.maDonVi}>
                    {u.tenDonVi} - {u.tenDayDu}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Đối tượng chi phí (Mục tiêu/Dự án) <span className="text-red-500">*</span>
              </label>
              <select
                value={maDoiTuong}
                onChange={e => setMaDoiTuong(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-900 focus:bg-white focus:ring-1 focus:ring-[#00692B] focus:outline-none"
              >
                {costObjects.map(obj => (
                  <option key={obj.maDoiTuong} value={obj.maDoiTuong}>
                    {obj.tenDoiTuong}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nhà cung cấp <span className="text-red-500">*</span>
              </label>
              <select
                value={maNCC}
                onChange={e => setMaNCC(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-900 focus:bg-white focus:ring-1 focus:ring-[#00692B] focus:outline-none"
              >
                {suppliers.map(s => (
                  <option key={s.maNCC} value={s.maNCC}>
                    {s.tenNCC} (MST: {s.mst})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Số tiền chi phí (VNĐ) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={soTienStr}
                  onChange={handleMoneyChange}
                  placeholder="0"
                  required
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded pl-3 pr-8 py-2 font-mono font-black text-[#00692B] focus:bg-white focus:ring-1 focus:ring-[#00692B] focus:outline-none text-right"
                />
                <span className="absolute right-3 top-2 text-xs font-semibold text-slate-400">đ</span>
              </div>
              <p className="text-[11px] text-[#00692B] font-bold mt-1 text-right">
                Bằng số: {formatVND(soTien)}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Người phụ trách (Người tạo) <span className="text-red-500">*</span>
              </label>
              <select
                value={nguoiPhuTrach}
                onChange={e => setNguoiPhuTrach(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-900 focus:bg-white focus:ring-1 focus:ring-[#00692B] focus:outline-none"
              >
                {users.map(u => (
                  <option key={u.maNV} value={u.maNV}>
                    [{u.maNV}] {u.tenNV} ({u.phongBan})
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Diễn giải nội dung chi phí <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={2}
                value={dienGiai}
                onChange={e => setDienGiai(e.target.value)}
                placeholder="Nhập mục đích sử dụng, quy cách hoặc thông tin phê duyệt..."
                required
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-900 focus:bg-white focus:ring-1 focus:ring-[#00692B] focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-[#FFFCD5] bg-[#00692B] hover:bg-[#005422] rounded-lg transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4 text-[#82C341]" />
              {isEdit ? 'Lưu thay đổi' : 'Tạo khoản chi phí'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
