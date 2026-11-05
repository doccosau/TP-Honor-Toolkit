import React, { useState, useEffect, useRef, useCallback } from 'react';

export default function WebMirrorModal({ isOpen, onClose, device, adbService, onOpenScrcpyModal }) {
  const [frameUrl, setFrameUrl] = useState(null);
  const [isLoadingFrame, setIsLoadingFrame] = useState(false);
  const [isStreaming, setIsStreaming] = useState(true);
  const [streamIntervalMs, setStreamIntervalMs] = useState(1200);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [clickRipple, setClickRipple] = useState(null);
  const [statusText, setStatusText] = useState('Đang kết nối màn hình...');

  const streamTimerRef = useRef(null);
  const imgRef = useRef(null);
  const isFetchingRef = useRef(false);

  const screenWidth = device?.screen_width || 1280;
  const screenHeight = device?.screen_height || 2788;

  const fetchFrame = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const res = await adbService.takeScreenshot();
      if (res && res.success && res.url) {
        setFrameUrl(res.url);
        setLastRefreshed(res.timestamp || new Date().toLocaleTimeString('vi-VN'));
        setStatusText('Trực tiếp');
      } else {
        setStatusText(res?.error || 'Không thể lấy khung hình');
      }
    } catch (e) {
      setStatusText('Lỗi truyền hình ảnh: ' + e.message);
    } finally {
      isFetchingRef.current = false;
      setIsLoadingFrame(false);
    }
  }, [adbService]);

  // Initial fetch when opened
  useEffect(() => {
    if (isOpen) {
      setIsLoadingFrame(true);
      fetchFrame();
    } else {
      setFrameUrl(null);
      setIsStreaming(false);
      if (streamTimerRef.current) {
        clearInterval(streamTimerRef.current);
        streamTimerRef.current = null;
      }
    }
  }, [isOpen, fetchFrame]);

  // Handle Live Streaming Loop
  useEffect(() => {
    if (!isOpen || !isStreaming) {
      if (streamTimerRef.current) {
        clearInterval(streamTimerRef.current);
        streamTimerRef.current = null;
      }
      return;
    }

    streamTimerRef.current = setInterval(() => {
      fetchFrame();
    }, streamIntervalMs);

    return () => {
      if (streamTimerRef.current) {
        clearInterval(streamTimerRef.current);
        streamTimerRef.current = null;
      }
    };
  }, [isOpen, isStreaming, streamIntervalMs, fetchFrame]);

  if (!isOpen) return null;

  // Handle clicking on the virtual phone screen to send touch event
  const handleScreenClick = async (e) => {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    if (clickX < 0 || clickY < 0 || clickX > rect.width || clickY > rect.height) return;

    // Show visual ripple
    setClickRipple({ x: clickX, y: clickY, id: Date.now() });
    setTimeout(() => setClickRipple(null), 500);

    const realX = Math.round((clickX / rect.width) * screenWidth);
    const realY = Math.round((clickY / rect.height) * screenHeight);

    try {
      await adbService.inputTap(realX, realY);
      // Fast refresh after touch
      setTimeout(() => fetchFrame(), 300);
    } catch (err) {
      console.warn('Touch error:', err);
    }
  };

  const handleSendKey = async (keyCode) => {
    try {
      await adbService.sendKeyEvent(keyCode);
      setTimeout(() => fetchFrame(), 250);
    } catch (err) {
      console.warn('Key error:', err);
    }
  };

  const handleDownload = () => {
    if (!frameUrl) return;
    const a = document.createElement('a');
    a.href = frameUrl;
    a.download = `Honor_${device?.model || 'Device'}_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '680px',
          maxWidth: '96vw',
          maxHeight: '94vh',
          background: '#131722',
          border: '1px solid #283147',
          borderRadius: '12px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.85)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '12px 18px',
            background: '#181d2a',
            borderBottom: '1px solid #283147',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="5" y="2" width="14" height="20" rx="3"></rect>
                <line x1="12" y1="18" x2="12.01" y2="18"></line>
              </svg>
            </span>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>Chiếu &amp; Điều Khiển Màn Hình Trực Tiếp (Web Mirror)</span>
                <span className="badge-tag tag-safe" style={{ fontSize: '10px', padding: '2px 6px' }}>
                  WebUSB Online
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                {device?.commercial_name || device?.model} ({screenWidth}x{screenHeight}) &bull; Cập nhật: {lastRefreshed || 'Đang tải...'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="btn-tool"
              style={{ fontSize: '11px', padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
              onClick={() => onOpenScrcpyModal?.()}
              title="Mở hướng dẫn chạy Scrcpy 120Hz ngoài Desktop"
            >
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></path>
                <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path>
                <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"></path>
                <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"></path>
              </svg>
              Scrcpy 120Hz Desktop
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                fontSize: '22px',
                cursor: 'pointer',
                lineHeight: 1,
                padding: '4px 8px',
              }}
            >
              &times;
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div
          style={{
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            overflowY: 'auto',
            background: '#0d111a',
          }}
        >
          {/* Virtual Phone Container */}
          <div
            style={{
              position: 'relative',
              width: '280px',
              height: '560px',
              background: '#000',
              borderRadius: '32px',
              border: '7px solid #2a3348',
              boxShadow: '0 15px 35px rgba(0,0,0,0.9), inset 0 0 10px rgba(0,0,0,0.8)',
              overflow: 'hidden',
              cursor: 'crosshair',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              userSelect: 'none',
            }}
            onClick={handleScreenClick}
          >
            {/* Front Camera Notch / Pill */}
            <div
              style={{
                position: 'absolute',
                top: '10px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '64px',
                height: '14px',
                borderRadius: '8px',
                background: '#111',
                border: '1px solid #222',
                zIndex: 10,
                pointerEvents: 'none',
              }}
            ></div>

            {/* Click Ripple Indicator */}
            {clickRipple && (
              <span
                style={{
                  position: 'absolute',
                  left: clickRipple.x - 14,
                  top: clickRipple.y - 14,
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'rgba(56, 189, 248, 0.45)',
                  border: '2px solid #38bdf8',
                  pointerEvents: 'none',
                  zIndex: 20,
                  animation: 'pulse 0.4s ease-out forwards',
                }}
              />
            )}

            {/* Screen Content */}
            {frameUrl ? (
              <img
                ref={imgRef}
                src={frameUrl}
                alt="Phone Screen"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            ) : (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>
                <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'center' }}>
                  <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                    <line x1="12" y1="18" x2="12.01" y2="18"></line>
                  </svg>
                </div>
                <div style={{ fontSize: '12px' }}>{isLoadingFrame ? 'Đang truyền hình ảnh từ điện thoại...' : statusText}</div>
              </div>
            )}
          </div>

          {/* Android Navigation Bar */}
          <div
            style={{
              width: '280px',
              display: 'flex',
              justifyContent: 'space-around',
              alignItems: 'center',
              marginTop: '12px',
              padding: '6px 8px',
              background: '#1a202e',
              border: '1px solid #283147',
              borderRadius: '20px',
            }}
          >
            <button
              type="button"
              className="btn-tool"
              style={{ padding: '6px 14px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              onClick={() => handleSendKey(4)}
              title="Quay lại (Back)"
            >
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
              Quay lại
            </button>
            <button
              type="button"
              className="btn-tool"
              style={{ padding: '6px 14px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              onClick={() => handleSendKey(3)}
              title="Màn hình chính (Home)"
            >
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              Home
            </button>
            <button
              type="button"
              className="btn-tool"
              style={{ padding: '6px 14px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              onClick={() => handleSendKey(187)}
              title="Ứng dụng gần đây (Recent Apps)"
            >
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              </svg>
              Đa nhiệm
            </button>
          </div>

          {/* Device Controls Bar */}
          <div
            style={{
              marginTop: '14px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              justifyContent: 'center',
            }}
          >
            <button
              type="button"
              className={`btn-tool ${isStreaming ? 'primary' : ''}`}
              style={{ fontSize: '11px', padding: '5px 12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
              onClick={() => setIsStreaming(!isStreaming)}
            >
              {isStreaming ? (
                <>
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="6" y="4" width="4" height="16"></rect>
                    <rect x="14" y="4" width="4" height="16"></rect>
                  </svg>
                  Tạm dừng phát
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                  Bật phát trực tiếp
                </>
              )}
            </button>

            <button
              type="button"
              className="btn-tool"
              style={{ fontSize: '11px', padding: '5px 12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
              onClick={() => fetchFrame()}
              disabled={isLoadingFrame}
            >
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10"></polyline>
                <polyline points="1 20 1 14 7 14"></polyline>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
              </svg>
              Làm mới khung hình
            </button>

            <button
              type="button"
              className="btn-tool"
              style={{ fontSize: '11px', padding: '5px 12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
              onClick={handleDownload}
              disabled={!frameUrl}
              title="Tải ảnh màn hình về máy tính"
            >
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                <circle cx="12" cy="13" r="4"></circle>
              </svg>
              Tải ảnh (PNG)
            </button>

            <button
              type="button"
              className="btn-tool"
              style={{ fontSize: '11px', padding: '5px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              onClick={() => handleSendKey(25)}
              title="Giảm âm lượng"
            >
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
              </svg>
              Vol -
            </button>
            <button
              type="button"
              className="btn-tool"
              style={{ fontSize: '11px', padding: '5px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              onClick={() => handleSendKey(24)}
              title="Tăng âm lượng"
            >
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
              </svg>
              Vol +
            </button>
            <button
              type="button"
              className="btn-tool"
              style={{ fontSize: '11px', padding: '5px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              onClick={() => handleSendKey(26)}
              title="Khóa / Mở sáng màn hình"
            >
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
              </svg>
              Nguồn
            </button>
          </div>

          {/* Stream Settings */}
          <div style={{ marginTop: '12px', fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Tốc độ làm mới:</span>
            <select
              value={streamIntervalMs}
              onChange={(e) => setStreamIntervalMs(Number(e.target.value))}
              style={{
                background: '#161c28',
                border: '1px solid #283147',
                color: '#cbd5e1',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '11px',
              }}
            >
              <option value={800}>Mượt (0.8s)</option>
              <option value={1200}>Chuẩn (1.2s)</option>
              <option value={2000}>Tiết kiệm (2.0s)</option>
            </select>
            <span>&bull; Chạm trực tiếp vào màn hình ảo để điều khiển cảm ứng.</span>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '10px 18px',
            background: '#181d2a',
            borderTop: '1px solid #283147',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
            Chạy trực tiếp 100% qua <b>WebUSB</b> trên trình duyệt web, không cần cài backend hay phần mềm ngoài.
          </div>
          <button
            type="button"
            className="btn-tool primary"
            onClick={onClose}
            style={{ padding: '4px 16px', fontWeight: 600 }}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
