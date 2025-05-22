/**
 * Video decoder module using Web Codecs API
 */

// Check if Web Codecs API is supported
const isWebCodecsSupported = () => {
    return typeof window.VideoDecoder === 'function' && 
           typeof window.AudioDecoder === 'function' && 
           typeof window.EncodedVideoChunk === 'function';
};

// Video decoder class
class VideoDecoderManager {
    constructor() {
        // Check for Web Codecs support
        if (!isWebCodecsSupported()) {
            throw new Error('Web Codecs API is not supported in this browser');
        }
        
        // Decoder instances
        this.videoDecoder = null;
        this.audioDecoder = null;
        
        // Video element (for easy decoding)
        this.videoElement = null;
        
        // Frame buffer
        this.frameBuffer = [];
        this.maxBufferSize = 30; // Maximum number of frames to keep in buffer
        
        // Callbacks
        this.onFrameDecoded = null;
        this.onAudioDecoded = null;
        this.onError = null;
        
        // State
        this.isDecoding = false;
        this.currentTime = 0;
        this.duration = 0;
        this.videoWidth = 0;
        this.videoHeight = 0;
        this.frameRate = 0;
        
        console.log('VideoDecoderManager created');
    }
    
    /**
     * Initialize the video decoder
     * @param {Function} onFrameCallback - Callback for decoded video frames
     * @param {Function} onAudioCallback - Callback for decoded audio data
     * @param {Function} onErrorCallback - Callback for errors
     */
    initialize(onFrameCallback, onAudioCallback, onErrorCallback) {
        this.onFrameDecoded = onFrameCallback;
        this.onAudioDecoded = onAudioCallback;
        this.onError = onErrorCallback;
        
        // Create hidden video element for easy decoding
        this.videoElement = document.createElement('video');
        this.videoElement.style.display = 'none';
        this.videoElement.muted = true;
        document.body.appendChild(this.videoElement);
        
        // Set up video element event listeners
        this.videoElement.addEventListener('loadedmetadata', this.handleMetadata.bind(this));
        this.videoElement.addEventListener('timeupdate', this.handleTimeUpdate.bind(this));
        this.videoElement.addEventListener('error', this.handleError.bind(this));
        
        console.log('VideoDecoderManager initialized');
    }
    
    /**
     * Load a video file
     * @param {string} videoUrl - URL of the video file
     * @returns {Promise<boolean>} - Whether the video was loaded successfully
     */
    async loadVideo(videoUrl) {
        try {
            // Reset state
            this.resetState();
            
            // Set video source
            this.videoElement.src = videoUrl;
            
            // Wait for metadata to load
            await new Promise((resolve, reject) => {
                const onMetadata = () => {
                    this.videoElement.removeEventListener('loadedmetadata', onMetadata);
                    resolve();
                };
                
                const onError = (error) => {
                    this.videoElement.removeEventListener('error', onError);
                    reject(error);
                };
                
                this.videoElement.addEventListener('loadedmetadata', onMetadata);
                this.videoElement.addEventListener('error', onError);
                
                // Start loading
                this.videoElement.load();
            });
            
            console.log('Video loaded:', videoUrl);
            return true;
        } catch (error) {
            console.error('Failed to load video:', error);
            if (this.onError) {
                this.onError(error);
            }
            return false;
        }
    }
    
    /**
     * Handle video metadata loaded
     */
    handleMetadata() {
        // Get video metadata
        this.duration = this.videoElement.duration;
        this.videoWidth = this.videoElement.videoWidth;
        this.videoHeight = this.videoElement.videoHeight;
        
        // Estimate frame rate (not always accurate)
        this.frameRate = 30; // Default to 30fps
        
        console.log('Video metadata:', {
            duration: this.duration,
            width: this.videoWidth,
            height: this.videoHeight,
            frameRate: this.frameRate
        });
    }
    
    /**
     * Handle video time update
     */
    handleTimeUpdate() {
        this.currentTime = this.videoElement.currentTime;
    }
    
    /**
     * Handle video error
     */
    handleError() {
        const error = this.videoElement.error;
        console.error('Video error:', error);
        
        if (this.onError) {
            this.onError(error);
        }
    }
    
