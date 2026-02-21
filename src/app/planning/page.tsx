"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, Search, Filter, CheckCircle, Clock, AlertCircle, MoreHorizontal, Calendar, ArrowRight, Copy, Check, Trash2, LayoutList, Kanban, BookTemplate, Zap, Loader2 } from "lucide-react";
import { Task } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import TaskEditModal from "@/components/tasks/TaskEditModal";
import BulkActions from "@/components/tasks/BulkActions";
import { createClient } from "@/lib/supabase";

// Removed mock data

export default function TasksPage() {
    const supabase = createClient();
    const [tasks, setTasks] = useState<Partial<Task>[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Partial<Task> | null>(null);
    const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
    const [isDeletingBulk, setIsDeletingBulk] = useState(false);

    // Fetch Tasks
    const fetchTasks = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) console.error("Error fetching tasks:", error);

        if (data) setTasks(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchTasks();
    }, []);

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

    const handleSave = async (updated: Partial<Task>) => {
        if (!updated.id) {
            // Create
            const { data, error } = await supabase
                .from('tasks')
                .insert([updated])
                .select();
            if (error) console.error("Insert error:", error);
            if (data) setTasks([data[0], ...tasks]);
        } else {
            // Update
            const { error } = await supabase
                .from('tasks')
                .update(updated)
                .eq('id', updated.id);
            if (error) console.error("Update error:", error);
            if (!error) {
                setTasks(prev => prev.map(t => t.id === updated.id ? { ...t, ...updated } : t));
            }
        }
        setIsModalOpen(false);
    };

    const handleDelete = async (id: string) => {
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', id);
        if (!error) {
            setTasks(prev => prev.filter(t => t.id !== id));
        }
        setIsModalOpen(false);
    };

    const handleDuplicate = (task: Partial<Task>) => {
        const { id, created_at, updated_at, ...rest } = task;
        const copy = { ...rest, title: `${task.title} (Copie)` };
        handleNewTask(copy);
    };

    const handleBulkDelete = async () => {
        if (!selectedTaskIds.length) return;
        setIsDeletingBulk(true);
        try {
            const { error } = await supabase
                .from('tasks')
                .delete()
                .in('id', selectedTaskIds);

            if (error) throw error;

            setTasks(prev => prev.filter(t => !selectedTaskIds.includes(t.id!)));
            setSelectedTaskIds([]);
        } catch (err: any) {
            console.error("Erreur de suppression multiple:", err);
            alert("Erreur lors de la suppression des tâches : " + err.message);
        } finally {
            setIsDeletingBulk(false);
        }
    };

    const handleClearAll = async () => {
        if (!confirm("Attention : vous allez supprimer TOUTES les tâches du planning. Continuer ?")) return;
        setIsDeletingBulk(true);
        try {
            const { error } = await supabase
                .from('tasks')
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000'); // Dummy condition to delete all

            if (error) throw error;

            setTasks([]);
            setSelectedTaskIds([]);
        } catch (err: any) {
            console.error("Erreur vidage planning:", err);
            alert("Erreur lors du vidage du planning : " + err.message);
        } finally {
            setIsDeletingBulk(false);
        }
    };

    const toggleSelection = (id: string) => {
        setSelectedTaskIds(prev =>
            prev.includes(id) ? prev.filter(taskId => taskId !== id) : [...prev, id]
        );
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedTaskIds(filteredTasks.map(t => t.id!));
        } else {
            setSelectedTaskIds([]);
        }
    };

    const toggleStatus = async (id: string) => {
        const task = tasks.find(t => t.id === id);
        if (!task) return;
        const newStatus = task.status === 'done' ? 'todo' : 'done';

        const { error } = await supabase
            .from('tasks')
            .update({ status: newStatus })
            .eq('id', id);

        if (!error) {
            setTasks(prev => prev.map(t =>
                t.id === id ? { ...t, status: newStatus } : t
            ));
        }
    };

    // Quick Templates
    const templates = [
        { label: "Relancer client", icon: Clock, data: { title: "Relancer ", priority: "medium", assigned_to: "Vendeur" } },
        { label: "Préparer commande", icon: LayoutList, data: { title: "Préparation Commande #", priority: "high", assigned_to: "Préparateur" } },
        { label: "Achat Stock", icon: ArrowRight, data: { title: "Achat ", priority: "medium", assigned_to: "Gérant" } },
    ];

    return (
        <div className="space-y-6 pb-20">
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
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <>
                                {urgentTasksCount > 0 && (
                                    <span className="flex items-center gap-1 text-red-600 font-medium">
                                        <AlertCircle className="h-4 w-4" /> {urgentTasksCount} urgentes
                                    </span>
                                )}
                                <span>• {tasks.filter(t => t.status === 'done').length} terminées</span>
                            </>
                        )}
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
                                    <th className="w-12 px-4 py-4 text-center">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 text-[var(--cookie-brown)] focus:ring-[var(--cookie-brown)]"
                                            checked={filteredTasks.length > 0 && selectedTaskIds.length === filteredTasks.length}
                                            onChange={handleSelectAll}
                                        />
                                    </th>
                                    <th className="w-10 px-2 py-4"></th>
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
                                            className={`group cursor-pointer relative ${selectedTaskIds.includes(task.id!) ? 'bg-blue-50/50' : ''}`}
                                            onClick={() => handleEdit(task)}
                                        >
                                            <td className="w-12 px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-gray-300 text-[var(--cookie-brown)] focus:ring-[var(--cookie-brown)]"
                                                    checked={selectedTaskIds.includes(task.id!)}
                                                    onChange={() => toggleSelection(task.id!)}
                                                />
                                            </td>
                                            <td className="px-2 py-4" onClick={(e) => e.stopPropagation()}>
                                                <div className="relative inline-block group/check">
                                                    <button
                                                        onClick={() => toggleStatus(task.id!)}
                                                        className={`h-5 w-5 rounded border flex items-center justify-center transition-colors ${task.status === 'done' ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-green-500'}`}
                                                    >
                                                        {task.status === 'done' && <Check className="h-3 w-3" />}
                                                    </button>
                                                    <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover/check:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                                        {task.status === 'done' ? "Marquer à faire" : "Marquer comme terminé"}
                                                    </div>
                                                </div>
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

            {/* View - Kanban */}
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
                                        <h4 className={`font-medium text-gray-900 ${task.status === 'done' ? 'line-through text-gray-400' : ''}`}>
                                            {task.title}
                                        </h4>
                                        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                                            <div className="flex items-center gap-1">
                                                <div className="w-4 h-4 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-[10px]">
                                                    {task.assigned_to?.charAt(0)}
                                                </div>
                                                {task.assigned_to?.split(' ')[0]}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <p className="text-xs text-center text-gray-400 sm:hidden">
                Swipe gauche pour terminer • Swipe droite pour dupliquer
            </p>

            <BulkActions
                selectedCount={selectedTaskIds.length}
                totalCount={tasks.length}
                isDeleting={isDeletingBulk}
                onDeleteSelected={handleBulkDelete}
                onClearAll={handleClearAll}
                onClearSelection={() => setSelectedTaskIds([])}
            />
        </div>
    );
}
