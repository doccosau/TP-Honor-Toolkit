/// 3GPP TS 36.214 & TS 38.215 Physical Layer Calculations

/// Calculate estimated physical distance to BTS in meters based on Timing Advance (TA)
/// rat_type: 0 = LTE, 1 = GSM, 2 = 5G NR
pub fn calculate_ta_distance(ta: i32, rat_type: i32) -> f64 {
    if ta <= 0 {
        return 0.0;
    }

    match rat_type {
        0 => (ta as f64) * 78.125, // LTE: 16 * Ts * c / 2 = ~78.125m
        1 => (ta as f64) * 550.0,  // GSM: 1 bit period = ~550m
        2 => (ta as f64) * 78.125, // 5G NR FR1 Sub-6: Subcarrier spacing base
        _ => (ta as f64) * 78.125,
    }
}

/// Calculate eNodeB / gNodeB ID and Sector ID from Cell Identity
/// rat_type: 0 = LTE (28-bit CI), 2 = 5G NR (36-bit NCI)
pub fn calculate_node_id(ci: i64, rat_type: i32) -> String {
    if ci <= 0 {
        return "N/A".to_string();
    }

    if rat_type == 2 {
        // 5G NR: 36 bits (gNodeB ID = NCI / 4096, Sector = NCI % 4096)
        if ci < 68719476735 {
            let gnb = ci / 4096;
            let sec = ci % 4096;
            return format!("gNodeB {} • Sec {}", gnb, sec);
        }
    } else {
        // 4G LTE: 28 bits (eNodeB ID = CI / 256, Sector = CI % 256)
        if ci <= 268435455 {
            let enb = ci / 256;
            let sec = ci % 256;
            return format!("eNodeB {} • Sec {}", enb, sec);
        }
    }

    format!("Cell ID {}", ci)
}

/// Lookup official 3GPP Band name from EARFCN / NRARFCN
pub fn calculate_band_name(arfcn: i32, is_nr: bool) -> String {
    if is_nr {
        match arfcn {
            422000..=434000 => "n1 (2100 MHz FDD)".to_string(),
            361000..=376000 => "n3 (1800 MHz FDD)".to_string(),
            140000..=156000 => "n28 (700 MHz APT)".to_string(),
            499200..=537999 => "n41 (2500 MHz TDD)".to_string(),
            620000..=653333 => "n78 (3500 MHz C-Band)".to_string(),
            653334..=680000 => "n77 (3700 MHz C-Band)".to_string(),
            693333..=733333 => "n79 (4700 MHz TDD)".to_string(),
            _ => format!("5G NR ARFCN {}", arfcn),
        }
    } else {
        match arfcn {
            0..=599 => "B1 (2100 MHz FDD)".to_string(),
            600..=1199 => "B2 (1900 MHz FDD)".to_string(),
            1200..=1949 => "B3 (1800 MHz FDD)".to_string(),
            1950..=2399 => "B4 (AWS-1 1700/2100 MHz)".to_string(),
            2400..=2649 => "B5 (850 MHz FDD)".to_string(),
            2750..=3449 => "B7 (2600 MHz FDD)".to_string(),
            3450..=3799 => "B8 (900 MHz FDD)".to_string(),
            6150..=6449 => "B20 (800 MHz DD)".to_string(),
            9210..=9659 => "B28 (700 MHz APT)".to_string(),
            37750..=38249 => "B38 (2600 MHz TDD)".to_string(),
            38650..=39649 => "B40 (2300 MHz TDD)".to_string(),
            39650..=41589 => "B41 (2500 MHz BRS/EBS TDD)".to_string(),
            _ => format!("LTE EARFCN {}", arfcn),
        }
    }
}
