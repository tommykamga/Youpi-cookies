"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search, Filter, MoreHorizontal, Mail, Phone, MapPin, ArrowRight } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatPrice } from "@/config/currency";
import { Customer } from "@/types";

// Mock Data
const mockCustomers: Customer[] = [
    {
        id: "CLI-001",
        name: "Alice Dupont",
        email: "alice@example.com",
        phone: "06 12 34 56 78",
        address: "123 Rue de la Paix, 75000 Paris",
        balance: 0,
        status: "active",
        last_order_date: "2023-10-25"
    },
    {
        id: "CLI-002",
        name: "Boulangerie Paul",
        company_name: "Paul SAS",
        email: "contact@boulangerie-paul.fr",
        phone: "01 45 67 89 10",
        address: "45 Avenue des Champs-Élysées, 75008 Paris",
        balance: 12000,
        status: "active",
        last_order_date: "2023-10-25"
    },
    {
        id: "CLI-003",
        name: "Jean Martin",
        email: "jean.martin@email.com",
        phone: "07 98 76 54 32",
        address: "8 Place de la République, 75011 Paris",
        balance: 0,
        status: "inactive",
        last_order_date: "2023-09-15"
    },
    {
        id: "CLI-004",
        name: "Café de la Gare",
        company_name: "SARL Café Gare",
        email: "manager@cafegare.com",
        phone: "04 78 90 12 34",
        address: "1 Place de la Gare, 69002 Lyon",
        balance: 5000,
        status: "active",
        last_order_date: "2023-10-24"
    },
    {
        id: "CLI-005",
        name: "Sophie Martin",
        email: "sophie.m@example.com",
        phone: "06 11 22 33 44",
        address: "10 Rue des Fleurs, 31000 Toulouse",
        balance: 0,
        status: "active",
        last_order_date: "2023-10-23"
    },
];

export default function ClientsPage() {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredCustomers = mockCustomers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-[var(--cookie-brown)]">Clients</h1>
                <Link
                    href="/clients/nouveau"
                    className="btn-primary flex items-center gap-2 shadow-md hover:shadow-lg transform transition-transform hover:-translate-y-0.5"
                >
                    <Plus className="h-4 w-4" />
                    Nouveau Client
                </Link>
            </div>

            {/* Filters & Search */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Rechercher par nom, entreprise ou email..."
                        className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--cookie-brown)]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 text-gray-600">
                        <Filter className="h-4 w-4" />
                        Filtrer
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-medium">Client / Entreprise</th>
                                <th className="px-6 py-4 font-medium">Contact</th>
                                <th className="px-6 py-4 font-medium">Localisation</th>
                                <th className="px-6 py-4 font-medium">Statut</th>
                                <th className="px-6 py-4 font-medium text-right">Solde</th>
                                <th className="px-6 py-4 font-medium text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredCustomers.map((customer) => (
                                <tr key={customer.id} className="hover:bg-gray-50 group transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-[var(--cookie-cream)] flex items-center justify-center text-[var(--cookie-brown)] font-bold text-lg">
                                                {customer.name.substring(0, 1).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-bold text-[var(--cookie-brown)]">{customer.name}</div>
                                                {customer.company_name && (
                                                    <div className="text-xs text-gray-400 font-medium">{customer.company_name}</div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">
                                        <div className="flex flex-col gap-1">
                                            {customer.email && (
                                                <div className="flex items-center gap-1.5 text-xs">
                                                    <Mail className="h-3 w-3 text-gray-400" />
                                                    {customer.email}
                                                </div>
                                            )}
                                            {customer.phone && (
                                                <div className="flex items-center gap-1.5 text-xs">
                                                    <Phone className="h-3 w-3 text-gray-400" />
                                                    {customer.phone}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 max-w-xs truncate" title={customer.address}>
                                        <div className="flex items-center gap-1.5">
                                            <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                            <span className="truncate">{customer.address || "-"}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={customer.status} />
                                    </td>
                                    <td className={`px-6 py-4 text-right font-bold ${customer.balance > 0 ? 'text-red-500' : 'text-green-600'}`}>
                                        {formatPrice(customer.balance)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Link
                                                href={`/clients/${customer.id}`}
                                                className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-[var(--cookie-brown)]"
                                                title="Voir/Modifier Client"
                                            >
                                                <ArrowRight className="h-4 w-4" />
                                            </Link>
                                            <button className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-[var(--cookie-accent)]" title="Plus d'actions">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Placeholder */}
                <div className="p-4 border-t border-gray-100 flex justify-between items-center text-sm text-gray-500">
                    <span>Affichage 1-{filteredCustomers.length} sur {filteredCustomers.length} clients</span>
                    <div className="flex gap-2">
                        <button className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50" disabled>Précédent</button>
                        <button className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50" disabled>Suivant</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
