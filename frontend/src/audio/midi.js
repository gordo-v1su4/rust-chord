/**
 * MIDI input handling module
 */

// MIDI access object
let midiAccess = null;

// MIDI input ports
let midiInputs = [];

// Callback functions
let noteOnCallback = null;
let noteOffCallback = null;
let controlChangeCallback = null;

// MIDI message types
const MIDI_NOTE_ON = 0x90;
const MIDI_NOTE_OFF = 0x80;
const MIDI_CONTROL_CHANGE = 0xB0;

/**
 * Initialize MIDI access
 * @returns {Promise<boolean>} - Whether MIDI access was successfully initialized
 */
export async function initMIDI() {
    // Check if Web MIDI API is supported
    if (!navigator.requestMIDIAccess) {
        console.warn('Web MIDI API is not supported in this browser');
        return false;
    }
    
    try {
        // Request MIDI access
        midiAccess = await navigator.requestMIDIAccess({ sysex: false });
        
        // Set up MIDI event listeners
        midiAccess.addEventListener('statechange', handleMIDIStateChange);
        
        // Initialize MIDI inputs
        updateMIDIInputs();
        
        console.log('MIDI access initialized successfully');
        return true;
    } catch (error) {
        console.error('Failed to initialize MIDI access:', error);
        return false;
    }
}

/**
 * Update the list of available MIDI inputs
 */
function updateMIDIInputs() {
    // Clear existing inputs
    midiInputs = [];
    
    // Get all inputs
    const inputs = midiAccess.inputs.values();
    
    // Add each input to the list and set up event listeners
    for (const input of inputs) {
        console.log(`MIDI Input: ${input.name} (${input.manufacturer})`);
        
        // Add event listener for MIDI messages
        input.addEventListener('midimessage', handleMIDIMessage);
        
        // Add to inputs list
        midiInputs.push(input);
    }
    
    // Dispatch event with available inputs
    dispatchMIDIInputsEvent();
}

/**
 * Handle MIDI state change events
 * @param {MIDIConnectionEvent} event - The MIDI connection event
 */
function handleMIDIStateChange(event) {
    console.log(`MIDI port ${event.port.name} state changed: ${event.port.state}`);
    
    // Update inputs list when state changes
    updateMIDIInputs();
}

/**
 * Handle MIDI message events
 * @param {MIDIMessageEvent} event - The MIDI message event
 */
function handleMIDIMessage(event) {
    const [status, data1, data2] = event.data;
    
    // Extract message type and channel
    const messageType = status & 0xF0;
    const channel = status & 0x0F;
    
    // Handle different message types
    switch (messageType) {
        case MIDI_NOTE_ON:
            handleNoteOn(channel, data1, data2);
            break;
            
        case MIDI_NOTE_OFF:
            handleNoteOff(channel, data1, data2);
            break;
            
        case MIDI_CONTROL_CHANGE:
            handleControlChange(channel, data1, data2);
            break;
            
        default:
            // Ignore other message types
            break;
    }
}

/**
 * Handle MIDI Note On messages
 * @param {number} channel - MIDI channel (0-15)
 * @param {number} note - MIDI note number (0-127)
 * @param {number} velocity - Note velocity (0-127)
 */
function handleNoteOn(channel, note, velocity) {
    // Note On with velocity 0 is equivalent to Note Off
    if (velocity === 0) {
        handleNoteOff(channel, note, 0);
        return;
    }
    
    // Normalize velocity to 0-1 range
    const normalizedVelocity = velocity / 127;
    
    console.log(`MIDI Note On: channel=${channel}, note=${note}, velocity=${normalizedVelocity.toFixed(2)}`);
    
    // Call the callback if defined
    if (noteOnCallback) {
        noteOnCallback(note, normalizedVelocity, channel);
    }
    
    // Dispatch event
    dispatchMIDINoteEvent('noteon', note, normalizedVelocity, channel);
}

/**
 * Handle MIDI Note Off messages
 * @param {number} channel - MIDI channel (0-15)
 * @param {number} note - MIDI note number (0-127)
 * @param {number} velocity - Release velocity (0-127)
 */
function handleNoteOff(channel, note, velocity) {
    // Normalize velocity to 0-1 range
    const normalizedVelocity = velocity / 127;
    
    console.log(`MIDI Note Off: channel=${channel}, note=${note}, velocity=${normalizedVelocity.toFixed(2)}`);
    
    // Call the callback if defined
    if (noteOffCallback) {
        noteOffCallback(note, normalizedVelocity, channel);
    }
    
    // Dispatch event
    dispatchMIDINoteEvent('noteoff', note, normalizedVelocity, channel);
}

/**
 * Handle MIDI Control Change messages
 * @param {number} channel - MIDI channel (0-15)
 * @param {number} controller - Controller number (0-127)
 * @param {number} value - Controller value (0-127)
 */
