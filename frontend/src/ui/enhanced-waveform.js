/**
 * Enhanced waveform visualization module using Rust-based peak calculation
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
let wasmModule = null;
let currentZoom = 1.0;
let offsetX = 0; // Offset for panning
let isDragging = false;
let dragStartX = 0;
let initialOffsetX = 0;
let isSelecting = false;
let selectionStart = 0; // 0-1 normalized position
let selectionEnd = 0; // 0-1 normalized position
let hasSelection = false;

// Cache for peak data
let peakDataCache = new Map();

/**
 * Initialize the enhanced waveform visualization
 * @param {HTMLCanvasElement} canvasElement - The canvas element to draw on
 */
export async function setupEnhancedWaveformVisualization(canvasElement) {
    canvas = canvasElement;
    ctx = canvas.getContext('2d');
    
    // Load the WASM module
    try {
        wasmModule = await import('/sampler-wasm/pkg/sampler_wasm.js');
        await wasmModule.default();
        console.log('Enhanced waveform: WASM module loaded successfully');
    } catch (error) {
        console.error('Failed to load WASM module:', error);
        // Fallback to JavaScript implementation
        wasmModule = null;
    }
    
    // Set up resize handling
    resizeCanvas();
    resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(canvas);
    
    // Initial draw
    drawEmptyWaveform();
    
    // Add event listeners for zooming and panning
    canvas.addEventListener('wheel', handleMouseWheel);
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('dblclick', handleDoubleClick);
    document.addEventListener('keydown', handleKeyDown);
}

/**
 * Resize the canvas to match its container
 */
