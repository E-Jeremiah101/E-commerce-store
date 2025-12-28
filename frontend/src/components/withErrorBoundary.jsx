import ErrorBoundary from "./ErrorBoundary.jsx";

/**
 * Feature-level error boundary wrapper
 * Use this to wrap major sections of your app (Cart, Checkout, Products, etc.)
 */
export function withErrorBoundary(Component, fallback = null) {
  const WrappedComponent = (props) => (
    <ErrorBoundary>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${
    Component.displayName || Component.name || "Component"
  })`;

  return WrappedComponent;
}

/**
 * Alternative: Use as a wrapper component directly
 * <FeatureErrorBoundary feature="Product List">
 *   <ProductList />
 * </FeatureErrorBoundary>
 */
export function FeatureErrorBoundary({ feature, children }) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}
