import React from 'react';
import { sdk } from '@growcado/sdk';
export { sdk } from '@growcado/sdk';
/**
 * Simple React hook for using the Growcado SDK
 */
export declare function useGrowcado(): {
    sdk: typeof sdk;
    version: string;
};
/**
 * Simple widget component
 */
export declare function GrowcadoWidget(): React.ReactElement;
export default useGrowcado;
