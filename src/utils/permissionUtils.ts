/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RoleId, RolePermissions } from '../types';

/**
 * Cấu hình 4 Role chuẩn theo yêu cầu:
 * 1. Role admin: Đủ tất cả các quyền.
 * 2. Role quản trị: Phân quyền trang chủ, dashboard, trang báo cáo.
 * 3. Role quản lý chi phí: Tất cả trừ quản lý role và quản lý người dùng.
 * 4. Role người dùng: Trang chủ và trang báo cáo (chỉ đổ dữ liệu của chính user đó).
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<RoleId, RolePermissions> = {
  ADMIN: {
    canAccessHome: true,
    canAccessDashboard: true,
    canAccessReports: true,
    canAccessAdmin: true,
    canManageRoles: true,
    canManageUsers: true,
    canManageMasterData: true,
    viewAllExpenses: true,
  },
  QUAN_TRI: {
    canAccessHome: true,
    canAccessDashboard: true,
    canAccessReports: true,
    canAccessAdmin: false,
    canManageRoles: false,
    canManageUsers: false,
    canManageMasterData: false,
    viewAllExpenses: true,
  },
  QUAN_LY_CHI_PHI: {
    canAccessHome: true,
    canAccessDashboard: true,
    canAccessReports: true,
    canAccessAdmin: true,
    canManageRoles: false, // Tất cả TRỪ quản lý role
    canManageUsers: false, // và TRỪ quản lý người dùng
    canManageMasterData: true,
    viewAllExpenses: true,
  },
  USER: {
    canAccessHome: true,
    canAccessDashboard: false,
    canAccessReports: true,
    canAccessAdmin: false,
    canManageRoles: false,
    canManageUsers: false,
    canManageMasterData: false,
    viewAllExpenses: false, // CHỈ ĐỔ DỮ LIỆU CỦA CHÍNH USER ĐÓ
  },
};

export const getRolePermissions = (roleId?: RoleId | string): RolePermissions => {
  if (roleId && roleId in DEFAULT_ROLE_PERMISSIONS) {
    return DEFAULT_ROLE_PERMISSIONS[roleId as RoleId];
  }
  return DEFAULT_ROLE_PERMISSIONS.USER;
};

export const getRoleInfo = (roleId?: RoleId | string) => {
  switch (roleId) {
    case 'ADMIN':
      return {
        label: 'Role Admin',
        title: 'Admin (Đủ tất cả các quyền)',
        badgeClass: 'bg-[#00692B] text-[#FFFCD5] border border-[#82C341]/60',
        shortDesc: 'Toàn quyền tất cả các phân hệ',
      };
    case 'QUAN_TRI':
      return {
        label: 'Role Quản trị',
        title: 'Quản trị (Trang chủ, Dashboard, Báo cáo)',
        badgeClass: 'bg-emerald-800 text-emerald-100 border border-emerald-600',
        shortDesc: 'Trang chủ, Dashboard, Trang báo cáo',
      };
    case 'QUAN_LY_CHI_PHI':
      return {
        label: 'Role QL Chi phí',
        title: 'Quản lý chi phí (Tất cả trừ Role & User)',
        badgeClass: 'bg-amber-800 text-amber-100 border border-amber-600',
        shortDesc: 'Tất cả trừ Quản lý Role & Người dùng',
      };
    case 'USER':
    default:
      return {
        label: 'Role Người dùng',
        title: 'Người dùng (Trang chủ & Báo cáo cá nhân)',
        badgeClass: 'bg-slate-700 text-slate-100 border border-slate-500',
        shortDesc: 'Trang chủ, Báo cáo (dữ liệu cá nhân)',
      };
  }
};
