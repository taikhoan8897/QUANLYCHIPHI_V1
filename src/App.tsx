/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ExpenseProvider, useExpense } from './context/ExpenseContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { DashboardPage } from './pages/DashboardPage';
import { ReportsPage } from './pages/ReportsPage';
import { AdminPage } from './pages/AdminPage';

function MainApp() {
  const { currentUser, currentUserPermissions } = useExpense();
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [adminSubTab, setAdminSubTab] = useState<string>('catalog');

  // If not logged in, show Login Page
  if (!currentUser) {
    return <LoginPage />;
  }

  // Role-based route protection based on the 4 roles:
  // 1. Role Admin: Full access (home, dashboard, reports, admin)
  // 2. Role Quản trị: home, dashboard, reports
  // 3. Role Quản lý chi phí: home, dashboard, reports, admin (master data only)
  // 4. Role Người dùng: home, reports (self data only)
  let effectiveTab = currentTab;
  if (currentTab === 'dashboard' && !currentUserPermissions.canAccessDashboard) {
    effectiveTab = 'home';
  } else if (currentTab === 'admin' && !currentUserPermissions.canAccessAdmin) {
    effectiveTab = 'home';
  }

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden text-slate-800">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={effectiveTab}
        onSelectTab={tab => setCurrentTab(tab)}
        adminSubTab={adminSubTab}
        onSelectAdminSubTab={subTab => setAdminSubTab(subTab)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header currentTab={effectiveTab} />

        <main className="flex-1 overflow-y-auto custom-scrollbar">
          {effectiveTab === 'home' && <HomePage />}
          {effectiveTab === 'dashboard' && currentUserPermissions.canAccessDashboard && (
            <DashboardPage />
          )}
          {effectiveTab === 'reports' && currentUserPermissions.canAccessReports && (
            <ReportsPage />
          )}
          {effectiveTab === 'admin' && currentUserPermissions.canAccessAdmin && (
            <AdminPage
              activeSubTab={adminSubTab}
              onSelectSubTab={subTab => setAdminSubTab(subTab)}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ExpenseProvider>
      <MainApp />
    </ExpenseProvider>
  );
}
