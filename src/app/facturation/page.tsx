"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Filter, FileText, Download, Printer, Loader2, ArrowRight } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import { Order } from "@/types";
import { createClient } from "@/lib/supabase";


export default function InvoicesPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [invoices, setInvoices] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchInvoices = async () => {
            try {
                // Fetch orders that are considered "invoices" (e.g., delivered, invoiced, paid)
                // We use a left join on customers to ensure valid syntax.
                const { data, error } = await supabase
                    .from('orders')
                    .select('*, customer:customers(*)')
                    .in('status', ['delivered', 'invoiced', 'paid', 'advance'])
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setInvoices(data || []);
            } catch (err) {
                console.error("Error fetching invoices:", err);
                setInvoices([]);
            } finally {
                setLoading(false);
            }
        };

        fetchInvoices();
    }, []);

    const filteredInvoices = invoices.filter(invoice =>
        invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (invoice.customer?.name || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--cookie-brown)]" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-[var(--cookie-brown)]">Facturation</h1>
                <div className="flex gap-2">
                    {/* Placeholder for export/print all */}
                    <button className="btn-secondary flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Exporter
                    </button>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Rechercher une facture..."
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
                                <th className="px-6 py-4 font-medium">N° Facture (Commande)</th>
                                <th className="px-6 py-4 font-medium">Client</th>
                                <th className="px-6 py-4 font-medium">Date</th>
                                <th className="px-6 py-4 font-medium">Montant</th>
                                <th className="px-6 py-4 font-medium">Statut</th>
                                <th className="px-6 py-4 font-medium text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredInvoices.length > 0 ? (
                                filteredInvoices.map((invoice) => (
                                    <tr key={invoice.id} className="hover:bg-gray-50 group transition-colors">
                                        <td className="px-6 py-4 font-bold text-[var(--cookie-brown)]">
                                            #{invoice.id.substring(0, 8).toUpperCase()}
                                        </td>
                                        <td className="px-6 py-4 font-medium">
                                            {invoice.customer?.name || "Client Inconnu"}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">
                                            {new Date(invoice.created_at).toLocaleDateString('fr-FR')}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-gray-900">
                                            {invoice.total_amount?.toLocaleString()} FCFA
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={invoice.status} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-blue-600" title="Télécharger PDF">
                                                    <FileText className="h-4 w-4" />
                                                </button>
                                                <button className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-900" title="Imprimer">
                                                    <Printer className="h-4 w-4" />
                                                </button>
                                                <Link href={`/commandes/${invoice.id}`} className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-[var(--cookie-brown)]" title="Voir Détails">
                                                    <ArrowRight className="h-4 w-4" />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                        Aucune facture trouvée.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
