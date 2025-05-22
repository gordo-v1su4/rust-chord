use super::Effect;
use std::f32::consts::PI;

pub enum FilterType {
    LowPass,
    HighPass,
    BandPass,
    Notch,
}

pub struct Filter {
    filter_type: FilterType,
    cutoff: f32,
    resonance: f32,
    sample_rate: f32,
    
    // Filter state variables
    x1: f32,
    x2: f32,
    y1: f32,
    y2: f32,
    
    // Cached coefficients
    a0: f32,
    a1: f32,
    a2: f32,
    b1: f32,
    b2: f32,
}

impl Filter {
    pub fn new(filter_type: FilterType, cutoff: f32, resonance: f32, sample_rate: f32) -> Self {
        let mut filter = Filter {
            filter_type,
            cutoff: cutoff.clamp(20.0, sample_rate * 0.49),
            resonance: resonance.clamp(0.1, 20.0),
            sample_rate,
            
            x1: 0.0,
            x2: 0.0,
            y1: 0.0,
            y2: 0.0,
            
            a0: 0.0,
            a1: 0.0,
            a2: 0.0,
            b1: 0.0,
            b2: 0.0,
        };
        
        filter.calculate_coefficients();
        filter
    }
    
    fn calculate_coefficients(&mut self) {
        // Normalize cutoff frequency (0 to 1)
        let omega = 2.0 * PI * self.cutoff / self.sample_rate;
        let sin_omega = omega.sin();
        let cos_omega = omega.cos();
        
        // Calculate alpha (for resonance)
        let alpha = sin_omega / (2.0 * self.resonance);
        
        // Calculate coefficients based on filter type
        match self.filter_type {
            FilterType::LowPass => {
                let b0 = (1.0 - cos_omega) / 2.0;
                let b1 = 1.0 - cos_omega;
                let b2 = (1.0 - cos_omega) / 2.0;
                let a0 = 1.0 + alpha;
                let a1 = -2.0 * cos_omega;
                let a2 = 1.0 - alpha;
                
                // Normalize by a0
                self.a0 = b0 / a0;
                self.a1 = b1 / a0;
                self.a2 = b2 / a0;
                self.b1 = a1 / a0;
                self.b2 = a2 / a0;
            },
            FilterType::HighPass => {
                let b0 = (1.0 + cos_omega) / 2.0;
                let b1 = -(1.0 + cos_omega);
                let b2 = (1.0 + cos_omega) / 2.0;
                let a0 = 1.0 + alpha;
                let a1 = -2.0 * cos_omega;
                let a2 = 1.0 - alpha;
                
                // Normalize by a0
                self.a0 = b0 / a0;
                self.a1 = b1 / a0;
                self.a2 = b2 / a0;
                self.b1 = a1 / a0;
                self.b2 = a2 / a0;
            },
            FilterType::BandPass => {
                let b0 = sin_omega / 2.0;
                let b1 = 0.0;
                let b2 = -sin_omega / 2.0;
                let a0 = 1.0 + alpha;
                let a1 = -2.0 * cos_omega;
                let a2 = 1.0 - alpha;
                
                // Normalize by a0
                self.a0 = b0 / a0;
                self.a1 = b1 / a0;
                self.a2 = b2 / a0;
                self.b1 = a1 / a0;
                self.b2 = a2 / a0;
            },
            FilterType::Notch => {
                let b0 = 1.0;
                let b1 = -2.0 * cos_omega;
                let b2 = 1.0;
                let a0 = 1.0 + alpha;
                let a1 = -2.0 * cos_omega;
                let a2 = 1.0 - alpha;
                
                // Normalize by a0
                self.a0 = b0 / a0;
                self.a1 = b1 / a0;
                self.a2 = b2 / a0;
                self.b1 = a1 / a0;
                self.b2 = a2 / a0;
            },
        }
    }
    
    pub fn set_cutoff(&mut self, cutoff: f32) {
        self.cutoff = cutoff.clamp(20.0, self.sample_rate * 0.49);
        self.calculate_coefficients();
    }
    
    pub fn set_resonance(&mut self, resonance: f32) {
        self.resonance = resonance.clamp(0.1, 20.0);
        self.calculate_coefficients();
    }
    
    pub fn set_filter_type(&mut self, filter_type: FilterType) {
        self.filter_type = filter_type;
        self.calculate_coefficients();
    }
}

impl Effect for Filter {
    fn process(&mut self, input: f32) -> f32 {
        // Direct form II biquad filter implementation
        let output = self.a0 * input + self.a1 * self.x1 + self.a2 * self.x2 - 
                     self.b1 * self.y1 - self.b2 * self.y2;
        
        // Update state variables
        self.x2 = self.x1;
        self.x1 = input;
        self.y2 = self.y1;
        self.y1 = output;
        
        output
    }
    
    fn reset(&mut self) {
        self.x1 = 0.0;
        self.x2 = 0.0;
        self.y1 = 0.0;
        self.y2 = 0.0;
    }
    
    fn set_parameter(&mut self, name: &str, value: f32) -> bool {
        match name {
            "cutoff" => {
                self.set_cutoff(value);
                true
            },
            "resonance" => {
                self.set_resonance(value);
                true
            },
            "type" => {
                // 0: LowPass, 1: HighPass, 2: BandPass, 3: Notch
                let filter_type = match value as i32 {
                    0 => FilterType::LowPass,
                    1 => FilterType::HighPass,
                    2 => FilterType::BandPass,
                    3 => FilterType::Notch,
                    _ => FilterType::LowPass,
                };
                self.set_filter_type(filter_type);
                true
            },
            _ => false,
        }
    }
    
    fn name(&self) -> &str {
        "Filter"
    }
}