import React, { useState, useEffect } from 'react';
import { registerExportModalHandler, unregisterExportModalHandler } from '@/services/customExport';

export default function CustomExportModal() {
  const [modalConfig, setModalConfig] = useState(null);
  const [resolver, setResolver] = useState(null);

  // Form states
  const [format, setFormat] = useState('excel'); // 'excel' | 'pdf'
  const [scope, setScope] = useState('filtered'); // 'filtered' | 'all'
  const [filename, setFilename] = useState('');
  const [selectedCols, setSelectedCols] = useState(new Set());
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    registerExportModalHandler((options) => {
      return new Promise((resolve) => {
        const rawCols = options.columns || [
          { key: 'periodLabel', label: 'Thời Gian / Kỳ Báo Cáo', isPrimary: true },
          { key: 'revenueMil', label: 'Doanh Thu Thuần (Triệu VNĐ)', isPrimary: true },
          { key: 'costMil', label: 'Chi Phí Vận Hành (Triệu VNĐ)', isPrimary: true },
          { key: 'starterPack', label: 'Gói Khởi Động (Lượt nạp)', isPrimary: true },
          { key: 'vipPack', label: 'Gói VIP Tháng (Lượt nạp)', isPrimary: true },
          { key: 'richPack', label: 'Gói Đại Gia (Lượt nạp)', isPrimary: true },
        ];

        const primaryKeys = new Set();
        rawCols.forEach((c) => {
          if (c.isPrimary !== false) primaryKeys.add(c.key);
        });

        const initialFormat = options.defaultFormat || 'excel';
        const baseName = options.defaultFilename
          ? options.defaultFilename.replace(/\.(csv|xlsx|pdf)$/i, '')
          : `HALMBOOK_BaoCao_${new Date().toISOString().slice(0, 10)}`;

        setFormat(initialFormat);
        setScope('filtered');
        setFilename(baseName);
        setSelectedCols(primaryKeys);
        setIsExporting(false);

        setModalConfig({
          title: options.title || 'Cấu Hình Xuất Dữ Liệu Báo Cáo',
          datasetName: options.datasetName || 'Báo Cáo Tăng Trưởng Dòng Tiền & Hiệu Suất Hệ Thống',
          currentFilterDesc: options.currentFilterDesc || 'Đang áp dụng bộ lọc hiện tại',
          totalCount: options.totalCount ?? 0,
          filteredCount: options.filteredCount ?? 0,
          columns: rawCols,
          data: options.data || null,
          formatters: options.formatters || {},
          onExport: options.onExport || null,
        });

        setResolver(() => resolve);
      });
    });

    return () => {
      unregisterExportModalHandler();
    };
  }, []);

  // Đóng modal khi bấm Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && modalConfig) {
        handleClose(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalConfig, resolver]);

  const handleClose = (res = null) => {
    if (resolver) resolver(res);
    setModalConfig(null);
    setResolver(null);
    setIsExporting(false);
  };

  if (!modalConfig) return null;

  const colList = modalConfig.columns || [];
  const primaryCols = colList.filter((c) => c.isPrimary !== false);
  const secondaryCols = colList.filter((c) => c.isPrimary === false);

  const toggleColumn = (key) => {
    const next = new Set(selectedCols);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    setSelectedCols(next);
  };

  const handleSelectAll = () => {
    setSelectedCols(new Set(colList.map((c) => c.key)));
  };

  const handleDeselectAll = () => {
    setSelectedCols(new Set());
  };

  const handleResetDefault = () => {
    setSelectedCols(new Set(primaryCols.map((c) => c.key)));
  };

  const activeRecordCount = scope === 'all' ? modalConfig.totalCount : modalConfig.filteredCount;
  const extension = format === 'pdf' ? '.pdf' : '.csv';
  const fullFilename = filename.trim().endsWith(extension) ? filename.trim() : `${filename.trim()}${extension}`;

  const handleConfirmExport = async () => {
    if (selectedCols.size === 0) {
      alert('Vui lòng chọn ít nhất 1 cột / chỉ số dữ liệu để xuất!');
      return;
    }

    setIsExporting(true);

    const chosenColumns = colList.filter((c) => selectedCols.has(c.key));
    const exportResult = {
      format,
      scope,
      filename: fullFilename,
      selectedColumnKeys: Array.from(selectedCols),
      chosenColumns,
    };

    try {
      if (typeof modalConfig.onExport === 'function') {
        // Gọi callback xuất dữ liệu của trang gọi
        await modalConfig.onExport(scope, Array.from(selectedCols), format, fullFilename);
      } else {
        // Fallback xuất mặc định nếu có data
        await performDefaultExport(exportResult);
      }

      if (window.DB && typeof window.DB.notify === 'function') {
        window.DB.notify(`Đã xuất thành công tệp ${fullFilename} (${format.toUpperCase()})!`, 'success');
      }

      handleClose(exportResult);
    } catch (err) {
      console.error('Lỗi khi xuất file:', err);
      alert('Có lỗi xảy ra trong quá trình xuất file: ' + err.message);
      setIsExporting(false);
    }
  };

  // Logic xuất mặc định nếu trang gọi chưa gắn callback riêng
  const performDefaultExport = async (cfg) => {
    const targetData = (scope === 'all' ? modalConfig.data?.all : modalConfig.data?.filtered) || [];
    if (!targetData || targetData.length === 0) {
      alert('Không có dữ liệu để xuất!');
      return;
    }

    if (format === 'excel') {
      const headers = cfg.chosenColumns.map((c) => `"${c.label}"`);
      const rows = targetData.map((row) =>
        cfg.chosenColumns
          .map((c) => {
            const fmt = modalConfig.formatters?.[c.key];
            return fmt ? fmt(row) : `"${row[c.key] ?? ''}"`;
          })
          .join(',')
      );
      const csv = [headers.join(','), ...rows].join('\r\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = cfg.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // PDF print window
      window.print();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[999990] bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 animate-in fade-in duration-150 select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isExporting) handleClose(null);
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-4xl w-full border border-slate-200 dark:border-slate-700 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Sticky Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/90 flex justify-between items-center shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-300 dark:border-emerald-800 text-lg shadow-xs">
              <i className="fa-solid fa-file-export"></i>
            </div>
            <div>
              <h3 className="font-black text-slate-800 dark:text-white text-base leading-tight">
                {modalConfig.title}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {modalConfig.datasetName} • <span className="font-semibold text-slate-500 dark:text-slate-300">{modalConfig.currentFilterDesc}</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => handleClose(null)}
            disabled={isExporting}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition cursor-pointer"
          >
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        {/* Modal Body: Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 1. Chọn định dạng xuất file */}
          <div>
            <label className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2 mb-2.5">
              <i className="fa-solid fa-file-code text-blue-600"></i>
              <span>1. Định Dạng File Xuất</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => setFormat('excel')}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex items-start space-x-3 ${
                  format === 'excel'
                    ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-lg shrink-0 mt-0.5">
                  <i className="fa-solid fa-file-excel"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-xs text-slate-800 dark:text-white">Bảng Tính Excel (.CSV / .XLSX)</h4>
                    {format === 'excel' && <i className="fa-solid fa-circle-check text-emerald-600 dark:text-emerald-400 text-sm"></i>}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                    Tương thích Microsoft Excel & Google Sheets, chuẩn UTF-8 BOM hiển thị tiếng Việt trọn vẹn.
                  </p>
                </div>
              </div>

              <div
                onClick={() => setFormat('pdf')}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex items-start space-x-3 ${
                  format === 'pdf'
                    ? 'border-rose-500 bg-rose-50/70 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center text-lg shrink-0 mt-0.5">
                  <i className="fa-solid fa-file-pdf"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-xs text-slate-800 dark:text-white">Báo Cáo In PDF (.PDF)</h4>
                    {format === 'pdf' && <i className="fa-solid fa-circle-check text-rose-600 dark:text-rose-400 text-sm"></i>}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                    Trang in báo cáo tài chính & chỉ số hệ thống, có đóng dấu kiểm duyệt và chữ ký xác nhận.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Phạm vi dữ liệu & Tên tệp */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Scope */}
            <div>
              <label className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2 mb-2">
                <i className="fa-solid fa-filter text-blue-600"></i>
                <span>2. Phạm Vi Dữ Liệu</span>
              </label>
              <div className="space-y-2 bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="exportScope"
                    checked={scope === 'filtered'}
                    onChange={() => setScope('filtered')}
                    className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <div className="text-xs font-bold text-slate-800 dark:text-white">
                    Theo bộ lọc hiện tại{' '}
                    <span className="font-mono text-blue-600 dark:text-blue-400">({modalConfig.filteredCount} mốc)</span>
                  </div>
                </label>
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="exportScope"
                    checked={scope === 'all'}
                    onChange={() => setScope('all')}
                    className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <div className="text-xs font-bold text-slate-800 dark:text-white">
                    Toàn bộ dữ liệu các kỳ{' '}
                    <span className="font-mono text-emerald-600 dark:text-emerald-400">({modalConfig.totalCount} mốc)</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Custom Filename */}
            <div>
              <label className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2 mb-2">
                <i className="fa-solid fa-signature text-blue-600"></i>
                <span>3. Tên Tệp Xuất</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  placeholder="Nhập tên file xuất..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 pr-16"
                />
                <span className="absolute right-3 top-2.5 text-[11px] font-mono font-bold text-slate-400 uppercase">
                  {extension}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 italic">
                * Có thể sửa đổi tên file tùy ý trước khi xuất lưu trữ
              </p>
            </div>
          </div>

          {/* 3. Tùy chọn cột dữ liệu */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
              <label className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
                <i className="fa-solid fa-table-columns text-blue-600"></i>
                <span>4. Chọn Các Chỉ Số / Cột Cần Xuất</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-black border border-emerald-200 dark:border-emerald-800">
                  {selectedCols.size} / {colList.length} cột
                </span>
              </label>
              <div className="flex items-center space-x-2 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  Chọn tất cả
                </button>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                >
                  Bỏ chọn
                </button>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <button
                  type="button"
                  onClick={handleResetDefault}
                  className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                >
                  Mặc định
                </button>
              </div>
            </div>

            {/* Primary Columns */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Chỉ số tài chính & kinh doanh</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {primaryCols.map((c) => {
                  const isChecked = selectedCols.has(c.key);
                  return (
                    <label
                      key={c.key}
                      onClick={() => toggleColumn(c.key)}
                      className={`flex items-center space-x-2.5 p-2 rounded-lg border cursor-pointer select-none transition ${
                        isChecked
                          ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 shadow-xs'
                          : 'bg-white dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                      />
                      <span className="font-bold text-xs flex-1 truncate">{c.label}</span>
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 shrink-0">
                        Chính
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Secondary Columns */}
            {secondaryCols.length > 0 && (
              <div className="space-y-2 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Chỉ số hành vi độc giả</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {secondaryCols.map((c) => {
                    const isChecked = selectedCols.has(c.key);
                    return (
                      <label
                        key={c.key}
                        onClick={() => toggleColumn(c.key)}
                        className={`flex items-center space-x-2.5 p-2 rounded-lg border cursor-pointer select-none transition ${
                          isChecked
                            ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 shadow-xs'
                            : 'bg-white dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                        />
                        <span className="font-bold text-xs flex-1 truncate">{c.label}</span>
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-300 shrink-0">
                          Phụ
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Sticky Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Tóm tắt: Định dạng <span className="font-bold text-slate-800 dark:text-white uppercase">{format}</span> •{' '}
            <span className="font-bold text-blue-600 dark:text-blue-400">{activeRecordCount}</span> bản ghi •{' '}
            <span className="font-bold text-emerald-600 dark:text-emerald-400">{selectedCols.size}</span> cột
          </div>

          <div className="flex items-center space-x-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => handleClose(null)}
              disabled={isExporting}
              className="flex-1 sm:flex-none px-4 py-2 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleConfirmExport}
              disabled={isExporting || selectedCols.size === 0}
              className={`flex-1 sm:flex-none px-5 py-2 text-white rounded-xl text-xs font-black shadow-md flex items-center justify-center space-x-2 transition cursor-pointer ${
                format === 'pdf'
                  ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
              } ${isExporting || selectedCols.size === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isExporting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Đang xuất tệp...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-download text-xs"></i>
                  <span>Xuất & Tải File Ngay</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
