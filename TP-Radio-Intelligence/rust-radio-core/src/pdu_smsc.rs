/// 3GPP TS 23.040 / TS 24.011 SMSC PDU Formatter

/// Formats telephone number to official RIL SMSC PDU string with TON/NPI 145 (International)
pub fn format_smsc_pdu(phone_number: &str) -> String {
    let cleaned: String = phone_number.chars().filter(|c| c.is_digit(10) || *c == '+').collect();
    if cleaned.is_empty() {
        return String::new();
    }

    if cleaned.starts_with('+') {
        format!("\"{}\",145", cleaned)
    } else {
        format!("\"{}\",129", cleaned)
    }
}
