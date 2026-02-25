"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Filter, FileText, Download, Printer, Loader2, ArrowRight, PlusCircle } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import { Invoice } from "@/types";
import { createClient } from "@/lib/supabase";

export default function InvoicesPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionId, setActionId] = useState<string | null>(null);
    const supabase = createClient();

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('invoices')
                .select(`
                    *,
                    order:orders (
                        id,
                        total_amount,
                        status,
                        customer:customers (
                            id,
                            company_name,
                            name,
                            email
                        )
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            setInvoices(data as unknown as Invoice[]);
        } catch (err) {
            console.error("Error fetching invoices:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, []);

    const handleDownload = async (orderId: string) => {
        try {
            setActionId(orderId);
            const response = await fetch(`/api/invoices/${orderId}/pdf`);
            if (!response.ok) throw new Error("Erreur de génération PDF");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Facture-${orderId}.pdf`;
            a.click();
            setTimeout(() => window.URL.revokeObjectURL(url), 100);
        } catch (error) {
            console.error(error);
            alert("Erreur lors du téléchargement.");
        } finally {
            setActionId(null);
        }
    };

    const handlePrint = async (orderId: string) => {
        try {
            setActionId(orderId);
            const response = await fetch(`/api/invoices/${orderId}/pdf`);
            if (!response.ok) throw new Error("Erreur de génération PDF");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            window.open(url, "_blank");
            setTimeout(() => window.URL.revokeObjectURL(url), 100);
        } catch (error) {
            console.error(error);
            alert("Erreur lors de l'impression.");
        } finally {
            setActionId(null);
        }
    };

    const filteredInvoices = invoices.filter(invoice => {
        const customer = invoice.order?.customer;
        const customerName = (customer?.company_name || customer?.name || "").toLowerCase();
        const search = searchTerm.toLowerCase();

        return invoice.id.toLowerCase().includes(search) || customerName.includes(search);
    });

    if (loading && invoices.length === 0) {
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
                    <button className="btn-secondary flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Exporter
                    </button>
                    {/* Auto-generation is handled by DB triggers */}
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
                                <th className="px-6 py-4 font-medium">N° Facture</th>
                                <th className="px-6 py-4 font-medium">Commande</th>
                                <th className="px-6 py-4 font-medium">Client</th>
                                <th className="px-6 py-4 font-medium">Date</th>
                                <th className="px-6 py-4 font-medium">Montant TTC</th>
                                <th className="px-6 py-4 font-medium">Statut</th>
                                <th className="px-6 py-4 font-medium text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredInvoices.length > 0 ? (
                                filteredInvoices.map((invoice) => (
                                    <tr key={invoice.id} className="hover:bg-gray-50 group transition-colors">
                                        <td className="px-6 py-4 font-bold text-[var(--cookie-brown)]">
                                            #{invoice.id}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {invoice.order_id || "N/A"}
                                        </td>
                                        <td className="px-6 py-4 font-medium">
                                            {invoice.order?.customer?.company_name || invoice.order?.customer?.name || "Client Inconnu"}
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
                                                <button
                                                    onClick={() => handleDownload(invoice.order_id)}
                                                    disabled={actionId === invoice.order_id}
                                                    className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-blue-600 disabled:opacity-50"
                                                    title="Télécharger PDF"
                                                >
                                                    {actionId === invoice.order_id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                                </button>
                                                <button
                                                    onClick={() => handlePrint(invoice.order_id)}
                                                    disabled={actionId === invoice.order_id}
                                                    className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-900 flex-shrink-0 disabled:opacity-50"
                                                    title="Imprimer"
                                                >
                                                    <Printer className="h-4 w-4" />
                                                </button>
                                                <Link href={`/commandes/${invoice.order_id}`} className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-[var(--cookie-brown)]" title="Voir Commande">
                                                    <ArrowRight className="h-4 w-4" />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center gap-3">
                                            <p>Aucune facture trouvée.</p>
                                            <p className="text-sm text-gray-400">Les factures sont générées automatiquement lors de la création des commandes.</p>
                                        </div>
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
