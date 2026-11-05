import React, { useState, useEffect, useMemo, useRef } from 'react';
import { adbService } from '../services/adbService';
import ThemeStudioModal from './ThemeStudioModal';

// Detailed definitions for the 11 system marketing & telemetry keys
const TELEMETRY_DEFINITIONS = [
  {
    key: 'state_of_ads_switch',
    title: 'Quảng Cáo Thương Mại Hóa & Banner Hệ Thống',
    category: 'telemetry',
    categoryLabel: 'Quảng Cáo',
    scope: 'Settings Secure',
    desc: 'Chặn toàn bộ banner quảng cáo trong các app gốc của MagicOS và biểu ngữ tài trợ đẩy từ máy chủ tiếp thị Honor.',
    adbCommand: 'adb shell settings put secure state_of_ads_switch 0',
    impact: 'Triệt tiêu hoàn toàn banner quảng cáo rác trong ứng dụng hệ thống.',
    safety: 'An Toàn Tuyệt Đối (Không ảnh hưởng chức năng máy)',
    recommended: true,
  },
  {
    key: 'intelligent_message_enabled',
    title: 'Phân Tích Nội Dung Tin Nhắn Thông Minh',
    category: 'telemetry',
    categoryLabel: 'Riêng Tư',
    scope: 'Settings Secure',
    desc: 'Tắt engine AI tự động đọc và phân tích nội dung tin nhắn SMS / mã xác thực ngân hàng để phỏng đoán thói quen mua sắm.',
    adbCommand: 'adb shell settings put secure intelligent_message_enabled 0',
    impact: 'Bảo vệ an toàn mật khẩu OTP ngân hàng và tin nhắn cá nhân.',
    safety: 'An Toàn Tuyệt Đối',
    recommended: true,
  },
  {
    key: 'personalized_push_state',
    title: 'Thông Báo Đẩy Tiếp Thị Cá Nhân Hóa',
    category: 'telemetry',
    categoryLabel: 'Quảng Cáo',
    scope: 'Settings Secure',
    desc: 'Chặn máy chủ Honor gửi các thông báo tiếp thị, khuyến mãi và thông báo tài trợ lên thanh thông báo Notification.',
    adbCommand: 'adb shell settings put secure personalized_push_state 0',
    impact: 'Thanh thông báo sạch sẽ, không bị quấy rầy bởi tin nhắn tiếp thị ngầm.',
    safety: 'An Toàn Tuyệt Đối',
    recommended: true,
  },
  {
    key: 'personalized_recommendation',
    title: 'Hồ Sơ Hành Vi & Đề Xuất Cá Nhân Hóa',
    category: 'telemetry',
    categoryLabel: 'Riêng Tư',
    scope: 'Settings Secure',
    desc: 'Ngăn thuật toán máy học theo dõi tần suất mở ứng dụng và hành vi sử dụng máy để lập hồ sơ thị hiếu người dùng.',
    adbCommand: 'adb shell settings put secure personalized_recommendation 0',
    impact: 'Ngăn chặn việc định danh và lập hồ sơ theo dõi người dùng ngầm.',
    safety: 'An Toàn Tuyệt Đối',
    recommended: true,
  },
  {
    key: 'hiboard.recommend.status',
    title: 'Đề Xuất Màn Hình Âm Phủ (Honor HiBoard)',
    category: 'telemetry',
    categoryLabel: 'Giao Diện',
    scope: 'Settings Secure',
    desc: 'Xóa sạch các thẻ tin tức giật gân, ứng dụng gợi ý cài đặt và quảng cáo tài trợ trên trang màn hình -1 (HiBoard).',
    adbCommand: 'adb shell settings put secure hiboard.recommend.status 0',
    impact: 'Màn hình -1 trở nên gọn gàng, giảm tiêu tốn dữ liệu di động ngầm.',
    safety: 'An Toàn Tuyệt Đối',
    recommended: true,
  },
  {
    key: 'location_honor_ads',
    title: 'Định Vị Quảng Cáo Theo Tọa Độ GPS',
    category: 'telemetry',
    categoryLabel: 'Vị Trí',
    scope: 'Settings Secure',
    desc: 'Chặn dịch vụ Honor Ads truy cập tọa độ GPS thời gian thực để nhắm mục tiêu phân phối quảng cáo theo khu vực.',
    adbCommand: 'adb shell settings put secure location_honor_ads 0',
    impact: 'Tiết kiệm pin GPS và bảo mật tuyệt đối vị trí di chuyển thực tế.',
    safety: 'An Toàn Tuyệt Đối',
    recommended: true,
  },
  {
    key: 'settings_ai_recommend',
    title: 'Gợi Ý Dịch Vụ AI Trong Mục Cài Đặt',
    category: 'telemetry',
    categoryLabel: 'Giao Diện',
    scope: 'Settings Secure',
    desc: 'Tắt các banner quảng cáo dịch vụ trả phí và ứng dụng đối tác hiển thị ở đầu trang Cài Đặt (Settings).',
    adbCommand: 'adb shell settings put secure settings_ai_recommend 0',
    impact: 'Giao diện Cài đặt gốc trở nên nguyên bản, chuẩn phong cách thuần khiết.',
    safety: 'An Toàn Tuyệt Đối',
    recommended: true,
  },
  {
    key: 'intelligent_recommendation_toggle',
    title: 'Đề Xuất Thông Minh Toàn Hệ Thống',
    category: 'telemetry',
    categoryLabel: 'Giao Diện',
    scope: 'Settings Secure',
    desc: 'Vô hiệu hóa tính năng tự động gợi ý ứng dụng cài thêm trong thư mục app và màn hình chính MagicOS.',
    adbCommand: 'adb shell settings put secure intelligent_recommendation_toggle 0',
    impact: 'Không còn xuất hiện các icon app rác gợi ý tải về.',
    safety: 'An Toàn Tuyệt Đối',
    recommended: true,
  },
  {
    key: 'search.recommend.letter.switch',
    title: 'Từ Khóa Tìm Kiếm Tài Trợ (Honor Search)',
    category: 'telemetry',
    categoryLabel: 'Quảng Cáo',
    scope: 'Settings Secure',
    desc: 'Chặn từ khóa gợi ý quảng cáo và danh sách trending thương mại trong thanh tìm kiếm Honor Search / Petal Search.',
    adbCommand: 'adb shell settings put secure search.recommend.letter.switch 0',
    impact: 'Thanh tìm kiếm chỉ hiển thị ứng dụng và tệp tin thực tế trên máy.',
    safety: 'An Toàn Tuyệt Đối',
    recommended: true,
  },
  {
    key: 'cloud_maintenance',
    title: 'Báo Cáo Chẩn Đoán Tự Động Lên Cloud',
    category: 'telemetry',
    categoryLabel: 'Cloud Log',
    scope: 'Settings Secure',
    desc: 'Chặn tiến trình tự động tải các tệp chẩn đoán lỗi, log kernel và dữ liệu phần cứng lên máy chủ điện toán đám mây TQ.',
    adbCommand: 'adb shell settings put secure cloud_maintenance 0',
    impact: 'Ngắt hoàn toàn việc tải ngầm file log lên cloud, tiết kiệm băng thông mạng.',
    safety: 'An Toàn Tuyệt Đối',
    recommended: true,
  },
  {
    key: 'location_report_switch',
    title: 'Báo Cáo Tọa Độ Vị Trí Thiết Bị Ngầm',
    category: 'telemetry',
    categoryLabel: 'Vị Trí',
    scope: 'Settings Secure',
    desc: 'Vô hiệu hóa cờ báo cáo tọa độ định kỳ của thiết bị về trung tâm dịch vụ mạng của Honor.',
    adbCommand: 'adb shell settings put secure location_report_switch 0',
    impact: 'Bảo vệ quyền riêng tư định vị 24/7 và giảm chu kỳ thức máy nền.',
    safety: 'An Toàn Tuyệt Đối',
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
  // Navigation State: null = Master Hub (Cards View), 'tweaks' | 'telemetry' | 'theme' | 'google' | 'screen' | 'system' = Dedicated Slide-Out Workspace
  const [activeModule, setActiveModule] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [inspectTool, setInspectTool] = useState(null);

  // MagicOS Tweaks state
  const [magicTweaks, setMagicTweaks] = useState(null);
  const [loadingTweakKey, setLoadingTweakKey] = useState(null);
  const [rootStatus, setRootStatus] = useState(null);
  const [quickExtracting, setQuickExtracting] = useState(false);
  const [quickExtractMsg, setQuickExtractMsg] = useState(null);
  const [isThemeStudioOpen, setIsThemeStudioOpen] = useState(false);
  const [customPlayStoreUrl, setCustomPlayStoreUrl] = useState('');
  const [isSettingWireless, setIsSettingWireless] = useState(false);
  const [isCapturingScreenshot, setIsCapturingScreenshot] = useState(false);
  const [turnOffScreen, setTurnOffScreen] = useState(false);
  const [stayAwake, setStayAwake] = useState(true);

  // Telemetry Checklist Selection State
  const [selectedTelemetryKeys, setSelectedTelemetryKeys] = useState(
    () => new Set(TELEMETRY_DEFINITIONS.map((d) => d.key))
  );
  const [isApplyingTelemetry, setIsApplyingTelemetry] = useState(false);

  // Screen recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [recordingResult, setRecordingResult] = useState(null);
  const recTimerRef = useRef(null);

  const isOnline = Boolean(device && device.connected);

  // Keyboard navigation: ESC to go back to Hub or close drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (inspectTool) {
          setInspectTool(null);
        } else if (activeModule !== null) {
          setActiveModule(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inspectTool, activeModule]);

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

  const handleToggleSelectTelemetry = (key) => {
    setSelectedTelemetryKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleApplySelectedTelemetry = async (turnOff = true) => {
    if (selectedTelemetryKeys.size === 0) return;
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
      const res = await adbService.captureScreenshot();
      if (res && res.success && res.url) {
        const a = document.createElement('a');
        a.href = res.url;
        a.download = res.filename || 'honor_screenshot.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        alert(res?.error || 'Chụp màn hình thất bại');
      }
    } catch (e) {
      alert(e.message);
    } finally {
      setIsCapturingScreenshot(false);
    }
  };

  const handleToggleRecord = async () => {
    if (isRecording) {
      clearInterval(recTimerRef.current);
      setIsRecording(false);
      const res = await adbService.stopScreenRecord();
      if (res && res.success) {
        setRecordingResult(res);
      }
      setRecordSeconds(0);
    } else {
      const res = await adbService.startScreenRecord(180);
      if (res && res.success) {
        setIsRecording(true);
        setRecordSeconds(1);
        recTimerRef.current = setInterval(() => {
          setRecordSeconds((s) => s + 1);
        }, 1000);
      }
    }
  };

  const handleCalibrateBattery = async () => {
    if (!window.confirm('Cân chỉnh pin sẽ xóa bộ đếm chu kỳ và lịch sử tiêu thụ điện cũ của hệ điều hành. Tiếp tục?')) return;
    try {
      const res = await adbService.calibrateBattery();
      if (res && res.success) {
        alert('Đã reset thống kê pin và kích hoạt chu kỳ học lại dung lượng thực tế thành công!');
      } else {
        alert(res?.error || 'Lỗi cân chỉnh pin');
      }
    } catch (e) {
      alert(e.message);
    }
  };

  // Master Tools Inventory
  const allTools = useMemo(() => {
    const list = [];

    // --- GROUP 1: MAGICOS HIDDEN TWEAKS (8 Items) ---
    list.push(
      {
        id: 'tweak_charge_turbo',
        category: 'tweaks',
        categoryLabel: 'Cài Đặt Ẩn',
        title: 'Siêu Sạc Nhanh Khi Sáng Màn Hình (Charge Turbo)',
        scope: 'secure: charge_turbo_switch',
        summary: 'Duy trì công suất sạc Turbo tối đa lúc đang mở màn hình sử dụng máy.',
        desc: 'Mặc định khi bật sáng màn hình, MagicOS sẽ tự động hạ dòng sạc từ 66W/100W xuống còn 18W để giảm nhiệt. Khóa này mở rộng công suất sạc tối đa ngay cả khi đang xem video hoặc lướt web.',
        adbCommand: 'adb shell settings put secure charge_turbo_switch 1',
        impact: 'Sạc đầy pin nhanh hơn 40% trong lúc bạn đang sử dụng điện thoại.',
        safety: 'An Toàn (Mạch bảo vệ nhiệt độ của máy vẫn quản lý độc lập)',
        recommended: true,
        type: 'toggle',
        checked: Boolean(magicTweaks?.charge_turbo_switch?.enabled),
        onToggle: () => handleToggleTweak('secure', 'charge_turbo_switch', magicTweaks?.charge_turbo_switch?.value, '1', '0'),
        loading: loadingTweakKey === 'charge_turbo_switch',
      },
      {
        id: 'tweak_infinite_bt',
        category: 'tweaks',
        categoryLabel: 'Cài Đặt Ẩn',
        title: 'Âm Lượng Bluetooth Vô Cực (Infinite BT A2DP)',
        scope: 'secure: infinite_volume_music_bt_a2dp',
        summary: 'Phá vỡ mức giới hạn 75-80dB do quy định áp đặt lên tai nghe Bluetooth.',
        desc: 'Phá vỡ mức giới hạn âm lượng an toàn, tăng công suất phát âm thanh cho tai nghe TWS & loa không dây.',
        adbCommand: 'adb shell settings put secure infinite_volume_music_bt_a2dp 1',
        impact: 'Âm lượng tai nghe TWS và loa Bluetooth to hơn 30-40%, âm trường sâu và sống động.',
        safety: 'An Toàn (Không nghe âm lượng quá lớn trong thời gian dài)',
        recommended: false,
        type: 'toggle',
        checked: Boolean(magicTweaks?.infinite_volume_music_bt_a2dp?.enabled),
        onToggle: () => handleToggleTweak('secure', 'infinite_volume_music_bt_a2dp', magicTweaks?.infinite_volume_music_bt_a2dp?.value, '1', '0'),
        loading: loadingTweakKey === 'infinite_volume_music_bt_a2dp',
      },
      {
        id: 'tweak_lock_120hz',
        category: 'tweaks',
        categoryLabel: 'Cài Đặt Ẩn',
        title: 'Khóa Cứng Tần Số Quét Không Tụt (No-Drop 120Hz)',
        scope: 'secure: reduce_refresh_rate_enabled',
        summary: 'Tắt cờ tự động hạ về 60Hz khi màn hình đứng yên hoặc xem video.',
        desc: 'Tắt tính năng tự ý hạ tần số quét xuống 60Hz của MagicOS khi xem video YouTube/TikTok, khi gõ bàn phím hoặc khi màn hình đứng yên. Màn hình luôn giữ 120Hz/144Hz thực sự.',
        adbCommand: 'adb shell settings put secure reduce_refresh_rate_enabled 0',
        impact: 'Loại bỏ hoàn toàn cảm giác khựng giật khung hình khi vuốt app sau khi tạm dừng.',
        safety: 'An Toàn Tuyệt Đối',
        recommended: true,
        type: 'toggle',
        checked: Boolean(magicTweaks?.reduce_refresh_rate_enabled?.enabled),
        onToggle: () => handleToggleTweak('secure', 'reduce_refresh_rate_enabled', magicTweaks?.reduce_refresh_rate_enabled?.value, '0', '1'),
        loading: loadingTweakKey === 'reduce_refresh_rate_enabled',
      },
      {
        id: 'tweak_tianshan',
        category: 'tweaks',
        categoryLabel: 'Cài Đặt Ẩn',
        title: 'Siêu Hiển Thị Thiên Sơn Oasis (Tianshan Display)',
        scope: 'secure: hn_tianshan_switch',
        summary: 'Bật động cơ hiển thị màn hình bảo vệ mắt cao cấp Thiên Sơn của Honor.',
        desc: 'Kích hoạt thuật toán hiển thị cao cấp Thiên Sơn Oasis của Honor trên các dòng Flagship Magic và Series X. Thuật toán tối ưu ánh sáng dịu mắt và tăng độ nét cạnh phông chữ.',
        adbCommand: 'adb shell settings put secure hn_tianshan_switch 1',
        impact: 'Dịu mắt khi đọc văn bản ban đêm, tăng độ sắc nét hiển thị.',
        safety: 'An Toàn Tuyệt Đối',
        recommended: true,
        type: 'toggle',
        checked: Boolean(magicTweaks?.hn_tianshan_switch?.enabled),
        onToggle: () => handleToggleTweak('secure', 'hn_tianshan_switch', magicTweaks?.hn_tianshan_switch?.value, '1', '0'),
        loading: loadingTweakKey === 'hn_tianshan_switch',
      },
      {
        id: 'tweak_sdr2hdr',
        category: 'tweaks',
        categoryLabel: 'Cài Đặt Ẩn',
        title: 'Nâng Cấp Tự Động SDR Sang HDR (Honor Video Engine)',
        scope: 'secure: hn_sdr2hdr_switch',
        summary: 'Tự động nâng cao dải tương phản và độ sáng cho video SDR thông thường.',
        desc: 'Kích hoạt thuật toán phần cứng của MagicOS nâng dải nhạy sáng cho các video SDR (YouTube, TikTok, Netflix SDR) giúp màu sắc sống động và tương phản sâu hơn.',
        adbCommand: 'adb shell settings put secure hn_sdr2hdr_switch 1',
        impact: 'Trải nghiệm xem video SDR rực rỡ và giàu chi tiết như chuẩn HDR thật.',
        safety: 'An Toàn Tuyệt Đối',
        recommended: true,
        type: 'toggle',
        checked: Boolean(magicTweaks?.hn_sdr2hdr_switch?.enabled),
        onToggle: () => handleToggleTweak('secure', 'hn_sdr2hdr_switch', magicTweaks?.hn_sdr2hdr_switch?.value, '1', '0'),
        loading: loadingTweakKey === 'hn_sdr2hdr_switch',
      },
      {
        id: 'tweak_knuckle',
        category: 'tweaks',
        categoryLabel: 'Cài Đặt Ẩn',
        title: 'Cử Chỉ Khớp Ngón Tay (Knuckle Gestures)',
        scope: 'secure: fingersense_letters_enabled',
        summary: 'Gõ 2 lần chụp màn hình, vẽ chữ S cuộn dài, vẽ chữ C mở camera.',
        desc: 'Kích hoạt nhận diện cử chỉ gõ và vẽ chữ bằng khớp đốt ngón tay (Knuckle Sense) trứ danh của MagicOS.',
        adbCommand: 'adb shell settings put secure fingersense_letters_enabled 1',
        impact: 'Thao tác chụp cuộn màn hình và kích hoạt ứng dụng nhanh gấp 3 lần.',
        safety: 'Tính năng chính thức của MagicOS',
        recommended: true,
        type: 'toggle',
        checked: Boolean(magicTweaks?.fingersense_letters_enabled?.enabled),
        onToggle: () => handleToggleTweak('secure', 'fingersense_letters_enabled', magicTweaks?.fingersense_letters_enabled?.value, '1', '0'),
        loading: loadingTweakKey === 'fingersense_letters_enabled',
      },
      {
        id: 'tweak_fingerprint_slide',
        category: 'tweaks',
        categoryLabel: 'Cài Đặt Ẩn',
        title: 'Trượt Cảm Biến Vân Tay Kéo Bảng Thông Báo',
        scope: 'secure: fingerprint_slide_switch',
        summary: 'Vuốt ngón tay trên cảm biến vân tay để hạ thanh thông báo xuống.',
        desc: 'Cho phép dùng cử chỉ vuốt xuống trên khu vực cảm biến vân tay để kéo thanh thông báo và trung tâm điều khiển xuống nhanh chóng mà không cần với tay lên mép trên màn hình.',
        adbCommand: 'adb shell settings put secure fingerprint_slide_switch 1',
        impact: 'Thao tác sử dụng một tay trên các thiết bị màn hình lớn thuận tiện hơn.',
        safety: 'An Toàn Tuyệt Đối',
        recommended: false,
        type: 'toggle',
        checked: Boolean(magicTweaks?.fingerprint_slide_switch?.enabled),
        onToggle: () => handleToggleTweak('secure', 'fingerprint_slide_switch', magicTweaks?.fingerprint_slide_switch?.value, '1', '0'),
        loading: loadingTweakKey === 'fingerprint_slide_switch',
      },
      {
        id: 'tweak_network_speed',
        category: 'tweaks',
        categoryLabel: 'Cài Đặt Ẩn',
        title: 'Hiện Tốc Độ Mạng Thời Gian Thực (Network Speed)',
        scope: 'system: show_network_speed_enabled',
        summary: 'Hiển thị tốc độ download KB/s trên thanh trạng thái Notification.',
        desc: 'Kích hoạt hiển thị tốc độ truyền dữ liệu mạng theo thời gian thực trên thanh trạng thái cạnh cột sóng Wi-Fi/4G.',
        adbCommand: 'adb shell settings put system show_network_speed_enabled 1',
        impact: 'Dễ dàng giám sát tốc độ mạng khi tải file hoặc xem livestream.',
        safety: 'An Toàn Tuyệt Đối',
        recommended: true,
        type: 'toggle',
        checked: Boolean(magicTweaks?.show_network_speed_enabled?.enabled),
        onToggle: () => handleToggleTweak('system', 'show_network_speed_enabled', magicTweaks?.show_network_speed_enabled?.value, '1', '0'),
        loading: loadingTweakKey === 'show_network_speed_enabled',
      }
    );

    // --- GROUP 2: TELEMETRY & MARKETING (11 Items) ---
    TELEMETRY_DEFINITIONS.forEach((t) => {
      const isBlocked = magicTweaks?.marketing_all_disabled?.details?.[t.key] === '0';
      list.push({
        id: `telemetry_${t.key}`,
        category: 'telemetry',
        categoryLabel: 'Khóa Telemetry',
        title: t.title,
        scope: `secure: ${t.key}`,
        summary: t.desc,
        desc: t.desc,
        adbCommand: t.adbCommand,
        impact: t.impact,
        safety: t.safety,
        recommended: t.recommended,
        type: 'telemetry_item',
        key: t.key,
        isBlocked,
        isSelected: selectedTelemetryKeys.has(t.key),
      });
    });

    // --- GROUP 3: TP THEME STUDIO VIP (2 Items) ---
    list.push(
      {
        id: 'theme_quick_extract',
        category: 'theme',
        categoryLabel: 'Theme Studio',
        title: 'Trích Xuất Nhanh Theme VIP Đang Thử (1-Click .hnt)',
        scope: 'Theme Extractor Engine',
        summary: 'Trích xuất theme dùng thử thành file chuẩn .hnt nạp vĩnh viễn không rác.',
        desc: 'Công nghệ độc quyền: Quét thư mục tạm /data/themes/0, đóng gói tài nguyên icon/font/wallpaper thành file chuẩn .hnt nạp thẳng vào app Chủ Đề hệ thống và lưu ra /sdcard/Honor/Themes/ để chia sẻ.',
        adbCommand: 'adb shell cp -r /data/themes/0 /sdcard/Honor/Themes/',
        impact: 'Sở hữu theme VIP trọn đời, zero file rác trên bộ nhớ máy.',
        safety: 'An Toàn Tuyệt Đối (Không sửa đổi phân vùng /system)',
        recommended: true,
        type: 'action',
        actionLabel: quickExtracting ? 'Đang trích xuất...' : 'Trích Xuất 1-Click',
        onExecute: handleQuickExtract,
        loading: quickExtracting,
      },
      {
        id: 'theme_open_studio',
        category: 'theme',
        categoryLabel: 'Theme Studio',
        title: 'Mở Trình Quản Lý & Nạp File Theme .hnt',
        scope: 'Theme Studio Manager',
        summary: 'Giao diện quản lý bộ sưu tập theme, nạp file .hnt từ máy tính vào máy.',
        desc: 'Cửa sổ chuyên dụng hỗ trợ kéo thả file .hnt, xem trước ảnh bìa, giải nén icon pack và tự động đồng bộ vào kho ứng dụng Theme của Honor.',
        adbCommand: 'Nạp file .hnt vào /sdcard/Android/data/com.hihonor.android.thememanager/files/',
        impact: 'Tự do tùy biến giao diện điện thoại với hàng nghìn chủ đề sáng tạo.',
        safety: 'An Toàn Tuyệt Đối',
        recommended: true,
        type: 'action',
        actionLabel: 'Mở Studio',
        onExecute: () => setIsThemeStudioOpen(true),
      }
    );

    // --- GROUP 4: GOOGLE SERVICES & AI ASSISTANTS (4 Items) ---
    list.push(
      {
        id: 'google_assistant_suite',
        category: 'google',
        categoryLabel: 'Trợ Lý AI',
        title: 'Kích Hoạt Trọn Bộ Trợ Lý Google & Gemini (1-Click)',
        scope: 'GMS Assistant Suite',
        summary: 'Thay thế hoàn toàn YOYO Voice bằng Google Gemini và Gesture Search Bar.',
        desc: 'Đóng băng YOYO Voice nội địa, gán mặc định sang Google Assistant, kích hoạt thanh vuốt Gesture Search và engine đánh thức giọng nói Trợ Lý VXM offline 24/7.',
        adbCommand: 'adb shell cmd package set-home-activity com.google.android.googlequicksearchbox\nadb shell settings put secure assistant com.google.android.googlequicksearchbox/...',
        impact: 'Gọi Google Gemini bằng phím nguồn hoặc vuốt góc màn hình mượt mà như máy quốc tế.',
        safety: '100% Non-Root, có thể đổi lại bất cứ khi nào',
        recommended: true,
        type: 'action',
        actionLabel: 'Kích Hoạt Trợ Lý 1-Click',
        onExecute: onSetupFullAssistantSuite,
      },
      {
        id: 'google_gms_play_full',
        category: 'google',
        categoryLabel: 'Google GMS',
        title: 'Tự Động Bật Khung GMS & Cài Đặt CH Play (1-Click)',
        scope: 'GMS & APKMirror Scraper',
        summary: 'Mở khóa GMS có sẵn trong ROM và cào link cài CH Play mới nhất.',
        desc: 'Mở khóa khung dịch vụ Google Services Framework (GSF/GMS) tích hợp sẵn trong MagicOS, tự động cào link phiên bản mới nhất từ APKMirror đúng kiến trúc chip ARM64 và hoàn tất cài đặt.',
        adbCommand: 'adb shell settings put secure google_services_switch 1\nadb install -r playstore.apk',
        impact: 'Sử dụng đầy đủ tài khoản Google, đồng bộ danh bạ, Google Drive và tải app từ CH Play.',
        safety: 'Chuẩn GMS chính hãng được Honor chứng nhận',
        recommended: true,
        type: 'action',
        actionLabel: 'Bật GMS & Cài CH Play',
        onExecute: () => onSetupFullGoogleEcosystem(customPlayStoreUrl),
      },
      {
        id: 'google_assistant_components',
        category: 'google',
        categoryLabel: 'Trợ Lý AI',
        title: 'Gán Mặc Định Lõi Trợ Lý Ảo Google Gemini',
        scope: 'secure: assistant & voice_interaction_service',
        summary: 'Chỉ định Google làm trợ lý mặc định hệ thống thay cho trợ lý YOYO TQ.',
        desc: 'Gán intent hệ thống của Android `android.intent.action.ASSIST` sang Google Quick Search Box / Gemini.',
        adbCommand: 'adb shell settings put secure assistant com.google.android.googlequicksearchbox/com.google.android.voiceinteraction.GsaVoiceInteractionService',
        impact: 'Nhấn giữ nút nguồn hoặc vuốt góc để gọi Google Assistant.',
        safety: 'An Toàn Tuyệt Đối',
        recommended: true,
        type: 'action',
        actionLabel: 'Gán Mặc Định',
        onExecute: onSetAssistant,
      },
      {
        id: 'install_play_store_only',
        category: 'google',
        categoryLabel: 'Google GMS',
        title: 'Cài Đặt Cửa Hàng Google Play Store (CH Play)',
        scope: 'Package: com.android.vending',
        summary: 'Tải và cài đặt file APK Google Play Store chính chủ mới nhất.',
        desc: 'Tự động tải gói cài đặt CH Play từ kho APKMirror hoặc qua đường dẫn tùy chọn và cài đặt an toàn lên máy.',
        adbCommand: 'adb install -r -d com.android.vending.apk',
        impact: 'Cài đặt và cập nhật ứng dụng bản quyền từ Google Play.',
        safety: 'Chữ ký APK gốc của Google LLC',
        recommended: true,
        type: 'action',
        actionLabel: 'Cài CH Play',
        onExecute: () => onInstallPlayStore(customPlayStoreUrl),
      }
    );

    // --- GROUP 5: SCREEN & SCRCPY (4 Items) ---
    list.push(
      {
        id: 'sys_scrcpy_mirror',
        category: 'screen',
        categoryLabel: 'Scrcpy 120Hz',
        title: 'Chiếu Màn Hình & Điều Khiển 120Hz (Scrcpy Engine)',
        scope: 'Scrcpy Low Latency Engine',
        summary: 'Điều khiển điện thoại bằng chuột và bàn phím máy tính siêu mượt.',
        desc: 'Khởi chạy cửa sổ điều khiển màn hình độ trễ cực thấp (< 30ms), hỗ trợ tốc độ quét 120 FPS và truyền âm thanh lossless lên máy tính.',
        adbCommand: 'scrcpy --max-fps 120 --video-codec=h264',
        impact: 'Làm việc và chơi game mobile trên màn hình lớn máy tính tiện lợi.',
        safety: 'An Toàn Tuyệt Đối',
        recommended: true,
        type: 'action',
        actionLabel: 'Mở Scrcpy 120Hz',
        onExecute: () => onLaunchScrcpy({ turnOffScreen, stayAwake }),
      },
      {
        id: 'sys_web_mirror',
        category: 'screen',
        categoryLabel: 'Web Mirror',
        title: 'Xem Trực Tiếp Trong Trình Duyệt (Web Canvas)',
        scope: 'WebRTC / WebSocket Streamer',
        summary: 'Xem màn hình điện thoại trực tiếp trong tab web mà không cần cài app máy tính.',
        desc: 'Kênh truyền hình ảnh trực tiếp qua giao thức WebUSB/WebSocket ngay trên giao diện web toolkit.',
        adbCommand: 'Truyền dữ liệu màn hình qua WebUSB canvas render',
        impact: 'Xem nhanh thông báo và giao diện máy khi không có phần mềm Scrcpy.',
        safety: 'An Toàn Tuyệt Đối',
        recommended: true,
        type: 'action',
        actionLabel: 'Mở Web Mirror',
        onExecute: onOpenWebMirror,
      },
      {
        id: 'sys_screenshot',
        category: 'screen',
        categoryLabel: 'Chụp Màn Hình',
        title: 'Chụp Ảnh Màn Hình Nhanh (PNG Lossless)',
        scope: 'screencap -p /sdcard/screenshot.png',
        summary: 'Chụp ảnh màn hình điện thoại tức thì và tải tự động về máy tính.',
        desc: 'Chụp khung hình chất lượng nguyên bản không nén từ framebuffer và tải file .png về máy tính.',
        adbCommand: 'adb shell screencap -p /sdcard/screenshot.png && adb pull /sdcard/screenshot.png',
        impact: 'Lưu nhanh bằng chứng lỗi hoặc chia sẻ màn hình rõ nét.',
        safety: 'An Toàn Tuyệt Đối',
        recommended: true,
        type: 'action',
        actionLabel: isCapturingScreenshot ? 'Đang chụp...' : 'Chụp Màn Hình',
        onExecute: handleScreenshot,
        loading: isCapturingScreenshot,
      },
      {
        id: 'sys_screen_record',
        category: 'screen',
        categoryLabel: 'Quay Màn Hình',
        title: isRecording ? `Đang Ghi Màn Hình (${recordSeconds}s)` : 'Ghi Video Màn Hình MP4 (180s)',
        scope: 'screenrecord --time-limit 180',
        summary: isRecording ? 'Đang quay video màn hình nền... Bấm dừng để tải file MP4.' : 'Quay video màn hình chất lượng cao trực tiếp qua ADB.',
        desc: 'Ghi lại mọi thao tác trên màn hình với độ phân giải cao và tốc độ khung hình mượt mà, tự động tải file MP4 về máy khi kết thúc.',
        adbCommand: 'adb shell screenrecord --time-limit 180 /sdcard/record.mp4',
        impact: 'Quay video bug báo cáo hoặc hướng dẫn thao tác chi tiết.',
        safety: 'An Toàn Tuyệt Đối',
        recommended: true,
        type: 'action',
        actionLabel: isRecording ? `Dừng Ghi (${recordSeconds}s)` : 'Bắt Đầu Ghi MP4',
        onExecute: handleToggleRecord,
      }
    );

    // --- GROUP 6: SYSTEM & PERFORMANCE (5 Items) ---
    list.push(
      {
        id: 'sys_wifi_adb',
        category: 'system',
        categoryLabel: 'Hệ Thống',
        title: 'Bật Kết Nối Wi-Fi Không Dây (Wireless ADB Port 5555)',
        scope: 'adb tcpip 5555',
        summary: 'Mở cổng 5555 để kết nối điều khiển điện thoại qua mạng Wi-Fi không cần cáp.',
        desc: 'Mở port TCP/IP 5555 trên điện thoại, tự động quét địa chỉ IP nội mạng của máy và kết nối không dây, cho phép rút cáp USB mà vẫn thao tác mượt mà.',
        adbCommand: 'adb tcpip 5555 && adb connect <device_ip>:5555',
        impact: 'Thoải mái di chuyển điện thoại trong phòng làm việc mà không vướng dây cáp.',
        safety: 'Cổng 5555 chỉ mở trong mạng Wi-Fi gia đình an toàn',
        recommended: true,
        type: 'action',
        actionLabel: isSettingWireless ? 'Đang mở...' : 'Mở Wi-Fi ADB',
        onExecute: handleWirelessConnect,
        loading: isSettingWireless,
      },
      {
        id: 'sys_aot_compile',
        category: 'system',
        categoryLabel: 'Hiệu Năng',
        title: 'Trình Biên Dịch Native AOT (dex2oat 65+ Ứng Dụng)',
        scope: 'cmd package compile -m everything -f',
        summary: 'Ép CPU biên dịch toàn bộ bytecode Java thành mã máy Native chạy siêu tốc.',
        desc: 'Chạy engine dex2oat của Android với cờ `-m everything -f`, biên dịch trước toàn bộ 65+ ứng dụng phổ biến tại Việt Nam (Zalo, Facebook, TikTok, VNeID, Ngân hàng) thành mã máy native 64-bit.',
        adbCommand: 'adb shell cmd package compile -m everything -f <package>',
        impact: 'Thời gian mở ứng dụng nhanh gấp đôi, triệt tiêu hoàn toàn giật lag khung hình khi cuộn.',
        safety: 'Cơ chế tối ưu hóa chính thức của Android Runtime (ART)',
        recommended: true,
        type: 'action',
        actionLabel: 'Biên Dịch Native ART',
        onExecute: onCompileApps,
      },
      {
        id: 'sys_weather_celsius',
        category: 'system',
        categoryLabel: 'Hệ Thống',
        title: 'Chuyển App Thời Tiết Sang Độ C (Weather en-GB Fix)',
        scope: 'pm set-app-locales com.hihonor.totemweather en-GB',
        summary: 'Sửa lỗi app thời tiết nội địa bị kẹt độ F hoặc hiển thị tiếng Trung.',
        desc: 'Gán locale của ứng dụng Thời Tiết gốc (totemweather) sang chuẩn Anh Quốc `en-GB`, tự động khóa đơn vị đo nhiệt độ sang Độ C và hiển thị tiếng Anh chuẩn xác.',
        adbCommand: 'adb shell cmd locale set-app-locales com.hihonor.totemweather --locales en-GB',
        impact: 'Giao diện thời tiết chuẩn quốc tế, hiển thị độ C rõ ràng.',
        safety: 'An Toàn Tuyệt Đối',
        recommended: true,
        type: 'action',
        actionLabel: 'Chuyển Độ C',
        onExecute: onFixWeather,
      },
      {
        id: 'sys_battery_calib',
        category: 'system',
        categoryLabel: 'Hệ Thống',
        title: 'Cân Chỉnh Pin & Xóa Cache Thống Kê (Battery Stats Reset)',
        scope: 'dumpsys batterystats --reset',
        summary: 'Reset dữ liệu chu kỳ pin cũ để hệ điều hành nhận diện đúng dung lượng thực.',
        desc: 'Xóa tệp thống kê pin tích lũy lâu ngày của Android, ép thuật toán BatteryManager học lại ngưỡng sạc đầy 100% và ngưỡng ngắt nguồn 0%, khắc phục tình trạng pin ảo hoặc sụt pin nhanh.',
        adbCommand: 'adb shell dumpsys batterystats --reset',
        impact: 'Phần trăm pin hiển thị chuẩn xác, kéo dài thời gian sử dụng thực tế.',
        safety: 'An Toàn Tuyệt Đối',
        recommended: true,
        type: 'action',
        actionLabel: 'Cân Chỉnh Pin',
        onExecute: handleCalibrateBattery,
      },
      {
        id: 'sys_reboot_menu',
        category: 'system',
        categoryLabel: 'Hệ Thống',
        title: 'Trung Tâm Khởi Động Lại Nhanh (Reboot / Fastboot / Recovery)',
        scope: 'adb reboot [bootloader | recovery]',
        summary: 'Lệnh khởi động lại máy vào các phân vùng hệ thống chỉ với 1 click.',
        desc: 'Hỗ trợ khởi động lại thiết bị bình thường, hoặc vào thẳng chế độ nạp ROM Fastboot / chế độ cứu hộ Recovery mà không cần bấm giữ phím cứng phức tạp.',
        adbCommand: 'adb reboot\nadb reboot bootloader\nadb reboot recovery',
        impact: 'Cứu hộ và bảo trì thiết bị nhanh chóng.',
        safety: 'An Toàn',
        recommended: false,
        type: 'reboot_controls',
      }
    );

    return list;
  }, [
    magicTweaks,
    loadingTweakKey,
    selectedTelemetryKeys,
    quickExtracting,
    customPlayStoreUrl,
    turnOffScreen,
    stayAwake,
    isSettingWireless,
    isRecording,
    recordSeconds,
    isCapturingScreenshot,
  ]);

  // Telemetry Blocked Count
  const telemetryBlockedCount = useMemo(() => {
    if (!magicTweaks?.marketing_all_disabled?.details) return 0;
    return Object.values(magicTweaks.marketing_all_disabled.details).filter((v) => v === '0').length;
  }, [magicTweaks]);

  // 6 Grand Master Hub Modules
  const masterModules = useMemo(
    () => [
      {
        id: 'tweaks',
        title: 'Cài Đặt Ẩn MagicOS',
        subtitle: '8 Tinh Chỉnh Cốt Lõi Hệ Thống',
        badge: 'Non-Root An Toàn',
        badgeType: 'tag-safe',
        desc: 'Kích hoạt Siêu sạc nhanh khi mở màn hình (Charge Turbo), Âm lượng Bluetooth vô cực, Khóa 120Hz không tụt, và Động cơ hiển thị Thiên Sơn Oasis bảo vệ mắt.',
        icon: (
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
          </svg>
        ),
        countLabel: '8 Tinh Chỉnh',
      },
      {
        id: 'telemetry',
        title: 'Khóa 11 Telemetry & Tiếp Thị',
        subtitle: 'Xóa Sạch Quảng Cáo & Tracking Ngầm',
        badge: `Đã Chặn ${telemetryBlockedCount}/11`,
        badgeType: telemetryBlockedCount >= 10 ? 'tag-safe' : 'tag-warn',
        desc: 'Chặn toàn bộ banner quảng cáo trong app hệ thống, ngắt engine AI đọc trộm tin nhắn SMS / OTP ngân hàng, chặn định vị GPS nhắm mục tiêu và tắt log cloud.',
        icon: (
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        ),
        countLabel: '11 Khóa Secure',
      },
      {
        id: 'google',
        title: 'Google GMS & Trợ Lý Ảo Gemini',
        subtitle: 'Chuẩn Hóa Máy Quốc Tế',
        badge: 'Google Play Store',
        badgeType: 'tag-safe',
        desc: 'Mở khóa khung dịch vụ Google Framework tích hợp sẵn trong ROM, tự động cào link cài CH Play mới nhất từ APKMirror và gán Google Gemini làm trợ lý mặc định thay thế YOYO.',
        icon: (
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
            <line x1="12" y1="19" x2="12" y2="22"></line>
          </svg>
        ),
        countLabel: '4 Công Cụ GMS',
      },
      {
        id: 'theme',
        title: 'TP Theme Studio VIP',
        subtitle: 'Sở Hữu Theme Vĩnh Viễn Không Rác',
        badge: 'Chuẩn .hnt Vĩnh Viễn',
        badgeType: 'tag-safe',
        desc: 'Công nghệ độc quyền: Trích xuất theme VIP dùng thử 5 phút thành file chuẩn .hnt nạp vĩnh viễn vào app Chủ Đề hệ thống, hỗ trợ kéo thả nạp theme từ máy tính.',
        icon: (
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M14.31 8l5.74 9.94M9.69 8h11.48M7.38 12l5.74-9.94M9.69 16L3.95 6.06M14.31 16H2.83m13.79-4l-5.74 9.94"></path>
          </svg>
        ),
        countLabel: '2 Tiện Ích Theme',
      },
      {
        id: 'screen',
        title: 'Chiếu Màn Hình & Scrcpy 120Hz',
        subtitle: 'Điều Khiển Chuột & Phím Siêu Mượt',
        badge: '120 FPS • < 30ms',
        badgeType: 'tag-safe',
        desc: 'Khởi chạy Scrcpy điều khiển điện thoại bằng chuột/phím máy tính với độ trễ siêu thấp, xem màn hình trực tiếp trong trình duyệt, chụp ảnh PNG và quay video MP4.',
        icon: (
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
            <line x1="8" y1="21" x2="16" y2="21"></line>
            <line x1="12" y1="17" x2="12" y2="21"></line>
          </svg>
        ),
        countLabel: '4 Tiện Ích Màn Hình',
      },
      {
        id: 'system',
        title: 'Hiệu Năng & Hệ Thống',
        subtitle: 'Biên Dịch Native ART & Wi-Fi ADB',
        badge: 'dex2oat 65+ App',
        badgeType: 'tag-safe',
        desc: 'Biên dịch trước bytecode thành mã máy Native 64-bit cho 65+ ứng dụng Việt Nam (Zalo, Facebook, TikTok, Ngân hàng), mở kết nối Wi-Fi ADB cổng 5555 và cân chỉnh pin.',
        icon: (
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
            <rect x="9" y="9" width="6" height="6"></rect>
            <line x1="9" y1="1" x2="9" y2="4"></line>
            <line x1="15" y1="1" x2="15" y2="4"></line>
            <line x1="9" y1="20" x2="9" y2="23"></line>
            <line x1="15" y1="20" x2="15" y2="23"></line>
          </svg>
        ),
        countLabel: '5 Trình Bảo Trì',
      },
    ],
    [telemetryBlockedCount]
  );

  const activeModuleMeta = useMemo(() => {
    return masterModules.find((m) => m.id === activeModule);
  }, [masterModules, activeModule]);

  // Tools in the active module view
  const currentModuleTools = useMemo(() => {
    if (!activeModule) return [];
    return allTools.filter((t) => t.category === activeModule);
  }, [allTools, activeModule]);

  // Tools in global search mode
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return allTools.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.scope.toLowerCase().includes(q) ||
        item.categoryLabel.toLowerCase().includes(q)
    );
  }, [allTools, searchQuery]);

  return (
    <div className="crm-workspace-layout">
      {/* =========================================================================
          VIEW A: MASTER HUB LAUNCHPAD (When activeModule === null and not searching)
          ========================================================================= */}
      {activeModule === null && !searchQuery.trim() && (
        <>
          {/* Header & KPI Summary */}
          <div className="specs-card" style={{ width: '100%', marginBottom: 0 }}>
            <div className="specs-header-title">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="svg-icon" style={{ color: 'var(--brand-accent)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                  </svg>
                </span>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-bright)' }}>
                    Hộp Công Cụ Chuyên Sâu &amp; Tinh Chỉnh Hệ Thống MagicOS
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>
                    Trung tâm điều khiển phân tầng: Chọn bất kỳ thẻ chức năng nào bên dưới để mở giao diện cấu hình chuyên biệt
                  </div>
                </div>
              </div>

              {/* Fast Search input */}
              <div style={{ position: 'relative', width: '260px' }}>
                <input
                  type="text"
                  className="tool-input"
                  placeholder="Tìm kiếm công cụ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: '100%', paddingLeft: '32px', height: '32px', fontSize: '11.5px' }}
                />
                <svg
                  viewBox="0 0 24 24"
                  width="13"
                  height="13"
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="2"
                  style={{ position: 'absolute', left: '10px', top: '9px', pointerEvents: 'none' }}
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </div>
            </div>

            {/* 4 Quick KPI Capsules */}
            <div className="metric-capsule-grid" style={{ marginTop: '14px' }}>
              <div className="metric-capsule">
                <span className="metric-capsule-label">Cài Đặt Ẩn MagicOS</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <span className="metric-capsule-value" style={{ color: '#38bdf8' }}>
                    8/8 Tinh Chỉnh
                  </span>
                  <span className="badge-tag tag-safe" style={{ fontSize: '9px', padding: '1px 5px' }}>
                    Sẵn Sàng
                  </span>
                </div>
                <span className="metric-capsule-sub">Turbo Charge • Bluetooth Vô Cực • Khóa 120Hz</span>
              </div>

              <div className="metric-capsule">
                <span className="metric-capsule-label">Khóa Telemetry &amp; Marketing</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <span className="metric-capsule-value" style={{ color: telemetryBlockedCount >= 10 ? '#10b981' : '#f59e0b' }}>
                    Đã chặn {telemetryBlockedCount}/11
                  </span>
                  <span className="badge-tag tag-safe" style={{ fontSize: '9px', padding: '1px 5px' }}>
                    Secure Table
                  </span>
                </div>
                <span className="metric-capsule-sub">Xóa sạch tracking, bảo vệ tin nhắn OTP ngân hàng</span>
              </div>

              <div className="metric-capsule">
                <span className="metric-capsule-label">Trợ Lý AI &amp; GMS</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <span className="metric-capsule-value" style={{ color: '#a855f7' }}>
                    Google Gemini
                  </span>
                  <span className="badge-tag tag-safe" style={{ fontSize: '9px', padding: '1px 5px' }}>
                    Thay YOYO
                  </span>
                </div>
                <span className="metric-capsule-sub">GMS Framework • Tự động cào link CH Play</span>
              </div>

              <div className="metric-capsule">
                <span className="metric-capsule-label">Hiệu Năng &amp; Điều Khiển</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <span className="metric-capsule-value" style={{ color: '#10b981' }}>
                    Scrcpy 120Hz
                  </span>
                  <span className="badge-tag tag-safe" style={{ fontSize: '9px', padding: '1px 5px' }}>
                    Native ART
                  </span>
                </div>
                <span className="metric-capsule-sub">Biên dịch 65+ ứng dụng • Wi-Fi ADB cổng 5555</span>
              </div>
            </div>
          </div>

          {/* 6 Grand Master Functional Tiles */}
          <div className="crm-hub-grid">
            {masterModules.map((mod) => (
              <div
                key={mod.id}
                className="crm-hub-tile"
                onClick={() => setActiveModule(mod.id)}
              >
                <div>
                  <div className="crm-hub-tile-header">
                    <div className="crm-hub-icon-container">{mod.icon}</div>
                    <span className={`badge-tag ${mod.badgeType}`} style={{ fontSize: '10px', padding: '2px 8px' }}>
                      {mod.badge}
                    </span>
                  </div>

                  <div style={{ marginTop: '14px' }}>
                    <div className="crm-hub-tile-title">{mod.title}</div>
                    <div className="crm-hub-tile-subtitle">{mod.subtitle}</div>
                    <div className="crm-hub-tile-desc" style={{ marginTop: '8px' }}>
                      {mod.desc}
                    </div>
                  </div>
                </div>

                <div className="crm-hub-tile-footer">
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {mod.countLabel}
                  </span>
                  <div className="crm-hub-action-prompt">
                    <span>Mở Cấu Hình</span>
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* =========================================================================
          VIEW B: GLOBAL SEARCH RESULTS VIEW (When searchQuery is non-empty)
          ========================================================================= */}
      {searchQuery.trim() && (
        <div className="crm-slide-workspace">
          <div className="specs-card" style={{ width: '100%', marginBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-bright)' }}>
                  Kết Quả Tìm Kiếm: "{searchQuery}"
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>
                  Tìm thấy {searchResults.length} công cụ phù hợp trên toàn hệ thống
                </div>
              </div>
              <button
                type="button"
                className="btn-tool"
                onClick={() => setSearchQuery('')}
                style={{ fontSize: '11.5px', padding: '5px 12px' }}
              >
                Xóa Tìm Kiếm &amp; Trở Về
              </button>
            </div>
          </div>

          <div className="crm-grid-matrix">
            {searchResults.map((item) => (
              <div
                key={item.id}
                className="crm-card"
                onClick={() => setInspectTool(item)}
              >
                <div className="crm-card-header">
                  <div className="crm-card-title-group">
                    <div>
                      <div className="crm-card-title">{item.title}</div>
                      <div className="crm-card-meta">
                        <span className="badge-tag tag-neutral" style={{ fontSize: '9px' }}>
                          {item.categoryLabel}
                        </span>
                        <span className="badge-tag tag-safe" style={{ fontSize: '9px', fontFamily: 'var(--font-mono)' }}>
                          {item.scope}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="crm-inspect-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setInspectTool(item);
                    }}
                  >
                    <span>Xem Chi Tiết</span>
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </button>
                </div>
                <div className="crm-card-desc">{item.summary}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW C: DEDICATED SLIDE-OUT WORKSPACE (When a Master Card is Clicked)
          ========================================================================= */}
      {activeModule !== null && !searchQuery.trim() && activeModuleMeta && (
        <div className="crm-slide-workspace-left">
          {/* Top Breadcrumb & Tiered Navigation Bar (Nhạc Quán / Salesforce Console Tiered Style) */}
          <div className="specs-card" style={{ width: '100%', marginBottom: 0, padding: '16px 20px' }}>
            <div className="crm-top-breadcrumb-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                {/* Back Button */}
                <button
                  type="button"
                  className="crm-back-button"
                  onClick={() => setActiveModule(null)}
                  title="Quay về Tầng 1: Tổng Quan (Phím ESC)"
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                  <span>Trở Về Tầng 1</span>
                </button>

                {/* Tiered Navigator Capsule (Xếp Tầng Chuyên Nghiệp) */}
                <div className="crm-tier-navigator">
                  <button
                    type="button"
                    className="crm-tier-link-btn"
                    onClick={() => setActiveModule(null)}
                    title="Quay lại Tầng 1: Tổng Quan"
                  >
                    <span>TẦNG 1: TỔNG QUAN</span>
                  </button>
                  <span className="crm-tier-divider">
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </span>
                  <div className="crm-tier-badge">
                    <span>TẦNG 2: {activeModuleMeta.title.toUpperCase()}</span>
                  </div>
                </div>
              </div>

              {/* Right Side: Live ADB Indicator & Bulk Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.25)', fontSize: '11px', color: '#10b981', fontWeight: 600 }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 6px #10b981' }} />
                  <span>ADB: MagicOS 10/11</span>
                </div>

                {activeModule === 'telemetry' && (
                  <>
                    <button
                      type="button"
                      className="btn-tool"
                      style={{ fontSize: '11px', padding: '5px 10px' }}
                      onClick={() => setSelectedTelemetryKeys(new Set(TELEMETRY_DEFINITIONS.map((d) => d.key)))}
                    >
                      Chọn Tất Cả (11)
                    </button>
                    <button
                      type="button"
                      className="btn-tool"
                      style={{ fontSize: '11px', padding: '5px 10px' }}
                      onClick={() => setSelectedTelemetryKeys(new Set())}
                    >
                      Bỏ Chọn
                    </button>
                    <button
                      type="button"
                      className="btn-tool success"
                      style={{ fontSize: '11px', padding: '5px 12px', fontWeight: 600 }}
                      onClick={() => handleApplySelectedTelemetry(true)}
                      disabled={!isOnline || isApplyingTelemetry}
                    >
                      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '4px' }}>
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                      </svg>
                      <span>Chặn Tất Cả 11 Mục</span>
                    </button>
                  </>
                )}

                {activeModule === 'screen' && (
                  <button
                    type="button"
                    className="btn-tool primary"
                    style={{ fontSize: '11px', padding: '5px 12px', fontWeight: 600 }}
                    onClick={() => onLaunchScrcpy({ turnOffScreen, stayAwake })}
                    disabled={!isOnline}
                  >
                    Khởi Chạy Scrcpy 120Hz
                  </button>
                )}

                {activeModule === 'theme' && (
                  <button
                    type="button"
                    className="btn-tool primary"
                    style={{ fontSize: '11px', padding: '5px 12px', fontWeight: 600 }}
                    onClick={() => setIsThemeStudioOpen(true)}
                  >
                    Mở Trình Quản Lý Theme
                  </button>
                )}
              </div>
            </div>

            <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '8px', lineHeight: '1.5' }}>
              {activeModuleMeta.desc}
            </div>
          </div>

          {/* Dedicated High-Density Cards for this specific tool */}
          <div className="crm-grid-matrix">
            {currentModuleTools.map((item) => (
              <div
                key={item.id}
                className={`crm-card ${inspectTool?.id === item.id ? 'active-selected' : ''}`}
                onClick={() => setInspectTool(item)}
              >
                <div className="crm-card-header">
                  <div className="crm-card-title-group">
                    {/* Checkbox for Telemetry */}
                    {item.type === 'telemetry_item' && (
                      <div
                        style={{ paddingTop: '2px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleSelectTelemetry(item.key);
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={item.isSelected}
                          onChange={() => handleToggleSelectTelemetry(item.key)}
                          style={{ cursor: 'pointer', width: '15px', height: '15px' }}
                        />
                      </div>
                    )}

                    <div>
                      <div className="crm-card-title">{item.title}</div>
                      <div className="crm-card-meta">
                        <span className="badge-tag tag-neutral" style={{ fontSize: '9px', padding: '1px 5px' }}>
                          {item.categoryLabel}
                        </span>
                        <span className="badge-tag tag-safe" style={{ fontSize: '9px', padding: '1px 5px' }}>
                          {item.safety || 'An Toàn'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Right Action / Switch */}
                  <div onClick={(e) => e.stopPropagation()}>
                    {item.type === 'toggle' && (
                      <label className="magicos-switch">
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={item.onToggle}
                          disabled={!isOnline || item.loading}
                        />
                        <span className="magicos-slider"></span>
                      </label>
                    )}

                    {item.type === 'telemetry_item' && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                        <span
                          className={`badge-tag ${item.isBlocked ? 'tag-safe' : 'tag-warn'}`}
                          style={{ fontSize: '9px', padding: '1px 5px' }}
                        >
                          {item.isBlocked ? 'Đã Chặn' : 'Đang Mở'}
                        </span>
                        <label className="magicos-switch">
                          <input
                            type="checkbox"
                            checked={!item.isBlocked}
                            onChange={() => handleToggleSingleTelemetry(item.key)}
                            disabled={!isOnline || loadingTweakKey === item.key}
                          />
                          <span className="magicos-slider"></span>
                        </label>
                      </div>
                    )}

                    {item.type === 'action' && (
                      <button
                        type="button"
                        className="btn-tool primary"
                        style={{ fontSize: '11px', padding: '4px 10px', whiteSpace: 'nowrap' }}
                        onClick={item.onExecute}
                        disabled={!isOnline || item.loading}
                      >
                        {item.actionLabel}
                      </button>
                    )}

                    {item.type === 'reboot_controls' && (
                      <span className="badge-tag tag-warn" style={{ fontSize: '10px' }}>
                        Khởi Động Lại
                      </span>
                    )}
                  </div>
                </div>

                {/* Plain-Language Explanation */}
                <div className="crm-card-desc">{item.summary}</div>

                {/* Collapsible Technical ADB Command for Geeks */}
                {item.adbCommand && (
                  <details
                    className="crm-tech-accordion"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <summary>Xem lệnh kỹ thuật ADB Shell</summary>
                    <div style={{ padding: '8px 10px' }}>
                      <div className="crm-code-box" style={{ fontSize: '11px' }}>
                        {item.adbCommand}
                      </div>
                    </div>
                  </details>
                )}

                <div className="crm-card-footer">
                  <span style={{ color: 'var(--text-muted)' }}>
                    {item.impact || 'Bấm để xem thông số & tác động'}
                  </span>
                  <button
                    type="button"
                    className="crm-inspect-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setInspectTool(item);
                    }}
                  >
                    <span>Giải phẫu chi tiết</span>
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          SLIDE-OVER INSPECTION DRAWER (For Deep Technical Breakdown)
          ========================================================================= */}
      {inspectTool && (
        <>
          <div className="crm-drawer-backdrop" onClick={() => setInspectTool(null)} />
          <div className="crm-drawer-panel">
            <div className="crm-drawer-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="badge-tag tag-safe" style={{ fontSize: '10.5px' }}>
                  {inspectTool.categoryLabel}
                </span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-bright)' }}>
                  Giải Phẫu Kỹ Thuật
                </span>
              </div>
              <button
                type="button"
                className="crm-drawer-close"
                onClick={() => setInspectTool(null)}
                title="Đóng (ESC)"
              >
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="crm-drawer-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', lineHeight: '1.3' }}>
                  {inspectTool.title}
                </div>
                <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>
                  Phạm vi: {inspectTool.scope}
                </div>
              </div>

              {/* Special options for Scrcpy */}
              {inspectTool.id === 'sys_scrcpy_mirror' && (
                <div className="crm-drawer-section">
                  <div className="crm-drawer-section-title">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                      <line x1="8" y1="21" x2="16" y2="21"></line>
                      <line x1="12" y1="17" x2="12" y2="21"></line>
                    </svg>
                    <span>Cấu hình phiên Scrcpy</span>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px' }}>
                      <input
                        type="checkbox"
                        checked={turnOffScreen}
                        onChange={(e) => setTurnOffScreen(e.target.checked)}
                      />
                      <span>Tắt màn hình điện thoại khi chiếu</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px' }}>
                      <input
                        type="checkbox"
                        checked={stayAwake}
                        onChange={(e) => setStayAwake(e.target.checked)}
                      />
                      <span>Luôn sáng màn hình</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Special options for Reboot */}
              {inspectTool.type === 'reboot_controls' && (
                <div className="crm-drawer-section">
                  <div className="crm-drawer-section-title">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="23 4 23 10 17 10"></polyline>
                      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                    </svg>
                    <span>Lựa chọn phân vùng khởi động</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn-tool"
                      onClick={() => onReboot('system')}
                      disabled={!isOnline}
                      style={{ flex: 1, minWidth: '120px' }}
                    >
                      Khởi Động Lại Máy
                    </button>
                    <button
                      type="button"
                      className="btn-tool"
                      onClick={() => onReboot('bootloader')}
                      disabled={!isOnline}
                      style={{ flex: 1, minWidth: '120px' }}
                    >
                      Vào Fastboot
                    </button>
                    <button
                      type="button"
                      className="btn-tool"
                      onClick={() => onReboot('recovery')}
                      disabled={!isOnline}
                      style={{ flex: 1, minWidth: '120px' }}
                    >
                      Vào Recovery
                    </button>
                  </div>
                </div>
              )}

              {/* Technical Description */}
              <div className="crm-drawer-section">
                <div className="crm-drawer-section-title">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                  <span>Mục đích &amp; Cơ chế hoạt động</span>
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--text-main)', lineHeight: '1.6' }}>
                  {inspectTool.desc}
                </div>
              </div>

              {/* Exact ADB Command */}
              {inspectTool.adbCommand && (
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
                        navigator.clipboard.writeText(inspectTool.adbCommand);
                        alert('Đã sao chép lệnh ADB vào clipboard!');
                      }}
                    >
                      Sao Chép
                    </button>
                  </div>
                  <div className="crm-code-box">{inspectTool.adbCommand}</div>
                </div>
              )}

              {/* Impact */}
              {inspectTool.impact && (
                <div className="crm-drawer-section" style={{ borderLeft: '3px solid #38bdf8' }}>
                  <div className="crm-drawer-section-title" style={{ color: '#38bdf8' }}>
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                    </svg>
                    <span>Lợi ích thực tế</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-main)', lineHeight: '1.5' }}>
                    {inspectTool.impact}
                  </div>
                </div>
              )}

              {/* Safety Rating */}
              {inspectTool.safety && (
                <div className="crm-drawer-section" style={{ borderLeft: '3px solid #10b981' }}>
                  <div className="crm-drawer-section-title" style={{ color: '#10b981' }}>
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    </svg>
                    <span>Mức độ an toàn</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-dim)', lineHeight: '1.4' }}>
                    {inspectTool.safety}
                  </div>
                </div>
              )}
            </div>

            <div className="crm-drawer-footer">
              <button
                type="button"
                className="btn-tool"
                onClick={() => setInspectTool(null)}
                style={{ fontSize: '12px' }}
              >
                Đóng
              </button>

              {inspectTool.type === 'action' && (
                <button
                  type="button"
                  className="btn-tool primary"
                  onClick={() => {
                    inspectTool.onExecute?.();
                    setInspectTool(null);
                  }}
                  disabled={!isOnline || inspectTool.loading}
                  style={{ fontSize: '12px', fontWeight: 600 }}
                >
                  Thực Thi Ngay
                </button>
              )}

              {inspectTool.type === 'telemetry_item' && (
                <button
                  type="button"
                  className={`btn-tool ${inspectTool.isBlocked ? '' : 'success'}`}
                  onClick={() => handleToggleSingleTelemetry(inspectTool.key)}
                  disabled={!isOnline || loadingTweakKey === inspectTool.key}
                  style={{ fontSize: '12px', fontWeight: 600 }}
                >
                  {inspectTool.isBlocked ? 'Khôi Phục Mở Lại (= 1)' : 'Chặn Ngay Khóa Này (= 0)'}
                </button>
              )}

              {inspectTool.type === 'toggle' && (
                <button
                  type="button"
                  className="btn-tool primary"
                  onClick={() => {
                    inspectTool.onToggle?.();
                    setInspectTool(null);
                  }}
                  disabled={!isOnline || inspectTool.loading}
                  style={{ fontSize: '12px', fontWeight: 600 }}
                >
                  Đổi Trạng Thái
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* Floating Action Dock when Telemetry keys are selected */}
      {selectedTelemetryKeys.size > 0 && activeModule === 'telemetry' && (
        <div className="crm-floating-dock">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge-tag tag-safe" style={{ fontSize: '11px', fontWeight: 600 }}>
              Đã chọn {selectedTelemetryKeys.size}/11 khóa
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="btn-tool success"
              style={{ fontSize: '11.5px', padding: '5px 14px', fontWeight: 600 }}
              onClick={() => handleApplySelectedTelemetry(true)}
              disabled={!isOnline || isApplyingTelemetry}
            >
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '5px' }}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                <polyline points="9 12 11 14 15 10"></polyline>
              </svg>
              <span>Chặn {selectedTelemetryKeys.size} Khóa (= 0)</span>
            </button>

            <button
              type="button"
              className="btn-tool"
              style={{ fontSize: '11px', padding: '5px 10px' }}
              onClick={() => handleApplySelectedTelemetry(false)}
              disabled={!isOnline || isApplyingTelemetry}
            >
              <span>Khôi Phục (= 1)</span>
            </button>

            <button
              type="button"
              className="btn-tool"
              style={{ fontSize: '11px', padding: '5px 8px' }}
              onClick={() => setSelectedTelemetryKeys(new Set())}
              title="Bỏ chọn tất cả"
            >
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Screen recording result notification */}
      {recordingResult && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1200, width: '380px' }}>
          <div className="specs-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid rgba(56, 189, 248, 0.4)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
            <div className="specs-header-title" style={{ padding: '10px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="svg-icon" style={{ color: '#10b981' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </span>
                <span style={{ fontWeight: 600, fontSize: '13px' }}>Đã Quay Xong Màn Hình</span>
              </div>
              <button
                type="button"
                className="btn-tool"
                style={{ padding: '4px 8px' }}
                onClick={() => setRecordingResult(null)}
              >
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-bright)' }}>
                Tên file: <code>{recordingResult.filename}</code> • Dung lượng: <b>{recordingResult.size_mb} MB</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <a
                  href={recordingResult.url}
                  download={recordingResult.filename}
                  className="btn-tool primary"
                  style={{ textDecoration: 'none', padding: '6px 14px', fontSize: '12px' }}
                >
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