import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#FFFFFF' }}>
          <div className="text-center max-w-md space-y-4">
            <p style={{ fontSize: '48px' }}>😔</p>
            <h1 className="text-a2" style={{ color: '#333' }}>Something went wrong</h1>
            <p className="text-body" style={{ color: '#888' }}>
              We hit an unexpected error. Please try again.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = '/';
              }}
              className="inline-block px-8 py-3 rounded-full text-a5 transition-colors"
              style={{ backgroundColor: '#FE6781', color: '#FFFFFF' }}
            >
              Start Over
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
