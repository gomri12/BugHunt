import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-neutral-900 border border-red-500/50 rounded-xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
              <h1 className="text-2xl font-bold text-red-400">Application Error</h1>
            </div>
            <p className="text-red-300 mb-4">
              Something went wrong. Please check the console for details.
            </p>
            {this.state.error && (
              <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4 mb-4">
                <p className="text-sm font-mono text-red-400 break-all">
                  {this.state.error.message}
                </p>
                {this.state.error.stack && (
                  <details className="mt-2">
                    <summary className="text-xs text-neutral-500 cursor-pointer">Stack trace</summary>
                    <pre className="text-xs text-neutral-600 mt-2 overflow-auto max-h-64">
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

