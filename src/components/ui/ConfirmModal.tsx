import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    isDanger?: boolean;
}

export default function ConfirmModal({
    isOpen,
    title,
    message,
    confirmText = "Confirmer",
    cancelText = "Annuler",
    onConfirm,
    onCancel,
    isDanger = true
}: ConfirmModalProps) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onCancel}
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden"
                    >
                        <div className="p-6">
                            <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full mb-4 ${isDanger ? 'bg-red-100' : 'bg-orange-100'}`}>
                                <AlertTriangle className={`h-8 w-8 ${isDanger ? 'text-red-600' : 'text-orange-600'}`} />
                            </div>

                            <h3 className="text-xl font-bold text-center text-gray-900 mb-2">
                                {title}
                            </h3>
                            <p className="text-center text-gray-500 mb-6">
                                {message}
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={onCancel}
                                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
                                >
                                    {cancelText}
                                </button>
                                <button
                                    onClick={() => {
                                        onConfirm();
                                        onCancel();
                                    }}
                                    className={`flex-1 px-4 py-2 text-white font-medium rounded-xl transition-colors ${isDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-[var(--cookie-accent)] hover:bg-orange-600'
                                        }`}
                                >
                                    {confirmText}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
