import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  hasSession: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    hasSession: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    // Check if there's a saved session to recover
    const hasSession = !!localStorage.getItem('vani-session-state');
    return { hasError: true, error, hasSession };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    // Save crash info for debugging
    try {
      localStorage.setItem('vani-last-crash', JSON.stringify({
        message: error.message,
        timestamp: new Date().toISOString(),
      }));
    } catch {}
  }

  private handleResume = () => {
    try {
      const raw = localStorage.getItem('vani-session-state');
      if (raw) {
        const session = JSON.parse(raw);
        this.setState({ hasError: false, error: null });
        const path = session.page === 'speech' ? '/practice/speech'
          : session.page === 'interview' ? '/practice/interview'
          : session.page === 'presentation' ? '/practice/presentation'
          : session.page === 'group' ? '/practice/group'
          : '/dashboard';
        window.location.href = path;
      }
    } catch {
      window.location.href = '/';
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted to-background p-4">
          <div className="max-w-md w-full space-y-6 text-center">
            <div className="text-6xl mb-4">😔</div>
            <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
            <p className="text-muted-foreground text-sm">
              {this.state.error?.message?.includes('API') 
                ? 'There was an issue connecting to the AI service. Please check your internet connection and try again.'
                : 'An unexpected error occurred. Your session data has been preserved.'}
            </p>

            <div className="space-y-3">
              {this.state.hasSession && (
                <Button
                  className="w-full bg-gradient-to-r from-primary to-secondary text-white"
                  onClick={this.handleResume}
                >
                  🔄 Resume Where You Left Off
                </Button>
              )}
              <Button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.href = '/dashboard';
                }}
                className="w-full"
              >
                Go to Dashboard
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.href = '/';
                }}
                className="w-full"
              >
                Go to Home
              </Button>
              <Button
                variant="ghost"
                onClick={() => window.location.reload()}
                className="w-full text-sm"
              >
                Reload Page
              </Button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-muted-foreground">
                  Error Details (Dev)
                </summary>
                <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-h-48">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
