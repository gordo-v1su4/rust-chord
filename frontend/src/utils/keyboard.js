/**
 * Keyboard input handling module
 */

// Callback function for keyboard events
let keyboardCallback = null;

// State for key tracking
const keyStates = new Map();

/**
 * Set up keyboard event handlers
 * @param {Function} callback - Function to call when keyboard events occur
 */
export function setupKeyboardHandlers(callback) {
    keyboardCallback = callback;
    
    // Add event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Remove focus from any active element when pressing Tab
    window.addEventListener('keydown', (event) => {
        if (event.key === 'Tab') {
            // Prevent default tab behavior
            event.preventDefault();
            
            // Remove focus from active element
            if (document.activeElement) {
                document.activeElement.blur();
            }
        }
    });
    
    console.log('Keyboard handlers initialized');
}

/**
 * Handle keydown events
 * @param {KeyboardEvent} event - The keydown event
 */
function handleKeyDown(event) {
    // Skip if the event target is an input, textarea, or select
    if (isInputElement(event.target)) {
        return;
    }
    
    const key = event.key;
    
    // Skip if the key is already down (avoid repeat events)
    if (keyStates.get(key)) {
        return;
    }
    
    // Mark key as down
    keyStates.set(key, true);
    
    // Call the callback
    if (keyboardCallback) {
        keyboardCallback(key, true);
    }
    
    // Handle special keys
    handleSpecialKeys(event);
}

/**
 * Handle keyup events
 * @param {KeyboardEvent} event - The keyup event
 */
function handleKeyUp(event) {
    const key = event.key;
    
    // Mark key as up
    keyStates.set(key, false);
    
    // Call the callback (even for input elements)
    if (keyboardCallback) {
        keyboardCallback(key, false);
    }
}

/**
 * Check if an element is an input element
 * @param {Element} element - The element to check
 * @returns {boolean} - Whether the element is an input element
 */
function isInputElement(element) {
    if (!element) return false;
    
    const tagName = element.tagName.toLowerCase();
    return (
        tagName === 'input' ||
        tagName === 'textarea' ||
        tagName === 'select' ||
        element.isContentEditable
    );
}

/**
 * Handle special keys that need custom behavior
 * @param {KeyboardEvent} event - The keydown event
 */
function handleSpecialKeys(event) {
    // Space bar - prevent page scrolling
    if (event.key === ' ' && !isInputElement(event.target)) {
        event.preventDefault();
    }
    
    // Arrow keys - prevent page scrolling
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        event.preventDefault();
    }
}

/**
 * Check if a key is currently pressed
 * @param {string} key - The key to check
 * @returns {boolean} - Whether the key is pressed
 */
export function isKeyPressed(key) {
    return keyStates.get(key) === true;
}

/**
 * Get a mapping of MIDI note numbers to keyboard keys
 * This maps a QWERTY keyboard layout to a piano-like layout
 * @returns {Object} - Mapping of MIDI note numbers to keyboard keys
 */
export function getKeyboardNoteMapping() {
    return {
        // Lower row (Z-M) - C3 to B3
        'z': 60, // C3
        's': 61, // C#3
        'x': 62, // D3
        'd': 63, // D#3
        'c': 64, // E3
        'v': 65, // F3
        'g': 66, // F#3
        'b': 67, // G3
        'h': 68, // G#3
        'n': 69, // A3
        'j': 70, // A#3
        'm': 71, // B3
        
        // Upper row (Q-P) - C4 to E5
        'q': 72, // C4
        '2': 73, // C#4
        'w': 74, // D4
        '3': 75, // D#4
        'e': 76, // E4
        'r': 77, // F4
        '5': 78, // F#4
        't': 79, // G4
        '6': 80, // G#4
        'y': 81, // A4
        '7': 82, // A#4
        'u': 83, // B4
        'i': 84, // C5
        '9': 85, // C#5
        'o': 86, // D5
        '0': 87, // D#5
        'p': 88, // E5
    };
}

/**
 * Clean up event listeners
 */
export function cleanup() {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
    keyStates.clear();
}