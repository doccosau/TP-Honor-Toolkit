import React, { useState, useEffect } from 'react';
import { adbService } from '../services/adbService';
import ThemeStudioModal from './ThemeStudioModal';

export default function ToolboxTab({
  device,
  onLaunchScrcpy,
  onOpenWebMirror,
  onSetAssistant,
  onInstallGestureSearch,
  onInstallVxMAssistant,
  onSetupFullAssistantSuite,
  onEnableGoogleServices,
  onInstallPlayStore,
  onSetupFullGoogleEcosystem,
  onCompileApps,
  onDisableTelemetry,
  onFixWeather,
  onReboot,
}) {
  const [turnOffScreen, setTurnOffScreen] = useState(true);
  const [stayAwake, setStayAwake] = useState(true);
  const [customPlayStoreUrl, setCustomPlayStoreUrl] = useState('');
  const [isSettingWireless, setIsSettingWireless] = useState(false);
  const [isCapturingScreenshot, setIsCapturingScreenshot] = useState(false);
  const [screenshotResult, setScreenshotResult] = useState(null);
  const [copiedQuickCmd, setCopiedQuickCmd] = useState(false);

  // Theme Studio & Magic Tweaks State
  const [isThemeStudioOpen, setIsThemeStudioOpen] = useState(false);
  const [magicTweaks, setMagicTweaks] = useState({});
  const [loadingTweakKey, setLoadingTweakKey] = useState(null);
  const [rootStatus, setRootStatus] = useState(null);
  const [quickExtracting, setQuickExtracting] = useState(false);
  const [quickExtractMsg, setQuickExtractMsg] = useState(null);

  const isWeb = adbService.mode === 'webusb';

  // Screen recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [recordingResult, setRecordingResult] = useState(null);
  const recTimerRef = React.useRef(null);

  const isOnline = device && device.connected;

  React.useEffect(() => {
    let timer = null;
    const checkRec = async () => {
      const st = await adbService.getScreenRecordStatus();
      if (st && st.recording) {
        setIsRecording(true);
        setRecordSeconds(st.duration || 1);
        timer = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
      }
    };
    checkRec();
    return () => {
      if (timer) clearInterval(timer);
      if (recTimerRef.current) clearInterval(recTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (isOnline) {
      loadMagicTweaks();
      loadRootStatus();
    }
  }, [isOnline]);

  const loadMagicTweaks = async () => {
    const res = await adbService.getMagicTweaks();
    if (res && res.success) {
      setMagicTweaks(res.tweaks || {});
    }
  };

  const loadRootStatus = async () => {
    const res = await adbService.getRootStatus();
    if (res) setRootStatus(res);
  };

  const handleToggleTweak = async (table, key, currentVal, targetOnVal = '1', targetOffVal = '0') => {
    setLoadingTweakKey(key);
    try {
      const nextVal = currentVal === targetOnVal ? targetOffVal : targetOnVal;
      const res = await adbService.applyMagicTweak(table, key, nextVal);
      if (res && res.success) {
        await loadMagicTweaks();
      }
    } finally {
      setLoadingTweakKey(null);
    }
  };

  const handleToggleMarketing = async () => {
    setLoadingTweakKey('marketing');
    try {
      const isCurrentlyOff = magicTweaks?.marketing_all_disabled?.enabled;
      await adbService.applyAllMarketingOff(!isCurrentlyOff);
      await loadMagicTweaks();
    } finally {
      setLoadingTweakKey(null);
    }
  };

  const handleQuickExtract = async () => {
    setQuickExtracting(true);
    setQuickExtractMsg(null);
    try {
      const res = await adbService.extractTrialTheme();
      if (res && res.success) {
        setQuickExtractMsg(`Đã trích xuất thành công: ${res.title} (${res.size_mb} MB)! Đã nạp vào app Chủ Đề.`);
      } else {
        alert(res?.message || 'Chưa phát hiện theme dùng thử tại /data/themes/0. Vui lòng vào app Chủ Đề và bấm Dùng thử (5 phút) trước.');
      }
    } catch (e) {
      alert(e.message);
    } finally {
      setQuickExtracting(false);
    }
  };

  const handleWirelessConnect = async () => {
    setIsSettingWireless(true);
    try {
      const res = await adbService.connectWirelessAdb();
      if (res && res.connected) {
        alert(`Đã kết nối không dây thành công tới ${res.ip}:5555! Bạn có thể rút cáp USB.`);
      } else if (res && res.success) {
        alert(res.message || 'Đã mở cổng 5555');
      } else {
        alert(res?.error || 'Lỗi kết nối Wi-Fi');
      }
    } catch (e) {
      alert(e.message);
    } finally {
      setIsSettingWireless(false);
    }
  };

  const handleScreenshot = async () => {
    setIsCapturingScreenshot(true);
    try {
      const res = await adbService.takeScreenshot();
      if (res && res.success) {
        setScreenshotResult(res);
      } else {
        alert(res?.error || 'Lỗi chụp màn hình');
      }
    } catch (e) {
      alert(e.message);
    } finally {
      setIsCapturingScreenshot(false);
    }
  };

  const handleToggleRecord = async () => {
    if (!isRecording) {
      const res = await adbService.startScreenRecord();
      if (res && res.success) {
        setIsRecording(true);
        setRecordSeconds(0);
        recTimerRef.current = setInterval(() => {
          setRecordSeconds((s) => s + 1);
        }, 1000);
      } else {
        alert(res?.error || 'Không thể bắt đầu quay video màn hình');
      }
    } else {
      if (recTimerRef.current) clearInterval(recTimerRef.current);
      setIsRecording(false);
      const res = await adbService.stopScreenRecord();
      if (res && res.success) {
        setRecordingResult(res);
      } else {
        alert(res?.error || 'Lỗi dừng quay màn hình');
      }
    }
  };


  return (
    <div className="tab-pane active" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '14px', width: '100%' }}>
        {/* Scrcpy Box */}
        <div className="specs-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="specs-header-title">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="svg-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13 3H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-3"></path>
                    <polyline points="8 21 12 17 16 21"></polyline>
                    <line x1="12" y1="17" x2="12" y2="21"></line>
                    <path d="M17 8l5-5"></path>
                    <path d="M17 3h5v5"></path>
                  </svg>
                </span>
                <span>Chiếu Màn Hình & Điều Khiển 120Hz (Scrcpy)</span>
              </div>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-dim)', margin: '10px 0 12px 0', lineHeight: '1.5' }}>
              Mở cửa sổ Scrcpy điều khiển điện thoại mượt mà bằng chuột và bàn phím máy tính với tốc độ phản hồi 120 FPS.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px' }}>
                <input
                  type="checkbox"
                  checked={turnOffScreen}
                  onChange={(e) => setTurnOffScreen(e.target.checked)}
                />
                <span>Tắt màn hình điện thoại khi chiếu (Giảm nóng máy)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px' }}>
                <input
                  type="checkbox"
                  checked={stayAwake}
                  onChange={(e) => setStayAwake(e.target.checked)}
                />
                <span>Giữ điện thoại luôn thức (Stay Awake)</span>
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              className="btn-tool primary"
              style={{ width: '100%', justifyContent: 'center', padding: '9px 12px', fontWeight: 600 }}
              onClick={() => onLaunchScrcpy({ turnOffScreen, stayAwake })}
              disabled={!isOnline}
            >
              <span className="svg-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
              </span>
              <span>{isWeb ? 'Mở Scrcpy 120Hz (Lệnh Chuẩn Winget)' : 'Khởi Chạy Scrcpy 120Hz Ngay'}</span>
            </button>

            <button
              type="button"
              className="btn-tool"
              style={{ width: '100%', justifyContent: 'center', padding: '6px', fontSize: '11.5px', color: '#38bdf8' }}
              onClick={onOpenWebMirror}
              disabled={!isOnline}
            >
              <span className="svg-icon" style={{ marginRight: '6px' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                  <line x1="12" y1="18" x2="12.01" y2="18"></line>
                </svg>
              </span>
              <span>Xem &amp; Điều Khiển Ngay Trong Web (Web Mirror)</span>
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              <button
                type="button"
                className="btn-tool"
                style={{ justifyContent: 'center', fontSize: '11px', padding: '6px 4px' }}
                onClick={handleWirelessConnect}
                disabled={!isOnline || isSettingWireless}
                title="Bật kết nối không dây qua Wi-Fi (Port 5555) để rút cáp USB"
              >
                <span className="svg-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
                    <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
                    <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
                    <line x1="12" y1="20" x2="12.01" y2="20"></line>
                  </svg>
                </span>
                <span>{isSettingWireless ? 'Đang mở...' : 'Wi-Fi ADB'}</span>
              </button>

              <button
                type="button"
                className="btn-tool"
                style={{ justifyContent: 'center', fontSize: '11px', padding: '6px 4px' }}
                onClick={handleScreenshot}
                disabled={!isOnline || isCapturingScreenshot}
                title="Chụp ảnh màn hình điện thoại độ phân giải gốc lưu vào PC"
              >
                <span className="svg-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                    <circle cx="12" cy="13" r="4"></circle>
                  </svg>
                </span>
                <span>{isCapturingScreenshot ? 'Đang chụp...' : 'Chụp Ảnh'}</span>
              </button>

              <button
                type="button"
                className={`btn-tool ${isRecording ? 'danger recording-pulse' : ''}`}
                style={{ justifyContent: 'center', fontSize: '11px', padding: '6px 4px' }}
                onClick={handleToggleRecord}
                disabled={!isOnline}
                title="Quay video màn hình 1080p lưu file MP4 trực tiếp về máy tính"
              >
                <span className="svg-icon" style={{ color: isRecording ? '#fff' : '#ef4444' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="23 7 16 12 23 17 23 7"></polygon>
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                  </svg>
                </span>
                <span>{isRecording ? `Dừng (${recordSeconds}s)` : 'Quay MP4'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Telemetry Blocker Box (Step 4) */}
        <div className="specs-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="specs-header-title">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="svg-icon" style={{ color: '#38bdf8' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
                  </svg>
                </span>
                <span>Chặn Telemetry & Thu Thập Log TQ</span>
              </div>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-dim)', margin: '10px 0 14px 0', lineHeight: '1.5' }}>
              Tắt chương trình trải nghiệm người dùng (`user_experience_involved 0`), thu hồi quyền chạy nền `hiviewtunnel`, đóng băng vĩnh viễn `UEInfoCheck` và `collectcenter` gửi log về Trung Quốc.
            </p>
          </div>
          <button
            className="btn-tool warning"
            style={{ width: '100%', justifyContent: 'center', padding: '8px' }}
            onClick={onDisableTelemetry}
            disabled={!isOnline}
          >
            <span className="svg-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
            </span>
            <span>Tắt Sạch Telemetry & Log Ngầm TQ</span>
          </button>
        </div>

        {/* Weather App Celsius Box (Step 7) */}
        <div className="specs-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="specs-header-title">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="svg-icon" style={{ color: '#f59e0b' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                  </svg>
                </span>
                <span>Việt Hóa Thời Tiết (Tiếng Anh Độ C)</span>
              </div>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-dim)', margin: '10px 0 14px 0', lineHeight: '1.5' }}>
              Do app Thời Tiết nội địa Honor không có Tiếng Việt (chỉ có zh và en), tính năng này ép ngôn ngữ app sang `en-GB` chuẩn quốc tế để hiển thị nhiệt độ Độ C (°C) thay vì fallback về Tiếng Trung.
            </p>
          </div>
          <button
            className="btn-tool"
            style={{ width: '100%', justifyContent: 'center', padding: '8px' }}
            onClick={onFixWeather}
            disabled={!isOnline}
          >
            <span className="svg-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              </svg>
            </span>
            <span>Đổi Thời Tiết Sang Tiếng Anh (Độ C)</span>
          </button>
        </div>

        {/* Google & Gemini All-in-One Suite Box */}
        <div className="specs-card" style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid rgba(56, 189, 248, 0.35)', background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.7), rgba(30, 41, 59, 0.4))' }}>
          <div>
            <div className="specs-header-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="svg-icon" style={{ color: '#38bdf8' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                    <line x1="12" y1="19" x2="12" y2="22"></line>
                  </svg>
                </span>
                <span style={{ fontWeight: 600, fontSize: '14px', color: '#f8fafc' }}>
                  Bộ Giải Pháp Trợ Lý Ảo Google & Gemini Toàn Diện (Fix Triệt Để Honor China)
                </span>
              </div>
              <span style={{ fontSize: '11px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '2px 8px', borderRadius: '4px' }}>
                Hybrid 3 Tầng Siêu Tốc
              </span>
            </div>
            
            <p style={{ fontSize: '12px', color: 'var(--text-dim)', margin: '8px 0 12px 0', lineHeight: '1.6' }}>
              Do Honor MagicOS nội địa Trung Quốc khóa cứng phím vật lý cho YOYO Voice, công cụ trang bị trọn bộ giải pháp 3 lớp:
              <br />
              <b>1. Cấu hình lõi Android:</b> Đóng băng YOYO, gán toàn quyền và dịch vụ mặc định sang Google Assistant & Gemini.
              <br />
              <b>2. Thanh cử chỉ Gesture Search:</b> Tạo thanh vuốt ảo ở cạnh đáy hoặc phím tắt Control Center gọi ngay Gemini Floaty đè lên mọi ứng dụng.
              <br />
              <b>3. Đánh thức giọng nói Trợ Lý VXM:</b> Tích hợp engine offline nhận diện &quot;OK Google / Hey Google&quot; 24/7 đánh thức màn hình mà không tốn pin.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '14px' }}>
              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#38bdf8', marginBottom: '4px' }}>Lõi Android System</div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Gán default assistant, voice interaction và cấp quyền chụp màn hình trợ lý.</div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#c084fc', marginBottom: '4px' }}>Gesture Search (2.3 MB)</div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Thanh vuốt đáy màn hình & Tile Quick Settings gọi nhanh Gemini Floaty.</div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#34d399', marginBottom: '4px' }}>Trợ Lý VXM (52 MB)</div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Engine nhận diện giọng nói Vosk offline 24/7 cho lệnh &quot;OK Google&quot;.</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Master 1-Click Button */}
            <button
              className="btn-tool success"
              style={{ width: '100%', justifyContent: 'center', padding: '10px', fontSize: '13px', fontWeight: 600 }}
              onClick={onSetupFullAssistantSuite}
              disabled={!isOnline}
            >
              <span className="svg-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
              </span>
              <span>KÍCH HOẠT TRỌN BỘ TRỢ LÝ TOÀN DIỆN (1-CLICK ALL-IN-ONE)</span>
            </button>

            {/* Individual actions */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
              <button
                className="btn-tool"
                style={{ justifyContent: 'center', fontSize: '11px', padding: '6px 8px' }}
                onClick={onSetAssistant}
                disabled={!isOnline}
                title="Gán Google Gemini làm mặc định hệ thống & Đóng băng YOYO Voice"
              >
                1. Cấu hình Lõi Hệ Thống
              </button>
              <button
                className="btn-tool"
                style={{ justifyContent: 'center', fontSize: '11px', padding: '6px 8px' }}
                onClick={onInstallGestureSearch}
                disabled={!isOnline}
                title="Cài đặt và cấp quyền hiển thị cho Gesture Search (Thanh vuốt gọi Gemini)"
              >
                2. Cài Gesture Search
              </button>
              <button
                className="btn-tool"
                style={{ justifyContent: 'center', fontSize: '11px', padding: '6px 8px' }}
                onClick={onInstallVxMAssistant}
                disabled={!isOnline}
                title="Cài đặt và cấp quyền ghi âm ngầm cho Trợ Lý VXM (Nhận diện Hey Google)"
              >
                3. Cài Trợ Lý VXM
              </button>
            </div>
          </div>
        </div>

        {/* Google Play Services & Play Store Box */}
        <div className="specs-card" style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid rgba(52, 211, 153, 0.35)', background: 'linear-gradient(145deg, rgba(6, 78, 59, 0.25), rgba(15, 23, 42, 0.6))' }}>
          <div>
            <div className="specs-header-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="svg-icon" style={{ color: '#34d399' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                </span>
                <span style={{ fontWeight: 600, fontSize: '14px', color: '#f8fafc' }}>
                  Kích Hoạt Dịch Vụ Google (GMS) & Tự Động Cài CH Play Từ APKMirror
                </span>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <span style={{ fontSize: '11px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '2px 8px', borderRadius: '4px' }}>
                  Auto APKMirror Scraper
                </span>
                <span style={{ fontSize: '11px', background: 'rgba(52, 211, 153, 0.15)', color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.3)', padding: '2px 8px', borderRadius: '4px' }}>
                  Chuẩn {device?.soc || 'ARM64'} / Android {device?.android_version || '16'}
                </span>
              </div>
            </div>
            
            <p style={{ fontSize: '12px', color: 'var(--text-dim)', margin: '8px 0 12px 0', lineHeight: '1.6' }}>
              Hệ thống MagicOS đã tích hợp sẵn khung GMS/GSF nhưng mặc định bị khóa ngầm.
              <br />
              <b>Cơ chế Tự Động 100%:</b> Công cụ tự động kiểm tra phần cứng thiết bị (CPU ABI, phiên bản Android & màn hình), truy cập nguồn chính thức <b>APKMirror Google Play Store</b> để cào lấy phiên bản mới nhất tương thích tuyệt đối, tải về máy với tiến trình trực tiếp và cài đặt hoàn tất qua ADB.
            </p>

            {/* Custom URL Input (Optional) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                  URL APK tùy chọn (Mặc định để trống để công cụ <b>tự động cào bản mới nhất từ APKMirror</b>):
                </label>
                <a
                  href="https://www.apkmirror.com/apk/google-inc/google-play-store/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: '11px', color: '#38bdf8', textDecoration: 'none' }}
                >
                  Trang chủ APKMirror CH Play ↗
                </a>
              </div>
              <input
                type="text"
                placeholder="Để trống = Tự động cào link APK mới nhất từ APKMirror theo đúng chip máy rồi tải & cài đặt"
                value={customPlayStoreUrl}
                onChange={(e) => setCustomPlayStoreUrl(e.target.value)}
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  padding: '8px 10px',
                  fontSize: '12px',
                  color: '#fff',
                  width: '100%',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Master 1-Click Button */}
            <button
              className="btn-tool success"
              style={{ width: '100%', justifyContent: 'center', padding: '10px', fontSize: '13px', fontWeight: 600 }}
              onClick={() => onSetupFullGoogleEcosystem(customPlayStoreUrl)}
              disabled={!isOnline}
            >
              <span className="svg-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
              </span>
              <span>TỰ ĐỘNG BẬT GMS, LẤY LINK APKMIRROR, TẢI VỀ & CÀI ĐẶT (1-CLICK)</span>
            </button>

            {/* Individual actions */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
              <button
                className="btn-tool"
                style={{ justifyContent: 'center', fontSize: '11px', padding: '6px 8px' }}
                onClick={onEnableGoogleServices}
                disabled={!isOnline}
                title="Bật công tắc Google Services và cấp quyền Whitelist pin cho GMS/GSF"
              >
                1. Bật Dịch Vụ Google (GMS Core)
              </button>
              <button
                className="btn-tool"
                style={{ justifyContent: 'center', fontSize: '11px', padding: '6px 8px' }}
                onClick={() => onInstallPlayStore(customPlayStoreUrl)}
                disabled={!isOnline}
                title="Tự động cào link từ APKMirror, tải về và cài đặt CH Play Store chuẩn máy"
              >
                2. Tự Tải & Cài CH Play Từ APKMirror
              </button>
            </div>
          </div>
        </div>

        {/* Native AOT Compiler (Step 6) */}
        <div className="specs-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="specs-header-title">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="svg-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                  </svg>
                </span>
                <span>Tăng Tốc Khởi Động App (Native AOT dex2oat)</span>
              </div>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-dim)', margin: '10px 0 14px 0', lineHeight: '1.5' }}>
              Tự động quét và dùng trình biên dịch `dex2oat` của Android để chuyển toàn bộ bytecode thành mã máy Native ARM64 cho toàn bộ ứng dụng thông dụng tại VN đang có trên máy (Zalo, Facebook, TikTok, toàn bộ app Ngân Hàng, Ví điện tử, Shopee, Grab, Via Browser, ChatGPT...) và xả 100GB cache.
            </p>
          </div>
          <button
            className="btn-tool"
            style={{ width: '100%', justifyContent: 'center', padding: '8px' }}
            onClick={onCompileApps}
            disabled={!isOnline}
          >
            <span className="svg-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              </svg>
            </span>
            <span>Biên Dịch Tăng Tốc Native AOT</span>
          </button>
        </div>

        {/* Reboot Control */}
        <div className="specs-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="specs-header-title">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="svg-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
                    <line x1="12" y1="2" x2="12" y2="12"></line>
                  </svg>
                </span>
                <span>Điều Khiển Nguồn Thiết Bị (Reboot Control)</span>
              </div>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-dim)', margin: '10px 0 14px 0', lineHeight: '1.5' }}>
              Khởi động lại điện thoại vào hệ điều hành, chế độ cứu hộ Recovery hoặc Fastboot Bootloader.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            <button
              className="btn-tool"
              style={{ justifyContent: 'center' }}
              onClick={() => onReboot('system')}
              disabled={!isOnline}
            >
              Khởi Động Lại
            </button>
            <button
              className="btn-tool"
              style={{ justifyContent: 'center' }}
              onClick={() => onReboot('bootloader')}
              disabled={!isOnline}
            >
              Fastboot
            </button>
            <button
              className="btn-tool"
              style={{ justifyContent: 'center' }}
              onClick={() => onReboot('recovery')}
              disabled={!isOnline}
            >
              Recovery
            </button>
          </div>
        </div>

        {/* Card 5: TP Theme Studio */}
        <div className="specs-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="specs-header-title">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="svg-icon" style={{ color: '#ec4899' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M14.31 8l5.74 9.94M9.69 8h11.48M7.38 12l5.74-9.94M9.69 16L3.95 6.06M14.31 16H2.83m13.79-4l-5.74 9.94"></path>
                  </svg>
                </span>
                <span>TP Theme Studio (Trích Xuất Theme VIP .hnt)</span>
              </div>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-dim)', margin: '10px 0 12px 0', lineHeight: '1.5' }}>
              Trích xuất 1-Click theme VIP đang dùng thử thành file <b>.hnt</b> vĩnh viễn, nạp vào thư mục hệ thống và sao lưu chia sẻ, không để lại rác trên điện thoại.
            </p>
            {quickExtractMsg && (
              <div style={{ padding: '8px 10px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '4px', fontSize: '11.5px', color: '#10b981', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>{quickExtractMsg}</span>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              className="btn-tool primary"
              style={{ width: '100%', justifyContent: 'center', padding: '9px 12px', fontWeight: 600 }}
              onClick={handleQuickExtract}
              disabled={!isOnline || quickExtracting}
            >
              <span className="svg-icon" style={{ display: 'inline-flex', marginRight: '6px' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
              </span>
              <span>{quickExtracting ? 'Đang trích xuất sang .hnt...' : 'Trích Xuất Nhanh Theme VIP Đang Thử'}</span>
            </button>
            <button
              type="button"
              className="btn-tool"
              style={{ width: '100%', justifyContent: 'center', padding: '7px', fontSize: '12px', color: '#ec4899' }}
              onClick={() => setIsThemeStudioOpen(true)}
              disabled={!isOnline}
            >
              <span className="svg-icon" style={{ display: 'inline-flex', marginRight: '6px' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                </svg>
              </span>
              <span>Mở Studio Quản Lý &amp; Nạp File .hnt</span>
            </button>
          </div>
        </div>

        {/* Card 6: Tinh Chỉnh Cài Đặt Ẩn MagicOS (Magic Tweaks) */}
        <div className="specs-card" style={{ gridColumn: '1 / -1', background: 'var(--panel)' }}>
          <div className="specs-header-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="svg-icon" style={{ color: '#f59e0b' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
              </span>
              <span>Tinh Chỉnh Cài Đặt Ẩn MagicOS (Magic Tweaks - Kế thừa từ HonorHook)</span>
            </div>
            {rootStatus?.has_root && (
              <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
                <span>Thiết bị Đã Root {rootStatus?.has_lsposed ? '(Có LSPosed)' : ''}</span>
              </span>
            )}
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-dim)', margin: '8px 0 14px 0', lineHeight: '1.5' }}>
            Can thiệp trực tiếp vào bảng cơ sở dữ liệu hệ thống (Settings Secure/System) của MagicOS qua ADB. <b>100% không cần Root, bền vững sau khi khởi động lại</b>.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px', marginBottom: '14px' }}>
            {/* Tweak 1: SuperCharge Turbo */}
            <div style={{ padding: '10px 12px', background: 'var(--panel-alt)', borderRadius: '6px', border: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '12.5px', color: 'var(--text-bright)' }}>Siêu Sạc Nhanh Khi Sáng Màn Hình</div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Giữ công suất sạc Turbo tối đa lúc đang sử dụng</div>
              </div>
              <button
                className={`btn-tool ${magicTweaks?.charge_turbo_switch?.enabled ? 'primary' : ''}`}
                style={{ fontSize: '11px', padding: '4px 10px', minWidth: '60px', justifyContent: 'center' }}
                onClick={() => handleToggleTweak('secure', 'charge_turbo_switch', magicTweaks?.charge_turbo_switch?.value, '1', '0')}
                disabled={!isOnline || loadingTweakKey === 'charge_turbo_switch'}
              >
                {magicTweaks?.charge_turbo_switch?.enabled ? 'BẬT' : 'TẮT'}
              </button>
            </div>

            {/* Tweak 2: Infinite Bluetooth Volume */}
            <div style={{ padding: '10px 12px', background: 'var(--panel-alt)', borderRadius: '6px', border: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '12.5px', color: 'var(--text-bright)' }}>Âm Lượng Bluetooth Vô Cực</div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Phá vỡ trần giới hạn âm lượng tai nghe Bluetooth</div>
              </div>
              <button
                className={`btn-tool ${magicTweaks?.infinite_volume_music_bt_a2dp?.enabled ? 'primary' : ''}`}
                style={{ fontSize: '11px', padding: '4px 10px', minWidth: '60px', justifyContent: 'center' }}
                onClick={() => handleToggleTweak('secure', 'infinite_volume_music_bt_a2dp', magicTweaks?.infinite_volume_music_bt_a2dp?.value, '1', '0')}
                disabled={!isOnline || loadingTweakKey === 'infinite_volume_music_bt_a2dp'}
              >
                {magicTweaks?.infinite_volume_music_bt_a2dp?.enabled ? 'BẬT' : 'TẮT'}
              </button>
            </div>

            {/* Tweak 3: Lock Max Refresh Rate */}
            <div style={{ padding: '10px 12px', background: 'var(--panel-alt)', borderRadius: '6px', border: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '12.5px', color: 'var(--text-bright)' }}>Khóa Cứng Tần Số Quét Không Tụt</div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Chống tự hạ Hz khi màn hình tĩnh, giữ mượt 120Hz</div>
              </div>
              <button
                className={`btn-tool ${magicTweaks?.reduce_refresh_rate_enabled?.enabled ? 'primary' : ''}`}
                style={{ fontSize: '11px', padding: '4px 10px', minWidth: '60px', justifyContent: 'center' }}
                onClick={() => handleToggleTweak('secure', 'reduce_refresh_rate_enabled', magicTweaks?.reduce_refresh_rate_enabled?.value, '0', '1')}
                disabled={!isOnline || loadingTweakKey === 'reduce_refresh_rate_enabled'}
              >
                {magicTweaks?.reduce_refresh_rate_enabled?.enabled ? 'KHÓA' : 'TỰ ĐỘNG'}
              </button>
            </div>

            {/* Tweak 4: Tianshan Display */}
            <div style={{ padding: '10px 12px', background: 'var(--panel-alt)', borderRadius: '6px', border: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '12.5px', color: 'var(--text-bright)' }}>Hiển Thị Thiên Sơn (Tianshan)</div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Kích hoạt thuật toán hiển thị Oasis/Tianshan cao cấp</div>
              </div>
              <button
                className={`btn-tool ${magicTweaks?.hn_tianshan_switch?.enabled ? 'primary' : ''}`}
                style={{ fontSize: '11px', padding: '4px 10px', minWidth: '60px', justifyContent: 'center' }}
                onClick={() => handleToggleTweak('secure', 'hn_tianshan_switch', magicTweaks?.hn_tianshan_switch?.value, '1', '0')}
                disabled={!isOnline || loadingTweakKey === 'hn_tianshan_switch'}
              >
                {magicTweaks?.hn_tianshan_switch?.enabled ? 'BẬT' : 'TẮT'}
              </button>
            </div>

            {/* Tweak 5: SDR to HDR */}
            <div style={{ padding: '10px 12px', background: 'var(--panel-alt)', borderRadius: '6px', border: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '12.5px', color: 'var(--text-bright)' }}>Nâng Cấp SDR Sang HDR</div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Tự động tăng cường độ sáng và tương phản HDR</div>
              </div>
              <button
                className={`btn-tool ${magicTweaks?.hn_sdr2hdr_switch?.enabled ? 'primary' : ''}`}
                style={{ fontSize: '11px', padding: '4px 10px', minWidth: '60px', justifyContent: 'center' }}
                onClick={() => handleToggleTweak('secure', 'hn_sdr2hdr_switch', magicTweaks?.hn_sdr2hdr_switch?.value, '1', '0')}
                disabled={!isOnline || loadingTweakKey === 'hn_sdr2hdr_switch'}
              >
                {magicTweaks?.hn_sdr2hdr_switch?.enabled ? 'BẬT' : 'TẮT'}
              </button>
            </div>

            {/* Tweak 6: Knuckle Gesture */}
            <div style={{ padding: '10px 12px', background: 'var(--panel-alt)', borderRadius: '6px', border: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '12.5px', color: 'var(--text-bright)' }}>Cử Chỉ Khớp Ngón Tay (Knuckle)</div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Vẽ chữ bằng khớp ngón tay để mở nhanh ứng dụng</div>
              </div>
              <button
                className={`btn-tool ${magicTweaks?.fingersense_letters_enabled?.enabled ? 'primary' : ''}`}
                style={{ fontSize: '11px', padding: '4px 10px', minWidth: '60px', justifyContent: 'center' }}
                onClick={() => handleToggleTweak('secure', 'fingersense_letters_enabled', magicTweaks?.fingersense_letters_enabled?.value, '1', '0')}
                disabled={!isOnline || loadingTweakKey === 'fingersense_letters_enabled'}
              >
                {magicTweaks?.fingersense_letters_enabled?.enabled ? 'BẬT' : 'TẮT'}
              </button>
            </div>

            {/* Tweak 7: Fingerprint Slide */}
            <div style={{ padding: '10px 12px', background: 'var(--panel-alt)', borderRadius: '6px', border: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '12.5px', color: 'var(--text-bright)' }}>Trượt Vân Tay Xem Thông Báo</div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Vuốt lên/xuống tại cảm biến vân tay để kéo bảng tin</div>
              </div>
              <button
                className={`btn-tool ${magicTweaks?.fingerprint_slide_switch?.enabled ? 'primary' : ''}`}
                style={{ fontSize: '11px', padding: '4px 10px', minWidth: '60px', justifyContent: 'center' }}
                onClick={() => handleToggleTweak('secure', 'fingerprint_slide_switch', magicTweaks?.fingerprint_slide_switch?.value, '1', '0')}
                disabled={!isOnline || loadingTweakKey === 'fingerprint_slide_switch'}
              >
                {magicTweaks?.fingerprint_slide_switch?.enabled ? 'BẬT' : 'TẮT'}
              </button>
            </div>

            {/* Tweak 8: Network Speed */}
            <div style={{ padding: '10px 12px', background: 'var(--panel-alt)', borderRadius: '6px', border: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '12.5px', color: 'var(--text-bright)' }}>Hiện Tốc Độ Mạng Thời Gian Thực</div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Hiển thị tốc độ download KB/s trên thanh trạng thái</div>
              </div>
              <button
                className={`btn-tool ${magicTweaks?.show_network_speed_enabled?.enabled ? 'primary' : ''}`}
                style={{ fontSize: '11px', padding: '4px 10px', minWidth: '60px', justifyContent: 'center' }}
                onClick={() => handleToggleTweak('system', 'show_network_speed_enabled', magicTweaks?.show_network_speed_enabled?.value, '1', '0')}
                disabled={!isOnline || loadingTweakKey === 'show_network_speed_enabled'}
              >
                {magicTweaks?.show_network_speed_enabled?.enabled ? 'BẬT' : 'TẮT'}
              </button>
            </div>
          </div>

          {/* Marketing 11 Keys 1-Click Action */}
          <div style={{ padding: '12px 14px', background: 'var(--panel-alt)', borderRadius: '6px', border: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-bright)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="svg-icon" style={{ color: '#38bdf8' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                </span>
                <span>Bộ 11 Khóa Dập Tắt Quảng Cáo &amp; Thu Thập Vị Trí Ngầm MagicOS</span>
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-dim)', marginTop: '2px' }}>
                Khóa triệt để: Quảng cáo hệ thống, Tin nhắn thông minh, Push cá nhân hóa, Tin rác HiBoard, Báo cáo vị trí ngầm.
              </div>
            </div>
            <button
              className={`btn-tool ${magicTweaks?.marketing_all_disabled?.enabled ? '' : 'primary'}`}
              style={{ fontWeight: 600, padding: '7px 14px' }}
              onClick={handleToggleMarketing}
              disabled={!isOnline || loadingTweakKey === 'marketing'}
            >
              {magicTweaks?.marketing_all_disabled?.enabled ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span>ĐÃ TẮT SẠCH 11 KHÓA (Bấm để khôi phục)</span>
                </span>
              ) : (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
                  </svg>
                  <span>1-Click Dập Tắt Sạch 11 Khóa</span>
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Theme Studio Modal */}
      <ThemeStudioModal
        isOpen={isThemeStudioOpen}
        onClose={() => setIsThemeStudioOpen(false)}
        device={device}
      />

      {/* Screenshot Preview Modal */}
      {screenshotResult && (
        <div className="modal-backdrop" onClick={() => setScreenshotResult(null)}>
          <div className="screenshot-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="specs-header-title">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="svg-icon" style={{ color: '#06b6d4' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                </span>
                <span>Ảnh Chụp Màn Hình Điện Thoại (Lossless)</span>
              </div>
              <button
                type="button"
                className="btn-tool"
                style={{ padding: '4px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={() => setScreenshotResult(null)}
                title="Đóng"
              >
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
              <div style={{ maxHeight: '420px', overflow: 'hidden', borderRadius: '8px', border: '1px solid var(--border-color)', background: '#000' }}>
                <img
                  src={screenshotResult.url}
                  alt={screenshotResult.filename}
                  style={{ maxHeight: '420px', maxWidth: '100%', objectFit: 'contain', display: 'block' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', width: '100%', justifyContent: 'flex-end' }}>
                <a
                  href={screenshotResult.url}
                  download={screenshotResult.filename}
                  className="btn-tool primary"
                  style={{ textDecoration: 'none' }}
                >
                  <span className="svg-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                  </span>
                  <span>Tải Ảnh Về PC ({screenshotResult.filename})</span>
                </a>
                <button
                  type="button"
                  className="btn-tool"
                  onClick={() => setScreenshotResult(null)}
                >
                  <span>Đóng</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Screen Recording MP4 Result Modal */}
      {recordingResult && (
        <div className="modal-backdrop" onClick={() => setRecordingResult(null)}>
          <div className="screenshot-modal-card" onClick={(e) => e.stopPropagation()} style={{ width: '560px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--border-color)', background: 'var(--panel-header)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="svg-icon" style={{ color: '#ef4444' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="23 7 16 12 23 17 23 7"></polygon>
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                  </svg>
                </span>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--text-bright)' }}>
                  Video Quay Màn Hình Điện Thoại ({recordingResult.size_mb} MB)
                </h3>
              </div>
              <button
                type="button"
                className="btn-tool"
                style={{ padding: '4px 8px', fontSize: '11px' }}
                onClick={() => setRecordingResult(null)}
              >
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
              <div style={{ maxHeight: '420px', width: '100%', overflow: 'hidden', borderRadius: '8px', border: '1px solid var(--border-color)', background: '#000' }}>
                <video
                  src={recordingResult.url}
                  controls
                  autoPlay
                  style={{ maxHeight: '420px', width: '100%', objectFit: 'contain', display: 'block' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', width: '100%', justifyContent: 'flex-end' }}>
                <a
                  href={recordingResult.url}
                  download={recordingResult.filename}
                  className="btn-tool primary"
                  style={{ textDecoration: 'none' }}
                >
                  <span className="svg-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                  </span>
                  <span>Tải Video MP4 ({recordingResult.filename})</span>
                </a>
                <button
                  type="button"
                  className="btn-tool"
                  onClick={() => setRecordingResult(null)}
                >
                  <span>Đóng</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
