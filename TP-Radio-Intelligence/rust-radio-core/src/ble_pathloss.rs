/// Bluetooth LE Path Loss & Distance Physics

/// Log-Distance Path Loss Model
/// d = 10 ^ ((tx_power - rssi) / (10 * n))
pub fn calculate_ble_distance(rssi: i32, tx_power: i32, path_loss_exponent: f32) -> f64 {
    if rssi == 0 {
        return -1.0;
    }

    let n = if path_loss_exponent <= 0.0 { 2.4 } else { path_loss_exponent };
    let ratio = (tx_power - rssi) as f64 / (10.0 * (n as f64));
    10f64.powf(ratio)
}

