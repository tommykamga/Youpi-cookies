"use client";

import { useState, useEffect } from "react";
import { Contact, ContactCategory } from "@/types";
import { X, Save, Building, User, Mail, Phone, MapPin, Globe, FileText, Smartphone } from "lucide-react";

interface ContactEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    contact?: Partial<Contact> | null;
    onSave: (contact: Partial<Contact>) => void;
}

export default function ContactEditModal({ isOpen, onClose, contact, onSave }: ContactEditModalProps) {
    const [formData, setFormData] = useState<Partial<Contact>>({
        company: "",
        contactName: "",
        email: "",
        niu: "",
        rc: "",
        mobile: "",
        officePhone: "",
        address: "",
        website: "",
        category: 'CLIENT',
    });

    useEffect(() => {
        if (contact) {
            setFormData(contact);
        } else {
            setFormData({
                company: "",
                contactName: "",
                email: "",
                niu: "",
                rc: "",
                mobile: "",
                officePhone: "",
                address: "",
                website: "",
                category: 'CLIENT',
            });
        }
    }, [contact, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800">
                        {contact?.id ? "Modifier Contact" : "Nouveau Contact"}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Category Selector */}
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">Catégorie</label>
                        <div className="flex flex-wrap gap-3">
                            {(['CLIENT', 'FOURNISSEUR', 'PROSPECT', 'ANNUAIRE'] as ContactCategory[]).map((cat) => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, category: cat }))}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${formData.category === cat
                                            ? 'bg-[var(--cookie-brown)] text-white shadow-md'
                                            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Company Info */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Entreprise</h3>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Nom Entreprise</label>
                                <div className="relative">
                                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="text"
                                        required
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--cookie-brown)] focus:border-transparent outline-none"
                                        value={formData.company || ""}
                                        onChange={e => setFormData({ ...formData, company: e.target.value })}
                                        placeholder="ex: Boulangerie Paul"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">NIU</label>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="text"
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--cookie-brown)] outline-none"
                                        value={formData.niu || ""}
                                        onChange={e => setFormData({ ...formData, niu: e.target.value })}
                                        placeholder="Numéro Identifiant Unique"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">RC</label>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="text"
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--cookie-brown)] outline-none"
                                        value={formData.rc || ""}
                                        onChange={e => setFormData({ ...formData, rc: e.target.value })}
                                        placeholder="Registre Commerce"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Contact Person */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Interlocuteur</h3>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Nom Complet</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="text"
                                        required
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--cookie-brown)] outline-none"
                                        value={formData.contactName || ""}
                                        onChange={e => setFormData({ ...formData, contactName: e.target.value })}
                                        placeholder="ex: Jean Dupont"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="email"
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--cookie-brown)] outline-none"
                                        value={formData.email || ""}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="contact@entreprise.com"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                        {/* Coordinates */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Coordonnées</h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Mobile</label>
                                    <div className="relative">
                                        <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input
                                            type="tel"
                                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--cookie-brown)] outline-none"
                                            value={formData.mobile || ""}
                                            onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                                            placeholder="06..."
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Bureau</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input
                                            type="tel"
                                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--cookie-brown)] outline-none"
                                            value={formData.officePhone || ""}
                                            onChange={e => setFormData({ ...formData, officePhone: e.target.value })}
                                            placeholder="01..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Localisation & Web</h3>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Adresse</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="text"
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--cookie-brown)] outline-none"
                                        value={formData.address || ""}
                                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                                        placeholder="Adresse complète"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Site Web</label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="url"
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--cookie-brown)] outline-none"
                                        value={formData.website || ""}
                                        onChange={e => setFormData({ ...formData, website: e.target.value })}
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2.5 rounded-xl bg-[var(--cookie-brown)] text-white font-medium hover:bg-[var(--cookie-brown-light)] shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                        >
                            <Save className="h-4 w-4" />
                            Enregistrer
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
