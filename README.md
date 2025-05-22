# Rust Chord

A browser-based DAW-like sampler with video sync using Rust (WebAssembly) and Web technologies.

## Features

- Audio sample loading and playback
- Waveform visualization with playhead
- Transport controls (play, pause, stop, seek)
- Loop region support
- ADHSR envelope (Attack, Decay, Hold, Sustain, Release)
- Audio effects:
  - Filter (Low-pass, High-pass, Band-pass, Notch)
  - Delay with feedback
  - Distortion (multiple types)
- Video playback with audio synchronization
- MIDI input support
- Keyboard input for triggering samples
- Level metering

## Technology Stack

- **Rust**: Core audio processing logic compiled to WebAssembly
- **WebAssembly**: High-performance audio processing in the browser
- **Web Audio API**: Audio context and worklet for real-time audio processing
- **Web Codecs API**: Video decoding and processing
- **WebGL/WebGPU**: Video rendering
- **JavaScript**: Frontend application logic
- **HTML/CSS**: User interface

## Project Structure

```
rust-chord/
├── sampler-wasm/               # Rust WebAssembly library
│   ├── src/
│   │   ├── lib.rs              # Main Rust library entry point
│   │   ├── processor.rs        # Audio processor implementation
│   │   ├── envelope.rs         # ADHSR envelope implementation
│   │   ├── effects/            # DSP effects modules
│   │   │   ├── mod.rs          # Effects module definition
│   │   │   ├── filter.rs       # Filter implementation
│   │   │   ├── delay.rs        # Delay effect
│   │   │   └── distortion.rs   # Distortion effect
│   │   └── utils.rs            # Utility functions
│   ├── Cargo.toml              # Rust dependencies and config
│   └── Cargo.lock              # Locked dependencies
│
├── frontend/                   # Web frontend
│   ├── src/
│   │   ├── main.js             # Main JavaScript entry point
│   │   ├── audio/
│   │   │   ├── context.js      # Audio context management
│   │   │   ├── sampler-worklet.js  # Audio worklet processor
│   │   │   └── midi.js         # MIDI input handling
│   │   ├── video/
│   │   │   ├── decoder.js      # Video decoding logic
│   │   │   ├── renderer.js     # WebGL/WebGPU rendering
│   │   │   └── sync.js         # A/V synchronization
│   │   ├── ui/
│   │   │   ├── waveform.js     # Waveform visualization
│   │   │   ├── transport.js    # Transport controls
│   │   │   ├── effects.js      # Effects UI
│   │   │   └── meters.js       # Audio level meters
│   │   └── utils/
│   │       ├── file-loader.js  # File loading utilities
│   │       └── keyboard.js     # Keyboard input handling
│   ├── index.html              # Main HTML file
│   ├── styles/
│   │   └── main.css            # Main CSS styles
│   └── assets/                 # Static assets
│       └── icons/              # UI icons
│
├── webpack.config.js           # Webpack configuration
├── package.json                # NPM dependencies and scripts
└── README.md                   # Project documentation
```

## Getting Started

### Prerequisites

- [Rust](https://www.rust-lang.org/tools/install)
- [wasm-pack](https://rustwasm.github.io/wasm-pack/installer/)
- [Node.js](https://nodejs.org/) (v14 or later)
- A modern web browser with Web Audio API, Web Codecs API, and WebGL support

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/rust-chord.git
   cd rust-chord
   ```

2. Build the WebAssembly module:
   ```
   cd sampler-wasm
   wasm-pack build --target web
   cd ..
   ```

3. Install JavaScript dependencies:
   ```
   npm install
   ```

4. Start the development server:
   ```
   npm run dev
   ```

5. Open your browser and navigate to `https://localhost:8080`

### Building for Production

To build the application for production:

```
npm run build:wasm
npm run build
```

The production build will be available in the `dist` directory.

## Usage

1. Click the "Initialize Audio" button to set up the audio context.
2. Load an audio file using the "Load Audio" button.
3. Use the transport controls to play, pause, and stop the audio.
4. Adjust the loop region, envelope parameters, and effects as desired.
5. Optionally load a video file to sync with the audio.

## Browser Compatibility

This application requires modern browser features:
- Web Audio API with AudioWorklet support
- WebAssembly
- Web Codecs API (for video)
- WebGL/WebGPU (for video rendering)

Recommended browsers:
- Chrome 94+
- Edge 94+
- Firefox 113+
- Safari 16.4+

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- The Rust and WebAssembly teams for their excellent tools and documentation
- The Web Audio API and Web Codecs API specifications and implementations
