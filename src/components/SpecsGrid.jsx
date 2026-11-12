import React, { useState } from 'react';

export default function SpecsGrid({ device, onWhitelistApps, onNavigateTab }) {
  const [copiedKey, setCopiedKey] = useState(null);
  const isOnline = device && device.connected;

  const handleCopy = (text, key) => {
    if (!text || text === '--') return;
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  return (
    <main className="device-detail-pane">
      {/* 1. Top 4 MagicOS 10/11 Metric Capsules */}
      <div className="magicos-metric-grid">
        {/* Metric 1: SoC */}
        <div className="metric-capsule">
          <div className="metric-capsule-icon icon-soc">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="4" y="4" width="16" height="16" rx="2"></rect>
              <rect x="9" y="9" width="6" height="6"></rect>
              <line x1="9" y1="1" x2="9" y2="4"></line>
              <line x1="15" y1="1" x2="15" y2="4"></line>
              <line x1="9" y1="20" x2="9" y2="23"></line>
              <line x1="15" y1="20" x2="15" y2="23"></line>
              <line x1="20" y1="9" x2="23" y2="9"></line>
              <line x1="20" y1="14" x2="23" y2="14"></line>
              <line x1="1" y1="9" x2="4" y2="9"></line>
              <line x1="1" y1="14" x2="4" y2="14"></line>
            </svg>
          </div>
          <div className="metric-capsule-content">
            <span className="metric-capsule-label">Vi Xử Lý (CPU / SoC)</span>
            <span className="metric-capsule-val">
              {isOnline ? (device.soc || device.cpu_display || 'Snapdragon / Dimensity') : '--'}
            </span>
            <span className="metric-capsule-sub">
              {isOnline ? `${device.cpu_abi || 'arm64-v8a'} • Android ${device.android_version}${device.page_size_str ? ` • ${device.page_size_str}` : ''}` : 'Chờ thiết bị'}
            </span>
          </div>
        </div>

        {/* Metric 2: Battery */}
        <div className="metric-capsule">
          <div className="metric-capsule-icon icon-battery">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="16" height="10" rx="2" ry="2"></rect>
              <line x1="22" y1="11" x2="22" y2="13"></line>
              <polygon points="10 9 7 12 11 12 8 15 13 11 9 11 10 9" fill="currentColor"></polygon>
            </svg>
          </div>
          <div className="metric-capsule-content">
            <span className="metric-capsule-label">Pin & Năng Lượng</span>
            <span className="metric-capsule-val" style={{ color: isOnline && device.battery_level <= 20 ? '#d97706' : 'var(--text-bright)' }}>
              {isOnline ? `${device.battery_level}% • ${device.battery_temp}°C` : '--'}
            </span>
            <span className="metric-capsule-sub">
              {isOnline ? (device.battery_status || device.battery_desc || 'Sẵn sàng') : 'Chưa nhận diện'}
            </span>
          </div>
        </div>

        {/* Metric 3: Display */}
        <div className="metric-capsule">
          <div className="metric-capsule-icon icon-display">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
              <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
          </div>
          <div className="metric-capsule-content">
            <span className="metric-capsule-label">Màn Hình & Tần Số Quét</span>
            <span className="metric-capsule-val">
              {isOnline ? `${device.screen_width} × ${device.screen_height}` : '--'}
            </span>
            <span className="metric-capsule-sub" style={{ color: isOnline ? 'var(--magicos-purple)' : 'var(--text-muted)' }}>
              {isOnline ? `${device.max_hz || 120}Hz • Chuẩn: ${device.sweet_spot_dpi || 385} DPI` : 'Chờ thiết bị'}
            </span>
          </div>
        </div>

        {/* Metric 4: OS & ROM */}
        <div className="metric-capsule">
          <div className="metric-capsule-icon icon-os">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              <polyline points="9 12 11 14 15 10"></polyline>
            </svg>
          </div>
          <div className="metric-capsule-content">
            <span className="metric-capsule-label">Hệ Điều Hành MagicOS</span>
            <span className="metric-capsule-val" style={{ color: isOnline ? 'var(--magicos-blue)' : 'var(--text-bright)' }}>
              {isOnline ? device.magic_version : '--'}
            </span>
            <span className="metric-capsule-sub">
              {isOnline ? (device.rom_region || 'Nội Địa TQ (C00)') : 'Chờ thiết bị'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Hardware Specs Matrix Card */}
      <div className="specs-card">
        <div className="specs-header-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="svg-icon" style={{ color: 'var(--magicos-blue)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="3" y1="9" x2="21" y2="9"></line>
                <line x1="9" y1="21" x2="9" y2="9"></line>
              </svg>
            </span>
            <span>Thông Số Kỹ Thuật Phần Cứng & Hệ Thống Chi Tiết</span>
          </div>
          <span id="txtDeviceStatusBadge" className={`badge-tag ${isOnline ? 'tag-safe' : 'tag-danger'}`}>
            {isOnline ? 'ADB Trực Tuyến' : 'Chưa Kết Nối'}
          </span>
        </div>

        <table className="specs-table">
          <tbody>
            <tr>
              <td className="label-col">Tên thương mại:</td>
              <td id="specCommercialName" className="val-col">
                {isOnline ? device.commercial_name : '--'}
              </td>
              <td className="label-col">Mã kỹ thuật (Model / SKU):</td>
              <td id="specModelCode" className="val-col highlight">
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span>{isOnline ? device.model : '--'}</span>
                  {isOnline && (
                    <button
                      type="button"
                      className="btn-tool"
                      style={{ padding: '2px 6px', fontSize: '10px' }}
                      onClick={() => handleCopy(device.model, 'model')}
                      title="Sao chép Model"
                    >
                      {copiedKey === 'model' ? 'Đã chép' : 'Chép'}
                    </button>
                  )}
                </div>
              </td>
            </tr>
            <tr>
              <td className="label-col">Dòng sản phẩm (Series):</td>
              <td id="specSeries" className="val-col">
                {isOnline ? device.series : '--'}
              </td>
              <td className="label-col">Số Serial / Định danh:</td>
              <td id="specSerial" className="val-col highlight">
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span>{isOnline ? device.serial : '--'}</span>
                  {isOnline && (
                    <button
                      type="button"
                      className="btn-tool"
                      style={{ padding: '2px 6px', fontSize: '10px' }}
                      onClick={() => handleCopy(device.serial, 'serial')}
                      title="Sao chép Serial"
                    >
                      {copiedKey === 'serial' ? 'Đã chép' : 'Chép'}
                    </button>
                  )}
                </div>
              </td>
            </tr>
            <tr>
              <td className="label-col">Vi xử lý (CPU / SoC):</td>
              <td id="specSoc" className="val-col">
                {isOnline ? (device.soc || device.cpu_display) : '--'}
              </td>
              <td className="label-col">Phiên bản MagicOS:</td>
              <td
                id="specMagicVer"
                className="val-col highlight"
                title={isOnline ? `Khu vực: ${device.rom_region} • Mã bản dựng: ${device.rom_build || ''}` : ''}
              >
                {isOnline ? device.magic_version : '--'}
              </td>
            </tr>
            <tr>
              <td className="label-col">Màn hình vật lý:</td>
              <td id="specResolution" className="val-col">
                {isOnline
                  ? `${device.screen_width} × ${device.screen_height} (${device.max_hz || 120}Hz)`
                  : '--'}
              </td>
              <td className="label-col">Phiên bản Android:</td>
              <td id="specAndroidVer" className="val-col">
                {isOnline ? `Android ${device.android_version}${device.page_size_str ? ` (${device.page_size_str} Pages)` : ''}` : '--'}
              </td>
            </tr>
            <tr>
              <td className="label-col">Mật độ hiển thị (DPI):</td>
              <td id="specDensity" className="val-col">
                {isOnline ? `${device.current_dpi} DPI` : '--'}
              </td>
              <td className="label-col">DPI Chuẩn Mắt (Sweet Spot):</td>
              <td id="specSweetDpi" className="val-col highlight" style={{ color: '#059669' }}>
                {isOnline ? `${device.sweet_spot_dpi} DPI (Chuẩn 385 dp)` : '--'}
              </td>
            </tr>
            <tr>
              <td className="label-col">Dung lượng Pin & Tình trạng:</td>
              <td id="specBattery" className="val-col">
                {isOnline
                  ? `${device.battery_desc} (${device.battery_level}% • ${device.battery_temp}°C - ${device.battery_status})`
                  : '--'}
              </td>
              <td className="label-col">Tiêu chuẩn kháng nước:</td>
              <td id="specWaterproof" className="val-col">
                {isOnline ? device.waterproof : '--'}
              </td>
            </tr>
            <tr>
              <td className="label-col">Độ bền thân vỏ / Kính:</td>
              <td id="specDurability" className="val-col">
                {isOnline ? device.durability : '--'}
              </td>
              <td className="label-col">Trạng thái Root / SELinux:</td>
              <td className="val-col">
                {isOnline ? (device.root_selinux || 'Chưa Root (Enforcing)') : '--'}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Storage Breakdown */}
        <div className="storage-progress-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--text-dim)' }}>
            <span>
              Bộ Nhớ Trong: <b id="txtStorageUsed" style={{ color: 'var(--text-bright)' }}>{isOnline ? (device.storage_used_str || '--') : '--'}</b> / {isOnline ? (device.storage_total_str || '--') : '--'} {isOnline && device.storage_percent ? `(Đã dùng ~${device.storage_percent}%)` : ''}
            </span>
            <span>
              Khả dụng: <b id="txtStorageFree" style={{ color: '#059669' }}>{isOnline ? (device.storage_free_str || '--') : '--'}</b>
            </span>
          </div>
          <div className="storage-bar">
            <div
              className="storage-segment seg-apps"
              style={{ width: `${isOnline && device.storage_percent ? Math.round(device.storage_percent * 0.5) : 0}%` }}
              title="Ứng dụng"
            ></div>
            <div
              className="storage-segment seg-media"
              style={{ width: `${isOnline && device.storage_percent ? Math.round(device.storage_percent * 0.3) : 0}%` }}
              title="Ảnh & Video"
            ></div>
            <div
              className="storage-segment seg-system"
              style={{ width: `${isOnline && device.storage_percent ? Math.round(device.storage_percent * 0.2) : 0}%` }}
              title="Hệ thống MagicOS"
            ></div>
            <div
              className="storage-segment seg-free"
              style={{ width: `${isOnline && device.storage_percent ? 100 - device.storage_percent : 100}%` }}
              title="Còn trống"
            ></div>
          </div>
        </div>
      </div>

      {/* 3. Health & Cleanliness Diagnostic Assessment */}
      <div className="specs-card">
        <div className="specs-header-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="svg-icon" style={{ color: '#10b981' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
            </span>
            <span>Đánh Giá Độ Sạch & Tối Ưu Hệ Thống MagicOS</span>
          </div>
          <span
            id="txtHealthScoreBadge"
            className={`badge-tag ${isOnline && device.health_score >= 80 ? 'tag-safe' : (isOnline && device.health_score >= 50 ? 'tag-warn' : 'tag-danger')}`}
            style={{ fontSize: '12px' }}
          >
            {isOnline && typeof device.health_score === 'number' ? `${device.health_score}/100 Điểm` : '--/100 Điểm'}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '8px' }}>
          {/* Tile 1: Bloatware */}
          <div style={{ background: 'var(--panel-alt)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '4px' }}>Dịch Vụ Rác Nội Địa TQ:</div>
              <div id="statBloatStatus" style={{ fontWeight: 600, color: isOnline ? '#10b981' : 'var(--text-muted)', fontSize: '12px', lineHeight: '1.4' }}>
                {isOnline ? (device.bloat_summary || 'Đã dọn sạch bloatware') : 'Chờ thiết bị'}
              </div>
            </div>
            {isOnline && (
              <button
                type="button"
                className="btn-tool"
                style={{ marginTop: '8px', fontSize: '11px', padding: '3px 8px', width: '100%', justifyContent: 'center' }}
                onClick={() => onNavigateTab?.('debloat')}
              >
                Dọn Rác Hệ Thống
              </button>
            )}
          </div>

          {/* Tile 2: FCM Notification */}
          <div style={{ background: 'var(--panel-alt)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '4px' }}>FCM Thông Báo App VN:</div>
              <div id="statFcmStatus" style={{ fontWeight: 600, color: isOnline ? 'var(--magicos-blue)' : 'var(--text-muted)', fontSize: '12px', lineHeight: '1.4' }}>
                {isOnline ? (device.fcm_summary || 'Đang đồng bộ...') : 'Chờ thiết bị'}
              </div>
            </div>
            {isOnline && (
              <button
                type="button"
                className="btn-tool primary"
                style={{ marginTop: '8px', fontSize: '11px', padding: '3px 8px', width: '100%', justifyContent: 'center' }}
                onClick={() => onWhitelistApps?.()}
                title="Cấp quyền chạy nền không bị trễ thông báo Zalo / Ngân hàng"
              >
                Fix Trễ Thông Báo
              </button>
            )}
          </div>

          {/* Tile 3: Private DNS DoT */}
          <div style={{ background: 'var(--panel-alt)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '4px' }}>Bảo Mật DNS DoT:</div>
              <div id="statDnsStatus" style={{ fontWeight: 600, color: isOnline ? '#10b981' : 'var(--text-muted)', fontSize: '12px', lineHeight: '1.4' }}>
                {isOnline
                  ? (device.current_dns_spec || (device.current_dns_mode === 'off' ? 'Chưa bật DoT' : 'Tự động'))
                  : 'Chờ thiết bị'}
              </div>
            </div>
            {isOnline && (
              <button
                type="button"
                className="btn-tool"
                style={{ marginTop: '8px', fontSize: '11px', padding: '3px 8px', width: '100%', justifyContent: 'center' }}
                onClick={() => onNavigateTab?.('network')}
              >
                Cấu Hình DNS
              </button>
            )}
          </div>

          {/* Tile 4: Google & GMS Suite */}
          <div style={{ background: 'var(--panel-alt)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '4px' }}>Dịch Vụ Google & CH Play:</div>
              <div style={{ fontWeight: 600, color: isOnline ? 'var(--magicos-blue)' : 'var(--text-muted)', fontSize: '12px', lineHeight: '1.4' }}>
                {isOnline ? 'Google Play & Trợ Lý VXM' : 'Chờ thiết bị'}
              </div>
            </div>
            {isOnline && (
              <button
                type="button"
                className="btn-tool"
                style={{ marginTop: '8px', fontSize: '11px', padding: '3px 8px', width: '100%', justifyContent: 'center' }}
                onClick={() => onNavigateTab?.('toolbox')}
              >
                Hộp Công Cụ GMS
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
