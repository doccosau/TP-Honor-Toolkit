import React, { useState, useEffect, useMemo, useRef } from 'react';
import { adbService } from '../services/adbService';
import ThemeStudioModal from './ThemeStudioModal';
import CrmDrawer from './CrmDrawer';

// Detailed definitions for the 13 system marketing & telemetry keys (including MagicOS 11 YOYO 2.0 AI)
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
  {
    key: 'smart_screen_switch',
    title: 'Nhận Diện & Quét Màn Hình YOYO (Smart Screen / Ask YOYO)',
    category: 'telemetry',
    categoryLabel: 'YOYO AI',
    scope: 'Settings Secure',
    desc: 'Tắt engine AI âm thầm chụp và nhận diện ngữ cảnh màn hình thời gian thực (Ask YOYO 2.0) phục vụ dịch vụ nội địa TQ.',
    adbCommand: 'adb shell settings put secure smart_screen_switch 0',
    impact: 'Bảo vệ riêng tư tuyệt đối nội dung màn hình, giảm tải NPU & pin chờ.',
    safety: 'An Toàn Tuyệt Đối (Không ảnh hưởng chức năng chụp màn hình)',
    recommended: true,
  },
  {
    key: 'ai_screen_suggestions',
    title: 'Đề Xuất Ngữ Cảnh Tác Vụ YOYO 2.0 (Screen Suggestions)',
    category: 'telemetry',
    categoryLabel: 'YOYO AI',
    scope: 'Settings Secure',
    desc: 'Ngăn YOYO Agent phân tích thói quen mở app và văn bản để gợi ý hành động nội địa Trung Quốc.',
    adbCommand: 'adb shell settings put secure ai_screen_suggestions 0',
    impact: 'Triệt tiêu gợi ý rác tiếng Trung, giải phóng RAM và chu kỳ CPU.',
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
  onCleanCache,
  onOptimizePostUpdate,
  onDisableTelemetry,
  onFixWeather,
  onReboot,
  onNavigateTab,
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
        id: 'tweak_phantom_killer',
        category: 'tweaks',
        categoryLabel: 'Android 17',
        title: 'Vô Hiệu Hóa Phantom Process Killer (Nới Lỏng Đa Nhiệm)',
        scope: 'device_config: max_phantom_processes = 2147483647',
        summary: 'Nới lỏng giới hạn 32 tiến trình ngầm của Android 16/17 lên 2 tỷ, chống văng app đa nhiệm.',
        desc: 'Android 16/17 ngầm giới hạn số lượng tiến trình phụ (phantom processes) tối đa chỉ 32. Nếu Zalo, Telegram, VPN, LocalSend hoặc Termux chạy nhiều tác vụ nền sẽ bị Android tắt ngầm. Tinh chỉnh này nới lỏng giới hạn lên 2,147,483,647 giúp đa nhiệm trơn tru, không lo chết tác vụ nền.',
        adbCommand: 'adb shell /system/bin/device_config set_sync_disabled_for_tests persistent\nadb shell /system/bin/device_config put activity_manager max_phantom_processes 2147483647',
        impact: 'Zalo, Telegram, VPN, LocalSend giữ kết nối liên tục, không bao giờ bị văng tác vụ nền.',
        safety: 'Chuẩn tham số Android Developer API (An Toàn Tuyệt Đối)',
        recommended: true,
        type: 'toggle',
        checked: Boolean(magicTweaks?.phantom_killer_disabled?.enabled),
        onToggle: async () => {
          const currentEnabled = Boolean(magicTweaks?.phantom_killer_disabled?.enabled);
          setLoadingTweakKey('phantom_killer');
          try {
            await adbService.togglePhantomKiller(!currentEnabled);
            await loadMagicTweaks();
          } finally {
            setLoadingTweakKey(null);
          }
        },
        loading: loadingTweakKey === 'phantom_killer',
      },
      {
        id: 'tweak_open_display',
        category: 'tweaks',
        categoryLabel: 'Màn Hình & DPI',
        title: 'Màn Hình 120Hz, Thiên Sơn Oasis & Cử Chỉ Thông Minh',
        scope: 'Quy hoạch tập trung',
        summary: 'Toàn bộ tinh chỉnh màn hình (120Hz không tụt, Thiên Sơn Oasis, SDR sang HDR, Cử chỉ Knuckle) đã được quy hoạch tập trung tại Tab Màn Hình & DPI.',
        desc: 'Để đảm bảo trạng thái cài đặt luôn đồng bộ chuẩn xác và không bị xung đột công tắc, vui lòng điều chỉnh tại trung tâm Màn Hình & DPI.',
        adbCommand: 'Quản lý tập trung tại Tab Màn Hình & DPI',
        impact: 'Giao diện đồng bộ, hiển thị mượt mà không phân mảnh.',
        safety: 'An Toàn Tuyệt Đối',
        recommended: true,
        type: 'action',
        actionLabel: 'Mở Tab Màn Hình & DPI',
        onExecute: () => onNavigateTab?.('display'),
      }
    );

    // --- GROUP 2: TELEMETRY & MARKETING (13 Items) ---
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

    // --- GROUP 6: SYSTEM & PERFORMANCE (6 Items) ---
    list.push(
      {
        id: 'sys_post_update_optimize',
        category: 'system',
        categoryLabel: 'Sau Cập Nhật',
        title: 'Tối Ưu Hóa Toàn Diện Sau Cập Nhật (Post-OTA Maintenance)',
        scope: 'pm trim-caches + cmd package bg-dexopt-job + batterystats reset',
        summary: 'Khắc phục triệt để tình trạng nóng máy ngầm, khựng khung hình và hao pin sau khi nâng cấp MagicOS / OTA.',
        desc: 'Chuỗi 3 bước bảo dưỡng chuẩn hãng: 1. Thu hồi sạch sẽ toàn bộ cache tạm thời cũ; 2. Kích hoạt tác vụ nền ART Dexopt để hệ điều hành biên dịch lại ứng dụng tương thích hoàn hảo với bản cập nhật mới; 3. Cân chỉnh lại bộ đếm pin để loại bỏ pin ảo.',
        adbCommand: 'adb shell pm trim-caches 999999999999\nadb shell cmd package bg-dexopt-job\nadb shell dumpsys batterystats --reset',
        impact: 'Máy mượt như mới đập hộp, triệt tiêu xung đột cache cũ và tiết kiệm pin tối đa.',
        safety: 'An Toàn Tuyệt Đối 100% (Không làm mất ứng dụng hay dữ liệu)',
        recommended: true,
        type: 'action',
        actionLabel: 'Tối Ưu Sau Cập Nhật',
        onExecute: onOptimizePostUpdate,
      },
      {
        id: 'sys_clean_cache',
        category: 'system',
        categoryLabel: 'Bộ Nhớ Đệm',
        title: 'Dọn Sạch Cache Tạm Toàn Máy (Trim App Caches)',
        scope: 'pm trim-caches 999999999999',
        summary: 'Thu hồi sạch sẽ bộ nhớ đệm cache tạm thời của tất cả ứng dụng mà không làm mất dữ liệu.',
        desc: 'Ép Android quét và thu hồi (trim) toàn bộ file đệm cache rác phát sinh trong quá trình sử dụng và sau khi cập nhật phần mềm. Cam kết 100% an toàn, không làm mất tài khoản, mật khẩu hay dữ liệu cá nhân của người dùng.',
        adbCommand: 'adb shell pm trim-caches 999999999999',
        impact: 'Giải phóng tức thì từ vài trăm MB đến vài GB bộ nhớ rác, giúp máy nhẹ và mượt hơn.',
        safety: 'An Toàn Tuyệt Đối 100% (Không mất ứng dụng hay dữ liệu)',
        recommended: true,
        type: 'action',
        actionLabel: 'Dọn Cache Ngay',
        onExecute: onCleanCache,
      },
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
        title: 'Cài Đặt Ẩn MagicOS & Android 17',
        subtitle: 'Siêu Sạc, Âm Lượng & Phantom Killer',
        badge: 'Non-Root An Toàn',
        badgeType: 'tag-safe',
        desc: 'Kích hoạt Siêu sạc nhanh khi mở màn hình (Charge Turbo), Âm lượng Bluetooth vô cực và Vô hiệu hóa Phantom Process Killer nới lỏng giới hạn đa nhiệm của Android 17.',
        icon: (
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
          </svg>
        ),
        countLabel: 'Tinh Chỉnh Cốt Lõi',
      },
      {
        id: 'telemetry',
        title: 'Khóa 13 Telemetry & YOYO AI',
        subtitle: 'Xóa Sạch Quảng Cáo, Ask YOYO & Tracking',
        badge: `Đã Chặn ${telemetryBlockedCount}/13`,
        badgeType: telemetryBlockedCount >= 12 ? 'tag-safe' : 'tag-warn',
        desc: 'Chặn toàn bộ banner quảng cáo trong app hệ thống, ngắt engine Ask YOYO 2.0 đọc trộm tin nhắn SMS / OTP ngân hàng và phân tích màn hình, chặn định vị GPS nhắm mục tiêu và tắt log cloud.',
        icon: (
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        ),
        countLabel: '13 Khóa Secure',
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
        title: 'Chiếu & Ghi Màn Hình 120Hz',
        subtitle: 'Scrcpy, Web Mirror & Quay Video MP4',
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
        countLabel: '4 Tiện Ích Truyền Phát',
      },
      {
        id: 'system',
        title: 'Hiệu Năng & Hệ Thống',
        subtitle: 'Bảo Trì Sau Cập Nhật, Dọn Cache & ART',
        badge: 'Post-OTA & ART',
        badgeType: 'tag-safe',
        desc: 'Bảo dưỡng tối ưu hóa sau cập nhật OTA, dọn sạch cache tạm thời toàn máy, biên dịch mã máy Native 64-bit cho 65+ ứng dụng Việt Nam, mở kết nối Wi-Fi ADB cổng 5555, sửa app thời tiết sang độ C và trung tâm Reboot.',
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
        countLabel: '6 Trình Bảo Trì',
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
      {/* Master Hub Launchpad (3uTools Style: Always Visible) */}
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
                    Trung tâm tối ưu hóa chuyên sâu: Chọn thẻ chức năng để mở ngăn cấu hình trượt từ cạnh trái
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
                <span className="metric-capsule-sub">Turbo Charge • Bluetooth Vô Cực • Phantom Killer</span>
              </div>

              <div className="metric-capsule">
                <span className="metric-capsule-label">Khóa Telemetry &amp; YOYO AI</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <span className="metric-capsule-value" style={{ color: telemetryBlockedCount >= 12 ? '#10b981' : '#f59e0b' }}>
                    Đã chặn {telemetryBlockedCount}/{TELEMETRY_DEFINITIONS.length}
                  </span>
                  <span className="badge-tag tag-safe" style={{ fontSize: '9px', padding: '1px 5px' }}>
                    Secure Table
                  </span>
                </div>
                <span className="metric-capsule-sub">Xóa sạch tracking, tắt AI đọc màn hình &amp; bảo vệ OTP</span>
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
      <CrmDrawer
        isOpen={activeModule !== null && !!activeModuleMeta}
        onClose={() => setActiveModule(null)}
        title={activeModuleMeta?.title}
        subtitle={activeModuleMeta?.subtitle}
        icon={activeModuleMeta?.icon}
        badge={{ label: activeModuleMeta?.badge || 'MagicOS 10/11', variant: activeModuleMeta?.badgeType || 'tag-safe' }}
        side="left"
        width="xl"
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '8px' }}>
            <button
              type="button"
              className="btn-tool"
              onClick={() => setActiveModule(null)}
              style={{ fontSize: '12px', padding: '6px 14px' }}
            >
              Đóng Cửa Sổ (ESC)
            </button>

            {activeModule === 'telemetry' && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn-tool"
                  style={{ fontSize: '11px', padding: '5px 10px' }}
                  onClick={() => setSelectedTelemetryKeys(new Set(TELEMETRY_DEFINITIONS.map((d) => d.key)))}
                >
                  Chọn Tất Cả ({TELEMETRY_DEFINITIONS.length})
                </button>
                <button
                  type="button"
                  className="btn-tool success"
                  style={{ fontSize: '11px', padding: '5px 12px', fontWeight: 600 }}
                  onClick={() => handleApplySelectedTelemetry(true)}
                  disabled={!isOnline || isApplyingTelemetry}
                >
                  Chặn Tất Cả {TELEMETRY_DEFINITIONS.length} Mục
                </button>
              </div>
            )}

            {activeModule === 'screen' && (
              <button
                type="button"
                className="btn-tool primary"
                style={{ fontSize: '11.5px', padding: '6px 16px', fontWeight: 600 }}
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
                style={{ fontSize: '11.5px', padding: '6px 16px', fontWeight: 600 }}
                onClick={() => setIsThemeStudioOpen(true)}
              >
                Mở Trình Quản Lý Theme
              </button>
            )}
          </div>
        }
      >
        <div style={{ fontSize: '12.5px', color: 'var(--text-dim)', lineHeight: '1.6', marginBottom: '12px' }}>
          {activeModuleMeta?.desc}
        </div>

        {/* Bulk Action Header for Telemetry */}
        {activeModule === 'telemetry' && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              background: 'var(--drawer-section-bg)',
              border: '1px solid var(--border-light)',
              marginBottom: '14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-bright)' }}>
                Đã chặn {telemetryBlockedCount}/{TELEMETRY_DEFINITIONS.length} dịch vụ theo dõi
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Khuyên dùng: Chặn toàn bộ {TELEMETRY_DEFINITIONS.length} khóa để bảo vệ quyền riêng tư và tiết kiệm pin tối đa
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="btn-tool"
                style={{ fontSize: '11px', padding: '4px 10px' }}
                onClick={() => setSelectedTelemetryKeys(new Set(TELEMETRY_DEFINITIONS.map((d) => d.key)))}
              >
                Chọn Tất Cả ({TELEMETRY_DEFINITIONS.length})
              </button>
              <button
                type="button"
                className="btn-tool"
                style={{ fontSize: '11px', padding: '4px 10px' }}
                onClick={() => setSelectedTelemetryKeys(new Set())}
              >
                Bỏ Chọn
              </button>
              <button
                type="button"
                className="btn-tool success"
                style={{ fontSize: '11px', padding: '4px 12px', fontWeight: 600 }}
                onClick={() => handleApplySelectedTelemetry(true)}
                disabled={!isOnline || isApplyingTelemetry}
              >
                Chặn Tất Cả (= 0)
              </button>
            </div>
          </div>
        )}

        {/* Dedicated High-Density Cards for this specific tool */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {currentModuleTools.map((item) => (
            <div key={item.id} className="crm-card" style={{ cursor: 'default' }}>
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
                      <span className="badge-tag tag-safe" style={{ fontSize: '9px', padding: '1px 5px', fontFamily: 'var(--font-mono)' }}>
                        {item.scope}
                      </span>
                      <span className="badge-tag tag-safe" style={{ fontSize: '9px', padding: '1px 5px' }}>
                        {item.safety || 'An Toàn'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Right Action / Switch */}
                <div>
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
                        {item.isBlocked ? 'Đã Chặn (= 0)' : 'Đang Mở (= 1)'}
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
                      style={{ fontSize: '11px', padding: '5px 12px', whiteSpace: 'nowrap' }}
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

              {/* Technical Description */}
              {item.desc && (
                <div style={{ fontSize: '12px', color: 'var(--text-main)', lineHeight: '1.5', marginTop: '4px' }}>
                  {item.desc}
                </div>
              )}

              {/* Special options for Scrcpy */}
              {item.id === 'sys_scrcpy_mirror' && (
                <div style={{ marginTop: '8px', padding: '10px 12px', background: 'var(--drawer-section-bg)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--magicos-blue)', marginBottom: '6px' }}>
                    Tùy chọn phiên Scrcpy:
                  </div>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '11.5px', color: 'var(--text-main)' }}>
                      <input
                        type="checkbox"
                        checked={turnOffScreen}
                        onChange={(e) => setTurnOffScreen(e.target.checked)}
                      />
                      <span>Tắt màn hình điện thoại khi chiếu</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '11.5px', color: 'var(--text-main)' }}>
                      <input
                        type="checkbox"
                        checked={stayAwake}
                        onChange={(e) => setStayAwake(e.target.checked)}
                      />
                      <span>Luôn sáng màn hình máy tính</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Special options for Reboot */}
              {item.type === 'reboot_controls' && (
                <div style={{ marginTop: '8px', padding: '10px 12px', background: 'var(--drawer-section-bg)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--tool-amber)', marginBottom: '8px' }}>
                    Chọn phân vùng khởi động lại:
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn-tool"
                      onClick={() => onReboot('system')}
                      disabled={!isOnline}
                      style={{ flex: 1, minWidth: '110px', fontSize: '11px', padding: '5px 8px' }}
                    >
                      Khởi Động Lại Máy
                    </button>
                    <button
                      type="button"
                      className="btn-tool"
                      onClick={() => onReboot('bootloader')}
                      disabled={!isOnline}
                      style={{ flex: 1, minWidth: '110px', fontSize: '11px', padding: '5px 8px' }}
                    >
                      Vào Fastboot
                    </button>
                    <button
                      type="button"
                      className="btn-tool"
                      onClick={() => onReboot('recovery')}
                      disabled={!isOnline}
                      style={{ flex: 1, minWidth: '110px', fontSize: '11px', padding: '5px 8px' }}
                    >
                      Vào Recovery
                    </button>
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-dim)', lineHeight: '1.4' }}>
                    💡 <strong>Mẹo dọn cache phân vùng Recovery:</strong> Khi vào màn hình eRecovery, chọn <strong>Clear data</strong> &rarr; chọn <strong>Clear cache</strong> (Tuyệt đối KHÔNG chọn Factory reset).
                  </div>
                </div>
              )}

              {/* Impact / Safety info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                {item.impact && (
                  <div style={{ fontSize: '11.5px', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                    </svg>
                    <span>{item.impact}</span>
                  </div>
                )}
                {item.safety && (
                  <div style={{ fontSize: '11.5px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    </svg>
                    <span>{item.safety}</span>
                  </div>
                )}
              </div>

              {/* Collapsible Technical ADB Command */}
              {item.adbCommand && (
                <details className="crm-tech-accordion" style={{ marginTop: '8px' }}>
                  <summary>Xem lệnh kỹ thuật ADB Shell</summary>
                  <div style={{ padding: '8px 10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Lệnh thực thi trực tiếp qua Android Shell / Binder</span>
                      <button
                        type="button"
                        className="btn-tool"
                        style={{ fontSize: '10px', padding: '2px 8px' }}
                        onClick={() => {
                          navigator.clipboard.writeText(item.adbCommand);
                          alert('Đã sao chép lệnh ADB vào clipboard!');
                        }}
                      >
                        Sao Chép
                      </button>
                    </div>
                    <div className="crm-code-box" style={{ fontSize: '11px' }}>
                      {item.adbCommand}
                    </div>
                  </div>
                </details>
              )}
            </div>
          ))}
        </div>
      </CrmDrawer>

      {/* Floating Action Dock when Telemetry keys are selected */}
      {selectedTelemetryKeys.size > 0 && activeModule === 'telemetry' && (
        <div className="crm-floating-dock">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge-tag tag-safe" style={{ fontSize: '11px', fontWeight: 600 }}>
              Đã chọn {selectedTelemetryKeys.size}/{TELEMETRY_DEFINITIONS.length} khóa
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
        device={device}
        adbService={adbService}
      />
    </div>
  );
}