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

  const [activeModule, setActiveModule] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  const isOnline = Boolean(device && device.connected);

  useEffect(() => {
    if (device?.current_dns_spec) {
      setCustomDns(device.current_dns_spec);
      setDnsPreset('custom');
    }
  }, [device]);

  const handleDnsChange = (e) => {
    const val = e.target.value;
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

  // Structured items for CRM filtering
  const networkItems = useMemo(() => [
    {
      id: 'cellular_5g',
      category: 'cellular',
      categoryLabel: 'Mạng Di Động',
      title: 'Khóa Chế Độ Băng Tần 5G SA/NSA Toàn Dải',
      scope: 'global: preferred_network_mode1',
      desc: 'Ép modem sóng di động duy trì kết nối 5G NR Standalone / Non-Standalone, không tự hạ về 2G/3G khi tín hiệu suy giảm nhẹ tại Việt Nam.',
      impact: 'Duy trì tốc độ tải cao nhất, giảm gián đoạn cuộc gọi VoLTE / ViLTE và ping game qua mạng di động Viettel, VinaPhone, MobiFone.',
      recommended: true,
      type: 'select',
      value: networkMode5G,
      onChange: (val) => setNetworkMode5G(val),
      options: [
        { value: '26', label: '5G NR All-Bands (SA/NSA Khóa Cứng - Đề Xuất Flagship)' },
        { value: '33', label: '5G / LTE Ưu Tiên Toàn Dải (NR/LTE/WCDMA/GSM)' },
        { value: '10', label: 'LTE / 4G Only (Ổn Định Cao & Tiết Kiệm Pin)' },
        { value: 'default', label: 'Mặc định nhà mạng (Tự Động Theo SIM)' },
      ],
    },
    {
      id: 'wifi_sleep_policy',
      category: 'wifi',
      categoryLabel: 'Driver Wi-Fi',
      title: 'Giữ Card Mạng Wi-Fi Luôn Thức (Sleep Policy 2 & Power Save 0)',
      scope: 'global: wifi_power_save & wifi_sleep_policy',
      desc: 'Vô hiệu hóa chế độ sleep của anten Wi-Fi khi tắt màn hình máy. Đặt policy = 2 (Never Sleep) để chip Broadcom / HiSilicon luôn giữ socket TCP.',
      impact: 'Dứt điểm hoàn toàn tình trạng trễ thông báo Zalo, Telegram, Shopee, TikTok và OTP ngân hàng khi máy ở chế độ chờ màn hình đen.',
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
      desc: 'Chặn tính năng tự ý nhảy từ Wi-Fi sang 4G/5G khi tín hiệu Wi-Fi giảm 1 vạch sóng, vốn làm ngắt kết nối WebSocket và rớt cuộc gọi thoại.',
      impact: 'Giữ kết nối mạng Wi-Fi liền mạch, không ngắt cuộc gọi Zalo/FB Messenger giữa chừng và tiết kiệm lưu lượng 4G.',
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
      desc: 'Thay thế địa chỉ ping kiểm tra độ trễ mạng nội địa Baidu/Honor Cloud bằng Google và Cloudflare độ trễ thấp tại Đông Nam Á.',
      impact: 'Hệ thống đo RTT chuẩn xác từng mili-giây, không báo nhầm "Mạng không có Internet" hoặc tự động ngắt Wi-Fi.',
      recommended: true,
      type: 'toggle',
      checked: googleRtt,
      onChange: (checked) => setGoogleRtt(checked),
    },
    {
      id: 'wifi_verbose_log',
      category: 'wifi',
      categoryLabel: 'Driver Wi-Fi',
      title: 'Tắt Ghi Nhật Ký Chi Tiết Wi-Fi (Verbose Logging Off)',
      scope: 'global: wifi_verbose_logging_enabled',
      desc: 'Dừng ghi các tệp log chẩn đoán sóng Wi-Fi liên tục vào bộ nhớ flash eMMC/UFS của thiết bị.',
      impact: 'Giảm tải CPU xử lý nền, tiết kiệm pin và kéo dài tuổi thọ chip nhớ flash.',
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
      desc: 'Thay thế máy chủ xác thực trạng thái Internet của Honor nội địa bằng máy chủ Google 204 hoặc Cloudflare 204 toàn cầu.',
      impact: 'Xóa sạch dấu chấm than phiền toái trên cột sóng Wi-Fi/4G và tăng tốc độ nhận diện mạng khi ra ngoài quán cafe.',
      recommended: true,
      type: 'select',
      value: captive,
      onChange: (val) => setCaptive(val),
      options: [
        { value: 'google', label: 'Google 204 (http://connectivitycheck.gstatic.com/generate_204 - Chuẩn Nhất)' },
        { value: 'cloudflare', label: 'Cloudflare 204 (http://cp.cloudflare.com/generate_204 - Tốc Độ Cao)' },
        { value: 'default', label: 'Mặc định nhà sản xuất (Honor Cloud TQ)' },
      ],
    },
    {
      id: 'private_dns_dot',
      category: 'dns',
      categoryLabel: 'Captive & DNS',
      title: 'Mã Hóa Tên Miền DNS Cá Nhân (Private DNS over TLS)',
      scope: 'global: private_dns_mode & private_dns_specifier',
      desc: 'Mã hóa toàn bộ các truy vấn tên miền DNS qua giao thức TLS, ngăn nhà mạng ISP chặn trang web hoặc thu thập lịch sử duyệt web.',
      impact: 'Bảo mật quyền riêng tư tối đa, chặn quảng cáo web và ứng dụng từ tầng mạng DNS.',
      recommended: true,
      type: 'custom_dns',
    },
    {
      id: 'infinite_bt_volume',
      category: 'bluetooth',
      categoryLabel: 'Âm Thanh & BT',
      title: 'Mở Khóa Âm Lượng Bluetooth Vô Cực (Infinite Volume BT A2DP)',
      scope: 'secure: infinite_volume_music_bt_a2dp',
      desc: 'Phá vỡ giới hạn ngưỡng âm lượng an toàn (60-80dB) do quy định áp đặt lên giao thức Bluetooth A2DP.',
      impact: 'Âm lượng tai nghe không dây TWS và loa Bluetooth to hơn 30-40%, âm trường mở rộng và không bị giới hạn âm lượng.',
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
        item.desc.toLowerCase().includes(q) ||
        item.scope.toLowerCase().includes(q) ||
        item.categoryLabel.toLowerCase().includes(q)
      );
    });
  }, [networkItems, activeModule, searchQuery]);

  return (
    <div className="tab-pane active" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 1. Header & KPI Metric Ribbon */}
      <div className="specs-card" style={{ width: '100%' }}>
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
                Tích hợp công nghệ HonorHook: Khóa cứng 5G NR, Giữ Socket Wi-Fi thức, Captive 204 &amp; DoT
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
              <span>{isApplying ? 'Đang Áp Dụng...' : 'Lưu & Kích Hoạt Cấu Hình Mạng'}</span>
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

      {/* 2. CRM / ERP Subnav & Search Bar */}
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
            placeholder="Tìm kiếm tham số mạng..."
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

      {/* 3. Detailed Parameter Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="telemetry-card"
            style={{
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              background: 'var(--panel-alt)',
              borderRadius: '8px',
              border: '1px solid var(--border-light)',
            }}
          >
            {/* Row Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '14px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', flex: 1, minWidth: '280px' }}>
                <span className="svg-icon" style={{ color: 'var(--brand-accent)', marginTop: '2px' }}>
                  {item.category === 'cellular' && (
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M2 20h.01M7 20v-4M12 20v-8M17 20V4M22 20v-12"></path>
                    </svg>
                  )}
                  {item.category === 'wifi' && (
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
                      <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
                      <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
                      <line x1="12" y1="20" x2="12.01" y2="20"></line>
                    </svg>
                  )}
                  {item.category === 'dns' && (
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="2" y1="12" x2="22" y2="12"></line>
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                    </svg>
                  )}
                  {item.category === 'bluetooth' && (
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6.5 6.5 17.5 17.5 12 23 12 1 17.5 6.5 6.5 17.5"></polyline>
                    </svg>
                  )}
                </span>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-bright)' }}>
                      {item.title}
                    </span>
                    <span className="badge-tag tag-neutral" style={{ fontSize: '10px' }}>
                      {item.categoryLabel}
                    </span>
                    <span className="badge-tag tag-safe" style={{ fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
                      {item.scope}
                    </span>
                    {item.recommended && (
                      <span className="badge-tag" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontSize: '9px' }}>
                        Khuyên Dùng
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '4px', lineHeight: '1.5' }}>
                    {item.desc}
                  </div>
                </div>
              </div>

              {/* Action Control: Switch or Select */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                    disabled={!isOnline}
                    style={{ minWidth: '220px', maxWidth: '320px', fontSize: '12px' }}
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

            {/* Custom DoT UI Special Block */}
            {item.type === 'custom_dns' && (
              <div
                style={{
                  background: 'var(--panel-base)',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-light)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <div style={{ flex: '1', minWidth: '220px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '4px' }}>
                      Máy chủ DNS cài sẵn:
                    </div>
                    <select
                      className="tool-select"
                      style={{ width: '100%', fontSize: '12px' }}
                      value={dnsPreset}
                      onChange={handleDnsChange}
                      disabled={!isOnline}
                    >
                      <option value="cloudflare">Cloudflare DoT (one.one.one.one - Tốc độ cao)</option>
                      <option value="google">Google Public DNS (dns.google - Ổn định)</option>
                      <option value="adguard">AdGuard AdBlock (dns.adguard-dns.com - Chặn quảng cáo)</option>
                      <option value="nextdns">NextDNS (dns.nextdns.io - Chặn theo dõi)</option>
                      <option value="quad9">Quad9 Secure (dns.quad9.net - Bảo mật mã độc)</option>
                      <option value="custom">Điền thủ công máy chủ DoT riêng...</option>
                      <option value="off">Tắt Private DNS</option>
                    </select>
                  </div>

                  <div style={{ flex: '1.4', minWidth: '240px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '4px' }}>
                      Địa chỉ Hostname DoT (Domain Name):
                    </div>
                    <input
                      type="text"
                      className="tool-input"
                      style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: '12px' }}
                      placeholder="Ví dụ: your-id.dns.nextdns.io hoặc one.one.one.one"
                      value={customDns}
                      onChange={(e) => {
                        setCustomDns(e.target.value);
                        setDnsPreset('custom');
                      }}
                      disabled={!isOnline || dnsPreset === 'off'}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Impact Note */}
            {item.impact && (
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--text-dim)',
                  background: 'rgba(56, 189, 248, 0.05)',
                  padding: '6px 10px',
                  borderRadius: '4px',
                  borderLeft: '2px solid #38bdf8',
                  lineHeight: '1.4',
                }}
              >
                <b style={{ color: '#38bdf8' }}>Hiệu quả:</b> {item.impact}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}