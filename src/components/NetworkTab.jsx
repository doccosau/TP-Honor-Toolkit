import React, { useState, useEffect } from 'react';

export default function NetworkTab({ device, onApplyNetwork }) {
  const [captive, setCaptive] = useState('google');
  const [dnsPreset, setDnsPreset] = useState('cloudflare');
  const [customDns, setCustomDns] = useState('one.one.one.one');
  const [disableWifiPro, setDisableWifiPro] = useState(true);
  const [googleRtt, setGoogleRtt] = useState(true);
  const [disableWifiSleep, setDisableWifiSleep] = useState(true);

  const isOnline = device && device.connected;

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

  const handleApply = () => {
    onApplyNetwork({
      captive,
      dns: dnsPreset,
      customDns,
      disableWifipro: disableWifiPro,
    });
  };

  return (
    <div className="tab-pane active" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div className="specs-card" style={{ width: '100%' }}>
        {/* Card Header */}
        <div className="specs-header-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="svg-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
                <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
                <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
                <line x1="12" y1="20" x2="12.01" y2="20"></line>
              </svg>
            </span>
            <span>Tinh Chỉnh Tham Số Mạng, Captive Portal & Private DNS DoT</span>
          </div>
          <button className="btn-tool primary" onClick={handleApply} disabled={!isOnline}>
            <span className="svg-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                <polyline points="7 3 7 8 15 8"></polyline>
              </svg>
            </span>
            <span>Lưu & Áp Dụng Cấu Hình</span>
          </button>
        </div>

        {/* 2-Columns Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px', margin: '14px 0' }}>
          {/* Captive Portal */}
          <div style={{ background: 'var(--panel-alt)', padding: '12px', borderRadius: '4px', border: '1px solid var(--border-light)' }}>
            <div style={{ fontWeight: 600, color: 'var(--text-bright)', marginBottom: '8px' }}>
              Máy Chủ Kiểm Tra Kết Nối (Captive Portal 204)
            </div>
            <select
              className="tool-select"
              style={{ width: '100%', marginBottom: '6px' }}
              value={captive}
              onChange={(e) => setCaptive(e.target.value)}
              disabled={!isOnline}
            >
              <option value="google">Google 204 (http://connectivitycheck.gstatic.com/generate_204)</option>
              <option value="cloudflare">Cloudflare (http://cp.cloudflare.com/generate_204)</option>
              <option value="default">Mặc định nhà sản xuất (Honor Cloud TQ)</option>
            </select>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', lineHeight: '1.5' }}>
              Giải quyết triệt để lỗi dấu chấm than trên cột sóng Wi-Fi và độ trễ nhận diện Internet tại Việt Nam.
            </div>
          </div>

          {/* Private DNS DoT */}
          <div style={{ background: 'var(--panel-alt)', padding: '12px', borderRadius: '4px', border: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-bright)' }}>Mã Hóa DNS Cá Nhân (Private DNS over TLS)</span>
              <span className={`badge-tag ${device?.current_dns_spec ? 'tag-safe' : 'tag-neutral'}`} style={{ fontSize: '10px' }}>
                {device?.current_dns_spec ? `Đang bật: ${device.current_dns_spec}` : 'Chưa đặt'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <select
                className="tool-select"
                style={{ flex: 1 }}
                value={dnsPreset}
                onChange={handleDnsChange}
                disabled={!isOnline}
              >
                <option value="cloudflare">Cloudflare (one.one.one.one)</option>
                <option value="google">Google (dns.google)</option>
                <option value="adguard">AdGuard AdBlock (dns.adguard-dns.com)</option>
                <option value="nextdns">NextDNS (dns.nextdns.io)</option>
                <option value="quad9">Quad9 Secure (dns.quad9.net)</option>
                <option value="custom">Tự điền thủ công (Custom DoT)...</option>
                <option value="off">Tắt Private DNS</option>
              </select>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '4px' }}>
                Địa chỉ Hostname DNS DoT tự điền:
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
                disabled={!isOnline}
              />
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '6px' }}>
              Anh có thể tự do điền bất kỳ máy chủ DoT nào (NextDNS cá nhân, AdGuard Home, Pi-hole...).
            </div>
          </div>
        </div>

        {/* Wi-Fi Driver Options */}
        <div style={{ background: 'var(--panel-alt)', padding: '14px', borderRadius: '4px', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontWeight: 600, color: 'var(--text-bright)', marginBottom: '4px' }}>
            Tùy Chọn Chuyên Sâu Driver Wi-Fi MagicOS:
          </div>
          <label style={{ display: 'flex', alignItem: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px' }}>
            <input
              type="checkbox"
              checked={disableWifiPro}
              onChange={(e) => setDisableWifiPro(e.target.checked)}
              disabled={!isOnline}
            />
            <span><b>Vô hiệu hóa Wi-Fi Pro & Link Turbo:</b> Ngăn chuyển mạng ngầm gây rớt kết nối cuộc gọi Zalo / Messenger.</span>
          </label>
          <label style={{ display: 'flex', alignItem: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px' }}>
            <input
              type="checkbox"
              checked={googleRtt}
              onChange={(e) => setGoogleRtt(e.target.checked)}
              disabled={!isOnline}
            />
            <span><b>Đổi máy chủ đo độ trễ RTT sang Google:</b> Thay thế địa chỉ máy chủ Baidu nội địa của MagicOS.</span>
          </label>
          <label style={{ display: 'flex', alignItem: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px' }}>
            <input
              type="checkbox"
              checked={disableWifiSleep}
              onChange={(e) => setDisableWifiSleep(e.target.checked)}
              disabled={!isOnline}
            />
            <span><b>Tắt chế độ Wi-Fi ngủ tiết kiệm điện (Policy 2):</b> Giữ card mạng luôn thức để nhận push OTP tức thì.</span>
          </label>
        </div>
      </div>
    </div>
  );
}
