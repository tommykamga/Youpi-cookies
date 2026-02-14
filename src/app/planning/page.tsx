"use client";

import { useState, useMemo } from "react";
import { Plus, Search, Filter, CheckCircle, Clock, AlertCircle, MoreHorizontal, Calendar, ArrowRight, Copy, Check, Trash2, LayoutList, Kanban, BookTemplate, Zap } from "lucide-react";
import { Task } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import TaskEditModal from "@/components/tasks/TaskEditModal";

// Mock Data
const initialTasks: Partial<Task>[] = [
    { id: "t1", title: "Relancer Client Martin", assigned_to: "Toi (Admin)", due_date: "2026-02-14", priority: "high", status: "todo", description: "Attente confirmation devis" },
    { id: "t2", title: "Préparer commande #456", assigned_to: "Préparateur", due_date: "2026-02-13", priority: "medium", status: "in_progress", description: "Commande urgente pour weekend" },
    { id: "t3", title: "Achat farine 50kg", assigned_to: "Gérant", due_date: "2026-02-16", priority: "low", status: "todo", description: "Stock bas" },
    { id: "t4", title: "Nettoyage Four 2", assigned_to: "Préparateur", due_date: "2026-02-13", priority: "medium", status: "done", description: "Maintenance hebdo" }
];

