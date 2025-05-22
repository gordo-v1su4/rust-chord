// Import modules
import { initAudioContext, createSamplerWorklet } from './audio/context.js';
import { setupWaveformVisualization, drawWaveform, updatePlayhead } from './ui/waveform.js';
import { setupTransportControls } from './ui/transport.js';
import { setupEffectsUI } from './ui/effects.js';
import { setupMeters, updateMeters } from './ui/meters.js';
import { loadAudioFile } from './utils/file-loader.js';
import { setupKeyboardHandlers } from './utils/keyboard.js';
import { initVideoDecoder, setupVideoRenderer } from './video/decoder.js';
import { syncAudioVideo } from './video/sync.js';

// Global state
let audioContext;
let samplerNode;
let audioBuffer;
let videoDecoder;
let isPlaying = false;
let currentTime = 0;
let totalDuration = 0;
let animationFrameId = null;

// Status message function
function showStatusMessage(message, isError = false) {
    // Create status message element if it doesn't exist
    let statusElement = document.getElementById('statusMessage');
    if (!statusElement) {
        statusElement = document.createElement('div');
        statusElement.id = 'statusMessage';
        document.querySelector('.app-container').appendChild(statusElement);
    }
    
    // Set message and style
    statusElement.textContent = message;
    statusElement.className = isError ? 'status-message error' : 'status-message';
    
    // Show the message
    statusElement.style.opacity = '1';
    
    // Hide after 5 seconds
    setTimeout(() => {
        statusElement.style.opacity = '0';
    }, 5000);
}

// DOM elements
const audioFileInput = document.getElementById('audioFileInput');
const loadFileBtn = document.getElementById('loadFileBtn');
const videoFileInput = document.getElementById('videoFileInput');
const loadVideoBtn = document.getElementById('loadVideoBtn');
const waveformCanvas = document.getElementById('waveformCanvas');
const videoCanvas = document.getElementById('videoCanvas');

// Initialize the application
async function init() {
    try {
        // Initialize audio context when user interacts
        const initContainer = document.createElement('div');
        initContainer.classList.add('init-container');
        
        const initInstructions = document.createElement('p');
        initInstructions.textContent = 'Click the button below to initialize the audio system. You must do this first before loading audio or video files.';
        initInstructions.classList.add('init-instructions');
        
        const initAudioBtn = document.createElement('button');
        initAudioBtn.textContent = 'Initialize Audio System';
        initAudioBtn.classList.add('init-audio-btn');
        
        initContainer.appendChild(initInstructions);
        initContainer.appendChild(initAudioBtn);
        document.body.appendChild(initContainer);
        
        initAudioBtn.addEventListener('click', async () => {
            // Initialize audio context
            audioContext = await initAudioContext();
            
            // Create sampler worklet
            samplerNode = await createSamplerWorklet(audioContext);
            
            // Set up UI components
            setupWaveformVisualization(waveformCanvas);
            setupTransportControls(handlePlay, handlePause, handleStop, handleSeek);
            setupEffectsUI(updateEffectParameter);
            setupMeters();
            setupKeyboardHandlers(handleKeyboardEvent);
            
            // Set up file loading
            loadFileBtn.addEventListener('click', () => audioFileInput.click());
            audioFileInput.addEventListener('change', handleAudioFileSelect);
            
            loadVideoBtn.addEventListener('click', () => videoFileInput.click());
            videoFileInput.addEventListener('change', handleVideoFileSelect);
            
            // Remove init container
            document.body.removeChild(initContainer);
            
            console.log('Audio context initialized');
            showStatusMessage('Audio system initialized. You can now load audio and video files.');
        });
        
    } catch (error) {
        console.error('Error initializing application:', error);
    }
}

// Handle audio file selection
async function handleAudioFileSelect(event) {
    try {
        const file = event.target.files[0];
        if (!file) return;
        
        // Load and decode audio file
        audioBuffer = await loadAudioFile(file, audioContext);
        totalDuration = audioBuffer.duration;
        
        // Update UI with new audio data
        drawWaveform(waveformCanvas, audioBuffer);
        updateTotalDuration(totalDuration);
        
        // Send audio data to the sampler worklet
        const audioData = {
            left: audioBuffer.getChannelData(0),
            right: audioBuffer.numberOfChannels > 1 ? audioBuffer.getChannelData(1) : audioBuffer.getChannelData(0),
            sampleRate: audioBuffer.sampleRate
        };
        
        samplerNode.port.postMessage({
            type: 'loadSample',
            audioData: audioData
        });
        
        console.log('Audio file loaded:', file.name);
        showStatusMessage(`Audio file loaded: ${file.name}`);
    } catch (error) {
        console.error('Error loading audio file:', error);
        showStatusMessage(`Error loading audio file: ${error.message}`, true);
    }
}

