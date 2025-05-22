/**
 * Utility functions for loading audio and video files
 */

/**
 * Load and decode an audio file
 * @param {File} file - The audio file to load
 * @param {AudioContext} audioContext - The audio context to use for decoding
 * @returns {Promise<AudioBuffer>} - The decoded audio buffer
 */
export async function loadAudioFile(file, audioContext) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = async (event) => {
            try {
                const arrayBuffer = event.target.result;
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                resolve(audioBuffer);
            } catch (error) {
                reject(new Error(`Failed to decode audio file: ${error.message}`));
            }
        };
        
        reader.onerror = () => {
            reject(new Error('Error reading audio file'));
        };
        
        reader.readAsArrayBuffer(file);
    });
}

/**
 * Extract audio data from an AudioBuffer
 * @param {AudioBuffer} audioBuffer - The audio buffer to extract data from
 * @returns {Object} - Object containing left and right channel data and sample rate
 */
export function extractAudioData(audioBuffer) {
    const left = audioBuffer.getChannelData(0);
    const right = audioBuffer.numberOfChannels > 1 
        ? audioBuffer.getChannelData(1) 
        : audioBuffer.getChannelData(0);
    
    return {
        left,
        right,
        sampleRate: audioBuffer.sampleRate
    };
}

/**
 * Load a video file and return a URL
 * @param {File} file - The video file to load
 * @returns {string} - The URL for the video file
 */
export function loadVideoFile(file) {
    return URL.createObjectURL(file);
}

/**
 * Clean up a video URL when no longer needed
 * @param {string} url - The URL to revoke
 */
export function revokeVideoUrl(url) {
    URL.revokeObjectURL(url);
}

/**
 * Get file metadata
 * @param {File} file - The file to get metadata for
 * @returns {Object} - Object containing file metadata
 */
export function getFileMetadata(file) {
    return {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: new Date(file.lastModified)
    };
}

/**
 * Format file size in a human-readable format
 * @param {number} bytes - The file size in bytes
 * @returns {string} - Formatted file size
 */
export function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}