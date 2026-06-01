/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface LeaderboardItem {
  employeeName: string;
  productivityScore: number;
  taskCompletionRate: number;
  deadlineAdherence: number;
  department: string;
}

interface MetricsChartProps {
  leaderboardData: LeaderboardItem[];
}

export default function MetricsChart({ leaderboardData }: MetricsChartProps) {
  // Mock department dataset grouped dynamically
  const deptData = [
    { department: 'Engineering', completed: 88, active: 45, score: 91 },
    { department: 'Product', completed: 92, active: 20, score: 95 },
    { department: 'Marketing', completed: 80, active: 30, score: 80 },
    { department: 'Operations', completed: 95, active: 10, score: 98 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Department Productivity Score Area Chart */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between text-left">
        <div className="mb-4">
          <h3 className="font-sans font-bold text-slate-850 dark:text-white text-lg">Department Efficiency Indices</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500">Comparing real-time task progression rates vs department thresholds</p>
        </div>
        
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={deptData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="opacity-60 dark:hidden" />
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" className="opacity-40 hidden dark:block" />
              <XAxis dataKey="department" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  borderRadius: '12px', 
                  color: '#fff', 
                  border: 'none',
                  fontSize: '12px',
                  fontFamily: 'sans-serif'
                }} 
              />
              <Area 
                type="monotone" 
                dataKey="score" 
                stroke="#4f46e5" 
                strokeWidth={2} 
                fillOpacity={1} 
                fill="url(#colorScore)" 
                name="Productivity Index"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Employee Productivity Leaderboard Bar Chart */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between text-left">
        <div className="mb-4">
          <h3 className="font-sans font-bold text-slate-850 dark:text-white text-lg">Operational Leaderboard Rankings</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500">Total verified productivity score (%) by individual employee user</p>
        </div>

        <div className="h-64 w-full">
          {leaderboardData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-400 dark:text-slate-500">
              No performance reports generated yet for this period.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leaderboardData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="opacity-60 dark:hidden" />
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" className="opacity-40 hidden dark:block" />
                <XAxis dataKey="employeeName" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    borderRadius: '12px', 
                    color: '#fff', 
                    border: 'none',
                    fontSize: '12px',
                    fontFamily: 'sans-serif'
                  }} 
                />
                <Bar 
                  dataKey="productivityScore" 
                  fill="#10b981" 
                  radius={[6, 6, 0, 0]} 
                  name="Health Score"
                  maxBarSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
