import { useState } from 'react';
import { useGrowcado, GrowcadoWidget, sdk } from '@growcado/react';
import './App.css';

function App() {
  const [callHistory, setCallHistory] = useState<Array<{
    timestamp: string;
    function: string;
    result: any;
  }>>([]);

  // Use the hook
  const { version } = useGrowcado();

  // Handler for testing SDK functions
  const handleTestSDK = () => {
    const result = sdk();
    const entry = {
      timestamp: new Date().toISOString(),
      function: 'sdk()',
      result: result
    };
    setCallHistory(prev => [entry, ...prev]);
  };

  const handleTestHook = () => {
    const hookResult = useGrowcado();
    const entry = {
      timestamp: new Date().toISOString(),
      function: 'useGrowcado()',
      result: hookResult
    };
    setCallHistory(prev => [entry, ...prev]);
  };

  const clearHistory = () => {
    setCallHistory([]);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🥑 Growcado React Example</h1>
        <p>This example demonstrates using the <code style={{ color: 'black' }}>@growcado/react</code> package in a React application.</p>
      </header>

      <main className="app-main">
        <section className="widget-section">
          <h2>Widget Component</h2>
          <div className="widget-container">
            <GrowcadoWidget />
          </div>
        </section>

        <section className="hook-section">
          <h2>Hook Usage</h2>
          <div className="hook-info">
            <p><strong>Hook Result:</strong></p>
            <pre>{JSON.stringify({ version }, null, 2)}</pre>
          </div>
        </section>

        <section className="testing-section">
          <h2>Interactive Testing</h2>
          <div className="button-group">
            <button onClick={handleTestSDK} className="test-button">
              Test SDK Function
            </button>
            <button onClick={handleTestHook} className="test-button">
              Test Hook
            </button>
            <button onClick={clearHistory} className="clear-button">
              Clear History
            </button>
          </div>
        </section>

        <section className="history-section">
          <h2>Call History</h2>
          <div className="history-container">
            {callHistory.length === 0 ? (
              <p className="empty-history">No function calls yet. Click the buttons above to test!</p>
            ) : (
              <div className="history-list">
                {callHistory.map((entry, index) => (
                  <div key={index} className="history-item">
                    <div className="history-header">
                      <span className="function-name">{entry.function}</span>
                      <span className="timestamp">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <pre className="history-result">{JSON.stringify(entry.result, null, 2)}</pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App; 