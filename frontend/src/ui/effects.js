/**
 * Effects UI module for controlling audio effects
 */

// DOM elements
let filterTypeSelect;
let filterCutoffSlider;
let filterResonanceSlider;
let cutoffValueDisplay;
let resonanceValueDisplay;

let delayTimeSlider;
let delayFeedbackSlider;
let delayMixSlider;
let delayTimeValueDisplay;
let feedbackValueDisplay;
let delayMixValueDisplay;

let distortionTypeSelect;
let distortionDriveSlider;
let distortionMixSlider;
let outputGainSlider;
let driveValueDisplay;
let distortionMixValueDisplay;
let outputGainValueDisplay;

let tabButtons;
let tabContents;

// Callback function
let onEffectParameterChange;

/**
 * Set up effects UI
 * @param {Function} parameterChangeCallback - Function to call when effect parameters change
 */
export function setupEffectsUI(parameterChangeCallback) {
    onEffectParameterChange = parameterChangeCallback;
    
    // Get DOM elements
    filterTypeSelect = document.getElementById('filterType');
    filterCutoffSlider = document.getElementById('filterCutoff');
    filterResonanceSlider = document.getElementById('filterResonance');
    cutoffValueDisplay = document.getElementById('cutoffValue');
    resonanceValueDisplay = document.getElementById('resonanceValue');
    
    delayTimeSlider = document.getElementById('delayTime');
    delayFeedbackSlider = document.getElementById('delayFeedback');
    delayMixSlider = document.getElementById('delayMix');
    delayTimeValueDisplay = document.getElementById('delayTimeValue');
    feedbackValueDisplay = document.getElementById('feedbackValue');
    delayMixValueDisplay = document.getElementById('delayMixValue');
    
    distortionTypeSelect = document.getElementById('distortionType');
    distortionDriveSlider = document.getElementById('distortionDrive');
    distortionMixSlider = document.getElementById('distortionMix');
    outputGainSlider = document.getElementById('outputGain');
    driveValueDisplay = document.getElementById('driveValue');
    distortionMixValueDisplay = document.getElementById('distortionMixValue');
    outputGainValueDisplay = document.getElementById('outputGainValue');
    
    // Get tab elements
    tabButtons = document.querySelectorAll('.tab-btn');
    tabContents = document.querySelectorAll('.tab-content');
    
    // Set up event listeners
    setupFilterListeners();
    setupDelayListeners();
    setupDistortionListeners();
    setupTabListeners();
    
    console.log('Effects UI initialized');
}

/**
 * Set up filter effect listeners
 */
function setupFilterListeners() {
    if (filterTypeSelect) {
        filterTypeSelect.addEventListener('change', () => {
            const value = filterTypeSelect.value;
            if (onEffectParameterChange) {
                onEffectParameterChange('filter', 'type', parseFloat(value));
            }
        });
    }
    
    if (filterCutoffSlider) {
        filterCutoffSlider.addEventListener('input', () => {
            const value = parseFloat(filterCutoffSlider.value);
            if (cutoffValueDisplay) {
                cutoffValueDisplay.textContent = `${value.toFixed(0)} Hz`;
            }
        });
        
        filterCutoffSlider.addEventListener('change', () => {
            const value = parseFloat(filterCutoffSlider.value);
            if (onEffectParameterChange) {
                onEffectParameterChange('filter', 'cutoff', value);
            }
        });
    }
    
    if (filterResonanceSlider) {
        filterResonanceSlider.addEventListener('input', () => {
            const value = parseFloat(filterResonanceSlider.value);
            if (resonanceValueDisplay) {
                resonanceValueDisplay.textContent = value.toFixed(1);
            }
        });
        
        filterResonanceSlider.addEventListener('change', () => {
            const value = parseFloat(filterResonanceSlider.value);
            if (onEffectParameterChange) {
                onEffectParameterChange('filter', 'resonance', value);
            }
        });
    }
}

/**
 * Set up delay effect listeners
 */
function setupDelayListeners() {
    if (delayTimeSlider) {
        delayTimeSlider.addEventListener('input', () => {
            const value = parseFloat(delayTimeSlider.value);
            if (delayTimeValueDisplay) {
                delayTimeValueDisplay.textContent = `${value.toFixed(2)}s`;
            }
        });
        
        delayTimeSlider.addEventListener('change', () => {
            const value = parseFloat(delayTimeSlider.value);
            if (onEffectParameterChange) {
                onEffectParameterChange('delay', 'time', value);
            }
        });
    }
    
    if (delayFeedbackSlider) {
        delayFeedbackSlider.addEventListener('input', () => {
            const value = parseFloat(delayFeedbackSlider.value);
            if (feedbackValueDisplay) {
                feedbackValueDisplay.textContent = `${Math.round(value * 100)}%`;
            }
        });
        
        delayFeedbackSlider.addEventListener('change', () => {
            const value = parseFloat(delayFeedbackSlider.value);
            if (onEffectParameterChange) {
                onEffectParameterChange('delay', 'feedback', value);
            }
        });
    }
    
    if (delayMixSlider) {
        delayMixSlider.addEventListener('input', () => {
            const value = parseFloat(delayMixSlider.value);
            if (delayMixValueDisplay) {
                delayMixValueDisplay.textContent = `${Math.round(value * 100)}%`;
            }
        });
        
        delayMixSlider.addEventListener('change', () => {
            const value = parseFloat(delayMixSlider.value);
            if (onEffectParameterChange) {
                onEffectParameterChange('delay', 'mix', value);
            }
        });
    }
}

/**
 * Set up distortion effect listeners
 */
