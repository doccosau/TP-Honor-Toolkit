import React, { useState, useEffect, useMemo } from 'react';
import CrmDrawer from './CrmDrawer';

export default function NetworkTab({ device, onApplyNetwork }) {
  const [captive, setCaptive] = useState('google');
  const [dnsPreset, setDnsPreset] = useState('cloudflare');
  const [customDns, setCustomDns] = useState('one.one.one.one');
  const [networkMode5G, setNetworkMode5G] = useState('26');
  const [disableWifiPro, setDisableWifiPro] = useState(true);
  const [disableWifiSleep, setDisableWifiSleep] = useState(true);
  const [googleRtt, setGoogleRtt] = useState(true);
  const [disableVerboseLogging, setDisableVerboseLogging] = useState(true);
  const [infiniteBluetooth, setInfiniteBluetooth] = useState(false);
  const [showNetworkSpeed, setShowNetworkSpeed] = useState(true);

  // Active module drawer state: null = Master Hub, 'cellular' | 'wifi' | 'captive' | 'dns' | 'bluetooth' = Open Drawer
  const [activeModule, setActiveModule] = useState(null);
  const [isApplying, setIsApplying] = useState(false);

  const isOnline = Boolean(device && device.connected);

  useEffect(() => {
    if (device?.current_dns_spec) {
      setCustomDns(device.current_dns_spec);
      setDnsPreset('custom');
    }
  }, [device]);

  // Handle ESC key to close drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && activeModule !== null) {
        setActiveModule(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModule]);

  const handleDnsChange = (val) => {
    setDnsPreset(val);
    if (val === 'cloudflare') setCustomDns('one.one.one.one');
    else if (val === 'google') setCustomDns('dns.google');
    else if (val === 'adguard') setCustomDns('dns.adguard-dns.com');
    else if (val === 'nextdns') setCustomDns('dns.nextdns.io');
    else if (val === 'quad9') setCustomDns('dns.quad9.net');
    else if (val === 'off') setCustomDns('');
  };

  const handleApply = async () => {
    if (!isOnline) return;
    setIsApplying(true);
    try {
      await onApplyNetwork({
        captive,
        dns: dnsPreset,
        customDns,
        networkMode5G,
        disableWifipro: disableWifiPro,
        disableWifiSleep,
        googleRtt,
        disableVerboseLogging,
        infiniteBluetooth,
        showNetworkSpeed,
      });
    } finally {
      setIsApplying(false);
    }
  };

  const handleResetDefaults = async () => {
    if (!isOnline) return;
    if (!window.confirm('Khôi phục toàn bộ thiết lập Mạng, Wi-Fi và DNS về mặc định ban đầu của nhà sản xuất?')) return;
    setIsApplying(true);
    try {
      await onApplyNetwork({
        resetDefaults: true,
      });
      setCaptive('default');
      setDnsPreset('off');
      setCustomDns('');
      setNetworkMode5G('default');
      setDisableWifiPro(false);
      setDisableWifiSleep(false);
      setGoogleRtt(false);
      setDisableVerboseLogging(false);
      setInfiniteBluetooth(false);
    } finally {
      setIsApplying(false);
    }
  };

  // Structured items inventory
  const networkItems = useMemo(
    () => [
      {
        id: 'cellular_5g',
        category: 'cellular',
        categoryLabel: 'Mạng Di Động',
        title: 'Khóa Chế Độ Băng Tần 5G SA/NSA Toàn Dải',
        scope: 'global: preferred_network_mode1',
        summary: 'Ép modem duy trì kết nối 5G NR toàn dải, không tự tụt về 2G/3G khi sóng yếu.',
        desc: 'Trên các thiết bị Honor nội địa, khi cường độ sóng suy hao nhẹ, hệ thống thường tự động hạ dải mạng về 3G/2G gây giật lag cuộc gọi VoLTE và nghẽn băng thông. Tinh chỉnh này ép modem ưu tiên giữ sóng 5G NR Standalone / Non-Standalone.',
        adbCommand: 'adb shell settings put global preferred_network_mode1 26\nadb shell settings put global preferred_network_mode 26',
        impact: 'Duy trì tốc độ tải cao nhất, giảm gián đoạn cuộc gọi VoLTE / ViLTE và ping game qua mạng di động Viettel, VinaPhone, MobiFone.',
        safety: 'An Toàn Tuyệt Đối (Non-Root, tự động kích hoạt lại theo SIM khi reset)',
        recommended: true,
        type: 'select',
        value: networkMode5G,
        onChange: (val) => setNetworkMode5G(val),
        options: [
          { value: '26', label: '5G NR All-Bands (SA/NSA Khóa Cứng - Đề Xuất)' },
          { value: '33', label: '5G / LTE Ưu Tiên Toàn Dải (NR/LTE/WCDMA/GSM)' },
          { value: '10', label: 'LTE / 4G Only (Ổn Định Cao & Tiết Kiệm Pin)' },
          { value: 'default', label: 'Mặc định nhà mạng (Tự Động Theo SIM)' },
        ],
      },
      {
        id: 'wifi_sleep_policy',
        category: 'wifi',
        categoryLabel: 'Driver Wi-Fi',
        title: 'Giữ Card Mạng Wi-Fi Luôn Thức (Socket Keeper)',
        scope: 'global: wifi_power_save & wifi_sleep_policy',
        summary: 'Tắt Wi-Fi Power Save & đặt Sleep Policy = 2 để giữ kết nối socket Zalo / OTP.',
        desc: 'Khi tắt màn hình, MagicOS mặc định sẽ giảm công suất card Wi-Fi hoặc ngắt kết nối antenna ngầm để tiết kiệm pin. Tùy chọn này tắt Power Save (0) và gán Policy = 2 (Never Sleep) để chip mạng luôn duy trì kết nối WebSocket.',
        adbCommand: 'adb shell settings put global wifi_power_save 0\nadb shell settings put global wifi_sleep_policy 2',
        impact: 'Dứt điểm hoàn toàn tình trạng trễ thông báo Zalo, Telegram, Shopee, TikTok và OTP ngân hàng khi máy ở chế độ chờ màn hình đen.',
        safety: 'An Toàn Tuyệt Đối (Tốn thêm < 1% pin mỗi đêm)',
        recommended: true,
        type: 'toggle',
        checked: disableWifiSleep,
        onChange: (checked) => setDisableWifiSleep(checked),
      },
      {
        id: 'wifi_pro',
        category: 'wifi',
        categoryLabel: 'Driver Wi-Fi',
        title: 'Vô Hiệu Hóa Wi-Fi Pro & Link Turbo Đổi Mạng Ngầm',
        scope: 'global: hn_wifipro_enable & system: smart_network_switch',
        summary: 'Chặn tính năng tự ý nhảy từ Wi-Fi sang 4G làm ngắt cuộc gọi thoại ngầm.',
        desc: 'Wi-Fi Pro và Link Turbo của MagicOS tự động chuyển lưu lượng mạng sang 4G khi Wi-Fi giảm 1 vạch sóng. Điều này vô tình cắt đứt socket TCP của cuộc gọi thoại Zalo/Messenger đang diễn ra.',
        adbCommand: 'adb shell settings put global hn_wifipro_enable false\nadb shell settings put system smart_network_switch 0\nadb shell settings put secure settings_wlan_mt_axl 0\nadb shell settings put global wifi_cloud_security_check 0',
        impact: 'Giữ kết nối Wi-Fi ổn định liên tục, ngăn rớt cuộc gọi và tiết kiệm dung lượng 4G.',
        safety: 'An Toàn Tuyệt Đối',
        recommended: true,
        type: 'toggle',
        checked: disableWifiPro,
        onChange: (checked) => setDisableWifiPro(checked),
      },
      {
        id: 'wifi_rtt',
        category: 'wifi',
        categoryLabel: 'Driver Wi-Fi',
        title: 'Sửa Máy Chủ Đo Độ Trễ RTT Wi-Fi Sang Google / Cloudflare',
        scope: 'global: wifi_hidata_rtt_url',
        summary: 'Thay máy chủ ping Baidu nội địa TQ bằng Google RTT để đo độ trễ chính xác.',
        desc: 'MagicOS gửi gói tin RTT (Round Trip Time) định kỳ tới các máy chủ tại Trung Quốc (Baidu/Honor Cloud) để tính toán chất lượng mạng. Tại Việt Nam, độ trễ đến Trung Quốc cao khiến máy hiểu nhầm là mạng hỏng.',
        adbCommand: 'adb shell settings put global wifi_hidata_rtt_url connectivitycheck.gstatic.com|www.google.com|1.1.1.1',
        impact: 'Máy nhận diện kết nối Internet tức thì, không hiện cảnh báo ảo "Mạng không có Internet".',
        safety: 'An Toàn Tuyệt Đối',
        recommended: true,
        type: 'toggle',
        checked: googleRtt,
        onChange: (checked) => setGoogleRtt(checked),
      },
      {
        id: 'wifi_verbose_log',
        category: 'wifi',
        categoryLabel: 'Driver Wi-Fi',
        title: 'Tắt Ghi Nhật Ký Chi Tiết Wi-Fi (Verbose Log Off)',
        scope: 'global: wifi_verbose_logging_enabled',
        summary: 'Dừng ghi log quét sóng Wi-Fi liên tục vào bộ nhớ flash UFS.',
        desc: 'Mặc định trên các bản ROM phát triển và nội địa, driver Wi-Fi ghi hàng nghìn dòng log chẩn đoán sóng vào chip nhớ UFS liên tục mỗi phút, làm nóng máy và tiêu hao I/O.',
        adbCommand: 'adb shell settings put global wifi_verbose_logging_enabled 0',
        impact: 'Giải phóng CPU nền, giảm nhiệt độ máy và kéo dài tuổi thọ bộ nhớ flash.',
        safety: 'An Toàn Tuyệt Đối',
        recommended: true,
        type: 'toggle',
        checked: disableVerboseLogging,
        onChange: (checked) => setDisableVerboseLogging(checked),
      },
      {
        id: 'network_speed',
        category: 'wifi',
        categoryLabel: 'Driver Wi-Fi',
        title: 'Hiển Thị Tốc Độ Mạng Thời Gian Thực (Network Speed)',
        scope: 'system: show_network_speed_enabled',
        summary: 'Hiển thị tốc độ download/upload KB/s trên thanh trạng thái cạnh cột sóng.',
        desc: 'Kích hoạt hiển thị tốc độ truyền dữ liệu mạng theo thời gian thực trên thanh trạng thái cạnh cột sóng Wi-Fi/4G.',
        adbCommand: 'adb shell settings put system show_network_speed_enabled 1',
        impact: 'Dễ dàng giám sát tốc độ mạng khi tải file hoặc xem livestream.',
        safety: 'An Toàn Tuyệt Đối',
        recommended: true,
        type: 'toggle',
        checked: showNetworkSpeed,
        onChange: (checked) => setShowNetworkSpeed(checked),
      },
      {
        id: 'captive_portal',
        category: 'captive',
        categoryLabel: 'Captive & DNS',
        title: 'Máy Chủ Kiểm Tra Kết Nối Mạng (Captive Portal 204)',
        scope: 'global: captive_portal_http_url & https_url',
        summary: 'Dứt điểm dấu chấm than trên cột sóng Wi-Fi/4G bằng Google 204.',
        desc: 'Thay thế địa chỉ xác thực kết nối mạng nội địa Trung Quốc bằng chuẩn HTTP 204 No Content của Google hoặc Cloudflare toàn cầu.',
        adbCommand: 'adb shell settings put global captive_portal_mode 1\nadb shell settings put global captive_portal_http_url http://connectivitycheck.gstatic.com/generate_204\nadb shell settings put global captive_portal_https_url https://connectivitycheck.gstatic.com/generate_204\nadb shell settings put global captive_portal_fallback_url http://www.google.com/gen_204',
        impact: 'Xóa vĩnh viễn biểu tượng chấm than trên cột sóng Wi-Fi, nhận mạng cafe tức thì.',
        safety: 'Chuẩn Android AOSP Quốc Tế',
        recommended: true,
        type: 'select',
        value: captive,
        onChange: (val) => setCaptive(val),
        options: [
          { value: 'google', label: 'Google 204 (connectivitycheck.gstatic.com - Chuẩn Quốc Tế)' },
          { value: 'cloudflare', label: 'Cloudflare 204 (cp.cloudflare.com - Tốc Độ Cao)' },
          { value: 'default', label: 'Mặc định nhà sản xuất (Honor Cloud TQ)' },
        ],
      },
      {
        id: 'private_dns',
        category: 'dns',
        categoryLabel: 'Captive & DNS',
        title: 'Mã Hóa DNS Cá Nhân Bảo Mật Cao (Private DNS DoT)',
        scope: 'global: private_dns_mode & specifier',
        summary: 'Bảo vệ quyền riêng tư duyệt web qua DNS-over-TLS chống theo dõi ISP.',
        desc: 'Mã hóa toàn bộ truy vấn tên miền của điện thoại bằng giao thức TLS (DoT). Ngăn nhà mạng chặn web và tăng tốc phân giải IP cho ứng dụng.',
        adbCommand: 'adb shell settings put global private_dns_mode hostname\nadb shell settings put global private_dns_specifier <hostname>',
        impact: 'Tốc độ mở web nhanh hơn 30-40%, vượt chặn tên miền và chặn quảng cáo rác ở cấp độ mạng.',
        safety: 'Chuẩn Bảo Mật Quốc Tế',
        recommended: true,
        type: 'custom_dns',
      },
      {
        id: 'infinite_bt_volume',
        category: 'bluetooth',
        categoryLabel: 'Âm Thanh & BT',
        title: 'Âm Lượng Bluetooth Vô Cực (Infinite BT A2DP)',
        scope: 'secure: infinite_volume_music_bt_a2dp',
        summary: 'Phá vỡ mức giới hạn 75-80dB do quy định áp đặt lên tai nghe Bluetooth.',
        desc: 'HonorHook phát hiện cờ ẩn `infinite_volume_music_bt_a2dp` trên MagicOS giúp phá vỡ mức giới hạn âm lượng an toàn, tăng công suất phát âm thanh cho tai nghe TWS & loa không dây.',
        adbCommand: 'adb shell settings put secure infinite_volume_music_bt_a2dp 1',
        impact: 'Âm lượng tai nghe TWS và loa Bluetooth to hơn 30-40%, âm trường sâu và sống động.',
        safety: 'An Toàn (Không nghe âm lượng quá lớn trong thời gian dài)',
        recommended: false,
        type: 'toggle',
        checked: infiniteBluetooth,
        onChange: (checked) => setInfiniteBluetooth(checked),
      },
    ],
    [
      networkMode5G,
      disableWifiSleep,
      disableWifiPro,
      googleRtt,
      disableVerboseLogging,
      captive,
      dnsPreset,
      customDns,
      infiniteBluetooth,
    ]
  );

  // 5 Master Network Modules for Hub
  const masterNetworkModules = useMemo(
    () => [
      {
        id: 'cellular',
        title: 'Khóa Chế Độ Băng Tần 5G SA/NSA Toàn Dải',
        subtitle: 'Mạng Di Động Siêu Tốc',
        badge: networkMode5G === '26' ? '5G Khóa Cứng' : 'Băng Tần Tùy Chọn',
        badgeType: 'tag-safe',
        desc: 'Ép modem duy trì kết nối 5G NR toàn dải, không tự tụt về 2G/3G khi cường độ sóng suy hao nhẹ. Ổn định cuộc gọi VoLTE / ViLTE và ping game di động.',
        icon: (
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
            <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
            <line x1="12" y1="20" x2="12.01" y2="20"></line>
          </svg>
        ),
        countLabel: '1 Tinh Chỉnh Modem',
      },
      {
        id: 'wifi',
        title: 'Wi-Fi Socket Keeper & Chống Trễ Thông Báo',
        subtitle: 'Bộ Tinh Chỉnh Driver Wi-Fi',
        badge: disableWifiSleep ? 'Socket Bảo Vệ' : 'Chưa Tối Ưu',
        badgeType: disableWifiSleep ? 'tag-safe' : 'tag-warn',
        desc: 'Khắc phục triệt để tình trạng trễ tin nhắn Zalo, OTP ngân hàng khi tắt màn hình. Tắt Wi-Fi Pro tự nhảy sang 4G ngắt cuộc gọi và sửa máy chủ ping RTT.',
        icon: (
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="2"></circle>
            <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"></path>
          </svg>
        ),
        countLabel: '4 Tinh Chỉnh Driver',
      },
      {
        id: 'captive',
        title: 'Xóa Dấu Chấm Than Captive Portal (Google 204)',
        subtitle: 'Xác Thực Kết Nối Chuẩn Quốc Tế',
        badge: captive === 'google' ? 'Google 204 OK' : captive.toUpperCase(),
        badgeType: 'tag-safe',
        desc: 'Thay thế máy chủ kiểm tra mạng nội địa Trung Quốc bằng chuẩn HTTP 204 No Content của Google hoặc Cloudflare. Xóa vĩnh viễn biểu tượng chấm than trên cột sóng.',
        icon: (
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
        ),
        countLabel: '1 Chuẩn Quốc Tế',
      },
      {
        id: 'dns',
        title: 'Mã Hóa DNS Cá Nhân Bảo Mật Cao (Private DNS DoT)',
        subtitle: 'Bảo Vệ Quyền Riêng Tư & Chặn Quảng Cáo',
        badge: dnsPreset !== 'off' ? `${dnsPreset.toUpperCase()} Active` : 'Đang Tắt',
        badgeType: dnsPreset !== 'off' ? 'tag-safe' : 'tag-neutral',
        desc: 'Mã hóa toàn bộ truy vấn tên miền bằng TLS chống nghe lén của nhà mạng ISP. Tăng tốc phân giải tên miền 30-40% và chặn quảng cáo rác từ Cloudflare/AdGuard.',
        icon: (
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        ),
        countLabel: 'DoT Mã Hóa TLS',
      },
      {
        id: 'bluetooth',
        title: 'Âm Lượng Bluetooth Vô Cực (Infinite BT A2DP)',
        subtitle: 'Khuếch Đại Âm Thanh Tai Nghe & Loa',
        badge: infiniteBluetooth ? 'Vô Cực Bật' : 'Mặc Định 80dB',
        badgeType: infiniteBluetooth ? 'tag-safe' : 'tag-neutral',
        desc: 'Phá vỡ giới hạn an toàn âm lượng 75-80dB của hệ thống. Tăng công suất âm thanh cho tai nghe TWS và loa không dây to hơn 30-40%, âm trường sâu và sống động.',
        icon: (
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6.5 6.5 17.5 17.5 12 23 12 1 17.5 6.5 6.5 17.5"></polyline>
          </svg>
        ),
        countLabel: '1 Khóa A2DP',
      },
    ],
    [networkMode5G, disableWifiSleep, captive, dnsPreset, infiniteBluetooth]
  );

  const activeModuleMeta = useMemo(() => {
    return masterNetworkModules.find((m) => m.id === activeModule);
  }, [masterNetworkModules, activeModule]);

  // Items in active module view
  const currentItems = useMemo(() => {
    if (!activeModule) return [];
    return networkItems.filter((item) => item.category === activeModule);
  }, [networkItems, activeModule]);

  return (
    <div className="crm-workspace-layout">
      {/* Master Hub Launchpad (3uTools Style: Always Visible) */}
          {/* Header & KPI Summary */}
          <div className="specs-card" style={{ width: '100%', marginBottom: 0 }}>
            <div className="specs-header-title">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="svg-icon" style={{ color: 'var(--brand-accent)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                    <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
                    <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
                    <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
                    <line x1="12" y1="20" x2="12.01" y2="20"></line>
                  </svg>
                </span>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-bright)' }}>
                    Tối Ưu Hóa Mạng Di Động, Wi-Fi &amp; DNS MagicOS
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>
                    Trung tâm tối ưu hóa mạng: Chọn thẻ để mở ngăn cấu hình chi tiết kết nối và DNS
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  className="btn-tool"
                  onClick={handleResetDefaults}
                  disabled={!isOnline || isApplying}
                  style={{ fontSize: '11.5px', padding: '5px 12px' }}
                >
                  Khôi Phục Mạng Gốc
                </button>
                <button
                  type="button"
                  className="btn-tool primary"
                  onClick={handleApply}
                  disabled={!isOnline || isApplying}
                  style={{ fontSize: '11.5px', padding: '5px 14px', fontWeight: 600 }}
                >
                  {isApplying ? 'Đang Lưu...' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </div>

            {/* 4 Quick KPI Capsules */}
            <div className="metric-capsule-grid" style={{ marginTop: '14px' }}>
              <div className="metric-capsule">
                <span className="metric-capsule-label">Chế Độ Băng Tần 5G</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <span className="metric-capsule-value" style={{ color: '#38bdf8' }}>
                    {networkMode5G === '26' ? '5G All-Bands' : networkMode5G}
                  </span>
                  <span className="badge-tag tag-safe" style={{ fontSize: '9px', padding: '1px 5px' }}>
                    Khóa Sóng
                  </span>
                </div>
                <span className="metric-capsule-sub">Không tụt 2G/3G khi cường độ sóng yếu</span>
              </div>

              <div className="metric-capsule">
                <span className="metric-capsule-label">Wi-Fi Socket Keeper</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <span className="metric-capsule-value" style={{ color: disableWifiSleep ? '#10b981' : '#f59e0b' }}>
                    {disableWifiSleep ? 'Bảo Vệ Bật' : 'Tắt'}
                  </span>
                  <span className="badge-tag tag-safe" style={{ fontSize: '9px', padding: '1px 5px' }}>
                    Chống Trễ
                  </span>
                </div>
                <span className="metric-capsule-sub">Giữ kết nối socket Zalo / OTP khi khóa máy</span>
              </div>

              <div className="metric-capsule">
                <span className="metric-capsule-label">Captive Portal 204</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <span className="metric-capsule-value" style={{ color: '#a855f7' }}>
                    {captive === 'google' ? 'Google 204' : captive}
                  </span>
                  <span className="badge-tag tag-safe" style={{ fontSize: '9px', padding: '1px 5px' }}>
                    Mất Chấm Than
                  </span>
                </div>
                <span className="metric-capsule-sub">Nhận diện Wi-Fi cafe tức thì</span>
              </div>

              <div className="metric-capsule">
                <span className="metric-capsule-label">Mã Hóa Private DNS</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <span className="metric-capsule-value" style={{ color: dnsPreset !== 'off' ? '#10b981' : '#94a3b8' }}>
                    {dnsPreset.toUpperCase()}
                  </span>
                  <span className="badge-tag tag-safe" style={{ fontSize: '9px', padding: '1px 5px' }}>
                    DoT TLS
                  </span>
                </div>
                <span className="metric-capsule-sub">Chống theo dõi ISP &amp; tăng tốc duyệt web</span>
              </div>
            </div>
          </div>

          {/* 5 Grand Master Network Tiles */}
          <div className="crm-hub-grid">
            {masterNetworkModules.map((mod) => (
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
          SLIDE-OVER WORKSPACE DRAWER (Nhạc Quán Admin / 3uTools Standard)
          Slides in smoothly from the LEFT edge over glassmorphism backdrop
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <button
              type="button"
              className="btn-tool"
              onClick={() => setActiveModule(null)}
              style={{ fontSize: '12px', padding: '6px 14px' }}
            >
              Đóng Cửa Sổ (ESC)
            </button>
            <button
              type="button"
              className="btn-tool primary"
              onClick={handleApply}
              disabled={!isOnline || isApplying}
              style={{ fontSize: '12px', padding: '6px 18px', fontWeight: 600 }}
            >
              {isApplying ? 'Đang Lưu...' : 'Lưu & Áp Dụng Ngay'}
            </button>
          </div>
        }
      >
        <div style={{ fontSize: '12.5px', color: 'var(--text-dim)', lineHeight: '1.6', marginBottom: '8px' }}>
          {activeModuleMeta?.desc}
        </div>

        {/* Dedicated cards for this specific network subsystem */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {currentItems.map((item) => (
            <div key={item.id} className="crm-card" style={{ cursor: 'default' }}>
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

                {/* Interactive Control */}
                <div>
                  {item.type === 'toggle' && (
                    <label className="magicos-switch">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={(e) => item.onChange(e.target.checked)}
                        disabled={!isOnline}
                      />
                      <span className="magicos-slider"></span>
                    </label>
                  )}
                  {item.type === 'select' && (
                    <select
                      className="tool-select"
                      value={item.value}
                      onChange={(e) => item.onChange(e.target.value)}
                      style={{ fontSize: '11px', padding: '4px 8px' }}
                    >
                      {item.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Plain-Language Explanation */}
              <div className="crm-card-desc">{item.summary}</div>

              {/* Custom DNS Sub-panel if applicable */}
              {item.type === 'custom_dns' && (
                <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {[
                      { id: 'cloudflare', label: 'Cloudflare' },
                      { id: 'google', label: 'Google' },
                      { id: 'adguard', label: 'AdGuard' },
                      { id: 'nextdns', label: 'NextDNS' },
                      { id: 'quad9', label: 'Quad9' },
                      { id: 'off', label: 'Tắt DoT' },
                    ].map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        className={`btn-tool ${dnsPreset === preset.id ? 'primary' : ''}`}
                        style={{ fontSize: '11px', padding: '3px 8px' }}
                        onClick={() => handleDnsChange(preset.id)}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    className="tool-input"
                    placeholder="Nhập hostname DNS (VD: one.one.one.one)"
                    value={customDns}
                    onChange={(e) => {
                      setCustomDns(e.target.value);
                      setDnsPreset('custom');
                    }}
                    style={{ width: '100%', fontSize: '11.5px', fontFamily: 'var(--font-mono)' }}
                  />
                </div>
              )}

              {/* Impact / Safety info */}
              {item.impact && (
                <div style={{ fontSize: '11.5px', color: '#38bdf8', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span>{item.impact}</span>
                </div>
              )}

              {/* Collapsible Technical ADB Command */}
              {item.adbCommand && (
                <details className="crm-tech-accordion">
                  <summary>Xem lệnh kỹ thuật ADB Shell</summary>
                  <div style={{ padding: '8px 10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Thực thi trên thiết bị:</span>
                      <button
                        type="button"
                        className="btn-tool"
                        style={{ fontSize: '10px', padding: '2px 8px' }}
                        onClick={() => {
                          navigator.clipboard?.writeText(item.adbCommand);
                          alert('Đã sao chép lệnh ADB vào clipboard!');
                        }}
                      >
                        Sao Chép Lệnh
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
    </div>
  );
}
