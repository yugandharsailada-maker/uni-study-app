import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle } from "lucide-react";

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4 text-center">
                    <div className="p-4 rounded-full bg-destructive/10 text-destructive mb-6 animate-in zoom-in duration-300">
                        <AlertTriangle className="h-10 w-10" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Something went wrong</h1>
                    <p className="text-muted-foreground max-w-md mb-8">
                        An unexpected error occurred. We've logged this issue and are working to fix it.
                    </p>
                    <div className="flex gap-4">
                        <Button
                            onClick={() => window.location.reload()}
                            size="lg"
                            className="gap-2 shadow-lg shadow-primary/20"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Reload Application
                        </Button>
                    </div>
                    {process.env.NODE_ENV === 'development' && this.state.error && (
                        <div className="mt-12 p-4 bg-muted/50 rounded-xl text-left max-w-2xl w-full overflow-auto">
                            <p className="font-mono text-xs text-muted-foreground">{this.state.error.toString()}</p>
                        </div>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}
