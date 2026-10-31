import React, { useState, useMemo } from 'react';
import bloatData from '../data/bloatware.json';
import AppIcon from './AppIcon';

export default function DebloatTab({
  device,
  scannedPackages,
  isScanning,
  onDebloat,
  onRestore,
  onRestoreAll,
  onRefreshScan,
}) {
  const [statusFilter, setStatusFilter] = useState('installed'); // 'installed' | 'all' | 'uninstalled'
  const [selectedTier, setSelectedTier] = useState('all'); // 'all' | 'level_1_safe' | ...
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPackages, setSelectedPackages] = useState(new Set());

  const isOnline = device && device.connected;

  // Merge scanned live bloatware data with fallback definitions
  const tiers = useMemo(() => {
    if (scannedPackages?.bloatware && Object.keys(scannedPackages.bloatware).length > 0) {
      return scannedPackages.bloatware;
    }
    return bloatData.safety_levels || {};
  }, [scannedPackages]);

  // Flatten all packages across tiers with tier metadata
  const allPackages = useMemo(() => {
    const list = [];
    Object.entries(tiers).forEach(([tierKey, tier]) => {
      (tier.packages || []).forEach((pkg) => {
        list.push({
          ...pkg,
          tierKey,
          tierName: tier.name,
          tierLevel: tier.level,
          tierColor: tier.color,
          status: pkg.status || 'unknown',
        });
      });
    });
    return list;
  }, [tiers]);

  // Counts
  const counts = useMemo(() => {
    let installed = 0;
    let uninstalled = 0;
    allPackages.forEach((p) => {
      if (p.status === 'active' || p.status === 'disabled') installed++;
      else if (p.status === 'uninstalled') uninstalled++;
    });
    return {
      total: allPackages.length,
      installed,
      uninstalled,
    };
  }, [allPackages]);

  // Filtered packages
  const filteredPackages = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return allPackages.filter((pkg) => {
      // 1. Status Filter
      if (statusFilter === 'installed') {
        // Show apps that are present on phone (or unknown if offline)
        if (pkg.status === 'uninstalled') return false;
      } else if (statusFilter === 'uninstalled') {
        if (pkg.status !== 'uninstalled') return false;
      }

      // 2. Tier Filter
      if (selectedTier !== 'all' && pkg.tierKey !== selectedTier) {
        return false;
      }

      // 3. Search Query
      if (q) {
        const matchName = (pkg.name || '').toLowerCase().includes(q);
        const matchPkg = (pkg.package || '').toLowerCase().includes(q);
        const matchDesc = (pkg.desc || '').toLowerCase().includes(q);
        if (!matchName && !matchPkg && !matchDesc) return false;
      }

      return true;
    });
  }, [allPackages, statusFilter, selectedTier, searchQuery]);

  // Selectable predicate: allows selecting packages based on current view/action
  const isSelectable = (pkg) => {
    if (pkg.tierKey === 'level_5_critical_system') return false;
    if (statusFilter === 'uninstalled') {
      return pkg.status === 'uninstalled';
    }
    if (statusFilter === 'installed') {
      return pkg.status !== 'uninstalled';
    }
    return true; // 'all' filter: allow selecting any non-critical package
  };

  const selectableFiltered = useMemo(() => {
    return filteredPackages.filter(isSelectable);
  }, [filteredPackages, statusFilter]);

  const selectedList = useMemo(() => {
    return allPackages.filter((p) => selectedPackages.has(p.package));
  }, [allPackages, selectedPackages]);

  const selectedUninstalledCount = useMemo(() => {
    return selectedList.filter((p) => p.status === 'uninstalled').length;
  }, [selectedList]);

  const selectedInstalledCount = useMemo(() => {
    return selectedList.filter((p) => p.status === 'active' || p.status === 'disabled').length;
  }, [selectedList]);

  const handleToggle = (pkgName, selectable) => {
    if (!selectable) return;
    setSelectedPackages((prev) => {
      const next = new Set(prev);
      if (next.has(pkgName)) next.delete(pkgName);
      else next.add(pkgName);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedPackages.size === selectableFiltered.length && selectableFiltered.length > 0) {
      setSelectedPackages(new Set());
    } else {
      setSelectedPackages(new Set(selectableFiltered.map((p) => p.package)));
    }
  };

  const handleExecuteDebloat = () => {
    const pkgs = selectedList
      .filter((p) => p.status === 'active' || p.status === 'disabled')
      .map((p) => p.package);
    if (pkgs.length === 0) return;
    onDebloat(pkgs);
    setSelectedPackages(new Set());
  };

  const handleExecuteRestore = () => {
    const pkgs = selectedList
      .filter((p) => p.status === 'uninstalled')
      .map((p) => p.package);
    if (pkgs.length === 0) return;
    onRestore(pkgs);
    setSelectedPackages(new Set());
  };

  return (
    <div className="tab-pane active" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Overview & Live Scan Status Card */}
      <div className="specs-card" style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-bright)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Dọn Rác Hệ Thống Rom Nội Địa MagicOS (Debloat Cleaner)</span>
              {isScanning ? (
                <span className="badge-tag tag-warn" style={{ fontSize: '10px' }}>Đang quét thiết bị...</span>
              ) : isOnline ? (
                <span className="badge-tag tag-safe" style={{ fontSize: '10px' }}>
                  Phát hiện {counts.installed} apps rác có trên máy
                </span>
              ) : (
                <span className="badge-tag tag-neutral" style={{ fontSize: '10px' }}>Chưa kết nối ADB</span>
              )}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '3px' }}>
              Gỡ bỏ triệt để các dịch vụ quảng cáo ngầm, Service Gallery vuốt góc khó chịu, mini-app Baidu và telemetry Trung Quốc.
              {counts.uninstalled > 0 && ` (Đã gỡ thành công: ${counts.uninstalled} packages)`}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn-tool"
              onClick={onRefreshScan}
              disabled={!isOnline || isScanning}
              title="Quét lại toàn bộ package hiện diện trên điện thoại"
            >
              <span className="svg-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="23 4 23 10 17 10"></polyline>
                  <polyline points="1 20 1 14 7 14"></polyline>
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                </svg>
              </span>
              <span>{isScanning ? 'Đang Quét...' : 'Quét Lại Máy'}</span>
            </button>

            <button
              className="btn-tool"
              onClick={handleSelectAll}
              disabled={selectableFiltered.length === 0}
            >
              <span>
                {selectedPackages.size === selectableFiltered.length && selectableFiltered.length > 0
                  ? 'Bỏ chọn hết'
                  : statusFilter === 'uninstalled'
                  ? `Chọn tất cả đã gỡ (${selectableFiltered.length})`
                  : `Chọn tất cả có trên máy (${selectableFiltered.length})`}
              </span>
            </button>

            {/* Show Restore Button if uninstalled apps are selected or viewing uninstalled tab */}
            {(statusFilter === 'uninstalled' || selectedUninstalledCount > 0) && (
              <button
                className="btn-tool success"
                onClick={handleExecuteRestore}
                disabled={!isOnline || selectedUninstalledCount === 0}
              >
                <span className="svg-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="1 4 1 10 7 10"></polyline>
                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                  </svg>
                </span>
                <span>Khôi Phục ({selectedUninstalledCount}) Package Đã Chọn</span>
              </button>
            )}

            {/* Show Debloat Button if viewing installed tab or installed apps are selected */}
            {(statusFilter !== 'uninstalled' || selectedInstalledCount > 0) && (
              <button
                className="btn-tool danger"
                onClick={handleExecuteDebloat}
                disabled={!isOnline || selectedInstalledCount === 0}
              >
                <span className="svg-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </span>
                <span>Gỡ Bỏ ({selectedInstalledCount}) Package Đã Chọn</span>
              </button>
            )}

            {onRestoreAll && (
              <button
                className="btn-tool"
                onClick={onRestoreAll}
                disabled={!isOnline}
                title="Khôi phục toàn bộ các ứng dụng hệ thống đã gỡ về mặc định xuất xưởng"
              >
                <span className="svg-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="1 4 1 10 7 10"></polyline>
                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                  </svg>
                </span>
                <span>Khôi Phục Xuất Xưởng</span>
              </button>
            )}
          </div>
        </div>

        {/* Status Filters + Tier Filters Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', flexWrap: 'wrap', gap: '8px', borderTop: '1px solid var(--border-light)', paddingTop: '10px' }}>
          {/* Status Pills */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              className={`btn-tool ${statusFilter === 'installed' ? 'primary' : ''}`}
              style={{ fontSize: '11px', padding: '3px 10px' }}
              onClick={() => {
                setStatusFilter('installed');
                setSelectedPackages(new Set());
              }}
            >
              <span className="svg-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </span>
              <span>Chỉ hiện apps có trên máy ({counts.installed})</span>
            </button>
            <button
              className={`btn-tool ${statusFilter === 'all' ? 'primary' : ''}`}
              style={{ fontSize: '11px', padding: '3px 10px' }}
              onClick={() => {
                setStatusFilter('all');
                setSelectedPackages(new Set());
              }}
            >
              <span>Tất cả ({counts.total})</span>
            </button>
            <button
              className={`btn-tool ${statusFilter === 'uninstalled' ? 'primary' : ''}`}
              style={{ fontSize: '11px', padding: '3px 10px' }}
              onClick={() => {
                setStatusFilter('uninstalled');
                setSelectedPackages(new Set());
              }}
            >
              <span className="svg-icon" style={{ color: '#10b981' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </span>
              <span>Đã gỡ bỏ ({counts.uninstalled})</span>
            </button>
          </div>

          {/* Tier & Search */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select
              className="select-input"
              style={{ width: '180px', padding: '4px 8px', fontSize: '11px' }}
              value={selectedTier}
              onChange={(e) => {
                setSelectedTier(e.target.value);
                setSelectedPackages(new Set());
              }}
            >
              <option value="all">Tất cả các tầng an toàn</option>
              <option value="level_1_safe">Tầng 1: Rác cốt lõi (Khuyên gỡ 100%)</option>
              <option value="level_2_bloat">Tầng 2: MXH & Đối tác TQ</option>
              <option value="level_3_optional">Tầng 3: Tiện ích Honor TQ & YOYO</option>
              <option value="level_4_browser_store">Tầng 4: Trình duyệt & Chợ app</option>
              <option value="level_5_critical_system">Tầng 5: Cốt lõi hệ thống (Bảo vệ)</option>
            </select>

            <input
              type="text"
              className="select-input"
              style={{ width: '190px', padding: '4px 8px', fontSize: '11px' }}
              placeholder="Tìm theo tên hoặc package ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Status banner when all bloatware is already removed */}
      {counts.installed === 0 && counts.uninstalled > 0 && statusFilter === 'installed' && isOnline && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '4px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="svg-icon" style={{ color: '#10b981', width: '20px', height: '20px' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </span>
            <div>
              <div style={{ fontWeight: 600, color: '#10b981', fontSize: '13px' }}>
                🎉 Thiết bị của bạn đã sạch hoàn toàn! Không có app rác nào đang tồn tại trên máy ({counts.uninstalled} ứng dụng đã được gỡ bỏ).
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>
                Bộ lọc hiện tại đang ẩn các ứng dụng đã gỡ. Bạn có thể bấm "Xem Tất Cả" bên cạnh để kiểm tra hoặc khôi phục bất kỳ lúc nào.
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn-tool"
            onClick={() => setStatusFilter('all')}
            style={{ whiteSpace: 'nowrap', padding: '5px 12px', fontSize: '11px' }}
          >
            Xem Tất Cả ({counts.total})
          </button>
        </div>
      )}

      {/* Scanned Packages Table */}
      <div
        className="specs-card"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '0',
          overflow: 'hidden',
          minHeight: '320px',
        }}
      >
        <div style={{ overflowY: 'auto', flex: 1 }}>
          <table className="specs-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--panel-alt)' }}>
              <tr>
                <th style={{ width: '45px', textAlign: 'center', padding: '8px' }}>
                  <input
                    type="checkbox"
                    checked={selectableFiltered.length > 0 && selectedPackages.size === selectableFiltered.length}
                    onChange={handleSelectAll}
                    disabled={selectableFiltered.length === 0}
                  />
                </th>
                <th style={{ textAlign: 'left', padding: '8px 10px', width: '220px' }}>Tên Ứng Dụng</th>
                <th style={{ textAlign: 'left', padding: '8px 10px', width: '210px' }}>Package ID</th>
                <th style={{ textAlign: 'left', padding: '8px 10px' }}>Chức Năng & Lý Do Nên Gỡ</th>
                <th style={{ textAlign: 'center', padding: '8px 10px', width: '110px' }}>Khuyên Gỡ</th>
                <th style={{ textAlign: 'center', padding: '8px 10px', width: '120px' }}>Trạng Thái Trên Máy</th>
              </tr>
            </thead>
            <tbody>
              {filteredPackages.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-muted)' }}>
                    {isScanning
                      ? 'Đang đồng bộ danh sách ứng dụng từ điện thoại...'
                      : counts.installed === 0 && counts.uninstalled > 0 && statusFilter === 'installed'
                      ? '🎉 Toàn bộ ứng dụng rác nội địa đã được dọn sạch khỏi máy. Chuyển sang tab "Tất Cả" để xem danh sách hoặc khôi phục.'
                      : 'Không tìm thấy package nào phù hợp với bộ lọc.'}
                  </td>
                </tr>
              ) : (
                filteredPackages.map((pkg) => {
                  const selectable = isSelectable(pkg);
                  const isChecked = selectedPackages.has(pkg.package);
                  const isUninstalled = pkg.status === 'uninstalled';
                  const isProtected = pkg.tierKey === 'level_5_critical_system';

                  return (
                    <tr
                      key={pkg.package}
                      style={{
                        cursor: selectable ? 'pointer' : 'default',
                        opacity: isUninstalled && statusFilter !== 'uninstalled' ? 0.6 : 1,
                        background: isChecked ? 'rgba(37, 99, 235, 0.12)' : 'transparent',
                      }}
                      onClick={() => handleToggle(pkg.package, selectable)}
                    >
                      <td
                        style={{ textAlign: 'center', padding: '8px', cursor: selectable ? 'pointer' : 'default' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggle(pkg.package, selectable);
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={!selectable}
                          readOnly
                          style={{ cursor: selectable ? 'pointer' : 'not-allowed', pointerEvents: 'none' }}
                        />
                      </td>

                      <td style={{ padding: '8px 10px', fontWeight: 600, color: isUninstalled ? 'var(--text-muted)' : 'var(--text-bright)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <AppIcon pkg={pkg.package} name={pkg.name} isUser={false} size={28} />
                          <span>{pkg.name}</span>
                        </div>
                      </td>

                      <td className="font-mono" style={{ padding: '8px 10px', fontSize: '11px', color: 'var(--text-dim)' }}>
                        {pkg.package}
                      </td>

                      <td style={{ padding: '8px 10px', fontSize: '11px', color: 'var(--text-dim)' }}>
                        {pkg.desc}
                      </td>

                      <td style={{ textAlign: 'center', padding: '8px 10px' }}>
                        <span
                          className={`badge-tag ${
                            isProtected
                              ? 'tag-danger'
                              : pkg.recommended
                              ? 'tag-safe'
                              : 'tag-warn'
                          }`}
                          style={{ fontSize: '10px' }}
                        >
                          {isProtected ? 'Cấm Gỡ' : pkg.recommended ? 'Khuyên Gỡ' : 'Tùy Chọn'}
                        </span>
                      </td>

                      <td style={{ textAlign: 'center', padding: '8px 10px' }}>
                        {pkg.status === 'active' ? (
                          <span className="badge-tag tag-warn" style={{ fontSize: '10px' }}>
                            Đang Chạy
                          </span>
                        ) : pkg.status === 'disabled' ? (
                          <span className="badge-tag tag-neutral" style={{ fontSize: '10px' }}>
                            Đã Vô Hiệu
                          </span>
                        ) : pkg.status === 'uninstalled' ? (
                          <span className="badge-tag tag-safe" style={{ fontSize: '10px' }}>
                            Đã Gỡ Bỏ
                          </span>
                        ) : (
                          <span className="badge-tag tag-neutral" style={{ fontSize: '10px' }}>
                            Chưa Quét
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
