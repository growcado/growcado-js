import { sdk } from '@growcado/sdk';

export interface GrowcadoReactProps {
  message?: string;
}

export function GrowcadoReact({ message }: GrowcadoReactProps) {
  const sdkMessage = sdk();
  
  return (
    <div>
      <h1>Welcome to Growcado React!</h1>
      <p>Core SDK says: {sdkMessage}</p>
      {message && <p>Custom message: {message}</p>}
    </div>
  );
}

export default GrowcadoReact;
