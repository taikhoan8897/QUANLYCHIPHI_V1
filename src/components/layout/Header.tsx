/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useExpense } from '../../context/ExpenseContext';
import { ShieldCheck, UserCheck, LogOut, ChevronDown, RefreshCw, Sprout } from 'lucide-react';
import { THACO_COLORS } from '../../theme/thacoBrand';
import { getRoleInfo } from '../../utils/permissionUtils';

interface HeaderProps {
  currentTab: string;
}

export const Header: React.FC<HeaderProps> = ({ currentTab }) => {
  const { currentUser, users, switchUser, logout, resetToDefaultData } = useExpense();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const getTabTitle = (tab: string) => {
    switch (tab) {
      case 'home':
        return 'Quản Lý Chứng Từ Chi Phí';
      case 'dashboard':
        return 'Dashboard Phân Tích & Biểu Đồ Kỳ';
      case 'reports':
        return 'Trung Tâm Báo Cáo Tổng Hợp & Chi Tiết';
      case 'admin':
        return 'Quản Trị Danh Mục Hệ Thống';
      default:
        return 'Quản Trị Chi Phí';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-emerald-900/10 px-6 flex items-center justify-between gap-4 sticky top-0 z-20 shadow-2xs">
      {/* Breadcrumb & Section Name */}
      <div className="flex items-center gap-2 text-sm text-slate-500 min-w-0">
        <div className="w-6 h-6 rounded bg-[#00692B] flex items-center justify-center text-white shrink-0 shadow-2xs">
          <Sprout className="w-3.5 h-3.5 text-[#82C341]" />
        </div>
        <span className="font-extrabold text-[#00692B] whitespace-nowrap tracking-wide">THACO AGRI</span>
        <span className="text-slate-300">/</span>
        <span className="text-slate-800 font-semibold whitespace-nowrap truncate">{getTabTitle(currentTab)}</span>
      </div>

      {/* Right controls: Quick Switcher, User Profile */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Quick User Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-emerald-200/80 bg-slate-50 hover:bg-emerald-50/50 transition-colors text-left cursor-pointer"
          >
            <div className="w-7 h-7 rounded-full bg-[#00692B] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
              {currentUser?.tenNV.charAt(0) || 'U'}
            </div>
            <div className="hidden md:block text-left">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-xs font-bold text-slate-900">{currentUser?.tenNV}</span>
                <span className="text-[10px] bg-[#00692B] text-[#FFFCD5] font-bold px-1.5 py-0.5 rounded">
                  {getRoleInfo(currentUser?.role).label}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">{currentUser?.maNV}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* User Menu Dropdown */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-100 bg-[#FFFCD5]/20">
                <p className="text-[10px] text-[#00692B] uppercase font-bold tracking-wider">Đang đăng nhập với tư cách</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{currentUser?.tenNV}</p>
                <p className="text-xs text-slate-500">{currentUser?.phongBan}</p>
              </div>

              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-[11px] font-semibold text-slate-400 uppercase mb-1.5">
                  Chuyển nhanh 4 Role kiểm thử:
                </p>
                <div className="space-y-1">
                  {users.map(u => {
                    const uRoleInfo = getRoleInfo(u.role);
                    const isCurrent = currentUser?.maNV === u.maNV;

                    return (
                      <button
                        key={u.maNV}
                        onClick={() => {
                          switchUser(u.maNV);
                          setShowUserMenu(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                          isCurrent
                            ? 'bg-[#00692B] text-white font-semibold'
                            : 'text-slate-700 hover:bg-emerald-50/60'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {u.role === 'ADMIN' ? (
                            <ShieldCheck className={`w-3.5 h-3.5 shrink-0 ${isCurrent ? 'text-[#FFFCD5]' : 'text-[#00692B]'}`} />
                          ) : (
                            <UserCheck className={`w-3.5 h-3.5 shrink-0 ${isCurrent ? 'text-[#82C341]' : 'text-emerald-600'}`} />
                          )}
                          <span className="truncate">{u.tenNV}</span>
                        </div>
                        <span className={`text-[10px] font-mono shrink-0 px-1.5 py-0.5 rounded ${isCurrent ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                          {uRoleInfo.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-1 px-2">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Đăng xuất hệ thống
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-2">Khôi phục dữ liệu gốc theo tài liệu PDF?</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-5">
              Hệ thống sẽ nạp lại toàn bộ 60+ danh mục chi phí (3002-001, 3002-002, 3002-003...), 8 giao dịch mẫu tháng 10 trị giá đúng <strong>149.777.777 đ</strong> và bảng top nhà cung cấp chuẩn từ tài liệu đặc tả.
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  resetToDefaultData();
                  setShowResetConfirm(false);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-[#00692B] hover:bg-[#005422] rounded-lg transition-colors shadow-sm cursor-pointer"
              >
                Đồng ý khôi phục
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