function handleControlChange(channel, controller, value) {
    // Normalize value to 0-1 range
    const normalizedValue = value / 127;
    
    console.log(`MIDI CC: channel=${channel}, controller=${controller}, value=${normalizedValue.toFixed(2)}`);
    
    // Call the callback if defined
    if (controlChangeCallback) {
        controlChangeCallback(controller, normalizedValue, channel);
    }
    
    // Dispatch event
    dispatchMIDIControlEvent(controller, normalizedValue, channel);
}

/**
 * Dispatch a custom event with the list of available MIDI inputs
 */
function dispatchMIDIInputsEvent() {
    const event = new CustomEvent('midi-inputs', {
        detail: {
            inputs: midiInputs.map(input => ({
                id: input.id,
                name: input.name,
                manufacturer: input.manufacturer
            }))
        }
    });
    
    window.dispatchEvent(event);
}

/**
 * Dispatch a custom event for MIDI note events
 * @param {string} type - The event type ('noteon' or 'noteoff')
 * @param {number} note - MIDI note number (0-127)
 * @param {number} velocity - Note velocity (0-1)
 * @param {number} channel - MIDI channel (0-15)
 */
function dispatchMIDINoteEvent(type, note, velocity, channel) {
    const event = new CustomEvent(`midi-${type}`, {
        detail: {
            note,
            velocity,
            channel
        }
    });
    
    window.dispatchEvent(event);
}

/**
 * Dispatch a custom event for MIDI control change events
 * @param {number} controller - Controller number (0-127)
 * @param {number} value - Controller value (0-1)
 * @param {number} channel - MIDI channel (0-15)
 */
function dispatchMIDIControlEvent(controller, value, channel) {
    const event = new CustomEvent('midi-cc', {
        detail: {
            controller,
            value,
            channel
        }
    });
    
    window.dispatchEvent(event);
}

/**
 * Set callback functions for MIDI events
 * @param {Object} callbacks - Object containing callback functions
 */
export function setMIDICallbacks(callbacks) {
    if (callbacks.noteOn) {
        noteOnCallback = callbacks.noteOn;
    }
    
    if (callbacks.noteOff) {
        noteOffCallback = callbacks.noteOff;
    }
    
    if (callbacks.controlChange) {
        controlChangeCallback = callbacks.controlChange;
    }
}

/**
 * Get a list of available MIDI inputs
 * @returns {Array} - Array of MIDI input devices
 */
export function getMIDIInputs() {
    return midiInputs.map(input => ({
        id: input.id,
        name: input.name,
        manufacturer: input.manufacturer
    }));
}

/**
 * Get a mapping of common MIDI CC numbers to names
 * @returns {Object} - Mapping of CC numbers to names
 */
export function getMIDICCMap() {
    return {
        1: 'Modulation',
        7: 'Volume',
        10: 'Pan',
        11: 'Expression',
        64: 'Sustain',
        71: 'Resonance',
        74: 'Cutoff',
        91: 'Reverb',
        93: 'Chorus'
    };
}

/**
 * Convert a MIDI note number to a note name
 * @param {number} noteNumber - MIDI note number (0-127)
 * @returns {string} - Note name (e.g., 'C4')
 */
export function midiNoteToName(noteNumber) {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(noteNumber / 12) - 1;
    const noteName = noteNames[noteNumber % 12];
    
    return `${noteName}${octave}`;
}

/**
 * Convert a note name to a MIDI note number
 * @param {string} noteName - Note name (e.g., 'C4')
 * @returns {number} - MIDI note number (0-127)
 */
export function noteNameToMidi(noteName) {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const regex = /^([A-G][#b]?)(-?\d+)$/;
    const match = noteName.match(regex);
    
    if (!match) {
        return -1;
    }
    
    const [, note, octave] = match;
    let noteIndex = noteNames.indexOf(note);
    
    if (noteIndex === -1) {
        // Handle flats
        if (note.endsWith('b')) {
            const flatNote = note.replace('b', '');
            noteIndex = noteNames.indexOf(flatNote);
            if (noteIndex === -1) {
                return -1;
            }
            noteIndex = (noteIndex - 1 + 12) % 12;
        } else {
            return -1;
        }
    }
    
    return (parseInt(octave) + 1) * 12 + noteIndex;
}

/**
 * Clean up MIDI resources
 */
export function cleanup() {
    if (midiAccess) {
        // Remove event listeners from inputs
        for (const input of midiInputs) {
            input.removeEventListener('midimessage', handleMIDIMessage);
        }
        
        // Remove state change listener
        midiAccess.removeEventListener('statechange', handleMIDIStateChange);
    }
    
    // Clear callbacks
    noteOnCallback = null;
    noteOffCallback = null;
    controlChangeCallback = null;
}