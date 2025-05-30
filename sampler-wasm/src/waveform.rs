use wasm_bindgen::prelude::*;

/// Represents a local peak in the waveform (min and max values for a segment)
#[wasm_bindgen]
#[derive(Debug, Clone, Copy, Default)]
pub struct WaveformPeak {
    pub maxima: f32,
    pub minima: f32,
}

#[wasm_bindgen]
impl WaveformPeak {
    #[wasm_bindgen(constructor)]
    pub fn new(maxima: f32, minima: f32) -> Self {
        Self { maxima, minima }.check()
    }


    /// Ensure minima <= maxima
    fn check(mut self) -> Self {
        if self.minima > self.maxima {
            std::mem::swap(&mut self.maxima, &mut self.minima);
        }
        self
    }
}

impl From<f32> for WaveformPeak {
    fn from(value: f32) -> Self {
        Self {
            maxima: value,
            minima: value,
        }
    }
}

impl From<(f32, f32)> for WaveformPeak {
    fn from(value: (f32, f32)) -> Self {
        Self {
            maxima: value.0,
            minima: value.1,
        }
        .check()
    }
}

/// Calculate peaks from raw audio samples for efficient waveform rendering
#[wasm_bindgen]
pub fn calculate_waveform_peaks(audio_data: &[f32], target_width: usize) -> Vec<f32> {
    let samples_len = audio_data.len();
    
    if samples_len == 0 {
        return Vec::new();
    }

    // If we have fewer samples than target width, just return the samples
    if samples_len <= target_width {
        return audio_data.to_vec();
    }

    // Calculate peaks for efficient rendering
    let samples_per_peak = samples_len / target_width;
    let mut peaks = Vec::with_capacity(target_width * 2); // Store min and max pairs
    
    for i in 0..target_width {
        let start = i * samples_per_peak;
        let end = ((i + 1) * samples_per_peak).min(samples_len);
        
        let mut min: f32 = 0.0;
        let mut max: f32 = 0.0;
        
        for j in start..end {
            let sample = audio_data[j];
            min = min.min(sample);
            max = max.max(sample);
        }
        
        // Store as min, max pairs for easy JavaScript consumption
        peaks.push(min);
        peaks.push(max);
    }
    
    peaks
}

/// Calculate RMS values for level metering
#[wasm_bindgen]
pub fn calculate_rms_levels(audio_data: &[f32], window_size: usize) -> Vec<f32> {
    let samples_len = audio_data.len();
    
    if samples_len == 0 || window_size == 0 {
        return Vec::new();
    }
    
    let num_windows = (samples_len + window_size - 1) / window_size;
    let mut rms_values = Vec::with_capacity(num_windows);
    
    for i in 0..num_windows {
        let start = i * window_size;
        let end = (start + window_size).min(samples_len);
        
        let mut sum_squares = 0.0;
        let mut count = 0;
        
        for j in start..end {
            let sample = audio_data[j];
            sum_squares += sample * sample;
            count += 1;
        }
        
        let rms = if count > 0 {
            (sum_squares / count as f32).sqrt()
        } else {
            0.0
        };
        
        rms_values.push(rms);
    }
    
    rms_values
}

/// Convert linear amplitude to decibels
#[wasm_bindgen]
pub fn linear_to_db(amplitude: f32) -> f32 {
    if amplitude <= 0.0 {
        -60.0 // Return -60dB for silence instead of -infinity
    } else {
        20.0 * amplitude.log10()
    }
}

/// Convert decibels to linear amplitude
#[wasm_bindgen]
pub fn db_to_linear(db: f32) -> f32 {
    10.0_f32.powf(db / 20.0)
}

/// Calculate adaptive peaks that adjust granularity based on zoom level
#[wasm_bindgen]
pub fn calculate_adaptive_peaks(audio_data: &[f32], zoom_factor: f32, target_width: usize) -> Vec<f32> {
    let samples_len = audio_data.len();
    
    if samples_len == 0 {
        return Vec::new();
    }

    // Adjust the number of samples we process based on zoom
    let visible_samples = (samples_len as f32 / zoom_factor) as usize;
    let samples_per_peak = visible_samples.max(1) / target_width.max(1);
    
    if samples_per_peak <= 1 {
        // At high zoom levels, return individual samples
        let end = visible_samples.min(samples_len);
        return audio_data[0..end].to_vec();
    }
    
    // Calculate peaks for the visible region
    let mut peaks = Vec::with_capacity(target_width * 2);
    
    for i in 0..target_width {
        let start = i * samples_per_peak;
        let end = ((i + 1) * samples_per_peak).min(visible_samples).min(samples_len);
        
        if start >= samples_len {
            break;
        }
        
        let mut min: f32 = 0.0;
        let mut max: f32 = 0.0;
        
        for j in start..end {
            let sample = audio_data[j];
            min = min.min(sample);
            max = max.max(sample);
        }
        
        peaks.push(min);
        peaks.push(max);
    }
    
    peaks
}