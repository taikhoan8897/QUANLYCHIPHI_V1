/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useExpense } from '../context/ExpenseContext';
import {
  Role,
  User,
  CostGroup,
  CostCatalogItem,
  Supplier,
  CostUnit,
  CostObject,
  CostClassification,
} from '../types';
import {
  ShieldCheck,
  Users,
  Layers,
  FileSpreadsheet,
  Briefcase,
  Building,
  Target,
  Plus,
  Edit2,
  Trash2,
  Search,
  Check,
  X,
  KeyRound,
  Database,
} from 'lucide-react';
import { THACO_COLORS } from '../theme/thacoBrand';

interface AdminPageProps {
  activeSubTab?: string;
  onSelectSubTab?: (subTab: string) => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({
  activeSubTab = 'catalog',
  onSelectSubTab,
}) => {
  const {
    roles,
    users,
    costGroups,
    costCatalog,
    suppliers,
    units,
    costObjects,
    currentUserPermissions,
    addRole,
    updateRole,
    deleteRole,
    addUser,
    updateUser,
    deleteUser,
    addCostGroup,
    updateCostGroup,
    deleteCostGroup,
    addCatalogItem,
    updateCatalogItem,
    deleteCatalogItem,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    addUnit,
    updateUnit,
    deleteUnit,
    addCostObject,
    updateCostObject,
    deleteCostObject,
  } = useExpense();

  const [currentSubTab, setCurrentSubTab] = useState<string>(activeSubTab);
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    if (activeSubTab) {
      if (activeSubTab === 'roles' && !currentUserPermissions.canManageRoles) {
        setCurrentSubTab('catalog');
      } else if (activeSubTab === 'users' && !currentUserPermissions.canManageUsers) {
        setCurrentSubTab('catalog');
      } else {
        setCurrentSubTab(activeSubTab);
      }
    }
  }, [activeSubTab, currentUserPermissions]);

  const setTab = (t: string) => {
    setCurrentSubTab(t);
    setSearchTerm('');
    if (onSelectSubTab) onSelectSubTab(t);
  };

  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [activeItem, setActiveItem] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: string; id: string; name: string } | null>(
    null
  );

  // ----------------------------------------------------
  // SUB-TAB 1: ROLES
  // ----------------------------------------------------
  const renderRoles = () => {
    return (
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#00692B] uppercase">Danh Sách Role (Phân Quyền)</h3>
            <p className="text-xs text-slate-500">Mã role, tên role và quyền hạn truy cập nghiệp vụ</p>
          </div>
          <button
            onClick={() => {
              setActiveItem({ maRole: '', tenRole: '', moTa: '' });
              setModalMode('create');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#FFFCD5] bg-[#00692B] hover:bg-[#005422] rounded transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm Role</span>
          </button>
        </div>

        <table className="w-full text-left text-xs text-slate-700 border-collapse">
          <thead className="bg-slate-100 text-slate-800 font-semibold text-[11px] border-b border-slate-200">
            <tr>
              <th className="py-2.5 px-4 w-12 text-center">STT</th>
              <th className="py-2.5 px-4 w-32">Mã Role</th>
              <th className="py-2.5 px-4 w-48">Tên Role</th>
              <th className="py-2.5 px-4">Mô tả quyền hạn</th>
              <th className="py-2.5 px-4 text-center w-24">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {roles.map((r, idx) => (
              <tr key={r.maRole} className="hover:bg-emerald-50/30">
                <td className="py-3 px-4 text-center font-mono text-slate-400">{idx + 1}</td>
                <td className="py-3 px-4 font-mono font-bold text-[#00692B]">{r.maRole}</td>
                <td className="py-3 px-4 font-semibold text-slate-900">{r.tenRole}</td>
                <td className="py-3 px-4 text-slate-600">{r.moTa || '-'}</td>
                <td className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => {
                        setActiveItem(r);
                        setModalMode('edit');
                      }}
                      className="p-1 text-slate-400 hover:text-[#00692B] rounded hover:bg-slate-100"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {r.maRole !== 'ADMIN' && (
                      <button
                        onClick={() =>
                          setDeleteConfirm({ type: 'role', id: r.maRole, name: r.tenRole })
                        }
                        className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-slate-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // ----------------------------------------------------
  // SUB-TAB 2: NGƯỜI DÙNG (USERS)
  // ----------------------------------------------------
  const renderUsers = () => {
    return (
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#00692B] uppercase">Quản Trị Người Dùng (Users)</h3>
            <p className="text-xs text-slate-500">Mã nhân viên, tên nhân viên, mật khẩu/hashpass, role và phòng ban</p>
          </div>
          <button
            onClick={() => {
              setActiveItem({
                maNV: `NV00${users.length + 1}`,
                tenNV: '',
                hashpass: '123456',
                role: 'USER',
                phongBan: 'Khối Nông trường Gia Lai',
                email: '',
                trangThai: 'ACTIVE',
              });
              setModalMode('create');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#FFFCD5] bg-[#00692B] hover:bg-[#005422] rounded transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm Người Dùng</span>
          </button>
        </div>

        <table className="w-full text-left text-xs text-slate-700 border-collapse">
          <thead className="bg-slate-100 text-slate-800 font-semibold text-[11px] border-b border-slate-200">
            <tr>
              <th className="py-2.5 px-4 w-12 text-center">STT</th>
              <th className="py-2.5 px-4">Mã nhân viên</th>
              <th className="py-2.5 px-4">Tên nhân viên</th>
              <th className="py-2.5 px-4">Role</th>
              <th className="py-2.5 px-4">Phòng ban</th>
              <th className="py-2.5 px-4">Mật khẩu (Hashpass)</th>
              <th className="py-2.5 px-4">Email</th>
              <th className="py-2.5 px-4 text-center w-24">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u, idx) => (
              <tr key={u.maNV} className="hover:bg-emerald-50/30">
                <td className="py-3 px-4 text-center font-mono text-slate-400">{idx + 1}</td>
                <td className="py-3 px-4 font-mono font-bold text-[#00692B]">{u.maNV}</td>
                <td className="py-3 px-4 font-semibold text-slate-900">{u.tenNV}</td>
                <td className="py-3 px-4">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      u.role === 'ADMIN'
                        ? 'bg-[#00692B] text-[#FFFCD5]'
                        : 'bg-emerald-100 text-[#00692B]'
                    }`}
                  >
                    {u.role === 'ADMIN' ? 'Quản trị' : 'User'}
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-700">{u.phongBan}</td>
                <td className="py-3 px-4 font-mono text-slate-500">
                  <span className="bg-slate-100 px-1.5 py-0.5 rounded">{u.hashpass}</span>
                </td>
                <td className="py-3 px-4 text-slate-500">{u.email}</td>
                <td className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => {
                        setActiveItem(u);
                        setModalMode('edit');
                      }}
                      className="p-1 text-slate-400 hover:text-[#00692B] rounded hover:bg-slate-100"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {u.maNV !== 'NV001' && (
                      <button
                        onClick={() =>
                          setDeleteConfirm({ type: 'user', id: u.maNV, name: u.tenNV })
                        }
                        className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-slate-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // ----------------------------------------------------
  // SUB-TAB 3: NHÓM DANH MỤC CHI PHÍ
  // ----------------------------------------------------
  const renderCostGroups = () => {
    return (
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#00692B] uppercase">
              Quản Trị Nhóm Danh Mục Chi Phí
            </h3>
            <p className="text-xs text-slate-500">Mã nhóm, tên nhóm, mô tả cây phân cấp danh mục</p>
          </div>
          <button
            onClick={() => {
              setActiveItem({ maNhom: '', tenNhom: '', moTa: '', nhomCha: '3002' });
              setModalMode('create');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#FFFCD5] bg-[#00692B] hover:bg-[#005422] rounded transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm Nhóm</span>
          </button>
        </div>

        <table className="w-full text-left text-xs text-slate-700 border-collapse">
          <thead className="bg-slate-100 text-slate-800 font-semibold text-[11px] border-b border-slate-200">
            <tr>
              <th className="py-2.5 px-4 w-12 text-center">STT</th>
              <th className="py-2.5 px-4 w-32">Mã nhóm</th>
              <th className="py-2.5 px-4 w-64">Tên nhóm danh mục</th>
              <th className="py-2.5 px-4">Mô tả nội dung</th>
              <th className="py-2.5 px-4 w-28 text-center">Số loại hàng</th>
              <th className="py-2.5 px-4 text-center w-24">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {costGroups.map((g, idx) => {
              const itemCount = costCatalog.filter(c => c.maNhom === g.maNhom).length;
              return (
                <tr key={g.maNhom} className="hover:bg-emerald-50/30">
                  <td className="py-3 px-4 text-center font-mono text-slate-400">{idx + 1}</td>
                  <td className="py-3 px-4 font-mono font-bold text-[#00692B]">{g.maNhom}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{g.tenNhom}</td>
                  <td className="py-3 px-4 text-slate-600">{g.moTa}</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-[#00692B]">
                    {itemCount}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => {
                          setActiveItem(g);
                          setModalMode('edit');
                        }}
                        className="p-1 text-slate-400 hover:text-[#00692B] rounded hover:bg-slate-100"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          setDeleteConfirm({ type: 'group', id: g.maNhom, name: g.tenNhom })
                        }
                        className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-slate-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // ----------------------------------------------------
  // SUB-TAB 4: DANH MỤC CHI PHÍ (60+ ITEMS TỪ TRANG 4 ĐẾN 14 CỦA PDF)
  // ----------------------------------------------------
  const renderCostCatalog = () => {
    const filtered = costCatalog.filter(
      c =>
        c.maChiPhi.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.tenDanhMuc.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.maNhom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phanLoai.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs space-y-4">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-[#00692B] uppercase">
              Quản Trị Danh Mục Chi Phí ({costCatalog.length} mục chuẩn hóa)
            </h3>
            <p className="text-xs text-slate-500">
              Trích xuất đầy đủ từ trang 4 đến trang 14 trong tài liệu phân tích kỹ thuật
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm mã hoặc tên hàng hóa..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="text-xs bg-white border border-slate-300 rounded pl-7 pr-3 py-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#00692B]"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
            </div>

            <button
              onClick={() => {
                setActiveItem({
                  maChiPhi: '',
                  maNhom: costGroups[0]?.maNhom || '3002-001',
                  tenDanhMuc: '',
                  phanLoai: 'CC-DC',
                });
                setModalMode('create');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#FFFCD5] bg-[#00692B] hover:bg-[#005422] rounded transition-colors whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm Hàng Hóa</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
          <table className="w-full text-left text-xs text-slate-700 border-collapse table-auto md:table-fixed">
            <thead className="bg-slate-100 text-slate-800 font-semibold text-[11px] border-b border-slate-200 sticky top-0 z-10 shadow-xs">
              <tr>
                <th className="py-2.5 px-4 w-12 text-center bg-slate-100">STT</th>
                <th className="py-2.5 px-4 w-36 bg-slate-100">Mã chi phí</th>
                <th className="py-2.5 px-4 w-32 bg-slate-100">Mã nhóm</th>
                <th className="py-2.5 px-4 bg-slate-100">Danh mục hàng hóa/dịch vụ</th>
                <th className="py-2.5 px-4 w-32 bg-slate-100">Phân loại chi phí</th>
                <th className="py-2.5 px-4 text-center w-24 bg-slate-100">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item, idx) => (
                <tr key={item.maChiPhi} className="hover:bg-emerald-50/30">
                  <td className="py-2 px-4 text-center font-mono text-slate-400">{idx + 1}</td>
                  <td className="py-2 px-4 font-mono font-bold text-[#00692B] whitespace-nowrap">
                    {item.maChiPhi}
                  </td>
                  <td className="py-2 px-4 font-mono text-slate-600 whitespace-nowrap">
                    {item.maNhom}
                  </td>
                  <td className="py-2 px-4 font-semibold text-slate-900">{item.tenDanhMuc}</td>
                  <td className="py-2 px-4">
                    <span className="text-[11px] font-bold bg-[#FFFCD5] text-[#00692B] border border-[#82C341]/60 px-2 py-0.5 rounded">
                      {item.phanLoai}
                    </span>
                  </td>
                  <td className="py-2 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => {
                          setActiveItem(item);
                          setModalMode('edit');
                        }}
                        className="p-1 text-slate-400 hover:text-[#00692B] rounded hover:bg-slate-100"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          setDeleteConfirm({
                            type: 'catalog',
                            id: item.maChiPhi,
                            name: item.tenDanhMuc,
                          })
                        }
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
    );
  };

  // ----------------------------------------------------
  // SUB-TAB 5: NHÀ CUNG CẤP (SUPPLIERS)
  // ----------------------------------------------------
  const renderSuppliers = () => {
    return (
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#00692B] uppercase">Danh Mục Nhà Cung Cấp</h3>
            <p className="text-xs text-slate-500">Mã NCC, tên NCC, mã số thuế, hàng hóa/dịch vụ cung cấp</p>
          </div>
          <button
            onClick={() => {
              setActiveItem({
                maNCC: `NCC00${suppliers.length + 1}`,
                tenNCC: '',
                mst: '',
                tenDanhMucHangHoa: '',
                soDienThoai: '',
                diaChi: '',
              });
              setModalMode('create');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#FFFCD5] bg-[#00692B] hover:bg-[#005422] rounded transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm Nhà Cung Cấp</span>
          </button>
        </div>

        <table className="w-full text-left text-xs text-slate-700 border-collapse table-auto md:table-fixed">
          <thead className="bg-slate-100 text-slate-800 font-semibold text-[11px] border-b border-slate-200">
            <tr>
              <th className="py-2.5 px-4 w-12 text-center">STT</th>
              <th className="py-2.5 px-4 w-24">Mã NCC</th>
              <th className="py-2.5 px-4 min-w-[200px]">Tên nhà cung cấp</th>
              <th className="py-2.5 px-4 w-32">Mã số thuế</th>
              <th className="py-2.5 px-4">Tên hàng hóa/dịch vụ cung cấp</th>
              <th className="py-2.5 px-4 text-center w-24">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {suppliers.map((s, idx) => (
              <tr key={s.maNCC} className="hover:bg-emerald-50/30">
                <td className="py-3 px-4 text-center font-mono text-slate-400">{idx + 1}</td>
                <td className="py-3 px-4 font-mono font-bold text-[#00692B]">{s.maNCC}</td>
                <td className="py-3 px-4 font-semibold text-slate-900">
                  <div>{s.tenNCC}</div>
                  <span className="text-[10px] text-slate-400 font-normal">{s.diaChi}</span>
                </td>
                <td className="py-3 px-4 font-mono text-slate-700 font-semibold">{s.mst}</td>
                <td className="py-3 px-4 text-slate-600">{s.tenDanhMucHangHoa}</td>
                <td className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => {
                        setActiveItem(s);
                        setModalMode('edit');
                      }}
                      className="p-1 text-slate-400 hover:text-[#00692B] rounded hover:bg-slate-100"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() =>
                        setDeleteConfirm({ type: 'supplier', id: s.maNCC, name: s.tenNCC })
                      }
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
    );
  };

  // ----------------------------------------------------
  // SUB-TAB 6: ĐƠN VỊ CHỊU CHI PHÍ (COST UNITS)
  // ----------------------------------------------------
  const renderUnits = () => {
    return (
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#00692B] uppercase">Đơn Vị Chịu Chi Phí</h3>
            <p className="text-xs text-slate-500">Mã đơn vị, tên đơn vị, tên đầy đủ pháp nhân</p>
          </div>
          <button
            onClick={() => {
              setActiveItem({
                maDonVi: `DV0${units.length + 1}`,
                tenDonVi: '',
                tenDayDu: '',
                diaChi: '',
              });
              setModalMode('create');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#FFFCD5] bg-[#00692B] hover:bg-[#005422] rounded transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm Đơn Vị</span>
          </button>
        </div>

        <table className="w-full text-left text-xs text-slate-700 border-collapse table-auto md:table-fixed">
          <thead className="bg-slate-100 text-slate-800 font-semibold text-[11px] border-b border-slate-200">
            <tr>
              <th className="py-2.5 px-4 w-12 text-center">STT</th>
              <th className="py-2.5 px-4 w-24">Mã đơn vị</th>
              <th className="py-2.5 px-4 w-44">Tên đơn vị (Viết tắt)</th>
              <th className="py-2.5 px-4">Tên đầy đủ pháp nhân</th>
              <th className="py-2.5 px-4 w-44">Địa bàn / Trụ sở</th>
              <th className="py-2.5 px-4 text-center w-24">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {units.map((u, idx) => (
              <tr key={u.maDonVi} className="hover:bg-emerald-50/30">
                <td className="py-3 px-4 text-center font-mono text-slate-400">{idx + 1}</td>
                <td className="py-3 px-4 font-mono font-bold text-[#00692B]">{u.maDonVi}</td>
                <td className="py-3 px-4 font-bold text-slate-900">{u.tenDonVi}</td>
                <td className="py-3 px-4 text-slate-700">{u.tenDayDu}</td>
                <td className="py-3 px-4 text-slate-500">{u.diaChi || '-'}</td>
                <td className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => {
                        setActiveItem(u);
                        setModalMode('edit');
                      }}
                      className="p-1 text-slate-400 hover:text-[#00692B] rounded hover:bg-slate-100"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() =>
                        setDeleteConfirm({ type: 'unit', id: u.maDonVi, name: u.tenDonVi })
                      }
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
    );
  };

  // ----------------------------------------------------
  // SUB-TAB 7: ĐỐI TƯỢNG CHI PHÍ (COST OBJECTS)
  // ----------------------------------------------------
  const renderCostObjects = () => {
    return (
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#00692B] uppercase">Đối Tượng Chi Phí</h3>
            <p className="text-xs text-slate-500">Mã đối tượng, tên đối tượng, mô tả dự án và khối chức năng</p>
          </div>
          <button
            onClick={() => {
              setActiveItem({
                maDoiTuong: `DT0${costObjects.length + 1}`,
                tenDoiTuong: '',
                moTa: '',
              });
              setModalMode('create');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#FFFCD5] bg-[#00692B] hover:bg-[#005422] rounded transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm Đối Tượng</span>
          </button>
        </div>

        <table className="w-full text-left text-xs text-slate-700 border-collapse table-auto md:table-fixed">
          <thead className="bg-slate-100 text-slate-800 font-semibold text-[11px] border-b border-slate-200">
            <tr>
              <th className="py-2.5 px-4 w-12 text-center">STT</th>
              <th className="py-2.5 px-4 w-32">Mã đối tượng</th>
              <th className="py-2.5 px-4 w-64">Tên đối tượng chi phí</th>
              <th className="py-2.5 px-4">Mô tả mục tiêu</th>
              <th className="py-2.5 px-4 text-center w-24">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {costObjects.map((obj, idx) => (
              <tr key={obj.maDoiTuong} className="hover:bg-emerald-50/30">
                <td className="py-3 px-4 text-center font-mono text-slate-400">{idx + 1}</td>
                <td className="py-3 px-4 font-mono font-bold text-[#00692B]">{obj.maDoiTuong}</td>
                <td className="py-3 px-4 font-semibold text-slate-900">{obj.tenDoiTuong}</td>
                <td className="py-3 px-4 text-slate-600">{obj.moTa}</td>
                <td className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => {
                        setActiveItem(obj);
                        setModalMode('edit');
                      }}
                      className="p-1 text-slate-400 hover:text-[#00692B] rounded hover:bg-slate-100"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() =>
                        setDeleteConfirm({
                          type: 'object',
                          id: obj.maDoiTuong,
                          name: obj.tenDoiTuong,
                        })
                      }
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
    );
  };

  const handleModalSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem) return;

    if (currentSubTab === 'roles') {
      if (modalMode === 'create') addRole(activeItem);
      else updateRole(activeItem.maRole, activeItem);
    } else if (currentSubTab === 'users') {
      if (modalMode === 'create') addUser(activeItem);
      else updateUser(activeItem.maNV, activeItem);
    } else if (currentSubTab === 'groups') {
      if (modalMode === 'create') addCostGroup(activeItem);
      else updateCostGroup(activeItem.maNhom, activeItem);
    } else if (currentSubTab === 'catalog') {
      if (modalMode === 'create') addCatalogItem(activeItem);
      else updateCatalogItem(activeItem.maChiPhi, activeItem);
    } else if (currentSubTab === 'suppliers') {
      if (modalMode === 'create') addSupplier(activeItem);
      else updateSupplier(activeItem.maNCC, activeItem);
    } else if (currentSubTab === 'units') {
      if (modalMode === 'create') addUnit(activeItem);
      else updateUnit(activeItem.maDonVi, activeItem);
    } else if (currentSubTab === 'objects') {
      if (modalMode === 'create') addCostObject(activeItem);
      else updateCostObject(activeItem.maDoiTuong, activeItem);
    }

    setModalMode(null);
    setActiveItem(null);
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirm) return;
    const { type, id } = deleteConfirm;
    if (type === 'role') deleteRole(id);
    else if (type === 'user') deleteUser(id);
    else if (type === 'group') deleteCostGroup(id);
    else if (type === 'catalog') deleteCatalogItem(id);
    else if (type === 'supplier') deleteSupplier(id);
    else if (type === 'unit') deleteUnit(id);
    else if (type === 'object') deleteCostObject(id);

    setDeleteConfirm(null);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Admin Module Banner */}
      <div className="bg-white p-5 rounded-lg border border-emerald-900/10 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-[#00692B] text-lg uppercase tracking-wide">
              THACO AGRI
            </span>
            <span className="text-slate-300">|</span>
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-tight">
              Quản Trị Danh Mục Cơ Sở (Role Quản Trị)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Cấu hình đầy đủ 7 danh mục: Role, Người dùng, Nhóm danh mục chi phí, Danh mục chi phí, Nhà cung cấp, Đơn vị chịu phí, Đối tượng chi phí
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <a
            href="/database_sqlserver_thaco_agri.sql"
            download="database_sqlserver_thaco_agri.sql"
            className="flex items-center gap-1.5 text-xs bg-[#FFFCD5] hover:bg-[#fff9b8] text-[#00692B] font-bold px-3 py-1.5 rounded-lg border border-[#82C341] shadow-2xs transition-colors cursor-pointer"
            title="Tải tệp tin kịch bản CSDL Microsoft SQL Server (.sql)"
          >
            <Database className="w-3.5 h-3.5 text-[#00692B]" />
            <span>Tải file CSDL SQL Server (.sql)</span>
          </a>
          <span className="text-xs bg-[#00692B] text-[#FFFCD5] font-bold px-3 py-1.5 rounded-lg border border-[#82C341]/60 shadow-2xs">
            Role Quản trị tối cao
          </span>
        </div>
      </div>

      {/* Admin Tabs with THACO AGRI Green */}
      <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-lg border border-slate-200">
        <button
          onClick={() => setTab('catalog')}
          className={`px-3 py-2 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
            currentSubTab === 'catalog'
              ? 'bg-[#00692B] text-white shadow-xs'
              : 'text-slate-600 hover:text-[#00692B] hover:bg-white/80'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-[#82C341]" />
          <span>Danh mục chi phí ({costCatalog.length})</span>
        </button>

        <button
          onClick={() => setTab('groups')}
          className={`px-3 py-2 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
            currentSubTab === 'groups'
              ? 'bg-[#00692B] text-white font-bold shadow-xs'
              : 'text-slate-600 hover:text-[#00692B] hover:bg-white/80'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Nhóm danh mục</span>
        </button>

        <button
          onClick={() => setTab('suppliers')}
          className={`px-3 py-2 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
            currentSubTab === 'suppliers'
              ? 'bg-[#00692B] text-white font-bold shadow-xs'
              : 'text-slate-600 hover:text-[#00692B] hover:bg-white/80'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>Nhà cung cấp</span>
        </button>

        <button
          onClick={() => setTab('units')}
          className={`px-3 py-2 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
            currentSubTab === 'units'
              ? 'bg-[#00692B] text-white font-bold shadow-xs'
              : 'text-slate-600 hover:text-[#00692B] hover:bg-white/80'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>Đơn vị chịu chi phí</span>
        </button>

        <button
          onClick={() => setTab('objects')}
          className={`px-3 py-2 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
            currentSubTab === 'objects'
              ? 'bg-[#00692B] text-white font-bold shadow-xs'
              : 'text-slate-600 hover:text-[#00692B] hover:bg-white/80'
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          <span>Đối tượng chi phí</span>
        </button>

        {currentUserPermissions.canManageUsers && (
          <button
            onClick={() => setTab('users')}
            className={`px-3 py-2 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              currentSubTab === 'users'
                ? 'bg-[#00692B] text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-[#00692B] hover:bg-white/80'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Người dùng (Users)</span>
          </button>
        )}

        {currentUserPermissions.canManageRoles && (
          <button
            onClick={() => setTab('roles')}
            className={`px-3 py-2 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              currentSubTab === 'roles'
                ? 'bg-[#00692B] text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-[#00692B] hover:bg-white/80'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Quản lý Role</span>
          </button>
        )}
      </div>

      {currentSubTab === 'catalog' && renderCostCatalog()}
      {currentSubTab === 'groups' && renderCostGroups()}
      {currentSubTab === 'suppliers' && renderSuppliers()}
      {currentSubTab === 'units' && renderUnits()}
      {currentSubTab === 'objects' && renderCostObjects()}
      {currentSubTab === 'users' && renderUsers()}
      {currentSubTab === 'roles' && renderRoles()}

      {/* CRUD Modal */}
      {modalMode && activeItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="p-4 bg-[#00692B] text-white flex items-center justify-between border-b-2 border-[#82C341]">
              <h3 className="text-sm font-bold text-[#FFFCD5]">
                {modalMode === 'create' ? 'Thêm mới bản ghi' : 'Cập nhật bản ghi'} (
                {currentSubTab.toUpperCase()})
              </h3>
              <button
                onClick={() => setModalMode(null)}
                className="text-emerald-100 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleModalSave} className="p-5 space-y-3.5 text-xs">
              {currentSubTab === 'catalog' && (
                <>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Mã chi phí</label>
                    <input
                      type="text"
                      value={activeItem.maChiPhi}
                      onChange={e => setActiveItem({ ...activeItem, maChiPhi: e.target.value })}
                      required
                      disabled={modalMode === 'edit'}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-mono text-slate-900 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Thuộc nhóm</label>
                    <select
                      value={activeItem.maNhom}
                      onChange={e => setActiveItem({ ...activeItem, maNhom: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5"
                    >
                      {costGroups.map(g => (
                        <option key={g.maNhom} value={g.maNhom}>
                          {g.maNhom} - {g.tenNhom}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Tên danh mục hàng hóa/dịch vụ
                    </label>
                    <input
                      type="text"
                      value={activeItem.tenDanhMuc}
                      onChange={e => setActiveItem({ ...activeItem, tenDanhMuc: e.target.value })}
                      required
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Phân loại chi phí
                    </label>
                    <select
                      value={activeItem.phanLoai}
                      onChange={e =>
                        setActiveItem({
                          ...activeItem,
                          phanLoai: e.target.value as CostClassification,
                        })
                      }
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-bold text-[#00692B]"
                    >
                      <option value="CC-DC">CC-DC (Công cụ dụng cụ)</option>
                      <option value="CC-DC/TS">CC-DC/TS (CCDC hoặc Tài sản)</option>
                      <option value="VATTU">VATTU (Vật tư tiêu hao)</option>
                      <option value="TS">TS (Tài sản cố định)</option>
                      <option value="DICHVU">DICHVU (Chi phí dịch vụ)</option>
                      <option value="GIAOTE">GIAOTE (Chi phí giao tế)</option>
                    </select>
                  </div>
                </>
              )}

              {currentSubTab === 'groups' && (
                <>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Mã nhóm</label>
                    <input
                      type="text"
                      value={activeItem.maNhom}
                      onChange={e => setActiveItem({ ...activeItem, maNhom: e.target.value })}
                      required
                      disabled={modalMode === 'edit'}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Tên nhóm</label>
                    <input
                      type="text"
                      value={activeItem.tenNhom}
                      onChange={e => setActiveItem({ ...activeItem, tenNhom: e.target.value })}
                      required
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Mô tả</label>
                    <textarea
                      value={activeItem.moTa}
                      onChange={e => setActiveItem({ ...activeItem, moTa: e.target.value })}
                      rows={2}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5"
                    />
                  </div>
                </>
              )}

              {currentSubTab === 'suppliers' && (
                <>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Mã NCC</label>
                    <input
                      type="text"
                      value={activeItem.maNCC}
                      onChange={e => setActiveItem({ ...activeItem, maNCC: e.target.value })}
                      required
                      disabled={modalMode === 'edit'}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Tên NCC</label>
                    <input
                      type="text"
                      value={activeItem.tenNCC}
                      onChange={e => setActiveItem({ ...activeItem, tenNCC: e.target.value })}
                      required
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Mã số thuế</label>
                    <input
                      type="text"
                      value={activeItem.mst}
                      onChange={e => setActiveItem({ ...activeItem, mst: e.target.value })}
                      required
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Tên hàng hóa/dịch vụ cung cấp
                    </label>
                    <input
                      type="text"
                      value={activeItem.tenDanhMucHangHoa}
                      onChange={e =>
                        setActiveItem({ ...activeItem, tenDanhMucHangHoa: e.target.value })
                      }
                      required
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5"
                    />
                  </div>
                </>
              )}

              {currentSubTab === 'units' && (
                <>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Mã đơn vị</label>
                    <input
                      type="text"
                      value={activeItem.maDonVi}
                      onChange={e => setActiveItem({ ...activeItem, maDonVi: e.target.value })}
                      required
                      disabled={modalMode === 'edit'}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Tên viết tắt (hiển thị bảng biểu)
                    </label>
                    <input
                      type="text"
                      value={activeItem.tenDonVi}
                      onChange={e => setActiveItem({ ...activeItem, tenDonVi: e.target.value })}
                      required
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-bold text-[#00692B]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Tên đầy đủ</label>
                    <input
                      type="text"
                      value={activeItem.tenDayDu}
                      onChange={e => setActiveItem({ ...activeItem, tenDayDu: e.target.value })}
                      required
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5"
                    />
                  </div>
                </>
              )}

              {currentSubTab === 'objects' && (
                <>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Mã đối tượng</label>
                    <input
                      type="text"
                      value={activeItem.maDoiTuong}
                      onChange={e => setActiveItem({ ...activeItem, maDoiTuong: e.target.value })}
                      required
                      disabled={modalMode === 'edit'}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Tên đối tượng</label>
                    <input
                      type="text"
                      value={activeItem.tenDoiTuong}
                      onChange={e => setActiveItem({ ...activeItem, tenDoiTuong: e.target.value })}
                      required
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Mô tả</label>
                    <textarea
                      value={activeItem.moTa}
                      onChange={e => setActiveItem({ ...activeItem, moTa: e.target.value })}
                      rows={2}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5"
                    />
                  </div>
                </>
              )}

              {currentSubTab === 'users' && (
                <>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Mã nhân viên</label>
                    <input
                      type="text"
                      value={activeItem.maNV}
                      onChange={e => setActiveItem({ ...activeItem, maNV: e.target.value })}
                      required
                      disabled={modalMode === 'edit'}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Tên nhân viên</label>
                    <input
                      type="text"
                      value={activeItem.tenNV}
                      onChange={e => setActiveItem({ ...activeItem, tenNV: e.target.value })}
                      required
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Mật khẩu đăng nhập (Hashpass)
                    </label>
                    <input
                      type="text"
                      value={activeItem.hashpass}
                      onChange={e => setActiveItem({ ...activeItem, hashpass: e.target.value })}
                      required
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Role</label>
                    <select
                      value={activeItem.role}
                      onChange={e => setActiveItem({ ...activeItem, role: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-bold text-[#00692B]"
                    >
                      <option value="ADMIN">ADMIN - Role Admin (Đủ tất cả các quyền)</option>
                      <option value="QUAN_TRI">QUAN_TRI - Role Quản trị (Trang chủ, Dashboard, Báo cáo)</option>
                      <option value="QUAN_LY_CHI_PHI">QUAN_LY_CHI_PHI - Role Quản lý chi phí (Tất cả trừ Role & User)</option>
                      <option value="USER">USER - Role Người dùng (Trang chủ & Báo cáo cá nhân)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Phòng ban</label>
                    <input
                      type="text"
                      value={activeItem.phongBan}
                      onChange={e => setActiveItem({ ...activeItem, phongBan: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5"
                    />
                  </div>
                </>
              )}

              {currentSubTab === 'roles' && (
                <>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Mã Role</label>
                    <input
                      type="text"
                      value={activeItem.maRole}
                      onChange={e => setActiveItem({ ...activeItem, maRole: e.target.value })}
                      required
                      disabled={modalMode === 'edit'}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Tên Role</label>
                    <input
                      type="text"
                      value={activeItem.tenRole}
                      onChange={e => setActiveItem({ ...activeItem, tenRole: e.target.value })}
                      required
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Mô tả</label>
                    <textarea
                      value={activeItem.moTa}
                      onChange={e => setActiveItem({ ...activeItem, moTa: e.target.value })}
                      rows={2}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5"
                    />
                  </div>
                </>
              )}

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-[#FFFCD5] bg-[#00692B] hover:bg-[#005422] rounded shadow-xs cursor-pointer"
                >
                  Lưu dữ liệu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-5 border border-slate-200">
            <h4 className="text-sm font-bold text-slate-900 mb-1.5">Xác nhận xóa danh mục?</h4>
            <p className="text-xs text-slate-600 mb-4">
              Bạn có chắc chắn muốn xóa <strong>{deleteConfirm.name}</strong> (Mã: {deleteConfirm.id}) khỏi danh mục hệ thống?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-3 py-1.5 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded cursor-pointer"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
