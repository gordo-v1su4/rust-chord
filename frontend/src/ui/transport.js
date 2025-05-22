/**
 * Transport controls module for playback control
 */

// DOM elements
let playBtn;
let pauseBtn;
let stopBtn;
let seekSlider;
let currentTimeDisplay;
let totalTimeDisplay;
let loopStartSlider;
let loopEndSlider;
let loopEnabledCheckbox;
let loopStartValueDisplay;
let loopEndValueDisplay;

// Callback functions
let onPlay;
let onPause;
let onStop;
let onSeek;
let onLoopChange;

/**
 * Set up transport controls
 * @param {Function} playCallback - Function to call when play button is clicked
 * @param {Function} pauseCallback - Function to call when pause button is clicked
 * @param {Function} stopCallback - Function to call when stop button is clicked
 * @param {Function} seekCallback - Function to call when seek slider is moved
 * @param {Function} loopCallback - Function to call when loop settings change
 */
export function setupTransportControls(
    playCallback,
    pauseCallback,
    stopCallback,
    seekCallback,
    loopCallback = null
) {
    // Store callbacks
    onPlay = playCallback;
    onPause = pauseCallback;
    onStop = stopCallback;
    onSeek = seekCallback;
    onLoopChange = loopCallback;
    
    // Get DOM elements
    playBtn = document.getElementById('playBtn');
    pauseBtn = document.getElementById('pauseBtn');
    stopBtn = document.getElementById('stopBtn');
    seekSlider = document.getElementById('seekSlider');
    currentTimeDisplay = document.getElementById('currentTime');
    totalTimeDisplay = document.getElementById('totalTime');
    loopStartSlider = document.getElementById('loopStartTime');
    loopEndSlider = document.getElementById('loopEndTime');
    loopEnabledCheckbox = document.getElementById('loopEnabled');
    loopStartValueDisplay = document.getElementById('loopStartValue');
    loopEndValueDisplay = document.getElementById('loopEndValue');
    
    // Add event listeners
    if (playBtn) {
        playBtn.addEventListener('click', handlePlay);
    }
    
    if (pauseBtn) {
        pauseBtn.addEventListener('click', handlePause);
    }
    
    if (stopBtn) {
        stopBtn.addEventListener('click', handleStop);
    }
    
    if (seekSlider) {
        seekSlider.addEventListener('input', handleSeekInput);
        seekSlider.addEventListener('change', handleSeekChange);
    }
    
    // Set up loop controls if they exist
    if (loopStartSlider && loopEndSlider && loopEnabledCheckbox) {
        loopStartSlider.addEventListener('input', handleLoopStartInput);
        loopStartSlider.addEventListener('change', handleLoopChange);
        loopEndSlider.addEventListener('input', handleLoopEndInput);
        loopEndSlider.addEventListener('change', handleLoopChange);
        loopEnabledCheckbox.addEventListener('change', handleLoopEnabledChange);
    }
    
    console.log('Transport controls initialized');
}

/**
 * Handle play button click
 */
function handlePlay() {
    if (onPlay) {
        onPlay();
    }
    
    // Update UI
    if (playBtn) playBtn.disabled = true;
    if (pauseBtn) pauseBtn.disabled = false;
    if (stopBtn) stopBtn.disabled = false;
}

/**
 * Handle pause button click
 */
function handlePause() {
    if (onPause) {
        onPause();
    }
    
    // Update UI
    if (playBtn) playBtn.disabled = false;
    if (pauseBtn) pauseBtn.disabled = true;
}

/**
 * Handle stop button click
 */
function handleStop() {
    if (onStop) {
        onStop();
    }
    
    // Update UI
    if (playBtn) playBtn.disabled = false;
    if (pauseBtn) pauseBtn.disabled = true;
    if (stopBtn) stopBtn.disabled = true;
    if (seekSlider) seekSlider.value = 0;
}

/**
 * Handle seek slider input (while dragging)
 */
function handleSeekInput() {
    // Update time display while dragging
    if (currentTimeDisplay && totalTimeDisplay) {
        const position = parseFloat(seekSlider.value);
        const totalTime = parseDurationString(totalTimeDisplay.textContent);
        const currentTime = (position / 100) * totalTime;
        
        currentTimeDisplay.textContent = formatTime(currentTime);
    }
}

/**
 * Handle seek slider change (after dragging)
 */
