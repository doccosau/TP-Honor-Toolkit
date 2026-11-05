import React, { useState } from 'react';

export default function DonateModal({ isOpen, onClose }) {
  const [selectedAmount, setSelectedAmount] = useState(50000); // 50,000 VND default
  const [copiedField, setCopiedField] = useState(null);

  if (!isOpen) return null;

  const BANK_INFO = {
    bankName: 'TPBank (Ngân hàng TMCP Tiên Phong)',
    shortBank: 'TPBank',
    bankBin: '970423',
    accountNumber: '93150637084',
    accountName: 'DO CHI DANH',
    defaultMemo: 'UNG HO TP HONOR TOOLKIT',
  };

  const AMOUNTS = [
    { value: 20000, label: '20.000 đ', desc: 'Ly Cà Phê' },
    { value: 50000, label: '50.000 đ', desc: 'Bát Phở Ấm Lòng' },
    { value: 100000, label: '100.000 đ', desc: 'Tiếp Sức Dự Án' },
    { value: 200000, label: '200.000 đ', desc: 'Hỗ Trợ Thiết Bị Test' },
    { value: 0, label: 'Tùy Tâm', desc: 'Nhập Tự Do' },
  ];

  const memoText = selectedAmount > 0
    ? `UNG HO TP TOOLKIT ${selectedAmount / 1000}K`
    : BANK_INFO.defaultMemo;

  // Standard VietQR Image URL
  const qrUrl = `https://img.vietqr.io/image/970423-${BANK_INFO.accountNumber}-compact2.png?amount=${selectedAmount || 0}&addInfo=${encodeURIComponent(memoText)}&accountName=${encodeURIComponent(BANK_INFO.accountName)}`;

  const handleCopy = (text, fieldName) => {
    navigator.clipboard?.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'var(--drawer-backdrop)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        className="specs-card"
        style={{
          maxWidth: '680px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '24px',
          boxShadow: 'var(--floating-dock-shadow)',
          border: '1px solid var(--border-highlight)',
          borderRadius: '16px',
          background: 'var(--panel-bg)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            borderBottom: '1px solid var(--border-light)',
            paddingBottom: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              className="svg-icon"
              style={{
                color: '#f43f5e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(244, 63, 94, 0.12)',
                padding: '8px',
                borderRadius: '10px',
              }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" width="20" height="20">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </span>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-bright)' }}>
                Ủng Hộ & Tiếp Lửa Dự Án TP Honor Toolkit
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-dim)', marginTop: '2px' }}>
                Phần mềm phi lợi nhuận 100% dành cho cộng đồng người dùng điện thoại Honor tại Việt Nam
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-dim)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
              borderRadius: '6px',
            }}
            title="Đóng"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Content Body: QR on Left, Banking Info on Right */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(240px, 280px) 1fr',
            gap: '20px',
            alignItems: 'start',
          }}
        >
          {/* Left Column: VietQR Frame */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '12px',
              textAlign: 'center',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
              border: '2px solid rgba(56, 189, 248, 0.3)',
            }}
          >
            {/* VietQR Bank Banner */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '4px 6px 8px',
                borderBottom: '1px solid #e2e8f0',
                marginBottom: '8px',
              }}
            >
              <div style={{ fontWeight: 800, color: '#6b21a8', fontSize: '13px', letterSpacing: '0.5px' }}>
                TPBank
              </div>
              <div style={{ fontWeight: 700, color: '#0369a1', fontSize: '11.5px' }}>
                VietQR • NAPAS 247
              </div>
            </div>

            {/* QR Code Image */}
            <div style={{ position: 'relative', width: '100%', minHeight: '230px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img
                src={qrUrl}
                alt="Mã QR Chuyển Khoản Ủng Hộ"
                style={{
                  width: '100%',
                  maxWidth: '240px',
                  height: 'auto',
                  borderRadius: '6px',
                  display: 'block',
                  margin: '0 auto',
                }}
                onError={(e) => {
                  // Fallback if image fails to load
                  e.target.style.display = 'none';
                  const fallback = e.target.parentElement.querySelector('.qr-fallback');
                  if (fallback) fallback.style.display = 'block';
                }}
              />
              <div
                className="qr-fallback"
                style={{
                  display: 'none',
                  padding: '20px 10px',
                  color: '#334155',
                  fontSize: '12px',
                  lineHeight: '1.6',
                }}
              >
                <b>Quét mã trên app ngân hàng</b>
                <p style={{ marginTop: '8px', fontSize: '11px', color: '#64748b' }}>
                  Vui lòng chuyển khoản trực tiếp qua số tài khoản TPBank bên cạnh
                </p>
              </div>
            </div>

            <div
              style={{
                fontSize: '11px',
                color: '#64748b',
                marginTop: '8px',
                paddingTop: '6px',
                borderTop: '1px dashed #cbd5e1',
              }}
            >
              Mở app Ngân hàng / MoMo quét mã QR 24/7
            </div>
          </div>

          {/* Right Column: Preset amounts & Account Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Quick Amount Selector */}
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-bright)', marginBottom: '8px' }}>
                Chọn mức ủng hộ nhanh:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {AMOUNTS.slice(0, 3).map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setSelectedAmount(item.value)}
                    style={{
                      background: selectedAmount === item.value ? 'rgba(56, 189, 248, 0.15)' : 'var(--panel-alt)',
                      borderColor: selectedAmount === item.value ? 'var(--magicos-blue)' : 'var(--border-light)',
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      borderRadius: '8px',
                      padding: '8px 4px',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 700, color: selectedAmount === item.value ? 'var(--magicos-blue)' : 'var(--text-bright)' }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px' }}>
                      {item.desc}
                    </div>
                  </button>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginTop: '8px' }}>
                {AMOUNTS.slice(3).map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setSelectedAmount(item.value)}
                    style={{
                      background: selectedAmount === item.value ? 'rgba(56, 189, 248, 0.15)' : 'var(--panel-alt)',
                      borderColor: selectedAmount === item.value ? 'var(--magicos-blue)' : 'var(--border-light)',
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      borderRadius: '8px',
                      padding: '8px 4px',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 700, color: selectedAmount === item.value ? 'var(--magicos-blue)' : 'var(--text-bright)' }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px' }}>
                      {item.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Account Details with Copy Buttons */}
            <div
              style={{
                background: 'var(--panel-alt)',
                borderRadius: '10px',
                padding: '12px 14px',
                border: '1px solid var(--border-light)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              {/* Bank Name */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-dim)' }}>Ngân hàng</div>
                  <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-bright)' }}>
                    {BANK_INFO.bankName}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-tool"
                  style={{ padding: '3px 8px', fontSize: '11px' }}
                  onClick={() => handleCopy(BANK_INFO.shortBank, 'bank')}
                >
                  {copiedField === 'bank' ? 'Đã chép' : 'Sao chép'}
                </button>
              </div>

              {/* Account Number */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-dim)' }}>Số tài khoản</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--magicos-blue)', fontFamily: 'var(--font-mono)' }}>
                    {BANK_INFO.accountNumber}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-tool primary"
                  style={{ padding: '3px 10px', fontSize: '11px' }}
                  onClick={() => handleCopy(BANK_INFO.accountNumber, 'stk')}
                >
                  {copiedField === 'stk' ? 'Đã chép' : 'Sao chép STK'}
                </button>
              </div>

              {/* Account Holder */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-dim)' }}>Chủ tài khoản</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-bright)' }}>
                    {BANK_INFO.accountName}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-tool"
                  style={{ padding: '3px 8px', fontSize: '11px' }}
                  onClick={() => handleCopy(BANK_INFO.accountName, 'name')}
                >
                  {copiedField === 'name' ? 'Đã chép' : 'Sao chép'}
                </button>
              </div>

              {/* Transfer Memo */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-dim)' }}>Lời nhắn chuyển khoản</div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                    {memoText}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-tool"
                  style={{ padding: '3px 8px', fontSize: '11px' }}
                  onClick={() => handleCopy(memoText, 'memo')}
                >
                  {copiedField === 'memo' ? 'Đã chép' : 'Sao chép'}
                </button>
              </div>
            </div>

            {/* Note / Message from author */}
            <div
              style={{
                fontSize: '11.5px',
                color: 'var(--text-dim)',
                lineHeight: '1.6',
                background: 'rgba(56, 189, 248, 0.05)',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(56, 189, 248, 0.15)',
              }}
            >
              Mọi sự đóng góp và tiếp sức của anh em là nguồn động lực to lớn giúp tác giả duy trì máy chủ, nghiên cứu giải mã ROM MagicOS mới, và cập nhật tính năng miễn phí cho cộng đồng!
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            marginTop: '18px',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            borderTop: '1px solid var(--border-light)',
            paddingTop: '14px',
          }}
        >
          <button
            type="button"
            className="btn-tool primary"
            onClick={onClose}
            style={{ padding: '6px 20px', fontSize: '12px' }}
          >
            Đóng Cửa Sổ
          </button>
        </div>
      </div>
    </div>
  );
}
