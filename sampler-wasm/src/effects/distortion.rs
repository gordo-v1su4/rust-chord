use super::Effect;

pub enum DistortionType {
    Soft,
    Hard,
    Foldback,
    Sine,
    Bitcrush,
}

pub struct Distortion {
    distortion_type: DistortionType,
    drive: f32,
    mix: f32,
    output_gain: f32,
    bit_depth: u32,  // For bitcrusher
}

impl Distortion {
    pub fn new(distortion_type: DistortionType, drive: f32, mix: f32, output_gain: f32) -> Self {
        Distortion {
            distortion_type,
            drive: drive.clamp(1.0, 100.0),
            mix: mix.clamp(0.0, 1.0),
            output_gain: output_gain.clamp(0.0, 1.0),
            bit_depth: 8,  // Default bit depth for bitcrusher
        }
    }
    
    pub fn set_drive(&mut self, drive: f32) {
        self.drive = drive.clamp(1.0, 100.0);
    }
    
    pub fn set_mix(&mut self, mix: f32) {
        self.mix = mix.clamp(0.0, 1.0);
    }
    
    pub fn set_output_gain(&mut self, gain: f32) {
        self.output_gain = gain.clamp(0.0, 1.0);
    }
    
    pub fn set_distortion_type(&mut self, distortion_type: DistortionType) {
        self.distortion_type = distortion_type;
    }
    
    pub fn set_bit_depth(&mut self, bit_depth: u32) {
        self.bit_depth = bit_depth.clamp(1, 16);
    }
    
    fn process_sample(&self, input: f32) -> f32 {
        match self.distortion_type {
            DistortionType::Soft => {
                // Soft clipping (tanh)
                (input * self.drive).tanh()
            },
            DistortionType::Hard => {
                // Hard clipping
                let driven = input * self.drive;
                driven.clamp(-1.0, 1.0)
            },
            DistortionType::Foldback => {
                // Foldback distortion
                let threshold = 1.0;
                let mut driven = input * self.drive;
                
                while driven.abs() > threshold {
                    if driven > threshold {
                        driven = 2.0 * threshold - driven;
                    } else if driven < -threshold {
                        driven = -2.0 * threshold - driven;
                    }
                }
                
                driven
            },
            DistortionType::Sine => {
                // Sine waveshaper
                (input * self.drive * std::f32::consts::PI).sin()
            },
            DistortionType::Bitcrush => {
                // Bitcrusher
                let scale = 2.0f32.powi(self.bit_depth as i32 - 1);
                let driven = input * self.drive;
                (driven * scale).round() / scale
            },
        }
    }
}

impl Effect for Distortion {
    fn process(&mut self, input: f32) -> f32 {
        let distorted = self.process_sample(input);
        
        // Mix dry and wet signals
        let output = input * (1.0 - self.mix) + distorted * self.mix;
        
        // Apply output gain
        output * self.output_gain
    }
    
    fn reset(&mut self) {
        // Distortion has no state to reset
    }
    
    fn set_parameter(&mut self, name: &str, value: f32) -> bool {
        match name {
            "drive" => {
                self.set_drive(value);
                true
            },
            "mix" => {
                self.set_mix(value);
                true
            },
            "output_gain" => {
                self.set_output_gain(value);
                true
            },
            "type" => {
                // 0: Soft, 1: Hard, 2: Foldback, 3: Sine, 4: Bitcrush
                let distortion_type = match value as i32 {
                    0 => DistortionType::Soft,
                    1 => DistortionType::Hard,
                    2 => DistortionType::Foldback,
                    3 => DistortionType::Sine,
                    4 => DistortionType::Bitcrush,
                    _ => DistortionType::Soft,
                };
                self.set_distortion_type(distortion_type);
                true
            },
            "bit_depth" => {
                self.set_bit_depth(value as u32);
                true
            },
            _ => false,
        }
    }
    
    fn name(&self) -> &str {
        "Distortion"
    }
}