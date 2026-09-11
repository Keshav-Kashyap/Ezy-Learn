"use client";

import React, { useState, useEffect, useContext, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import {
    ChevronLeft,
    ChevronRight,
    ZoomIn,
    ZoomOut,
    RotateCw,
    Download,
    X,
    Loader2,
    Maximize2,
    Minimize2,
    FileText,
    Lock,
    Sparkles,
    PanelRightClose,
    PanelRightOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserDetailContext } from "@/context/UserDetailContext";
import { consumeCreditAndDownload } from "@/lib/downloadHelper";

// Import styles for react-pdf text & annotation layers
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Set pdf.js worker URL
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function CustomPdfViewer({ material, onClose }) {
    const { userDetail, setUserDetail } = useContext(UserDetailContext) || {};
    const isAdmin = userDetail?.role === "admin";
    const isOutOfCredits = !isAdmin && (userDetail?.credits ?? 0) <= 0;

    // PDF Viewer States
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [scale, setScale] = useState(1.0);
    const [zoomDirection, setZoomDirection] = useState("up");
    const [rotation, setRotation] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [inputPage, setInputPage] = useState("1");
    const [loading, setLoading] = useState(true);
    const [pdfError, setPdfError] = useState(null);
    const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(false);
    const [aiSidebarWidth, setAiSidebarWidth] = useState(() => {
        if (typeof window !== "undefined" && window.__AI_SIDEBAR_WIDTH__) {
            return window.__AI_SIDEBAR_WIDTH__;
        }
        return 450;
    });
    const [isMobile, setIsMobile] = useState(false);

    // Listen to real-time AI sidebar width changes
    useEffect(() => {
        const handleWidthChange = (e) => {
            if (e.detail?.width) {
                if (typeof window !== "undefined") {
                    window.__AI_SIDEBAR_WIDTH__ = e.detail.width;
                }
                setAiSidebarWidth(e.detail.width);
            }
        };

        window.addEventListener("ai-sidebar-width-change", handleWidthChange);
        return () => window.removeEventListener("ai-sidebar-width-change", handleWidthChange);
    }, []);

    const [realFileSize, setRealFileSize] = useState(material?.size || null);

    // Fetch real file size dynamically from URL
    useEffect(() => {
        if (!material?.fileUrl) return;
        fetch(`/api/download/file-info?url=${encodeURIComponent(material.fileUrl)}`)
            .then((res) => res.json())
            .then((data) => {
                if (data?.formattedSize) setRealFileSize(data.formattedSize);
            })
            .catch(() => {});
    }, [material?.fileUrl]);

    // Build proxied PDF URL to avoid CORS & Google Drive blocks
    const pdfUrl = material?.fileUrl
        ? `/api/download/proxy?url=${encodeURIComponent(material.fileUrl)}`
        : null;

    // Detect mobile viewport
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    function onDocumentLoadSuccess({ numPages }) {
        setNumPages(numPages);
        setPageNumber(1);
        setInputPage("1");
        setLoading(false);
    }

    function onDocumentLoadError(error) {
        console.error("PDF Load Error:", error);
        setPdfError("Failed to load PDF document.");
        setLoading(false);
    }

    const changePage = (offset) => {
        setPageNumber((prev) => {
            const newPage = Math.min(Math.max(1, prev + offset), numPages || 1);
            setInputPage(newPage.toString());
            return newPage;
        });
    };

    const handlePageInputSubmit = (e) => {
        if (e.key === "Enter") {
            const page = parseInt(inputPage, 10);
            if (!isNaN(page) && page >= 1 && page <= (numPages || 1)) {
                setPageNumber(page);
            } else {
                setInputPage(pageNumber.toString());
            }
        }
    };

    // Drag & Pan + Double-Click Zoom Ref & State
    const containerRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

    // Cursor-centered bidirectional double-click zoom (100% -> 150% -> 200% -> 150% -> 100%)
    const handleDoubleClick = (e) => {
        if (e.target.tagName === "INPUT" || e.target.tagName === "BUTTON") return;
        const container = containerRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        const currentScale = scale;
        let nextScale = currentScale;

        if (zoomDirection === "up") {
            nextScale = Math.min(2.5, Math.round((currentScale + 0.5) * 10) / 10);
            if (nextScale >= 2.5) {
                setZoomDirection("down");
            }
        } else {
            nextScale = Math.max(1.0, Math.round((currentScale - 0.5) * 10) / 10);
            if (nextScale <= 1.0) {
                setZoomDirection("up");
            }
        }

        // Calculate new scroll position so point under mouse cursor remains centered
        const contentX = container.scrollLeft + clickX;
        const contentY = container.scrollTop + clickY;
        const ratioX = contentX / currentScale;
        const ratioY = contentY / currentScale;

        const newScrollLeft = ratioX * nextScale - clickX;
        const newScrollTop = ratioY * nextScale - clickY;

        setScale(nextScale);

        requestAnimationFrame(() => {
            if (container) {
                container.scrollLeft = Math.max(0, newScrollLeft);
                container.scrollTop = Math.max(0, newScrollTop);
            }
        });
    };

    // Mouse wheel / trackpad scrolling & pinch zoom handler
    const handleWheel = (e) => {
        const container = containerRef.current;
        if (!container) return;

        // Ctrl + Wheel OR Pinch Gesture -> Zoom in/out
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const delta = e.deltaY < 0 ? 0.1 : -0.1;
            setScale((prev) => {
                const next = Math.min(2.5, Math.max(0.8, prev + delta));
                if (next >= 2.0) setZoomDirection("down");
                if (next <= 1.0) setZoomDirection("up");
                return next;
            });
            return;
        }

        // Shift + Wheel OR Trackpad Horizontal Delta -> Horizontal Scroll
        if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
            e.preventDefault();
            const delta = e.shiftKey ? e.deltaY : e.deltaX;
            container.scrollLeft += delta;
        }
    };

    // Hold & Drag to pan PDF (strictly when mouse left button is held down)
    const handleMouseDown = (e) => {
        if (e.button !== 0) return; // Only left click
        const container = containerRef.current;
        if (!container) return;

        setIsDragging(true);
        setDragStart({
            x: e.clientX,
            y: e.clientY,
            scrollLeft: container.scrollLeft,
            scrollTop: container.scrollTop,
        });
    };

    const handleMouseMove = (e) => {
        // Strictly check mouse button 1 is actively pressed while moving
        if (!isDragging || e.buttons !== 1) {
            if (isDragging) setIsDragging(false);
            return;
        }
        const container = containerRef.current;
        if (!container) return;

        e.preventDefault();
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;

        container.scrollLeft = dragStart.scrollLeft - dx;
        container.scrollTop = dragStart.scrollTop - dy;
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
            if (e.key === "ArrowRight") changePage(1);
            if (e.key === "ArrowLeft") changePage(-1);
            if (e.key === "Escape" && onClose) onClose();
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [numPages, pageNumber]);

    const handleDownloadClick = () => {
        if (!material) return;
        consumeCreditAndDownload({
            fileUrl: material.fileUrl,
            fileName: material.title,
            fileType: material.type || "pdf",
            materialId: material.id,
            userDetail,
            setUserDetail,
        });
    };

    // Sync state with global AI sidebar open/close events
    useEffect(() => {
        const handleOpenAI = () => setIsAiSidebarOpen(true);
        const handleCloseAI = () => setIsAiSidebarOpen(false);

        window.addEventListener("open-ai-sidebar", handleOpenAI);
        window.addEventListener("close-ai-sidebar", handleCloseAI);

        // Open AI Sidebar automatically when PDF viewer opens
        setIsAiSidebarOpen(true);
        window.dispatchEvent(new CustomEvent("open-ai-sidebar"));

        return () => {
            window.removeEventListener("open-ai-sidebar", handleOpenAI);
            window.removeEventListener("close-ai-sidebar", handleCloseAI);
            setIsAiSidebarOpen(false);
            window.dispatchEvent(new CustomEvent("close-ai-sidebar"));
        };
    }, []);

    // Toggle Main Navbar AI Sidebar on single click
    const handleToggleAiSidebar = () => {
        const nextState = !isAiSidebarOpen;
        setIsAiSidebarOpen(nextState);
        window.dispatchEvent(new CustomEvent(nextState ? "open-ai-sidebar" : "close-ai-sidebar"));
    };

    if (!material) return null;

    return (
        <div
            className="fixed inset-y-0 left-0 z-50 flex flex-col bg-[rgb(38,38,36)] border-r border-[#3a3a37] text-white shadow-2xl transition-all duration-300 ease-out animate-in fade-in duration-200"
            style={{
                right: isFullscreen || isMobile || !isAiSidebarOpen ? 0 : `${aiSidebarWidth}px`,
                transition: "right 0.05s linear"
            }}
        >
            {/* Header Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 px-4 py-2.5 bg-[#20201e]/95 border-b border-[#353532] text-slate-200 z-10 select-none shadow-md">
                {/* Left: EzyLearn Branding & Document Info */}
                <div className="flex items-center gap-2.5 min-w-0 max-w-[280px] sm:max-w-md">
                    {/* EzyLearn Logo & Brand */}
                    <div className="flex items-center gap-2 pr-2.5 border-r border-slate-800 flex-shrink-0">
                        <img
                            src="/image.jpeg"
                            alt="EzyLearn Logo"
                            className="w-6 h-6 rounded-lg object-cover border border-slate-700/50 shadow-sm"
                        />
                        <span className="font-bold text-xs sm:text-sm text-white tracking-wide">EzyLearn</span>
                    </div>

                    <div className="p-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 flex-shrink-0">
                        <FileText className="h-3.5 w-3.5" />
                    </div>
                    <h2 className="font-semibold text-xs sm:text-sm text-slate-200 truncate">
                        {material.title || "Study Material"}
                    </h2>
                    <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-400 border-blue-500/20 flex-shrink-0 hidden sm:inline-flex">
                        {(material.type || "PDF").toUpperCase()}
                    </Badge>
                </div>

                {/* Middle: Pagination Controls */}
                <div className="flex items-center gap-1.5 bg-[#181816]/90 px-2.5 py-1 rounded-xl border border-[#353532] shadow-inner text-xs">
                    <button
                        onClick={() => changePage(-1)}
                        disabled={pageNumber <= 1}
                        className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                        title="Previous Page (Left Arrow)"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>

                    <div className="flex items-center gap-1">
                        <input
                            type="text"
                            value={inputPage}
                            onChange={(e) => setInputPage(e.target.value)}
                            onKeyDown={handlePageInputSubmit}
                            className="w-9 text-center bg-[#252523] border border-[#3e3e3b] rounded-md py-0.5 text-xs text-white font-medium focus:outline-none focus:border-blue-500"
                        />
                        <span className="text-slate-400 font-medium">/ {numPages || "--"}</span>
                    </div>

                    <button
                        onClick={() => changePage(1)}
                        disabled={!numPages || pageNumber >= numPages}
                        className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                        title="Next Page (Right Arrow)"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>

                {/* Right: Controls & Ask AI */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                    {/* Ask AI Assistant Button (Always says 'Ask AI', highlighted when open) */}
                    <Button
                        size="sm"
                        onClick={handleToggleAiSidebar}
                        className={`h-8 text-xs font-semibold gap-1.5 px-3.5 transition-all duration-300 border rounded-lg active:scale-95 ${
                            isAiSidebarOpen
                                ? "bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-white border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)] ring-2 ring-purple-500/40 scale-105"
                                : "bg-gradient-to-r from-purple-900/60 via-indigo-900/50 to-slate-900 hover:from-purple-600 hover:via-indigo-600 hover:to-purple-700 text-purple-200 hover:text-white border-purple-500/40 hover:border-purple-300 shadow-md hover:shadow-[0_0_14px_rgba(168,85,247,0.4)] hover:scale-105"
                        }`}
                    >
                        <Sparkles className="h-3.5 w-3.5 text-purple-300 animate-pulse" />
                        <span>Ask AI</span>
                    </Button>

                    {/* Zoom Out */}
                    <button
                        onClick={() => setScale((s) => Math.max(0.6, s - 0.15))}
                        className="p-1.5 rounded-lg bg-[#282825] hover:bg-[#32322e] text-slate-300 transition-colors border border-[#3e3e3b]"
                        title="Zoom Out"
                    >
                        <ZoomOut className="h-3.5 w-3.5" />
                    </button>

                    <span className="text-[11px] font-mono text-slate-400 w-10 text-center hidden sm:inline-block">
                        {Math.round(scale * 100)}%
                    </span>

                    {/* Zoom In */}
                    <button
                        onClick={() => setScale((s) => Math.min(2.5, s + 0.15))}
                        className="p-1.5 rounded-lg bg-[#282825] hover:bg-[#32322e] text-slate-300 transition-colors border border-[#3e3e3b]"
                        title="Zoom In"
                    >
                        <ZoomIn className="h-3.5 w-3.5" />
                    </button>

                    {/* Rotate */}
                    <button
                        onClick={() => setRotation((r) => (r + 90) % 360)}
                        className="p-1.5 rounded-lg bg-[#282825] hover:bg-[#32322e] text-slate-300 transition-colors border border-[#3e3e3b] hidden sm:block"
                        title="Rotate 90°"
                    >
                        <RotateCw className="h-3.5 w-3.5" />
                    </button>

                    {/* Fullscreen Toggle */}
                    <button
                        onClick={() => setIsFullscreen((f) => !f)}
                        className="p-1.5 rounded-lg bg-[#282825] hover:bg-[#32322e] text-slate-300 transition-colors border border-[#3e3e3b] hidden sm:block"
                        title="Toggle Fullscreen"
                    >
                        {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                    </button>

                    {/* Download Button */}
                    <Button
                        size="sm"
                        onClick={handleDownloadClick}
                        className={`h-8 text-xs font-medium gap-1 px-3 ${
                            isOutOfCredits
                                ? "bg-amber-600 hover:bg-amber-700"
                                : "bg-blue-600 hover:bg-blue-700"
                        }`}
                    >
                        {isOutOfCredits ? <Lock className="h-3.5 w-3.5" /> : <Download className="h-3.5 w-3.5" />}
                        <span className="hidden sm:inline">Download</span>
                    </Button>

                    {/* Close Modal */}
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg bg-[#282825] hover:bg-red-600 text-slate-300 hover:text-white transition-colors ml-1"
                        title="Close Viewer (Esc)"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Main PDF Canvas Area */}
            <div
                ref={containerRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onDoubleClick={handleDoubleClick}
                onWheel={handleWheel}
                className={`flex-1 overflow-auto p-4 sm:p-6 flex items-start justify-center bg-[rgb(32,32,30)] select-none custom-scrollbar transition-colors ${
                    isDragging ? "cursor-grabbing" : "cursor-grab"
                }`}
            >
                {loading && (
                    <div className="w-full max-w-2xl bg-[#20201e] border border-[#383835] rounded-2xl p-6 sm:p-8 shadow-2xl animate-pulse space-y-6 my-auto">
                        {/* Header Skeleton */}
                        <div className="flex items-center justify-between border-b border-[#353532] pb-5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-800 animate-pulse" />
                                <div className="space-y-2">
                                    <div className="h-4 w-48 rounded-md bg-slate-800 animate-pulse" />
                                    <div className="h-3 w-28 rounded-md bg-slate-800/60 animate-pulse" />
                                </div>
                            </div>
                            <div className="h-6 w-20 rounded-full bg-blue-500/20 border border-blue-500/30 animate-pulse" />
                        </div>

                        {/* Title Block Skeleton */}
                        <div className="space-y-3 pt-2">
                            <div className="h-6 w-3/4 rounded-lg bg-slate-800 animate-pulse" />
                            <div className="h-4 w-1/2 rounded-md bg-slate-800/60 animate-pulse" />
                        </div>

                        {/* Text Lines Skeleton */}
                        <div className="space-y-3 pt-4">
                            <div className="h-3.5 w-full rounded bg-slate-800/60 animate-pulse" />
                            <div className="h-3.5 w-11/12 rounded bg-slate-800/60 animate-pulse" />
                            <div className="h-3.5 w-4/5 rounded bg-slate-800/60 animate-pulse" />
                            <div className="h-3.5 w-full rounded bg-slate-800/60 animate-pulse" />
                            <div className="h-3.5 w-3/4 rounded bg-slate-800/60 animate-pulse" />
                        </div>

                        {/* Image / Diagram Block Skeleton */}
                        <div className="h-44 w-full rounded-xl bg-slate-800/40 border border-slate-700/40 animate-pulse flex flex-col items-center justify-center gap-2">
                            <FileText className="h-8 w-8 text-slate-600 animate-pulse" />
                            <span className="text-xs text-slate-500 font-medium">Opening EzyLearn Document...</span>
                        </div>

                        {/* Bottom Text Lines Skeleton */}
                        <div className="space-y-3 pt-2">
                            <div className="h-3.5 w-full rounded bg-slate-800/60 animate-pulse" />
                            <div className="h-3.5 w-5/6 rounded bg-slate-800/60 animate-pulse" />
                            <div className="h-3.5 w-2/3 rounded bg-slate-800/60 animate-pulse" />
                        </div>
                    </div>
                )}

                {pdfError && (
                    <div className="flex flex-col items-center justify-center py-24 text-center max-w-md">
                        <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mb-3 border border-red-500/20">
                            <FileText className="h-6 w-6" />
                        </div>
                        <h3 className="font-semibold text-base text-white mb-1">Unable to preview PDF</h3>
                        <p className="text-xs text-slate-400 mb-4">{pdfError}</p>
                        <Button size="sm" onClick={handleDownloadClick} className="bg-blue-600 hover:bg-blue-700">
                            <Download className="h-4 w-4 mr-1.5" /> Download Document
                        </Button>
                    </div>
                )}

                {pdfUrl && (
                    <Document
                        file={pdfUrl}
                        onLoadSuccess={onDocumentLoadSuccess}
                        onLoadError={onDocumentLoadError}
                        loading=""
                        className="flex flex-col items-center"
                    >
                        <Page
                            pageNumber={pageNumber}
                            scale={scale}
                            rotate={rotation}
                            renderTextLayer={true}
                            renderAnnotationLayer={true}
                            className={`rounded-xl overflow-hidden border border-slate-800 bg-white shadow-2xl transition-all duration-300 ease-out ${
                                isDragging ? "pointer-events-none" : ""
                            }`}
                        />
                    </Document>
                )}
            </div>
        </div>
    );
}
