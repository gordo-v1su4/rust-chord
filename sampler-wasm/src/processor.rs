use wasm_bindgen::prelude::*;
use js_sys::{Float32Array, Object};
use web_sys::{console};

#[wasm_bindgen]
pub struct SamplerProcessorState {
    // Sample data
    sample_data: Vec<f32>,
    sample_rate: f32,
    
    // Playback state
    playback_index: f64,
    is_playing: bool,
    
    // Future fields for looping, envelope, etc. will be added here
}

#[wasm_bindgen]
impl SamplerProcessorState {
    #[wasm_bindgen(constructor)]
    pub fn new() -> SamplerProcessorState {
        console::log_1(&"Creating new SamplerProcessorState".into());
        
        SamplerProcessorState {
            sample_data: Vec::new(),
            sample_rate: 44100.0,
            playback_index: 0.0,
            is_playing: false,
        }
    }
    
    #[wasm_bindgen]
    pub fn process(&mut self, inputs: &JsValue, outputs: &JsValue, _parameters: &JsValue) -> bool {
        // This will be implemented to process audio
        // For now, just return true to keep the processor alive
        true
    }
    
    #[wasm_bindgen]
    pub fn load_sample_data(&mut self, data: &Float32Array, sample_rate: f32) {
        let mut sample_vec = vec![0.0; data.length() as usize];
        data.copy_to(&mut sample_vec);
        
        self.sample_data = sample_vec;
        self.sample_rate = sample_rate;
        
        console::log_1(&format!("Loaded sample data: {} samples at {}Hz", 
                               self.sample_data.len(), self.sample_rate).into());
    }
    
    #[wasm_bindgen]
    pub fn set_playback_state(&mut self, is_playing: bool) {
        self.is_playing = is_playing;
        
        if !is_playing {
            // Reset playback position when stopping
            self.playback_index = 0.0;
        }
        
        console::log_1(&format!("Playback state set to: {}", is_playing).into());
    }
}

#[wasm_bindgen]
pub fn create_processor() -> SamplerProcessorState {
    SamplerProcessorState::new()
}