// Export the effect modules
pub mod filter;
pub mod delay;
pub mod distortion;

// Define a common trait for all effects
pub trait Effect {
    // Process a single sample
    fn process(&mut self, input: f32) -> f32;
    
    // Reset the effect state
    fn reset(&mut self);
    
    // Set a parameter by name and value
    fn set_parameter(&mut self, name: &str, value: f32) -> bool;
    
    // Get the effect name
    fn name(&self) -> &str;
}

// A struct to manage a chain of effects
pub struct EffectsChain {
    effects: Vec<Box<dyn Effect>>,
}

impl EffectsChain {
    pub fn new() -> Self {
        EffectsChain {
            effects: Vec::new(),
        }
    }
    
    pub fn add_effect(&mut self, effect: Box<dyn Effect>) {
        self.effects.push(effect);
    }
    
    pub fn remove_effect(&mut self, index: usize) -> bool {
        if index < self.effects.len() {
            self.effects.remove(index);
            true
        } else {
            false
        }
    }
    
    pub fn process(&mut self, input: f32) -> f32 {
        let mut output = input;
        
        for effect in &mut self.effects {
            output = effect.process(output);
        }
        
        output
    }
    
    pub fn reset_all(&mut self) {
        for effect in &mut self.effects {
            effect.reset();
        }
    }
    
    pub fn set_effect_parameter(&mut self, effect_index: usize, param_name: &str, value: f32) -> bool {
        if effect_index < self.effects.len() {
            self.effects[effect_index].set_parameter(param_name, value)
        } else {
            false
        }
    }
    
    pub fn count(&self) -> usize {
        self.effects.len()
    }
}