// Audio context management
import { workletProcessorCode } from './worklet-processor-code.js';

// Create and initialize the audio context
export async function initAudioContext() {
    // Create audio context with options
    const audioContext = new (window.AudioContext || window.webkitAudioContext)({
        latencyHint: 'interactive',
        sampleRate: 44100
    });
    
    // Resume the audio context if it's suspended (needed for some browsers)
    if (audioContext.state === 'suspended') {
        await audioContext.resume();
    }
    
    console.log('Audio context initialized:', 
                'sample rate =', audioContext.sampleRate, 
                'state =', audioContext.state);
    
    return audioContext;
}

// Create the sampler worklet node
export async function createSamplerWorklet(audioContext) {
    try {
        // Load the audio worklet module
        // Use a path relative to the root of the server
        try {
            // Create a Blob from the worklet code string
            const workletBlob = new Blob([workletProcessorCode], { type: 'application/javascript' });
            const workletUrl = URL.createObjectURL(workletBlob);
            
            // Load the worklet from the Blob URL
            await audioContext.audioWorklet.addModule(workletUrl);
            
            // Clean up the Blob URL
            URL.revokeObjectURL(workletUrl);
            
            console.log('Successfully loaded audio worklet using Blob URL');
        } catch (error) {
            console.error('Failed to load audio worklet:', error);
            
            // Show a detailed error message
            const errorMessage = document.createElement('div');
            errorMessage.className = 'error-message';
            errorMessage.innerHTML = `
                <h3>Error Loading Audio Worklet</h3>
                <p>Failed to load the audio worklet module. This might be due to:</p>
                <ul>
                    <li>Browser security restrictions</li>
                    <li>Audio context issues</li>
                    <li>JavaScript errors in the worklet code</li>
                </ul>
                <p>Technical details: ${error.message}</p>
            `;
            document.body.appendChild(errorMessage);
            throw error;
        }
        
        // Create the worklet node
        const samplerNode = new AudioWorkletNode(audioContext, 'sampler-processor', {
            numberOfInputs: 1,
            numberOfOutputs: 1,
            outputChannelCount: [2],
            processorOptions: {
                // Any options to pass to the processor
            }
        });
        
        // Connect the node to the audio output
        samplerNode.connect(audioContext.destination);
        
        // Set up message handling from the processor
        samplerNode.port.onmessage = handleProcessorMessage;
        
        console.log('Sampler worklet created and connected');
        
        // Load and initialize the Wasm module
        await initWasmModule(samplerNode);
        
        return samplerNode;
    } catch (error) {
        console.error('Failed to create sampler worklet:', error);
        throw error;
    }
}

// Initialize the WebAssembly module
async function initWasmModule(samplerNode) {
    try {
        // Import the Wasm module
        const wasmModule = await import('/sampler-wasm/pkg/sampler_wasm.js');
        
        // Initialize the Wasm module
        await wasmModule.default();
        
        // Tell the worklet to initialize its own Wasm module
        samplerNode.port.postMessage({
            type: 'init'
        });
        
        console.log('Wasm module initialized');
        
        return wasmModule;
    } catch (error) {
        console.error('Failed to initialize Wasm module:', error);
        
        // Show a more user-friendly error message
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.innerHTML = `
            <h3>Error Initializing WebAssembly Module</h3>
            <p>There was a problem loading the WebAssembly module. This might be due to:</p>
            <ul>
                <li>Missing WebAssembly files (did you run <code>npm run build:wasm</code>?)</li>
                <li>Path issues in the development server</li>
                <li>Browser security restrictions</li>
            </ul>
            <p>Technical details: ${error.message}</p>
            <p>Try the following steps:</p>
            <ol>
                <li>Make sure you've built the Wasm module with <code>npm run build:wasm</code></li>
                <li>Check that the Wasm files exist in <code>sampler-wasm/pkg/</code></li>
                <li>Restart the development server with <code>npm run dev</code></li>
            </ol>
            <p>Command to build Wasm module:</p>
            <pre><code>cd sampler-wasm && wasm-pack build --target web</code></pre>
        `;
        
        // Add a button to try building the Wasm module
        const buildButton = document.createElement('button');
        buildButton.textContent = 'Build Wasm Module';
        buildButton.className = 'build-wasm-btn';
        buildButton.onclick = () => {
            // This is just a placeholder - in a real app, you'd need to use a server-side API
            alert('To build the Wasm module, run this command in your terminal:\n\ncd sampler-wasm && wasm-pack build --target web');
        };
        errorMessage.appendChild(buildButton);
        document.body.appendChild(errorMessage);
        
        throw error;
    }
}

// Handle messages from the audio worklet processor
function handleProcessorMessage(event) {
    const { data } = event;
    
    switch (data.type) {
        case 'initialized':
            console.log('Processor initialized');
            break;
            
        case 'sampleLoaded':
            console.log('Sample loaded in processor');
            break;
            
        case 'levels':
            // Update level meters
            updateLevelMeters(data.peak, data.rms);
            break;
            
        case 'error':
            console.error('Processor error:', data.message);
            break;
            
        default:
            console.log('Message from processor:', data);
    }
}

// Update level meters (will be implemented in meters.js)
function updateLevelMeters(peak, rms) {
    // This is a placeholder - the actual implementation will be in meters.js
    // We'll dispatch a custom event that meters.js will listen for
    const event = new CustomEvent('audio-levels', { 
        detail: { peak, rms } 
    });
    window.dispatchEvent(event);
}

// Create a gain node
export function createGainNode(audioContext, gain = 1.0) {
    const gainNode = audioContext.createGain();
    gainNode.gain.value = gain;
    return gainNode;
}

// Create a stereo panner node
export function createPannerNode(audioContext, pan = 0) {
    const pannerNode = audioContext.createStereoPanner();
    pannerNode.pan.value = pan;
    return pannerNode;
}

// Connect multiple audio nodes in sequence
export function connectNodes(nodes) {
    for (let i = 0; i < nodes.length - 1; i++) {
        nodes[i].connect(nodes[i + 1]);
    }
}

// Disconnect all connections from a node
export function disconnectNode(node) {
    node.disconnect();
}