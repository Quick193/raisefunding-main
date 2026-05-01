import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Uncaught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-orange-50">
          <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center border border-orange-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Something went wrong</h2>
            <p className="text-gray-600 mb-6 text-sm">{this.state.message || 'An unexpected error occurred.'}</p>
            <button
              onClick={() => { this.setState({ hasError: false, message: '' }); window.location.href = '/'; }}
              className="bg-gradient-to-r from-orange-600 to-orange-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Go to Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
