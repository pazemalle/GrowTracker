import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, Home, RotateCcw } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({
            error: error,
            errorInfo: errorInfo
        });
    }

    private handleReload = () => {
        window.location.reload();
    };

    private handleGoHome = () => {
        window.location.href = '/';
    };

    private handleClearCache = () => {
        if (confirm('Möchtest du wirklich den Cache leeren? Dies kann Login-Probleme beheben, löscht aber keine gespeicherten Daten.')) {
            localStorage.removeItem('cgt_token');
            localStorage.removeItem('cgt_username');
            window.location.reload();
        }
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center p-4">
                    <div className="max-w-md w-full glass-panel p-8 border border-red-900/50 bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-2xl">
                        <div className="flex justify-center mb-6">
                            <div className="bg-red-900/20 p-4 rounded-full border border-red-500/30 animate-pulse">
                                <AlertTriangle size={48} className="text-red-500" />
                            </div>
                        </div>

                        <h1 className="text-2xl font-bold text-white text-center mb-2">Upps, da ist was schiefgelaufen!</h1>
                        <p className="text-slate-400 text-center mb-6 text-sm">
                            Die Anwendung ist auf einen unerwarteten Fehler gestoßen. Keine Sorge, deine Daten sind sicher.
                        </p>

                        <div className="bg-black/30 p-4 rounded-lg border border-slate-800 mb-6 overflow-auto max-h-32">
                            <p className="text-xs font-mono text-red-300 break-all">
                                {this.state.error && this.state.error.toString()}
                            </p>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={this.handleReload}
                                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20"
                            >
                                <RotateCcw size={18} />
                                Seite neu laden
                            </button>

                            <button
                                onClick={this.handleGoHome}
                                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-all flex items-center justify-center gap-2 border border-slate-700"
                            >
                                <Home size={18} />
                                Zurück zum Dashboard
                            </button>

                            <button
                                onClick={this.handleClearCache}
                                className="w-full py-2 text-xs text-slate-500 hover:text-red-400 transition-colors mt-4"
                            >
                                Cache & Login zurücksetzen
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
