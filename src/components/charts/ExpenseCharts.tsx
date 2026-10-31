/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { formatVND } from '../../utils/exportUtils';
import { THACO_COLORS } from '../../theme/thacoBrand';

// 1. Biểu đồ cột tổng chi phí theo 12 tháng (THACO AGRI Colors)
interface MonthlyBarChartProps {
  data: { month: number; label: string; amount: number; count: number }[];
  currentMonth?: number;
}

export const MonthlyBarChart: React.FC<MonthlyBarChartProps> = ({ data, currentMonth = 10 }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const maxVal = Math.max(...data.map(d => d.amount), 10000000);
  const ceiling = Math.ceil(maxVal / 50000000) * 50000000 || 200000000;

  return (
    <div className="w-full bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h4 className="text-xs font-bold text-[#00692B] uppercase tracking-wider">
            Biểu đồ tổng chi phí theo kỳ (Tháng 01 - Tháng 12)
          </h4>
          <p className="text-[11px] text-slate-500 mt-0.5">Phân bổ chi phí lũy kế toàn năm 2026</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 bg-[#00692B] rounded-xs shadow-2xs"></span>
            <span className="font-medium text-[#00692B]">Tháng hiện tại (T{currentMonth})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 bg-[#82C341] rounded-xs"></span>
            <span>Các tháng phát sinh</span>
          </div>
        </div>
      </div>

      <div className="h-64 w-full relative">
        {/* Y-axis ticks background lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[11px] text-slate-400">
          {[1, 0.75, 0.5, 0.25, 0].map((ratio, i) => (
            <div key={i} className="flex items-center w-full">
              <span className="w-16 text-right pr-2 tabular-nums font-mono text-[10px]">
                {ratio === 0 ? '0 đ' : `${(ceiling * ratio / 1000000).toFixed(0)} tr`}
              </span>
              <div className="flex-1 border-b border-slate-100"></div>
            </div>
          ))}
        </div>

        {/* Bars Container */}
        <div className="absolute inset-y-0 left-16 right-2 flex items-end justify-between gap-1 pb-6 pt-2">
          {data.map((item, idx) => {
            const heightPercent = Math.min(100, Math.max(3, (item.amount / ceiling) * 100));
            const isCurrent = item.month === currentMonth;
            const isHovered = hoveredIdx === idx;

            return (
              <div
                key={item.month}
                className="flex-1 h-full flex flex-col items-center justify-end group relative cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Tooltip */}
                {isHovered && (
                  <div className="absolute bottom-[calc(100%-80px)] z-30 bg-[#012A12] text-white text-xs rounded-lg py-1.5 px-3 shadow-lg whitespace-nowrap pointer-events-none transform -translate-x-1/2 left-1/2 border border-[#82C341]/40">
                    <p className="font-bold text-[#FFFCD5]">{item.label}</p>
                    <p className="text-[#82C341] font-mono font-semibold">{formatVND(item.amount)}</p>
                    <p className="text-slate-300 text-[10px]">{item.count} khoản phát sinh</p>
                  </div>
                )}

                {/* Amount Label on Top of Bar if > 0 */}
                {item.amount > 0 && (
                  <span className="text-[10px] font-mono text-[#00692B] font-bold mb-1 tabular-nums whitespace-nowrap">
                    {(item.amount / 1000000).toFixed(1)}tr
                  </span>
                )}

                {/* Bar */}
                <div
                  style={{ height: `${item.amount > 0 ? heightPercent : 3}%` }}
                  className={`w-full max-w-[28px] rounded-t transition-all duration-300 ${
                    isCurrent
                      ? 'bg-[#00692B] hover:bg-[#005422] shadow-2xs'
                      : item.amount > 0
                      ? 'bg-[#82C341] hover:bg-[#74B337]'
                      : 'bg-slate-100'
                  }`}
                />

                {/* X-axis Month Label */}
                <span
                  className={`text-[10px] mt-2 whitespace-nowrap font-mono ${
                    isCurrent ? 'text-[#00692B] font-extrabold' : 'text-slate-500'
                  }`}
                >
                  T{item.month < 10 ? `0${item.month}` : item.month}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// 2. Biểu đồ hình trụ chi phí theo đơn vị kết hợp kỳ (Grouped Column Chart)
interface UnitMonthlyChartProps {
  months: { month: number; label: string }[];
  units: { maDonVi: string; tenDonVi: string; color: string }[];
  matrixData: Record<string, Record<string, number>>;
}

export const UnitMonthlyGroupedChart: React.FC<UnitMonthlyChartProps> = ({
  months,
  units,
  matrixData,
}) => {
  let maxVal = 0;
  units.forEach(u => {
    months.forEach(m => {
      const val = matrixData[u.maDonVi]?.[m.month] || 0;
      if (val > maxVal) maxVal = val;
    });
  });
  const ceiling = Math.ceil((maxVal || 70000000) / 20000000) * 20000000;

  return (
    <div className="w-full bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h4 className="text-xs font-bold text-[#00692B] uppercase tracking-wider">
            Biểu đồ hình trụ: Chi phí theo đơn vị kết hợp kỳ (tháng)
          </h4>
          <p className="text-[11px] text-slate-500 mt-0.5">So sánh chi phí giữa các pháp nhân qua 12 tháng</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {units.map(u => (
            <div key={u.maDonVi} className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs inline-block" style={{ backgroundColor: u.color }} />
              <span className="text-slate-700 font-semibold text-[11px]">{u.tenDonVi}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="h-64 w-full relative">
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[11px] text-slate-400">
          {[1, 0.75, 0.5, 0.25, 0].map((ratio, i) => (
            <div key={i} className="flex items-center w-full">
              <span className="w-14 text-right pr-2 tabular-nums font-mono text-[10px]">
                {ratio === 0 ? '0' : `${(ceiling * ratio / 1000000).toFixed(0)} tr`}
              </span>
              <div className="flex-1 border-b border-slate-100"></div>
            </div>
          ))}
        </div>

        <div className="absolute inset-y-0 left-14 right-2 flex items-end justify-between gap-1 pb-6 pt-2">
          {months.map(m => {
            const hasAnyData = units.some(u => (matrixData[u.maDonVi]?.[m.month] || 0) > 0);

            return (
              <div key={m.month} className="flex-1 h-full flex flex-col items-center justify-end group">
                <div className="w-full flex items-end justify-center gap-0.5 h-[85%]">
                  {units.map(u => {
                    const amt = matrixData[u.maDonVi]?.[m.month] || 0;
                    const heightPct = amt > 0 ? Math.min(100, Math.max(4, (amt / ceiling) * 100)) : 1;

                    return (
                      <div
                        key={u.maDonVi}
                        style={{
                          height: `${heightPct}%`,
                          backgroundColor: amt > 0 ? u.color : '#f1f5f9',
                        }}
                        className="w-2.5 sm:w-3 rounded-t transition-all hover:opacity-80 cursor-pointer relative"
                        title={`${u.tenDonVi} (${m.label}): ${formatVND(amt)}`}
                      />
                    );
                  })}
                </div>

                <span
                  className={`text-[10px] mt-2 font-mono ${
                    hasAnyData ? 'text-[#00692B] font-bold' : 'text-slate-400'
                  }`}
                >
                  T{m.month < 10 ? `0${m.month}` : m.month}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// 3. Biểu đồ hình tròn nhóm hàng hóa/dịch vụ (Donut chart lọc theo tháng)
interface CategoryPieChartProps {
  data: { maNhom: string; tenNhom: string; amount: number; count: number; color: string }[];
  selectedMonth: number;
  onSelectMonth: (month: number) => void;
  totalMonthAmount: number;
}

export const CategoryPieChart: React.FC<CategoryPieChartProps> = ({
  data,
  selectedMonth,
  onSelectMonth,
  totalMonthAmount,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const validData = data.filter(d => d.amount > 0);
  let accumulatedAngle = 0;

  const slices = validData.map(item => {
    const percentage = totalMonthAmount > 0 ? item.amount / totalMonthAmount : 0;
    const angle = percentage * 360;
    const startAngle = accumulatedAngle;
    const endAngle = accumulatedAngle + angle;
    accumulatedAngle = endAngle;

    const radius = 80;
    const innerRadius = 48;
    const cx = 100;
    const cy = 100;

    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = ((endAngle - 90) * Math.PI) / 180;

    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);

    const x3 = cx + innerRadius * Math.cos(endRad);
    const y3 = cy + innerRadius * Math.sin(endRad);
    const x4 = cx + innerRadius * Math.cos(startRad);
    const y4 = cy + innerRadius * Math.sin(startRad);

    const largeArc = angle > 180 ? 1 : 0;

    const pathData =
      angle >= 359.9
        ? `M ${cx} ${cy - radius} A ${radius} ${radius} 0 1 0 ${cx} ${cy + radius} A ${radius} ${radius} 0 1 0 ${cx} ${cy - radius} Z`
        : `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`;

    return {
      ...item,
      percentage,
      pathData,
    };
  });

  return (
    <div className="w-full bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h4 className="text-xs font-bold text-[#00692B] uppercase tracking-wider">
            Tổng chi phí theo nhóm hàng hóa/dịch vụ
          </h4>
          <p className="text-[11px] text-slate-500 mt-0.5">Tỷ trọng chi tiêu phân theo nhóm danh mục</p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-700">Kỳ báo cáo:</label>
          <select
            value={selectedMonth}
            onChange={e => onSelectMonth(Number(e.target.value))}
            className="text-xs bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 font-semibold focus:ring-1 focus:ring-[#00692B] focus:outline-none"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
              <option key={m} value={m}>
                Tháng {m < 10 ? `0${m}` : m} {m === 10 ? '(Tháng hiện tại)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        <div className="md:col-span-5 flex justify-center relative">
          {validData.length === 0 ? (
            <div className="w-48 h-48 rounded-full border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center p-4">
              <span className="text-xs text-slate-400">Không có phát sinh chi phí trong Tháng {selectedMonth}</span>
            </div>
          ) : (
            <div className="relative w-52 h-52">
              <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
                {slices.map((slice, idx) => (
                  <path
                    key={slice.maNhom}
                    d={slice.pathData}
                    fill={slice.color}
                    className="transition-all duration-200 cursor-pointer hover:opacity-90"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  />
                ))}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-2">
                <span className="text-[10px] uppercase text-slate-500 font-bold">Tháng {selectedMonth}</span>
                <span className="text-sm font-extrabold font-mono text-[#00692B] mt-0.5">
                  {(totalMonthAmount / 1000000).toFixed(1)} tr
                </span>
                <span className="text-[10px] text-slate-400 font-medium">VNĐ</span>
              </div>
            </div>
          )}
        </div>

        <div className="md:col-span-7 space-y-2">
          {validData.length === 0 ? (
            <p className="text-xs text-slate-500 italic">Chọn tháng 10 để xem các khoản thực tế phát sinh.</p>
          ) : (
            slices.map((slice, idx) => (
              <div
                key={slice.maNhom}
                className={`p-2.5 rounded-lg border transition-colors flex items-center justify-between text-xs ${
                  hoveredIdx === idx
                    ? 'bg-[#FFFCD5]/80 border-[#82C341]'
                    : 'bg-slate-50/80 border-slate-100'
                }`}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <span className="w-3 h-3 rounded-xs shrink-0" style={{ backgroundColor: slice.color }} />
                  <span className="text-slate-800 font-semibold truncate">{slice.tenNhom}</span>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-mono font-bold text-slate-900">{formatVND(slice.amount)}</span>
                  <span className="text-[#00692B] ml-2 font-mono text-[11px] font-bold">
                    ({(slice.percentage * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// 4. Biểu đồ Top 10 Nhà Cung Cấp Có Chi Phí Cao Nhất
interface TopSuppliersChartProps {
  topSuppliers: {
    maNCC: string;
    tenNCC: string;
    count: number;
    amount: number;
  }[];
}

export const TopSuppliersChart: React.FC<TopSuppliersChartProps> = ({ topSuppliers }) => {
  const maxVal = Math.max(...topSuppliers.map(s => s.amount), 1000000);

  return (
    <div className="w-full bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
      <div className="mb-4">
        <h4 className="text-xs font-bold text-[#00692B] uppercase tracking-wider">
          Biểu đồ hiển thị ra tối đa 10 NCC có chi phí cao nhất
        </h4>
        <p className="text-[11px] text-slate-500 mt-0.5">Xếp hạng giá trị thanh toán theo từng đối tác cung ứng</p>
      </div>

      <div className="space-y-3.5">
        {topSuppliers.slice(0, 10).map((supplier, idx) => {
          const widthPct = Math.min(100, Math.max(4, (supplier.amount / maxVal) * 100));

          return (
            <div key={supplier.maNCC} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate pr-3">
                  <span
                    className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center shrink-0 ${
                      idx === 0
                        ? 'bg-[#00692B] text-[#FFFCD5]'
                        : idx < 3
                        ? 'bg-[#82C341] text-[#012A12]'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <span className="font-semibold text-slate-800 truncate" title={supplier.tenNCC}>
                    {supplier.tenNCC}
                  </span>
                  <span className="text-slate-400 text-[11px] shrink-0 font-normal">
                    ({supplier.count} giao dịch)
                  </span>
                </div>
                <span className="font-mono font-bold text-slate-900 shrink-0">
                  {formatVND(supplier.amount)}
                </span>
              </div>

              {/* Bar track with THACO AGRI green gradient */}
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  style={{
                    width: `${widthPct}%`,
                    background:
                      idx === 0
                        ? 'linear-gradient(90deg, #82C341, #00692B)'
                        : idx < 3
                        ? '#00692B'
                        : '#82C341',
                  }}
                  className="h-full rounded-full transition-all duration-500"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
