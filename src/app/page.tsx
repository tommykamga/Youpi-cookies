
import StatCard from "@/components/dashboard/StatCard";
import RecentOrders from "@/components/dashboard/RecentOrders";
import SalesChart from "@/components/dashboard/SalesChart";
import { Banknote, ShoppingBag, AlertTriangle, CheckCircle } from "lucide-react";

export default function Home() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--cookie-brown)]">Tableau de bord</h1>
        <div className="text-sm text-gray-500">
          Dernière mise à jour: Aujourd'hui, 10:45
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Chiffre d'Affaires (Mois)"
          value="1,250,500 FCFA"
          icon={Banknote}
          trend="+12%"
          trendUp={true}
          color="text-green-600"
        />
        <StatCard
          title="Commandes en cours"
          value="12"
          icon={ShoppingBag}
          color="text-blue-600"
        />
        <StatCard
          title="Stock Critique"
          value="3 produits"
          icon={AlertTriangle}
          color="text-red-500"
        />
        <StatCard
          title="Tâches Urgentes"
          value="5"
          icon={CheckCircle}
          color="text-orange-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Section */}
        <div className="lg:col-span-2">
          <SalesChart />
        </div>

        {/* Stock Alert or Quick Tasks */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            Alertes Stock
          </h3>
          <ul className="space-y-3">
            {[
              { name: "Farine de Blé", stock: "2 kg", min: "50 kg" },
              { name: "Pépites Chocolat", stock: "500 g", min: "5 kg" },
              { name: "Beurre Doux", stock: "1 kg", min: "10 kg" },
            ].map((item, i) => (
              <li key={i} className="flex items-center justify-between text-sm p-2 bg-red-50 rounded-lg text-red-700">
                <span>{item.name}</span>
                <span className="font-bold">{item.stock}</span>
              </li>
            ))}
          </ul>
          <button className="text-sm text-red-600 font-medium mt-4 hover:underline">
            Commander du stock &rarr;
          </button>
        </div>
      </div>

      {/* Recent Orders */}
      <RecentOrders />
    </div>
  );
}
