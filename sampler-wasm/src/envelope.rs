#[derive(Debug, Clone, Copy, PartialEq)]
pub enum EnvelopeStage {
    Idle,
    Attack,
    Decay,
    Hold,
    Sustain,
    Release,
}

pub struct Envelope {
    // Envelope parameters (in seconds)
    attack_time: f32,
    decay_time: f32,
    hold_time: f32,
    sustain_level: f32,
    release_time: f32,
    
    // Current state
    stage: EnvelopeStage,
    current_level: f32,
    stage_time: f32,
    
    // Sample rate for time calculations
    sample_rate: f32,
}

impl Envelope {
    pub fn new(sample_rate: f32) -> Self {
        Envelope {
            attack_time: 0.01,    // 10ms default attack
            decay_time: 0.1,      // 100ms default decay
            hold_time: 0.0,       // 0ms default hold
            sustain_level: 0.7,   // 70% default sustain
            release_time: 0.3,    // 300ms default release
            
            stage: EnvelopeStage::Idle,
            current_level: 0.0,
            stage_time: 0.0,
            
            sample_rate,
        }
    }
    
    pub fn set_parameters(&mut self, attack: f32, decay: f32, hold: f32, sustain: f32, release: f32) {
        self.attack_time = attack.max(0.001);  // Minimum 1ms
        self.decay_time = decay.max(0.001);    // Minimum 1ms
        self.hold_time = hold.max(0.0);        // Minimum 0ms
        self.sustain_level = sustain.clamp(0.0, 1.0);
        self.release_time = release.max(0.001); // Minimum 1ms
    }
    
    pub fn trigger(&mut self) {
        self.stage = EnvelopeStage::Attack;
        self.stage_time = 0.0;
        // Don't reset current_level to allow for legato playing
    }
    
    pub fn release(&mut self) {
        if self.stage != EnvelopeStage::Idle {
            self.stage = EnvelopeStage::Release;
            self.stage_time = 0.0;
        }
    }
    
    pub fn process(&mut self) -> f32 {
        let sample_time = 1.0 / self.sample_rate;
        self.stage_time += sample_time;
        
        match self.stage {
            EnvelopeStage::Idle => {
                self.current_level = 0.0;
            },
            EnvelopeStage::Attack => {
                // Linear attack from current level to 1.0
                if self.stage_time >= self.attack_time {
                    self.current_level = 1.0;
                    self.stage = EnvelopeStage::Decay;
                    self.stage_time = 0.0;
                } else {
                    let attack_rate = (1.0 - self.current_level) / self.attack_time;
                    self.current_level += attack_rate * sample_time;
                }
            },
            EnvelopeStage::Decay => {
                // Exponential decay from 1.0 to sustain level
                if self.stage_time >= self.decay_time {
                    self.current_level = self.sustain_level;
                    self.stage = EnvelopeStage::Hold;
                    self.stage_time = 0.0;
                } else {
                    let decay_factor = (-5.0 * self.stage_time / self.decay_time).exp();
                    self.current_level = self.sustain_level + (1.0 - self.sustain_level) * decay_factor;
                }
            },
            EnvelopeStage::Hold => {
                // Hold at sustain level for hold_time
                if self.stage_time >= self.hold_time {
                    self.stage = EnvelopeStage::Sustain;
                }
                // Level stays constant during hold
            },
            EnvelopeStage::Sustain => {
                // Sustain at sustain_level until release
                self.current_level = self.sustain_level;
            },
            EnvelopeStage::Release => {
                // Exponential release from current level to 0
                if self.stage_time >= self.release_time {
                    self.current_level = 0.0;
                    self.stage = EnvelopeStage::Idle;
                } else {
                    let release_factor = (-5.0 * self.stage_time / self.release_time).exp();
                    self.current_level = self.current_level * release_factor;
                }
            },
        }
        
        self.current_level
    }
    
    pub fn is_active(&self) -> bool {
        self.stage != EnvelopeStage::Idle
    }
}