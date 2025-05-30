use wasm_bindgen::prelude::*;

#[wasm_bindgen]
#[derive(Debug, Clone)]
pub struct WaveData {
    samples: Vec<f32>,
}

impl Default for WaveData {
    fn default() -> Self {
        Self {
            samples: Vec::new(),
        }
    }
}

#[wasm_bindgen]
impl WaveData {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self::default()
    }

    #[wasm_bindgen]
    pub fn update_samples(&mut self, samples: Vec<f32>) {
        self.samples = samples;
    }

    #[wasm_bindgen]
    pub fn get_sample_count(&self) -> usize {
        self.samples.len()
    }

    #[wasm_bindgen]
    pub fn get_sample(&self, index: usize) -> f32 {
        self.samples.get(index).copied().unwrap_or(0.0)
    }

    #[wasm_bindgen]
    pub fn get_peak_in_range(&self, start: usize, end: usize) -> f32 {
        let end = end.min(self.samples.len());
        let mut peak = 0.0f32;
        
        for i in start..end {
            if i < self.samples.len() {
                peak = peak.max(self.samples[i].abs());
            }
        }
        
        peak
    }

    #[wasm_bindgen]
    pub fn get_rms_in_range(&self, start: usize, end: usize) -> f32 {
        let end = end.min(self.samples.len());
        let mut sum = 0.0f32;
        let mut count = 0;
        
        for i in start..end {
            if i < self.samples.len() {
                sum += self.samples[i] * self.samples[i];
                count += 1;
            }
        }
        
        if count > 0 {
            (sum / count as f32).sqrt()
        } else {
            0.0
        }
    }

    #[wasm_bindgen]
    pub fn is_empty(&self) -> bool {
        self.samples.is_empty()
    }

    #[wasm_bindgen]
    pub fn clear(&mut self) {
        self.samples.clear();
    }
}

impl WaveData {
    pub fn samples(&self) -> &[f32] {
        &self.samples
    }
}