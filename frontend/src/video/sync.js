/**
 * Audio-Video synchronization module
 */

// Configuration
const config = {
    // Maximum time difference (in seconds) before forcing resync
    maxTimeDifference: 0.1,
    
    // How often to check sync (in milliseconds)
    syncCheckInterval: 100,
    
    // Debug mode
    debug: false
};

// State
let lastSyncTime = 0;
let syncIntervalId = null;
let lastRenderedFrameTime = -1;

/**
 * Synchronize audio and video playback
 * @param {Object} videoDecoder - The video decoder instance
 * @param {number} audioTime - The current audio playback time in seconds
 */
export function syncAudioVideo(videoDecoder, audioTime) {
    if (!videoDecoder) return;
    
    // Get current video time
    const videoTime = videoDecoder.currentTime;
    
    // Calculate time difference
    const timeDiff = Math.abs(audioTime - videoTime);
    
    // Check if we need to resync
    if (timeDiff > config.maxTimeDifference) {
        // Seek video to match audio
        videoDecoder.seek(audioTime);
        
        if (config.debug) {
            console.log(`A/V Sync: Resynced video (diff: ${timeDiff.toFixed(3)}s)`);
        }
    }
    
    // Update last sync time
    lastSyncTime = performance.now();
}

/**
 * Start continuous sync checking
 * @param {Object} videoDecoder - The video decoder instance
 * @param {Function} getAudioTime - Function that returns the current audio time
 */
export function startContinuousSync(videoDecoder, getAudioTime) {
    if (syncIntervalId) {
        stopContinuousSync();
    }
    
    syncIntervalId = setInterval(() => {
        const audioTime = getAudioTime();
        syncAudioVideo(videoDecoder, audioTime);
    }, config.syncCheckInterval);
    
    if (config.debug) {
        console.log('A/V Sync: Started continuous sync');
    }
}

/**
 * Stop continuous sync checking
 */
export function stopContinuousSync() {
    if (syncIntervalId) {
        clearInterval(syncIntervalId);
        syncIntervalId = null;
        
        if (config.debug) {
            console.log('A/V Sync: Stopped continuous sync');
        }
    }
}

/**
 * Render the appropriate video frame for the current audio time
 * @param {Object} videoDecoder - The video decoder instance
 * @param {Object} renderer - The video renderer
 * @param {number} audioTime - The current audio playback time in seconds
 * @returns {boolean} - Whether a new frame was rendered
 */
export function renderFrameForTime(videoDecoder, renderer, audioTime) {
    if (!videoDecoder || !renderer) return false;
    
    // Get the frame for the current audio time
    const frame = videoDecoder.getFrameAtTime(audioTime);
    
    if (!frame) return false;
    
    // Check if this is a new frame
    const frameTime = frame.timestamp / 1000000; // Convert from microseconds to seconds
    const isNewFrame = frameTime !== lastRenderedFrameTime;
    
    // Only render if this is a new frame
    if (isNewFrame) {
        renderer.renderFrame(frame);
        lastRenderedFrameTime = frameTime;
        
        if (config.debug) {
            console.log(`A/V Sync: Rendered frame at ${frameTime.toFixed(3)}s`);
        }
        
        return true;
    }
    
    return false;
}

/**
 * Calculate A/V sync metrics
 * @param {Object} videoDecoder - The video decoder instance
 * @param {number} audioTime - The current audio playback time in seconds
 * @returns {Object} - Sync metrics
 */
export function calculateSyncMetrics(videoDecoder, audioTime) {
    if (!videoDecoder) {
        return {
            timeDifference: 0,
            inSync: true,
            syncQuality: 100
        };
    }
    
    // Get current video time
    const videoTime = videoDecoder.currentTime;
    
    // Calculate time difference
    const timeDiff = audioTime - videoTime;
    
    // Determine if in sync
    const inSync = Math.abs(timeDiff) <= config.maxTimeDifference;
    
    // Calculate sync quality (100% = perfect sync, 0% = maxTimeDifference or worse)
    const syncQuality = Math.max(0, 100 - (Math.abs(timeDiff) / config.maxTimeDifference) * 100);
    
    return {
        timeDifference: timeDiff,
        inSync,
        syncQuality
    };
}

/**
 * Set up A/V sync for a video element and audio context
 * @param {HTMLVideoElement} videoElement - The video element
 * @param {AudioContext} audioContext - The audio context
 * @returns {Object} - Sync controller
 */
export function setupElementSync(videoElement, audioContext) {
    if (!videoElement || !audioContext) {
        throw new Error('Video element and audio context are required');
    }
    
    // Create a media element source for the video's audio
    const sourceNode = audioContext.createMediaElementSource(videoElement);
    
    // Connect to audio context destination
    sourceNode.connect(audioContext.destination);
    
    // Mute the video element (we'll use the audio context for playback)
    videoElement.muted = true;
    
    // Sync controller
    const controller = {
        // Start playback
        play: () => {
            videoElement.play();
            return audioContext.resume();
        },
        
        // Pause playback
        pause: () => {
            videoElement.pause();
            return audioContext.suspend();
        },
        
        // Seek to a specific time
        seek: (time) => {
            videoElement.currentTime = time;
        },
        
        // Get current time
        getCurrentTime: () => {
            return audioContext.currentTime;
        },
        
        // Get duration
        getDuration: () => {
            return videoElement.duration;
        },
        
        // Clean up
        cleanup: () => {
            videoElement.pause();
            sourceNode.disconnect();
        }
    };
    
    return controller;
}

/**
 * Enable or disable debug mode
 * @param {boolean} enabled - Whether debug mode should be enabled
 */
export function setDebugMode(enabled) {
    config.debug = enabled;
}

/**
 * Set sync configuration
 * @param {Object} options - Configuration options
 */
export function setSyncConfig(options) {
    if (options.maxTimeDifference !== undefined) {
        config.maxTimeDifference = options.maxTimeDifference;
    }
    
    if (options.syncCheckInterval !== undefined) {
        config.syncCheckInterval = options.syncCheckInterval;
    }
    
    if (options.debug !== undefined) {
        config.debug = options.debug;
    }
}

/**
 * Get current sync configuration
 * @returns {Object} - Current configuration
 */
export function getSyncConfig() {
    return { ...config };
}