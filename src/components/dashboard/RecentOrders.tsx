import { OrderStatus } from "@/types";
import clsx from "clsx";
import { formatPrice } from "@/config/currency";

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

interface RecentOrdersProps {
    orders: any[];
}

export default function RecentOrders({ orders }: RecentOrdersProps) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-gray-800">Commandes Récentes</h3>
                <button className="text-sm text-[var(--cookie-brown)] hover:underline">Voir tout</button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-semibold uppercase tracking-wider text-xs">
                        <tr>
                            <th className="px-6 py-4 font-medium uppercase tracking-wider">ID</th>
                            <th className="px-6 py-4 font-medium uppercase tracking-wider">Client</th>
                            <th className="px-6 py-4 font-medium uppercase tracking-wider">Total</th>
                            <th className="px-6 py-4 font-medium uppercase tracking-wider">Statut</th>
                            <th className="px-6 py-4 font-medium uppercase tracking-wider text-right">Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {orders.map((order) => (
                            <tr key={order.id} className="hover:bg-gray-50 cursor-pointer">
                                <td className="px-6 py-4 font-medium text-gray-900">{order.id}</td>
                                <td className="px-6 py-4">{order.customers?.name || 'Client Inconnu'}</td>
                                <td className="px-6 py-4 font-mono font-medium">{formatPrice(order.total_amount)}</td>
                                <td className="px-6 py-4">
                                    <span className={clsx("px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase", statusStyles[order.status])}>
                                        {statusLabels[order.status]}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-gray-500 text-right text-xs">
                                    {new Date(order.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                                </td>
                            </tr>
                        ))}
                        {orders.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-10 text-center text-gray-400 italic">
                                    Aucune commande récente
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
