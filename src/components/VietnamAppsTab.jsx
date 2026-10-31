import React, { useState, useMemo } from 'react';
import vnAppsData from '../data/vietnamApps.json';
import { adbService } from '../services/adbService';
import AppIcon from './AppIcon';

export default function VietnamAppsTab({
  device,
  scannedPackages,
  isScanning,
  onWhitelistAll,
  onRefreshScan,
}) {
  const [statusFilter, setStatusFilter] = useState('installed'); // 'installed' | 'all' | 'need_whitelist'
  const [selectedCat, setSelectedCat] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedPackages, setSelectedPackages] = useState(new Set());
  const [isExtracting, setIsExtracting] = useState(false);

  const isOnline = device && device.connected;

  const handleExtractApk = async () => {
    const pkg = Array.from(selectedPackages)[0];
    if (!pkg) return;
    setIsExtracting(true);
    try {
      const res = await adbService.extractApk(pkg);
      if (res && res.success) {
        const a = document.createElement('a');
        a.href = res.url;
        a.download = res.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        alert(`Đã trích xuất APK thành công: ${res.filename}`);
      } else {
        alert(res?.error || 'Lỗi trích xuất APK');
      }
    } catch (e) {
      alert(e.message);
    } finally {
      setIsExtracting(false);
    }
  };

  // Merge live scanned VN apps with data definitions
  const allApps = useMemo(() => {
    if (scannedPackages?.vn_apps && scannedPackages.vn_apps.length > 0) {
      return scannedPackages.vn_apps;
    }

    // Fallback if not scanned
    const list = [];
    const categories = vnAppsData.categories || {};
    Object.entries(categories).forEach(([catKey, cat]) => {
      (cat.apps || []).forEach((app) => {
        list.push({
          ...app,
          category: cat.name,
          catKey,
          installed: false,
          whitelisted: false,
        });
      });
    });
    return list;
  }, [scannedPackages]);

  // Counts
  const counts = useMemo(() => {
    let installed = 0;
    let whitelisted = 0;
    allApps.forEach((app) => {
      if (app.installed) {
        installed++;
        if (app.whitelisted) whitelisted++;
      }
    });
    return {
      total: allApps.length,
      installed,
      whitelisted,
      needWhitelist: installed - whitelisted,
    };
  }, [allApps]);

  // Categories list
  const categoryOptions = useMemo(() => {
    const map = new Map();
    allApps.forEach((app) => {
      if (!map.has(app.category)) {
        map.set(app.category, 0);
      }
      map.set(app.category, map.get(app.category) + 1);
    });
    return Array.from(map.entries());
  }, [allApps]);

  // Filtered Apps
  const filteredApps = useMemo(() => {
    const q = search.toLowerCase().trim();
    return allApps.filter((app) => {
      // 1. Status Filter
      if (statusFilter === 'installed' && !app.installed) return false;
      if (statusFilter === 'need_whitelist' && (!app.installed || app.whitelisted)) return false;

      // 2. Category Filter
      if (selectedCat !== 'all' && app.category !== selectedCat) return false;

      // 3. Search Query
      if (q) {
        const matchName = (app.name || '').toLowerCase().includes(q);
        const matchPkg = (app.package || '').toLowerCase().includes(q);
        const matchCat = (app.category || '').toLowerCase().includes(q);
        if (!matchName && !matchPkg && !matchCat) return false;
      }

      return true;
    });
  }, [allApps, statusFilter, selectedCat, search]);

  const selectableFiltered = useMemo(() => {
    return filteredApps.filter((a) => isOnline && a.installed);
  }, [filteredApps, isOnline]);

  const handleToggle = (pkg) => {
    const next = new Set(selectedPackages);
    if (next.has(pkg)) next.delete(pkg);
    else next.add(pkg);
    setSelectedPackages(next);
  };

  const handleSelectAll = () => {
    if (selectedPackages.size === selectableFiltered.length && selectableFiltered.length > 0) {
      setSelectedPackages(new Set());
    } else {
      setSelectedPackages(new Set(selectableFiltered.map((a) => a.package)));
    }
  };

  const handleWhitelistInstalled = () => {
    const installedPkgs = allApps.filter((a) => a.installed).map((a) => a.package);
    if (installedPkgs.length === 0) return;
    onWhitelistAll(installedPkgs);
  };

  const handleWhitelistSelected = () => {
    const pkgs = Array.from(selectedPackages);
    if (pkgs.length === 0) return;
    onWhitelistAll(pkgs);
    setSelectedPackages(new Set());
  };

  return (
    <div className="tab-pane active" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Top Banner & Scan Stats */}
      <div className="specs-card" style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-bright)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Tối Ưu Hóa Thông Báo FCM & Pin Cho 65 Ứng Dụng Việt Nam</span>
              {isScanning ? (
                <span className="badge-tag tag-warn" style={{ fontSize: '10px' }}>Đang quét ứng dụng...</span>
              ) : isOnline ? (
                <span className="badge-tag tag-safe" style={{ fontSize: '10px' }}>
                  Phát hiện {counts.installed}/65 apps đang có trên máy
                </span>
              ) : (
                <span className="badge-tag tag-neutral" style={{ fontSize: '10px' }}>Chưa kết nối ADB</span>
              )}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '3px' }}>
              Điện thoại Honor ROM nội địa Trung Quốc tự động đóng băng ngầm (Doze Deep Sleep). Cần cấp quyền Whitelist để thông báo biến động số dư ngân hàng và tin nhắn Zalo, Messenger không bị trễ.
              {counts.installed > 0 && ` (${counts.whitelisted}/${counts.installed} apps đã được Whitelist)`}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              className="btn-tool"
              onClick={onRefreshScan}
              disabled={!isOnline || isScanning}
              title="Quét lại các ứng dụng đang có trên máy"
            >
              <span className="svg-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="23 4 23 10 17 10"></polyline>
                  <polyline points="1 20 1 14 7 14"></polyline>
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                </svg>
              </span>
              <span>{isScanning ? 'Đang Quét...' : 'Quét Lại'}</span>
            </button>

            {counts.installed > 0 && (
              <button
                className="btn-tool primary"
                onClick={handleWhitelistInstalled}
                disabled={!isOnline}
              >
                <span className="svg-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </span>
                <span>Cấp Doze Cho {counts.installed} Apps Có Trên Máy</span>
              </button>
            )}

            {selectedPackages.size > 0 && (
              <button
                className="btn-tool"
                onClick={handleWhitelistSelected}
                disabled={!isOnline}
              >
                <span>Cấp Whitelist ({selectedPackages.size}) Đã Chọn</span>
              </button>
            )}

            {selectedPackages.size === 1 && (
              <button
                className="btn-tool"
                onClick={handleExtractApk}
                disabled={!isOnline || isExtracting}
                title="Trích xuất file cài đặt APK từ điện thoại và tải về máy tính"
              >
                <span className="svg-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                </span>
                <span>{isExtracting ? 'Đang trích xuất...' : 'Trích Xuất APK Ra PC'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Status Filters + Category Pills Bar */}
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
              <span>Đang có trên máy ({counts.installed})</span>
            </button>
            <button
              className={`btn-tool ${statusFilter === 'all' ? 'primary' : ''}`}
              style={{ fontSize: '11px', padding: '3px 10px' }}
              onClick={() => {
                setStatusFilter('all');
                setSelectedPackages(new Set());
              }}
            >
              <span>Tất cả danh mục ({counts.total})</span>
            </button>
            {counts.needWhitelist > 0 && (
              <button
                className={`btn-tool ${statusFilter === 'need_whitelist' ? 'primary' : ''}`}
                style={{ fontSize: '11px', padding: '3px 10px' }}
                onClick={() => {
                  setStatusFilter('need_whitelist');
                  setSelectedPackages(new Set());
                }}
              >
                <span>Chưa cấp quyền ({counts.needWhitelist})</span>
              </button>
            )}
          </div>

          {/* Category Dropdown & Search */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select
              className="select-input"
              style={{ width: '180px', padding: '4px 8px', fontSize: '11px' }}
              value={selectedCat}
              onChange={(e) => {
                setSelectedCat(e.target.value);
                setSelectedPackages(new Set());
              }}
            >
              <option value="all">Tất cả phân nhóm ({allApps.length})</option>
              {categoryOptions.map(([catName, count]) => (
                <option key={catName} value={catName}>
                  {catName} ({count})
                </option>
              ))}
            </select>

            <input
              type="text"
              className="select-input"
              style={{ width: '190px', padding: '4px 8px', fontSize: '11px' }}
              placeholder="Tìm Zalo, TPBank, VNeID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Table of Scanned Apps */}
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
                <th style={{ textAlign: 'left', padding: '8px 10px', width: '220px' }}>Package ID</th>
                <th style={{ textAlign: 'left', padding: '8px 10px', width: '160px' }}>Phân Nhóm</th>
                <th style={{ textAlign: 'center', padding: '8px 10px', width: '120px' }}>Mức Độ Ưu Tiên</th>
                <th style={{ textAlign: 'center', padding: '8px 10px', width: '120px' }}>Cài Đặt Trên Máy</th>
                <th style={{ textAlign: 'center', padding: '8px 10px', width: '130px' }}>Quyền Whitelist Doze</th>
                <th style={{ textAlign: 'center', padding: '8px 10px', width: '110px' }}>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-muted)' }}>
                    {isScanning
                      ? 'Đang đồng bộ danh mục ứng dụng từ điện thoại...'
                      : 'Không tìm thấy ứng dụng nào phù hợp với bộ lọc.'}
                  </td>
                </tr>
              ) : (
                filteredApps.map((app) => {
                  const isChecked = selectedPackages.has(app.package);
                  const isInstalled = !!app.installed;
                  const isWhitelisted = !!app.whitelisted;

                  return (
                    <tr
                      key={app.package}
                      style={{
                        cursor: isInstalled ? 'pointer' : 'default',
                        opacity: isInstalled ? 1 : 0.55,
                        background: isChecked ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
                      }}
                      onClick={() => isInstalled && handleToggle(app.package)}
                    >
                      <td
                        style={{ textAlign: 'center', padding: '8px', cursor: isInstalled ? 'pointer' : 'default' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isInstalled) handleToggle(app.package);
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={!isInstalled || !isOnline}
                          readOnly
                          style={{ cursor: isInstalled ? 'pointer' : 'not-allowed', pointerEvents: 'none' }}
                        />
                      </td>

                      <td style={{ padding: '8px 10px', fontWeight: 600, color: isInstalled ? 'var(--text-bright)' : 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <AppIcon pkg={app.package} name={app.name} isUser={true} size={28} />
                          <span>{app.name}</span>
                        </div>
                      </td>

                      <td className="font-mono" style={{ padding: '8px 10px', fontSize: '11px', color: 'var(--text-dim)' }}>
                        {app.package}
                      </td>

                      <td style={{ padding: '8px 10px' }}>
                        <span className="badge-tag tag-neutral" style={{ fontSize: '10px' }}>
                          {app.category}
                        </span>
                      </td>

                      <td style={{ textAlign: 'center', padding: '8px 10px' }}>
                        <span
                          className={`badge-tag ${
                            app.priority === 'critical' ? 'tag-danger' : 'tag-warn'
                          }`}
                          style={{ fontSize: '10px' }}
                        >
                          {app.priority === 'critical' ? 'Tối Quan Trọng' : 'Ưu Tiên Cao'}
                        </span>
                      </td>

                      <td style={{ textAlign: 'center', padding: '8px 10px' }}>
                        <span
                          className={`badge-tag ${isInstalled ? 'tag-safe' : 'tag-neutral'}`}
                          style={{ fontSize: '10px' }}
                        >
                          {isInstalled ? 'Đã Cài Đặt' : 'Chưa Cài'}
                        </span>
                      </td>

                      <td style={{ textAlign: 'center', padding: '8px 10px' }}>
                        <span
                          className={`badge-tag ${isWhitelisted ? 'tag-safe' : 'tag-warn'}`}
                          style={{ fontSize: '10px' }}
                        >
                          {isWhitelisted ? 'Đã Whitelist' : 'Chưa Cấp Quyền'}
                        </span>
                      </td>

                      <td style={{ textAlign: 'center', padding: '8px 10px' }}>
                        <button
                          className="btn-tool"
                          style={{ padding: '2px 8px', fontSize: '10px' }}
                          disabled={!isInstalled || !isOnline}
                          onClick={(e) => {
                            e.stopPropagation();
                            onWhitelistAll([app.package]);
                          }}
                        >
                          <span>Cấp Doze</span>
                        </button>
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
