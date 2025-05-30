use wasm_bindgen::prelude::*;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

// Export the waveform module
pub mod waveform;

// Re-export commonly used types
pub use waveform::WaveformRenderer;

#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
}

#[wasm_bindgen]
pub fn greet() {
    alert("Hello from Rust UI Components!");
}

// This is like the `extern` block before, but will import from the `console`
// module which is provided by the `web-sys` crate
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

// Define a macro to make the console.log call easier
macro_rules! console_log {
    ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
}

#[wasm_bindgen(start)]
pub fn main() {
    console_log!("Rust UI Components initialized!");
}

#[wasm_bindgen]
pub fn create_waveform_renderer() -> WaveformRenderer {
    WaveformRenderer::new()
}