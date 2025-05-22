use wasm_bindgen::prelude::*;

// Convert a time in seconds to a sample index
pub fn time_to_sample_index(time_seconds: f32, sample_rate: f32) -> usize {
    (time_seconds * sample_rate) as usize
}

// Convert a sample index to time in seconds
pub fn sample_index_to_time(sample_index: usize, sample_rate: f32) -> f32 {
    sample_index as f32 / sample_rate
}

// Convert a MIDI note number to frequency in Hz
pub fn midi_to_freq(note: u8) -> f32 {
    // A4 (MIDI note 69) is 440 Hz
    // Each semitone is a factor of 2^(1/12)
    440.0 * 2.0f32.powf((note as f32 - 69.0) / 12.0)
}

// Convert a frequency in Hz to a MIDI note number
pub fn freq_to_midi(freq: f32) -> f32 {
    // A4 (MIDI note 69) is 440 Hz
    // Each semitone is a factor of 2^(1/12)
    69.0 + 12.0 * (freq / 440.0).log2()
}

// Convert semitones to a pitch ratio
pub fn semitones_to_ratio(semitones: f32) -> f32 {
    2.0f32.powf(semitones / 12.0)
}

// Linear interpolation between two values
pub fn lerp(a: f32, b: f32, t: f32) -> f32 {
    a + t * (b - a)
}

// Cubic interpolation between samples
pub fn cubic_interpolate(y0: f32, y1: f32, y2: f32, y3: f32, mu: f32) -> f32 {
    let mu2 = mu * mu;
    let a0 = y3 - y2 - y0 + y1;
    let a1 = y0 - y1 - a0;
    let a2 = y2 - y0;
    let a3 = y1;
    
    a0 * mu * mu2 + a1 * mu2 + a2 * mu + a3
}

// Calculate RMS (Root Mean Square) of a buffer
pub fn calculate_rms(buffer: &[f32]) -> f32 {
    if buffer.is_empty() {
        return 0.0;
    }
    
    let sum_of_squares: f32 = buffer.iter().map(|&sample| sample * sample).sum();
    (sum_of_squares / buffer.len() as f32).sqrt()
}

// Calculate peak level of a buffer
pub fn calculate_peak(buffer: &[f32]) -> f32 {
    if buffer.is_empty() {
        return 0.0;
    }
    
    buffer.iter().fold(0.0f32, |max, &sample| max.max(sample.abs()))
}

// Convert linear amplitude to decibels
pub fn linear_to_db(amplitude: f32) -> f32 {
    20.0 * amplitude.max(0.0000001).log10()
}

// Convert decibels to linear amplitude
pub fn db_to_linear(db: f32) -> f32 {
    10.0f32.powf(db / 20.0)
}

// Smooth a parameter change to avoid clicks
pub struct ParameterSmoother {
    current_value: f32,
    target_value: f32,
    smoothing_factor: f32,
}

impl ParameterSmoother {
    pub fn new(initial_value: f32, smoothing_factor: f32) -> Self {
        ParameterSmoother {
            current_value: initial_value,
            target_value: initial_value,
            smoothing_factor: smoothing_factor.clamp(0.0, 1.0),
        }
    }
    
    pub fn set_target(&mut self, target: f32) {
        self.target_value = target;
    }
    
    pub fn set_smoothing_factor(&mut self, factor: f32) {
        self.smoothing_factor = factor.clamp(0.0, 1.0);
    }
    
    pub fn process(&mut self) -> f32 {
        // Apply exponential smoothing
        self.current_value += self.smoothing_factor * (self.target_value - self.current_value);
        self.current_value
    }
    
    pub fn reset(&mut self, value: f32) {
        self.current_value = value;
        self.target_value = value;
    }
    
    pub fn is_close_to_target(&self, threshold: f32) -> bool {
        (self.current_value - self.target_value).abs() < threshold
    }
}