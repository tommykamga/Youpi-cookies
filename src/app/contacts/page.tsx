"use client";

import { useState, useMemo } from "react";
import { Plus, Search, Filter, MoreHorizontal, FileText, Phone, Mail, Globe, MapPin, Building, User } from "lucide-react";
import { Contact, ContactCategory } from "@/types";
import ContactEditModal from "@/components/contacts/ContactEditModal";
import { motion, AnimatePresence } from "framer-motion";

// Mock Data
const initialContacts: Contact[] = [
    {
        id: "1",
        company: "Boulangerie Paul",
        contactName: "Jean Paul",
        email: "jean@paul.com",
        niu: "M051500000000N",
        rc: "RC/DLA/2020/A/1234",
        mobile: "699000000",
        officePhone: "233000000",
        address: "Akwa, Douala",
        website: "https://boulangerie-paul.com",
        category: "CLIENT",
        createdAt: "2023-01-01",
        updatedAt: "2023-01-01"
    },
    {
        id: "2",
        company: "Farine & Co",
        contactName: "Marc Dumont",
        email: "marc@farine.co",
        niu: "P123456789",
        rc: "RC/YDE/2019/B/5678",
        mobile: "677112233",
        officePhone: "",
        address: "Zone Industrielle, Yaoundé",
        website: "",
        category: "FOURNISSEUR",
        createdAt: "2023-02-15",
        updatedAt: "2023-02-15"
    },
    {
        id: "3",
        company: "Hôtel Sawa",
        contactName: "Directeur Achat",
        email: "achat@hotelsawa.com",
        niu: "",
        rc: "",
        mobile: "699887766",
        officePhone: "233445566",
        address: "Bonanjo, Douala",
        website: "https://hotelsawa.com",
        category: "PROSPECT",
        createdAt: "2023-10-10",
        updatedAt: "2023-10-10"
    }
];

export default function ContactsPage() {
    const [contacts, setContacts] = useState<Contact[]>(initialContacts);
    const [selectedContact, setSelectedContact] = useState<Partial<Contact> | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<ContactCategory | 'ALL'>('ALL');
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

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

    const handleSave = (contact: Partial<Contact>) => {
        if (contact.id) {
            // Update
            setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, ...contact } as Contact : c));
        } else {
            // Create
            const newContact = {
                ...contact,
                id: Math.random().toString(36).substr(2, 9),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            } as Contact;
            setContacts(prev => [...prev, newContact]);
        }
    };

    const handleDelete = (id: string) => {
        if (confirm("Êtes-vous sûr de vouloir supprimer ce contact ?")) {
            setContacts(prev => prev.filter(c => c.id !== id));
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
                <h1 className="text-2xl font-bold text-[var(--cookie-brown)]">Annuaire Contacts</h1>
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