function handleSeekChange() {
    if (onSeek) {
        const position = parseFloat(seekSlider.value);
        onSeek(position);
    }
}

/**
 * Handle loop start slider input
 */
function handleLoopStartInput() {
    // Ensure loop start is less than loop end
    const startValue = parseFloat(loopStartSlider.value);
    const endValue = parseFloat(loopEndSlider.value);
    
    if (startValue >= endValue) {
        loopStartSlider.value = endValue - 1;
    }
    
    // Update display
    updateLoopDisplays();
}

/**
 * Handle loop end slider input
 */
function handleLoopEndInput() {
    // Ensure loop end is greater than loop start
    const startValue = parseFloat(loopStartSlider.value);
    const endValue = parseFloat(loopEndSlider.value);
    
    if (endValue <= startValue) {
        loopEndSlider.value = startValue + 1;
    }
    
    // Update display
    updateLoopDisplays();
}

/**
 * Handle loop enabled checkbox change
 */
function handleLoopEnabledChange() {
    handleLoopChange();
}

/**
 * Handle loop settings change
 */
function handleLoopChange() {
    if (onLoopChange) {
        const startValue = parseFloat(loopStartSlider.value);
        const endValue = parseFloat(loopEndSlider.value);
        const enabled = loopEnabledCheckbox.checked;
        
        // Convert slider values (0-100) to time values
        const totalTime = parseDurationString(totalTimeDisplay.textContent);
        const startTime = (startValue / 100) * totalTime;
        const endTime = (endValue / 100) * totalTime;
        
        onLoopChange(startTime, endTime, enabled);
    }
}

/**
 * Update loop time displays
 */
function updateLoopDisplays() {
    if (loopStartValueDisplay && loopEndValueDisplay && totalTimeDisplay) {
        const startValue = parseFloat(loopStartSlider.value);
        const endValue = parseFloat(loopEndSlider.value);
        const totalTime = parseDurationString(totalTimeDisplay.textContent);
        
        const startTime = (startValue / 100) * totalTime;
        const endTime = (endValue / 100) * totalTime;
        
        loopStartValueDisplay.textContent = formatTime(startTime) + 's';
        loopEndValueDisplay.textContent = formatTime(endTime) + 's';
    }
}

/**
 * Update the seek slider position
 * @param {number} position - The normalized position (0-1)
 */
export function updateSeekPosition(position) {
    if (seekSlider) {
        seekSlider.value = position * 100;
    }
}

/**
 * Update the current time display
 * @param {number} time - The current time in seconds
 */
export function updateCurrentTime(time) {
    if (currentTimeDisplay) {
        currentTimeDisplay.textContent = formatTime(time);
    }
}

/**
 * Update the total duration display
 * @param {number} duration - The total duration in seconds
 */
export function updateTotalDuration(duration) {
    if (totalTimeDisplay) {
        totalTimeDisplay.textContent = formatTime(duration);
    }
    
    // Reset and update loop displays
    if (loopStartSlider && loopEndSlider) {
        loopStartSlider.value = 0;
        loopEndSlider.value = 100;
        updateLoopDisplays();
    }
}

/**
 * Format time in seconds to MM:SS format
 * @param {number} seconds - Time in seconds
 * @returns {string} - Formatted time string
 */
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Parse a duration string in MM:SS format to seconds
 * @param {string} durationString - Duration string in MM:SS format
 * @returns {number} - Duration in seconds
 */
function parseDurationString(durationString) {
    const parts = durationString.split(':');
    if (parts.length === 2) {
        const minutes = parseInt(parts[0], 10);
        const seconds = parseInt(parts[1], 10);
        return minutes * 60 + seconds;
    }
    return 0;
}

/**
 * Enable or disable transport controls
 * @param {boolean} enabled - Whether controls should be enabled
 */
export function setControlsEnabled(enabled) {
    if (playBtn) playBtn.disabled = !enabled;
    if (pauseBtn) pauseBtn.disabled = !enabled;
    if (stopBtn) stopBtn.disabled = !enabled;
    if (seekSlider) seekSlider.disabled = !enabled;
    if (loopStartSlider) loopStartSlider.disabled = !enabled;
    if (loopEndSlider) loopEndSlider.disabled = !enabled;
    if (loopEnabledCheckbox) loopEnabledCheckbox.disabled = !enabled;
}