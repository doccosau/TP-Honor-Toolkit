import React, { useState, useEffect, useRef } from 'react';

export default function TerminalConsole({ logs = [], isExecuting = false, executingTask = '', onClear }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleCopyLogs = () => {
    if (!logs || logs.length === 0) return;
    const text = logs.map((l) => `[${l.time}] [${(l.level || 'info').toUpperCase()}] ${l.msg}`).join('\n');
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Determine running status: check explicit isExecuting prop or inspect last log
  const lastLog = logs.length > 0 ? logs[logs.length - 1] : null;
  const isActivelyRunning = isExecuting || (lastLog && (
    lastLog.msg.includes('Bắt đầu') ||
    lastLog.msg.includes('Đang') ||
    lastLog.msg.startsWith('$ adb') ||
    lastLog.level === 'cmd'
  ) && !lastLog.msg.includes('HOÀN TẤT') && !lastLog.msg.includes('thành công! ==='));

  return (
    <div className={`console-drawer ${isExpanded ? 'is-expanded' : ''}`}>
      <div className="console-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="svg-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="4 17 10 11 4 5"></polyline>
              <line x1="12" y1="19" x2="20" y2="19"></line>
            </svg>
          </span>
          <span style={{ fontWeight: 600 }}>Console Nhật Ký Lệnh ADB Thời Gian Thực</span>
          
          {isActivelyRunning ? (
            <span className="console-status-badge running" title="ADB đang thực thi lệnh...">
              <span className="pulse-dot"></span>
              {executingTask || 'Đang thực thi lệnh...'}
            </span>
          ) : (
            <span className="console-status-badge idle">
              ● Sẵn sàng
            </span>
          )}
        </div>

        <div className="console-actions">
          <button
            className="console-btn"
            onClick={handleCopyLogs}
            title="Sao chép toàn bộ nhật ký"
          >
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            <span>{copied ? 'Đã sao chép!' : 'Sao chép Log'}</span>
          </button>

          <button
            className="console-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Thu nhỏ bảng điều khiển' : 'Mở rộng để xem chi tiết log'}
          >
            {isExpanded ? (
              <>
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="4 14 12 6 20 14"></polyline>
                </svg>
                <span>Thu gọn</span>
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="4 10 12 18 20 10"></polyline>
                </svg>
                <span>Mở rộng</span>
              </>
            )}
          </button>

          <button
            id="btnClearLog"
            className="console-btn"
            onClick={onClear}
            title="Xóa sạch nhật ký màn hình"
          >
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            <span>Xóa Console</span>
          </button>
        </div>
      </div>

      <div id="terminalBody" className="console-output">
        {logs.length === 0 ? (
          <div className="console-line log-info">
            [+] TP Honor Toolkit v2.0 Desktop Engine sẵn sàng kết nối và thực thi ADB...
          </div>
        ) : (
          logs.map((log, idx) => (
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
