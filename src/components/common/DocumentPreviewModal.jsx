import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Maximize2, 
  Minimize2, 
  ExternalLink, 
  AlertCircle, 
  Loader2, 
  FileText, 
  FileSpreadsheet, 
  Image as ImageIcon,
  Check
} from 'lucide-react';
import { 
  detectFileType, 
  getFileMeta, 
  getFileNameFromUrl, 
  isValidFileUrl, 
  FILE_TYPES,
  isGoogleUrl,
  getGoogleEmbedUrl
} from '../../utils/fileDetector';
import * as docx from 'docx-preview';
import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

/**
 * Modal xem trước tài liệu đa năng với giao diện chuẩn như ảnh mẫu
 */
export const DocumentPreviewModal = ({
  isOpen,
  onClose,
  url,
  fileName = ''
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [useFallbackViewer, setUseFallbackViewer] = useState(false);
  const [fallbackType, setFallbackType] = useState('gdocs'); // 'gdocs' | 'office'

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Zoom
  const [zoom, setZoom] = useState(85);
  const [isZoomMenuOpen, setIsZoomMenuOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Image controls
  const [imageRotation, setImageRotation] = useState(0);

  // Excel state
  const [excelSheets, setExcelSheets] = useState([]);
  const [activeSheetIndex, setActiveSheetIndex] = useState(0);
  const [sheetData, setSheetData] = useState([]);

  // PDF state
  const [pdfPages, setPdfPages] = useState([]);

  const cleanFileName = getFileNameFromUrl(url, fileName);
  const fileType = detectFileType(url, cleanFileName);
  const meta = getFileMeta(fileType);

  const docxContainerRef = useRef(null);
  const modalRef = useRef(null);
  const zoomMenuRef = useRef(null);

  // Đóng zoom menu khi bấm ra ngoài
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (zoomMenuRef.current && !zoomMenuRef.current.contains(e.target)) {
        setIsZoomMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Xử lý phím tắt (Esc để đóng, mũi tên trái/phải để chuyển trang)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose?.();
      } else if (e.key === 'ArrowLeft') {
        goToPrevPage();
      } else if (e.key === 'ArrowRight') {
        goToNextPage();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentPage, totalPages]);

  // Load và Render tài liệu khi modal mở hoặc URL thay đổi
  useEffect(() => {
    if (!isOpen || !url) return;

    setError(null);
    setUseFallbackViewer(false);
    setCurrentPage(1);
    setTotalPages(1);
    setZoom(fileType === FILE_TYPES.DOCX ? 85 : 100);
    setImageRotation(0);

    // Chặn các link không phải file thật (route nội bộ, link rỗng, thiếu đuôi hợp lệ...)
    if (!isValidFileUrl(url)) {
      setError('Đường dẫn tài liệu không hợp lệ hoặc không được hỗ trợ xem trước. Vui lòng kiểm tra lại liên kết tệp đính kèm.');
      return; // dừng luôn, không gọi render/fetch nào cả
    }

    if (isGoogleUrl(url)) {
      setUseFallbackViewer(true);
      setLoading(false);
      return;
    }

    if (fileType === FILE_TYPES.DOCX) {
      renderDocxFile();
    } else if (fileType === FILE_TYPES.PDF) {
      renderPdfFile();
    } else if (fileType === FILE_TYPES.EXCEL) {
      renderExcelFile();
    } else if (fileType === FILE_TYPES.DOC || fileType === FILE_TYPES.POWERPOINT) {
      setUseFallbackViewer(true);
    }
  }, [isOpen, url, fileType]);

  // Render file Word (.docx) bằng docx-preview
  const renderDocxFile = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document, */*'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Không thể tải file từ Cloudinary`);
      }

      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();

      if (docxContainerRef.current) {
        docxContainerRef.current.innerHTML = '';
        
        await docx.renderAsync(arrayBuffer, docxContainerRef.current, null, {
          className: 'docx-document-viewer',
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          breakPages: true,
          renderHeaders: true,
          renderFooters: true,
          renderFootnotes: true,
          renderEndnotes: true
        });

        // Đếm số trang đã được render (mỗi trang là một <section class="docx">)
        setTimeout(() => {
          if (!docxContainerRef.current) return;
          const pages = docxContainerRef.current.querySelectorAll('section.docx');
          if (pages.length > 0) {
            setTotalPages(pages.length);
          } else {
            setTotalPages(1);
          }
        }, 300);
      }
    } catch (err) {
      console.warn('Lỗi khi tải hoặc render file docx qua client:', err);
      // Fallback tự động khi bị chặn CORS hoặc lỗi cấu trúc
      setError('Không thể tải trực tiếp file qua trình duyệt (thường do giới hạn CORS của link Cloudinary). Bạn có thể xem qua trình xem trực tuyến bên dưới hoặc tải về máy.');
      setUseFallbackViewer(true);
    } finally {
      setLoading(false);
    }
  };

  // Render file Excel (.xlsx) bằng XLSX parser
  const renderExcelFile = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();

      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      setExcelSheets(workbook.SheetNames);
      
      if (workbook.SheetNames.length > 0) {
        setActiveSheetIndex(0);
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' });
        setSheetData(jsonData);
        setTotalPages(workbook.SheetNames.length);
      }
    } catch (err) {
      console.warn('Lỗi render Excel:', err);
      setUseFallbackViewer(true);
    } finally {
      setLoading(false);
    }
  };

  // Chuyển Sheet Excel
  const handleSelectExcelSheet = async (index) => {
    setActiveSheetIndex(index);
    setCurrentPage(index + 1);
    try {
      const response = await fetch(url);
      const arrayBuffer = await (await response.blob()).arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const currentSheet = workbook.Sheets[excelSheets[index]];
      const jsonData = XLSX.utils.sheet_to_json(currentSheet, { header: 1, defval: '' });
      setSheetData(jsonData);
    } catch (err) {
      console.error(err);
    }
  };

  // Render file PDF bằng pdfjs-dist ra từng trang A4
  const renderPdfFile = async () => {
    setLoading(true);
    setError(null);
    setPdfPages([]);

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Không thể tải file PDF`);
      }
      const arrayBuffer = await response.arrayBuffer();

      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        cMapUrl: 'https://unpkg.com/pdfjs-dist@6.3.289/cmaps/',
        cMapPacked: true,
      });

      const pdf = await loadingTask.promise;
      setTotalPages(pdf.numPages);
      const pagesArray = Array.from({ length: pdf.numPages }, (_, i) => i + 1);
      setPdfPages(pagesArray);

      setTimeout(async () => {
        for (let pNum = 1; pNum <= pdf.numPages; pNum++) {
          await renderSinglePdfPage(pdf, pNum);
        }
      }, 50);

    } catch (err) {
      console.warn('Lỗi khi tải hoặc render PDF qua pdfjs-dist:', err);
      setUseFallbackViewer(true);
      setFallbackType('gdocs');
    } finally {
      setLoading(false);
    }
  };

  const renderSinglePdfPage = async (pdf, pageNum) => {
    const canvas = document.getElementById(`pdf-canvas-${pageNum}`);
    if (!canvas) return;

    try {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.5 });
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      await page.render(renderContext).promise;
    } catch (e) {
      console.error(`Lỗi render trang PDF ${pageNum}:`, e);
    }
  };

  // Chuyển trang cho DOCX
  const scrollToPage = (pageNum) => {
    if (!docxContainerRef.current) return;
    const pages = docxContainerRef.current.querySelectorAll('section.docx');
    if (pages && pages[pageNum - 1]) {
      pages[pageNum - 1].scrollIntoView({ behavior: 'smooth', block: 'start' });
      setCurrentPage(pageNum);
    }
  };

  // Chuyển trang cho PDF
  const scrollToPdfPage = (pageNum) => {
    const pageEl = document.getElementById(`pdf-page-${pageNum}`);
    if (pageEl) {
      pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setCurrentPage(pageNum);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      const target = currentPage - 1;
      if (fileType === FILE_TYPES.DOCX) {
        scrollToPage(target);
      } else if (fileType === FILE_TYPES.PDF) {
        scrollToPdfPage(target);
      } else if (fileType === FILE_TYPES.EXCEL) {
        handleSelectExcelSheet(target - 1);
      } else {
        setCurrentPage(target);
      }
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      const target = currentPage + 1;
      if (fileType === FILE_TYPES.DOCX) {
        scrollToPage(target);
      } else if (fileType === FILE_TYPES.PDF) {
        scrollToPdfPage(target);
      } else if (fileType === FILE_TYPES.EXCEL) {
        handleSelectExcelSheet(target - 1);
      } else {
        setCurrentPage(target);
      }
    }
  };

  // Zoom handlers
  const handleZoomChange = (newZoom) => {
    const clamped = Math.max(30, Math.min(200, newZoom));
    setZoom(clamped);
    setIsZoomMenuOpen(false);
  };

  const toggleFullscreen = () => {
    if (!modalRef.current) return;
    if (!isFullscreen) {
      if (modalRef.current.requestFullscreen) {
        modalRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // Tải file trực tiếp
  const handleDownload = () => {
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = cleanFileName;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div 
        ref={modalRef}
        className="relative flex flex-col w-full h-full max-w-[98vw] max-h-[96vh] md:max-w-[92vw] md:max-h-[94vh] bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden text-slate-800"
      >
        {/* ================= TOP TOOLBAR (Tông sáng đồng bộ) ================= */}
        <header className="h-14 px-4 bg-white border-b border-slate-200 flex items-center justify-between gap-2 shrink-0 select-none z-20 shadow-xs">
          
          {/* Left: App Icon & File Name */}
          <div className="flex items-center gap-2.5 min-w-0 max-w-[35%]">
            <div className={`w-8 h-8 rounded-lg ${meta.badgeBg} flex items-center justify-center text-white font-bold text-xs shadow-xs shrink-0`}>
              {meta.shortType === 'DOCX' ? 'W' : meta.shortType === 'XLSX' ? 'X' : meta.shortType}
            </div>

            <div className="flex items-center gap-1.5 truncate">
              <span className="text-sm font-semibold text-slate-800 truncate" title={cleanFileName}>
                {cleanFileName}
              </span>
            </div>
          </div>

          {/* Center: Phân trang `< 1/2 >` (Hiện với Word, PDF hoặc Excel) */}
          {(fileType === FILE_TYPES.DOCX || fileType === FILE_TYPES.PDF || fileType === FILE_TYPES.EXCEL) && (
            <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={goToPrevPage}
                disabled={currentPage <= 1}
                className="p-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="Trang trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-xs font-semibold px-2 text-slate-800 tracking-wider">
                {currentPage} / {totalPages}
              </span>

              <button
                type="button"
                onClick={goToNextPage}
                disabled={currentPage >= totalPages}
                className="p-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="Trang tiếp"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Right: Zoom % Controls, Download, Fullscreen, Close */}
          <div className="flex items-center gap-2">
            
            {/* Zoom dropdown & Buttons (hiện với DOCX, PDF, IMAGE, EXCEL) */}
            {!useFallbackViewer && fileType !== FILE_TYPES.VIDEO && (
              <div className="flex items-center gap-1 bg-slate-100 px-1.5 py-1 rounded-xl border border-slate-200 relative" ref={zoomMenuRef}>
                <button
                  type="button"
                  onClick={() => handleZoomChange(zoom - 10)}
                  className="p-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-colors cursor-pointer"
                  title="Thu nhỏ"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>

                {/* Dropdown % */}
                <button
                  type="button"
                  onClick={() => setIsZoomMenuOpen(!isZoomMenuOpen)}
                  className="text-xs font-semibold px-2 py-0.5 text-slate-700 hover:text-slate-900 hover:bg-white rounded-lg transition-colors cursor-pointer flex items-center gap-0.5"
                >
                  <span>{zoom}%</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleZoomChange(zoom + 10)}
                  className="p-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-colors cursor-pointer"
                  title="Phóng to"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>

                {/* Menu chọn % nhanh */}
                {isZoomMenuOpen && (
                  <div className="absolute top-full mt-1.5 right-0 w-32 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-50 text-xs">
                    {[50, 74, 85, 100, 125, 150].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handleZoomChange(val)}
                        className={`w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-slate-50 transition-colors ${zoom === val ? 'text-blue-600 font-semibold bg-blue-50/50' : 'text-slate-700'}`}
                      >
                        <span>{val}%</span>
                        {zoom === val && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      </button>
                    ))}
                    <div className="my-1 border-t border-slate-100" />
                    <button
                      type="button"
                      onClick={() => handleZoomChange(100)}
                      className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      Mặc định (100%)
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Xoay ảnh nếu là file ảnh */}
            {fileType === FILE_TYPES.IMAGE && (
              <button
                type="button"
                onClick={() => setImageRotation((prev) => (prev + 90) % 360)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
                title="Xoay ảnh 90°"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            )}

            {/* Nút Mở tài liệu gốc / Tải về máy */}
            {isGoogleUrl(url) ? (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 text-slate-700 transition-colors cursor-pointer"
                title="Mở tài liệu gốc trong tab mới"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            ) : (
              <button
                type="button"
                onClick={handleDownload}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
                title="Tải tệp xuống"
              >
                <Download className="w-4 h-4" />
              </button>
            )}

            {/* Nút Toàn màn hình */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
              title={isFullscreen ? 'Thu nhỏ cửa sổ' : 'Toàn màn hình'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <div className="h-5 w-px bg-slate-200 mx-0.5" />

            {/* Nút Đóng Modal */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 hover:bg-red-50 hover:text-red-600 border border-slate-200 text-slate-500 transition-colors cursor-pointer"
              title="Đóng xem trước (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* ================= BODY CANVAS (Tông sáng chuẩn tài liệu A4) ================= */}
        <main className="flex-1 bg-[#F1F5F9] overflow-auto relative flex flex-col items-center justify-start p-4 md:p-8">
          
          {/* Loading Indicator */}
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-30 backdrop-blur-xs">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-3" />
              <p className="text-sm text-slate-700 font-medium">Đang tải và chuẩn bị tài liệu...</p>
            </div>
          )}

          {/* Error Alert with Fallback Options */}
          {error && !loading && (
            <div className="w-full max-w-2xl my-4 p-4 bg-red-50 border border-red-200 rounded-xl flex flex-col gap-3 shadow-sm">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div className="text-xs text-red-700 leading-relaxed">
                  {error}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-red-100">
                <button
                  type="button"
                  onClick={() => {
                    setUseFallbackViewer(true);
                    setFallbackType('gdocs');
                  }}
                  className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Xem qua Google Docs Viewer
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setUseFallbackViewer(true);
                    setFallbackType('office');
                  }}
                  className="px-3 py-1.5 text-xs font-medium bg-[#2b579a] hover:bg-[#3b68ab] text-white rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Xem qua Office Online
                </button>

                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-3 py-1.5 text-xs font-medium bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer ml-auto"
                >
                  <Download className="w-3.5 h-3.5" />
                  Tải file về máy
                </button>
              </div>
            </div>
          )}

          {/* 1. DOCX RENDERER (Trang giấy A4 chuẩn giống ảnh mẫu) */}
          {fileType === FILE_TYPES.DOCX && !useFallbackViewer && (
            <div 
              className="transition-transform duration-150 origin-top flex flex-col items-center justify-center"
              style={{ transform: `scale(${zoom / 100})` }}
            >
              <div 
                ref={docxContainerRef}
                className="docx-preview-container rounded-sm"
              />
            </div>
          )}

          {/* 2. PDF RENDERER (Render trực tiếp qua pdfjs-dist trên nền A4 trắng có bóng đổ) */}
          {fileType === FILE_TYPES.PDF && !useFallbackViewer && (
            <div 
              className="transition-transform duration-150 origin-top flex flex-col items-center justify-center"
              style={{ transform: `scale(${zoom / 100})` }}
            >
              {pdfPages.map((pNum) => (
                <div 
                  key={pNum}
                  id={`pdf-page-${pNum}`}
                  className="mb-6 rounded-sm overflow-hidden bg-white"
                  style={{
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <canvas 
                    id={`pdf-canvas-${pNum}`} 
                    className="block max-w-full h-auto"
                  />
                </div>
              ))}
            </div>
          )}

          {/* 3. IMAGE RENDERER */}
          {fileType === FILE_TYPES.IMAGE && !useFallbackViewer && (
            <div 
              className="transition-transform duration-200 flex items-center justify-center max-w-full my-auto"
              style={{
                transform: `scale(${zoom / 100}) rotate(${imageRotation}deg)`
              }}
            >
              <img
                src={url}
                alt={cleanFileName}
                className="max-h-[80vh] max-w-full rounded-lg shadow-lg object-contain border border-slate-200 bg-white"
              />
            </div>
          )}

          {/* 4. EXCEL RENDERER */}
          {fileType === FILE_TYPES.EXCEL && !useFallbackViewer && (
            <div className="w-full h-full flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden shadow-md">
              {/* Sheet Tabs */}
              {excelSheets.length > 1 && (
                <div className="flex items-center gap-1 px-3 py-2 bg-slate-100 border-b border-slate-200 overflow-x-auto">
                  {excelSheets.map((name, idx) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => handleSelectExcelSheet(idx)}
                      className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                        activeSheetIndex === idx 
                          ? 'bg-emerald-600 text-white shadow-xs' 
                          : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}

              {/* Table Data */}
              <div 
                className="flex-1 overflow-auto p-2"
                style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }}
              >
                {sheetData.length > 0 ? (
                  <table className="min-w-full border-collapse text-xs text-slate-800 font-mono">
                    <tbody>
                      {sheetData.slice(0, 100).map((row, rIdx) => (
                        <tr 
                          key={rIdx} 
                          className={rIdx === 0 ? 'bg-slate-100 font-bold text-slate-900' : 'even:bg-slate-50/70 hover:bg-blue-50/50'}
                        >
                          <td className="border border-slate-200 px-2 py-1 text-center bg-slate-100 text-slate-500 select-none w-10">
                            {rIdx + 1}
                          </td>
                          {Array.isArray(row) && row.map((cell, cIdx) => (
                            <td key={cIdx} className="border border-slate-200 px-3 py-1.5 whitespace-nowrap">
                              {String(cell ?? '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    Bảng tính trống hoặc không có dữ liệu để hiển thị
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 5. VIDEO RENDERER */}
          {fileType === FILE_TYPES.VIDEO && !useFallbackViewer && (
            <div className="my-auto max-w-4xl w-full flex items-center justify-center">
              <video 
                src={url} 
                controls 
                autoPlay={false}
                className="w-full max-h-[80vh] rounded-xl border border-slate-200 shadow-2xl bg-black"
              />
            </div>
          )}

          {/* 6. FALLBACK IFRAME (Google Docs / Sheets / Drive / Online Document Viewer) */}
          {useFallbackViewer && (
            <div className="w-full h-full flex flex-col flex-1 min-h-[650px] relative">
              <iframe
                src={
                  getGoogleEmbedUrl(url) || (
                    fallbackType === 'office'
                      ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`
                      : `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`
                  )
                }
                title="Online Document Viewer"
                className="w-full h-full flex-1 rounded-xl border border-slate-200 shadow-lg bg-white"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
        </main>
      </div>

      {/* Scoped CSS cho docx-preview: Giữ chuẩn A4 với viền đổ bóng giấy thanh thoát */}
      <style>{`
        .docx-preview-container .docx-wrapper {
          background: transparent !important;
          padding: 0 !important;
        }
        .docx-preview-container section.docx {
          margin-bottom: 24px !important;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05) !important;
          border: 1px solid #e2e8f0 !important;
          border-radius: 4px !important;
          background: #ffffff !important;
          color: #0f172a !important;
        }
        .docx-preview-container section.docx:last-child {
          margin-bottom: 0 !important;
        }
        .docx-preview-container img {
          max-width: 100% !important;
          height: auto !important;
          display: inline-block !important;
        }
        .docx-preview-container table {
          border-collapse: collapse !important;
          margin: 12px 0 !important;
        }
      `}</style>
    </div>
  );
};
