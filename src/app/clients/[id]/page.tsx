"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Trash2, Building, Mail, Phone, MapPin } from "lucide-react";
import { Customer } from "@/types";
import { formatPrice } from "@/config/currency";

// Mock Data (Same as in list page for consistency)
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

export default function ClientEditPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const [formData, setFormData] = useState<Partial<Customer>>({});
    const [loading, setLoading] = useState(true);
    const isNewClient = resolvedParams.id === "nouveau";

    useEffect(() => {
        if (isNewClient) {
            setFormData({
                status: "active",
                balance: 0
            });
            setLoading(false);
            return;
        }

        // Simulate fetching data
        const customer = mockCustomers.find(c => c.id === resolvedParams.id);
        if (customer) {
            setFormData(customer);
        }
        setLoading(false);
    }, [resolvedParams.id, isNewClient]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Saving client data:", formData);
        alert(isNewClient ? "Client créé (Simulation)" : "Client sauvegardé (Simulation)");
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Chargement...</div>;
    }

    if (!formData.id && !isNewClient) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-xl font-bold text-gray-800">Client introuvable</h2>
                <Link href="/clients" className="text-[var(--cookie-brown)] hover:underline mt-2 inline-block">
                    Retour à la liste
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/clients" className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-[var(--cookie-brown)]">
                        {isNewClient ? "Nouveau Client" : (formData.name || "Client")}
                    </h1>
                    <p className="text-sm text-gray-500">
                        {isNewClient ? "Création d'un nouveau dossier client" : `ID: ${formData.id}`}
                    </p>
                </div>
                <button
                    onClick={handleSubmit}
                    className="btn-primary flex items-center gap-2 shadow-md hover:shadow-lg transform transition-transform hover:-translate-y-0.5"
                >
                    <Save className="h-4 w-4" />
                    Enregistrer
                </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
                        <h2 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-2 mb-4">
                            Informations Générales
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name || ""}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--cookie-brown)] focus:outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Entreprise (Optionnel)</label>
                                <div className="relative">
                                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="text"
                                        name="company_name"
                                        value={formData.company_name || ""}
                                        onChange={handleChange}
                                        className="pl-9 w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--cookie-brown)] focus:outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email || ""}
                                        onChange={handleChange}
                                        className="pl-9 w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--cookie-brown)] focus:outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone || ""}
                                        onChange={handleChange}
                                        className="pl-9 w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--cookie-brown)] focus:outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address || ""}
                                    onChange={handleChange}
                                    className="pl-9 w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--cookie-brown)] focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
                        <h2 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-2 mb-4">
                            Informations Financières
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">NIU (Numéro Identifiant Unique)</label>
                                <input
                                    type="text"
                                    name="niu"
                                    value={formData.niu || ""}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--cookie-brown)] focus:outline-none"
                                    placeholder="Ex: M0123456789"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">RC (Registre Commerce)</label>
                                <input
                                    type="text"
                                    name="rc"
                                    value={formData.rc || ""}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--cookie-brown)] focus:outline-none"
                                    placeholder="Ex: RC/YAO/2023/B/123"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Solde Actuel</label>
                                <div className="p-2 bg-gray-50 border border-gray-200 rounded-lg font-bold text-gray-700">
                                    {formatPrice(formData.balance)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
                        <h2 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-2 mb-4">
                            État du Compte
                        </h2>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                            <select
                                name="status"
                                value={formData.status || "active"}
                                onChange={handleChange}
                                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--cookie-brown)] focus:outline-none"
                            >
                                <option value="active">Actif</option>
                                <option value="inactive">Inactif</option>
                            </select>
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                            <p className="text-xs text-gray-500 mb-2">Dernière commande</p>
                            <p className="font-medium">{formData.last_order_date || "Aucune"}</p>
                        </div>
                    </div>

                    <div className="bg-red-50 p-6 rounded-xl border border-red-100">
                        <h3 className="text-red-800 font-bold mb-2">Zone de danger</h3>
                        <p className="text-sm text-red-600 mb-4">
                            La suppression d'un client est irréversible et peut affecter les commandes existantes.
                        </p>
                        <button type="button" className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium text-sm">
                            <Trash2 className="h-4 w-4" />
                            Supprimer le client
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
