import React, { useState, useEffect, useMemo, useRef } from 'react';

export default function TerminalConsole({ logs = [], isExecuting = false, executingTask = '', onClear }) {
  // Size modes: 'default' (140px) | 'expanded' (360px) | 'full' (560px)
  const [sizeMode, setSizeMode] = useState('default');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'cmd' | 'step' | 'alert'
  const [autoScroll, setAutoScroll] = useState(true);
  const [copied, setCopied] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    if (autoScroll) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  // Counts for filter pills
  const counts = useMemo(() => {
    let cmd = 0;
    let step = 0;
    let alert = 0;

    logs.forEach((l) => {
      if (l.level === 'cmd' || l.level === 'output' || l.msg.startsWith('$ adb')) {
        cmd++;
      } else if (l.level === 'step' || l.level === 'info' || l.level === 'success') {
        step++;
      } else if (l.level === 'error' || l.level === 'warning') {
        alert++;
      }
    });

    return { total: logs.length, cmd, step, alert };
  }, [logs]);

  // Filtered log items
  const filteredLogs = useMemo(() => {
    if (activeFilter === 'cmd') {
      return logs.filter((l) => l.level === 'cmd' || l.level === 'output' || l.msg.startsWith('$ adb'));
    }
    if (activeFilter === 'step') {
      return logs.filter((l) => l.level === 'step' || l.level === 'info' || l.level === 'success');
    }
    if (activeFilter === 'alert') {
      return logs.filter((l) => l.level === 'error' || l.level === 'warning');
    }
    return logs;
  }, [logs, activeFilter]);

  const handleCopyLogs = () => {
    if (!logs || logs.length === 0) return;
    const text = filteredLogs.map((l) => `[${l.time}] [${(l.level || 'info').toUpperCase()}] ${l.msg}`).join('\n');
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportLogs = () => {
    if (!logs || logs.length === 0) return;
    const header = `=== TP HONOR OPTIMIZATION TOOLKIT - ADB CONSOLE LOG EXPORT ===\nThời gian xuất: ${new Date().toLocaleString('vi-VN')}\nTổng số dòng: ${logs.length}\n${'='.repeat(65)}\n\n`;
    const body = logs.map((l) => `[${l.time}] [${(l.level || 'info').toUpperCase()}] ${l.msg}`).join('\n');
    const blob = new Blob([header + body], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Honor_Toolkit_Log_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleToggleSize = () => {
    if (sizeMode === 'default') setSizeMode('expanded');
    else if (sizeMode === 'expanded') setSizeMode('full');
    else setSizeMode('default');
  };

  // Determine running status
  const lastLog = logs.length > 0 ? logs[logs.length - 1] : null;
  const isActivelyRunning = isExecuting || (lastLog && (
    lastLog.msg.includes('Bắt đầu') ||
    lastLog.msg.includes('Đang') ||
    lastLog.msg.startsWith('$ adb') ||
    lastLog.level === 'cmd'
  ) && !lastLog.msg.includes('HOÀN TẤT') && !lastLog.msg.includes('thành công! ==='));

  const drawerClass = sizeMode === 'full' ? 'is-full' : sizeMode === 'expanded' ? 'is-expanded' : '';

  return (
    <div className={`console-drawer ${drawerClass}`}>
      <div className="console-header">
        {/* Left: Title & Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="svg-icon" style={{ color: '#38bdf8' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <polyline points="4 17 10 11 4 5"></polyline>
              <line x1="12" y1="19" x2="20" y2="19"></line>
            </svg>
          </span>
          <span style={{ fontWeight: 600, color: 'var(--text-bright)' }}>Realtime ADB Shell Console</span>
          
          {isActivelyRunning ? (
            <span className="console-status-badge running" title="ADB đang thực thi lệnh trên điện thoại...">
              <span className="pulse-dot"></span>
              {executingTask || 'Đang thực thi lệnh ADB...'}
            </span>
          ) : (
            <span className="console-status-badge idle">
              ● Sẵn sàng
            </span>
          )}

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '4px', marginLeft: '6px' }}>
            <button
              type="button"
              className={`console-filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
              title="Hiện toàn bộ lịch sử log"
            >
              <span>Tất cả</span>
              <span style={{ opacity: 0.7 }}>({counts.total})</span>
            </button>
            <button
              type="button"
              className={`console-filter-btn ${activeFilter === 'cmd' ? 'active' : ''}`}
              onClick={() => setActiveFilter('cmd')}
              title="Chỉ hiện các câu lệnh ADB shell ($ adb shell ...) và kết quả trả về"
            >
              <span style={{ color: '#38bdf8' }}>$ ADB Shell</span>
              <span style={{ opacity: 0.7 }}>({counts.cmd})</span>
            </button>
            <button
              type="button"
              className={`console-filter-btn ${activeFilter === 'step' ? 'active' : ''}`}
              onClick={() => setActiveFilter('step')}
              title="Chỉ hiện các bước tiến trình tối ưu"
            >
              <span>Tiến trình</span>
              <span style={{ opacity: 0.7 }}>({counts.step})</span>
            </button>
            {counts.alert > 0 && (
              <button
                type="button"
                className={`console-filter-btn ${activeFilter === 'alert' ? 'active' : ''}`}
                onClick={() => setActiveFilter('alert')}
                title="Lọc các cảnh báo hoặc lỗi"
              >
                <span style={{ color: '#f87171' }}>Lỗi / Cảnh báo</span>
                <span style={{ opacity: 0.7 }}>({counts.alert})</span>
              </button>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="console-actions">
          {/* Auto Scroll Toggle */}
          <button
            type="button"
            className="console-btn"
            style={{ opacity: autoScroll ? 1 : 0.6 }}
            onClick={() => setAutoScroll(!autoScroll)}
            title={autoScroll ? 'Cuộn tự động đang bật' : 'Cuộn tự động đang tắt (Tạm dừng cuộn để đọc log)'}
          >
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="7 13 12 18 17 13"></polyline>
              <polyline points="7 6 12 11 17 6"></polyline>
            </svg>
            <span>{autoScroll ? 'Cuộn: Bật' : 'Cuộn: Tắt'}</span>
          </button>

          {/* Copy Logs */}
          <button
            type="button"
            className="console-btn"
            onClick={handleCopyLogs}
            title="Sao chép toàn bộ nhật ký vào Clipboard"
          >
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            <span>{copied ? 'Đã sao chép!' : 'Sao chép'}</span>
          </button>

          {/* Export Log (.txt) */}
          <button
            type="button"
            className="console-btn"
            onClick={handleExportLogs}
            title="Tải file nhật ký lệnh ADB .txt về máy tính"
          >
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>Xuất Log</span>
          </button>

          {/* Resize Toggle (Default 140px -> Expanded 360px -> Full 560px) */}
          <button
            type="button"
            className="console-btn"
            onClick={handleToggleSize}
            title="Chuyển đổi kích thước bảng điều khiển: Chuẩn (140px) ⇄ Mở rộng (360px) ⇄ Toàn màn (560px)"
          >
            {sizeMode === 'default' ? (
              <>
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="4 14 12 6 20 14"></polyline>
                </svg>
                <span>Mở rộng (360px)</span>
              </>
            ) : sizeMode === 'expanded' ? (
              <>
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <polyline points="9 21 3 21 3 15"></polyline>
                  <line x1="21" y1="3" x2="14" y2="10"></line>
                  <line x1="3" y1="21" x2="10" y2="14"></line>
                </svg>
                <span>Toàn màn (560px)</span>
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="4 10 12 18 20 10"></polyline>
                </svg>
                <span>Thu gọn (140px)</span>
              </>
            )}
          </button>

          {/* Clear Log */}
          <button
            id="btnClearLog"
            type="button"
            className="console-btn"
            onClick={onClear}
            title="Xóa sạch nhật ký màn hình"
          >
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            <span>Xóa Log</span>
          </button>
        </div>
      </div>

      <div id="terminalBody" className="console-output">
        {filteredLogs.length === 0 ? (
          <div className="console-line log-info" style={{ opacity: 0.7, padding: '6px 0' }}>
            {activeFilter !== 'all'
              ? `[!] Không có dòng log nào thuộc bộ lọc "${activeFilter}". Chọn "Tất cả" để xem toàn bộ.`
              : '[+] TP Honor Optimization Toolkit Engine sẵn sàng kết nối ADB thực tế với thiết bị Honor...'}
          </div>
        ) : (
          filteredLogs.map((log, idx) => (
            <div key={log.id || idx} className={`console-line log-${log.level || 'info'}`}>
              <span style={{ opacity: 0.65, marginRight: '6px' }}>[{log.time}]</span>
              <span>{log.msg}</span>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}
