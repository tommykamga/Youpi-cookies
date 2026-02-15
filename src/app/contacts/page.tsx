"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, Search, Filter, MoreHorizontal, FileText, Phone, Mail, Globe, MapPin, Building, User, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { Contact, ContactCategory } from "@/types";
import ContactEditModal from "@/components/contacts/ContactEditModal";
import { motion, AnimatePresence } from "framer-motion";

// Removed mock data

export default function ContactsPage() {
    const supabase = createClient();
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedContact, setSelectedContact] = useState<Partial<Contact> | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<ContactCategory | 'ALL'>('ALL');
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    const fetchContacts = async () => {
        setLoading(true);
        const { data } = await supabase.from('customers').select('*').order('company_name');
        if (data) {
            // Map DB fields to UI fields
            const mapped: Contact[] = data.map(c => ({
                id: c.id,
                company: c.company_name || c.name || "Inconnu",
                contactName: c.name || "",
                email: c.email || "",
                niu: c.niu || "",
                rc: c.rc || "",
                mobile: c.phone || "",
                officePhone: "", // Not in DB yet
                address: c.address || "",
                website: c.website || "",
                category: (c.category as ContactCategory) || 'CLIENT',
                createdAt: c.created_at,
                updatedAt: c.updated_at
            }));
            setContacts(mapped);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchContacts();
    }, []);

    const filteredContacts = useMemo(() => {
        return contacts.filter(contact => {
            const matchesTab = activeTab === 'ALL' || contact.category === activeTab;
            const matchesSearch =
                contact.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                contact.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                contact.email.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesTab && matchesSearch;
        });
    }, [contacts, activeTab, searchTerm]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredContacts.length / itemsPerPage);
    const paginatedContacts = filteredContacts.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset page on filter change
    useMemo(() => {
        setCurrentPage(1);
    }, [activeTab, searchTerm]);

    const handleSave = async (contact: Partial<Contact>) => {
        const dbPayload = {
            name: contact.contactName,
            company_name: contact.company,
            email: contact.email,
            phone: contact.mobile,
            address: contact.address,
            niu: contact.niu,
            rc: contact.rc,
            website: contact.website,
            category: contact.category
        };

        if (contact.id) {
            // Update
            const { error } = await supabase.from('customers').update(dbPayload).eq('id', contact.id);
            if (!error) {
                fetchContacts();
            } else {
                console.error("Error updating contact:", error.message, error.details);
                alert(`Erreur lors de la modification du contact: ${error.message}`);
            }
        } else {
            // Create
            const { error } = await supabase.from('customers').insert([dbPayload]);
            if (!error) {
                fetchContacts();
            } else {
                console.error("Error creating contact:", error.message, error.details);
                alert(`Erreur lors de la création du contact: ${error.message}`);
            }
        }
        setIsModalOpen(false);
    };

    const handleDelete = async (id: string) => {
        if (confirm("Êtes-vous sûr de vouloir supprimer ce contact ?")) {
            const { error } = await supabase.from('customers').delete().eq('id', id);
            if (!error) setContacts(prev => prev.filter(c => c.id !== id));
        }
    };

    return (
        <div className="space-y-6">
            <ContactEditModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                contact={selectedContact}
                onSave={handleSave}
            />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-[var(--cookie-brown)] flex items-center gap-3">
                    Annuaire Contacts
                    {loading && <Loader2 className="h-5 w-5 animate-spin text-gray-400" />}
                </h1>
                <button
                    onClick={() => { setSelectedContact(null); setIsModalOpen(true); }}
                    className="btn-primary flex items-center gap-2 shadow-md hover:shadow-lg transform transition-transform hover:-translate-y-0.5"
                >
                    <Plus className="h-4 w-4" />
                    Nouveau Contact
                </button>
            </div>

            {/* Tabs & Search */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
                {/* Tabs */}
                <div className="flex bg-gray-100 p-1 rounded-lg overflow-x-auto max-w-full no-scrollbar">
                    {(['ALL', 'CLIENT', 'FOURNISSEUR', 'PROSPECT', 'ANNUAIRE'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab
                                ? 'bg-white text-[var(--cookie-brown)] shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {tab === 'ALL' ? 'Tous' : tab.charAt(0) + tab.slice(1).toLowerCase() + 's'}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Rechercher..."
                        className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--cookie-brown)]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                    {paginatedContacts.map((contact) => (
                        <motion.div
                            key={contact.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow group relative"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${contact.category === 'CLIENT' ? 'bg-blue-50 text-blue-600' :
                                    contact.category === 'FOURNISSEUR' ? 'bg-purple-50 text-purple-600' :
                                        contact.category === 'PROSPECT' ? 'bg-orange-50 text-orange-600' :
                                            'bg-gray-50 text-gray-600'
                                    }`}>
                                    {contact.category}
                                </span>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => { setSelectedContact(contact); setIsModalOpen(true); }}
                                        className="text-gray-400 hover:text-[var(--cookie-brown)]"
                                    >
                                        <FileText className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-lg font-bold text-gray-500">
                                    {contact.company.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800">{contact.company}</h3>
                                    <p className="text-sm text-gray-500 flex items-center gap-1">
                                        <User className="h-3 w-3" />
                                        {contact.contactName}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm text-gray-600">
                                {contact.email && (
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-gray-400" />
                                        <a href={`mailto:${contact.email}`} className="hover:text-[var(--cookie-brown)]">{contact.email}</a>
                                    </div>
                                )}
                                {contact.mobile && (
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-gray-400" />
                                        <a href={`tel:${contact.mobile}`} className="hover:text-[var(--cookie-brown)]">{contact.mobile}</a>
                                    </div>
                                )}
                                {contact.address && (
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-gray-400" />
                                        <span>{contact.address}</span>
                                    </div>
                                )}
                            </div>

                            {/* Footer IDs */}
                            {(contact.niu || contact.rc) && (
                                <div className="mt-4 pt-4 border-t border-gray-50 flex gap-4 text-xs text-gray-400">
                                    {contact.niu && <span>NIU: {contact.niu}</span>}
                                    {contact.rc && <span>RC: {contact.rc}</span>}
                                </div>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Pagination Controls */}
            {filteredContacts.length > 0 && (
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-gray-100">
                    <div className="text-sm text-gray-500">
                        Affichage {paginatedContacts.length} sur {filteredContacts.length} contact(s)
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Précédent
                        </button>

                        <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${currentPage === page
                                        ? 'bg-[var(--cookie-brown)] text-white'
                                        : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                >
                                    {page}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Suivant
                        </button>
                    </div>
                </div>
            )}

            {filteredContacts.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    Aucun contact trouvé.
                </div>
            )}
        </div>
    );
}
