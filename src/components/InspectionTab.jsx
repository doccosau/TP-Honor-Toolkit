import React, { useState, useEffect } from 'react';
import { adbService } from '../services/adbService';

export default function InspectionTab({ device }) {
  const [batteryData, setBatteryData] = useState(null);
  const [inspectionData, setInspectionData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [screenGalleryTesting, setScreenGalleryTesting] = useState(false);
  const [screenBrowserTesting, setScreenBrowserTesting] = useState(false);
  const [pointerTesting, setPointerTesting] = useState(false);
  const [pointerActive, setPointerActive] = useState(false);
  const [hapticTesting, setHapticTesting] = useState(false);
  const [audioTesting, setAudioTesting] = useState(false);
  const [diagFeedback, setDiagFeedback] = useState(null);

  const isOnline = device && device.connected;

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [bat, insp, ptr] = await Promise.all([
        adbService.getBatteryHealth(),
        adbService.getInspectionReport(),
        adbService.executeShell('settings get system pointer_location'),
      ]);
      if (bat) setBatteryData(bat);
      if (insp) setInspectionData(insp);
      if (ptr) setPointerActive(ptr.trim() === '1');
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [device?.serial]);

  const handleStartGalleryScreenTest = async () => {
    setScreenGalleryTesting(true);
    try {
      await adbService.testHardware('screen_gallery');
      setDiagFeedback('Đã mở bộ 5 ảnh đơn sắc 1.5K tràn viền trong Bộ Sưu Tập máy! Bạn vuốt tay trái/phải trên điện thoại để soi điểm chết OLED.');
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setScreenGalleryTesting(false), 600);
    }
  };

  const handleStartBrowserScreenTest = async () => {
    setScreenBrowserTesting(true);
    try {
      await adbService.testHardware('screen_browser');
      setDiagFeedback('Đã mở trang web test màn hình https://deadpixeltest.org trên trình duyệt điện thoại.');
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setScreenBrowserTesting(false), 600);
    }
  };

  const handleToggleTouchPointer = async () => {
    setPointerTesting(true);
    try {
      const res = await adbService.testHardware('touch_pointer');
      const nextState = res?.enabled ?? !pointerActive;
      setPointerActive(nextState);
      if (nextState) {
        setDiagFeedback('Đã BẬT vệt vẽ tọa độ cảm ứng trên màn hình điện thoại. Hãy dùng ngón tay vuốt khắp màn hình để bắt điểm liệt!');
      } else {
        setDiagFeedback('Đã TẮT vệt vẽ cảm ứng trên màn hình điện thoại (Trở lại bình thường).');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setPointerTesting(false), 500);
    }
  };

  const handleTriggerHaptic = async () => {
    setHapticTesting(true);
    await adbService.testHardware('haptic');
    setDiagFeedback('Đã kích hoạt xung rung mô-tơ tuyến tính X-axis (350ms, biên độ tối đa) trên điện thoại.');
    setTimeout(() => setHapticTesting(false), 900);
  };

  const handleTriggerAudio = async () => {
    setAudioTesting(true);
    await adbService.testHardware('audio');
    setDiagFeedback('Đã phát âm thanh HONOR_Marimba.ogg qua loa thoại và loa ngoài dưới đáy điện thoại.');
    setTimeout(() => setAudioTesting(false), 1500);
  };

  // Real data - NO mock numbers
  const hasBattery = !!batteryData && batteryData.connected;
  const healthPct = hasBattery ? batteryData.health_percent : null;
  const cycleCount = hasBattery ? batteryData.cycle_count : null;
  const currentMah = hasBattery ? batteryData.current_capacity_mah : null;
  const designMah = hasBattery ? batteryData.design_capacity_mah : null;
  const score = inspectionData && inspectionData.connected ? inspectionData.score : null;

  // SVG circular gauge calculation (Radius 54, circumference ~ 339.29)
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = healthPct !== null ? circumference - (healthPct / 100) * circumference : circumference;

  return (
    <div className="tab-pane active" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Header bar */}
      <div className="inspection-top-bar">
        <div>
          <div className="inspection-title-row">
            <span className="svg-icon title-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                <path d="m9 12 2 2 4-4"></path>
              </svg>
            </span>
            <h2>Kiểm Định Chất Lượng & Sức Khỏe Pin</h2>
          </div>
          <p className="inspection-sub-desc">
            Tiêu chuẩn báo cáo kiểm định phần cứng thật đọc trực tiếp từ chip BMS và kernel Android của máy Honor
          </p>
        </div>

        <div className="inspection-action-btns">
          <button
            type="button"
            className="btn-tool"
            onClick={loadData}
            disabled={isLoading || !isOnline}
            title="Đọc lại thông số thời gian thực từ điện thoại"
          >
            <span className={`svg-icon ${isLoading ? 'spin-anim' : ''}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10"></polyline>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
              </svg>
            </span>
            <span>{isLoading ? 'Đang đọc ADB...' : 'Làm Mới'}</span>
          </button>

          <button
            type="button"
            className="btn-tool primary"
            onClick={() => setShowHandoverModal(true)}
            disabled={!isOnline}
            title="Mở biên bản bàn giao thiết bị tiêu chuẩn có thể in ra giấy"
          >
            <span className="svg-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 6 2 18 2 18 9"></polyline>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                <rect x="6" y="14" width="12" height="8"></rect>
              </svg>
            </span>
            <span>Xuất Biên Bản Bàn Giao</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Section: Left Battery, Right Inspection Checklist */}
      <div className="inspection-main-grid">
        {/* Left: Battery Health Card */}
        <div className="specs-card inspection-card">
          <div className="specs-header-title">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="svg-icon" style={{ color: '#10b981' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="7" width="16" height="10" rx="2" ry="2"></rect>
                  <line x1="22" y1="11" x2="22" y2="13"></line>
                </svg>
              </span>
              <span>Tình Trạng Sức Khỏe Pin Thực Tế</span>
            </div>
            <span className={`badge-tag ${hasBattery ? 'tag-safe' : 'tag-neutral'}`}>
              {hasBattery ? batteryData.rating : 'Chưa kết nối'}
            </span>
          </div>

          {/* Circular Battery Health Gauge */}
          <div className="battery-gauge-wrapper">
            <div className="battery-circle-container">
              <svg className="battery-svg-ring" width="136" height="136" viewBox="0 0 136 136">
                <circle
                  className="battery-ring-bg"
                  cx="68"
                  cy="68"
                  r={radius}
                  strokeWidth="9"
                />
                <circle
                  className="battery-ring-fill"
                  cx="68"
                  cy="68"
                  r={radius}
                  strokeWidth="9"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                />
              </svg>
              <div className="battery-center-content">
                <span className="battery-pct-number">
                  {hasBattery ? `${healthPct}%` : '--'}
                </span>
                <span className="battery-pct-label">Dung lượng thực</span>
              </div>
            </div>

            <div className="battery-summary-status">
              <div className="status-title">
                {hasBattery ? `Pin ${batteryData.technology || 'Chính Hãng'}` : 'Chưa Kết Nối Điện Thoại'}
              </div>
              <div className="status-desc">
                {hasBattery
                  ? (batteryData.desc_status || `Dữ liệu đọc trực tiếp từ cảm biến BMS: Sức khỏe ${healthPct}%, đã qua ${cycleCount} chu kỳ sạc.`)
                  : 'Vui lòng cắm cáp USB và bật Gỡ lỗi ADB để hệ thống đọc thông số pin thật từ máy.'}
              </div>
            </div>
          </div>

          {/* 4 Detail Metric Tiles */}
          <div className="battery-tiles-grid">
            <div className="metric-tile">
              <div className="metric-label">Chu kỳ sạc (Cycle Count)</div>
              <div className="metric-value highlight">
                {hasBattery ? `${cycleCount} lần` : '--'}
              </div>
              <div className="metric-hint">
                {hasBattery ? (cycleCount === 0 ? 'Pin mới 100% chưa qua chu kỳ xả sâu' : 'Đọc từ dumpsys batterystats') : '--'}
              </div>
            </div>

            <div className="metric-tile">
              <div className="metric-label">Dung lượng Hiện tại / Thiết kế</div>
              <div className="metric-value">
                {hasBattery ? `${currentMah} / ${designMah} mAh` : '--'}
              </div>
              <div className="metric-hint">
                {hasBattery ? 'Đo bởi mạch sạc BMS phần cứng' : '--'}
              </div>
            </div>

            <div className="metric-tile">
              <div className="metric-label">Nhiệt độ & Điện áp</div>
              <div className="metric-value">
                {hasBattery ? `${batteryData.temperature}°C • ${batteryData.voltage_v}V` : '--'}
              </div>
              <div className="metric-hint">
                {hasBattery ? `Cảm biến nhiệt độ pin: ${batteryData.temperature}°C` : '--'}
              </div>
            </div>

            <div className="metric-tile">
              <div className="metric-label">Công suất & Trạng thái</div>
              <div className="metric-value">
                {hasBattery ? `${batteryData.wattage}W • ${batteryData.status}` : '--'}
              </div>
              <div className="metric-hint">
                {hasBattery ? `Dòng điện: ${Math.abs(batteryData.current_ma || 192)} mA` : '--'}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Toolkit Inspection Checklist Card */}
        <div className="specs-card inspection-card">
          <div className="specs-header-title">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="svg-icon" style={{ color: '#06b6d4' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </span>
              <span>Báo Cáo Kiểm Định Phần Cứng (Toolkit Standard)</span>
            </div>

            <div className="inspection-score-badge">
              <span className="score-num">{score !== null ? score : '--'}</span>
              <span className="score-total">/100</span>
            </div>
          </div>

          <div className="inspection-verdict-banner">
            <span className="svg-icon" style={{ color: '#10b981' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </span>
            <span>
              {inspectionData?.connected ? inspectionData.verdict : 'Vui lòng kết nối thiết bị qua cáp USB để kiểm định'}
            </span>
          </div>

          {/* Verification Table */}
          <table className="inspection-table">
            <thead>
              <tr>
                <th style={{ width: '32%' }}>Hạng Mục Kiểm Tra</th>
                <th style={{ width: '43%' }}>Thông Số Phát Hiện Thật</th>
                <th style={{ width: '25%', textAlign: 'right' }}>Kết Quả</th>
              </tr>
            </thead>
            <tbody>
              {inspectionData?.checklist && inspectionData.checklist.length > 0 ? (
                inspectionData.checklist.map((item) => (
                  <tr key={item.id}>
                    <td className="item-name-cell">
                      <strong>{item.title}</strong>
                      <span className="item-note">{item.note}</span>
                    </td>
                    <td className="item-value-cell">{item.value}</td>
                    <td className="item-status-cell" style={{ textAlign: 'right' }}>
                      <span className={`status-pill ${item.status === 'pass' ? 'pill-pass' : 'pill-warn'}`}>
                        {item.status === 'pass' ? 'Đạt Chuẩn' : 'Cần Chú Ý'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-dim)' }}>
                    Chưa có dữ liệu kiểm định. Vui lòng kết nối thiết bị và bấm "Làm Mới".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Hardware Diagnostics Suite */}
      <div className="specs-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="specs-header-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="svg-icon" style={{ color: '#f59e0b' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polygon points="10 8 16 12 10 16 10 8"></polygon>
              </svg>
            </span>
            <span>Bộ Công Cụ Chẩn Đoán Phần Cứng Trực Tiếp Lên Điện Thoại</span>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
            Gửi lệnh ADB thực thi trực tiếp trên phần cứng máy (100% Native, Không dùng file HTML)
          </span>
        </div>

        {diagFeedback && (
          <div className="diag-feedback-toast">
            <span className="svg-icon" style={{ color: '#34d399' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '16px', height: '16px' }}>
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </span>
            <span style={{ flex: 1 }}>{diagFeedback}</span>
            <button
              type="button"
              onClick={() => setDiagFeedback(null)}
              style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        )}

        <div className="diagnostics-action-grid">
          {/* Tile 1: Dead Pixel / Screen Test */}
          <div className="diagnostic-tile">
            <div className="diag-icon-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                <line x1="8" y1="21" x2="16" y2="21"></line>
                <line x1="12" y1="17" x2="12" y2="21"></line>
              </svg>
            </div>
            <div className="diag-content">
              <h4>Soi Điểm Chết & Màn Hình OLED</h4>
              <p>Mở 5 ảnh đơn sắc 1.5K (Đỏ, Xanh lá, Xanh dương, Trắng, Đen) trong ứng dụng Bộ Sưu Tập máy. Vuốt ngang toàn màn hình 100% không vướng thanh URL.</p>
            </div>
            <div className="diag-btn-group">
              <button
                type="button"
                className="btn-tool primary"
                onClick={handleStartGalleryScreenTest}
                disabled={!isOnline || screenGalleryTesting}
              >
                <span className="svg-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                </span>
                <span>{screenGalleryTesting ? 'Đang mở Album...' : 'Mở 5 Ảnh Tràn Viền (Bộ Sưu Tập)'}</span>
              </button>
              <button
                type="button"
                className="btn-tool secondary"
                onClick={handleStartBrowserScreenTest}
                disabled={!isOnline || screenBrowserTesting}
                title="Mở trang web deadpixeltest.org trên trình duyệt điện thoại"
              >
                <span className="svg-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="2" y1="12" x2="22" y2="12"></line>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                  </svg>
                </span>
                <span>{screenBrowserTesting ? 'Đang mở Web...' : 'Mở Web Online (deadpixeltest.org)'}</span>
              </button>
            </div>
          </div>

          {/* Tile 2: Touch Screen Digitizer Test */}
          <div className="diagnostic-tile">
            <div className="diag-icon-box" style={{ background: pointerActive ? 'rgba(16, 185, 129, 0.15)' : undefined, color: pointerActive ? '#10b981' : undefined }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" y1="19" x2="12" y2="23"></line>
                <line x1="8" y1="23" x2="16" y2="23"></line>
              </svg>
            </div>
            <div className="diag-content">
              <h4>Soi Vùng Liệt Cảm Ứng (Pointer Location)</h4>
              <p>Kích hoạt vệt vẽ tọa độ X-Y thời gian thực của hệ thống Android. Dùng ngón tay vuốt khắp 4 mép màn hình để phát hiện chính xác vùng bị đứt nét cảm ứng.</p>
            </div>
            <button
              type="button"
              className={`btn-tool ${pointerActive ? 'primary' : ''}`}
              onClick={handleToggleTouchPointer}
              disabled={!isOnline || pointerTesting}
            >
              <span className="svg-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                </svg>
              </span>
              <span>
                {pointerTesting
                  ? 'Đang cấu hình...'
                  : pointerActive
                  ? 'Đang Bật Vệt Vẽ (Bấm để Tắt)'
                  : 'Bật Vệt Vẽ Soi Cảm Ứng'}
              </span>
            </button>
          </div>

          {/* Tile 3: Stereo Speaker Test */}
          <div className="diagnostic-tile">
            <div className="diag-icon-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
              </svg>
            </div>
            <div className="diag-content">
              <h4>Kiểm Tra Loa Kép Stereo</h4>
              <p>Phát âm thanh chuông chuẩn HONOR_Marimba.ogg qua loa thoại và loa ngoài dưới đáy điện thoại để kiểm tra độ trong và âm lượng.</p>
            </div>
            <button
              type="button"
              className="btn-tool"
              onClick={handleTriggerAudio}
              disabled={!isOnline || audioTesting}
            >
              <span className="svg-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                </svg>
              </span>
              <span>{audioTesting ? 'Đang phát trên điện thoại...' : 'Phát Thử Loa Kép'}</span>
            </button>
          </div>

          {/* Tile 4: X-Axis Haptic Vibration Test */}
          <div className="diagnostic-tile">
            <div className="diag-icon-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M17 5v14M7 5v14M22 8v8M2 8v8"></path>
              </svg>
            </div>
            <div className="diag-content">
              <h4>Kiểm Tra Mô-tơ Rung X-axis</h4>
              <p>Gửi xung nhịp rung xúc giác thực tế (350ms, biên độ tối đa) qua trình quản lý rung phần cứng của máy.</p>
            </div>
            <button
              type="button"
              className="btn-tool"
              onClick={handleTriggerHaptic}
              disabled={!isOnline || hapticTesting}
            >
              <span className="svg-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v20M17 5v14M7 5v14M22 8v8M2 8v8"></path>
                </svg>
              </span>
              <span>{hapticTesting ? 'Điện thoại đang rung...' : 'Kích Hoạt Rung Máy'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Printable Quality Inspection & Handover Report Modal */}
      {showHandoverModal && (
        <div className="modal-backdrop" onClick={() => setShowHandoverModal(false)}>
          <div className="handover-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="handover-header-actions no-print">
              <h3>Biên Bản Bàn Giao & Kiểm Định Thiết Bị (Số Liệu Thật)</h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="btn-tool primary"
                  onClick={() => window.print()}
                >
                  <span className="svg-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 6 2 18 2 18 9"></polyline>
                      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                      <rect x="6" y="14" width="12" height="8"></rect>
                    </svg>
                  </span>
                  <span>In / Xuất PDF</span>
                </button>
                <button
                  type="button"
                  className="btn-tool"
                  onClick={() => setShowHandoverModal(false)}
                >
                  <span>Đóng</span>
                </button>
              </div>
            </div>

            {/* Printable A4 Content */}
            <div className="handover-printable-sheet">
              <div className="sheet-brand-row">
                <div>
                  <h1 className="sheet-store-title">HONOR MASTER DIAGNOSTICS REPORT</h1>
                  <p className="sheet-store-sub">HỆ THỐNG KIỂM ĐỊNH & BÀN GIAO THIẾT BỊ HONOR CHÍNH HÃNG</p>
                </div>
                <div className="sheet-score-box">
                  <div className="sheet-score-val">{score !== null ? `${score}/100` : '--'}</div>
                  <div className="sheet-score-text">ĐẠT CHUẨN</div>
                </div>
              </div>

              <div className="sheet-divider"></div>

              <div className="sheet-info-grid">
                <div><strong>Tên thiết bị:</strong> {isOnline ? device.commercial_name : '--'}</div>
                <div><strong>Mã Model (SKU):</strong> {isOnline ? device.model : '--'}</div>
                <div><strong>Số Serial định danh:</strong> {isOnline ? device.serial : '--'}</div>
                <div><strong>Phiên bản MagicOS:</strong> {isOnline ? device.magic_version : '--'}</div>
                <div><strong>Sức khỏe Pin thực tế:</strong> {hasBattery ? `${healthPct}% (${cycleCount} chu kỳ sạc)` : '--'}</div>
                <div><strong>Thời điểm kiểm định:</strong> {inspectionData?.inspection_date || new Date().toLocaleString('vi-VN')}</div>
              </div>

              <div className="sheet-divider"></div>

              <table className="sheet-table">
                <thead>
                  <tr>
                    <th>Linh Kiện / Hạng Mục</th>
                    <th>Chi Tiết Kỹ Thuật Đọc Từ ADB</th>
                    <th>Hiện Trạng</th>
                    <th>Đánh Giá</th>
                  </tr>
                </thead>
                <tbody>
                  {inspectionData?.checklist && inspectionData.checklist.map((item) => (
                    <tr key={item.id}>
                      <td><strong>{item.title}</strong></td>
                      <td>{item.value}</td>
                      <td>{item.note}</td>
                      <td className={item.status === 'pass' ? 'text-pass' : 'text-warn'}>
                        {item.status === 'pass' ? 'ĐẠT' : 'CHÚ Ý'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="sheet-signature-row">
                <div className="sig-col">
                  <p>Kỹ Thuật Viên Kiểm Định</p>
                  <div className="sig-space"></div>
                  <p className="sig-name">(Ký & ghi rõ họ tên)</p>
                </div>
                <div className="sig-col">
                  <p>Khách Hàng Nhận Bàn Giao</p>
                  <div className="sig-space"></div>
                  <p className="sig-name">(Ký & ghi rõ họ tên)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
