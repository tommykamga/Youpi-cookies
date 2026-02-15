"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeft, Printer, Download, Mail, Phone, MapPin, Loader2 } from "lucide-react";
import { Order } from "@/types";
import { createClient } from "@/lib/supabase";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatPrice } from "@/config/currency";


export default function InvoiceDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                // Fetch order with customer and Items
                const { data, error } = await supabase
                    .from('orders')
                    .select('*, customer:customers(*), items:order_items(*, product:products(*))')
                    .eq('id', resolvedParams.id)
                    .single();

                if (error) throw error;
                setOrder(data);
            } catch (err) {
                console.error("Error fetching order details:", err);
                setOrder(null);
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [resolvedParams.id]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--cookie-brown)]" />
            </div>
        );
    }

    if (!order) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-xl font-bold text-gray-800">Facture introuvable</h2>
                <Link href="/facturation" className="text-[var(--cookie-brown)] hover:underline mt-2 inline-block">
                    Retour à la liste
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 print:space-y-0 print:max-w-none print:mx-0">
            {/* Header / Actions - Hidden on Print */}
            <div className="flex items-center justify-between print:hidden">
                <div className="flex items-center gap-4">
                    <Link href="/facturation" className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <h1 className="text-2xl font-bold text-[var(--cookie-brown)]">
                        Détails Facture
                    </h1>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handlePrint}
                        className="btn-secondary flex items-center gap-2"
                    >
                        <Printer className="h-4 w-4" />
                        Imprimer
                    </button>
                    <div className="relative group">
                        <button className="btn-primary flex items-center gap-2">
                            <Download className="h-4 w-4" />
                            Télécharger PDF
                        </button>
                        {/* Tooltip for PDF - implying it uses print behavior for now */}
                        <div className="absolute right-0 mt-2 w-48 bg-gray-800 text-white text-xs rounded p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            Utilisez "Imprimer &gt; Enregistrer au format PDF"
                        </div>
                    </div>
                </div>
            </div>

            {/* Invoice Paper */}
            <div className="bg-white p-8 md:p-12 rounded-xl shadow-sm border border-gray-100 print:shadow-none print:border-none print:p-0">
                {/* Invoice Header */}
                <div className="flex justify-between items-start mb-12">
                    <div>
                        {/* Logo Placeholder */}
                        <div className="w-16 h-16 bg-[var(--cookie-brown)] rounded-lg flex items-center justify-center text-white font-bold text-xl mb-4">
                            YC
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Youpi Cookies</h2>
                        <div className="text-sm text-gray-500 space-y-1 mt-2">
                            <p>123 Avenue des Biscuits</p>
                            <p>Yaoundé, Cameroun</p>
                            <p>+237 6 00 00 00 00</p>
                            <p>contact@youpicookies.com</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h1 className="text-3xl font-bold text-[var(--cookie-brown)] mb-2">FACTURE</h1>
                        <p className="text-lg font-medium text-gray-900">#{order.id.replace('INV-', '')}</p>
                        <div className="mt-4 space-y-1 text-sm">
                            <p className="text-gray-500">Date d'émission: <span className="font-medium text-gray-900">{new Date(order.created_at || Date.now()).toLocaleDateString('fr-FR')}</span></p>
                            <div className="flex items-center justify-end gap-2 mt-2">
                                <StatusBadge status={order.status} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Client Info */}
                <div className="mb-12 p-6 bg-gray-50 rounded-lg border border-gray-100 print:bg-transparent print:border-gray-200">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Facturé à</h3>
                    <div className="flex flex-col md:flex-row justify-between gap-8">
                        <div>
                            <p className="text-lg font-bold text-gray-900">{order.customer?.company_name || order.customer?.name}</p>
                            {order.customer?.company_name && (
                                <p className="text-sm text-gray-600">{order.customer?.name}</p>
                            )}
                            <div className="text-sm text-gray-500 mt-2 space-y-1">
                                <p className="flex items-center gap-2">
                                    <MapPin className="h-3 w-3" />
                                    {order.customer?.address || "Adresse inconnue"}
                                </p>
                                {order.customer?.email && (
                                    <p className="flex items-center gap-2">
                                        <Mail className="h-3 w-3" />
                                        {order.customer?.email}
                                    </p>
                                )}
                                {order.customer?.phone && (
                                    <p className="flex items-center gap-2">
                                        <Phone className="h-3 w-3" />
                                        {order.customer?.phone}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Legal Info (NIU / RC) */}
                        <div className="text-left md:text-right">
                            <div className="space-y-2">
                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-medium">NIU (Identifiant Unique)</p>
                                    <p className="text-sm font-bold text-gray-900 font-mono">{order.customer?.niu || "-"}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-medium">RC (Registre Commerce)</p>
                                    <p className="text-sm font-bold text-gray-900 font-mono">{order.customer?.rc || "-"}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <div className="mb-12">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 border-b border-gray-100 print:bg-gray-100">
                            <tr>
                                <th className="px-4 py-3 font-medium">Description</th>
                                <th className="px-4 py-3 font-medium text-right">Prix Unitaire</th>
                                <th className="px-4 py-3 font-medium text-right">Qté</th>
                                <th className="px-4 py-3 font-medium text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {order.items?.map((item, index) => (
                                <tr key={index}>
                                    <td className="px-4 py-3 font-medium text-gray-900">
                                        {item.product?.name || `Produit #${item.product_id}`}
                                        {item.product?.unit && <span className="text-gray-400 text-xs ml-1">({item.product.unit})</span>}
                                    </td>
                                    <td className="px-4 py-3 text-right text-gray-600">
                                        {formatPrice(item.unit_price)}
                                    </td>
                                    <td className="px-4 py-3 text-right text-gray-600">
                                        {item.quantity}
                                    </td>
                                    <td className="px-4 py-3 text-right font-bold text-gray-900">
                                        {formatPrice(item.quantity * item.unit_price)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Totals */}
                <div className="flex justify-end">
                    <div className="w-64 space-y-3">
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>Total HT</span>
                            <span>{formatPrice(order.total_amount)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>TVA (0%)</span> {/* Assuming 0 or handled elsewhere */}
                            <span>{formatPrice(0)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold text-[var(--cookie-brown)] border-t border-gray-200 pt-3">
                            <span>Total TTC</span>
                            <span>{formatPrice(order.total_amount)}</span>
                        </div>
                    </div>
                </div>

                {/* Footer Notes */}
                <div className="mt-12 pt-8 border-t border-gray-100 text-center text-sm text-gray-500 print:mt-24">
                    <p className="font-medium text-gray-900 mb-1">Merci pour votre confiance !</p>
                    <p>Conditions de paiement : Paiement à réception de facture.</p>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    @page { margin: 0; size: auto; }
                    body { background: white; }
                }
            `}</style>
        </div>
    );
}
