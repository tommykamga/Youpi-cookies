"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Bot, User, Send, X, MessageCircle, MoreHorizontal, Cookie } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
}

export default function ChatbotAssistant() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [inputText, setInputText] = useState("");
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    if (pathname === '/login' || pathname?.startsWith('/auth')) {
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim() || isLoading) return;

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: "user",
            content: inputText.trim(),
        };

        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInputText("");
        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: newMessages.map(m => ({ role: m.role, content: m.content })),
                }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => null);
                throw new Error(errData?.error || `Erreur serveur: ${res.status}`);
            }

            const data = await res.json();
            const assistantId = (Date.now() + 1).toString();

            setMessages(prev => [...prev, {
                id: assistantId,
                role: "assistant",
                content: data.text || "Désolé, je n'ai pas pu générer de réponse.",
            }]);
        } catch (err: any) {
            console.error("Chat error:", err);
            setError(err.message || "Une erreur est survenue");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="mb-4 bg-white rounded-2xl shadow-2xl border border-gray-100 w-[350px] sm:w-[400px] h-[550px] max-h-[80vh] flex flex-col overflow-hidden"
                        >
                            {/* Header */}
                            <div className="bg-gradient-to-r from-[var(--cookie-brown)] to-amber-700 text-white p-4 justify-between flex items-center shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                        <Cookie className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg leading-tight">Assistant YELELE</h3>
                                        <p className="text-white/80 text-xs">Toujours à votre service</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                                {messages.length === 0 && (
                                    <div className="text-center text-gray-400 mt-10 space-y-3">
                                        <Bot className="h-12 w-12 mx-auto text-gray-300" />
                                        <p className="text-sm">Bonjour ! Demandez-moi de créer un client, de vérifier le stock, ou de relancer des factures.</p>
                                    </div>
                                )}

                                {messages.map((m) => (
                                    <div
                                        key={m.id}
                                        className={`flex items-start gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}
                                    >
                                        <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${m.role === "user" ? "bg-amber-100 text-amber-600" : "bg-[var(--cookie-brown)] text-white"}`}>
                                            {m.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                                        </div>

                                        <div className="flex flex-col gap-1 max-w-[80%]">
                                            {m.content && (
                                                <div
                                                    className={`p-3 rounded-2xl text-sm whitespace-pre-wrap ${m.role === "user" ? "bg-[var(--cookie-brown)] text-white rounded-tr-sm" : "bg-white border text-gray-700 border-gray-100 shadow-sm rounded-tl-sm"}`}
                                                >
                                                    {m.content}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {isLoading && messages[messages.length - 1]?.role === 'user' && (
                                    <div className="flex items-start gap-3">
                                        <div className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 bg-[var(--cookie-brown)] text-white">
                                            <Bot className="h-4 w-4" />
                                        </div>
                                        <div className="bg-white border text-gray-700 border-gray-100 shadow-sm rounded-2xl rounded-tl-sm p-4 w-fit">
                                            <MoreHorizontal className="h-5 w-5 animate-pulse text-gray-400" />
                                        </div>
                                    </div>
                                )}

                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex justify-start drop-shadow-sm"
                                    >
                                        <div className="bg-red-50 border border-red-200 text-red-700/80 rounded-2xl rounded-tl-sm px-4 py-3 text-sm max-w-[85%] whitespace-pre-wrap">
                                            ⚠️ Une erreur est survenue : {error}
                                        </div>
                                    </motion.div>
                                )}

                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <div className="p-4 bg-white border-t border-gray-100">
                                <form onSubmit={handleSubmit} className="flex gap-2">
                                    <input
                                        value={inputText}
                                        onChange={(e) => setInputText(e.target.value)}
                                        placeholder="Posez votre question..."
                                        className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--cookie-brown)] focus:bg-white text-sm transition-all"
                                    />
                                    <button
                                        type="submit"
                                        disabled={isLoading || !inputText.trim()}
                                        className="h-10 w-10 bg-[var(--cookie-brown)] text-white rounded-xl flex items-center justify-center hover:bg-amber-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <Send className="h-4 w-4 ml-0.5" />
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Toggle Button */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="h-14 w-14 bg-[var(--cookie-brown)] text-white rounded-full shadow-xl hover:shadow-2xl hover:bg-amber-800 transition-all flex items-center justify-center group focus:outline-none focus:ring-4 focus:ring-amber-900/20"
                >
                    {isOpen ? (
                        <X className="h-6 w-6 group-hover:rotate-90 transition-transform duration-300" />
                    ) : (
                        <MessageCircle className="h-6 w-6 group-hover:-translate-y-0.5 transition-transform duration-300" />
                    )}
                </button>
            </div>
        </>
    );
}
