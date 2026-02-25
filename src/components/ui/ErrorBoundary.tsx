"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center p-8 bg-white rounded-xl shadow-sm border border-red-100 m-4">
                    <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-500">
                        <AlertTriangle className="h-6 w-6" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-800 mb-2">Une erreur est survenue</h2>
                    <p className="text-sm text-gray-500 text-center mb-6 max-w-md">
                        L'affichage de ce composant a rencontré un problème. Pas d'inquiétude, le reste de l'application fonctionne toujours.
                    </p>
                    <div className="flex gap-4">
                        <button
                            onClick={this.handleReset}
                            className="flex items-center gap-2 px-4 py-2 bg-[var(--cookie-brown)] text-white rounded-lg hover:bg-[#5D4037] transition-colors text-sm font-medium"
                        >
                            <RefreshCcw className="h-4 w-4" />
                            Réessayer
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                        >
                            Rafraîchir la page
                        </button>
                    </div>
                    {process.env.NODE_ENV === 'development' && this.state.error && (
                        <div className="mt-8 p-4 bg-gray-50 rounded-lg w-full max-w-2xl overflow-auto text-left border border-gray-200">
                            <pre className="text-xs text-red-600 whitespace-pre-wrap font-mono">
                                {this.state.error.toString()}
                            </pre>
                        </div>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
