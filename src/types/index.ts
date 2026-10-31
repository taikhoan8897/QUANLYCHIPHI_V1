/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type RoleId = 'ADMIN' | 'QUAN_TRI' | 'QUAN_LY_CHI_PHI' | 'USER';

export interface RolePermissions {
  canAccessHome: boolean;
  canAccessDashboard: boolean;
  canAccessReports: boolean;
  canAccessAdmin: boolean;
  canManageRoles: boolean;
  canManageUsers: boolean;
  canManageMasterData: boolean; // 5 danh mục: nhóm, danh mục hàng hóa, NCC, đơn vị, đối tượng
  viewAllExpenses: boolean;     // true: xem toàn bộ chi phí; false: chỉ đổ dữ liệu của chính user đó
}

export interface Role {
  maRole: RoleId;
  tenRole: string;
  moTa?: string;
  permissions: RolePermissions;
}

export interface User {
  maNV: string;
  tenNV: string;
  hashpass: string;
  role: RoleId;
  phongBan: string;
  email: string;
  avatar?: string;
  trangThai?: 'ACTIVE' | 'INACTIVE';
}

export type CostClassification = 'CC-DC' | 'CC-DC/TS' | 'VATTU' | 'TS' | 'DICHVU' | 'GIAOTE';

export interface CostGroup {
  maNhom: string;
  tenNhom: string;
  moTa: string;
  capBac?: number; // Level in hierarchy
  nhomCha?: string;
}

export interface CostCatalogItem {
  maChiPhi: string;
  maNhom: string;
  tenDanhMuc: string;
  phanLoai: CostClassification;
  ghiChu?: string;
}

export interface Supplier {
  maNCC: string;
  tenNCC: string;
  mst: string;
  tenDanhMucHangHoa: string;
  soDienThoai?: string;
  diaChi?: string;
}

export interface CostUnit {
  maDonVi: string;
  tenDonVi: string;
  tenDayDu: string;
  diaChi?: string;
}

export interface CostObject {
  maDoiTuong: string;
  tenDoiTuong: string;
  moTa: string;
}

export type ExpenseStatus = 'DA_DUYET' | 'CHO_DUYET' | 'TU_CHOI' | 'DA_CHI';

export interface ExpenseRecord {
  id: string;
  maChiPhi: string; // Mã phiếu phát sinh chi phí, e.g. EXP-2026-10-001
  ngayPhatSinh: string; // YYYY-MM-DD
  maDanhMucChiPhi: string; // Ref to CostCatalogItem.maChiPhi
  tenDanhMuc: string; // Tên danh mục hàng hóa/dịch vụ
  phanLoai: CostClassification;
  dienGiai: string; // Diễn giải
  maDonVi: string; // Ref to CostUnit.maDonVi
  tenDonVi: string;
  maDoiTuong: string; // Ref to CostObject.maDoiTuong
  tenDoiTuong: string;
  maNCC: string; // Ref to Supplier.maNCC
  tenNCC: string;
  soTien: number; // VNĐ
  nguoiPhuTrach: string; // Mã nhân viên tạo phiếu (maNV)
  tenNguoiPhuTrach: string;
  soChungTu?: string;
  trangThai: ExpenseStatus;
  ghiChu?: string;
  createdAt: string;
}
