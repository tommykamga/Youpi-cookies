"use client";

import { Trash2, AlertTriangle, Loader2 } from "lucide-react";

interface BulkActionsProps {
    selectedCount: number;
    totalCount: number;
    isDeleting: boolean;
    onDeleteSelected: () => void;
    onClearAll: () => void;
    onClearSelection: () => void;
}

export default function BulkActions({
    selectedCount,
    totalCount,
    isDeleting,
    onDeleteSelected,
    onClearAll,
    onClearSelection
}: BulkActionsProps) {
    if (selectedCount === 0) return null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
            <div className="bg-white rounded-full shadow-2xl border border-[var(--cookie-brown)]/20 px-4 py-3 flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 border-r border-gray-100">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--cookie-brown)]/10 text-[var(--cookie-brown)] text-sm font-bold">
                        {selectedCount}
                    </span>
                    <span className="text-sm font-medium text-gray-700">tâche(s) sélectionnée(s)</span>
                </div>

                <div className="flex items-center gap-2 px-2">
                    <button
                        onClick={onDeleteSelected}
                        disabled={isDeleting}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
                    >
                        {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        Supprimer la sélection
                    </button>

                    {totalCount > 0 && selectedCount === totalCount && (
                        <button
                            onClick={onClearAll}
                            disabled={isDeleting}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold text-red-700 hover:bg-red-100 bg-red-50 rounded-full transition-colors disabled:opacity-50"
                        >
                            <AlertTriangle className="h-4 w-4" />
                            Vider TOUT le planning
                        </button>
                    )}
                </div>

                <button
                    onClick={onClearSelection}
                    className="ml-2 text-xs text-gray-400 hover:text-gray-600 underline px-2"
                >
                    Annuler
                </button>
            </div>
        </div>
    );
}
