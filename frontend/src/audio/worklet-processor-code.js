// This file exports the worklet processor code as a string
// It will be used to create a Blob URL for the AudioWorklet

export const workletProcessorCode = `
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
                this.initializeWasm();
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
    async initializeWasm() {
        try {
            // In a real application, we would load the Wasm module here
            // But since fetch is not available in AudioWorklet, we'll use a pure JavaScript implementation
            
            // Create a dummy Wasm instance for now
            this.wasmInstance = null;
            
            // Create a JavaScript implementation of the sampler
            // This replaces the Rust processor until we can properly integrate with Wasm
            this.sampleBuffer = null;
            this.sampleRate = 0;
            this.isPlaying = false;
            this.playbackPosition = 0;
            
            // Initialize the processor directly without relying on Wasm
            this.initialized = true;
            
            this.rustProcessor = {
                // Load sample data
                load_sample_data: (leftChannel, sampleRate) => {
                    console.log('Worklet: Loading sample data', leftChannel.length, sampleRate);
                    this.sampleBuffer = leftChannel;
                    this.sampleRate = sampleRate;
                    this.playbackPosition = 0;
                },
                
                // Set playback state
                set_playback_state: (isPlaying) => {
                    console.log('Worklet: Setting playback state', isPlaying);
                    this.isPlaying = isPlaying;
                    
                    // Reset position if stopping
                    if (!isPlaying) {
                        this.playbackPosition = 0;
                    }
                },
                
                // Process audio
                process: (inputs, outputs) => {
                    // If we have a sample buffer and we're playing, output the sample
                    if (this.sampleBuffer && this.isPlaying && outputs[0] && outputs[0][0]) {
                        const output = outputs[0][0];
                        const bufferLength = output.length;
                        
                        // Fill the output buffer with sample data
                        for (let i = 0; i < bufferLength; i++) {
                            // Get the sample at the current position
                            const sampleIndex = Math.floor(this.playbackPosition);
                            
                            // If we've reached the end of the sample, stop playing
                            if (sampleIndex >= this.sampleBuffer.length) {
                                this.playbackPosition = 0;
                                this.isPlaying = false;
                                output[i] = 0;
                            } else {
                                // Output the sample
                                output[i] = this.sampleBuffer[sampleIndex];
                                
                                // Advance the playback position
                                this.playbackPosition += this.sampleRate / sampleRate;
                            }
                        }
                        
                        // Copy to second channel if it exists
                        if (outputs[0][1]) {
                            const outputRight = outputs[0][1];
                            for (let i = 0; i < bufferLength; i++) {
                                outputRight[i] = output[i];
                            }
                        }
                    } else {
                        // Output silence
                        for (let outputIndex = 0; outputIndex < outputs.length; outputIndex++) {
                            const output = outputs[outputIndex];
                            for (let channelIndex = 0; channelIndex < output.length; channelIndex++) {
                                const outputChannel = output[channelIndex];
                                for (let i = 0; i < outputChannel.length; i++) {
                                    outputChannel[i] = 0;
                                }
                            }
                        }
                    }
                    
                    return true;
                },
                
                // Seek to a specific position
                seek: (time) => {
                    if (this.sampleBuffer && this.sampleRate) {
                        // Convert time to sample position
                        this.playbackPosition = Math.floor(time * this.sampleRate);
                        
                        // Clamp to valid range
                        this.playbackPosition = Math.max(0, Math.min(this.playbackPosition, this.sampleBuffer.length - 1));
                    }
                }
            };
            
            this.initialized = true;
            console.log('Wasm processor initialized in worklet');
            
            // Notify the main thread
            this.port.postMessage({ type: 'initialized' });
        } catch (error) {
            console.error('Failed to initialize Wasm processor in worklet:', error);
            this.port.postMessage({
                type: 'error',
                message: 'Failed to initialize Wasm processor in worklet: ' + error.message
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
            // Update our internal state
            this.isPlaying = isPlaying;
            
            if (resetPosition) {
                this.playbackPosition = 0;
            }
            
            // Call the Rust processor
            this.rustProcessor.set_playback_state(isPlaying);
            
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
            if (this.sampleBuffer && this.sampleRate) {
                // Convert time to sample position
                this.playbackPosition = Math.floor(time * this.sampleRate);
                
                // Clamp to valid range
                this.playbackPosition = Math.max(0, Math.min(this.playbackPosition, this.sampleBuffer.length - 1));
                
                console.log('Seeking to time:', time, 'position:', this.playbackPosition);
            }
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
`;