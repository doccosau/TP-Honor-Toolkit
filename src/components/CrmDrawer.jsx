import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

/**
 * CrmDrawer - Enterprise Slide-over Drawer (Nhạc Quán Admin Standard)
 * Supports sliding from LEFT ('left') or RIGHT ('right').
 * Handles ESC keydown, backdrop click, body scroll lock, and sticky header/footer.
 */
export default function CrmDrawer({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  badge,
  side = 'left',
  width = 'xl',
  children,
  footer,
  closeOnBackdropClick = true,
  closeOnEsc = true,
}) {
  const handleKeyDown = useCallback(
    (e) => {
      if (closeOnEsc && e.key === 'Escape') {
        onClose();
      }
    },
    [closeOnEsc, onClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div className={`crm-drawer-root ${side === 'left' ? 'side-left' : 'side-right'}`}>
      {/* Backdrop */}
      <div
        className="crm-drawer-backdrop"
        onClick={closeOnBackdropClick ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Slide-over Drawer Panel */}
      <div className={`crm-drawer-panel ${side === 'left' ? 'crm-panel-from-left' : 'crm-panel-from-right'} width-${width}`} role="dialog" aria-modal="true">
        {/* Sticky Header */}
        <div className="crm-drawer-header">
          <div className="crm-drawer-header-left">
            {icon && <div className="crm-drawer-icon-box">{icon}</div>}
            <div className="crm-drawer-title-group">
              <div className="crm-drawer-title-row">
                <h3 className="crm-drawer-title">{title}</h3>
                {badge && (
                  <span className={`badge-tag ${badge.variant || 'tag-safe'}`} style={{ fontSize: '10px', padding: '2px 8px' }}>
                    {badge.label}
                  </span>
                )}
              </div>
              {subtitle && <p className="crm-drawer-subtitle">{subtitle}</p>}
            </div>
          </div>

          <div className="crm-drawer-header-right">
            <span className="crm-drawer-esc-pill">ESC</span>
            <button
              type="button"
              className="crm-drawer-close-btn"
              onClick={onClose}
              title="Đóng ngăn kéo (ESC)"
              aria-label="Đóng"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="crm-drawer-body">{children}</div>

        {/* Sticky Action Footer */}
        {footer ? (
          <div className="crm-drawer-footer">{footer}</div>
        ) : (
          <div className="crm-drawer-footer">
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Nhấn ESC hoặc bấm ra ngoài để quay lại Hub
            </span>
            <button
              type="button"
              className="btn-tool"
              onClick={onClose}
              style={{ fontSize: '12px', padding: '6px 14px' }}
            >
              Đóng Cửa Sổ
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

