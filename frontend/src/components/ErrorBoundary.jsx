import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error);
    console.error("Error Info:", errorInfo);

    // Log to external service (optional)
    if (import.meta.env.VITE_LOG_ERRORS === "true") {
      this.logErrorToService(error, errorInfo);
    }

    this.setState({
      error,
      errorInfo,
    });
  }

  logErrorToService = (error, errorInfo) => {
    // Send to error tracking service (Sentry, etc.)
    try {
      console.warn("Error tracked:", { error, errorInfo });
    } catch (e) {
      console.error("Failed to log error:", e);
    }
  };

  resetError = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "20px",
            margin: "20px",
            border: "1px solid #f5222d",
            borderRadius: "4px",
            backgroundColor: "#fff1f0",
          }}
        >
          <h2 style={{ color: "#f5222d" }}>⚠️ Something went wrong</h2>
          <details style={{ whiteSpace: "pre-wrap", marginTop: "10px" }}>
            {this.state.error && this.state.error.toString()}
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
          <button
            onClick={this.resetError}
            style={{
              marginTop: "10px",
              padding: "8px 16px",
              backgroundColor: "#f5222d",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
