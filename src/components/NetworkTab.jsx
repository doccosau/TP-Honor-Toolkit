import React, { useState, useEffect, useMemo } from 'react';

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

  // CRM State
  const [activeModule, setActiveModule] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [inspectItem, setInspectItem] = useState(null);
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
      if (e.key === 'Escape' && inspectItem) {
        setInspectItem(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inspectItem]);

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
  const networkItems = useMemo(() => [
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
      id: 'captive_portal',
      category: 'dns',
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
      id: 'private_dns_dot',
      category: 'dns',
      categoryLabel: 'Captive & DNS',
      title: 'Mã Hóa Tên Miền DNS Cá Nhân (Private DNS over TLS)',
      scope: 'global: private_dns_mode & private_dns_specifier',
      summary: 'Bảo mật truy vấn DNS qua TLS chống theo dõi ISP & chặn quảng cáo.',
      desc: 'Private DNS mã hóa toàn bộ truy vấn tên miền giữa thiết bị và máy chủ DNS uy tín (Cloudflare, Google, AdGuard, NextDNS), ngăn chặn nhà mạng thu thập lịch sử web và loại bỏ quảng cáo rác.',
      adbCommand: 'adb shell settings put global private_dns_mode hostname\nadb shell settings put global private_dns_specifier one.one.one.one',
      impact: 'Lướt web riêng tư, chặn các tên miền quảng cáo và mã độc ngay từ tầng mạng.',
      safety: 'Tiêu chuẩn bảo mật TLS Android',
      recommended: true,
      type: 'custom_dns',
    },
    {
      id: 'infinite_bt_volume',
      category: 'bluetooth',
      categoryLabel: 'Âm Thanh & BT',
      title: 'Mở Khóa Âm Lượng Bluetooth Vô Cực (BT A2DP)',
      scope: 'secure: infinite_volume_music_bt_a2dp',
      summary: 'Phá vỡ giới hạn ngưỡng âm lượng Bluetooth cho tai nghe TWS & loa không dây.',
      desc: 'HonorHook phát hiện cờ ẩn `infinite_volume_music_bt_a2dp` trên MagicOS giúp phá vỡ mức giới hạn 75-80dB do quy định kiểm soát âm thanh áp đặt lên chip Bluetooth.',
      adbCommand: 'adb shell settings put secure infinite_volume_music_bt_a2dp 1',
      impact: 'Âm lượng tai nghe không dây TWS và loa Bluetooth to hơn 30-40%, âm trường sống động hơn.',
      safety: 'An Toàn (Lưu ý không nghe âm lượng quá lớn trong thời gian dài)',
      recommended: false,
      type: 'toggle',
      checked: infiniteBluetooth,
      onChange: (checked) => setInfiniteBluetooth(checked),
    },
  ], [
    networkMode5G,
    disableWifiSleep,
    disableWifiPro,
    googleRtt,
    disableVerboseLogging,
    captive,
    dnsPreset,
    customDns,
    infiniteBluetooth,
  ]);

  const filteredItems = useMemo(() => {
    return networkItems.filter((item) => {
      const matchCat = activeModule === 'all' || item.category === activeModule;
      if (!matchCat) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.scope.toLowerCase().includes(q) ||
        item.categoryLabel.toLowerCase().includes(q)
      );
    });
  }, [networkItems, activeModule, searchQuery]);

  return (
    <div className="crm-workspace-layout">
      {/* 1. Header & KPI Metric Ribbon */}
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
                Trung Tâm Điều Khiển Mạng 5G, Wi-Fi &amp; DNS DoT MagicOS
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>
                Hệ thống CRM Matrix: Click vào từng mục để trượt cửa sổ chi tiết &amp; xem giải phẫu lệnh ADB
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              className="btn-tool"
              onClick={handleResetDefaults}
              disabled={!isOnline || isApplying}
              title="Khôi phục các tham số mạng về giá trị ban đầu của máy"
              style={{ fontSize: '12px', padding: '6px 12px' }}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                <path d="M3 3v5h5"></path>
              </svg>
              <span>Mặc Định Gốc</span>
            </button>

            <button
              type="button"
              className="btn-tool primary"
              onClick={handleApply}
              disabled={!isOnline || isApplying}
              style={{ fontSize: '12px', padding: '6px 16px', fontWeight: 600 }}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                <polyline points="7 3 7 8 15 8"></polyline>
              </svg>
              <span>{isApplying ? 'Đang Áp Dụng...' : 'Lưu & Kích Hoạt Mạng'}</span>
            </button>
          </div>
        </div>

        {/* 4 KPI Metric Capsules */}
        <div className="metric-capsule-grid" style={{ marginTop: '14px' }}>
          <div className="metric-capsule">
            <span className="metric-capsule-label">Mạng Di Động 5G NR</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span className="metric-capsule-value" style={{ color: '#38bdf8' }}>
                {networkMode5G === '26' ? 'Khóa 5G SA/NSA' : networkMode5G === '33' ? '5G/LTE Ưu Tiên' : networkMode5G === '10' ? 'LTE 4G Only' : 'Tự Động SIM'}
              </span>
              <span className="badge-tag tag-safe" style={{ fontSize: '9px', padding: '1px 5px' }}>
                Mode {networkMode5G}
              </span>
            </div>
            <span className="metric-capsule-sub">Ổn định băng thông &amp; VoLTE gọi thoại</span>
          </div>

          <div className="metric-capsule">
            <span className="metric-capsule-label">Wi-Fi Socket Keeper</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span className="metric-capsule-value" style={{ color: disableWifiSleep ? '#10b981' : '#f59e0b' }}>
                {disableWifiSleep ? 'Luôn Thức (Policy 2)' : 'Tiết Kiệm Điện (Sleep)'}
              </span>
            </div>
            <span className="metric-capsule-sub">Nhận push Zalo / OTP tức thì khi tắt màn hình</span>
          </div>

          <div className="metric-capsule">
            <span className="metric-capsule-label">Captive Portal 204</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span className="metric-capsule-value" style={{ color: '#a855f7' }}>
                {captive === 'google' ? 'Google 204' : captive === 'cloudflare' ? 'Cloudflare 204' : 'Honor Cloud'}
              </span>
              <span className="badge-tag tag-safe" style={{ fontSize: '9px', padding: '1px 5px' }}>
                No Exclamation
              </span>
            </div>
            <span className="metric-capsule-sub">Xóa sạch dấu chấm than cột sóng Wi-Fi</span>
          </div>

          <div className="metric-capsule">
            <span className="metric-capsule-label">Private DNS over TLS</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span className="metric-capsule-value" style={{ color: dnsPreset !== 'off' ? '#10b981' : 'var(--text-dim)' }}>
                {dnsPreset !== 'off' ? (customDns || dnsPreset.toUpperCase()) : 'Đang Tắt'}
              </span>
            </div>
            <span className="metric-capsule-sub">Mã hóa truy vấn tên miền chống theo dõi</span>
          </div>
        </div>
      </div>

      {/* 2. CRM / ERP Category Sub-Navbar & Real-time Search */}
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
            <span>Tất Cả Tùy Chọn</span>
            <span className="crm-subnav-badge">{networkItems.length}</span>
          </button>

          <button
            type="button"
            className={`crm-subnav-btn ${activeModule === 'cellular' ? 'active' : ''}`}
            onClick={() => setActiveModule('cellular')}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 20h.01M7 20v-4M12 20v-8M17 20V4M22 20v-12"></path>
            </svg>
            <span>Mạng Di Động &amp; 5G</span>
          </button>

          <button
            type="button"
            className={`crm-subnav-btn ${activeModule === 'wifi' ? 'active' : ''}`}
            onClick={() => setActiveModule('wifi')}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
              <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
              <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
              <line x1="12" y1="20" x2="12.01" y2="20"></line>
            </svg>
            <span>Tối Ưu Driver Wi-Fi</span>
          </button>

          <button
            type="button"
            className={`crm-subnav-btn ${activeModule === 'dns' ? 'active' : ''}`}
            onClick={() => setActiveModule('dns')}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
            <span>Captive 204 &amp; DNS DoT</span>
          </button>

          <button
            type="button"
            className={`crm-subnav-btn ${activeModule === 'bluetooth' ? 'active' : ''}`}
            onClick={() => setActiveModule('bluetooth')}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6.5 6.5 17.5 17.5 12 23 12 1 17.5 6.5 6.5 17.5"></polyline>
            </svg>
            <span>Âm Lượng &amp; Bluetooth</span>
          </button>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', width: '280px' }}>
          <input
            type="text"
            className="tool-input"
            placeholder="Tìm kiếm nhanh tham số mạng..."
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

      {/* 3. Compact CRM Grid Matrix (No more infinite scrolling!) */}
      <div className="crm-grid-matrix">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className={`crm-card ${inspectItem?.id === item.id ? 'active-selected' : ''}`}
            onClick={() => setInspectItem(item)}
          >
            <div className="crm-card-header">
              <div className="crm-card-title-group">
                <div className="crm-card-icon">
                  {item.category === 'cellular' && (
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M2 20h.01M7 20v-4M12 20v-8M17 20V4M22 20v-12"></path>
                    </svg>
                  )}
                  {item.category === 'wifi' && (
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
                      <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
                      <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
                      <line x1="12" y1="20" x2="12.01" y2="20"></line>
                    </svg>
                  )}
                  {item.category === 'dns' && (
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="2" y1="12" x2="22" y2="12"></line>
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                    </svg>
                  )}
                  {item.category === 'bluetooth' && (
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6.5 6.5 17.5 17.5 12 23 12 1 17.5 6.5 6.5 17.5"></polyline>
                    </svg>
                  )}
                </div>

                <div>
                  <div className="crm-card-title">{item.title}</div>
                  <div className="crm-card-meta">
                    <span className="badge-tag tag-neutral" style={{ fontSize: '9px', padding: '1px 5px' }}>
                      {item.categoryLabel}
                    </span>
                    <span className="badge-tag tag-safe" style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', padding: '1px 5px' }}>
                      {item.scope}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick interactive control directly on card */}
              <div onClick={(e) => e.stopPropagation()}>
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
                  <span className="badge-tag tag-safe" style={{ fontSize: '10px', padding: '3px 8px' }}>
                    {item.options.find((o) => o.value === item.value)?.value || item.value}
                  </span>
                )}
                {item.type === 'custom_dns' && (
                  <span className="badge-tag tag-safe" style={{ fontSize: '10px', padding: '3px 8px' }}>
                    {dnsPreset.toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            <div className="crm-card-desc">{item.summary}</div>

            <div className="crm-card-footer">
              <span style={{ color: 'var(--text-muted)' }}>
                {item.recommended ? 'Đề xuất kích hoạt' : 'Tùy chọn nâng cao'}
              </span>
              <button
                type="button"
                className="crm-inspect-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setInspectItem(item);
                }}
              >
                <span>Chi tiết &amp; Lệnh ADB</span>
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 4. Slide-Over Inspection Drawer (Trượt từ phải sang trái) */}
      {inspectItem && (
        <>
          <div className="crm-drawer-backdrop" onClick={() => setInspectItem(null)} />
          <div className="crm-drawer-panel">
            {/* Drawer Header */}
            <div className="crm-drawer-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="badge-tag tag-safe" style={{ fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
                  {inspectItem.scope}
                </span>
                <span className="badge-tag tag-neutral" style={{ fontSize: '10px' }}>
                  {inspectItem.categoryLabel}
                </span>
              </div>
              <button
                type="button"
                className="crm-drawer-close"
                onClick={() => setInspectItem(null)}
                title="Đóng cửa sổ (Esc)"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Drawer Body */}
            <div className="crm-drawer-body">
              {/* Title & Quick Switch */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-bright)', lineHeight: '1.4' }}>
                    {inspectItem.title}
                  </h3>
                  <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '4px' }}>
                    {inspectItem.summary}
                  </div>
                </div>

                {inspectItem.type === 'toggle' && (
                  <label className="magicos-switch" style={{ flexShrink: 0, marginTop: '4px' }}>
                    <input
                      type="checkbox"
                      checked={inspectItem.checked}
                      onChange={(e) => inspectItem.onChange(e.target.checked)}
                      disabled={!isOnline}
                    />
                    <span className="magicos-slider"></span>
                  </label>
                )}
              </div>

              {/* Direct Controls in Drawer if Select or Custom DNS */}
              {inspectItem.type === 'select' && (
                <div className="crm-drawer-section">
                  <div className="crm-drawer-section-title">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                      <polyline points="2 17 12 22 22 17"></polyline>
                      <polyline points="2 12 12 17 22 12"></polyline>
                    </svg>
                    <span>Lựa chọn tham số mục tiêu</span>
                  </div>
                  <select
                    className="tool-select"
                    value={inspectItem.value}
                    onChange={(e) => inspectItem.onChange(e.target.value)}
                    disabled={!isOnline}
                    style={{ width: '100%', fontSize: '13px' }}
                  >
                    {inspectItem.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {inspectItem.type === 'custom_dns' && (
                <div className="crm-drawer-section">
                  <div className="crm-drawer-section-title">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="2" y1="12" x2="22" y2="12"></line>
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                    </svg>
                    <span>Cấu hình máy chủ DoT</span>
                  </div>
                  <select
                    className="tool-select"
                    value={dnsPreset}
                    onChange={(e) => handleDnsChange(e.target.value)}
                    disabled={!isOnline}
                    style={{ width: '100%', fontSize: '12px', marginBottom: '8px' }}
                  >
                    <option value="cloudflare">Cloudflare DoT (one.one.one.one)</option>
                    <option value="google">Google Public DNS (dns.google)</option>
                    <option value="adguard">AdGuard AdBlock (dns.adguard-dns.com)</option>
                    <option value="nextdns">NextDNS (dns.nextdns.io)</option>
                    <option value="quad9">Quad9 Secure (dns.quad9.net)</option>
                    <option value="custom">Điền máy chủ DoT thủ công...</option>
                    <option value="off">Tắt Private DNS</option>
                  </select>

                  <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '4px' }}>
                    Địa chỉ Hostname DoT:
                  </div>
                  <input
                    type="text"
                    className="tool-input"
                    placeholder="Ví dụ: your-id.dns.nextdns.io"
                    value={customDns}
                    onChange={(e) => {
                      setCustomDns(e.target.value);
                      setDnsPreset('custom');
                    }}
                    disabled={!isOnline || dnsPreset === 'off'}
                    style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: '12px' }}
                  />
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
                  <span>Mục đích &amp; Cơ chế can thiệp</span>
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--text-main)', lineHeight: '1.6' }}>
                  {inspectItem.desc}
                </div>
              </div>

              {/* Exact ADB Command executed */}
              {inspectItem.adbCommand && (
                <div className="crm-drawer-section">
                  <div className="crm-drawer-section-title">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="4 17 10 11 4 5"></polyline>
                      <line x1="12" y1="19" x2="20" y2="19"></line>
                    </svg>
                    <span>Lệnh ADB Shell thực thi</span>
                  </div>
                  <div className="crm-code-box">{inspectItem.adbCommand}</div>
                </div>
              )}

              {/* Real-world Impact */}
              {inspectItem.impact && (
                <div className="crm-drawer-section" style={{ borderLeft: '3px solid #38bdf8' }}>
                  <div className="crm-drawer-section-title" style={{ color: '#38bdf8' }}>
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                    </svg>
                    <span>Lợi ích thực tế</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-main)', lineHeight: '1.5' }}>
                    {inspectItem.impact}
                  </div>
                </div>
              )}

              {/* Safety Rating */}
              {inspectItem.safety && (
                <div className="crm-drawer-section" style={{ borderLeft: '3px solid #10b981' }}>
                  <div className="crm-drawer-section-title" style={{ color: '#10b981' }}>
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    </svg>
                    <span>Mức độ an toàn</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-dim)', lineHeight: '1.4' }}>
                    {inspectItem.safety}
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="crm-drawer-footer">
              <button
                type="button"
                className="btn-tool"
                onClick={() => setInspectItem(null)}
                style={{ fontSize: '12px' }}
              >
                Đóng
              </button>

              <button
                type="button"
                className="btn-tool primary"
                onClick={handleApply}
                disabled={!isOnline || isApplying}
                style={{ fontSize: '12px', fontWeight: 600 }}
              >
                {isApplying ? 'Đang Lưu...' : 'Lưu Thay Đổi'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}