function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    
    // Clear peak cache on resize
    peakDataCache.clear();
    
    // Redraw after resize
    if (waveformData) {
        drawEnhancedWaveform(canvas, waveformData);
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
 * Draw the enhanced waveform from an audio buffer
 * @param {HTMLCanvasElement} canvas - The canvas element to draw on
 * @param {AudioBuffer} audioBuffer - The audio buffer to visualize
 * @param {number} zoom - Zoom factor (default: 1.0)
 */
export function drawEnhancedWaveform(canvas, audioBuffer, zoom = 1.0, offset = 0) {
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerY = height / 2;
    
    // Store reference to the audio buffer
    waveformData = audioBuffer;
    duration = audioBuffer.duration;
    currentZoom = zoom;
    offsetX = offset;
    
    // Clear canvas
    ctx.fillStyle = config.backgroundColor;
    ctx.fillRect(0, 0, width, height);
    
    // Draw time grid
    drawTimeGrid(ctx, width, height, audioBuffer.duration);
    
    // Get audio data
    const channelData = audioBuffer.getChannelData(0); // Use first channel
    
    // Calculate peaks using Rust implementation if available
    const peaks = calculateEnhancedPeaks(channelData, width, zoom, offsetX);
    
    // Draw the enhanced waveform
    drawWaveformFromPeaks(ctx, peaks, width, height, centerY);
    
    // Draw the loop region if enabled
    if (loopEnabled) {
        drawLoopRegion(ctx, width, height);
    }
    
    // Draw the selection region if active
    if (hasSelection) {
        drawSelectionRegion(ctx, width, height);
    }
    
    // Draw the playhead
    drawPlayhead(ctx, width, height, playheadPosition);
}

/**
 * Calculate enhanced peaks using Rust implementation
 * @param {Float32Array} channelData - The audio channel data
 * @param {number} width - The canvas width
 * @param {number} zoom - Zoom factor
 * @returns {Float32Array} - Array of peak values (min/max pairs)
 */
function calculateEnhancedPeaks(channelData, width, zoom, offset = 0) {
    // Create a cache key
    const cacheKey = `${channelData.length}-${width}-${zoom}`;
    
    // Check cache first
    if (peakDataCache.has(cacheKey)) {
        return peakDataCache.get(cacheKey);
    }
    
    let peaks;
    
    if (wasmModule && wasmModule.calculate_adaptive_peaks) {
        // Use Rust implementation for better performance
        try {
            peaks = wasmModule.calculate_adaptive_peaks(channelData, zoom, width, offset);
            console.log('Using Rust peak calculation');
        } catch (error) {
            console.warn('Rust peak calculation failed, falling back to JavaScript:', error);
            peaks = calculatePeaksJavaScript(channelData, width, zoom, offset);
        }
    } else {
        // Fallback to JavaScript implementation
        peaks = calculatePeaksJavaScript(channelData, width, zoom, offset);
        console.log('Using JavaScript peak calculation');
    }
    
    // Cache the result
    peakDataCache.set(cacheKey, peaks);
    
    return peaks;
}

/**
 * JavaScript fallback for peak calculation
 * @param {Float32Array} channelData - The audio channel data
 * @param {number} width - The canvas width
 * @param {number} zoom - Zoom factor
 * @returns {Float32Array} - Array of peak values (min/max pairs)
 */
function calculatePeaksJavaScript(channelData, width, zoom, offset = 0) {
    const visibleSamples = Math.floor(channelData.length / zoom);
    const samplesPerPeak = Math.max(1, Math.floor(visibleSamples / width));
    
    // Apply the offset to determine the starting sample
    const startOffset = Math.floor(offset * samplesPerPeak * zoom);
    
    if (samplesPerPeak <= 1) {
        // At high zoom, return individual samples
        const start = Math.min(startOffset, channelData.length - 1);
        const end = Math.min(start + visibleSamples, channelData.length);
        return channelData.slice(start, end);
    }
    
    // Calculate min/max pairs for each pixel column
    const peaks = new Float32Array(width * 2);
    
    for (let i = 0; i < width; i++) {
        const start = startOffset + (i * samplesPerPeak);
        const end = Math.min(start + samplesPerPeak, channelData.length);
        
        let min = 0;
        let max = 0;
        
        for (let j = start; j < end; j++) {
            const sample = channelData[j];
            min = Math.min(min, sample);
            max = Math.max(max, sample);
        }
        
        peaks[i * 2] = min;
        peaks[i * 2 + 1] = max;
    }
    
    return peaks;
}

/**
 * Draw waveform from peak data
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 * @param {Float32Array} peaks - The peak data (min/max pairs or individual samples)
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @param {number} centerY - Center Y position
 */
function drawWaveformFromPeaks(ctx, peaks, width, height, centerY) {
    ctx.fillStyle = config.waveformColor + '80'; // Semi-transparent fill
    ctx.strokeStyle = config.waveformColor;
    ctx.lineWidth = 1;
    
    // Check if we have min/max pairs or individual samples
    const hasPairs = peaks.length >= width * 2;
    
    if (hasPairs) {
        // Draw filled waveform using min/max pairs
        ctx.beginPath();
        
        // Draw top half (max values)
        for (let i = 0; i < width && i * 2 + 1 < peaks.length; i++) {
            const max = peaks[i * 2 + 1];
            const x = i;
            const y = centerY - (max * centerY * 0.9);
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        // Draw bottom half (min values) in reverse
        for (let i = width - 1; i >= 0 && i * 2 < peaks.length; i--) {
            const min = peaks[i * 2];
            const x = i;
            const y = centerY - (min * centerY * 0.9);
            ctx.lineTo(x, y);
        }
        
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    } else {
        // Draw simple line waveform for individual samples
        ctx.beginPath();
        
        for (let i = 0; i < Math.min(peaks.length, width); i++) {
            const sample = peaks[i];
            const x = i * (width / peaks.length);
            const y = centerY - (sample * centerY * 0.9);
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.stroke();
    }
}

/**
 * Set zoom level and redraw
 * @param {number} zoom - Zoom factor
 */
export function setWaveformZoom(zoom, centerPoint = 0.5) {
    if (waveformData && canvas) {
        // Adjust the offset based on the zoom center point
        const oldZoom = currentZoom;
        const newZoom = zoom;
        
        // Calculate new offset to keep the center point centered
        const normalizedOffset = offsetX / width;
        const zoomRatio = newZoom / oldZoom;
        const newNormalizedOffset = normalizedOffset + (centerPoint * (1 - 1/zoomRatio));
        
        // Apply the new zoom and offset
        offsetX = newNormalizedOffset * width;
        drawEnhancedWaveform(canvas, waveformData, zoom, offsetX);
    }
}

/**
 * Set the waveform pan/offset
 * @param {number} offset - The pixel offset
 */
export function setWaveformOffset(offset) {
    if (waveformData && canvas) {
        offsetX = Math.max(0, offset);
        drawEnhancedWaveform(canvas, waveformData, currentZoom, offsetX);
    }
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
    let interval = config.minTimeInterval;
    let numLines = Math.ceil(duration / interval);
    
    // If we have too many lines, increase the interval
    if (numLines > config.maxGridLines) {
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
/**
 * Draw the selection region
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 * @param {number} width - The canvas width
 * @param {number} height - The canvas height
 */
function drawSelectionRegion(ctx, width, height) {
    const startX = selectionStart * width;
    const endX = selectionEnd * width;
    
    // Draw selection region background
    ctx.fillStyle = 'rgba(97, 218, 251, 0.3)';
    ctx.fillRect(startX, 0, endX - startX, height);
    
    // Draw selection region borders
    ctx.strokeStyle = '#61dafb';
    ctx.lineWidth = 2;
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
export function updateEnhancedPlayhead(canvas, position) {
    if (!canvas) return;
    
    playheadPosition = position;
    
    // Redraw the waveform with the new playhead position
    if (waveformData) {
        drawEnhancedWaveform(canvas, waveformData, currentZoom);
    }
}

/**
 * Set the loop region
 * @param {number} start - The normalized start position (0-1)
 * @param {number} end - The normalized end position (0-1)
 * @param {boolean} enabled - Whether looping is enabled
 */
export function setEnhancedLoopRegion(start, end, enabled) {
    loopStart = Math.max(0, Math.min(start, 1));
    loopEnd = Math.max(loopStart, Math.min(end, 1));
    loopEnabled = enabled;
    
    // Redraw the waveform with the new loop region
    if (waveformData && canvas) {
        drawEnhancedWaveform(canvas, waveformData, currentZoom);
    }
}

/**
 * Calculate RMS levels for level metering
 * @param {Float32Array} channelData - The audio channel data
 * @param {number} windowSize - Size of analysis window
 * @returns {Float32Array} - Array of RMS values
 */
export function calculateRMSLevels(channelData, windowSize = 1024) {
    if (wasmModule && wasmModule.calculate_rms_levels) {
        try {
            return wasmModule.calculate_rms_levels(channelData, windowSize);
        } catch (error) {
            console.warn('Rust RMS calculation failed, falling back to JavaScript:', error);
        }
    }
    
    // JavaScript fallback
    const numWindows = Math.ceil(channelData.length / windowSize);
    const rmsValues = new Float32Array(numWindows);
    
    for (let i = 0; i < numWindows; i++) {
        const start = i * windowSize;
        const end = Math.min(start + windowSize, channelData.length);
        
        let sumSquares = 0;
        let count = 0;
        
        for (let j = start; j < end; j++) {
            const sample = channelData[j];
            sumSquares += sample * sample;
            count++;
        }
        
        rmsValues[i] = count > 0 ? Math.sqrt(sumSquares / count) : 0;
    }
    
    return rmsValues;
}

/**
 * Convert linear amplitude to decibels
 * @param {number} amplitude - Linear amplitude
 * @returns {number} - Decibel value
 */
export function linearToDb(amplitude) {
    if (wasmModule && wasmModule.linear_to_db) {
        return wasmModule.linear_to_db(amplitude);
    }
    
    // JavaScript fallback
    return amplitude <= 0 ? -60 : 20 * Math.log10(amplitude);
}

/**
 * Clean up resources
 */
/**
 * Handle mouse wheel event for zooming
 * @param {WheelEvent} event - The wheel event
 */
function handleMouseWheel(event) {
    event.preventDefault();
    
    // Calculate the zoom center point based on mouse position
    const rect = canvas.getBoundingClientRect();
    const mouseX = (event.clientX - rect.left) / rect.width;
    
    // Determine zoom direction
    const zoomFactor = event.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.max(0.1, Math.min(50, currentZoom * zoomFactor));
    
    setWaveformZoom(newZoom, mouseX);
}

/**
 * Handle mouse down event for dragging or selecting
 * @param {MouseEvent} event - The mouse event
 */
function handleMouseDown(event) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    
    if (event.shiftKey) {
        // Start selection
        isSelecting = true;
        selectionStart = mouseX / rect.width;
        selectionEnd = selectionStart;
        hasSelection = true;
    } else {
        // Start dragging
        isDragging = true;
        dragStartX = mouseX;
        initialOffsetX = offsetX;
    }
}

/**
 * Handle mouse up event
 * @param {MouseEvent} event - The mouse event
 */
function handleMouseUp(event) {
    isDragging = false;
    
    if (isSelecting) {
        isSelecting = false;
        
        // Ensure selection is ordered correctly
        if (selectionStart > selectionEnd) {
            [selectionStart, selectionEnd] = [selectionEnd, selectionStart];
        }
        
        // If selection is too small, cancel it
        if (Math.abs(selectionEnd - selectionStart) < 0.01) {
            hasSelection = false;
        }
        
        // Redraw with the final selection
        if (waveformData) {
            drawEnhancedWaveform(canvas, waveformData, currentZoom, offsetX);
        }
    }
}

/**
 * Handle mouse move event
 * @param {MouseEvent} event - The mouse event
 */
function handleMouseMove(event) {
    if (!isDragging && !isSelecting) return;
    
    const rect = canvas.getBoundingClientRect();
    
    if (isDragging) {
        const mouseX = event.clientX - rect.left;
        const deltaX = mouseX - dragStartX;
        const newOffset = Math.max(0, initialOffsetX - deltaX);
        
        setWaveformOffset(newOffset);
    }
    
    if (isSelecting) {
        const mouseX = event.clientX - rect.left;
        selectionEnd = mouseX / rect.width;
        
        // Clamp to valid range
        selectionEnd = Math.max(0, Math.min(1, selectionEnd));
        
        // Redraw with the updated selection
        if (waveformData) {
            drawEnhancedWaveform(canvas, waveformData, currentZoom, offsetX);
        }
    }
}

/**
 * Handle double click to reset zoom and pan
 * @param {MouseEvent} event - The mouse event
 */
function handleDoubleClick(event) {
    // Reset zoom and offset
    currentZoom = 1.0;
    offsetX = 0;
    
    // Clear selection
    hasSelection = false;
    
    // Redraw waveform
    if (waveformData) {
        drawEnhancedWaveform(canvas, waveformData, currentZoom, offsetX);
    }
}

/**
 * Handle keyboard shortcuts
 * @param {KeyboardEvent} event - The keyboard event
 */
function handleKeyDown(event) {
    // Only handle if waveform has focus or is active
    if (!waveformData || !canvas.contains(document.activeElement)) return;
    
    switch (event.key) {
        case 'Escape':
            // Clear selection
            hasSelection = false;
            drawEnhancedWaveform(canvas, waveformData, currentZoom, offsetX);
            break;
            
        case 'Delete':
        case 'Backspace':
            // Delete selected region
            if (hasSelection && waveformData) {
                deleteSelectedRegion();
                event.preventDefault();
            }
            break;
            
        case 'c':
            // Copy selected region
            if (event.ctrlKey && hasSelection && waveformData) {
                copySelectedRegion();
                event.preventDefault();
            }
            break;
            
        case 'x':
            // Cut selected region
            if (event.ctrlKey && hasSelection && waveformData) {
                cutSelectedRegion();
                event.preventDefault();
            }
            break;
    }
}

/**
 * Delete the selected region from the audio buffer
 */
function deleteSelectedRegion() {
    if (!hasSelection || !waveformData) return;
    
    // Convert normalized positions to sample indices
    const startSample = Math.floor(selectionStart * waveformData.length);
    const endSample = Math.floor(selectionEnd * waveformData.length);
    
    // TODO: Implement actual audio buffer editing
    console.log(`Delete region: ${startSample} to ${endSample}`);
    
    // Clear selection after delete
    hasSelection = false;
    
    // Redraw waveform
    drawEnhancedWaveform(canvas, waveformData, currentZoom, offsetX);
}

/**
 * Copy the selected region to clipboard
 */
function copySelectedRegion() {
    if (!hasSelection || !waveformData) return;
    
    // Convert normalized positions to sample indices
    const startSample = Math.floor(selectionStart * waveformData.length);
    const endSample = Math.floor(selectionEnd * waveformData.length);
    
    // TODO: Implement actual audio buffer copying
    console.log(`Copy region: ${startSample} to ${endSample}`);
}

/**
 * Cut the selected region and copy to clipboard
 */
function cutSelectedRegion() {
    if (!hasSelection || !waveformData) return;
    
    // First copy, then delete
    copySelectedRegion();
    deleteSelectedRegion();
}

/**
 * Get the current selection range in seconds
 * @returns {Object} Object with start and end times in seconds
 */
export function getSelectionRange() {
    if (!hasSelection || !waveformData) return null;
    
    return {
        start: selectionStart * duration,
        end: selectionEnd * duration,
        hasSelection
    };
}

/**
 * Set the selection range
 * @param {number} start - Start time in seconds
 * @param {number} end - End time in seconds
 */
export function setSelectionRange(start, end) {
    if (!waveformData) return;
    
    selectionStart = Math.max(0, Math.min(start / duration, 1));
    selectionEnd = Math.max(0, Math.min(end / duration, 1));
    hasSelection = true;
    
    drawEnhancedWaveform(canvas, waveformData, currentZoom, offsetX);
}

/**
 * Clear the current selection
 */
export function clearSelection() {
    hasSelection = false;
    
    if (waveformData) {
        drawEnhancedWaveform(canvas, waveformData, currentZoom, offsetX);
    }
}

/**
 * Clean up resources
 */
export function cleanupEnhanced() {
    if (resizeObserver) {
        resizeObserver.disconnect();
    }
    
    // Remove event listeners
    if (canvas) {
        canvas.removeEventListener('wheel', handleMouseWheel);
        canvas.removeEventListener('mousedown', handleMouseDown);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('dblclick', handleDoubleClick);
    }
    
    document.removeEventListener('keydown', handleKeyDown);
    
    peakDataCache.clear();
}