import React, { useState, useEffect, useMemo, useRef } from 'react';
import { adbService } from '../services/adbService';
import ThemeStudioModal from './ThemeStudioModal';

// Detailed definitions for the 11 system marketing & telemetry keys
const TELEMETRY_DEFINITIONS = [
  {
    key: 'state_of_ads_switch',
    title: 'Quảng Cáo Thương Mại Hóa & Banner Hệ Thống',
    category: 'ads',
    categoryLabel: 'Quảng Cáo',
    scope: 'Settings Secure',
    desc: 'Chặn toàn bộ quảng cáo hiển thị trong các ứng dụng gốc của MagicOS và biểu ngữ tài trợ đẩy từ máy chủ tiếp thị Honor.',
    impact: 'Triệt tiêu hoàn toàn banner quảng cáo rác trong ứng dụng hệ thống.',
    recommended: true,
  },
  {
    key: 'intelligent_message_enabled',
    title: 'Phân Tích Nội Dung Tin Nhắn Thông Minh',
    category: 'privacy',
    categoryLabel: 'Riêng Tư',
    scope: 'Settings Secure',
    desc: 'Tắt engine AI tự động đọc và phân tích nội dung tin nhắn SMS / mã xác thực ngân hàng để phỏng đoán thói quen mua sắm.',
    impact: 'Bảo vệ an toàn mật khẩu OTP ngân hàng và tin nhắn cá nhân.',
    recommended: true,
  },
  {
    key: 'personalized_push_state',
    title: 'Thông Báo Đẩy Tiếp Thị Cá Nhân Hóa',
    category: 'ads',
    categoryLabel: 'Quảng Cáo',
    scope: 'Settings Secure',
    desc: 'Chặn máy chủ Honor gửi các thông báo tiếp thị, khuyến mãi và thông báo tài trợ lên thanh thông báo Notification.',
    impact: 'Thanh thông báo sạch sẽ, không bị quấy rầy bởi tin nhắn tiếp thị ngầm.',
    recommended: true,
  },
  {
    key: 'personalized_recommendation',
    title: 'Hồ Sơ Hành Vi & Đề Xuất Cá Nhân Hóa',
    category: 'privacy',
    categoryLabel: 'Riêng Tư',
    scope: 'Settings Secure',
    desc: 'Ngăn thuật toán máy học theo dõi tần suất mở ứng dụng và hành vi sử dụng máy để lập hồ sơ thị hiếu người dùng.',
    impact: 'Ngăn chặn việc định danh và lập hồ sơ theo dõi người dùng ngầm.',
    recommended: true,
  },
  {
    key: 'hiboard.recommend.status',
    title: 'Đề Xuất Màn Hình Âm Phủ (Honor HiBoard)',
    category: 'ui',
    categoryLabel: 'Giao Diện',
    scope: 'Settings Secure',
    desc: 'Xóa sạch các thẻ tin tức giật gân, ứng dụng gợi ý cài đặt và quảng cáo tài trợ trên trang màn hình -1 (HiBoard).',
    impact: 'Màn hình -1 trở nên gọn gàng, giảm tiêu tốn dữ liệu di động ngầm.',
    recommended: true,
  },
  {
    key: 'location_honor_ads',
    title: 'Định Vị Quảng Cáo Theo Tọa Độ GPS',
    category: 'location',
    categoryLabel: 'Vị Trí',
    scope: 'Settings Secure',
    desc: 'Chặn dịch vụ Honor Ads truy cập tọa độ GPS thời gian thực để nhắm mục tiêu phân phối quảng cáo theo khu vực.',
    impact: 'Tiết kiệm pin GPS và bảo mật tuyệt đối vị trí di chuyển thực tế.',
    recommended: true,
  },
  {
    key: 'settings_ai_recommend',
    title: 'Gợi Ý Dịch Vụ AI Trong Mục Cài Đặt',
    category: 'ui',
    categoryLabel: 'Giao Diện',
    scope: 'Settings Secure',
    desc: 'Tắt các banner quảng cáo dịch vụ trả phí và ứng dụng đối tác hiển thị ở đầu trang Cài Đặt (Settings).',
    impact: 'Giao diện Cài đặt gốc trở nên nguyên bản, chuẩn phong cách thuần khiết.',
    recommended: true,
  },
  {
    key: 'intelligent_recommendation_toggle',
    title: 'Đề Xuất Thông Minh Toàn Hệ Thống',
    category: 'ui',
    categoryLabel: 'Giao Diện',
    scope: 'Settings Secure',
    desc: 'Vô hiệu hóa tính năng tự động gợi ý ứng dụng cài thêm trong thư mục app và màn hình chính MagicOS.',
    impact: 'Không còn xuất hiện các icon app rác gợi ý tải về.',
    recommended: true,
  },
  {
    key: 'search.recommend.letter.switch',
    title: 'Từ Khóa Tìm Kiếm Tài Trợ (Honor Search)',
    category: 'ads',
    categoryLabel: 'Quảng Cáo',
    scope: 'Settings Secure',
    desc: 'Chặn từ khóa gợi ý quảng cáo và danh sách trending thương mại trong thanh tìm kiếm Honor Search / Petal Search.',
    impact: 'Thanh tìm kiếm chỉ hiển thị ứng dụng và tệp tin thực tế trên máy.',
    recommended: true,
  },
  {
    key: 'cloud_maintenance',
    title: 'Báo Cáo Chẩn Đoán Tự Động Lên Cloud',
    category: 'telemetry',
    categoryLabel: 'Telemetry',
    scope: 'Settings Secure',
    desc: 'Ngắt tiến trình ngầm tự động gom dữ liệu crash dump, log hoạt động và phần cứng gửi về máy chủ Honor Cloud.',
    impact: 'Giảm tiêu hao pin và lưu lượng mạng chạy nền liên tục.',
    recommended: true,
  },
  {
    key: 'location_report_switch',
    title: 'Báo Cáo Vị Trí Định Kỳ Hệ Thống',
    category: 'location',
    categoryLabel: 'Vị Trí',
    scope: 'Settings Secure',
    desc: 'Ngừng gửi báo cáo vị trí và thông số trạm phát sóng di động định kỳ về máy chủ dịch vụ nền tảng.',
    impact: 'Bảo mật quyền riêng tư vị trí và tối ưu hóa thời lượng pin chờ.',
    recommended: true,
  },
];

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
  // CRM / ERP Layout Modules: 'all' | 'tweaks' | 'theme' | 'google' | 'system'
  const [activeModule, setActiveModule] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Scrcpy Options
  const [turnOffScreen, setTurnOffScreen] = useState(true);
  const [stayAwake, setStayAwake] = useState(true);
  const [customPlayStoreUrl, setCustomPlayStoreUrl] = useState('');
  const [isSettingWireless, setIsSettingWireless] = useState(false);
  const [isCapturingScreenshot, setIsCapturingScreenshot] = useState(false);
  const [screenshotResult, setScreenshotResult] = useState(null);

  // Theme Studio & Magic Tweaks State
  const [isThemeStudioOpen, setIsThemeStudioOpen] = useState(false);
  const [magicTweaks, setMagicTweaks] = useState({});
  const [loadingTweakKey, setLoadingTweakKey] = useState(null);
  const [rootStatus, setRootStatus] = useState(null);
  const [quickExtracting, setQuickExtracting] = useState(false);
  const [quickExtractMsg, setQuickExtractMsg] = useState(null);

  // Telemetry Checklist Selection State
  const [selectedTelemetryKeys, setSelectedTelemetryKeys] = useState(
    () => new Set(TELEMETRY_DEFINITIONS.map((d) => d.key))
  );
  const [telemetryFilterCat, setTelemetryFilterCat] = useState('all');
  const [isApplyingTelemetry, setIsApplyingTelemetry] = useState(false);

  const isWeb = adbService.mode === 'webusb';

  // Screen recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [recordingResult, setRecordingResult] = useState(null);
  const recTimerRef = useRef(null);

  const isOnline = device && device.connected;

  useEffect(() => {
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

  // Telemetry: Toggle individual key
  const handleToggleSingleTelemetry = async (key) => {
    setLoadingTweakKey(key);
    try {
      const currentVal = magicTweaks?.marketing_all_disabled?.details?.[key] || '1';
      const nextVal = currentVal === '0' ? '1' : '0';
      await adbService.applyMagicTweak('secure', key, nextVal);
      await loadMagicTweaks();
    } finally {
      setLoadingTweakKey(null);
    }
  };

  // Telemetry: Toggle batch selection checkbox
  const handleToggleSelectTelemetry = (key) => {
    setSelectedTelemetryKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Telemetry: Select / Deselect All
  const handleSelectAllTelemetry = () => {
    if (selectedTelemetryKeys.size === TELEMETRY_DEFINITIONS.length) {
      setSelectedTelemetryKeys(new Set());
    } else {
      setSelectedTelemetryKeys(new Set(TELEMETRY_DEFINITIONS.map((d) => d.key)));
    }
  };

  // Telemetry: Apply Batch Action (Turn Off or Restore)
  const handleApplySelectedTelemetry = async (turnOff = true) => {
    if (selectedTelemetryKeys.size === 0) {
      alert('Vui lòng chọn ít nhất 1 khóa telemetry để áp dụng.');
      return;
    }
    setIsApplyingTelemetry(true);
    setLoadingTweakKey('telemetry-batch');
    try {
      const keysArray = Array.from(selectedTelemetryKeys);
      await adbService.applyAllMarketingOff(turnOff, keysArray);
      await loadMagicTweaks();
    } finally {
      setIsApplyingTelemetry(false);
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

  // Counts for KPI strip
  const tweakCounts = useMemo(() => {
    const keys = [
      'charge_turbo_switch',
      'infinite_volume_music_bt_a2dp',
      'reduce_refresh_rate_enabled',
      'hn_tianshan_switch',
      'hn_sdr2hdr_switch',
      'fingersense_letters_enabled',
      'fingerprint_slide_switch',
      'show_network_speed_enabled',
    ];
    let enabledCount = 0;
    keys.forEach((k) => {
      if (magicTweaks?.[k]?.enabled) enabledCount++;
    });
    return { enabled: enabledCount, total: keys.length };
  }, [magicTweaks]);

  const telemetryBlockedCount = useMemo(() => {
    const details = magicTweaks?.marketing_all_disabled?.details || {};
    let count = 0;
    TELEMETRY_DEFINITIONS.forEach((d) => {
      const val = details[d.key];
      if (val === '0') count++;
    });
    return count;
  }, [magicTweaks]);

  // Filtered Telemetry Definitions
  const filteredTelemetry = useMemo(() => {
    return TELEMETRY_DEFINITIONS.filter((item) => {
      const matchCat = telemetryFilterCat === 'all' || item.category === telemetryFilterCat;
      const matchSearch =
        !searchQuery.trim() ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.desc.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [telemetryFilterCat, searchQuery]);

  return (
    <div className="tab-pane active" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* 1. Top CRM/ERP Executive Metric Ribbon */}
      <div className="magicos-metric-grid" style={{ marginBottom: '4px' }}>
        <div className="metric-capsule">
          <div className="metric-capsule-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
          </div>
          <div className="metric-capsule-content">
            <span className="metric-capsule-label">Cài Đặt Ẩn MagicOS</span>
            <span className="metric-capsule-val" style={{ color: '#f59e0b' }}>
              {isOnline ? `${tweakCounts.enabled}/${tweakCounts.total} Đang Bật` : '--/8 Đang Bật'}
            </span>
            <span className="metric-capsule-sub">SuperCharge Turbo, 120Hz, HDR</span>
          </div>
        </div>

        <div className="metric-capsule">
          <div className="metric-capsule-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              <polyline points="9 12 11 14 15 10"></polyline>
            </svg>
          </div>
          <div className="metric-capsule-content">
            <span className="metric-capsule-label">Chặn Telemetry & Tiếp Thị</span>
            <span className="metric-capsule-val" style={{ color: '#10b981' }}>
              {isOnline ? `${telemetryBlockedCount}/11 Đã Chặn` : '--/11 Đã Chặn'}
            </span>
            <span className="metric-capsule-sub">Minh bạch 100% từng khóa hệ thống</span>
          </div>
        </div>

        <div className="metric-capsule">
          <div className="metric-capsule-icon" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          </div>
          <div className="metric-capsule-content">
            <span className="metric-capsule-label">Hệ Sinh Thái Google</span>
            <span className="metric-capsule-val" style={{ color: '#38bdf8' }}>
              GMS &amp; Play Store
            </span>
            <span className="metric-capsule-sub">Tự động APKMirror &amp; Gemini Floaty</span>
          </div>
        </div>

        <div className="metric-capsule">
          <div className="metric-capsule-icon" style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#ec4899' }}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M14.31 8l5.74 9.94M9.69 8h11.48M7.38 12l5.74-9.94M9.69 16L3.95 6.06M14.31 16H2.83m13.79-4l-5.74 9.94"></path>
            </svg>
          </div>
          <div className="metric-capsule-content">
            <span className="metric-capsule-label">TP Theme Studio VIP</span>
            <span className="metric-capsule-val" style={{ color: '#ec4899' }}>
              Trích Xuất .hnt
            </span>
            <span className="metric-capsule-sub">Nạp vĩnh viễn, không lưu rác máy</span>
          </div>
        </div>
      </div>

      {/* 2. CRM / ERP Category Sub-Navbar & Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div className="crm-subnav" style={{ margin: 0 }}>
          <button
            type="button"
            className={`crm-subnav-btn ${activeModule === 'all' ? 'active' : ''}`}
            onClick={() => setActiveModule('all')}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            <span>Tất Cả Tiện Ích</span>
          </button>

          <button
            type="button"
            className={`crm-subnav-btn ${activeModule === 'tweaks' ? 'active' : ''}`}
            onClick={() => setActiveModule('tweaks')}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
            <span>Cài Đặt Ẩn &amp; Telemetry</span>
            <span className="crm-subnav-badge">19 Mục</span>
          </button>

          <button
            type="button"
            className={`crm-subnav-btn ${activeModule === 'theme' ? 'active' : ''}`}
            onClick={() => setActiveModule('theme')}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M14.31 8l5.74 9.94M9.69 8h11.48M7.38 12l5.74-9.94M9.69 16L3.95 6.06M14.31 16H2.83m13.79-4l-5.74 9.94"></path>
            </svg>
            <span>TP Theme Studio VIP</span>
            <span className="crm-subnav-badge">.hnt</span>
          </button>

          <button
            type="button"
            className={`crm-subnav-btn ${activeModule === 'google' ? 'active' : ''}`}
            onClick={() => setActiveModule('google')}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
              <line x1="12" y1="19" x2="12" y2="22"></line>
            </svg>
            <span>Google GMS &amp; Trợ Lý AI</span>
          </button>

          <button
            type="button"
            className={`crm-subnav-btn ${activeModule === 'system' ? 'active' : ''}`}
            onClick={() => setActiveModule('system')}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M13 3H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-3"></path>
              <polyline points="8 21 12 17 16 21"></polyline>
              <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
            <span>Hiệu Năng &amp; Điều Khiển</span>
          </button>
        </div>

        {/* Quick Filter Search */}
        <div style={{ position: 'relative', width: '280px' }}>
          <input
            type="text"
            className="tool-input"
            placeholder="Tìm kiếm công cụ, khóa telemetry..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', paddingLeft: '32px' }}
          />
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="#94a3b8"
            strokeWidth="2"
            style={{ position: 'absolute', left: '10px', top: '10px', pointerEvents: 'none' }}
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', right: '8px', top: '7px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* =========================================================================
          MODULE 1: MAGICOS TWEAKS & DETAILED 11 TELEMETRY KEYS
          ========================================================================= */}
      {(activeModule === 'all' || activeModule === 'tweaks') && (
        <>
          {/* Card: MagicOS Hidden Tweaks */}
          <div
            className="specs-card"
            style={{
              background: 'radial-gradient(circle at top left, rgba(245, 158, 11, 0.06), transparent 70%), var(--panel-card)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
            }}
          >
            <div className="specs-header-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="svg-icon" style={{ color: '#f59e0b' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                  </svg>
                </span>
                <span style={{ fontWeight: 600, fontSize: '13.5px' }}>
                  Tinh Chỉnh Cài Đặt Ẩn MagicOS (Magic Tweaks)
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {rootStatus?.has_root && (
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    </svg>
                    <span>Thiết bị Đã Root {rootStatus?.has_lsposed ? '(Có LSPosed)' : ''}</span>
                  </span>
                )}
                <span className="badge-tag tag-neutral" style={{ fontSize: '10.5px' }}>
                  Không Cần Root • Bền Vững ADB
                </span>
              </div>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-dim)', margin: '4px 0 14px 0', lineHeight: '1.5' }}>
              Can thiệp trực tiếp vào bảng cơ sở dữ liệu hệ thống (Settings Secure/System) của MagicOS qua ADB. <b>100% không cần Root, bảo lưu vĩnh viễn sau khi khởi động lại máy</b>.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
              {/* Tweak 1: SuperCharge Turbo */}
              <div style={{ padding: '12px 14px', background: 'var(--panel-alt)', borderRadius: '10px', border: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '12.5px', color: 'var(--text-bright)' }}>Siêu Sạc Nhanh Khi Sáng Màn Hình</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Giữ công suất sạc Turbo tối đa lúc đang sử dụng</div>
                </div>
                <label className="magicos-switch" title={magicTweaks?.charge_turbo_switch?.enabled ? 'Nhấp để Tắt' : 'Nhấp để Bật'}>
                  <input
                    type="checkbox"
                    checked={!!magicTweaks?.charge_turbo_switch?.enabled}
                    onChange={() => handleToggleTweak('secure', 'charge_turbo_switch', magicTweaks?.charge_turbo_switch?.value, '1', '0')}
                    disabled={!isOnline || loadingTweakKey === 'charge_turbo_switch'}
                  />
                  <span className="magicos-slider"></span>
                </label>
              </div>

              {/* Tweak 2: Infinite Bluetooth Volume */}
              <div style={{ padding: '12px 14px', background: 'var(--panel-alt)', borderRadius: '10px', border: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '12.5px', color: 'var(--text-bright)' }}>Âm Lượng Bluetooth Vô Cực</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Phá vỡ trần giới hạn âm lượng tai nghe Bluetooth</div>
                </div>
                <label className="magicos-switch" title={magicTweaks?.infinite_volume_music_bt_a2dp?.enabled ? 'Nhấp để Tắt' : 'Nhấp để Bật'}>
                  <input
                    type="checkbox"
                    checked={!!magicTweaks?.infinite_volume_music_bt_a2dp?.enabled}
                    onChange={() => handleToggleTweak('secure', 'infinite_volume_music_bt_a2dp', magicTweaks?.infinite_volume_music_bt_a2dp?.value, '1', '0')}
                    disabled={!isOnline || loadingTweakKey === 'infinite_volume_music_bt_a2dp'}
                  />
                  <span className="magicos-slider"></span>
                </label>
              </div>

              {/* Tweak 3: Lock Max Refresh Rate */}
              <div style={{ padding: '12px 14px', background: 'var(--panel-alt)', borderRadius: '10px', border: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '12.5px', color: 'var(--text-bright)' }}>Khóa Cứng Tần Số Quét Không Tụt</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Chống tự hạ Hz khi màn hình tĩnh, giữ mượt 120Hz</div>
                </div>
                <label className="magicos-switch" title={magicTweaks?.reduce_refresh_rate_enabled?.enabled ? 'Nhấp để Tắt khóa' : 'Nhấp để Khóa 120Hz'}>
                  <input
                    type="checkbox"
                    checked={!!magicTweaks?.reduce_refresh_rate_enabled?.enabled}
                    onChange={() => handleToggleTweak('secure', 'reduce_refresh_rate_enabled', magicTweaks?.reduce_refresh_rate_enabled?.value, '0', '1')}
                    disabled={!isOnline || loadingTweakKey === 'reduce_refresh_rate_enabled'}
                  />
                  <span className="magicos-slider"></span>
                </label>
              </div>

              {/* Tweak 4: Tianshan Display */}
              <div style={{ padding: '12px 14px', background: 'var(--panel-alt)', borderRadius: '10px', border: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '12.5px', color: 'var(--text-bright)' }}>Hiển Thị Thiên Sơn (Tianshan)</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Kích hoạt thuật toán hiển thị Oasis/Tianshan cao cấp</div>
                </div>
                <label className="magicos-switch" title={magicTweaks?.hn_tianshan_switch?.enabled ? 'Nhấp để Tắt' : 'Nhấp để Bật'}>
                  <input
                    type="checkbox"
                    checked={!!magicTweaks?.hn_tianshan_switch?.enabled}
                    onChange={() => handleToggleTweak('secure', 'hn_tianshan_switch', magicTweaks?.hn_tianshan_switch?.value, '1', '0')}
                    disabled={!isOnline || loadingTweakKey === 'hn_tianshan_switch'}
                  />
                  <span className="magicos-slider"></span>
                </label>
              </div>

              {/* Tweak 5: SDR to HDR */}
              <div style={{ padding: '12px 14px', background: 'var(--panel-alt)', borderRadius: '10px', border: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '12.5px', color: 'var(--text-bright)' }}>Nâng Cấp SDR Sang HDR</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Tự động tăng cường độ sáng và tương phản HDR</div>
                </div>
                <label className="magicos-switch" title={magicTweaks?.hn_sdr2hdr_switch?.enabled ? 'Nhấp để Tắt' : 'Nhấp để Bật'}>
                  <input
                    type="checkbox"
                    checked={!!magicTweaks?.hn_sdr2hdr_switch?.enabled}
                    onChange={() => handleToggleTweak('secure', 'hn_sdr2hdr_switch', magicTweaks?.hn_sdr2hdr_switch?.value, '1', '0')}
                    disabled={!isOnline || loadingTweakKey === 'hn_sdr2hdr_switch'}
                  />
                  <span className="magicos-slider"></span>
                </label>
              </div>

              {/* Tweak 6: Knuckle Gesture */}
              <div style={{ padding: '12px 14px', background: 'var(--panel-alt)', borderRadius: '10px', border: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '12.5px', color: 'var(--text-bright)' }}>Cử Chỉ Khớp Ngón Tay (Knuckle)</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Vẽ chữ bằng khớp ngón tay để mở nhanh ứng dụng</div>
                </div>
                <label className="magicos-switch" title={magicTweaks?.fingersense_letters_enabled?.enabled ? 'Nhấp để Tắt' : 'Nhấp để Bật'}>
                  <input
                    type="checkbox"
                    checked={!!magicTweaks?.fingersense_letters_enabled?.enabled}
                    onChange={() => handleToggleTweak('secure', 'fingersense_letters_enabled', magicTweaks?.fingersense_letters_enabled?.value, '1', '0')}
                    disabled={!isOnline || loadingTweakKey === 'fingersense_letters_enabled'}
                  />
                  <span className="magicos-slider"></span>
                </label>
              </div>

              {/* Tweak 7: Fingerprint Slide */}
              <div style={{ padding: '12px 14px', background: 'var(--panel-alt)', borderRadius: '10px', border: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '12.5px', color: 'var(--text-bright)' }}>Trượt Vân Tay Xem Thông Báo</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Vuốt lên/xuống tại cảm biến vân tay để kéo bảng tin</div>
                </div>
                <label className="magicos-switch" title={magicTweaks?.fingerprint_slide_switch?.enabled ? 'Nhấp để Tắt' : 'Nhấp để Bật'}>
                  <input
                    type="checkbox"
                    checked={!!magicTweaks?.fingerprint_slide_switch?.enabled}
                    onChange={() => handleToggleTweak('secure', 'fingerprint_slide_switch', magicTweaks?.fingerprint_slide_switch?.value, '1', '0')}
                    disabled={!isOnline || loadingTweakKey === 'fingerprint_slide_switch'}
                  />
                  <span className="magicos-slider"></span>
                </label>
              </div>

              {/* Tweak 8: Network Speed */}
              <div style={{ padding: '12px 14px', background: 'var(--panel-alt)', borderRadius: '10px', border: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '12.5px', color: 'var(--text-bright)' }}>Hiện Tốc Độ Mạng Thời Gian Thực</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Hiển thị tốc độ download KB/s trên thanh trạng thái</div>
                </div>
                <label className="magicos-switch" title={magicTweaks?.show_network_speed_enabled?.enabled ? 'Nhấp để Tắt' : 'Nhấp để Bật'}>
                  <input
                    type="checkbox"
                    checked={!!magicTweaks?.show_network_speed_enabled?.enabled}
                    onChange={() => handleToggleTweak('system', 'show_network_speed_enabled', magicTweaks?.show_network_speed_enabled?.value, '1', '0')}
                    disabled={!isOnline || loadingTweakKey === 'show_network_speed_enabled'}
                  />
                  <span className="magicos-slider"></span>
                </label>
              </div>
            </div>
          </div>

          {/* Granular 11 Telemetry & Privacy Control Center */}
          <div
            className="specs-card"
            style={{
              background: 'radial-gradient(circle at top right, rgba(16, 185, 129, 0.08), transparent 70%), var(--panel-card)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
            }}
          >
            {/* Header */}
            <div className="specs-header-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="svg-icon" style={{ color: '#10b981' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    <polyline points="9 12 11 14 15 10"></polyline>
                  </svg>
                </span>
                <span style={{ fontWeight: 600, fontSize: '14px' }}>
                  Trung Tâm Quản Lý Quyền Riêng Tư &amp; Telemetry (11 Khóa Hệ Thống)
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="badge-tag tag-safe" style={{ fontSize: '11px' }}>
                  Đã chặn: {telemetryBlockedCount}/11 mục
                </span>
                <span className="badge-tag tag-neutral" style={{ fontSize: '11px' }}>
                  Đã chọn: {selectedTelemetryKeys.size}/11 mục
                </span>
              </div>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-dim)', margin: '4px 0 12px 0', lineHeight: '1.5' }}>
              Bảng điều khiển minh bạch từng luồng dữ liệu quảng cáo, theo dõi hành vi và telemetry gửi về máy chủ Honor. Bạn có thể <b>chọn từng mục riêng lẻ</b> để chặn hoặc khôi phục, giúp nắm rõ 100% mọi tác vụ trên máy.
            </p>

            {/* Batch Action Toolbar & Category Filters */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px',
                padding: '10px 14px',
                background: 'rgba(0, 0, 0, 0.25)',
                borderRadius: '8px',
                border: '1px solid var(--border-light)',
                marginBottom: '12px',
              }}
            >
              {/* Category Filter Pills */}
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className={`btn-tool ${telemetryFilterCat === 'all' ? 'primary' : ''}`}
                  style={{ fontSize: '11px', padding: '3px 8px' }}
                  onClick={() => setTelemetryFilterCat('all')}
                >
                  Tất Cả (11)
                </button>
                <button
                  type="button"
                  className={`btn-tool ${telemetryFilterCat === 'ads' ? 'primary' : ''}`}
                  style={{ fontSize: '11px', padding: '3px 8px' }}
                  onClick={() => setTelemetryFilterCat('ads')}
                >
                  Quảng Cáo (3)
                </button>
                <button
                  type="button"
                  className={`btn-tool ${telemetryFilterCat === 'privacy' ? 'primary' : ''}`}
                  style={{ fontSize: '11px', padding: '3px 8px' }}
                  onClick={() => setTelemetryFilterCat('privacy')}
                >
                  Riêng Tư (2)
                </button>
                <button
                  type="button"
                  className={`btn-tool ${telemetryFilterCat === 'ui' ? 'primary' : ''}`}
                  style={{ fontSize: '11px', padding: '3px 8px' }}
                  onClick={() => setTelemetryFilterCat('ui')}
                >
                  Giao Diện (3)
                </button>
                <button
                  type="button"
                  className={`btn-tool ${telemetryFilterCat === 'location' ? 'primary' : ''}`}
                  style={{ fontSize: '11px', padding: '3px 8px' }}
                  onClick={() => setTelemetryFilterCat('location')}
                >
                  Vị Trí GPS (2)
                </button>
                <button
                  type="button"
                  className={`btn-tool ${telemetryFilterCat === 'telemetry' ? 'primary' : ''}`}
                  style={{ fontSize: '11px', padding: '3px 8px' }}
                  onClick={() => setTelemetryFilterCat('telemetry')}
                >
                  Cloud Log (1)
                </button>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn-tool"
                  style={{ fontSize: '11px', padding: '4px 10px' }}
                  onClick={handleSelectAllTelemetry}
                >
                  {selectedTelemetryKeys.size === TELEMETRY_DEFINITIONS.length ? 'Bỏ Chọn Tất Cả' : 'Chọn Tất Cả'}
                </button>

                <button
                  type="button"
                  className="btn-tool success"
                  style={{ fontSize: '11.5px', padding: '5px 14px', fontWeight: 600 }}
                  onClick={() => handleApplySelectedTelemetry(true)}
                  disabled={!isOnline || isApplyingTelemetry || selectedTelemetryKeys.size === 0}
                  title="Ghi giá trị 0 vào các khóa được chọn để tắt hẳn telemetry"
                >
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '5px' }}>
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    <polyline points="9 12 11 14 15 10"></polyline>
                  </svg>
                  <span>Chặn {selectedTelemetryKeys.size} Khóa Đã Chọn (Giá Trị = 0)</span>
                </button>

                <button
                  type="button"
                  className="btn-tool"
                  style={{ fontSize: '11px', padding: '5px 10px' }}
                  onClick={() => handleApplySelectedTelemetry(false)}
                  disabled={!isOnline || isApplyingTelemetry || selectedTelemetryKeys.size === 0}
                  title="Khôi phục bật lại (giá trị 1) cho các mục được chọn"
                >
                  <span>Khôi Phục Bật Lại (= 1)</span>
                </button>
              </div>
            </div>

            {/* List of 11 Telemetry Keys with Detailed Explanations */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredTelemetry.map((item) => {
                const currentVal = magicTweaks?.marketing_all_disabled?.details?.[item.key];
                const isBlocked = currentVal === '0';
                const isSelected = selectedTelemetryKeys.has(item.key);

                return (
                  <div
                    key={item.key}
                    className={`telemetry-row-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleToggleSelectTelemetry(item.key)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Checkbox */}
                    <div style={{ paddingTop: '2px' }} onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelectTelemetry(item.key)}
                        style={{ cursor: 'pointer', width: '15px', height: '15px' }}
                      />
                    </div>

                    {/* Main Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '3px' }}>
                        <span style={{ fontWeight: 600, fontSize: '12.5px', color: 'var(--text-bright)' }}>
                          {item.title}
                        </span>
                        <code
                          style={{
                            fontSize: '10.5px',
                            background: 'rgba(0, 0, 0, 0.4)',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            color: '#38bdf8',
                            fontFamily: 'var(--font-mono)',
                          }}
                        >
                          {item.key}
                        </code>
                        <span className="badge-tag tag-neutral" style={{ fontSize: '10px' }}>
                          {item.categoryLabel}
                        </span>
                      </div>

                      {/* Explanation */}
                      <div style={{ fontSize: '11.5px', color: 'var(--text-dim)', lineHeight: '1.4', marginBottom: '4px' }}>
                        {item.desc}
                      </div>

                      {/* Practical Impact */}
                      <div style={{ fontSize: '11px', color: isBlocked ? '#10b981' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ opacity: 0.7 }}>Tác động:</span>
                        <span>{item.impact}</span>
                      </div>
                    </div>

                    {/* Status & Switch Controls */}
                    <div
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span
                        className={`badge-tag ${isBlocked ? 'tag-safe' : 'tag-warn'}`}
                        style={{ fontSize: '10.5px' }}
                      >
                        {isBlocked ? 'Đã Chặn (= 0)' : `Đang Mở (= ${currentVal || '1'})`}
                      </span>

                      <label className="magicos-switch" title={isBlocked ? 'Khóa đang tắt (Bảo vệ). Bấm để Bật lại.' : 'Khóa đang mở. Bấm để Chặn.'}>
                        <input
                          type="checkbox"
                          checked={!isBlocked}
                          onChange={() => handleToggleSingleTelemetry(item.key)}
                          disabled={!isOnline || loadingTweakKey === item.key}
                        />
                        <span className="magicos-slider"></span>
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* =========================================================================
          MODULE 2: TP THEME STUDIO VIP
          ========================================================================= */}
      {(activeModule === 'all' || activeModule === 'theme') && (
        <div
          className="specs-card"
          style={{
            border: '1px solid rgba(236, 72, 153, 0.35)',
            boxShadow: '0 8px 24px -4px rgba(236, 72, 153, 0.15)',
            background: 'radial-gradient(circle at top right, rgba(236, 72, 153, 0.08), transparent 70%), var(--panel-card)',
          }}
        >
          <div className="specs-header-title">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="svg-icon" style={{ color: '#ec4899' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M14.31 8l5.74 9.94M9.69 8h11.48M7.38 12l5.74-9.94M9.69 16L3.95 6.06M14.31 16H2.83m13.79-4l-5.74 9.94"></path>
                </svg>
              </span>
              <span style={{ fontWeight: 600, fontSize: '14px' }}>
                TP Theme Studio (Trình Quản Lý &amp; Trích Xuất Theme VIP .hnt)
              </span>
            </div>
            <span className="badge-tag tag-safe" style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#ec4899', borderColor: 'rgba(236, 72, 153, 0.3)' }}>
              VIP Studio
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', alignItems: 'center', margin: '8px 0 14px 0' }}>
            <div>
              <p style={{ fontSize: '12px', color: 'var(--text-dim)', lineHeight: '1.6', margin: 0 }}>
                Công nghệ trích xuất độc quyền: Trích xuất theme VIP đang dùng thử thành file chuẩn <b>.hnt (ZIP Deflate)</b>, làm sạch cờ trial, tự động nạp thẳng vào thư mục hệ thống app Chủ Đề và sao lưu ra thư mục công khai <code>/sdcard/Honor/Themes/</code>.
              </p>
              <div style={{ marginTop: '8px', fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Zero Junk: Tuyệt đối không để lại file rác tạm nào trên bộ nhớ máy.</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                className="btn-magicos-primary"
                style={{ background: 'linear-gradient(135deg, #ec4899 0%, #a855f7 100%)', boxShadow: '0 4px 16px rgba(236, 72, 153, 0.35)' }}
                onClick={handleQuickExtract}
                disabled={!isOnline || quickExtracting}
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
                <span>{quickExtracting ? 'Đang trích xuất sang .hnt...' : 'Trích Xuất Nhanh Theme VIP Đang Thử (1-Click)'}</span>
              </button>

              <button
                type="button"
                className="btn-tool"
                style={{ justifyContent: 'center', padding: '8px', fontSize: '12px', color: '#ec4899', borderColor: 'rgba(236, 72, 153, 0.3)' }}
                onClick={() => setIsThemeStudioOpen(true)}
                disabled={!isOnline}
              >
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                </svg>
                <span>Mở Giao Diện Studio Quản Lý &amp; Nạp File .hnt</span>
              </button>
            </div>
          </div>

          {quickExtractMsg && (
            <div style={{ padding: '8px 12px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '6px', fontSize: '11.5px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>{quickExtractMsg}</span>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          MODULE 3: GOOGLE ECOSYSTEM & ASSISTANTS
          ========================================================================= */}
      {(activeModule === 'all' || activeModule === 'google') && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '14px' }}>
          {/* Box A: Google & Gemini All-in-One Suite */}
          <div
            className="specs-card"
            style={{
              border: '1px solid rgba(56, 189, 248, 0.35)',
              background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.7), rgba(30, 41, 59, 0.4))',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div className="specs-header-title">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="svg-icon" style={{ color: '#38bdf8' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                      <line x1="12" y1="19" x2="12" y2="22"></line>
                    </svg>
                  </span>
                  <span style={{ fontWeight: 600, fontSize: '13.5px' }}>
                    Trợ Lý Ảo Google &amp; Gemini (Thay Thế YOYO)
                  </span>
                </div>
                <span className="badge-tag tag-safe" style={{ fontSize: '10.5px' }}>
                  Hybrid 3 Lớp
                </span>
              </div>

              <p style={{ fontSize: '12px', color: 'var(--text-dim)', margin: '6px 0 12px 0', lineHeight: '1.5' }}>
                Đóng băng YOYO Voice nội địa, gán mặc định sang Google Assistant, kích hoạt thanh vuốt <b>Gesture Search</b> và engine đánh thức giọng nói <b>Trợ Lý VXM</b> offline 24/7.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                className="btn-tool success"
                style={{ width: '100%', justifyContent: 'center', padding: '10px', fontSize: '12.5px', fontWeight: 600 }}
                onClick={onSetupFullAssistantSuite}
                disabled={!isOnline}
              >
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
                <span>KÍCH HOẠT TRỌN BỘ TRỢ LÝ TOÀN DIỆN (1-CLICK)</span>
              </button>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                <button
                  className="btn-tool"
                  style={{ justifyContent: 'center', fontSize: '11px', padding: '6px 4px' }}
                  onClick={onSetAssistant}
                  disabled={!isOnline}
                  title="Gán Google Gemini làm mặc định hệ thống"
                >
                  1. Lõi Hệ Thống
                </button>
                <button
                  className="btn-tool"
                  style={{ justifyContent: 'center', fontSize: '11px', padding: '6px 4px' }}
                  onClick={onInstallGestureSearch}
                  disabled={!isOnline}
                  title="Cài đặt Gesture Search gọi Gemini nhanh"
                >
                  2. Gesture Bar
                </button>
                <button
                  className="btn-tool"
                  style={{ justifyContent: 'center', fontSize: '11px', padding: '6px 4px' }}
                  onClick={onInstallVxMAssistant}
                  disabled={!isOnline}
                  title="Cài engine nhận diện Hey Google offline"
                >
                  3. Trợ Lý VXM
                </button>
              </div>
            </div>
          </div>

          {/* Box B: Google Play Services & APKMirror Scraper */}
          <div
            className="specs-card"
            style={{
              border: '1px solid rgba(52, 211, 153, 0.35)',
              background: 'linear-gradient(145deg, rgba(6, 78, 59, 0.25), rgba(15, 23, 42, 0.6))',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div className="specs-header-title">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="svg-icon" style={{ color: '#34d399' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                  </span>
                  <span style={{ fontWeight: 600, fontSize: '13.5px' }}>
                    Kích Hoạt GMS &amp; Tự Động Cài CH Play
                  </span>
                </div>
                <span className="badge-tag tag-safe" style={{ fontSize: '10.5px' }}>
                  APKMirror Scraper
                </span>
              </div>

              <p style={{ fontSize: '12px', color: 'var(--text-dim)', margin: '6px 0 10px 0', lineHeight: '1.5' }}>
                Mở khóa khung GMS/GSF tích hợp sẵn trong MagicOS, tự động cào link phiên bản mới nhất từ APKMirror đúng kiến trúc chip <code>{device?.cpu_abi || 'ARM64'}</code> và cài hoàn tất.
              </p>

              <div style={{ marginBottom: '8px' }}>
                <input
                  type="text"
                  placeholder="URL APK tùy chọn (Để trống = Tự động cào link mới nhất từ APKMirror)"
                  value={customPlayStoreUrl}
                  onChange={(e) => setCustomPlayStoreUrl(e.target.value)}
                  className="tool-input"
                  style={{ width: '100%', fontSize: '11px' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                className="btn-tool success"
                style={{ width: '100%', justifyContent: 'center', padding: '10px', fontSize: '12.5px', fontWeight: 600 }}
                onClick={() => onSetupFullGoogleEcosystem(customPlayStoreUrl)}
                disabled={!isOnline}
              >
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
                <span>TỰ ĐỘNG BẬT GMS &amp; CÀI CH PLAY (1-CLICK)</span>
              </button>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                <button
                  className="btn-tool"
                  style={{ justifyContent: 'center', fontSize: '11px', padding: '6px 8px' }}
                  onClick={onEnableGoogleServices}
                  disabled={!isOnline}
                >
                  1. Bật Khung GMS
                </button>
                <button
                  className="btn-tool"
                  style={{ justifyContent: 'center', fontSize: '11px', padding: '6px 8px' }}
                  onClick={() => onInstallPlayStore(customPlayStoreUrl)}
                  disabled={!isOnline}
                >
                  2. Cài CH Play
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 4: PERFORMANCE & SCREEN CONTROL & HARDWARE UTILITIES
          ========================================================================= */}
      {(activeModule === 'all' || activeModule === 'system') && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
          {/* Card: Scrcpy & Screen Mirroring */}
          <div className="specs-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div className="specs-header-title">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="svg-icon" style={{ color: '#38bdf8' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M13 3H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-3"></path>
                      <polyline points="8 21 12 17 16 21"></polyline>
                      <line x1="12" y1="17" x2="12" y2="21"></line>
                    </svg>
                  </span>
                  <span style={{ fontWeight: 600 }}>Chiếu Màn Hình &amp; Điều Khiển 120Hz</span>
                </div>
              </div>

              <p style={{ fontSize: '12px', color: 'var(--text-dim)', margin: '6px 0 10px 0', lineHeight: '1.5' }}>
                Điều khiển điện thoại trực tiếp bằng chuột và bàn phím máy tính siêu mượt 120 FPS qua Scrcpy hoặc xem ngay trên tab Web.
              </p>

              <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '11.5px' }}>
                  <input
                    type="checkbox"
                    checked={turnOffScreen}
                    onChange={(e) => setTurnOffScreen(e.target.checked)}
                  />
                  <span>Tắt màn hình điện thoại</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '11.5px' }}>
                  <input
                    type="checkbox"
                    checked={stayAwake}
                    onChange={(e) => setStayAwake(e.target.checked)}
                  />
                  <span>Luôn sáng màn hình</span>
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
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
                <span>{isWeb ? 'Mở Scrcpy Desktop 120Hz' : 'Khởi Chạy Scrcpy 120Hz'}</span>
              </button>

              <button
                type="button"
                className="btn-tool"
                style={{ width: '100%', justifyContent: 'center', padding: '7px', fontSize: '11.5px', color: '#38bdf8' }}
                onClick={onOpenWebMirror}
                disabled={!isOnline}
              >
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                  <line x1="12" y1="18" x2="12.01" y2="18"></line>
                </svg>
                <span>Xem Trực Tiếp Trong Trình Duyệt (Web Mirror)</span>
              </button>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                <button
                  type="button"
                  className="btn-tool"
                  style={{ justifyContent: 'center', fontSize: '11px', padding: '6px 4px' }}
                  onClick={handleWirelessConnect}
                  disabled={!isOnline || isSettingWireless}
                  title="Bật kết nối không dây qua Wi-Fi (Port 5555)"
                >
                  {isSettingWireless ? 'Đang mở...' : 'Wi-Fi ADB'}
                </button>

                <button
                  type="button"
                  className="btn-tool"
                  style={{ justifyContent: 'center', fontSize: '11px', padding: '6px 4px' }}
                  onClick={handleScreenshot}
                  disabled={!isOnline || isCapturingScreenshot}
                  title="Chụp ảnh màn hình điện thoại độ phân giải gốc"
                >
                  {isCapturingScreenshot ? 'Đang chụp...' : 'Chụp Màn Hình'}
                </button>

                <button
                  type="button"
                  className={`btn-tool ${isRecording ? 'danger recording-pulse' : ''}`}
                  style={{ justifyContent: 'center', fontSize: '11px', padding: '6px 4px' }}
                  onClick={handleToggleRecord}
                  disabled={!isOnline}
                  title="Quay video màn hình MP4"
                >
                  {isRecording ? `Dừng (${recordSeconds}s)` : 'Quay MP4'}
                </button>
              </div>
            </div>
          </div>

          {/* Card: Native AOT Compiler (dex2oat) */}
          <div className="specs-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div className="specs-header-title">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="svg-icon" style={{ color: '#10b981' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                    </svg>
                  </span>
                  <span style={{ fontWeight: 600 }}>Tăng Tốc Ứng Dụng (Native AOT dex2oat)</span>
                </div>
              </div>

              <p style={{ fontSize: '12px', color: 'var(--text-dim)', margin: '6px 0 10px 0', lineHeight: '1.5' }}>
                Dùng trình biên dịch <code>dex2oat</code> của Android chuyển mã bytecode thành mã máy Native ARM64 cho Zalo, Facebook, Ngân Hàng, Shopee, Grab... tăng tốc mở app 30-50% và dọn sạch bộ nhớ cache.
              </p>
            </div>

            <button
              className="btn-tool"
              style={{ width: '100%', justifyContent: 'center', padding: '9px 12px', fontWeight: 600 }}
              onClick={onCompileApps}
              disabled={!isOnline}
            >
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              </svg>
              <span>Biên Dịch Tăng Tốc Native AOT dex2oat</span>
            </button>
          </div>

          {/* Card: Weather Fix & Reboot Controls */}
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
                  <span style={{ fontWeight: 600 }}>Thời Tiết Độ C &amp; Khởi Động Lại Máy</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '6px 0 10px 0' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-dim)', margin: 0, lineHeight: '1.4' }}>
                  Ép ngôn ngữ app Thời Tiết sang <code>en-GB</code> hiển thị nhiệt độ Độ C (°C) thay vì tiếng Trung.
                </p>
                <button
                  className="btn-tool"
                  style={{ width: '100%', justifyContent: 'center', padding: '6px' }}
                  onClick={onFixWeather}
                  disabled={!isOnline}
                >
                  Đổi Thời Tiết Sang Tiếng Anh (Độ C)
                </button>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-dim)', marginBottom: '6px' }}>
                Điều Khiển Nguồn Hệ Thống:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                <button
                  className="btn-tool"
                  style={{ justifyContent: 'center', fontSize: '11px', padding: '6px 4px' }}
                  onClick={() => onReboot('system')}
                  disabled={!isOnline}
                >
                  Khởi Động Lại
                </button>
                <button
                  className="btn-tool"
                  style={{ justifyContent: 'center', fontSize: '11px', padding: '6px 4px' }}
                  onClick={() => onReboot('bootloader')}
                  disabled={!isOnline}
                >
                  Fastboot
                </button>
                <button
                  className="btn-tool"
                  style={{ justifyContent: 'center', fontSize: '11px', padding: '6px 4px' }}
                  onClick={() => onReboot('recovery')}
                  disabled={!isOnline}
                >
                  Recovery
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Screenshot Preview Result Modal */}
      {screenshotResult && (
        <div className="modal-backdrop" onClick={() => setScreenshotResult(null)}>
          <div className="modal-window" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                  <circle cx="12" cy="13" r="4"></circle>
                </svg>
                <span>Ảnh Chụp Màn Hình Điện Thoại (Lossless)</span>
              </div>
              <button
                type="button"
                className="btn-tool"
                style={{ padding: '4px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={() => setScreenshotResult(null)}
                title="Đóng"
              >
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
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

              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                  {screenshotResult.filename} ({screenshotResult.size_kb} KB)
                </span>
                <a
                  href={screenshotResult.url}
                  download={screenshotResult.filename}
                  className="btn-tool primary"
                  style={{ textDecoration: 'none', padding: '6px 14px', fontSize: '11px', fontWeight: 600 }}
                >
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '5px' }}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  Tải Ảnh Về Máy
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Screen Recording Result Modal */}
      {recordingResult && (
        <div className="modal-backdrop" onClick={() => setRecordingResult(null)}>
          <div className="modal-window" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="23 7 16 12 23 17 23 7"></polygon>
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                </svg>
                <span>Đã Hoàn Tất Quay Video Màn Hình MP4</span>
              </div>
              <button
                type="button"
                className="btn-tool"
                style={{ padding: '4px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={() => setRecordingResult(null)}
                title="Đóng"
              >
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-bright)', lineHeight: '1.6' }}>
                Đã kéo thành công video từ điện thoại về máy tính!
                <br />
                Tên file: <code>{recordingResult.filename}</code>
                <br />
                Thời lượng: <b>{recordingResult.duration} giây</b> • Dung lượng: <b>{recordingResult.size_mb} MB</b>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <a
                  href={recordingResult.url}
                  download={recordingResult.filename}
                  className="btn-tool primary"
                  style={{ textDecoration: 'none', padding: '6px 14px', fontSize: '11.5px', fontWeight: 600 }}
                >
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '5px' }}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  Tải Video MP4 Về Máy
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Theme Studio Modal */}
      <ThemeStudioModal
        isOpen={isThemeStudioOpen}
        onClose={() => setIsThemeStudioOpen(false)}
        adbService={adbService}
      />
    </div>
  );
}
