use wasm_bindgen::prelude::*;

#[wasm_bindgen]
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Color {
    pub r: f32,
    pub g: f32,
    pub b: f32,
    pub a: f32,
}

#[wasm_bindgen]
impl Color {
    #[wasm_bindgen(constructor)]
    pub fn new(r: f32, g: f32, b: f32, a: f32) -> Self {
        Self { r, g, b, a }
    }

    #[wasm_bindgen]
    pub fn from_rgb(r: f32, g: f32, b: f32) -> Self {
        Self { r, g, b, a: 1.0 }
    }

    #[wasm_bindgen]
    pub fn from_rgba(r: f32, g: f32, b: f32, a: f32) -> Self {
        Self { r, g, b, a }
    }
}

impl Color {
    pub const WHITE: Color = Color { r: 1.0, g: 1.0, b: 1.0, a: 1.0 };
    pub const BLACK: Color = Color { r: 0.0, g: 0.0, b: 0.0, a: 1.0 };
    pub const RED: Color = Color { r: 1.0, g: 0.0, b: 0.0, a: 1.0 };
    pub const GREEN: Color = Color { r: 0.0, g: 1.0, b: 0.0, a: 1.0 };
    pub const BLUE: Color = Color { r: 0.0, g: 0.0, b: 1.0, a: 1.0 };
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum WaveformStyle {
    Default,
    Dark,
    Custom {
        background: Color,
        waveform: Color,
        playhead: Color,
        loop_region: Color,
    },
}

impl Default for WaveformStyle {
    fn default() -> Self {
        Self::Dark
    }
}

impl WaveformStyle {
    pub fn background_color(&self) -> Color {
        match self {
            WaveformStyle::Default => Color::WHITE,
            WaveformStyle::Dark => Color::from_rgb(0.1, 0.1, 0.1),
            WaveformStyle::Custom { background, .. } => *background,
        }
    }

    pub fn waveform_color(&self) -> Color {
        match self {
            WaveformStyle::Default => Color::from_rgb(0.2, 0.4, 0.8),
            WaveformStyle::Dark => Color::from_rgb(0.3, 0.7, 1.0),
            WaveformStyle::Custom { waveform, .. } => *waveform,
        }
    }

    pub fn playhead_color(&self) -> Color {
        match self {
            WaveformStyle::Default => Color::from_rgb(0.8, 0.2, 0.2),
            WaveformStyle::Dark => Color::from_rgb(1.0, 0.0, 0.0),
            WaveformStyle::Custom { playhead, .. } => *playhead,
        }
    }

    pub fn loop_region_color(&self) -> Color {
        match self {
            WaveformStyle::Default => Color::from_rgba(0.0, 0.8, 0.0, 0.3),
            WaveformStyle::Dark => Color::from_rgba(0.0, 1.0, 0.0, 0.1),
            WaveformStyle::Custom { loop_region, .. } => *loop_region,
        }
    }

    pub fn loop_boundary_color(&self) -> Color {
        match self {
            WaveformStyle::Default => Color::from_rgb(0.0, 0.8, 0.0),
            WaveformStyle::Dark => Color::from_rgb(0.0, 1.0, 0.0),
            WaveformStyle::Custom { loop_region, .. } => {
                // Use loop_region color but fully opaque
                Color::from_rgb(loop_region.r, loop_region.g, loop_region.b)
            },
        }
    }
}

pub fn create_dark_style() -> WaveformStyle {
    WaveformStyle::Dark
}

pub fn create_light_style() -> WaveformStyle {
    WaveformStyle::Default
}

pub fn create_custom_style(
    bg_r: f32, bg_g: f32, bg_b: f32, bg_a: f32,
    wave_r: f32, wave_g: f32, wave_b: f32, wave_a: f32,
    playhead_r: f32, playhead_g: f32, playhead_b: f32, playhead_a: f32,
    loop_r: f32, loop_g: f32, loop_b: f32, loop_a: f32,
) -> WaveformStyle {
    WaveformStyle::Custom {
        background: Color::from_rgba(bg_r, bg_g, bg_b, bg_a),
        waveform: Color::from_rgba(wave_r, wave_g, wave_b, wave_a),
        playhead: Color::from_rgba(playhead_r, playhead_g, playhead_b, playhead_a),
        loop_region: Color::from_rgba(loop_r, loop_g, loop_b, loop_a),
    }
}