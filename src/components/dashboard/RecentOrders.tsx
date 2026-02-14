
import { OrderStatus } from "@/types";
import clsx from "clsx";

const recentOrders = [
    { id: "CMD-001", customer: "Alice Dupont", total: "15,000 FCFA", status: "new", date: "10:30" },
    { id: "CMD-002", customer: "Boulangerie Paul", total: "45,000 FCFA", status: "preparing", date: "09:15" },
    { id: "CMD-003", customer: "Jean Martin", total: "8,500 FCFA", status: "ready", date: "Hier" },
    { id: "CMD-004", customer: "Café de la Gare", total: "120,000 FCFA", status: "delivered", date: "Hier" },
    { id: "CMD-005", customer: "Sophie Martin", total: "22,000 FCFA", status: "new", date: "Hier" },
];

const statusStyles: Record<string, string> = {
    new: "bg-blue-100 text-blue-700",
    preparing: "bg-yellow-100 text-yellow-700",
    ready: "bg-green-100 text-green-700",
    delivered: "bg-gray-100 text-gray-700",
    invoiced: "bg-purple-100 text-purple-700",
    paid: "bg-teal-100 text-teal-700",
};

const statusLabels: Record<string, string> = {
    new: "Nouvelle",
    preparing: "En préparation",
    ready: "Prête",
    delivered: "Livrée",
    invoiced: "Facturée",
    paid: "Payée",
};

export default function RecentOrders() {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-gray-800">Commandes Récentes</h3>
                <button className="text-sm text-[var(--cookie-brown)] hover:underline">Voir tout</button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500">
                        <tr>
                            <th className="px-6 py-3 font-medium">ID</th>
                            <th className="px-6 py-3 font-medium">Client</th>
                            <th className="px-6 py-3 font-medium">Total</th>
                            <th className="px-6 py-3 font-medium">Statut</th>
                            <th className="px-6 py-3 font-medium">Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {recentOrders.map((order) => (
                            <tr key={order.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-gray-900">{order.id}</td>
                                <td className="px-6 py-4">{order.customer}</td>
                                <td className="px-6 py-4">{order.total}</td>
                                <td className="px-6 py-4">
                                    <span className={clsx("px-2.5 py-0.5 rounded-full text-xs font-medium", statusStyles[order.status])}>
                                        {statusLabels[order.status]}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-gray-500">{order.date}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
