/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Role,
  User,
  CostGroup,
  CostCatalogItem,
  Supplier,
  CostUnit,
  CostObject,
  ExpenseRecord,
  RolePermissions,
} from '../types';
import {
  initialRoles,
  initialUsers,
  initialCostGroups,
  initialCostCatalog,
  initialSuppliers,
  initialUnits,
  initialCostObjects,
  initialExpenses,
} from '../data/initialData';
import { getRolePermissions } from '../utils/permissionUtils';

interface ExpenseContextType {
  currentUser: User | null;
  currentUserPermissions: RolePermissions;
  users: User[];
  roles: Role[];
  costGroups: CostGroup[];
  costCatalog: CostCatalogItem[];
  suppliers: Supplier[];
  units: CostUnit[];
  costObjects: CostObject[];
  expenses: ExpenseRecord[];
  
  // Auth
  login: (maNV: string, hashpass: string) => boolean;
  logout: () => void;
  switchUser: (maNV: string) => void;

  // Expense CRUD
  addExpense: (expense: Omit<ExpenseRecord, 'id' | 'createdAt'>) => ExpenseRecord;
  updateExpense: (id: string, expense: Partial<ExpenseRecord>) => void;
  deleteExpense: (id: string) => void;

  // Master Data CRUD
  addRole: (role: Role) => void;
  updateRole: (maRole: string, role: Partial<Role>) => void;
  deleteRole: (maRole: string) => void;

  addUser: (user: User) => void;
  updateUser: (maNV: string, user: Partial<User>) => void;
  deleteUser: (maNV: string) => void;

  addCostGroup: (group: CostGroup) => void;
  updateCostGroup: (maNhom: string, group: Partial<CostGroup>) => void;
  deleteCostGroup: (maNhom: string) => void;

  addCatalogItem: (item: CostCatalogItem) => void;
  updateCatalogItem: (maChiPhi: string, item: Partial<CostCatalogItem>) => void;
  deleteCatalogItem: (maChiPhi: string) => void;

  addSupplier: (supplier: Supplier) => void;
  updateSupplier: (maNCC: string, supplier: Partial<Supplier>) => void;
  deleteSupplier: (maNCC: string) => void;

  addUnit: (unit: CostUnit) => void;
  updateUnit: (maDonVi: string, unit: Partial<CostUnit>) => void;
  deleteUnit: (maDonVi: string) => void;

  addCostObject: (obj: CostObject) => void;
  updateCostObject: (maDoiTuong: string, obj: Partial<CostObject>) => void;
  deleteCostObject: (maDoiTuong: string) => void;

