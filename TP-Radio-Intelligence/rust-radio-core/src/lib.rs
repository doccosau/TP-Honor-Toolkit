pub mod rf_filter;
pub mod three_gpp;
pub mod pdu_smsc;
pub mod gnss_math;
pub mod ble_pathloss;

use std::sync::Mutex;
use jni::JNIEnv;
use jni::objects::{JClass, JString};
use jni::sys::{jboolean, jdouble, jfloat, jfloatArray, jint, jlong, jstring};

use rf_filter::{KalmanFilter, EmaFilter};

// Global thread-safe RF filters
static RSRP_KALMAN: Mutex<KalmanFilter> = Mutex::new(KalmanFilter::new(0.05, 0.25, -90.0));
static RSRP_EMA: Mutex<EmaFilter> = Mutex::new(EmaFilter::new(0.35));

#[no_mangle]
pub extern "system" fn Java_vn_tp_radiointelligence_core_nativebridge_RadioNativeBridge_nativeInit(
    _env: JNIEnv,
    _class: JClass,
) -> jboolean {
    1 // true
}

#[no_mangle]
pub extern "system" fn Java_vn_tp_radiointelligence_core_nativebridge_RadioNativeBridge_nativeFilterRsrp(
    _env: JNIEnv,
    _class: JClass,
    raw_dbm: jfloat,
) -> jfloat {
    let k_filtered = {
        let mut f = RSRP_KALMAN.lock().unwrap();
        f.update(raw_dbm)
    };

    let ema_filtered = {
        let mut f = RSRP_EMA.lock().unwrap();
        f.update(k_filtered)
    };

    ema_filtered
}

#[no_mangle]
pub extern "system" fn Java_vn_tp_radiointelligence_core_nativebridge_RadioNativeBridge_nativeCalculateTimingAdvanceDistance(
    _env: JNIEnv,
    _class: JClass,
    ta: jint,
    rat_type: jint,
) -> jdouble {
    three_gpp::calculate_ta_distance(ta, rat_type)
}

#[no_mangle]
pub extern "system" fn Java_vn_tp_radiointelligence_core_nativebridge_RadioNativeBridge_nativeCalculateNodeId(
    env: JNIEnv,
    _class: JClass,
    ci: jlong,
    rat_type: jint,
) -> jstring {
    let node_desc = three_gpp::calculate_node_id(ci, rat_type);
    match env.new_string(node_desc) {
        Ok(js) => js.into_raw(),
        Err(_) => std::ptr::null_mut(),
    }
}

#[no_mangle]
pub extern "system" fn Java_vn_tp_radiointelligence_core_nativebridge_RadioNativeBridge_nativeCalculateBandName(
    env: JNIEnv,
    _class: JClass,
    arfcn: jint,
    is_nr: jboolean,
) -> jstring {
    let band_name = three_gpp::calculate_band_name(arfcn, is_nr != 0);
    match env.new_string(band_name) {
        Ok(js) => js.into_raw(),
        Err(_) => std::ptr::null_mut(),
    }
}

#[no_mangle]
pub extern "system" fn Java_vn_tp_radiointelligence_core_nativebridge_RadioNativeBridge_nativeFormatSmscPdu(
    mut env: JNIEnv,
    _class: JClass,
    phone_number: JString,
) -> jstring {
    let phone_str: String = match env.get_string(&phone_number) {
        Ok(s) => s.into(),
        Err(_) => return std::ptr::null_mut(),
    };

    let pdu = pdu_smsc::format_smsc_pdu(&phone_str);
    match env.new_string(pdu) {
        Ok(js) => js.into_raw(),
        Err(_) => std::ptr::null_mut(),
    }
}

#[no_mangle]
pub extern "system" fn Java_vn_tp_radiointelligence_core_nativebridge_RadioNativeBridge_nativeProjectGnssPolar(
    env: JNIEnv,
    _class: JClass,
    elevation: jfloat,
    azimuth: jfloat,
    radius: jfloat,
) -> jfloatArray {
    let res = gnss_math::project_polar(elevation, azimuth, radius);
    match env.new_float_array(2) {
        Ok(arr) => {
            if env.set_float_array_region(&arr, 0, &res).is_ok() {
                arr.into_raw()
            } else {
                std::ptr::null_mut()
            }
        }
        Err(_) => std::ptr::null_mut(),
    }
}

#[no_mangle]
pub extern "system" fn Java_vn_tp_radiointelligence_core_nativebridge_RadioNativeBridge_nativeCalculateBleDistance(
    _env: JNIEnv,
    _class: JClass,
    rssi: jint,
    tx_power: jint,
    path_loss_exponent: jfloat,
) -> jdouble {
    ble_pathloss::calculate_ble_distance(rssi, tx_power, path_loss_exponent)
}
