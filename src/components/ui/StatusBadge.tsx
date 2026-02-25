
import clsx from "clsx";
import { OrderStatus } from "@/types";

const statusStyles: Record<string, string> = {
    new: "bg-blue-100 text-blue-700",
    preparing: "bg-yellow-100 text-yellow-700",
    ready: "bg-green-100 text-green-700",
    delivered: "bg-gray-100 text-gray-700",
    invoiced: "bg-purple-100 text-purple-700",
    advance: "bg-orange-100 text-orange-700",
    paid: "bg-teal-100 text-teal-700",
    unpaid: "bg-red-100 text-red-700",
    draft: "bg-gray-200 text-gray-600",
    cancelled: "bg-red-50 text-red-400",
    overdue: "bg-red-200 text-red-800",
    active: "bg-green-100 text-green-700",
    inactive: "bg-red-100 text-red-700",
};

const statusLabels: Record<string, string> = {
    new: "Nouvelle",
    preparing: "En préparation",
    ready: "Prête",
    delivered: "Livrée",
    invoiced: "Facturée",
    advance: "Avance",
    paid: "Payée",
    unpaid: "Impayée",
    draft: "Brouillon",
    cancelled: "Annulée",
    overdue: "En retard",
    active: "Actif",
    inactive: "Inactif",
};

interface StatusBadgeProps {
    status: OrderStatus | string;
    className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
    return (
        <span className={clsx("px-2.5 py-0.5 rounded-full text-xs font-medium inline-block", statusStyles[status], className)}>
            {statusLabels[status] || status}
        </span>
    );
}
