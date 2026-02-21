"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, Search, Filter, Download, User, MoreHorizontal, AlertTriangle, Eye, EyeOff, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Employee, EmployeeRole } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import EmployeeEditModal from "@/components/rh/EmployeeEditModal";
import { formatPrice } from "@/config/currency";
import { createClient } from "@/lib/supabase";

// Removed mock data

export default function EmployeesPage() {
    const supabase = createClient();
    const [employees, setEmployees] = useState<Partial<Employee>[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<Partial<Employee> | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [salaryVisible, setSalaryVisible] = useState(false);

    // Fetch Employees
    const fetchEmployees = async () => {
        setLoading(true);
        const { data } = await supabase.from('employees').select('*, employee_payments(date)').order('fullName');
        if (data) {
            const mapped = data.map((emp: any) => {
                let maxDate = emp.lastPaymentDate;
                if (emp.employee_payments && emp.employee_payments.length > 0) {
                    const dates = emp.employee_payments.map((p: any) => p.date);
                    const computedMax = dates.reduce((a: string, b: string) => a > b ? a : b);
                    if (!maxDate || computedMax > maxDate) {
                        maxDate = computedMax;
                    }
                }
                return { ...emp, lastPaymentDate: maxDate };
            });
            setEmployees(mapped);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    // Filter Logic
    const filteredEmployees = useMemo(() => {
        return employees.filter(emp => {
            const matchesSearch = emp.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                emp.role?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesRole = roleFilter === 'all' || emp.role === roleFilter;
            return matchesSearch && matchesRole;
        });
    }, [employees, searchTerm, roleFilter]);

    // KPI
    const totalPayroll = filteredEmployees.filter(e => e.active).reduce((sum, e) => sum + (e.salary || 0), 0);
    const activeCount = filteredEmployees.filter(e => e.active).length;

    // Check for late payments (more than 30 days)
    const latePayments = filteredEmployees.filter(e => {
        if (!e.active || !e.lastPaymentDate) return false;
        const lastPay = new Date(e.lastPaymentDate);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - lastPay.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 30;
    }).length;

    // Actions
    const handleEdit = (employee: Partial<Employee>) => {
        setSelectedEmployee(employee);
        setIsModalOpen(true);
    };

    const handleNew = () => {
        setSelectedEmployee(null);
        setIsModalOpen(true);
    };

    const handleSave = async (updated: Partial<Employee>) => {
        if (!updated.id) {
            const { data } = await supabase.from('employees').insert([updated]).select();
            if (data) setEmployees([data[0], ...employees]);
        } else {
            const { error } = await supabase.from('employees').update(updated).eq('id', updated.id);
            if (!error) {
                setEmployees(prev => prev.map(e => e.id === updated.id ? { ...e, ...updated } : e));
            }
        }
        setIsModalOpen(false);
    };

    const handleArchive = async (id: string) => {
        const exitDate = new Date().toISOString().split('T')[0];
        const { error } = await supabase.from('employees').update({ active: false, exitDate }).eq('id', id);
        if (!error) {
            setEmployees(prev => prev.map(e => e.id === id ? { ...e, active: false, exitDate } : e));
        }
        setIsModalOpen(false);
    };

    const handleDuplicate = (emp: Partial<Employee>) => {
        const copy = { ...emp, id: undefined, fullName: `${emp.fullName} (Copie)`, active: true, exitDate: undefined };
        handleNew(); // Ideally pre-fill modal with copy, but for now just open new
        // Better implementation: pass copy to state
        setSelectedEmployee(copy);
        setIsModalOpen(true);
    };

    const calculateSeniority = (dateString?: string) => {
        if (!dateString) return "-";
        const start = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - start.getTime());
        const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30.44));
        const years = Math.floor(diffMonths / 12);
        const months = diffMonths % 12;
        if (years > 0) return `${years} ans ${months} mois`;
        return `${months} mois`;
    };

    return (
        <div className="space-y-6">
            <EmployeeEditModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                employee={selectedEmployee}
                onSave={handleSave}
                onArchive={handleArchive}
                canViewSalary={true} // In real app, check user role
            />

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--cookie-brown)] flex items-center gap-2">
                        <User className="h-6 w-6" /> Ressources Humaines
                    </h1>
                    <div className="flex gap-4 text-sm text-gray-500 mt-1">
                        <span className="flex items-center gap-1">
                            <CheckCircle className="h-4 w-4 text-green-500" /> {activeCount} Actifs
                        </span>
                        <span className="flex items-center gap-1 font-medium text-gray-700">
                            Masse Salariale: {formatPrice(totalPayroll)}
                        </span>
                        {latePayments > 0 && (
                            <span className="flex items-center gap-1 text-red-600 font-bold bg-red-50 px-2 rounded-full">
                                <AlertTriangle className="h-4 w-4" /> {latePayments} Retard Paie
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 flex items-center gap-2 shadow-sm"
                        onClick={() => alert("Génération PDF Bulletin de paie...")}
                    >
                        <Download className="h-4 w-4" /> Export Paie
                    </button>
                    <button
                        onClick={handleNew}
                        className="btn-primary flex items-center gap-2 shadow-md hover:shadow-lg transform transition-transform hover:-translate-y-0.5"
                    >
                        <Plus className="h-4 w-4" />
                        Nouvel Employé
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Rechercher nom, poste..."
                        className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--cookie-brown)]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    className="p-2 border border-gray-200 rounded-lg text-sm w-full sm:w-auto"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                >
                    <option value="all">Tous les postes</option>
                    <option value="Administrateur">Administrateur</option>
                    <option value="GERANT">Gérant</option>
                    <option value="Responsable Commercial">Responsable Commercial</option>
                    <option value="Responsable production et qualité">Responsable production et qualité</option>
                    <option value="Vendeur">Vendeur</option>
                    <option value="Découpe pâte">Découpe pâte</option>
                    <option value="Cuisson">Cuisson</option>
                    <option value="Conditionnement">Conditionnement</option>
                </select>
                <div className="flex items-center gap-2 text-sm text-gray-500 min-w-max">
                    <span className="hidden sm:inline">Salaires:</span>
                    <button
                        onClick={() => setSalaryVisible(!salaryVisible)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title={salaryVisible ? "Masquer salaires" : "Voir salaires"}
                    >
                        {salaryVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                </div>
            </div>

            {/* Data Grid Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 border-b border-gray-100 font-semibold uppercase tracking-wider text-xs">
                            <tr>
                                <th className="px-6 py-4 w-16">Actif</th>
                                <th className="px-6 py-4">Nom Complet</th>
                                <th className="px-6 py-4">Poste</th>
                                <th className="px-6 py-4">Ancienneté</th>
                                <th className="px-6 py-4">Salaire</th>
                                <th className="px-6 py-4">Dernier Paiement</th>
                                <th className="px-6 py-4">Tél</th>
                                <th className="px-6 py-4 w-16"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            <AnimatePresence>
                                {filteredEmployees.map(emp => (
                                    <motion.tr
                                        key={emp.id}
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        whileHover={{ backgroundColor: "rgba(59, 130, 246, 0.05)" }}
                                        drag="x"
                                        dragConstraints={{ left: 0, right: 0 }}
                                        onDragEnd={(event, info) => {
                                            if (info.offset.x < -100) handleArchive(emp.id!);
                                            if (info.offset.x > 100) handleDuplicate(emp);
                                        }}
                                        className="group cursor-pointer"
                                        onClick={() => handleEdit(emp)}
                                    >
                                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                            <div className={`w-3 h-3 rounded-full ${emp.active ? 'bg-green-500' : 'bg-red-400'}`} title={emp.active ? "Actif" : "Inactif"}></div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {emp.fullName}
                                            {!emp.active && <span className="ml-2 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">Inactif</span>}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">{emp.role}</td>
                                        <td className="px-6 py-4 text-gray-500 text-xs">
                                            <div>{calculateSeniority(emp.hireDate)}</div>
                                            <div className="text-[10px] opacity-75">Entrée: {new Date(emp.hireDate!).toLocaleDateString('fr-FR')}</div>
                                        </td>
                                        <td className="px-6 py-4 font-mono font-medium text-gray-700">
                                            {salaryVisible ? formatPrice(emp.salary) : "•••• FCFA"}
                                        </td>
                                        <td className="px-6 py-4">
                                            {emp.lastPaymentDate ? (
                                                <div className={`text-xs ${new Date() > new Date(new Date(emp.lastPaymentDate).setMonth(new Date(emp.lastPaymentDate).getMonth() + 1))
                                                    ? 'text-red-500 font-bold'
                                                    : 'text-green-600'
                                                    }`}>
                                                    {new Date(emp.lastPaymentDate).toLocaleDateString('fr-FR')}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">{emp.phone}</td>
                                        <td className="px-6 py-4 text-center">
                                            <MoreHorizontal className="h-4 w-4 text-gray-400" />
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="text-xs text-center text-gray-400 sm:hidden">
                Swipe gauche pour archiver • Swipe droite pour dupliquer
            </div>
        </div>
    );
}