function setupDistortionListeners() {
    if (distortionTypeSelect) {
        distortionTypeSelect.addEventListener('change', () => {
            const value = distortionTypeSelect.value;
            if (onEffectParameterChange) {
                onEffectParameterChange('distortion', 'type', parseFloat(value));
            }
        });
    }
    
    if (distortionDriveSlider) {
        distortionDriveSlider.addEventListener('input', () => {
            const value = parseFloat(distortionDriveSlider.value);
            if (driveValueDisplay) {
                driveValueDisplay.textContent = value.toFixed(0);
            }
        });
        
        distortionDriveSlider.addEventListener('change', () => {
            const value = parseFloat(distortionDriveSlider.value);
            if (onEffectParameterChange) {
                onEffectParameterChange('distortion', 'drive', value);
            }
        });
    }
    
    if (distortionMixSlider) {
        distortionMixSlider.addEventListener('input', () => {
            const value = parseFloat(distortionMixSlider.value);
            if (distortionMixValueDisplay) {
                distortionMixValueDisplay.textContent = `${Math.round(value * 100)}%`;
            }
        });
        
        distortionMixSlider.addEventListener('change', () => {
            const value = parseFloat(distortionMixSlider.value);
            if (onEffectParameterChange) {
                onEffectParameterChange('distortion', 'mix', value);
            }
        });
    }
    
    if (outputGainSlider) {
        outputGainSlider.addEventListener('input', () => {
            const value = parseFloat(outputGainSlider.value);
            if (outputGainValueDisplay) {
                outputGainValueDisplay.textContent = `${Math.round(value * 100)}%`;
            }
        });
        
        outputGainSlider.addEventListener('change', () => {
            const value = parseFloat(outputGainSlider.value);
            if (onEffectParameterChange) {
                onEffectParameterChange('distortion', 'output_gain', value);
            }
        });
    }
}

/**
 * Set up tab switching
 */
function setupTabListeners() {
    if (!tabButtons || !tabContents) return;
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            
            // Update active tab button
            tabButtons.forEach(btn => {
                btn.classList.remove('active');
            });
            button.classList.add('active');
            
            // Show the selected tab content
            tabContents.forEach(content => {
                content.classList.add('hidden');
                if (content.id === `${tabId}Tab`) {
                    content.classList.remove('hidden');
                }
            });
        });
    });
}

/**
 * Update a parameter value display
 * @param {string} effectType - The effect type (filter, delay, distortion)
 * @param {string} paramName - The parameter name
 * @param {number} value - The parameter value
 */
export function updateParameterDisplay(effectType, paramName, value) {
    switch (effectType) {
        case 'filter':
            updateFilterDisplay(paramName, value);
            break;
        case 'delay':
            updateDelayDisplay(paramName, value);
            break;
        case 'distortion':
            updateDistortionDisplay(paramName, value);
            break;
    }
}

/**
 * Update filter parameter display
 * @param {string} paramName - The parameter name
 * @param {number} value - The parameter value
 */
function updateFilterDisplay(paramName, value) {
    switch (paramName) {
        case 'type':
            if (filterTypeSelect) {
                filterTypeSelect.value = value.toString();
            }
            break;
        case 'cutoff':
            if (filterCutoffSlider) {
                filterCutoffSlider.value = value.toString();
            }
            if (cutoffValueDisplay) {
                cutoffValueDisplay.textContent = `${value.toFixed(0)} Hz`;
            }
            break;
        case 'resonance':
            if (filterResonanceSlider) {
                filterResonanceSlider.value = value.toString();
            }
            if (resonanceValueDisplay) {
                resonanceValueDisplay.textContent = value.toFixed(1);
            }
            break;
    }
}

/**
 * Update delay parameter display
 * @param {string} paramName - The parameter name
 * @param {number} value - The parameter value
 */
function updateDelayDisplay(paramName, value) {
    switch (paramName) {
        case 'time':
            if (delayTimeSlider) {
                delayTimeSlider.value = value.toString();
            }
            if (delayTimeValueDisplay) {
                delayTimeValueDisplay.textContent = `${value.toFixed(2)}s`;
            }
            break;
        case 'feedback':
            if (delayFeedbackSlider) {
                delayFeedbackSlider.value = value.toString();
            }
            if (feedbackValueDisplay) {
                feedbackValueDisplay.textContent = `${Math.round(value * 100)}%`;
            }
            break;
        case 'mix':
            if (delayMixSlider) {
                delayMixSlider.value = value.toString();
            }
            if (delayMixValueDisplay) {
                delayMixValueDisplay.textContent = `${Math.round(value * 100)}%`;
            }
            break;
    }
}

/**
 * Update distortion parameter display
 * @param {string} paramName - The parameter name
 * @param {number} value - The parameter value
 */
function updateDistortionDisplay(paramName, value) {
    switch (paramName) {
        case 'type':
            if (distortionTypeSelect) {
                distortionTypeSelect.value = value.toString();
            }
            break;
        case 'drive':
            if (distortionDriveSlider) {
                distortionDriveSlider.value = value.toString();
            }
            if (driveValueDisplay) {
                driveValueDisplay.textContent = value.toFixed(0);
            }
            break;
        case 'mix':
            if (distortionMixSlider) {
                distortionMixSlider.value = value.toString();
            }
            if (distortionMixValueDisplay) {
                distortionMixValueDisplay.textContent = `${Math.round(value * 100)}%`;
            }
            break;
        case 'output_gain':
            if (outputGainSlider) {
                outputGainSlider.value = value.toString();
            }
            if (outputGainValueDisplay) {
                outputGainValueDisplay.textContent = `${Math.round(value * 100)}%`;
            }
            break;
    }
}