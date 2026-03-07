import React from 'react';

/**
 * Error Boundary — catches runtime errors in any child component tree
 * and renders a graceful fallback instead of a white screen.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught an error:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const { fallback } = this.props;
    if (fallback) return fallback;

    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 48,
        color: "#E8EAF0",
        fontFamily: "'DM Sans', sans-serif",
        minHeight: 300,
      }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
          Something went wrong
        </div>
        <div style={{
          fontSize: 13,
          color: "#6B7494",
          marginBottom: 24,
          maxWidth: 400,
          textAlign: "center",
          lineHeight: 1.6,
        }}>
          {this.state.error?.message || "An unexpected error occurred in this section."}
        </div>
        <button
          onClick={this.handleReset}
          style={{
            background: "linear-gradient(135deg,#6C63FF,#9B59B6)",
            border: "none",
            color: "white",
            padding: "10px 24px",
            borderRadius: 10,
            cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          Try Again
        </button>
      </div>
    );
  }
}
