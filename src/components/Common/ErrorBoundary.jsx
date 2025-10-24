import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error.toString() };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ? (
        this.props.fallback(this.state.errorMessage)
      ) : (
        <div className="p-4 bg-red-900/20 border border-red-800 rounded-md text-red-200">
          <h3 className="text-sm font-medium mb-2">Something went wrong</h3>
          {this.state.errorMessage && (
            <div className="text-xs opacity-80 overflow-auto max-h-32">
              {this.state.errorMessage}
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
