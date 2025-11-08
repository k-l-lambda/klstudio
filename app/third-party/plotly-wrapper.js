// Wrapper to ensure Plotly has access to window
// Vite's ESM context can sometimes not provide the right globals for UMD modules

// Ensure window, document, and navigator are available
if (typeof window === 'undefined') {
	throw new Error('Plotly requires a browser environment with window object');
}

// Import the actual plotly
import Plotly from './plotly.min.js';

export default Plotly;
