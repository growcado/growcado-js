import { jsxs, jsx } from 'react/jsx-runtime';
import { sdk as sdk$1 } from '@growcado/sdk';
export * from '@growcado/sdk';
export { sdk } from '@growcado/sdk';

/**
 * Simple React hook for using the Growcado SDK
 */
function useGrowcado() {
  const version = sdk$1();
  return {
    sdk: sdk$1,
    version
  };
}
/**
 * Simple widget component
 */
function GrowcadoWidget() {
  const {
    version
  } = useGrowcado();
  return jsxs("div", {
    children: [jsx("h3", {
      children: "Growcado SDK"
    }), jsxs("p", {
      children: ["Version: ", version]
    })]
  });
}

export { GrowcadoWidget, useGrowcado as default, useGrowcado };