    /**
     * Reset decoder state
     */
    resetState() {
        // Clear frame buffer
        this.clearFrameBuffer();
        
        // Reset state variables
        this.isDecoding = false;
        this.currentTime = 0;
        this.duration = 0;
        this.videoWidth = 0;
        this.videoHeight = 0;
        this.frameRate = 0;
    }
    
    /**
     * Start decoding frames
     */
    startDecoding() {
        if (this.isDecoding) return;
        
        this.isDecoding = true;
        
        // Start video playback (this will trigger frame decoding)
        this.videoElement.play();
        
        // Start capturing frames
        this.captureFrames();
        
        console.log('Started decoding');
    }
    
    /**
     * Stop decoding frames
     */
    stopDecoding() {
        if (!this.isDecoding) return;
        
        this.isDecoding = false;
        
        // Pause video playback
        this.videoElement.pause();
        
        console.log('Stopped decoding');
    }
    
    /**
     * Capture frames from the video element
     */
    captureFrames() {
        if (!this.isDecoding) return;
        
        // Create a canvas to capture the current frame
        const canvas = document.createElement('canvas');
        canvas.width = this.videoWidth;
        canvas.height = this.videoHeight;
        const ctx = canvas.getContext('2d');
        
        // Function to capture a single frame
        const captureFrame = () => {
            if (!this.isDecoding) return;
            
            // Draw the current frame to the canvas
            ctx.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);
            
            // Create a VideoFrame-like object (since we're not using the actual VideoDecoder)
            const frame = {
                timestamp: this.videoElement.currentTime * 1000000, // Convert to microseconds
                duration: 1000000 / this.frameRate, // Microseconds per frame
                width: canvas.width,
                height: canvas.height,
                imageData: ctx.getImageData(0, 0, canvas.width, canvas.height),
                close: function() {
                    // Simulate VideoFrame.close()
                }
            };
            
            // Add the frame to the buffer
            this.addFrameToBuffer(frame);
            
            // Call the frame callback
            if (this.onFrameDecoded) {
                this.onFrameDecoded(frame);
            }
            
            // Schedule the next frame capture
            requestAnimationFrame(captureFrame);
        };
        
        // Start capturing frames
        captureFrame();
    }
    
    /**
     * Add a frame to the buffer
     * @param {Object} frame - The frame to add
     */
    addFrameToBuffer(frame) {
        // Add the frame to the buffer
        this.frameBuffer.push(frame);
        
        // Remove oldest frames if buffer is full
        while (this.frameBuffer.length > this.maxBufferSize) {
            const oldestFrame = this.frameBuffer.shift();
            oldestFrame.close();
        }
    }
    
    /**
     * Clear the frame buffer
     */
    clearFrameBuffer() {
        // Close all frames in the buffer
        for (const frame of this.frameBuffer) {
            frame.close();
        }
        
        // Clear the buffer
        this.frameBuffer = [];
    }
    
    /**
     * Get a frame at a specific time
     * @param {number} time - The time in seconds
     * @returns {Object|null} - The frame at the specified time, or null if not found
     */
    getFrameAtTime(time) {
        // Convert time to microseconds
        const timeUs = time * 1000000;
        
        // Find the frame with the closest timestamp
        let closestFrame = null;
        let closestDiff = Infinity;
        
        for (const frame of this.frameBuffer) {
            const diff = Math.abs(frame.timestamp - timeUs);
            
            if (diff < closestDiff) {
                closestFrame = frame;
                closestDiff = diff;
            }
        }
        
        return closestFrame;
    }
    
    /**
     * Seek to a specific time
     * @param {number} time - The time to seek to in seconds
     */
    seek(time) {
        // Clamp time to valid range
        const clampedTime = Math.max(0, Math.min(time, this.duration));
        
        // Seek the video element
        this.videoElement.currentTime = clampedTime;
        
        // Clear the frame buffer
        this.clearFrameBuffer();
        
        console.log('Seeked to time:', clampedTime);
    }
    
    /**
     * Get video metadata
     * @returns {Object} - Video metadata
     */
    getMetadata() {
        return {
            duration: this.duration,
            width: this.videoWidth,
            height: this.videoHeight,
            frameRate: this.frameRate,
            currentTime: this.currentTime
        };
    }
    
    /**
     * Clean up resources
     */
    cleanup() {
        // Stop decoding
        this.stopDecoding();
        
        // Clear frame buffer
        this.clearFrameBuffer();
        
        // Remove video element
        if (this.videoElement) {
            this.videoElement.removeEventListener('loadedmetadata', this.handleMetadata);
            this.videoElement.removeEventListener('timeupdate', this.handleTimeUpdate);
            this.videoElement.removeEventListener('error', this.handleError);
            
            this.videoElement.pause();
            this.videoElement.src = '';
            this.videoElement.load();
            
            if (this.videoElement.parentNode) {
                this.videoElement.parentNode.removeChild(this.videoElement);
            }
            
            this.videoElement = null;
        }
        
        console.log('VideoDecoderManager cleaned up');
    }
}

