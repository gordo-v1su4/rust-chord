/**
 * Waveform visualization module
 */

// Configuration
const config = {
    waveformColor: '#61dafb',
    backgroundColor: '#2a2a2a',
    playheadColor: '#ff5252',
    loopRegionColor: 'rgba(255, 255, 255, 0.2)',
    gridColor: '#444',
    textColor: '#aaa',
    fontSize: 10,
    minTimeInterval: 1.0, // Minimum time interval for grid lines (seconds)
    maxGridLines: 20, // Maximum number of grid lines to display
};

// State
let canvas = null;
let ctx = null;
let waveformData = null;
let playheadPosition = 0; // 0-1 normalized position
let loopStart = 0; // 0-1 normalized position
let loopEnd = 1; // 0-1 normalized position
let loopEnabled = false;
let duration = 0;
let resizeObserver = null;

/**
 * Initialize the waveform visualization
 * @param {HTMLCanvasElement} canvasElement - The canvas element to draw on
 */
export function setupWaveformVisualization(canvasElement) {
    canvas = canvasElement;
    ctx = canvas.getContext('2d');
    
    // Set up resize handling
    resizeCanvas();
    resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(canvas);
    
    // Initial draw
    drawEmptyWaveform();
}

/**
 * Resize the canvas to match its container
 */
function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    
    // Redraw after resize
    if (waveformData) {
        drawWaveform(canvas, waveformData);
    } else {
        drawEmptyWaveform();
    }
}

/**
 * Draw an empty waveform with grid
 */
function drawEmptyWaveform() {
    if (!ctx) return;
    
    // Clear canvas
    ctx.fillStyle = config.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw center line
    ctx.strokeStyle = config.gridColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
    
    // Draw text
    ctx.fillStyle = config.textColor;
    ctx.font = `${config.fontSize * window.devicePixelRatio}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('No audio loaded', canvas.width / 2, canvas.height / 2 - 10);
}

/**
 * Draw the waveform from an audio buffer
 * @param {HTMLCanvasElement} canvas - The canvas element to draw on
 * @param {AudioBuffer} audioBuffer - The audio buffer to visualize
 */
export function drawWaveform(canvas, audioBuffer) {
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerY = height / 2;
    
    // Store reference to the audio buffer
    waveformData = audioBuffer;
    duration = audioBuffer.duration;
    
    // Clear canvas
    ctx.fillStyle = config.backgroundColor;
    ctx.fillRect(0, 0, width, height);
    
    // Draw time grid
    drawTimeGrid(ctx, width, height, audioBuffer.duration);
    
    // Get audio data
    const channelData = audioBuffer.getChannelData(0); // Use first channel
    
    // Calculate the number of samples to skip to fit the waveform to the canvas width
    const skip = Math.max(1, Math.floor(channelData.length / width));
    
    // Calculate peak and RMS data for efficient drawing
    const peaks = calculatePeaks(channelData, width, skip);
    
    // Draw the waveform
    ctx.strokeStyle = config.waveformColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    
    for (let i = 0; i < peaks.length; i++) {
        const x = i;
        const y = centerY - (peaks[i] * centerY * 0.95); // Scale to 95% of half height
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    
    ctx.stroke();
    
    // Draw the loop region if enabled
    if (loopEnabled) {
        drawLoopRegion(ctx, width, height);
    }
    
    // Draw the playhead
    drawPlayhead(ctx, width, height, playheadPosition);
}

/**
 * Calculate peak values for efficient waveform drawing
 * @param {Float32Array} channelData - The audio channel data
 * @param {number} width - The canvas width
 * @param {number} skip - The number of samples to skip
 * @returns {Float32Array} - Array of peak values
 */
function calculatePeaks(channelData, width, skip) {
    const peaks = new Float32Array(width);
    
    for (let i = 0; i < width; i++) {
        const start = i * skip;
        const end = start + skip;
        let max = 0;
        
        for (let j = start; j < end && j < channelData.length; j++) {
            const value = Math.abs(channelData[j]);
            if (value > max) {
                max = value;
            }
        }
        
        peaks[i] = max;
    }
    
    return peaks;
}

/**
 * Draw time grid lines and labels
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 * @param {number} width - The canvas width
 * @param {number} height - The canvas height
 * @param {number} duration - The audio duration in seconds
 */
function drawTimeGrid(ctx, width, height, duration) {
    ctx.strokeStyle = config.gridColor;
    ctx.fillStyle = config.textColor;
    ctx.font = `${config.fontSize * window.devicePixelRatio}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.lineWidth = 0.5;
    
    // Calculate appropriate time interval based on duration
    // For longer files, we want fewer grid lines
    let interval = config.minTimeInterval;
    let numLines = Math.ceil(duration / interval);
    
    // If we have too many lines, increase the interval
    if (numLines > config.maxGridLines) {
        // Try intervals of 5s, 10s, 15s, 30s, 1m, 2m, 5m, etc.
        const possibleIntervals = [5, 10, 15, 30, 60, 120, 300, 600];
        
        for (const possibleInterval of possibleIntervals) {
            interval = possibleInterval;
            numLines = Math.ceil(duration / interval);
            
            if (numLines <= config.maxGridLines) {
                break;
            }
        }
    }
    
    // Draw grid lines and labels
    for (let i = 0; i <= numLines; i++) {
        const time = i * interval;
        if (time > duration) break;
        
        const x = (time / duration) * width;
        
        // Draw grid line
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
        
        // Draw time label
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        const label = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        ctx.fillText(label, x, height - 5);
    }
}

