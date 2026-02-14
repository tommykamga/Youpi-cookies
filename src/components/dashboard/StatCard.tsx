
import { LucideIcon } from "lucide-react";

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: string;
    trendUp?: boolean;
    color?: string; // Tailwind class for text color
}

export default function StatCard({ title, value, icon: Icon, trend, trendUp, color = "text-[var(--cookie-brown)]" }: StatCardProps) {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <h3 className={`text-2xl font-bold mt-2 ${color}`}>{value}</h3>
                </div>
                <div className={`p-3 rounded-full bg-gray-50`}>
                    <Icon className={`h-6 w-6 ${color}`} />
                </div>
            </div>
            {trend && (
                <div className="mt-4 flex items-center text-sm">
                    <span className={trendUp ? "text-green-600" : "text-red-600"}>
                        {trend}
                    </span>
                    <span className="text-gray-400 ml-2">vs dernier mois</span>
                </div>
            )}
        </div>
    );
}
