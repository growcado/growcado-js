import { sdk } from '@growcado/sdk';

// DOM elements
const statusDiv = document.getElementById('status');
const testButton = document.getElementById('test-sdk');
const resultPre = document.getElementById('result');

// Helper function to update status
function updateStatus(message, type = 'success') {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
}

// Helper function to display results
function displayResult(result) {
    resultPre.textContent = JSON.stringify(result, null, 2);
}

// Initialize the app
async function init() {
    try {
        // Test basic SDK import
        console.log('SDK imported successfully:', sdk);
        
        // Update status
        updateStatus('✅ SDK loaded successfully!', 'success');
        
        // Test SDK function
        const result = sdk();
        displayResult({ 
            function: 'sdk()',
            result: result,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error loading SDK:', error);
        updateStatus(`❌ Error loading SDK: ${error.message}`, 'error');
        displayResult({ error: error.message });
    }
}

// Button click handler
testButton.addEventListener('click', () => {
    try {
        const result = sdk();
        displayResult({
            function: 'sdk()',
            result: result,
            timestamp: new Date().toISOString(),
            note: 'Called via button click'
        });
        updateStatus('✅ SDK function executed successfully!', 'success');
    } catch (error) {
        console.error('Error calling SDK:', error);
        updateStatus(`❌ Error: ${error.message}`, 'error');
        displayResult({ error: error.message });
    }
});

// Initialize when DOM is loaded
init(); 