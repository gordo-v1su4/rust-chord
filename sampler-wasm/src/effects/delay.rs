use super::Effect;

pub struct Delay {
    buffer: Vec<f32>,
    write_pos: usize,
    delay_samples: usize,
    feedback: f32,
    mix: f32,
    sample_rate: f32,
}

impl Delay {
    pub fn new(delay_time_seconds: f32, feedback: f32, mix: f32, sample_rate: f32) -> Self {
        // Calculate delay in samples
        let delay_samples = (delay_time_seconds * sample_rate) as usize;
        
        // Create a buffer with some extra room
        let buffer_size = delay_samples + 1;
        let mut buffer = Vec::with_capacity(buffer_size);
        buffer.resize(buffer_size, 0.0);
        
        Delay {
            buffer,
            write_pos: 0,
            delay_samples,
            feedback: feedback.clamp(0.0, 0.99), // Prevent unstable feedback
            mix: mix.clamp(0.0, 1.0),
            sample_rate,
        }
    }
    
    pub fn set_delay_time(&mut self, delay_time_seconds: f32) {
        // Calculate new delay in samples
        let new_delay_samples = (delay_time_seconds * self.sample_rate) as usize;
        
        // If we need a larger buffer, resize it
        if new_delay_samples >= self.buffer.len() {
            let new_buffer_size = new_delay_samples + 1;
            let mut new_buffer = Vec::with_capacity(new_buffer_size);
            new_buffer.resize(new_buffer_size, 0.0);
            
            // Copy old buffer contents to new buffer
            for i in 0..self.buffer.len() {
                let read_pos = (self.write_pos + i) % self.buffer.len();
                new_buffer[i] = self.buffer[read_pos];
            }
            
            self.buffer = new_buffer;
            self.write_pos = 0;
        }
        
        self.delay_samples = new_delay_samples;
    }
    
    pub fn set_feedback(&mut self, feedback: f32) {
        self.feedback = feedback.clamp(0.0, 0.99); // Prevent unstable feedback
    }
    
    pub fn set_mix(&mut self, mix: f32) {
        self.mix = mix.clamp(0.0, 1.0);
    }
}

impl Effect for Delay {
    fn process(&mut self, input: f32) -> f32 {
        // Calculate read position
        let read_pos = (self.write_pos + self.buffer.len() - self.delay_samples) % self.buffer.len();
        
        // Read delayed sample
        let delayed_sample = self.buffer[read_pos];
        
        // Write input + feedback to buffer
        self.buffer[self.write_pos] = input + delayed_sample * self.feedback;
        
        // Update write position
        self.write_pos = (self.write_pos + 1) % self.buffer.len();
        
        // Mix dry and wet signals
        input * (1.0 - self.mix) + delayed_sample * self.mix
    }
    
    fn reset(&mut self) {
        // Clear the buffer
        for sample in &mut self.buffer {
            *sample = 0.0;
        }
        self.write_pos = 0;
    }
    
    fn set_parameter(&mut self, name: &str, value: f32) -> bool {
        match name {
            "time" => {
                self.set_delay_time(value);
                true
            },
            "feedback" => {
                self.set_feedback(value);
                true
            },
            "mix" => {
                self.set_mix(value);
                true
            },
            _ => false,
        }
    }
    
    fn name(&self) -> &str {
        "Delay"
    }
}