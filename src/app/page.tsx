"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import StatCard from "@/components/dashboard/StatCard";
import RecentOrders from "@/components/dashboard/RecentOrders";
import SalesChart from "@/components/dashboard/SalesChart";
import DashboardChart from "@/components/dashboard/DashboardChart";
import { Banknote, ShoppingBag, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { formatPrice } from "@/config/currency";
import { Order, Product, Task } from "@/types";

export default function Home() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    revenue: 0,
    ordersCount: 0,
    stockAlertsCount: 0,
    urgentTasksCount: 0
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [stockAlerts, setStockAlerts] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [monthlyOrdersData, setMonthlyOrdersData] = useState<any[]>([]);
  const [weeklyProductionData, setWeeklyProductionData] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      
      // 1. Revenue (This Month)
      const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const { data: revenueData } = await supabase
        .from('orders')
        .select('total_amount')
        .gte('created_at', firstDayOfMonth);
      const totalRevenue = revenueData?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;

      // 2. Active Orders
      const { count: ordersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .in('status', ['new', 'preparing', 'ready']);

      // 3. Stock Alerts
      const { data: products } = await supabase.from('products').select('*');
      const alerts = products?.filter(p => p.stock <= (p.alert_threshold || 10)) || [];
      
      // 4. Urgent Tasks
      const { count: tasksCount } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('priority', 'high')
        .neq('status', 'done');

      // 5. Recent Orders
      const { data: latestOrders } = await supabase
        .from('orders')
        .select('*, customers(name)')
        .order('created_at', { ascending: false })
        .limit(5);

      // 6. Chart Data (Last 7 Days)
      const last7Days = new Date();
      last7Days.setDate(last7Days.getDate() - 7);
      const { data: salesData } = await supabase
        .from('orders')
        .select('total_amount, created_at')
        .gte('created_at', last7Days.toISOString());

      const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
      const groupedData = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const dayName = days[d.getDay()];
        const total = salesData
          ?.filter(s => new Date(s.created_at).toDateString() === d.toDateString())
          .reduce((sum, s) => sum + (s.total_amount || 0), 0) || 0;
        return { name: dayName, uv: total };
      });

      setStats({
        revenue: totalRevenue,
        ordersCount: ordersCount || 0,
        stockAlertsCount: alerts.length,
        urgentTasksCount: tasksCount || 0
      });
      setRecentOrders(latestOrders || []);
      setStockAlerts(alerts.slice(0, 3));
      setChartData(groupedData);

      // 7. Monthly Orders (Last 12 Months)
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
      twelveMonthsAgo.setDate(1);
      const { data: monthlyData } = await supabase
        .from('orders')
        .select('created_at')
        .gte('created_at', twelveMonthsAgo.toISOString());

      const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
      const groupedMonthly = Array.from({ length: 12 }, (_, i) => {
        const d = new Date(twelveMonthsAgo);
        d.setMonth(d.getMonth() + i);
        const monthName = months[d.getMonth()];
        const count = monthlyData?.filter(o => {
          const od = new Date(o.created_at);
          return od.getMonth() === d.getMonth() && od.getFullYear() === d.getFullYear();
        }).length || 0;
        return { name: monthName, count };
      });
      setMonthlyOrdersData(groupedMonthly);

      // 8. Weekly Production (Last 8 Weeks)
      const eightWeeksAgo = new Date();
      eightWeeksAgo.setDate(eightWeeksAgo.getDate() - (8 * 7));
      const { data: productionData } = await supabase
        .from('stock_movements')
        .select('quantity, created_at')
        .eq('type', 'IN')
        .gte('created_at', eightWeeksAgo.toISOString());

      const groupedWeekly = Array.from({ length: 8 }, (_, i) => {
        const start = new Date(eightWeeksAgo);
        start.setDate(start.getDate() + (i * 7));
        const end = new Date(start);
        end.setDate(end.getDate() + 7);
        
        const weekLabel = `S${i + 1}`;
        const total = productionData
          ?.filter(p => {
            const pd = new Date(p.created_at);
            return pd >= start && pd < end;
          })
          .reduce((sum, p) => sum + (p.quantity || 0), 0) || 0;
        return { name: weekLabel, total };
      });
      setWeeklyProductionData(groupedWeekly);

      setLoading(false);
    };

    fetchDashboardData();
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--cookie-brown)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--cookie-brown)]">Tableau de bord</h1>
        <div className="text-sm text-gray-500">
          Dernière mise à jour: {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Chiffre d'Affaires (Mois)"
          value={formatPrice(stats.revenue)}
          icon={Banknote}
          color="text-green-600"
        />
        <StatCard
          title="Commandes en cours"
          value={stats.ordersCount}
          icon={ShoppingBag}
          color="text-blue-600"
        />
        <StatCard
          title="Stock Critique"
          value={`${stats.stockAlertsCount} produits`}
          icon={AlertTriangle}
          color="text-red-500"
        />
        <StatCard
          title="Tâches Urgentes"
          value={stats.urgentTasksCount}
          icon={CheckCircle}
          color="text-orange-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Section */}
        <div className="lg:col-span-2">
          <SalesChart data={chartData} />
        </div>

        {/* Stock Alert or Quick Tasks */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            Alertes Stock
          </h3>
          <ul className="space-y-3">
            {stockAlerts.map((item, i) => (
              <li key={i} className="flex items-center justify-between text-sm p-2 bg-red-50 rounded-lg text-red-700">
                <span>{item.name}</span>
                <span className="font-bold">{item.stock} {item.unit || 'unités'}</span>
              </li>
            ))}
            {stockAlerts.length === 0 && (
              <li className="text-sm text-gray-500 italic p-2 text-center">Aucune alerte stock</li>
            )}
          </ul>
          <button className="text-sm text-red-600 font-medium mt-4 hover:underline">
            Commander du stock &rarr;
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardChart 
          title="Nombre de commandes mensuelles" 
          data={monthlyOrdersData} 
          dataKey="count" 
          nameKey="name" 
          color="#42A5F5"
        />
        <DashboardChart 
          title="Volumes de production hebdomadaire (Unités)" 
          data={weeklyProductionData} 
          dataKey="total" 
          nameKey="name" 
          color="#66BB6A"
          unit="u"
        />
      </div>

      {/* Recent Orders */}
      <RecentOrders orders={recentOrders} />
    </div>
  );
}