// Initialize the video decoder
let decoderInstance = null;

/**
 * Initialize the video decoder
 * @returns {Promise<VideoDecoderManager>} - The video decoder instance
 */
export async function initVideoDecoder() {
    if (decoderInstance) {
        return decoderInstance;
    }
    
    try {
        // Check for Web Codecs support
        if (!isWebCodecsSupported()) {
            console.warn('Web Codecs API is not supported in this browser');
            throw new Error('Web Codecs API is not supported');
        }
        
        // Create decoder instance
        decoderInstance = new VideoDecoderManager();
        
        // Initialize decoder
        decoderInstance.initialize(
            handleVideoFrame,
            handleAudioData,
            handleDecoderError
        );
        
        console.log('Video decoder initialized');
        return decoderInstance;
    } catch (error) {
        console.error('Failed to initialize video decoder:', error);
        throw error;
    }
}

/**
 * Handle decoded video frames
 * @param {VideoFrame} frame - The decoded video frame
 */
function handleVideoFrame(frame) {
    // This will be handled by the renderer
    // The frame is already in the buffer
}

/**
 * Handle decoded audio data
 * @param {AudioData} audioData - The decoded audio data
 */
function handleAudioData(audioData) {
    // Not implemented in this simplified version
}

/**
 * Handle decoder errors
 * @param {Error} error - The error
 */
function handleDecoderError(error) {
    console.error('Decoder error:', error);
}

/**
 * Set up the video renderer
 * @param {HTMLCanvasElement} canvas - The canvas element to render to
 * @returns {Object} - The renderer object
 */
export function setupVideoRenderer(canvas) {
    if (!canvas) {
        throw new Error('Canvas element is required');
    }
    
    // Get canvas context
    const ctx = canvas.getContext('2d');
    
    // Set up animation frame
    let animationFrameId = null;
    
    // Render a frame to the canvas
    const renderFrame = (frame) => {
        if (!frame || !ctx) return;
        
        // Resize canvas if needed
        if (canvas.width !== frame.width || canvas.height !== frame.height) {
            canvas.width = frame.width;
            canvas.height = frame.height;
        }
        
        // Draw the frame to the canvas
        ctx.putImageData(frame.imageData, 0, 0);
    };
    
    // Start rendering loop
    const startRendering = () => {
        if (animationFrameId) return;
        
        const render = () => {
            if (!decoderInstance) return;
            
            // Get the current frame
            const frame = decoderInstance.getFrameAtTime(decoderInstance.currentTime);
            
            // Render the frame
            if (frame) {
                renderFrame(frame);
            }
            
            // Continue rendering loop
            animationFrameId = requestAnimationFrame(render);
        };
        
        animationFrameId = requestAnimationFrame(render);
    };
    
    // Stop rendering loop
    const stopRendering = () => {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    };
    
    // Start rendering
    startRendering();
    
    // Return renderer object
    return {
        renderFrame,
        startRendering,
        stopRendering
    };
}

/**
 * Clean up video decoder resources
 */
export function cleanupVideoDecoder() {
    if (decoderInstance) {
        decoderInstance.cleanup();
        decoderInstance = null;
    }
}