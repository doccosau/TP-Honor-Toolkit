import React from 'react';

export default function SpecsGrid({ device }) {
  const isOnline = device && device.connected;

  return (
    <main className="device-detail-pane">
      {/* Hardware Specs Table */}
      <div className="specs-card">
        <div className="specs-header-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="svg-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="3" y1="9" x2="21" y2="9"></line>
                <line x1="9" y1="21" x2="9" y2="9"></line>
              </svg>
            </span>
            <span>Thông Số Kỹ Thuật Phần Cứng & Hệ Thống</span>
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
                {isOnline ? device.model : '--'}
              </td>
            </tr>
            <tr>
              <td className="label-col">Dòng sản phẩm (Series):</td>
              <td id="specSeries" className="val-col">
                {isOnline ? device.series : '--'}
              </td>
              <td className="label-col">Số Serial / Định danh:</td>
              <td id="specSerial" className="val-col highlight">
                {isOnline ? device.serial : '--'}
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
                {isOnline ? `Android ${device.android_version}` : '--'}
              </td>
            </tr>
            <tr>
              <td className="label-col">Mật độ hiển thị (DPI):</td>
              <td id="specDensity" className="val-col">
                {isOnline ? `${device.current_dpi} DPI` : '--'}
              </td>
              <td className="label-col">DPI Chuẩn Mắt (Sweet Spot):</td>
              <td id="specSweetDpi" className="val-col highlight" style={{ color: '#10b981' }}>
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
              <td className="val-col">Chưa Root (Enforcing)</td>
            </tr>
          </tbody>
        </table>

        {/* Storage Breakdown */}
        <div className="storage-progress-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-dim)' }}>
            <span>
              Bộ Nhớ Trong: <b id="txtStorageUsed" style={{ color: 'var(--text-bright)' }}>52.4 GB</b> / 256 GB (Đã dùng ~20%)
            </span>
            <span>
              Khả dụng: <b id="txtStorageFree" style={{ color: '#10b981' }}>203.6 GB</b>
            </span>
          </div>
          <div className="storage-bar">
            <div className="storage-segment seg-apps" title="Ứng dụng"></div>
            <div className="storage-segment seg-media" title="Ảnh & Video"></div>
            <div className="storage-segment seg-system" title="Hệ thống MagicOS"></div>
            <div className="storage-segment seg-free" title="Còn trống"></div>
          </div>
        </div>
      </div>

      {/* Health & Diagnostic Assessment (Exact matching screenshot) */}
      <div className="specs-card">
        <div className="specs-header-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="svg-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
            </span>
            <span>Đánh Giá Độ Sạch & Tối Ưu Hệ Thống</span>
          </div>
          <span id="txtHealthScoreBadge" className="badge-tag tag-safe" style={{ fontSize: '12px' }}>
            {isOnline ? `${device.health_score || 90}/100 Điểm` : '--/100 Điểm'}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '6px' }}>
          <div style={{ background: 'var(--panel-alt)', padding: '10px', borderRadius: '3px', border: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Dịch Vụ Rác TQ:</div>
            <div id="statBloatStatus" style={{ fontWeight: 600, color: '#10b981', marginTop: '4px' }}>
              Đã dọn sạch 12 app
            </div>
          </div>
          <div style={{ background: 'var(--panel-alt)', padding: '10px', borderRadius: '3px', border: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>FCM Thông Báo App VN:</div>
            <div id="statFcmStatus" style={{ fontWeight: 600, color: '#38bdf8', marginTop: '4px' }}>
              Đã Whitelist Pin & Chạy nền
            </div>
          </div>
          <div style={{ background: 'var(--panel-alt)', padding: '10px', borderRadius: '3px', border: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Kết Nối Mạng & DNS:</div>
            <div id="statDnsStatus" style={{ fontWeight: 600, color: '#10b981', marginTop: '4px' }}>
              {isOnline && device.current_dns_spec ? `${device.current_dns_spec}` : 'Cloudflare DoT (one.one.one.one)'}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
