/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useExpense } from '../context/ExpenseContext';
import { ShieldCheck, UserCheck, Lock, User, ArrowRight, Sprout } from 'lucide-react';
import { THACO_COLORS } from '../theme/thacoBrand';

export const LoginPage: React.FC = () => {
  const { login, users } = useExpense();
  const [maNV, setMaNV] = useState('NV001');
  const [password, setPassword] = useState('admin123');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const success = login(maNV, password);
    if (!success) {
      setErrorMsg('Mã nhân viên hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại!');
    }
  };

  const handleQuickLogin = (empCode: string, pass: string) => {
    setMaNV(empCode);
    setPassword(pass);
    login(empCode, pass);
  };

  return (
    <div className="min-h-screen bg-[#012A12] flex flex-col justify-center items-center p-4 relative overflow-hidden select-none">
      {/* Background Subtle Gradient matching THACO AGRI */}
      <div className="absolute inset-0 bg-radial from-[#00692B]/30 via-[#012A12] to-[#011E0C] pointer-events-none" />

      {/* Main Login Card */}
      <div className="relative z-10 max-w-md w-full bg-white rounded-2xl shadow-2xl border border-emerald-900/40 overflow-hidden">
        {/* Card Header with THACO AGRI Brand */}
        <div className="bg-[#00692B] p-6 text-white text-center border-b-2 border-[#82C341]">
          <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center mx-auto mb-3 shadow-md">
            <Sprout className="w-7 h-7 text-[#00692B]" />
          </div>
          <h1 className="text-xl font-black tracking-wider uppercase leading-tight">
            THACO<span className="text-[#82C341] ml-1.5">AGRI</span>
          </h1>
          <p className="text-xs text-[#FFFCD5] font-semibold mt-1">
            Hệ Thống Quản Trị Chi Phí Doanh Nghiệp
          </p>
        </div>

        {/* Login Form */}
        <div className="p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Đăng Nhập Hệ Thống</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Sử dụng <strong>mã nhân viên</strong> và <strong>hashpass</strong> để truy cập
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Mã nhân viên
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={maNV}
                  onChange={e => setMaNV(e.target.value)}
                  placeholder="VD: NV001, NV002"
                  required
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2.5 font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#00692B] focus:outline-none uppercase font-bold"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Mật khẩu (Hashpass)
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu..."
                  required
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2.5 font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#00692B] focus:outline-none"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-[#00692B] hover:bg-[#005422] text-[#FFFCD5] font-bold text-xs rounded-lg transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Đăng nhập</span>
              <ArrowRight className="w-4 h-4 text-[#82C341]" />
            </button>
          </form>

          {/* Quick Demo Login Profiles */}
          <div className="pt-4 border-t border-slate-200 space-y-2">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center">
              Tài khoản kiểm thử nhanh (1-chạm)
            </p>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('NV001', 'admin123')}
                className="w-full text-left p-2.5 bg-[#FFFCD5]/30 hover:bg-[#FFFCD5]/80 border border-[#82C341]/60 rounded-lg transition-colors flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-[#00692B] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                    <ShieldCheck className="w-4 h-4 text-[#82C341]" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-[#00692B]">
                      Nguyễn Văn An (Quản trị viên)
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">NV001 · Pass: admin123</div>
                  </div>
                </div>
                <span className="text-[10px] bg-[#00692B] text-[#FFFCD5] font-bold px-2 py-0.5 rounded">
                  Admin
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('NV002', 'user123')}
                className="w-full text-left p-2.5 bg-slate-50 hover:bg-emerald-50/70 border border-slate-200 hover:border-emerald-300 rounded-lg transition-colors flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-emerald-100 text-[#00692B] flex items-center justify-center font-bold text-xs">
                    <UserCheck className="w-4 h-4 text-[#00692B]" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-900 group-hover:text-[#00692B]">
                      Trần Thị Bình (Nhân viên kinh doanh)
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">NV002 · Pass: user123</div>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-100 text-[#00692B] font-semibold px-2 py-0.5 rounded">
                  User
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 text-center text-[11px] text-slate-500">
          Tập đoàn Nông nghiệp THACO AGRI · Kỳ tài chính 2026
        </div>
      </div>
    </div>
  );
};
