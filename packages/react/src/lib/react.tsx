import React from 'react';

// Simple SDK function inline to avoid import issues
function sdk(): string {
  return 'sdk';
}

/**
 * Simple React hook for using the Growcado SDK
 */
export function useGrowcado() {
  const version = sdk();
  
  return {
    sdk,
    version,
  };
}

/**
 * Simple widget component
 */
export function GrowcadoWidget(): React.ReactElement {
  const { version } = useGrowcado();
  
  return (
    <div>
      <h3>Growcado SDK</h3>
      <p>Version: {version}</p>
    </div>
  );
}

// Default export
export default useGrowcado;

// Re-export sdk
export { sdk };
