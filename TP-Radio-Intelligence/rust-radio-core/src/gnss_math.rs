/// GNSS Mathematics & Polar Projection

/// Projects Satellite Elevation (0..90 deg) and Azimuth (0..360 deg) to 2D Polar screen offset (dx, dy)
/// Returns [dx, dy] normalized from -radius to +radius
pub fn project_polar(elevation_deg: f32, azimuth_deg: f32, radius: f32) -> [f32; 2] {
    let clamped_elev = elevation_deg.clamp(0.0, 90.0);
    let r = radius * (1.0 - (clamped_elev / 90.0));

    let az_rad = (azimuth_deg - 90.0).to_radians();
    let dx = r * az_rad.cos();
    let dy = r * az_rad.sin();

    [dx, dy]
}

/// Identifies carrier frequency band label from frequency in Hz
pub fn resolve_carrier_frequency(freq_hz: f64) -> &'static str {
    let freq_mhz = freq_hz / 1_000_000.0;
    if (freq_mhz - 1575.42).abs() < 2.0 {
        "L1 / E1 / B1C"
    } else if (freq_mhz - 1176.45).abs() < 2.0 {
        "L5 / E5a / B2a"
    } else if (freq_mhz - 1561.098).abs() < 2.0 {
        "BDS B1I"
    } else if (freq_mhz - 1207.14).abs() < 2.0 {
        "BDS B2b"
    } else if (freq_mhz - 1602.0).abs() < 8.0 {
        "GLONASS G1"
    } else {
        "GNSS"
    }
}
