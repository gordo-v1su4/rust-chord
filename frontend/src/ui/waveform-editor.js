/**
 * Waveform editor controls module
 */

// State
let selectionControlsEnabled = false;
let zoomControlsEnabled = false;
let onCutCallback = null;
let onCopyCallback = null;
let onDeleteCallback = null;
let onZoomInCallback = null;
let onZoomOutCallback = null;
let onZoomResetCallback = null;

/**
 * Set up waveform editor controls
 * @param {Function} cutCallback - Function to call when cut button is clicked
 * @param {Function} copyCallback - Function to call when copy button is clicked
 * @param {Function} deleteCallback - Function to call when delete button is clicked
 * @param {Function} zoomInCallback - Function to call when zoom in button is clicked
 * @param {Function} zoomOutCallback - Function to call when zoom out button is clicked
 * @param {Function} zoomResetCallback - Function to call when zoom reset button is clicked
 */
export function setupWaveformEditor(
    cutCallback,
    copyCallback,
    deleteCallback,
    zoomInCallback,
    zoomOutCallback,
    zoomResetCallback
) {
    // Store callbacks
    onCutCallback = cutCallback;
    onCopyCallback = copyCallback;
    onDeleteCallback = deleteCallback;
    onZoomInCallback = zoomInCallback;
    onZoomOutCallback = zoomOutCallback;
    onZoomResetCallback = zoomResetCallback;
    
    // Create editor container
    const container = document.createElement('div');
    container.className = 'waveform-editor-controls';
    
    // Selection controls group
    const selectionGroup = document.createElement('div');
    selectionGroup.className = 'editor-control-group';
    
    const selectionLabel = document.createElement('span');
    selectionLabel.textContent = 'Selection:';
    selectionGroup.appendChild(selectionLabel);
    
    const cutBtn = createButton('Cut', 'cut-btn', handleCut);
    const copyBtn = createButton('Copy', 'copy-btn', handleCopy);
    const deleteBtn = createButton('Delete', 'delete-btn', handleDelete);
    
    selectionGroup.appendChild(cutBtn);
    selectionGroup.appendChild(copyBtn);
    selectionGroup.appendChild(deleteBtn);
    
    // Zoom controls group
    const zoomGroup = document.createElement('div');
    zoomGroup.className = 'editor-control-group';
    
    const zoomLabel = document.createElement('span');
    zoomLabel.textContent = 'Zoom:';
    zoomGroup.appendChild(zoomLabel);
    
    const zoomInBtn = createButton('Zoom In', 'zoom-in-btn', handleZoomIn);
    const zoomOutBtn = createButton('Zoom Out', 'zoom-out-btn', handleZoomOut);
    const zoomResetBtn = createButton('Reset', 'zoom-reset-btn', handleZoomReset);
    
    zoomGroup.appendChild(zoomInBtn);
    zoomGroup.appendChild(zoomOutBtn);
    zoomGroup.appendChild(zoomResetBtn);
    
    // Add groups to container
    container.appendChild(selectionGroup);
    container.appendChild(zoomGroup);
    
    // Add container to the DOM
    const waveformContainer = document.querySelector('.waveform-container');
    if (waveformContainer) {
        waveformContainer.appendChild(container);
    } else {
        document.body.appendChild(container);
    }
    
    // Initial state
    setSelectionControlsEnabled(false);
    setZoomControlsEnabled(false);
    
    console.log('Waveform editor controls initialized');
}

/**
 * Create a button element
 * @param {string} text - Button text
 * @param {string} className - Button class name
 * @param {Function} onClick - Click handler
 * @returns {HTMLButtonElement} - The button element
 */
function createButton(text, className, onClick) {
    const button = document.createElement('button');
    button.textContent = text;
    button.className = className;
    button.addEventListener('click', onClick);
    return button;
}

/**
 * Handle cut button click
 */
function handleCut() {
    if (onCutCallback) {
        onCutCallback();
    }
}

/**
 * Handle copy button click
 */
function handleCopy() {
    if (onCopyCallback) {
        onCopyCallback();
    }
}

/**
 * Handle delete button click
 */
function handleDelete() {
    if (onDeleteCallback) {
        onDeleteCallback();
    }
}

/**
 * Handle zoom in button click
 */
function handleZoomIn() {
    if (onZoomInCallback) {
        onZoomInCallback();
    }
}

/**
 * Handle zoom out button click
 */
function handleZoomOut() {
    if (onZoomOutCallback) {
        onZoomOutCallback();
    }
}

/**
 * Handle zoom reset button click
 */
function handleZoomReset() {
    if (onZoomResetCallback) {
        onZoomResetCallback();
    }
}

/**
 * Enable or disable selection controls
 * @param {boolean} enabled - Whether controls should be enabled
 */
export function setSelectionControlsEnabled(enabled) {
    selectionControlsEnabled = enabled;
    
    const buttons = document.querySelectorAll('.cut-btn, .copy-btn, .delete-btn');
    buttons.forEach(button => {
        button.disabled = !enabled;
    });
}

/**
 * Enable or disable zoom controls
 * @param {boolean} enabled - Whether controls should be enabled
 */
export function setZoomControlsEnabled(enabled) {
    zoomControlsEnabled = enabled;
    
    const buttons = document.querySelectorAll('.zoom-in-btn, .zoom-out-btn, .zoom-reset-btn');
    buttons.forEach(button => {
        button.disabled = !enabled;
    });
}