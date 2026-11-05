import React, { useState } from 'react';
import { adbService } from '../services/adbService';

export default function BackupTab({ device, onRestoreAll }) {
  const isOnline = Boolean(device && device.connected);

  const [loadingSection, setLoadingSection] = useState(null);
  const [activeDrawer, setActiveDrawer] = useState(null);
  const [successNotice, setSuccessNotice] = useState(null);

  // Core system bloatware packages list for rollback
  const DEFAULT_RESTORE_PACKAGES = [
    'com.hihonor.servicecenter',
    'com.baidu.swan',
    'com.hihonor.android.UEInfoCheck',
    'com.hihonor.collectcenter',
    'com.hihonor.magicvoice',
    'com.hihonor.fans',
    'com.hihonor.video',
    'com.hihonor.vmall',
    'com.hihonor.gamecenter',
    'com.hihonor.appmarket',
    'com.hihonor.assistant',
    'com.hihonor.search',
  ];

  // 1. Restore only bloatware apps
  const handleRestoreAppsOnly = async () => {
    if (!window.confirm('Khôi phục toàn bộ các ứng dụng hệ thống đã gỡ bỏ (cài lại cho User 0)?')) return;
    setLoadingSection('apps');
    try {
      const res = await adbService.restorePackages(DEFAULT_RESTORE_PACKAGES);
      if (res && res.success) {
        setSuccessNotice(`Đã khôi phục thành công ${res.count || DEFAULT_RESTORE_PACKAGES.length} ứng dụng gốc vào thiết bị!`);
      } else {
        alert(res?.error || 'Khôi phục ứng dụng thất bại');
      }
    } catch (e) {
      alert(e.message);
    } finally {
      setLoadingSection(null);
    }
  };

  // 2. Restore settings & telemetry only
  const handleRestoreSettingsOnly = async () => {
    if (!window.confirm('Khôi phục toàn bộ cài đặt ẩn và bật lại telemetry về nguyên bản xuất xưởng?')) return;
    setLoadingSection('settings');
    try {
      // Re-enable marketing & telemetry
      await adbService.applyAllMarketingOff(false);

      // Revert tweaks
      await adbService.applyMagicTweak('secure', 'charge_turbo_switch', '0');
      await adbService.applyMagicTweak('secure', 'infinite_volume_music_bt_a2dp', '0');
      await adbService.applyMagicTweak('secure', 'reduce_refresh_rate_enabled', '1');
      await adbService.applyMagicTweak('secure', 'hn_tianshan_switch', '0');
      await adbService.applyMagicTweak('secure', 'hn_sdr2hdr_switch', '0');
      await adbService.applyMagicTweak('secure', 'fingersense_letters_enabled', '0');
      await adbService.applyMagicTweak('secure', 'fingerprint_slide_switch', '0');
      await adbService.applyMagicTweak('system', 'show_network_speed_enabled', '0');

      setSuccessNotice('Đã khôi phục toàn bộ cờ cài đặt hệ thống về mặc định của nhà sản xuất Honor!');
    } catch (e) {
      alert(e.message);
    } finally {
      setLoadingSection(null);
    }
  };

  // 3. Restore network & display only
  const handleRestoreNetworkDisplayOnly = async () => {
    if (!window.confirm('Khôi phục cấu hình Mạng Wi-Fi/DNS và Màn hình về mặc định xuất xưởng?')) return;
    setLoadingSection('network_display');
    try {
      await adbService.applyNetworkSettings({}, true);
      await adbService.applyDisplaySettings({}, true);
      setSuccessNotice('Đã khôi phục toàn bộ thiết lập Mạng và Màn hình về cấu hình gốc!');
    } catch (e) {
      alert(e.message);
    } finally {
      setLoadingSection(null);
    }
  };

  // 4. Master Full Factory Rollback
  const handleMasterRollback = async () => {
    const confirmed = window.confirm(
      'CẢNH BÁO: Thao tác này sẽ hoàn tác 100% mọi tinh chỉnh, cài đặt lại toàn bộ ứng dụng rác đã gỡ, đặt lại DNS, Captive Portal, tần số quét và màn hình về nguyên bản xuất xưởng của Honor. Bạn có chắc chắn muốn tiếp tục?'
    );
    if (!confirmed) return;

    setLoadingSection('master');
    try {
      await onRestoreAll?.();
      setSuccessNotice('Đã hoàn tất khôi phục 100% hệ thống về nguyên bản xuất xưởng!');
    } catch (e) {
      alert(e.message);
    } finally {
      setLoadingSection(null);
    }
  };

  // 5. Generate and download standalone emergency script (.sh or .bat)
  const handleExportEmergencyScript = (format = 'sh') => {
    let scriptContent = '';
    const filename = format === 'sh' ? 'honor_emergency_rollback.sh' : 'honor_emergency_rollback.bat';

    if (format === 'sh') {
      scriptContent = `#!/usr/bin/env bash
# ==============================================================================
# TP-HONOR TOOLKIT - STANDALONE EMERGENCY DISASTER RECOVERY SCRIPT
# Tự động khôi phục điện thoại Honor về 100% trạng thái xuất xưởng mặc định
# ==============================================================================
set -e

echo "[*] Kiem tra ket noi ADB..."
adb devices

echo "[*] 1/4 Dang cai dat va kich hoat lai toan bo ung dung he thong da go..."
for pkg in ${DEFAULT_RESTORE_PACKAGES.join(' ')}; do
  adb shell cmd package install-existing $pkg 2>/dev/null || true
  adb shell pm enable $pkg 2>/dev/null || true
done

echo "[*] 2/4 Dang khoi phuc co cai dat he thong & Telemetry ve mac dinh..."
adb shell settings put secure state_of_ads_switch 1
adb shell settings put secure intelligent_message_enabled 1
adb shell settings put secure personalized_push_state 1
adb shell settings put secure personalized_recommendation 1
adb shell settings put secure hiboard.recommend.status 1
adb shell settings put secure location_honor_ads 1
adb shell settings put secure settings_ai_recommend 1
adb shell settings put secure intelligent_recommendation_toggle 1
adb shell settings put secure search.recommend.letter.switch 1
adb shell settings put secure cloud_maintenance 1
adb shell settings put secure location_report_switch 1

adb shell settings put secure charge_turbo_switch 0
adb shell settings put secure infinite_volume_music_bt_a2dp 0
adb shell settings put secure reduce_refresh_rate_enabled 1
adb shell settings put secure hn_tianshan_switch 0
adb shell settings put secure hn_sdr2hdr_switch 0
adb shell settings put secure fingersense_letters_enabled 0
adb shell settings put secure fingerprint_slide_switch 0
adb shell settings put system show_network_speed_enabled 0

echo "[*] 3/4 Dang khoi phuc cau hinh mang & Captive Portal..."
adb shell settings put global captive_portal_mode 1
adb shell settings put global captive_portal_use_https 1
adb shell settings put global captive_portal_http_url http://connectivitycheck.gstatic.com/generate_204
adb shell settings put global captive_portal_https_url https://connectivitycheck.gstatic.com/generate_204
adb shell settings put global private_dns_mode off
adb shell settings put global wifi_power_save 120

echo "[*] 4/4 Dang khoi phuc man hinh & tan so quet..."
adb shell settings delete system min_refresh_rate 2>/dev/null || true
adb shell settings delete system peak_refresh_rate 2>/dev/null || true
adb shell wm density reset
adb shell settings delete secure display_density_forced 2>/dev/null || true
adb shell settings put global low_resolution_switch 1
adb shell settings put global aps_display_resolution 2

echo "[+] HOAN TAT! Dien thoai Honor da duoc dua ve 100% nguyen ban xuat xuong."
`;
    } else {
      scriptContent = `@echo off
rem ==============================================================================
rem TP-HONOR TOOLKIT - STANDALONE EMERGENCY DISASTER RECOVERY SCRIPT (WINDOWS)
rem ==============================================================================
chcp 65001 >nul
echo [*] Kiem tra ket noi ADB...
adb devices

echo [*] 1/4 Dang cai dat lai ung dung goc...
${DEFAULT_RESTORE_PACKAGES.map((pkg) => `adb shell cmd package install-existing ${pkg} >nul 2>&1\nadb shell pm enable ${pkg} >nul 2>&1`).join('\n')}

echo [*] 2/4 Dang khoi phuc co cai dat ve mac dinh...
adb shell settings put secure state_of_ads_switch 1
adb shell settings put secure intelligent_message_enabled 1
adb shell settings put secure personalized_push_state 1
adb shell settings put secure personalized_recommendation 1
adb shell settings put secure hiboard.recommend.status 1
adb shell settings put secure location_honor_ads 1
adb shell settings put secure settings_ai_recommend 1
adb shell settings put secure intelligent_recommendation_toggle 1
adb shell settings put secure search.recommend.letter.switch 1
adb shell settings put secure cloud_maintenance 1
adb shell settings put secure location_report_switch 1

adb shell settings put secure charge_turbo_switch 0
adb shell settings put secure infinite_volume_music_bt_a2dp 0
adb shell settings put secure reduce_refresh_rate_enabled 1
adb shell settings put secure hn_tianshan_switch 0
adb shell settings put secure hn_sdr2hdr_switch 0
adb shell settings put secure fingersense_letters_enabled 0
adb shell settings put secure fingerprint_slide_switch 0
adb shell settings put system show_network_speed_enabled 0

echo [*] 3/4 Dang khoi phuc mang & Captive Portal...
adb shell settings put global captive_portal_mode 1
adb shell settings put global captive_portal_use_https 1
adb shell settings put global captive_portal_http_url http://connectivitycheck.gstatic.com/generate_204
adb shell settings put global captive_portal_https_url https://connectivitycheck.gstatic.com/generate_204
adb shell settings put global private_dns_mode off
adb shell settings put global wifi_power_save 120

echo [*] 4/4 Dang khoi phuc man hinh...
adb shell settings delete system min_refresh_rate >nul 2>&1
adb shell settings delete system peak_refresh_rate >nul 2>&1
adb shell wm density reset
adb shell settings delete secure display_density_forced >nul 2>&1
adb shell settings put global low_resolution_switch 1
adb shell settings put global aps_display_resolution 2

echo [+] HOAN TAT! Thiet bi da tro ve 100% nguyen ban xuat xuong.
pause
`;
    }

    const blob = new Blob([scriptContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="crm-workspace-layout">
      {/* 1. Header & Breadcrumb Ribbon (Nhạc Quán Admin Style) */}
      <div className="specs-card" style={{ width: '100%', marginBottom: 0 }}>
        <div className="specs-header-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="svg-icon" style={{ color: '#ef4444' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                <polyline points="9 12 11 14 15 10"></polyline>
              </svg>
            </span>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-bright)' }}>
                Trung Tâm Phục Hồi Thảm Họa &amp; Hoàn Tác Xuất Xưởng (Disaster Recovery)
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>
                Hệ thống sao lưu phân lớp • Hỗ trợ hoàn tác từng phần hoặc toàn diện 100% về nguyên bản xuất xưởng
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge-tag tag-neutral" style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
              ADB DISASTER ENGINE
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#10b981', fontWeight: 600 }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }} />
              <span>Sẵn Sàng</span>
            </div>
          </div>
        </div>

        {/* 4 Health Status Capsules */}
        <div className="metric-capsule-grid" style={{ marginTop: '14px' }}>
          <div className="metric-capsule">
            <span className="metric-capsule-label">Khôi Phục Gói Ứng Dụng</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span className="metric-capsule-value" style={{ color: '#38bdf8' }}>
                User 0 Engine
              </span>
              <span className="badge-tag tag-safe" style={{ fontSize: '9px', padding: '1px 5px' }}>
                Không Cần Tải Lại
              </span>
            </div>
            <span className="metric-capsule-sub">Kích hoạt lại app gốc từ phân vùng hệ thống</span>
          </div>

          <div className="metric-capsule">
            <span className="metric-capsule-label">Cài Đặt &amp; Telemetry</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span className="metric-capsule-value" style={{ color: '#f59e0b' }}>
                11 Khóa Secure
              </span>
              <span className="badge-tag tag-neutral" style={{ fontSize: '9px', padding: '1px 5px' }}>
                Bản Gốc Honor
              </span>
            </div>
            <span className="metric-capsule-sub">Trả cờ tiếp thị, âm lượng, sạc nhanh về mặc định</span>
          </div>

          <div className="metric-capsule">
            <span className="metric-capsule-label">Mạng &amp; Captive Portal</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span className="metric-capsule-value" style={{ color: '#10b981' }}>
                ISP / Baidu
              </span>
              <span className="badge-tag tag-neutral" style={{ fontSize: '9px', padding: '1px 5px' }}>
                DoT Off
              </span>
            </div>
            <span className="metric-capsule-sub">Khôi phục máy chủ kiểm tra mạng nội địa</span>
          </div>

          <div className="metric-capsule">
            <span className="metric-capsule-label">Màn Hình &amp; Tần Số Quét</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span className="metric-capsule-value" style={{ color: '#ec4899' }}>
                Tự Động Smart
              </span>
              <span className="badge-tag tag-safe" style={{ fontSize: '9px', padding: '1px 5px' }}>
                Factory Reset
              </span>
            </div>
            <span className="metric-capsule-sub">Trả DPI và độ phân giải về tiêu chuẩn hãng</span>
          </div>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successNotice && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '10px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            color: '#10b981',
            fontSize: '12.5px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>{successNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessNotice(null)}
            style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', padding: '2px 4px' }}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      )}

      {/* 2. Granular Restoration Cards Grid */}
      <div className="crm-grid-matrix">
        {/* Card 1: Restore Bloatware */}
        <div className="crm-card" style={{ borderColor: 'rgba(56, 189, 248, 0.3)' }}>
          <div className="crm-card-header">
            <div className="crm-card-title-group">
              <div className="crm-card-icon" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                  <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
              </div>
              <div>
                <div className="crm-card-title">1. Khôi Phục Ứng Dụng Bloatware Đã Gỡ</div>
                <div className="crm-card-meta">
                  <span className="badge-tag tag-neutral" style={{ fontSize: '9px' }}>
                    cmd package install-existing
                  </span>
                  <span className="badge-tag tag-safe" style={{ fontSize: '9px' }}>
                    Phân Vùng Hệ Thống
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="btn-tool primary"
              style={{ fontSize: '11px', padding: '5px 12px', fontWeight: 600 }}
              onClick={handleRestoreAppsOnly}
              disabled={!isOnline || loadingSection === 'apps'}
            >
              {loadingSection === 'apps' ? 'Đang khôi phục...' : 'Cài Đặt Lại App Gốc'}
            </button>
          </div>

          <div className="crm-card-desc">
            Cài đặt và kích hoạt lại toàn bộ các ứng dụng rác, dịch vụ Honor Club, Video, AppMarket, Baidu Swan đã gỡ bỏ trước đó.
          </div>

          <div className="crm-card-footer">
            <span style={{ color: 'var(--text-muted)' }}>
              Khôi phục {DEFAULT_RESTORE_PACKAGES.length} ứng dụng gốc vào User 0
            </span>
            <button
              type="button"
              className="crm-inspect-btn"
              onClick={() =>
                setActiveDrawer({
                  title: 'Giải Phẫu: Khôi Phục Ứng Dụng Bloatware',
                  command: DEFAULT_RESTORE_PACKAGES.map((pkg) => `adb shell cmd package install-existing ${pkg}`).join('\n'),
                  desc: 'Android giữ bản sao tệp APK gốc trong phân vùng /system và /product. Lệnh install-existing gắn lại ứng dụng vào hồ sơ người dùng 0 mà không cần kết nối mạng tải lại.',
                  impact: 'Các biểu tượng ứng dụng gốc xuất hiện trở lại trên màn hình chính.',
                  safety: 'An Toàn Tuyệt Đối (Nguyên bản nhà sản xuất)',
                })
              }
            >
              <span>Xem chi tiết lệnh</span>
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
        </div>

        {/* Card 2: Restore System Settings & Telemetry */}
        <div className="crm-card" style={{ borderColor: 'rgba(245, 158, 11, 0.3)' }}>
          <div className="crm-card-header">
            <div className="crm-card-title-group">
              <div className="crm-card-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              </div>
              <div>
                <div className="crm-card-title">2. Hoàn Tác Cài Đặt Hệ Thống &amp; Telemetry</div>
                <div className="crm-card-meta">
                  <span className="badge-tag tag-neutral" style={{ fontSize: '9px' }}>
                    settings put secure
                  </span>
                  <span className="badge-tag tag-warn" style={{ fontSize: '9px' }}>
                    11 Khóa Tiếp Thị
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="btn-tool"
              style={{ fontSize: '11px', padding: '5px 12px', fontWeight: 600 }}
              onClick={handleRestoreSettingsOnly}
              disabled={!isOnline || loadingSection === 'settings'}
            >
              {loadingSection === 'settings' ? 'Đang hoàn tác...' : 'Trả Cài Đặt Về Gốc'}
            </button>
          </div>

          <div className="crm-card-desc">
            Bật lại các thông báo tiếp thị, banner quảng cáo, trả cờ sạc nhanh Turbo, âm lượng Bluetooth vô cực và cử chỉ về mặc định.
          </div>

          <div className="crm-card-footer">
            <span style={{ color: 'var(--text-muted)' }}>
              Khôi phục bảng Settings Secure và System về tiêu chuẩn Honor
            </span>
            <button
              type="button"
              className="crm-inspect-btn"
              onClick={() =>
                setActiveDrawer({
                  title: 'Giải Phẫu: Hoàn Tác Cài Đặt Hệ Thống',
                  command:
                    'adb shell settings put secure state_of_ads_switch 1\nadb shell settings put secure intelligent_message_enabled 1\nadb shell settings put secure personalized_push_state 1\nadb shell settings put secure charge_turbo_switch 0\nadb shell settings put secure reduce_refresh_rate_enabled 1',
                  desc: 'Ghi lại các giá trị gốc vào cơ sở dữ liệu settings.db của Android để máy hoạt động đúng như khi vừa khui hộp.',
                  impact: 'Bảo hành chính hãng không bị từ chối do can thiệp cờ phần cứng ngầm.',
                  safety: 'An Toàn Tuyệt Đối',
                })
              }
            >
              <span>Xem chi tiết lệnh</span>
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
        </div>

        {/* Card 3: Restore Network & Display */}
        <div className="crm-card" style={{ borderColor: 'rgba(16, 185, 129, 0.3)' }}>
          <div className="crm-card-header">
            <div className="crm-card-title-group">
              <div className="crm-card-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
                  <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
                  <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
                  <line x1="12" y1="20" x2="12.01" y2="20"></line>
                </svg>
              </div>
              <div>
                <div className="crm-card-title">3. Khôi Phục Mạng Wi-Fi &amp; Màn Hình</div>
                <div className="crm-card-meta">
                  <span className="badge-tag tag-neutral" style={{ fontSize: '9px' }}>
                    Captive Portal &amp; DPI
                  </span>
                  <span className="badge-tag tag-safe" style={{ fontSize: '9px' }}>
                    Tự Động Chuẩn Hãng
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="btn-tool"
              style={{ fontSize: '11px', padding: '5px 12px', fontWeight: 600 }}
              onClick={handleRestoreNetworkDisplayOnly}
              disabled={!isOnline || loadingSection === 'network_display'}
            >
              {loadingSection === 'network_display' ? 'Đang hoàn tác...' : 'Reset Mạng & Màn Hình'}
            </button>
          </div>

          <div className="crm-card-desc">
            Xóa cấu hình Private DNS DoT, trả máy chủ kiểm tra mạng Captive Portal về mặc định, reset DPI mật độ hiển thị và tần số quét thông minh.
          </div>

          <div className="crm-card-footer">
            <span style={{ color: 'var(--text-muted)' }}>
              Trả Wi-Fi sleep policy, RTT URL, độ phân giải về tự động
            </span>
            <button
              type="button"
              className="crm-inspect-btn"
              onClick={() =>
                setActiveDrawer({
                  title: 'Giải Phẫu: Khôi Phục Mạng & Màn Hình',
                  command:
                    'adb shell settings put global private_dns_mode off\nadb shell settings put global captive_portal_mode 1\nadb shell wm density reset\nadb shell settings delete system min_refresh_rate\nadb shell settings delete system peak_refresh_rate',
                  desc: 'Xóa toàn bộ các cờ ép xung tần số quét và override độ phân giải của WindowManager, trả máy về chế độ điều tiết năng lượng tự động.',
                  impact: 'Hệ thống tự cân bằng giữa độ mượt và tiết kiệm pin như ban đầu.',
                  safety: 'An Toàn Tuyệt Đối',
                })
              }
            >
              <span>Xem chi tiết lệnh</span>
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Master Full Factory Rollback Banner */}
      <div
        className="specs-card"
        style={{
          width: '100%',
          borderColor: 'rgba(239, 68, 68, 0.45)',
          background: 'rgba(20, 10, 15, 0.7)',
          padding: '18px 20px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ef4444',
                flexShrink: 0,
              }}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#f87171' }}>
                Khôi Phục Toàn Diện 100% Nguyên Bản Xuất Xưởng (Master Rollback)
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-dim)', marginTop: '4px', maxWidth: '680px', lineHeight: '1.5' }}>
                Sử dụng khi bạn chuẩn bị bán lại máy, bàn giao, đi bảo hành chính hãng tại trung tâm Honor, hoặc muốn đưa thiết bị về trạng thái nhà máy tinh khôi mà không làm mất ảnh, danh bạ hay dữ liệu cá nhân.
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn-tool danger"
            style={{ fontSize: '12px', padding: '8px 18px', fontWeight: 700 }}
            onClick={handleMasterRollback}
            disabled={!isOnline || loadingSection === 'master'}
          >
            <span className="svg-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="1 4 1 10 7 10"></polyline>
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
              </svg>
            </span>
            <span>{loadingSection === 'master' ? 'Đang hoàn tác toàn diện...' : 'Khôi Phục Toàn Bộ Về Xuất Xưởng'}</span>
          </button>
        </div>
      </div>

      {/* 4. Standalone Emergency Offline Script Exporter */}
      <div className="specs-card" style={{ width: '100%', padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-bright)' }}>
              Xuất File Script Khôi Phục Khẩn Cấp Độc Lập (.sh / .bat)
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>
              Tải file script chứa toàn bộ lệnh ADB shell để bạn có thể chạy khôi phục bất cứ lúc nào qua Terminal/CMD mà không cần internet.
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="btn-tool"
              style={{ fontSize: '11.5px', padding: '6px 14px' }}
              onClick={() => handleExportEmergencyScript('sh')}
            >
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '5px' }}>
                <polyline points="4 17 10 11 4 5"></polyline>
                <line x1="12" y1="19" x2="20" y2="19"></line>
              </svg>
              <span>Tải Script Linux / macOS (.sh)</span>
            </button>

            <button
              type="button"
              className="btn-tool"
              style={{ fontSize: '11.5px', padding: '6px 14px' }}
              onClick={() => handleExportEmergencyScript('bat')}
            >
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '5px' }}>
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                <line x1="8" y1="21" x2="16" y2="21"></line>
                <line x1="12" y1="17" x2="12" y2="21"></line>
              </svg>
              <span>Tải Script Windows (.bat)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Slide-Over Inspection Drawer */}
      {activeDrawer && (
        <>
          <div className="crm-drawer-backdrop" onClick={() => setActiveDrawer(null)} />
          <div className="crm-drawer-panel">
            <div className="crm-drawer-header">
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-bright)' }}>
                {activeDrawer.title}
              </span>
              <button
                type="button"
                className="crm-drawer-close"
                onClick={() => setActiveDrawer(null)}
              >
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="crm-drawer-body">
              <div className="crm-drawer-section">
                <div className="crm-drawer-section-title">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                  <span>Mục đích &amp; Cơ chế</span>
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--text-main)', lineHeight: '1.6' }}>
                  {activeDrawer.desc}
                </div>
              </div>

              <div className="crm-drawer-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="crm-drawer-section-title">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="4 17 10 11 4 5"></polyline>
                      <line x1="12" y1="19" x2="20" y2="19"></line>
                    </svg>
                    <span>Lệnh ADB Shell thực thi</span>
                  </div>
                  <button
                    type="button"
                    className="btn-tool"
                    style={{ fontSize: '10px', padding: '2px 8px' }}
                    onClick={() => {
                      navigator.clipboard.writeText(activeDrawer.command);
                      alert('Đã sao chép lệnh vào clipboard!');
                    }}
                  >
                    Sao Chép
                  </button>
                </div>
                <div className="crm-code-box">{activeDrawer.command}</div>
              </div>

              <div className="crm-drawer-section" style={{ borderLeft: '3px solid #10b981' }}>
                <div className="crm-drawer-section-title" style={{ color: '#10b981' }}>
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                  <span>Mức độ an toàn</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-dim)', lineHeight: '1.4' }}>
                  {activeDrawer.safety}
                </div>
              </div>
            </div>

            <div className="crm-drawer-footer">
              <button
                type="button"
                className="btn-tool"
                onClick={() => setActiveDrawer(null)}
                style={{ fontSize: '12px' }}
              >
                Đóng
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
