/**
 * Audio level meters module
 */

// DOM elements
let levelMeter;
let levelValueDisplay;

// Configuration
const config = {
    updateInterval: 50, // ms
    peakHoldTime: 1500, // ms
    falloffRate: 0.05, // How quickly the meter falls when level decreases
    dbMin: -60, // Minimum dB value (effectively silence)
    dbMax: 0, // Maximum dB value (0 dB = full scale)
    meterColors: [
        { level: -60, color: '#4CAF50' }, // Green
        { level: -12, color: '#FFEB3B' }, // Yellow
        { level: -3, color: '#F44336' }   // Red
    ]
};

// State
let currentLevel = 0;
let peakLevel = 0;
let peakHoldTimer = null;
let lastUpdateTime = 0;
let animationFrameId = null;

/**
 * Set up audio meters
 */
export function setupMeters() {
    // Get DOM elements
    levelMeter = document.getElementById('levelMeter');
    levelValueDisplay = document.getElementById('levelValue');
    
    // Initialize meters
    resetMeters();
    
    // Listen for audio level events from the audio worklet
    window.addEventListener('audio-levels', handleAudioLevels);
    
    // Start animation loop
    startAnimationLoop();
    
    console.log('Audio meters initialized');
}

/**
 * Reset meters to initial state
 */
function resetMeters() {
    currentLevel = config.dbMin;
    peakLevel = config.dbMin;
    
    if (levelMeter) {
        levelMeter.style.setProperty('--level-width', '0%');
    }
    
    if (levelValueDisplay) {
        levelValueDisplay.textContent = formatDb(config.dbMin);
    }
    
    if (peakHoldTimer) {
        clearTimeout(peakHoldTimer);
        peakHoldTimer = null;
    }
}

/**
 * Handle audio level events from the audio worklet
 * @param {CustomEvent} event - The audio levels event
 */
function handleAudioLevels(event) {
    const { peak, rms } = event.detail;
    
    // Convert linear values to dB
    const peakDb = linearToDb(peak);
    const rmsDb = linearToDb(rms);
    
    // Use peak for the meter
    updateMeterLevel(peakDb);
}

/**
 * Update the meter level
 * @param {number} dbLevel - The level in dB
 */
function updateMeterLevel(dbLevel) {
    // Clamp the level to the configured range
    const clampedLevel = Math.max(config.dbMin, Math.min(config.dbMax, dbLevel));
    
    // Update current level with falloff
    if (clampedLevel > currentLevel) {
        // Attack: immediate rise to new level
        currentLevel = clampedLevel;
    }
    
    // Update peak level
    if (clampedLevel > peakLevel) {
        peakLevel = clampedLevel;
        
        // Reset peak hold timer
        if (peakHoldTimer) {
            clearTimeout(peakHoldTimer);
        }
        
        peakHoldTimer = setTimeout(() => {
            peakLevel = currentLevel;
        }, config.peakHoldTime);
    }
    
    // Update last update time
    lastUpdateTime = performance.now();
}

/**
 * Start the animation loop for smooth meter rendering
 */
function startAnimationLoop() {
    if (animationFrameId) return;
    
    const updateMeters = () => {
        // Apply falloff to current level
        const now = performance.now();
        const elapsed = now - lastUpdateTime;
        
        if (elapsed > config.updateInterval) {
            // Apply falloff
            currentLevel -= config.falloffRate * elapsed / 16; // Normalize to 60fps
            currentLevel = Math.max(config.dbMin, currentLevel);
            
            // Update last update time
            lastUpdateTime = now;
        }
        
        // Render meters
        renderMeters();
        
        // Continue animation loop
        animationFrameId = requestAnimationFrame(updateMeters);
    };
    
    animationFrameId = requestAnimationFrame(updateMeters);
}

/**
 * Stop the animation loop
 */
function stopAnimationLoop() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
}

/**
 * Render the meters based on current levels
 */
function renderMeters() {
    if (!levelMeter || !levelValueDisplay) return;
    
    // Calculate meter width percentage
    const levelPercent = dbToPercent(currentLevel);
    const peakPercent = dbToPercent(peakLevel);
    
    // Update meter element
    levelMeter.style.setProperty('--level-width', `${levelPercent}%`);
    levelMeter.style.setProperty('--peak-position', `${peakPercent}%`);
    
    // Set meter color based on level
    const meterColor = getMeterColor(currentLevel);
    levelMeter.style.setProperty('--meter-color', meterColor);
    
    // Update value display
    levelValueDisplay.textContent = formatDb(currentLevel);
}

/**
 * Convert a dB value to a percentage for meter display
 * @param {number} db - The level in dB
 * @returns {number} - The percentage (0-100)
 */
function dbToPercent(db) {
    // Map dB range to percentage (0-100)
    const range = config.dbMax - config.dbMin;
    const normalized = (db - config.dbMin) / range;
    return normalized * 100;
}

/**
 * Get the appropriate color for a given level
 * @param {number} db - The level in dB
 * @returns {string} - The color as a CSS color string
 */
function getMeterColor(db) {
    // Find the appropriate color based on level thresholds
    let color = config.meterColors[0].color;
    
    for (let i = 0; i < config.meterColors.length; i++) {
        if (db >= config.meterColors[i].level) {
            color = config.meterColors[i].color;
        }
    }
    
    return color;
}

/**
 * Convert a linear amplitude value to dB
 * @param {number} amplitude - Linear amplitude (0-1)
 * @returns {number} - Level in dB
 */
function linearToDb(amplitude) {
    if (amplitude < 0.0000001) { // -140 dB
        return config.dbMin;
    }
    
    return 20 * Math.log10(amplitude);
}

/**
 * Format a dB value for display
 * @param {number} db - The level in dB
 * @returns {string} - Formatted dB string
 */
function formatDb(db) {
    if (db <= config.dbMin) {
        return '-∞ dB';
    }
    
    return `${db.toFixed(1)} dB`;
}

/**
 * Update meters with new levels
 * @param {AudioWorkletNode} samplerNode - The sampler worklet node
 */
export function updateMeters(samplerNode) {
    // This is a placeholder - actual level updates come from the 'audio-levels' event
    // which is dispatched by the audio context module when it receives level data
    // from the audio worklet processor
}

/**
 * Clean up resources
 */
export function cleanup() {
    stopAnimationLoop();
    
    if (peakHoldTimer) {
        clearTimeout(peakHoldTimer);
        peakHoldTimer = null;
    }
    
    window.removeEventListener('audio-levels', handleAudioLevels);
}

// Add CSS to the document for meter styling
function addMeterStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .meter-bar {
            position: relative;
            height: 20px;
            background-color: #333;
            border-radius: 3px;
            overflow: hidden;
        }
        
        .meter-bar::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            width: var(--level-width, 0%);
            background: var(--meter-color, linear-gradient(to right, #4CAF50, #FFEB3B, #F44336));
            transition: width 0.05s ease-out;
        }
        
        .meter-bar::after {
            content: '';
            position: absolute;
            top: 0;
            left: var(--peak-position, 0%);
            height: 100%;
            width: 2px;
            background-color: #fff;
            opacity: 0.8;
        }
    `;
    document.head.appendChild(style);
}

// Add meter styles when the module is loaded
addMeterStyles();