
"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DashboardChartProps {
    title: string;
    data: any[];
    dataKey: string;
    nameKey: string;
    color?: string;
    height?: number;
    unit?: string;
}

export default function DashboardChart({ 
    title, 
    data, 
    dataKey, 
    nameKey, 
    color = "#FFB74D", 
    height = 300,
    unit = ""
}: DashboardChartProps) {
    return (
        <div className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-[${height}px]`}>
            <h3 className="font-bold text-gray-800 mb-6">{title}</h3>
            <div className={`h-[${height - 100}px] w-full`}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                        <XAxis 
                            dataKey={nameKey} 
                            tick={{ fontSize: 11, fill: '#9CA3AF' }} 
                            axisLine={false} 
                            tickLine={false} 
                        />
                        <YAxis 
                            tick={{ fontSize: 11, fill: '#9CA3AF' }} 
                            axisLine={false} 
                            tickLine={false} 
                            tickFormatter={(value) => unit ? `${value} ${unit}` : value}
                        />
                        <Tooltip
                            cursor={{ fill: '#F9FAFB' }}
                            contentStyle={{ 
                                borderRadius: '12px', 
                                border: 'none', 
                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                                padding: '12px'
                            }}
                            itemStyle={{ fontWeight: 'bold', fontSize: '13px' }}
                            labelStyle={{ marginBottom: '4px', fontSize: '12px', color: '#6B7280' }}
                        />
                        <Bar 
                            dataKey={dataKey} 
                            fill={color} 
                            radius={[6, 6, 0, 0]} 
                            barSize={data.length > 10 ? 20 : 35} 
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
