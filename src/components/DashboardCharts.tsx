/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

interface ChartDataPoint {
  month: string;
  suratMasuk: number;
  suratKeluar: number;
}

export default function DashboardCharts() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const data: ChartDataPoint[] = [
    { month: 'Jan', suratMasuk: 8, suratKeluar: 4 },
    { month: 'Feb', suratMasuk: 12, suratKeluar: 9 },
    { month: 'Mar', suratMasuk: 14, suratKeluar: 15 },
    { month: 'Apr', suratMasuk: 22, suratKeluar: 18 },
    { month: 'May', suratMasuk: 31, suratKeluar: 26 },
  ];

  const maxVal = 35;
  const width = 500;
  const height = 180;
  const paddingX = 40;
  const paddingY = 20;

  // Calculate coordinates for Surat Masuk (Line/Area Chart)
  const getCoordinates = (key: 'suratMasuk' | 'suratKeluar') => {
    return data.map((d, index) => {
      const x = paddingX + (index * (width - 2 * paddingX)) / (data.length - 1);
      const y = height - paddingY - (d[key] * (height - 2 * paddingY)) / maxVal;
      return { x, y, value: d[key], month: d.month };
    });
  };

  const pointsMasuk = getCoordinates('suratMasuk');
  const pointsKeluar = getCoordinates('suratKeluar');

  // SVG Line path strings
  const linePathMasuk = pointsMasuk.reduce((path, p, i) => 
    i === 0 ? `M ${p.x} ${p.y}` : `${path} L ${p.x} ${p.y}`, ''
  );
  
  const linePathKeluar = pointsKeluar.reduce((path, p, i) => 
    i === 0 ? `M ${p.x} ${p.y}` : `${path} L ${p.x} ${p.y}`, ''
  );

  // SVG Area path strings
  const areaPathMasuk = `${linePathMasuk} L ${pointsMasuk[pointsMasuk.length - 1].x} ${height - paddingY} L ${pointsMasuk[0].x} ${height - paddingY} Z`;
  const areaPathKeluar = `${linePathKeluar} L ${pointsKeluar[pointsKeluar.length - 1].x} ${height - paddingY} L ${pointsKeluar[0].x} ${height - paddingY} Z`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
      {/* Chart 1: Surat Masuk per Bulan */}
      <div className="glass rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Statistik Surat Masuk</h3>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">Jumlah surat diterima bulanan (Jan-Mei 2026)</p>
          </div>
          <span className="flex items-center space-x-1.5 text-xs text-blue-500 font-semibold bg-blue-500/10 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
            <span>+40.9% Trend Naik</span>
          </span>
        </div>

        <div className="relative w-full overflow-hidden">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
            <defs>
              <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.01" />
              </linearGradient>
            </defs>

            {/* Grid Lines */}
            {[0, 1, 2, 3].map((g) => {
              const yVal = paddingY + (g * (height - 2 * paddingY)) / 3;
              const label = Math.round(maxVal - (g * maxVal) / 3);
              return (
                <g key={g} className="opacity-40">
                  <line 
                    x1={paddingX} 
                    y1={yVal} 
                    x2={width - paddingX} 
                    y2={yVal} 
                    stroke="currentColor" 
                    strokeWidth="0.5" 
                    className="text-zinc-300 dark:text-zinc-700 stroke-dasharray-4"
                    strokeDasharray="4,4"
                  />
                  <text 
                    x={paddingX - 10} 
                    y={yVal + 3} 
                    fontSize="9px" 
                    className="text-zinc-400 dark:text-zinc-500 font-mono"
                    textAnchor="end"
                    fill="currentColor"
                  >
                    {label}
                  </text>
                </g>
              );
            })}

            {/* Area under curve */}
            <path d={areaPathMasuk} fill="url(#blueGradient)" />

            {/* Main Path */}
            <path 
              d={linePathMasuk} 
              fill="none" 
              stroke="#3B82F6" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              className="drop-shadow-[0_2px_8px_rgba(59,130,246,0.3)]"
            />

            {/* X Axis Labels */}
            {pointsMasuk.map((p, i) => (
              <text 
                key={i} 
                x={p.x} 
                y={height - 2} 
                fontSize="10px" 
                className="text-zinc-400 dark:text-zinc-500 font-medium"
                textAnchor="middle"
                fill="currentColor"
              >
                {data[i].month}
              </text>
            ))}

            {/* Interactable Columns & Dots */}
            {pointsMasuk.map((p, i) => {
              const isHovered = hoveredIndex === i;
              return (
                <g key={i}>
                  {/* Invisible pointer catcher bar */}
                  <rect
                    x={p.x - 20}
                    y={paddingY}
                    width="40"
                    height={height - 2 * paddingY}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                  {/* Draw guide line if hovered */}
                  {isHovered && (
                    <line
                      x1={p.x}
                      y1={paddingY}
                      x2={p.x}
                      y2={height - paddingY}
                      stroke="#06B6D4"
                      strokeWidth="1"
                      strokeDasharray="2,2"
                      className="opacity-60"
                    />
                  )}
                  {/* Indicator Dot */}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isHovered ? 6 : 4}
                    className="transition-all duration-150"
                    fill={isHovered ? '#06B6D4' : '#3B82F6'}
                    stroke="white"
                    strokeWidth="1.5"
                  />
                </g>
              );
            })}
          </svg>

          {/* Floating dynamic tooltip */}
          {hoveredIndex !== null && (
            <div 
              className="absolute pointer-events-none p-2 border border-blue-500/10 rounded-xl bg-white/90 dark:bg-zinc-800/90 shadow-lg text-[10px] space-y-0.5 transition-all duration-150"
              style={{
                left: `${(hoveredIndex * (100 / (data.length - 1)) * 0.8) + 8}%`,
                top: '5px'
              }}
            >
              <div className="font-bold text-zinc-900 dark:text-white">Bulan: {data[hoveredIndex].month}</div>
              <div className="text-blue-500 font-semibold">Surat Masuk: {data[hoveredIndex].suratMasuk} Kategori</div>
            </div>
          )}
        </div>
      </div>

      {/* Chart 2: Surat Keluar per Bulan */}
      <div className="glass rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Statistik Surat Keluar</h3>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">Jumlah surat resmi diterbitkan bulanan (Jan-Mei 2026)</p>
          </div>
          <span className="flex items-center space-x-1.5 text-xs text-indigo-500 font-semibold bg-indigo-500/10 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
            <span>Est. 28 Surat Terbit</span>
          </span>
        </div>

        <div className="relative w-full overflow-hidden">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
            <defs>
              <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.01" />
              </linearGradient>
            </defs>

            {/* Grid Lines */}
            {[0, 1, 2, 3].map((g) => {
              const yVal = paddingY + (g * (height - 2 * paddingY)) / 3;
              const label = Math.round(maxVal - (g * maxVal) / 3);
              return (
                <g key={g} className="opacity-40">
                  <line 
                    x1={paddingX} 
                    y1={yVal} 
                    x2={width - paddingX} 
                    y2={yVal} 
                    stroke="currentColor" 
                    strokeWidth="0.5" 
                    className="text-zinc-300 dark:text-zinc-700 stroke-dasharray-4"
                    strokeDasharray="4,4"
                  />
                  <text 
                    x={paddingX - 10} 
                    y={yVal + 3} 
                    fontSize="9px" 
                    className="text-zinc-400 dark:text-zinc-500 font-mono"
                    textAnchor="end"
                    fill="currentColor"
                  >
                    {label}
                  </text>
                </g>
              );
            })}

            {/* Area under curve */}
            <path d={areaPathKeluar} fill="url(#purpleGradient)" />

            {/* Main Path */}
            <path 
              d={linePathKeluar} 
              fill="none" 
              stroke="#8B5CF6" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              className="drop-shadow-[0_2px_8px_rgba(139,92,246,0.3)]"
            />

            {/* X Axis Labels */}
            {pointsKeluar.map((p, i) => (
              <text 
                key={i} 
                x={p.x} 
                y={height - 2} 
                fontSize="10px" 
                className="text-zinc-400 dark:text-zinc-500 font-medium"
                textAnchor="middle"
                fill="currentColor"
              >
                {data[i].month}
              </text>
            ))}

            {/* Interactable Columns & Dots */}
            {pointsKeluar.map((p, i) => {
              const isHovered = hoveredIndex === i;
              return (
                <g key={i}>
                  {/* Invisible pointer catcher bar */}
                  <rect
                    x={p.x - 20}
                    y={paddingY}
                    width="40"
                    height={height - 2 * paddingY}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                  {/* Draw guide line if hovered */}
                  {isHovered && (
                    <line
                      x1={p.x}
                      y1={paddingY}
                      x2={p.x}
                      y2={height - paddingY}
                      stroke="#A855F7"
                      strokeWidth="1"
                      strokeDasharray="2,2"
                      className="opacity-60"
                    />
                  )}
                  {/* Indicator Dot */}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isHovered ? 6 : 4}
                    className="transition-all duration-150"
                    fill={isHovered ? '#A855F7' : '#8B5CF6'}
                    stroke="white"
                    strokeWidth="1.5"
                  />
                </g>
              );
            })}
          </svg>

          {/* Floating dynamic tooltip */}
          {hoveredIndex !== null && (
            <div 
              className="absolute pointer-events-none p-2 border border-purple-500/10 rounded-xl bg-white/90 dark:bg-zinc-800/90 shadow-lg text-[10px] space-y-0.5 transition-all duration-150"
              style={{
                left: `${(hoveredIndex * (100 / (data.length - 1)) * 0.8) + 8}%`,
                top: '5px'
              }}
            >
              <div className="font-bold text-zinc-900 dark:text-white">Bulan: {data[hoveredIndex].month}</div>
              <div className="text-purple-500 font-semibold">Surat Keluar: {data[hoveredIndex].suratKeluar} Terbit</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
