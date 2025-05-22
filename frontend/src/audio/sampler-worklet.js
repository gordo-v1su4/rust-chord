// Import statements will be added by the bundler
// The actual Wasm module will be imported at runtime

class SamplerProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        
        // Initialize state
        this.initialized = false;
        this.rustProcessor = null;
        
        // Set up message handling
        this.port.onmessage = this.handleMessage.bind(this);
        
        // Log initialization
        console.log('SamplerProcessor created');
    }
    
    // Handle messages from the main thread
    handleMessage(event) {
        const { data } = event;
        
        switch (data.type) {
            case 'init':
                this.initializeWasm(data.wasmModule);
                break;
                
            case 'loadSample':
                this.loadSample(data.audioData);
                break;
                
            case 'setPlaybackState':
                this.setPlaybackState(data.isPlaying, data.resetPosition);
                break;
                
            case 'seek':
                this.seek(data.time);
                break;
                
            case 'setLoopPoints':
                this.setLoopPoints(data.startTime, data.endTime, data.enabled);
                break;
                
            case 'triggerEnvelope':
                this.triggerEnvelope();
                break;
                
            case 'releaseEnvelope':
                this.releaseEnvelope();
                break;
                
            case 'setEnvelopeParameters':
                this.setEnvelopeParameters(
                    data.attack,
                    data.decay,
                    data.hold,
                    data.sustain,
                    data.release
                );
                break;
                
            case 'setEffectParameter':
                this.setEffectParameter(data.effectType, data.paramName, data.value);
                break;
                
            default:
                console.warn('Unknown message type:', data.type);
        }
    }
    
    // Initialize the Wasm module
    async initializeWasm(wasmModule) {
        try {
            // Store the Wasm module
            this.wasmModule = wasmModule;
            
            // Create the Rust processor
            this.rustProcessor = this.wasmModule.create_processor();
            
            this.initialized = true;
            console.log('Wasm processor initialized');
            
            // Notify the main thread
            this.port.postMessage({ type: 'initialized' });
        } catch (error) {
            console.error('Failed to initialize Wasm processor:', error);
            this.port.postMessage({ 
                type: 'error', 
                message: 'Failed to initialize Wasm processor' 
            });
        }
    }
    
    // Load audio sample data
    loadSample(audioData) {
        if (!this.initialized) {
            console.warn('Cannot load sample: Wasm processor not initialized');
            return;
        }
        
        try {
            // Create Float32Arrays from the channel data
            const leftChannel = new Float32Array(audioData.left);
            const rightChannel = audioData.right ? new Float32Array(audioData.right) : leftChannel;
            
            // Pass the audio data to the Rust processor
            this.rustProcessor.load_sample_data(leftChannel, audioData.sampleRate);
            
            console.log('Sample loaded:', leftChannel.length, 'samples at', audioData.sampleRate, 'Hz');
            
            // Notify the main thread
            this.port.postMessage({ type: 'sampleLoaded' });
        } catch (error) {
            console.error('Failed to load sample:', error);
            this.port.postMessage({ 
                type: 'error', 
                message: 'Failed to load sample' 
            });
        }
    }
    
    // Set playback state (play/pause/stop)
    setPlaybackState(isPlaying, resetPosition = false) {
        if (!this.initialized) {
            console.warn('Cannot set playback state: Wasm processor not initialized');
            return;
        }
        
        try {
            this.rustProcessor.set_playback_state(isPlaying);
            
            if (resetPosition) {
                // Additional logic for resetting position if needed
            }
            
            console.log('Playback state set to:', isPlaying);
        } catch (error) {
            console.error('Failed to set playback state:', error);
        }
    }
    
    // Seek to a specific time
    seek(time) {
        if (!this.initialized) {
            console.warn('Cannot seek: Wasm processor not initialized');
            return;
        }
        
        try {
            // Implementation will be added when the Rust processor supports seeking
            console.log('Seeking to time:', time);
        } catch (error) {
            console.error('Failed to seek:', error);
        }
    }
    
    // Set loop points
    setLoopPoints(startTime, endTime, enabled) {
        if (!this.initialized) {
            console.warn('Cannot set loop points: Wasm processor not initialized');
            return;
        }
        
        try {
            // Implementation will be added when the Rust processor supports looping
            console.log('Loop points set:', startTime, 'to', endTime, 'enabled:', enabled);
        } catch (error) {
            console.error('Failed to set loop points:', error);
        }
    }
    
    // Trigger envelope
    triggerEnvelope() {
        if (!this.initialized) {
            console.warn('Cannot trigger envelope: Wasm processor not initialized');
            return;
        }
        
        try {
            // Implementation will be added when the Rust processor supports envelopes
            console.log('Envelope triggered');
        } catch (error) {
            console.error('Failed to trigger envelope:', error);
        }
    }
    
    // Release envelope
    releaseEnvelope() {
        if (!this.initialized) {
            console.warn('Cannot release envelope: Wasm processor not initialized');
            return;
        }
        
        try {
            // Implementation will be added when the Rust processor supports envelopes
            console.log('Envelope released');
        } catch (error) {
            console.error('Failed to release envelope:', error);
        }
    }
    
    // Set envelope parameters
    setEnvelopeParameters(attack, decay, hold, sustain, release) {
        if (!this.initialized) {
            console.warn('Cannot set envelope parameters: Wasm processor not initialized');
            return;
        }
        
        try {
            // Implementation will be added when the Rust processor supports envelopes
            console.log('Envelope parameters set:', attack, decay, hold, sustain, release);
        } catch (error) {
            console.error('Failed to set envelope parameters:', error);
        }
    }
    
    // Set effect parameter
    setEffectParameter(effectType, paramName, value) {
        if (!this.initialized) {
            console.warn('Cannot set effect parameter: Wasm processor not initialized');
            return;
        }
        
        try {
            // Implementation will be added when the Rust processor supports effects
            console.log('Effect parameter set:', effectType, paramName, value);
        } catch (error) {
            console.error('Failed to set effect parameter:', error);
        }
    }
    
    // Process audio
    process(inputs, outputs, parameters) {
        // Skip processing if not initialized
        if (!this.initialized || !this.rustProcessor) {
            // Fill outputs with silence
            for (let outputIndex = 0; outputIndex < outputs.length; outputIndex++) {
                const output = outputs[outputIndex];
                for (let channelIndex = 0; channelIndex < output.length; channelIndex++) {
                    const outputChannel = output[channelIndex];
                    for (let i = 0; i < outputChannel.length; i++) {
                        outputChannel[i] = 0;
                    }
                }
            }
            return true;
        }
        
        try {
            // Call the Rust processor
            const result = this.rustProcessor.process(inputs, outputs, parameters);
            
            // Periodically send level information to the main thread
            if (Math.random() < 0.05) { // Throttle to ~5% of frames
                const output = outputs[0][0]; // First output, first channel
                if (output) {
                    let peak = 0;
                    let sum = 0;
                    
                    for (let i = 0; i < output.length; i++) {
                        const abs = Math.abs(output[i]);
                        peak = Math.max(peak, abs);
                        sum += abs * abs;
                    }
                    
                    const rms = Math.sqrt(sum / output.length);
                    
                    this.port.postMessage({
                        type: 'levels',
                        peak: peak,
                        rms: rms
                    });
                }
            }
            
            return result;
        } catch (error) {
            console.error('Error in audio processing:', error);
            return true; // Keep the processor alive despite errors
        }
    }
}

// Register the processor
registerProcessor('sampler-processor', SamplerProcessor);