  resetToDefaultData: () => void;
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

const STORAGE_KEYS = {
  CURRENT_USER: 'costmaster_current_user',
  USERS: 'costmaster_users',
  ROLES: 'costmaster_roles',
  GROUPS: 'costmaster_groups',
  CATALOG: 'costmaster_catalog',
  SUPPLIERS: 'costmaster_suppliers',
  UNITS: 'costmaster_units',
  OBJECTS: 'costmaster_objects',
  EXPENSES: 'costmaster_expenses',
};

export const ExpenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && ['ADMIN', 'QUAN_TRI', 'QUAN_LY_CHI_PHI', 'USER'].includes(parsed.role)) {
          return parsed;
        }
      } catch {
        // Fall through
      }
    }
    return initialUsers[0];
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USERS);
    if (saved) {
      try {
        const parsed: User[] = JSON.parse(saved);
        const hasOutdatedRoles = parsed.some(u => !['ADMIN', 'QUAN_TRI', 'QUAN_LY_CHI_PHI', 'USER'].includes(u.role));
        if (!hasOutdatedRoles && parsed.length >= 4) {
          return parsed;
        }
      } catch {
        // Fall through
      }
    }
    return initialUsers;
  });

  const [roles, setRoles] = useState<Role[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ROLES);
    if (saved) {
      try {
        const parsed: Role[] = JSON.parse(saved);
        if (parsed.length === 4 && parsed.every(r => r.permissions && ['ADMIN', 'QUAN_TRI', 'QUAN_LY_CHI_PHI', 'USER'].includes(r.maRole))) {
          return parsed;
        }
      } catch {
        // Fall through
      }
    }
    return initialRoles;
  });

  const currentUserPermissions = useMemo(() => {
    return getRolePermissions(currentUser?.role);
  }, [currentUser?.role]);

  const [costGroups, setCostGroups] = useState<CostGroup[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.GROUPS);
    return saved ? JSON.parse(saved) : initialCostGroups;
  });

  const [costCatalog, setCostCatalog] = useState<CostCatalogItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CATALOG);
    return saved ? JSON.parse(saved) : initialCostCatalog;
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SUPPLIERS);
    return saved ? JSON.parse(saved) : initialSuppliers;
  });

  const [units, setUnits] = useState<CostUnit[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.UNITS);
    return saved ? JSON.parse(saved) : initialUnits;
  });

  const [costObjects, setCostObjects] = useState<CostObject[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.OBJECTS);
    return saved ? JSON.parse(saved) : initialCostObjects;
  });

  const [expenses, setExpenses] = useState<ExpenseRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    return saved ? JSON.parse(saved) : initialExpenses;
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ROLES, JSON.stringify(roles));
  }, [roles]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(costGroups));
  }, [costGroups]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CATALOG, JSON.stringify(costCatalog));
  }, [costCatalog]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.UNITS, JSON.stringify(units));
  }, [units]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.OBJECTS, JSON.stringify(costObjects));
  }, [costObjects]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  }, [expenses]);

  // Auth
  const login = (maNV: string, hashpass: string): boolean => {
    const found = users.find(
      u => u.maNV.trim().toLowerCase() === maNV.trim().toLowerCase() && u.hashpass === hashpass
    );
    if (found) {
      setCurrentUser(found);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const switchUser = (maNV: string) => {
    const found = users.find(u => u.maNV === maNV);
    if (found) {
      setCurrentUser(found);
    }
  };

  // Expenses CRUD
  const addExpense = (data: Omit<ExpenseRecord, 'id' | 'createdAt'>): ExpenseRecord => {
    const newRecord: ExpenseRecord = {
      ...data,
      id: `exp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
    };
    setExpenses(prev => [newRecord, ...prev]);
    return newRecord;
  };

  const updateExpense = (id: string, data: Partial<ExpenseRecord>) => {
    setExpenses(prev => prev.map(item => (item.id === id ? { ...item, ...data } : item)));
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(item => item.id !== id));
  };

  // Master Data CRUD
  const addRole = (role: Role) => setRoles(prev => [...prev, role]);
  const updateRole = (maRole: string, role: Partial<Role>) =>
    setRoles(prev => prev.map(r => (r.maRole === maRole ? { ...r, ...role } : r)));
  const deleteRole = (maRole: string) => setRoles(prev => prev.filter(r => r.maRole !== maRole));

  const addUser = (user: User) => setUsers(prev => [...prev, user]);
  const updateUser = (maNV: string, user: Partial<User>) => {
    setUsers(prev => prev.map(u => (u.maNV === maNV ? { ...u, ...user } : u)));
    if (currentUser?.maNV === maNV) {
      setCurrentUser(prev => (prev ? { ...prev, ...user } : null));
    }
  };
  const deleteUser = (maNV: string) => {
    setUsers(prev => prev.filter(u => u.maNV !== maNV));
    if (currentUser?.maNV === maNV) {
      setCurrentUser(null);
    }
  };

  const addCostGroup = (group: CostGroup) => setCostGroups(prev => [...prev, group]);
  const updateCostGroup = (maNhom: string, group: Partial<CostGroup>) =>
    setCostGroups(prev => prev.map(g => (g.maNhom === maNhom ? { ...g, ...group } : g)));
  const deleteCostGroup = (maNhom: string) =>
    setCostGroups(prev => prev.filter(g => g.maNhom !== maNhom));

  const addCatalogItem = (item: CostCatalogItem) => setCostCatalog(prev => [...prev, item]);
  const updateCatalogItem = (maChiPhi: string, item: Partial<CostCatalogItem>) =>
    setCostCatalog(prev => prev.map(c => (c.maChiPhi === maChiPhi ? { ...c, ...item } : c)));
  const deleteCatalogItem = (maChiPhi: string) =>
    setCostCatalog(prev => prev.filter(c => c.maChiPhi !== maChiPhi));

  const addSupplier = (supplier: Supplier) => setSuppliers(prev => [...prev, supplier]);
  const updateSupplier = (maNCC: string, supplier: Partial<Supplier>) =>
    setSuppliers(prev => prev.map(s => (s.maNCC === maNCC ? { ...s, ...supplier } : s)));
  const deleteSupplier = (maNCC: string) =>
    setSuppliers(prev => prev.filter(s => s.maNCC !== maNCC));

  const addUnit = (unit: CostUnit) => setUnits(prev => [...prev, unit]);
  const updateUnit = (maDonVi: string, unit: Partial<CostUnit>) =>
    setUnits(prev => prev.map(u => (u.maDonVi === maDonVi ? { ...u, ...unit } : u)));
  const deleteUnit = (maDonVi: string) => setUnits(prev => prev.filter(u => u.maDonVi !== maDonVi));

  const addCostObject = (obj: CostObject) => setCostObjects(prev => [...prev, obj]);
  const updateCostObject = (maDoiTuong: string, obj: Partial<CostObject>) =>
    setCostObjects(prev => prev.map(o => (o.maDoiTuong === maDoiTuong ? { ...o, ...obj } : o)));
  const deleteCostObject = (maDoiTuong: string) =>
    setCostObjects(prev => prev.filter(o => o.maDoiTuong !== maDoiTuong));

  const resetToDefaultData = () => {
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.ROLES);
    localStorage.removeItem(STORAGE_KEYS.GROUPS);
    localStorage.removeItem(STORAGE_KEYS.CATALOG);
    localStorage.removeItem(STORAGE_KEYS.SUPPLIERS);
    localStorage.removeItem(STORAGE_KEYS.UNITS);
    localStorage.removeItem(STORAGE_KEYS.OBJECTS);
    localStorage.removeItem(STORAGE_KEYS.EXPENSES);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);

    setUsers(initialUsers);
    setRoles(initialRoles);
    setCostGroups(initialCostGroups);
    setCostCatalog(initialCostCatalog);
    setSuppliers(initialSuppliers);
    setUnits(initialUnits);
    setCostObjects(initialCostObjects);
    setExpenses(initialExpenses);
    setCurrentUser(initialUsers[0]);
  };

  return (
    <ExpenseContext.Provider
      value={{
        currentUser,
        currentUserPermissions,
        users,
        roles,
        costGroups,
        costCatalog,
        suppliers,
        units,
        costObjects,
        expenses,
        login,
        logout,
        switchUser,
        addExpense,
        updateExpense,
        deleteExpense,
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
        resetToDefaultData,
      }}
    >
      {children}
    </ExpenseContext.Provider>
  );
};

export const useExpense = (): ExpenseContextType => {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpense must be used within an ExpenseProvider');
  }
  return context;
};
