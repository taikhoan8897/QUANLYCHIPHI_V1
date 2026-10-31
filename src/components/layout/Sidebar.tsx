/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useExpense } from '../../context/ExpenseContext';
import {
  Home,
  LayoutDashboard,
  FileBarChart,
  Settings,
  ShieldCheck,
  Building,
  Layers,
  Users,
  Briefcase,
  FileSpreadsheet,
  UserCheck,
} from 'lucide-react';
import { THACO_COLORS } from '../../theme/thacoBrand';
import { getRoleInfo } from '../../utils/permissionUtils';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  adminSubTab?: string;
  onSelectAdminSubTab?: (subTab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  adminSubTab,
  onSelectAdminSubTab,
}) => {
  const { currentUser, currentUserPermissions } = useExpense();
  const roleInfo = getRoleInfo(currentUser?.role);

  const menuItems = [
    ...(currentUserPermissions.canAccessHome
      ? [
          {
            id: 'home',
            label: 'Trang chủ (Chi phí)',
            icon: Home,
            desc: currentUserPermissions.viewAllExpenses
              ? 'Xem & quản lý tất cả chi phí'
              : 'Chi phí của chính user',
          },
        ]
      : []),
    ...(currentUserPermissions.canAccessDashboard
      ? [
          {
            id: 'dashboard',
            label: 'Dashboard phân tích',
            icon: LayoutDashboard,
            desc: 'Biểu đồ kỳ, đơn vị, top NCC',
          },
        ]
      : []),
    ...(currentUserPermissions.canAccessReports
      ? [
          {
            id: 'reports',
            label: 'Trang báo cáo',
            icon: FileBarChart,
            desc: currentUserPermissions.viewAllExpenses
              ? 'Báo cáo tổng hợp & chi tiết'
              : 'Báo cáo chi phí cá nhân',
          },
        ]
      : []),
    ...(currentUserPermissions.canAccessAdmin
      ? [
          {
            id: 'admin',
            label: 'Trang quản trị',
            icon: Settings,
            badge: currentUser?.role === 'ADMIN' ? 'Toàn quyền' : 'QL Chi phí',
            desc:
              currentUser?.role === 'ADMIN'
                ? 'Quản trị hệ thống & người dùng'
                : 'Quản trị danh mục cơ sở',
          },
        ]
      : []),
  ];

  const allAdminNavItems = [
    { id: 'roles', label: 'Quản lý Role', icon: ShieldCheck, requiresRoleMgmt: true },
    { id: 'users', label: 'Quản lý Người dùng', icon: Users, requiresUserMgmt: true },
    { id: 'groups', label: 'Nhóm danh mục chi phí', icon: Layers },
    { id: 'catalog', label: 'Danh mục chi phí', icon: FileSpreadsheet },
    { id: 'suppliers', label: 'Danh mục Nhà cung cấp', icon: Briefcase },
    { id: 'units', label: 'Đơn vị chịu chi phí', icon: Building },
    { id: 'objects', label: 'Đối tượng chi phí', icon: Layers },
  ];

  // Role Quản lý chi phí: tất cả TRỪ quản lý role và quản lý người dùng
  const adminNavItems = allAdminNavItems.filter(item => {
    if (item.requiresRoleMgmt && !currentUserPermissions.canManageRoles) return false;
    if (item.requiresUserMgmt && !currentUserPermissions.canManageUsers) return false;
    return true;
  });

  return (
    <aside className="w-64 bg-[#012A12] text-slate-200 flex flex-col shrink-0 min-h-screen border-r border-[#003B18] select-none shadow-md">
      {/* Brand Header with THACO AGRI Identity */}
      <div className="h-16 px-5 flex items-center gap-3 border-b border-[#003B18] bg-[#011E0C]">
        <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center p-1 shadow-sm border border-emerald-900/40">
          <span className="font-extrabold text-[12px] tracking-tighter text-[#00692B] leading-none">
            TG
          </span>
        </div>
        <div>
          <h1 className="text-white text-sm font-black tracking-wider uppercase leading-tight font-sans">
            THACO<span className="text-[#82C341] ml-1">AGRI</span>
          </h1>
          <p className="text-[10px] text-emerald-300/80 uppercase tracking-widest font-semibold">
            Quản Lý Chi Phí
          </p>
        </div>
      </div>

      {/* Role Indicator Banner */}
      <div className="px-4 py-3 bg-[#01240F] border-b border-[#003B18] flex items-center justify-between text-xs">
        <span className="text-emerald-300/70 text-[11px]">Phân quyền:</span>
        <span
          className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded text-[11px] shadow-2xs ${roleInfo.badgeClass}`}
        >
          {currentUser?.role === 'ADMIN' ? (
            <ShieldCheck className="w-3 h-3 text-[#82C341]" />
          ) : (
            <UserCheck className="w-3 h-3" />
          )}
          {roleInfo.label}
        </span>
      </div>

      {/* Main Navigation Menu */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto custom-scrollbar">
        <div className="px-3 pb-2 text-[10px] uppercase font-bold text-emerald-400/80 tracking-wider">
          Phân Hệ Chức Năng
        </div>

        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between group transition-all text-xs cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-[#00692B] to-[#008236] text-white font-bold shadow-sm border border-[#82C341]/50'
                  : 'text-slate-300 hover:bg-[#003B18] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-[#FFFCD5]' : 'text-emerald-400 group-hover:text-[#82C341]'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-extrabold ${
                    isActive
                      ? 'bg-[#82C341] text-[#012A12]'
                      : 'bg-emerald-800/80 text-emerald-200'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Sub-menu if user has Admin module permission */}
        {currentUserPermissions.canAccessAdmin && (
          <div className="pt-4 mt-2 border-t border-[#003B18] space-y-1">
            <div className="px-3 pb-2 text-[10px] uppercase font-bold text-[#82C341] tracking-wider flex items-center justify-between">
              <span>Danh Mục Cơ Sở</span>
              <span className="text-[9px] bg-emerald-950 text-emerald-300 font-mono px-1.5 py-0.5 rounded border border-[#003B18]">
                {adminNavItems.length} danh mục
              </span>
            </div>
            {adminNavItems.map(subItem => {
              const SubIcon = subItem.icon;
              const isSubActive = currentTab === 'admin' && adminSubTab === subItem.id;

              return (
                <button
                  key={subItem.id}
                  onClick={() => {
                    onSelectTab('admin');
                    if (onSelectAdminSubTab) onSelectAdminSubTab(subItem.id);
                  }}
                  className={`w-full text-left pl-6 pr-3 py-2 rounded-md text-xs flex items-center gap-2 transition-colors cursor-pointer ${
                    isSubActive
                      ? 'bg-[#00692B] text-[#FFFCD5] font-semibold border-l-2 border-[#82C341] shadow-2xs'
                      : 'text-emerald-200/70 hover:bg-[#003B18] hover:text-white'
                  }`}
                >
                  <SubIcon className="w-3.5 h-3.5" />
                  <span className="truncate">{subItem.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
};
