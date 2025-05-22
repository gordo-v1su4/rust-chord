High-Level Plan: Build a browser-based DAW-like sampler with video sync using Rust (Wasm) and Web technologies.
Set Up Project & Basic WebAssembly Integration
1.0 [X] Install Rust and wasm-pack.
1.1 [X] Create the main project directory.
1.2 [X] Initialize the Rust library project (sampler-wasm).
1.3 [X] Create the frontend directory and basic web files (HTML, JS, CSS).
1.4 [X] Initialize the npm project for frontend dependencies.
1.5 [X] Install a JavaScript bundler (e.g., Webpack) and related plugins (html-webpack-plugin, copy-webpack-plugin).
1.6 [X] Configure the bundler (webpack.config.js) for entry/output, HTML generation, copying Wasm files, and setting up a dev server (with HTTPS).
1.7 [X] Add wasm-bindgen and initial web-sys dependencies to sampler-wasm/Cargo.toml.
1.8 [X] Write a simple #[wasm_bindgen] function and basic console logging in sampler-wasm/src/lib.rs.
1.9 [ ] Build the Rust Wasm module using wasm-pack build --target web.
1.10 [ ] Import and call the Wasm function from frontend/src/main.js.
1.11 [ ] Run the bundler dev server and verify Wasm execution in the browser console.
Establish Web Audio Context & Rust Audio Worklet Pipeline
2.0 [X] Add a button in frontend/index.html to initiate audio.
2.1 [X] In frontend/src/main.js, add an event listener to the button to create/resume the AudioContext.
2.2 [X] Create the Audio Worklet processor JavaScript file (sampler-worklet.js).
2.3 [X] Define the basic AudioWorkletProcessor class structure and registerProcessor call in sampler-worklet.js.
2.4 [X] In frontend/src/main.js, load the Worklet module using audioContext.audioWorklet.addModule().
2.5 [X] Create an AudioWorkletNode instance, specifying the processor name.
2.6 [X] Connect the AudioWorkletNode to audioContext.destination.
2.7 [ ] Verify the basic audio graph structure in browser dev tools.
2.8 [X] In sampler-wasm/src/lib.rs, create a Rust struct (SamplerProcessorState) for the Worklet's internal state.
2.9 [X] Add a #[wasm_bindgen] function (create_processor) to create an instance of the Rust state struct.
2.10 [X] Add a #[wasm_bindgen] method (process) on the Rust struct that matches the AudioWorkletProcessor's process signature, using web_sys and js_sys for arguments.
2.11 [ ] Rebuild the Rust Wasm.
2.12 [X] In sampler-worklet.js, import the Wasm module and create_processor.
2.13 [X] Instantiate the Rust processor in the SamplerProcessor constructor.
2.14 [X] Call the Rust process method from the JavaScript process method, passing the audio buffers and parameters. Verify no errors.
Implement Sampler Core Logic & Basic Audio Playback Controls (Rust Wasm)
3.0 [X] In Rust (SamplerProcessorState), add fields to hold decoded audio sample data (Vec<f32>).
3.1 [X] Add fields for current playback index (f64), total sample length, sample rate, and playback state (enum).
3.2 [X] Implement a #[wasm_bindgen] method (load_sample_data) to receive and store audio data (js_sys::Float32Array) and sample rate from JavaScript.
3.3 [X] In the Rust process method, implement the core logic for reading samples from the stored audio data based on the current playback index and state, writing to the output buffer.
3.4 [ ] Rebuild Rust Wasm.
3.5 [X] In frontend/src/main.js, implement audio file loading using <input type="file"> and FileReader.
3.6 [X] Use audioContext.decodeAudioData() to decode the loaded audio file into an AudioBuffer.
3.7 [X] Get the audio data as Float32Array from the AudioBuffer.
3.8 [X] Send the Float32Array and sample rate to the Audio Worklet via its port.postMessage(), marking the data as transferable.
3.9 [X] In sampler-worklet.js, add a message handler (this.port.onmessage) to receive the 'loadSample' message and call the Rust load_sample_data method.
3.10 [X] Add Play/Pause/Stop buttons to frontend/index.html.
3.11 [X] In frontend/src/main.js, add event listeners for transport buttons.
3.12 [X] Implement a #[wasm_bindgen] method (set_playback_state) in Rust to control the playback state enum.
3.13 [X] Send 'setPlaybackState' messages from JavaScript to the Worklet port.
3.14 [X] In sampler-worklet.js, handle 'setPlaybackState' messages and call the Rust method.
3.15 [X] Modify the Rust process method to respect the playback state. Verify basic playback.
Implement Basic Looping & ADHSR Envelope (Rust Wasm)
4.0 [X] In Rust (SamplerProcessorState), add fields for loop start and end indices (f64).
4.1 [X] Add a #[wasm_bindgen] method (set_loop_points) to set loop start/end times (convert seconds to sample indices).
4.2 [X] In the Rust process method, implement loop logic: if playback index exceeds loop end, reset to loop start.
4.3 [ ] Rebuild Rust Wasm.
4.4 [X] Add UI controls for loop start/end times to frontend/index.html.
4.5 [X] In frontend/src/main.js, add event listeners and send 'setLoopPoints' messages (with times in seconds) to the Worklet.
4.6 [X] In sampler-worklet.js, handle the message and call the Rust method. Verify looping.
4.7 [X] In Rust, create an Envelope struct for AHDSR logic.
4.8 [X] Add an Envelope instance to SamplerProcessorState.
4.9 [X] Add #[wasm_bindgen] methods (trigger_envelope, release_envelope, set_envelope_parameters) in Rust.
4.10 [X] In the Rust process method, update the envelope state and value per sample. Multiply the sample output by the envelope value.
4.11 [X] Rebuild Wasm. Add AHDSR UI controls to HTML/JS.
4.12 [X] Send 'setEnvelopeParameters', 'triggerEnvelope', and 'releaseEnvelope' messages to the Worklet from JavaScript UI events (e.g., Play button triggers, Stop button releases).
Develop Waveform Visualization & Playhead
5.0 [X] Add a <canvas id="waveformCanvas"> element to frontend/index.html.
5.1 [X] In frontend/src/main.js, get references to the waveform canvas and its 2D rendering context.
5.2 [X] Implement a JavaScript function drawWaveform(audioBuffer) to draw the static waveform outline based on decoded audio data. Calculate peak/RMS data for efficiency.
5.3 [X] Call drawWaveform after audioContext.decodeAudioData() is complete.
5.4 [X] Add logic to handle canvas resizing for the waveform.
5.5 [X] In the main thread's requestAnimationFrame loop, calculate the current playback position based on audioContext.currentTime.
5.6 [X] Implement drawing a vertical line on the waveform canvas representing the playhead position. Update this drawing in the requestAnimationFrame loop.
5.7 [X] Implement drawing lines or highlighting on the waveform canvas to indicate the defined loop region.
Set Up Basic Video Decoding (JavaScript Web Codecs)
6.0 [X] Add a <canvas id="videoCanvas"> element for video display to frontend/index.html.
6.1 [X] In frontend/src/main.js, check for Web Codecs API support (window.VideoDecoder, window.AudioDecoder).
6.2 [X] Implement a function to initialize VideoDecoder and AudioDecoder instances, providing output and error callbacks (handleVideoFrame, handleAudioData, handleError).
6.3 [ ] Implement or integrate a JavaScript library for basic multimedia container parsing (demuxing) to extract codec configuration data and compressed chunks (EncodedVideoChunk, EncodedAudioChunk).
6.4 [X] Use the extracted configuration data to call videoDecoder.configure() and audioDecoder.configure().
6.5 [X] Implement the process of feeding EncodedVideoChunk and EncodedAudioChunk objects to the videoDecoder.decode() and audioDecoder.decode() methods.
6.6 [ ] (Optional but Recommended) Create a Web Worker to run the decoding logic (steps 6.2-6.5) to prevent blocking the main thread. Use message passing to communicate with the Worker.
6.7 [X] Call this video setup function after loading a multimedia file.
Handle Decoded Video Frames & Basic Rendering
7.0 [X] In frontend/src/main.js, implement the handleVideoFrame(frame) callback (or message handler if using a Worker).
7.1 [X] Create a buffer (e.g., array) in the main thread to store incoming VideoFrame objects.
7.2 [X] When a frame arrives, add it to the videoFrameBuffer.
7.3 [X] Implement logic to periodically clean up and call frame.close() on old frames in the buffer.
7.4 [X] In frontend/src/main.js, get a reference to the video canvas.
7.5 [X] Initialize a WebGL or WebGPU rendering context on the video canvas.
7.6 [X] Implement a JavaScript function drawVideoFrameWebGL(frame) that uses the graphics API to draw a VideoFrame onto the video canvas.
7.7 [X] Implement canvas resizing logic for the video canvas, maintaining aspect ratio.
Implement Audio-Video Synchronization
8.0 [X] In the main thread's requestAnimationFrame loop (which is also updating the waveform playhead):
8.1 [X] Get the current master time from audioContext.currentTime.
8.2 [X] Search the videoFrameBuffer for the VideoFrame whose timestamp (convert to seconds) is the latest but still less than or equal to the current audio time.
8.3 [X] If a suitable frame is found and it's different from the currently displayed frame, call drawVideoFrameWebGL(frame) with the selected frame.
8.4 [X] Implement logic to handle cases where no suitable frame is in the buffer (e.g., decoding lag) – display the last frame or a placeholder.
8.5 [X] Ensure the audio playback from the video file (if separate from the sampler's audio) is also timed relative to the master audioContext.currentTime.
Implement Seeking & Playback Control Synchronization
9.0 [X] Add a UI control (e.g., slider) for seeking in frontend/index.html.
9.1 [X] In frontend/src/main.js, add an event listener for the seek control.
9.2 [X] When a seek action occurs:
9.2.0 [X] Pause audio playback (send message to Worklet).
9.2.1 [X] Clear the videoFrameBuffer and close all frames.
9.2.2 [X] Call videoDecoder.flush() and audioDecoder.flush().
9.2.3 [X] Tell your demuxing logic to seek the source file to the target time, finding a nearby keyframe.
9.2.4 [X] Send a message to the Audio Worklet to reset its internal playback position to the target time.
9.2.5 [X] Resume playback (send message to Worklet) once decoding has resumed and initial frames/audio are available near the seek point.
9.3 [X] Ensure Play/Pause controls correctly affect both the sampler audio and the video playback orchestration.
Add Advanced DSP (Pitch/Filter) & Effects Chain (Rust Wasm)
10.0 [ ] Implement a pitch-shifting or time-stretching algorithm in Rust Wasm. Add a corresponding #[wasm_bindgen] method (set_pitch_shift_semitones).
10.1 [ ] Implement a digital filter (e.g., resonant low-pass) in Rust Wasm. Add #[wasm_bindgen] methods (set_filter_frequency, set_filter_resonance).
10.2 [ ] Integrate these advanced DSP algorithms into the Rust process method.
10.3 [X] Add corresponding UI controls to HTML/JS and send parameter messages to the Worklet.
10.4 [X] In Rust Wasm, design a flexible system for chaining multiple effects (e.g., using a vector of effect instances/traits).
10.5 [X] Implement individual effect processors in Rust Wasm (Delay, Distortion, etc.).
10.6 [X] Add #[wasm_bindgen] methods to manage the effects chain state from JavaScript (add_effect, remove_effect, set_effect_parameter).
10.7 [X] Update the main Rust process method to process audio through the effects chain.
10.8 [ ] Rebuild Rust Wasm after adding DSP/Effects.
10.9 [X] Add UI elements (tabs, controls) for selecting and controlling effects in HTML/JS. Send corresponding messages to the Worklet.
Implement Metering & Refine UI
11.0 [X] In the Rust Wasm process method, calculate peak or RMS levels for the current audio block.
11.1 [X] Send the calculated level back to the Main JavaScript thread periodically via port.postMessage().
11.2 [ ] Rebuild Wasm.
11.3 [X] Add UI elements (e.g., canvas bars, divs) for audio meters in HTML/CSS.
11.4 [X] In frontend/src/main.js, add a message handler on the Worklet's main thread port.
11.5 [X] Update the meter UI elements based on received level messages.
11.6 [X] Refine the overall UI layout using CSS to match the reference image.
11.7 [X] Implement custom drawing for UI controls (knobs, etc.) on canvas if desired.
11.8 [X] Add labels, tooltips, and visual feedback for controls and playback state.
Add Input Handling (Keyboard, MIDI)
12.0 [X] Implement keyboard event listeners (keydown, keyup) in frontend/src/main.js.
12.1 [X] Map keyboard shortcuts to transport controls (Play/Pause/Stop) and potentially sampler triggers.
12.2 [X] Send corresponding messages to the Worklet to execute actions.
12.3 [X] (Optional) Check for and request access to the Web MIDI API (navigator.requestMIDIAccess).
12.4 [X] If access is granted, enumerate MIDI input ports and add onmidimessage listeners.
12.5 [X] Parse incoming MIDI messages (Note On/Off, Control Change).
12.6 [X] Send messages to the Worklet to trigger sample playback (Note On/Off) or control parameters (Control Change) based on MIDI input.
Optimize, Test, and Deploy
13.0 [ ] Compile Rust Wasm in release mode (wasm-pack build --target web --release).
13.1 [ ] Use wasm-opt for post-build Wasm binary optimization.
13.2 [ ] Profile performance using browser developer tools (Performance tab, Console, Memory, AudioContext inspector, Web Codecs debugger).
13.3 [ ] Identify and address performance bottlenecks in both JavaScript and Wasm code.
13.4 [ ] Optimize data transfer between threads (consider SharedArrayBuffer with appropriate CORS headers).
13.5 [ ] Optimize WebGL/WebGPU rendering pipeline.
13.6 [ ] Conduct thorough functional testing with various audio/video files and user interactions.
13.7 [ ] Conduct critical A/V synchronization testing, observing playback over time and after seeking.
13.8 [ ] Test compatibility across major browsers (Chrome, Firefox, Safari, Edge).
13.9 [ ] Test on different hardware and screen sizes.
13.10 [ ] Implement comprehensive error handling for file loading, decoding, and API usage.
13.11 [ ] Build the final production bundle using the bundler.
13.12 [ ] Configure a static web server to serve the application files.
13.13 [ ] Ensure correct MIME type for .wasm files (application/wasm).
13.14 [ ] Crucially: Configure server headers Cross-Origin-Opener-Policy: same-origin and Cross-Origin-Embedder-Policy: require-corp if using SharedArrayBuffer.
13.15 [ ] Test the deployed application in a real browser environment.


This structure should provide a clear roadmap with larger goals and detailed sub-steps under each. 