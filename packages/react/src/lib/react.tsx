import React from 'react';
import { sdk } from '@growcado/sdk';

// Export the SDK for direct usage
export { sdk } from '@growcado/sdk';

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
