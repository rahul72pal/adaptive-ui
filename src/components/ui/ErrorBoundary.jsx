import React from 'react';
import { AlertCircle, RefreshCw, RotateCcw } from 'lucide-react';
import { Button } from './Button';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught an unhandled error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[360px] p-6 sm:p-8 flex items-center justify-center">
          <div className="max-w-xl w-full bg-[#111114] rounded-2xl border border-[#5C1D24] p-6 sm:p-8 shadow-elevated space-y-6 text-center animate-fadeIn">
            <div className="w-14 h-14 bg-rose-950/60 text-rose-400 rounded-2xl flex items-center justify-center mx-auto border border-rose-900/80">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-[#F4F4F5]">
                {this.props.title || 'Something went wrong in this view'}
              </h3>
              <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
                {this.props.description ||
                  'An unexpected rendering error occurred. The application stopped the error from breaking the entire page.'}
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3 bg-rose-950/30 rounded-xl border border-rose-900/40 text-left">
                <span className="text-[11px] font-mono font-bold text-rose-400 block uppercase tracking-wider mb-1">
                  Error Details:
                </span>
                <p className="text-xs font-mono text-rose-200 break-words">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button
                variant="primary"
                size="md"
                onClick={this.handleReset}
                className="font-bold"
              >
                <RefreshCw className="w-4 h-4 mr-1.5" />
                Try Again
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={this.handleReload}
                className="font-bold"
              >
                <RotateCcw className="w-4 h-4 mr-1.5" />
                Reload Application
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