// Handle video file selection
async function handleVideoFileSelect(event) {
    try {
        const file = event.target.files[0];
        if (!file) return;
        
        // Initialize video decoder if not already done
        if (!videoDecoder) {
            videoDecoder = await initVideoDecoder();
            setupVideoRenderer(videoCanvas);
        }
        
        // Load video file
        const videoUrl = URL.createObjectURL(file);
        await videoDecoder.loadVideo(videoUrl);
        
        console.log('Video file loaded:', file.name);
        showStatusMessage(`Video file loaded: ${file.name}`);
    } catch (error) {
        console.error('Error loading video file:', error);
        showStatusMessage(`Error loading video file: ${error.message}`, true);
    }
}

// Transport control handlers
function handlePlay() {
    if (!audioBuffer) return;
    
    if (!isPlaying) {
        isPlaying = true;
        
        // Resume audio context if suspended
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        
        // If we're at the end of the audio, start from the beginning
        if (currentTime >= totalDuration) {
            currentTime = 0;
            updateCurrentTime(currentTime);
            updatePlayhead(waveformCanvas, 0);
        }
        
        // Tell the sampler to start playing
        samplerNode.port.postMessage({
            type: 'setPlaybackState',
            isPlaying: true
        });
        
        // Start animation loop
        startAnimationLoop();
        
        console.log('Playback started');
    }
}

function handlePause() {
    if (isPlaying) {
        isPlaying = false;
        
        // Tell the sampler to pause
        samplerNode.port.postMessage({
            type: 'setPlaybackState',
            isPlaying: false
        });
        
        // Stop animation loop
        stopAnimationLoop();
        
        console.log('Playback paused');
    }
}

function handleStop() {
    isPlaying = false;
    
    // Tell the sampler to stop and reset position
    samplerNode.port.postMessage({
        type: 'setPlaybackState',
        isPlaying: false,
        resetPosition: true
    });
    
    // Reset current time
    currentTime = 0;
    updateCurrentTime(currentTime);
    
    // Update UI
    updatePlayhead(waveformCanvas, 0);
    
    // Stop animation loop
    stopAnimationLoop();
    
    console.log('Playback stopped');
}

function handleSeek(position) {
    // position is 0-100
    const seekTime = (position / 100) * totalDuration;
    
    // Tell the sampler to seek
    samplerNode.port.postMessage({
        type: 'seek',
        time: seekTime
    });
    
    // Update current time
    currentTime = seekTime;
    updateCurrentTime(currentTime);
    
    // Update UI
    updatePlayhead(waveformCanvas, position / 100);
    
    console.log('Seeked to position:', position, 'time:', seekTime);
}

// Update effect parameter
function updateEffectParameter(effectType, paramName, value) {
    samplerNode.port.postMessage({
        type: 'setEffectParameter',
        effectType: effectType,
        paramName: paramName,
        value: value
    });
    
    console.log('Updated effect parameter:', effectType, paramName, value);
}

// Handle keyboard events
function handleKeyboardEvent(key) {
    switch (key) {
        case ' ': // Space bar
            isPlaying ? handlePause() : handlePlay();
            break;
        case 'Escape':
            handleStop();
            break;
        // Add more keyboard shortcuts as needed
    }
}

// Animation loop for UI updates
function startAnimationLoop() {
    if (animationFrameId) return;
    
    // Track playback start time
    const startTime = audioContext.currentTime;
    let lastTime = startTime;
    
    const updateUI = () => {
        if (!isPlaying) return;
        
        // Calculate elapsed time since last frame
        const now = audioContext.currentTime;
        const deltaTime = now - lastTime;
        lastTime = now;
        
        // Update current time based on elapsed time
        currentTime += deltaTime;
        
        // Clamp to valid range
        currentTime = Math.min(currentTime, totalDuration);
        
        // Check if we've reached the end of the audio
        if (currentTime >= totalDuration) {
            handleStop();
            return;
        }
        
        // Update UI elements
        const playbackPosition = currentTime / totalDuration;
        updatePlayhead(waveformCanvas, playbackPosition);
        updateCurrentTime(currentTime);
        updateMeters(samplerNode);
        
        // Sync video if available
        if (videoDecoder) {
            syncAudioVideo(videoDecoder, currentTime);
        }
        
        // Continue animation loop
        animationFrameId = requestAnimationFrame(updateUI);
    };
    
    animationFrameId = requestAnimationFrame(updateUI);
}

function stopAnimationLoop() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
}

// Helper functions
function updateCurrentTime(time) {
    const currentTimeElement = document.getElementById('currentTime');
    currentTimeElement.textContent = formatTime(time);
}

function updateTotalDuration(duration) {
    const totalTimeElement = document.getElementById('totalTime');
    totalTimeElement.textContent = formatTime(duration);
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Export for module usage
export {
    audioContext,
    samplerNode,
    isPlaying,
    currentTime,
    totalDuration
};