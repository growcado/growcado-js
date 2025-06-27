import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { sdk } from '@growcado/sdk';
import { GrowcadoReact, useGrowcado } from '@growcado/react';

// Create a client for React Query
const queryClient = new QueryClient();

// Component to test direct SDK usage
function DirectSdkExample() {
  const [result, setResult] = useState<string | null>(null);

  const handleTestSdk = () => {
    const sdkResult = sdk();
    setResult(sdkResult);
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px', borderRadius: '5px' }}>
      <h2>Direct SDK Usage</h2>
      <p>This example shows how to use the core @growcado/sdk directly:</p>
      <button onClick={handleTestSdk} style={{ padding: '8px 16px', marginRight: '10px' }}>
        Call SDK Function
      </button>
      {result && <span style={{ color: 'green' }}>Result: {result}</span>}
    </div>
  );
}

// Component to test React wrapper
function ReactWrapperExample() {
  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px', borderRadius: '5px' }}>
      <h2>React Wrapper Component</h2>
      <p>This example shows the @growcado/react component:</p>
      <GrowcadoReact message="Hello from the example app!" />
    </div>
  );
}

// Component to test React Query hook
function ReactQueryExample() {
  const { data, isLoading, error, refetch } = useGrowcado();

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px', borderRadius: '5px' }}>
      <h2>React Query Hook</h2>
      <p>This example shows the useGrowcado hook with React Query:</p>
      <div style={{ marginBottom: '10px' }}>
        <button onClick={() => refetch()} style={{ padding: '8px 16px', marginRight: '10px' }}>
          Refetch Data
        </button>
        {isLoading && <span style={{ color: 'blue' }}>Loading...</span>}
        {error && <span style={{ color: 'red' }}>Error: {error.message}</span>}
        {data && <span style={{ color: 'green' }}>Data: {data}</span>}
      </div>
    </div>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        <h1>Growcado SDK React Example</h1>
        <p>This example app demonstrates the Growcado SDK and React wrapper libraries.</p>
        
        <DirectSdkExample />
        <ReactWrapperExample />
        <ReactQueryExample />
        
        <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
          <h3>Development Info</h3>
          <ul>
            <li><strong>Core SDK:</strong> @growcado/sdk (workspace)</li>
            <li><strong>React Library:</strong> @growcado/react (workspace)</li>
            <li><strong>React Query:</strong> Optional integration</li>
          </ul>
        </div>
      </div>
    </QueryClientProvider>
  );
}

export default App;