/**
 * Draw the playhead at the current position
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 * @param {number} width - The canvas width
 * @param {number} height - The canvas height
 * @param {number} position - The normalized position (0-1)
 */
function drawPlayhead(ctx, width, height, position) {
    const x = position * width;
    
    ctx.strokeStyle = config.playheadColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
}

/**
 * Draw the loop region
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 * @param {number} width - The canvas width
 * @param {number} height - The canvas height
 */
function drawLoopRegion(ctx, width, height) {
    const startX = loopStart * width;
    const endX = loopEnd * width;
    
    // Draw loop region background
    ctx.fillStyle = config.loopRegionColor;
    ctx.fillRect(startX, 0, endX - startX, height);
    
    // Draw loop region borders
    ctx.strokeStyle = config.waveformColor;
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 3]);
    
    // Start border
    ctx.beginPath();
    ctx.moveTo(startX, 0);
    ctx.lineTo(startX, height);
    ctx.stroke();
    
    // End border
    ctx.beginPath();
    ctx.moveTo(endX, 0);
    ctx.lineTo(endX, height);
    ctx.stroke();
    
    ctx.setLineDash([]);
}

/**
 * Update the playhead position
 * @param {HTMLCanvasElement} canvas - The canvas element
 * @param {number} position - The normalized position (0-1)
 */
export function updatePlayhead(canvas, position) {
    if (!canvas) return;
    
    playheadPosition = position;
    
    // Redraw the waveform with the new playhead position
    if (waveformData) {
        drawWaveform(canvas, waveformData);
    }
}

/**
 * Set the loop region
 * @param {number} start - The normalized start position (0-1)
 * @param {number} end - The normalized end position (0-1)
 * @param {boolean} enabled - Whether looping is enabled
 */
export function setLoopRegion(start, end, enabled) {
    loopStart = Math.max(0, Math.min(start, 1));
    loopEnd = Math.max(loopStart, Math.min(end, 1));
    loopEnabled = enabled;
    
    // Redraw the waveform with the new loop region
    if (waveformData && canvas) {
        drawWaveform(canvas, waveformData);
    }
}

/**
 * Clean up resources
 */
export function cleanup() {
    if (resizeObserver) {
        resizeObserver.disconnect();
    }
}