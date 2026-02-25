"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Printer, Download, Mail, Phone, MapPin, Loader2 } from "lucide-react";
import { Order } from "@/types";
import { createClient } from "@/lib/supabase";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatPrice } from "@/config/currency";


export default function InvoiceDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const searchParams = useSearchParams();
    const supabase = createClient();

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const { id } = await resolvedParams;
                const { data, error } = await supabase
                    .from('orders')
                    .select(`
                        *,
                        customer:customers(*),
                        items:order_items(
                            *,
                            product:products(*)
                        )
                    `)
                    .eq('id', id)
                    .single();

                if (error) throw error;
                if (data) setOrder(data);
            } catch (err) {
                console.error("Error fetching order:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [resolvedParams, supabase]);
    useEffect(() => {
        if (!loading && order && searchParams.get('download') === 'true') {
            const timer = setTimeout(() => {
                handleDownloadPDF();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [loading, order, searchParams]);

    const handleWhatsApp = async () => {
        if (!order || !order.customer?.phone) {
            alert("Numéro de téléphone client manquant.");
            return;
        }

        setSending(true);
        try {
            // 1. Fetch PDF from API
            const pdfResponse = await fetch(`/api/invoices/${order.id}/pdf`);
            if (!pdfResponse.ok) {
                const errData = await pdfResponse.json().catch(() => ({}));
                throw new Error(errData.error || "Failed to generate PDF");
            }

            const pdfBlob = await pdfResponse.blob();

            // 2. Upload to Supabase
            const fileName = `INV-${order.id}-${Date.now()}.pdf`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('invoices')
                .upload(fileName, pdfBlob, {
                    contentType: 'application/pdf',
                    upsert: true
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('invoices')
                .getPublicUrl(fileName);

            // 3. Send via WhatsApp API
            const response = await fetch('/api/whatsapp/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'invoice',
                    phone: order.customer.phone,
                    orderId: order.id,
                    pdfUrl: publicUrl,
                    customerName: order.customer.name || order.customer.company_name,
                    invoiceId: order.id.replace('INV-', '')
                })
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "Erreur envoi WhatsApp");

            alert("Facture envoyée sur WhatsApp !");

        } catch (error: any) {
            console.error("WhatsApp Error:", error);
            alert(`Erreur: ${error.message}`);
        } finally {
            setSending(false);
        }
    };

    const handleDownloadPDF = async () => {
        setDownloading(true);
        try {
            const response = await fetch(`/api/invoices/${order?.id}/pdf`);
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || "Échec de génération du PDF");
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);

            // Ouvrir dans un nouvel onglet ou télécharger
            const link = document.createElement("a");
            link.href = url;
            link.download = `Facture-${order?.id || 'Inconnue'}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Clean up
            setTimeout(() => window.URL.revokeObjectURL(url), 100);

        } catch (error: any) {
            console.error("PDF Download Error:", error);
            alert(`Erreur lors de la génération du PDF: ${error.message}`);
        } finally {
            setDownloading(false);
        }
    };

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

                    <button
                        onClick={handleWhatsApp}
                        disabled={sending}
                        className="bg-[#25D366] hover:bg-[#128C7E] text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Phone className="h-4 w-4" />}
                        WhatsApp
                    </button>

                    <div className="relative group">
                        <button
                            onClick={handleDownloadPDF}
                            disabled={downloading}
                            className="btn-primary flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                            Télécharger PDF
                        </button>
                    </div>
                </div>
            </div>

            {/* Invoice Paper */}
            <div id="invoice-content" className="bg-white p-8 md:p-12 rounded-xl shadow-sm border border-gray-100 print:shadow-none print:border-none print:p-0">
                {/* Invoice Header */}
                <div className="flex justify-between items-start mb-12">
                    <div>
                        <h2 className="text-2xl font-bold text-[#0f766e]">YELELE DIGIT MARK SARL</h2>
                        <div className="text-sm text-gray-500 space-y-1 mt-2 font-medium">
                            <p>12498 Bonabéri, Face DK Hotel</p>
                            <p>Douala, Cameroun</p>
                            <p>+237 6 98 08 31 74 / +237 6 82 22 77 91</p>
                            <p>yeleledigitmark@yahoo.fr</p>
                        </div>
                    </div>

                    <div className="text-right">
                        <h1 className="text-4xl font-black text-[#f59e0b] mb-2 tracking-wide">FACTURE</h1>
                        <p className="text-xl font-bold text-gray-800">#{order.id.replace('INV-', '')}</p>
                        <div className="mt-6 space-y-2 text-sm">
                            <p className="text-gray-500">Date d'émission</p>
                            <p className="font-bold text-gray-900 text-lg">
                                {new Date(order.created_at || Date.now()).toLocaleDateString('fr-FR')}
                            </p>
                            <div className="flex items-center justify-end gap-2 mt-4">
                                <StatusBadge status={order.status} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Client Info */}
                <div className="mb-12 p-8 bg-gray-50/50 rounded-2xl border border-gray-100 print:bg-transparent print:border-gray-200">
                    <h3 className="text-xs font-bold text-[#0f766e] uppercase tracking-widest mb-6 border-b border-[#0f766e]/20 pb-2 w-full">Facturé à</h3>
                    <div className="flex flex-col md:flex-row justify-between gap-8">
                        <div>
                            <p className="text-xl font-bold text-gray-900 mb-1">{order.customer?.company_name || order.customer?.name}</p>
                            {order.customer?.company_name && (
                                <p className="text-md text-gray-600 mb-2">{order.customer?.name}</p>
                            )}
                            <div className="text-sm text-gray-500 space-y-1">
                                <p className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-[#f59e0b]" />
                                    {order.customer?.address || "Adresse inconnue"}
                                </p>
                                {order.customer?.email && (
                                    <p className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-[#f59e0b]" />
                                        {order.customer?.email}
                                    </p>
                                )}
                                {order.customer?.phone && (
                                    <p className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-[#f59e0b]" />
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
                        <thead className="bg-[#0f766e] text-white border-b border-[#0f766e] print:bg-[#0f766e] print:text-white">
                            <tr>
                                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Description</th>
                                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs text-right">Prix Unitaire</th>
                                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs text-right">Qté</th>
                                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs text-right">Total</th>
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
                <div className="mt-20 text-center text-sm text-gray-500 mb-8 print:mb-4">
                    <p className="font-medium text-gray-900 mb-1">Merci pour votre confiance !</p>
                </div>

                {/* New Design Footer - Full Width & Compact */}
                <div className="-mx-8 -mb-8 md:-mx-12 md:-mb-12 mt-8 bg-gradient-to-br from-[#0f766e] to-[#115e59] text-white p-6 border-t-4 border-[#f59e0b] font-sans print:break-inside-avoid rounded-b-xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                        <div className="space-y-2">
                            <h3 className="font-bold text-lg uppercase tracking-widest text-[#fbbf24]">YELELE DIGIT MARK SARL</h3>
                            <div className="flex flex-col gap-0.5">
                                <p className="text-xs text-teal-100/90 font-medium">NUI : M032118534812X</p>
                                <p className="text-xs text-teal-100/90 font-medium">RCCM : RC/DLA/2021/B/1417</p>
                            </div>
                            <div className="pt-2 flex flex-col gap-1">
                                <p className="text-sm flex items-center gap-2">
                                    <span className="bg-[#f59e0b] text-[#0f766e] rounded-full p-0.5 text-[10px]">📞</span>
                                    <span className="font-bold">+237 652 15 76 57</span>
                                </p>
                                <p className="text-sm flex items-center gap-2">
                                    <span className="bg-[#f59e0b] text-[#0f766e] rounded-full p-0.5 text-[10px]">✉️</span>
                                    yeleledigitmark@yahoo.fr
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h4 className="font-bold text-[#f59e0b] uppercase text-xs tracking-widest mb-2 border-b border-teal-500 pb-1 w-full">Détails Bancaires</h4>
                            <div className="grid grid-cols-[90px_1fr] gap-y-1 gap-x-2 text-sm">
                                <span className="text-teal-200 text-xs">Intitulé :</span>
                                <span className="font-bold text-white tracking-wide text-xs">YELELE DIGIT MARK SARL</span>

                                <span className="text-teal-200 text-xs">N° Compte :</span>
                                <span className="font-bold text-[#f59e0b] text-base tracking-wider">00271578301</span>

                                <span className="text-teal-200 text-xs">Code guichet :</span>
                                <span className="font-mono bg-white/10 px-1.5 rounded text-white text-xs w-fit">10035</span>

                                <span className="text-teal-200 text-xs">Code banque :</span>
                                <span className="font-mono bg-white/10 px-1.5 rounded text-white text-xs w-fit">10039</span>
                            </div>
                        </div>
                    </div>
                    <div className="text-center text-[10px] text-teal-200/60 pt-2 border-t border-teal-600/50 uppercase tracking-widest">
                        Cookies by Yelele
                    </div>
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
