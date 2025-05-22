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
