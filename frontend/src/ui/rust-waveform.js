/**
 * Rust-based waveform visualization module
 * This module provides a wrapper around the Rust/WebAssembly waveform component
 */

// Import the WebAssembly module (this will be available after building)
let wasmModule = null;
let WaveformViewer = null;
let isInitialized = false;
let initPromise = null;

/**
 * Initialize the Rust waveform module
 * @returns {Promise} A promise that resolves when the module is initialized
 */
export function initRustWaveform() {
    if (initPromise) {
        return initPromise;
    }

    initPromise = new Promise(async (resolve, reject) => {
        try {
            // Dynamic import of the WebAssembly module
            const module = await import('/wasm/ui-components/ui_components.js');
            await module.default();
            
            wasmModule = module;
            WaveformViewer = module.WaveformViewer;
            isInitialized = true;
            
            console.log('Rust waveform module initialized');
            resolve();
        } catch (error) {
            console.error('Failed to initialize Rust waveform module:', error);
            reject(error);
        }
    });
    
    return initPromise;
}

/**
 * Waveform class that wraps the Rust WebAssembly implementation
 */
export class RustWaveform {
    /**
     * Create a new Rust-based waveform visualization
     * @param {string} canvasId - The ID of the canvas element to draw on
     */
    constructor(canvasId) {
        this.canvasId = canvasId;
        this.waveformViewer = null;
        this.isReady = false;
        
        // Set up event listeners for the canvas
        this.setupEventListeners();
    }
    
    /**
     * Initialize the waveform visualization
     * @returns {Promise} A promise that resolves when the waveform is initialized
     */
    async initialize() {
        if (!isInitialized) {
            await initRustWaveform();
        }
        
        try {
            this.waveformViewer = new WaveformViewer(this.canvasId);
            this.isReady = true;
            return true;
        } catch (error) {
            console.error('Failed to initialize waveform viewer:', error);
            throw error;
        }
    }
    
    /**
     * Set up event listeners for the canvas
     */
    setupEventListeners() {
        const canvas = document.getElementById(this.canvasId);
        if (!canvas) {
            console.error(`Canvas with ID '${this.canvasId}' not found`);
            return;
        }
        
        // Mouse wheel event for zooming
        canvas.addEventListener('wheel', (event) => {
            event.preventDefault();
            if (!this.isReady) return;
            
            const delta = event.deltaY;
            this.waveformViewer.handle_wheel(-delta);
        });
        
        // Mouse events for dragging
        canvas.addEventListener('mousedown', (event) => {
            if (!this.isReady) return;
            
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            
            this.waveformViewer.handle_mouse_down(x, y);
        });
        
        canvas.addEventListener('mouseup', () => {
            if (!this.isReady) return;
            this.waveformViewer.handle_mouse_up();
        });
        
        canvas.addEventListener('mouseleave', () => {
            if (!this.isReady) return;
            this.waveformViewer.handle_mouse_up();
        });
        
        canvas.addEventListener('mousemove', (event) => {
            if (!this.isReady) return;
            
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            
            this.waveformViewer.handle_mouse_move(x, y);
        });
    }
    
    /**
     * Load audio data into the waveform visualization
     * @param {AudioBuffer} audioBuffer - The audio buffer to visualize
     */
    loadAudioData(audioBuffer) {
        if (!this.isReady) {
            console.error('Waveform viewer not initialized');
            return;
        }
        
        try {
            // Get the first channel of audio data
            const channelData = audioBuffer.getChannelData(0);
            
            // Load the audio data into the waveform viewer
            this.waveformViewer.load_audio_data(channelData, audioBuffer.sampleRate);
            
            console.log('Audio data loaded into Rust waveform viewer');
        } catch (error) {
            console.error('Failed to load audio data:', error);
        }
    }
    
    /**
     * Set the playhead position
     * @param {number} position - The normalized position (0-1)
     */
    setPlayhead(position) {
        if (!this.isReady) return;
        
        try {
            this.waveformViewer.set_playhead(position);
        } catch (error) {
            console.error('Failed to set playhead position:', error);
        }
    }
    
    /**
     * Add a marker at the specified position
     * @param {number} position - The normalized position (0-1)
     */
    addMarker(position) {
        if (!this.isReady) return;
        
        try {
            this.waveformViewer.add_marker(position);
        } catch (error) {
            console.error('Failed to add marker:', error);
        }
    }
    
    /**
     * Clear all markers
     */
    clearMarkers() {
        if (!this.isReady) return;
        
        try {
            this.waveformViewer.clear_markers();
        } catch (error) {
            console.error('Failed to clear markers:', error);
        }
    }
    
    /**
     * Set the appearance of the waveform
     * @param {Object} colors - The colors to use for the waveform
     * @param {string} colors.background - The background color (CSS color string)
     * @param {string} colors.wave - The wave color (CSS color string)
     * @param {string} colors.cursor - The cursor color (CSS color string)
     */
    setAppearance(colors) {
        if (!this.isReady) return;
        
        try {
            // Parse CSS color strings to RGB values
            const background = this.parseColor(colors.background || '#2a2a2a');
            const wave = this.parseColor(colors.wave || '#61dafb');
            const cursor = this.parseColor(colors.cursor || '#ff5252');
            
            this.waveformViewer.set_appearance(
                background.r, background.g, background.b,
                wave.r, wave.g, wave.b,
                cursor.r, cursor.g, cursor.b
            );
        } catch (error) {
            console.error('Failed to set appearance:', error);
        }
    }
    
    /**
     * Parse a CSS color string to RGB values
     * @param {string} color - The CSS color string
     * @returns {Object} The RGB values (0-1)
     */
    parseColor(color) {
        // Create a temporary div to parse the color
        const div = document.createElement('div');
        div.style.color = color;
        document.body.appendChild(div);
        
        // Get the computed style
        const computedColor = window.getComputedStyle(div).color;
        document.body.removeChild(div);
        
        // Parse the RGB values
        const match = computedColor.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
        if (match) {
            return {
                r: parseInt(match[1], 10) / 255,
                g: parseInt(match[2], 10) / 255,
                b: parseInt(match[3], 10) / 255
            };
        }
        
        // Default to black if parsing fails
        return { r: 0, g: 0, b: 0 };
    }
    
    /**
     * Clean up resources
     */
    cleanup() {
        // Nothing to do here for now
        // The Rust/WebAssembly memory will be garbage collected
    }
}