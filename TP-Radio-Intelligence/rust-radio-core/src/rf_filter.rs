/// Real-Time 1D Kalman Filter for RF Signal Damping (RSRP / RSRQ / SINR)
pub struct KalmanFilter {
    q: f32, // Process noise covariance
    r: f32, // Measurement noise covariance
    x: f32, // Value estimate
    p: f32, // Estimation error covariance
    k: f32, // Kalman gain
}

impl KalmanFilter {
    pub const fn new(process_noise: f32, measurement_noise: f32, initial_value: f32) -> Self {
        Self {
            q: process_noise,
            r: measurement_noise,
            x: initial_value,
            p: 1.0,
            k: 0.0,
        }
    }

    pub fn update(&mut self, measurement: f32) -> f32 {
        // Prediction update
        self.p += self.q;

        // Measurement update (Kalman Gain)
        self.k = self.p / (self.p + self.r);
        self.x += self.k * (measurement - self.x);
        self.p *= 1.0 - self.k;

        self.x
    }
}

/// Exponential Moving Average (EMA) Filter
pub struct EmaFilter {
    alpha: f32,
    current: Option<f32>,
}

impl EmaFilter {
    pub const fn new(alpha: f32) -> Self {
        Self {
            alpha,
            current: None,
        }
    }

    pub fn update(&mut self, sample: f32) -> f32 {
        let val = match self.current {
            Some(prev) => (self.alpha * sample) + ((1.0 - self.alpha) * prev),
            None => sample,
        };
        self.current = Some(val);
        val
    }
}