export default function TasksPage() {
    const [tasks, setTasks] = useState(initialTasks);
    const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Partial<Task> | null>(null);

    // Filters
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    // KPI
    const urgentTasksCount = tasks.filter(t => t.priority === 'high' && t.status !== 'done').length;

    // Filter Logic
    const filteredTasks = useMemo(() => {
        return tasks.filter(t => {
            const matchesSearch = t.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.assigned_to?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'all' ||
                (statusFilter === 'active' ? t.status !== 'done' : t.status === statusFilter);
            return matchesSearch && matchesStatus;
        }).sort((a, b) => {
            // Sort by priority (high > medium > low) then date
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            const pA = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
            const pB = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
            return pB - pA;
        });
    }, [tasks, searchTerm, statusFilter]);

    // Actions
    const handleEdit = (task: Partial<Task>) => {
        setSelectedTask(task);
        setIsModalOpen(true);
    };

    const handleNewTask = (template?: Partial<Task>) => {
        setSelectedTask(template || {});
        setIsModalOpen(true);
    };

    const handleSave = (updated: Partial<Task>) => {
        if (!updated.id) {
            // Create
            updated.id = Math.random().toString(36).substr(2, 9);
            updated.created_at = new Date().toISOString();
            setTasks([updated, ...tasks]);
        } else {
            // Update
            setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
        }
    };

    const handleDelete = (id: string) => {
        setTasks(prev => prev.filter(t => t.id !== id));
        setIsModalOpen(false);
    };

    const handleDuplicate = (task: Partial<Task>) => {
        const copy = { ...task, id: undefined, title: `${task.title} (Copie)` };
        handleNewTask(copy);
    };

    const toggleStatus = (id: string) => {
        setTasks(prev => prev.map(t =>
            t.id === id ? { ...t, status: t.status === 'done' ? 'todo' : 'done' } : t
        ));
    };

    // Quick Templates
    const templates = [
        { label: "Relancer client", icon: Clock, data: { title: "Relancer ", priority: "medium", assigned_to: "Vendeur" } },
        { label: "Préparer commande", icon: LayoutList, data: { title: "Préparation Commande #", priority: "high", assigned_to: "Préparateur" } },
        { label: "Achat Stock", icon: ArrowRight, data: { title: "Achat ", priority: "medium", assigned_to: "Gérant" } },
    ];

    return (
        <div className="space-y-6">
            <TaskEditModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                task={selectedTask}
                onSave={handleSave}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
            />

            {/* Header & KPI */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--cookie-brown)]">Planning & Tâches</h1>
                    <p className="text-sm text-gray-500 flex items-center gap-2">
                        {urgentTasksCount > 0 && (
                            <span className="flex items-center gap-1 text-red-600 font-medium">
                                <AlertCircle className="h-4 w-4" /> {urgentTasksCount} urgentes
                            </span>
                        )}
                        <span>• {tasks.filter(t => t.status === 'done').length} terminées</span>
                    </p>
                </div>
                <div className="flex gap-2">
                    {/* View Switcher */}
                    <div className="border border-gray-200 rounded-lg p-1 flex bg-white">
                        <button
                            onClick={() => setViewMode('table')}
                            className={`p-2 rounded ${viewMode === 'table' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <LayoutList className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('kanban')}
                            className={`p-2 rounded ${viewMode === 'kanban' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <Kanban className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Smart Templates */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {templates.map((tpl, i) => (
                    <button
                        key={i}
                        onClick={() => handleNewTask(tpl.data as any)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium hover:border-[var(--cookie-brown)] hover:text-[var(--cookie-brown)] transition-colors whitespace-nowrap shadow-sm"
                    >
                        <tpl.icon className="h-3 w-3" />
                        {tpl.label}
                    </button>
                ))}
                <button
                    onClick={() => handleNewTask()}
                    className="flex items-center gap-2 px-4 py-2 bg-[var(--cookie-brown)] text-white rounded-full text-sm font-medium hover:bg-opacity-90 transition-colors whitespace-nowrap shadow-sm ml-auto"
                >
                    <Plus className="h-4 w-4" />
                    Nouvelle Tâche
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Rechercher une tâche..."
                        className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--cookie-brown)]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    className="p-2 border border-gray-200 rounded-lg text-sm"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="all">Tout voir</option>
                    <option value="active">En cours / À faire</option>
                    <option value="done">Terminées</option>
                </select>
            </div>

            {/* View - Table */}
            {viewMode === 'table' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                                <tr>
                                    <th className="w-10 px-6 py-4"></th>
                                    <th className="px-6 py-4 font-medium">Tâche</th>
                                    <th className="px-6 py-4 font-medium">Assigné à</th>
                                    <th className="px-6 py-4 font-medium">Échéance</th>
                                    <th className="px-6 py-4 font-medium">Priorité</th>
                                    <th className="px-6 py-4 font-medium text-center">Statut</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                <AnimatePresence>
                                    {filteredTasks.map(task => (
                                        <motion.tr
                                            key={task.id}
                                            layout
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            whileHover={{ backgroundColor: "rgba(59, 130, 246, 0.05)" }}
                                            drag="x"
                                            dragConstraints={{ left: 0, right: 0 }}
                                            onDragEnd={(event, info) => {
                                                if (info.offset.x < -100) {
                                                    toggleStatus(task.id!); // Swipe Left -> Done
                                                } else if (info.offset.x > 100) {
                                                    handleDuplicate(task); // Swipe Right -> Dup
                                                }
                                            }}
                                            className="group cursor-pointer relative"
                                            onClick={() => handleEdit(task)}
                                        >
                                            <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    onClick={() => toggleStatus(task.id!)}
                                                    className={`h-5 w-5 rounded border flex items-center justify-center transition-colors ${task.status === 'done' ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-green-500'}`}
                                                >
                                                    {task.status === 'done' && <Check className="h-3 w-3" />}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`font-medium text-gray-900 ${task.status === 'done' ? 'line-through text-gray-400' : ''}`}>
                                                    {task.title}
                                                </span>
                                                {task.description && <p className="text-xs text-gray-400 truncate max-w-[200px]">{task.description}</p>}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-6 w-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold">
                                                        {task.assigned_to?.charAt(0)}
                                                    </div>
                                                    {task.assigned_to}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500">
                                                {task.due_date ? new Date(task.due_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-xs font-medium border ${task.priority === 'high' ? 'bg-red-50 text-red-700 border-red-100' :
                                                        task.priority === 'medium' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                                                            'bg-green-50 text-green-700 border-green-100'
                                                    }`}>
                                                    {task.priority === 'high' ? 'Haute' : task.priority === 'medium' ? 'Moyenne' : 'Basse'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${task.status === 'done' ? 'bg-gray-100 text-gray-800' :
                                                        task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {task.status === 'done' ? 'Terminée' : task.status === 'in_progress' ? 'En cours' : 'À faire'}
                                                </span>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* View - Kanban Placeholder */}
            {viewMode === 'kanban' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {['todo', 'in_progress', 'done'].map(status => (
                        <div key={status} className="bg-gray-50 rounded-xl p-4 border border-gray-100 h-full">
                            <h3 className="font-bold text-gray-700 mb-4 capitalize flex items-center justify-between">
                                {status === 'todo' ? 'À faire' : status === 'in_progress' ? 'En cours' : 'Terminée'}
                                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                                    {filteredTasks.filter(t => t.status === status).length}
                                </span>
                            </h3>
                            <div className="space-y-3">
                                {filteredTasks.filter(t => t.status === status).map(task => (
                                    <div
                                        key={task.id}
                                        onClick={() => handleEdit(task)}
                                        className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded ${task.priority === 'high' ? 'bg-red-50 text-red-700' :
                                                    task.priority === 'medium' ? 'bg-orange-50 text-orange-700' :
                                                        'bg-green-50 text-green-700'
                                                }`}>
                                                {task.priority === 'high' ? 'Haute' : task.priority === 'medium' ? 'Moyenne' : 'Basse'}
                                            </span>
                                            {task.due_date && (
                                                <span className="text-xs text-gray-400">{new Date(task.due_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                                            )}
                                        </div>
                                        <h4 className={`font-medium text-gray-900 ${task.status === 'done' ? 'line-through text-gray-400' : ''}`}>{task.title}</h4>
                                        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <div className="w-4 h-4 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-[10px]">
                                                    {task.assigned_to?.charAt(0)}
                                                </div>
                                                {task.assigned_to?.split(' ')[0]}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="text-xs text-center text-gray-400 sm:hidden">
                Swipe gauche pour terminer • Swipe droite pour dupliquer
            </div>
        </div>
    );
}
