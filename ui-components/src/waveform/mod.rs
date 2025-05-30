pub mod wave;
pub mod style;

use wasm_bindgen::prelude::*;
use web_sys::{CanvasRenderingContext2d, HtmlCanvasElement};

pub use wave::WaveData;
pub use style::WaveformStyle;

#[wasm_bindgen]
pub struct WaveformRenderer {
    wave_data: WaveData,
    style: WaveformStyle,
    playhead_position: f32,
    loop_start: f32,
    loop_end: f32,
}

impl WaveformRenderer {
    pub fn new() -> Self {
        Self {
            wave_data: WaveData::new(),
            style: WaveformStyle::default(),
            playhead_position: 0.0,
            loop_start: 0.0,
            loop_end: 1.0,
        }
    }
}

#[wasm_bindgen]
impl WaveformRenderer {
    #[wasm_bindgen(constructor)]
    pub fn new_wasm() -> Self {
        Self::new()
    }

    #[wasm_bindgen]
    pub fn update_samples(&mut self, samples: Vec<f32>) {
        self.wave_data.update_samples(samples);
    }

    #[wasm_bindgen]
    pub fn set_playhead(&mut self, position: f32) {
        self.playhead_position = position.clamp(0.0, 1.0);
    }

    #[wasm_bindgen]
    pub fn set_loop_region(&mut self, start: f32, end: f32) {
        self.loop_start = start.clamp(0.0, 1.0);
        self.loop_end = end.clamp(0.0, 1.0);
    }

    #[wasm_bindgen]
    pub fn render(&self, canvas: &HtmlCanvasElement) -> Result<(), JsValue> {
        let context = canvas
            .get_context("2d")?
            .unwrap()
            .dyn_into::<CanvasRenderingContext2d>()?;

        let width = canvas.width() as f32;
        let height = canvas.height() as f32;

        // Clear canvas
        context.set_fill_style(&JsValue::from_str(&format!(
            "rgb({}, {}, {})",
            (self.style.background_color().r * 255.0) as u8,
            (self.style.background_color().g * 255.0) as u8,
            (self.style.background_color().b * 255.0) as u8
        )));
        context.fill_rect(0.0, 0.0, width as f64, height as f64);

        // Draw waveform
        self.draw_waveform(&context, width, height)?;

        // Draw loop region
        self.draw_loop_region(&context, width, height)?;

        // Draw playhead
        self.draw_playhead(&context, width, height)?;

        Ok(())
    }

    fn draw_waveform(&self, context: &CanvasRenderingContext2d, width: f32, height: f32) -> Result<(), JsValue> {
        if self.wave_data.samples().is_empty() {
            return Ok(());
        }

        let samples = self.wave_data.samples();
        let center_y = height / 2.0;
        let samples_per_pixel = samples.len() as f32 / width;

        context.begin_path();
        context.set_stroke_style(&JsValue::from_str(&format!(
            "rgb({}, {}, {})",
            (self.style.waveform_color().r * 255.0) as u8,
            (self.style.waveform_color().g * 255.0) as u8,
            (self.style.waveform_color().b * 255.0) as u8
        )));
        context.set_line_width(1.0);

        for x in 0..(width as usize) {
            let sample_start = (x as f32 * samples_per_pixel) as usize;
            let sample_end = (((x + 1) as f32 * samples_per_pixel) as usize).min(samples.len());
            
            if sample_start >= samples.len() {
                break;
            }

            // Find peak in this pixel range
            let mut peak = 0.0f32;
            for i in sample_start..sample_end {
                if i < samples.len() {
                    peak = peak.max(samples[i].abs());
                }
            }

            let y_offset = peak * (height / 2.0) * 0.8; // Scale to 80% of available height
            let y_top = center_y - y_offset;
            let y_bottom = center_y + y_offset;

            if x == 0 {
                context.move_to(x as f64, y_top as f64);
            } else {
                context.line_to(x as f64, y_top as f64);
            }
        }

        context.stroke();
        Ok(())
    }

    fn draw_loop_region(&self, context: &CanvasRenderingContext2d, width: f32, height: f32) -> Result<(), JsValue> {
        let loop_start_x = self.loop_start * width;
        let loop_end_x = self.loop_end * width;

        // Draw loop region background
        context.set_fill_style(&JsValue::from_str(&format!(
            "rgba({}, {}, {}, {})",
            (self.style.loop_region_color().r * 255.0) as u8,
            (self.style.loop_region_color().g * 255.0) as u8,
            (self.style.loop_region_color().b * 255.0) as u8,
            self.style.loop_region_color().a
        )));
        context.fill_rect(
            loop_start_x as f64,
            0.0,
            (loop_end_x - loop_start_x) as f64,
            height as f64,
        );

        // Draw loop boundaries
        context.set_stroke_style(&JsValue::from_str(&format!(
            "rgb({}, {}, {})",
            (self.style.loop_boundary_color().r * 255.0) as u8,
            (self.style.loop_boundary_color().g * 255.0) as u8,
            (self.style.loop_boundary_color().b * 255.0) as u8
        )));
        context.set_line_width(2.0);

        context.begin_path();
        context.move_to(loop_start_x as f64, 0.0);
        context.line_to(loop_start_x as f64, height as f64);
        context.stroke();

        context.begin_path();
        context.move_to(loop_end_x as f64, 0.0);
        context.line_to(loop_end_x as f64, height as f64);
        context.stroke();

        Ok(())
    }

    fn draw_playhead(&self, context: &CanvasRenderingContext2d, width: f32, height: f32) -> Result<(), JsValue> {
        let playhead_x = self.playhead_position * width;

        context.set_stroke_style(&JsValue::from_str(&format!(
            "rgb({}, {}, {})",
            (self.style.playhead_color().r * 255.0) as u8,
            (self.style.playhead_color().g * 255.0) as u8,
            (self.style.playhead_color().b * 255.0) as u8
        )));
        context.set_line_width(2.0);

        context.begin_path();
        context.move_to(playhead_x as f64, 0.0);
        context.line_to(playhead_x as f64, height as f64);
        context.stroke();

        Ok(())
    }
}

impl Default for WaveformRenderer {
    fn default() -> Self {
        Self::new()
    }
}