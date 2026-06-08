"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { db, Artwork, User } from '@/lib/db';
import { 
  ArrowLeft, RotateCw, ZoomIn, ZoomOut, Download, Database, 
  Calendar, FileImage, CheckCircle, Grid, ChevronLeft, ChevronRight, 
  Info, X, Search, ArrowUpDown, RefreshCw, Sparkles, AlertCircle
} from 'lucide-react';

interface LocalImage {
  filename: string;
  category: string;
  url: string;
  originalUrl: string;
  compressedSize: number;
  originalSize: number;
  timestamp: string;
  hasOriginal: boolean;
}

interface DBArtworkMap {
  [previewUrl: string]: Artwork;
}

export default function ArtworkReviewDashboard() {
  const [activeUser, setActiveUser] = useState<User | null>(null);
  
  // Loading & Data States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalOriginalSize: 0,
    totalCompressedSize: 0,
    totalSaved: 0,
    savedPercent: 0
  });
  const [allImages, setAllImages] = useState<LocalImage[]>([]);
  const [filteredImages, setFilteredImages] = useState<LocalImage[]>([]);
  
  // Database map to check existing imports
  const [dbArtworks, setDbArtworks] = useState<DBArtworkMap>({});

  // UI Control States
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'tactics' | 'comics' | 'calligraphy' | 'doodles'>('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'size-desc' | 'size-asc' | 'saved-desc'>('date-desc');
  const [gridSize, setGridSize] = useState<'compact' | 'comfortable' | 'large'>('comfortable');

  // Lightbox States
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [scale, setScale] = useState(1); // 1 to 3
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const lightboxImgRef = useRef<HTMLImageElement>(null);

  // DB Registration State
  const [regTitle, setRegTitle] = useState('');
  const [regDesc, setRegDesc] = useState('');
  const [regTags, setRegTags] = useState('');
  const [regVisibility, setRegVisibility] = useState<'public' | 'private'>('private');
  const [regSuccess, setRegSuccess] = useState(false);

  // AI Image Analysis States
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiAnalysisLoading, setAiAnalysisLoading] = useState(false);
  const [aiAnalysisError, setAiAnalysisError] = useState<string | null>(null);

  // Fetch all images and db status
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/images');
      if (!res.ok) {
        throw new Error(`API error: ${res.statusText}`);
      }
      const data = await res.json();
      
      setStats(data.stats);
      
      // Flatten categories to single list
      const flattened: LocalImage[] = [];
      Object.keys(data.categories).forEach((cat) => {
        flattened.push(...data.categories[cat]);
      });
      setAllImages(flattened);
      
      // Load current database items for mapping
      updateDbMap();
    } catch (e: any) {
      setError(e.message || 'Failed to load local images.');
    } finally {
      setLoading(false);
    }
  };

  const updateDbMap = () => {
    const artworks = db.getArtworks();
    const mapping: DBArtworkMap = {};
    artworks.forEach((art) => {
      if (art.drive_preview_url) {
        mapping[art.drive_preview_url] = art;
      }
    });
    setDbArtworks(mapping);
  };

  useEffect(() => {
    setActiveUser(db.getActiveUser());
    fetchData();

    const handleStorageChange = () => {
      setActiveUser(db.getActiveUser());
      updateDbMap();
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Filter and Sort Images
  useEffect(() => {
    let result = [...allImages];

    // Category Tab Filter
    if (activeTab !== 'all') {
      result = result.filter(img => img.category === activeTab);
    }

    // Search Query
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(img => 
        img.filename.toLowerCase().includes(q)
      );
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'date-desc') {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      }
      if (sortBy === 'date-asc') {
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      }
      if (sortBy === 'size-desc') {
        return b.compressedSize - a.compressedSize;
      }
      if (sortBy === 'size-asc') {
        return a.compressedSize - b.compressedSize;
      }
      if (sortBy === 'saved-desc') {
        const savingsA = a.originalSize - a.compressedSize;
        const savingsB = b.originalSize - b.compressedSize;
        return savingsB - savingsA;
      }
      return 0;
    });

    setFilteredImages(result);
  }, [allImages, activeTab, search, sortBy]);

  // Lightbox Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedImageIndex === null) return;
      if (e.key === 'ArrowRight') {
        handleNextImage();
      } else if (e.key === 'ArrowLeft') {
        handlePrevImage();
      } else if (e.key === 'Escape') {
        closeLightbox();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImageIndex, filteredImages]);

  // Set default form values when selected image changes
  useEffect(() => {
    if (selectedImageIndex !== null && filteredImages[selectedImageIndex]) {
      const img = filteredImages[selectedImageIndex];
      const isImported = dbArtworks[img.url];
      
      if (!isImported) {
        // Prepopulate registration fields
        const dateStr = new Date(img.timestamp).toLocaleDateString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
        
        let typeName = '手绘';
        if (img.category === 'tactics') typeName = '篮球战术图纸';
        else if (img.category === 'comics') typeName = '连载漫画草稿';
        else if (img.category === 'calligraphy') typeName = '书法与默写';

        setRegTitle(`${typeName} (${dateStr})`);
        
        let desc = '';
        if (img.category === 'tactics') {
          desc = `这是我在 ${dateStr} 绘制的篮球战术与图纸。记录了攻防转换和战术跑位跑动路线。`;
        } else if (img.category === 'comics') {
          desc = `《胡蝶F》系列漫画的草稿页。记录了角色的动作分镜与战斗过程。`;
        } else if (img.category === 'calligraphy') {
          desc = `中国古典文学默写训练，包含《出师表》等内容，旨在积累国学素养并练习钢笔书法。`;
        } else {
          desc = `日常创意涂鸦。`;
        }
        setRegDesc(desc);
        
        let tags = '';
        if (img.category === 'tactics') tags = '战术, 篮球, 设定';
        else if (img.category === 'comics') tags = '漫画, 分镜, 胡蝶F, 连载';
        else if (img.category === 'calligraphy') tags = '书法, 默写, 国学';
        else tags = '涂鸦, 创意';
        
        setRegTags(tags);
        setRegVisibility('private');
        setRegSuccess(false);
      }
    }
  }, [selectedImageIndex, dbArtworks]);

  // Reset image transforms and AI analysis states on navigation
  const resetTransforms = () => {
    setRotation(0);
    setScale(1);
    setNaturalSize(null);
  };

  const resetImageState = () => {
    resetTransforms();
    setAiAnalysis(null);
    setAiAnalysisLoading(false);
    setAiAnalysisError(null);
  };

  const handleNextImage = () => {
    if (selectedImageIndex === null) return;
    const nextIdx = (selectedImageIndex + 1) % filteredImages.length;
    setSelectedImageIndex(nextIdx);
    resetImageState();
  };

  const handlePrevImage = () => {
    if (selectedImageIndex === null) return;
    const prevIdx = (selectedImageIndex - 1 + filteredImages.length) % filteredImages.length;
    setSelectedImageIndex(prevIdx);
    resetImageState();
  };

  const closeLightbox = () => {
    setSelectedImageIndex(null);
    resetImageState();
  };

  const handleImageLoad = () => {
    if (lightboxImgRef.current) {
      setNaturalSize({
        width: lightboxImgRef.current.naturalWidth,
        height: lightboxImgRef.current.naturalHeight
      });
    }
  };

  // Import into DB
  const handleImportArtwork = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedImageIndex === null) return;
    const img = filteredImages[selectedImageIndex];
    
    // Map categories to DB types
    let typeVal: Artwork['type'] = 'hand-drawn';
    if (img.category === 'tactics') typeVal = 'wargame';
    else if (img.category === 'comics') typeVal = 'comic';
    else if (img.category === 'calligraphy') typeVal = 'hand-drawn';
    else typeVal = 'hand-drawn';

    const tagsArr = regTags.split(/[,，\s]+/).filter(t => t.trim() !== '');

    db.createArtwork({
      title: regTitle,
      description: regDesc,
      type: typeVal,
      tags: tagsArr,
      visibility: regVisibility,
      drive_file_id: `drive_${img.category}_${Date.now().toString().substr(-6)}`,
      drive_preview_url: img.url,
      drive_folder: img.category === 'tactics' ? 'Strategy-Lab' : img.category === 'comics' ? 'Comics' : 'Artworks'
    });

    setRegSuccess(true);
    // Refresh mapping
    updateDbMap();
    // Dispatch storage event to alert other tabs/components
    window.dispatchEvent(new Event('storage'));
  };

  const handleAnalyzeImage = async () => {
    if (selectedImageIndex === null) return;
    const img = filteredImages[selectedImageIndex];
    setAiAnalysisLoading(true);
    setAiAnalysisError(null);
    setAiAnalysis(null);
    try {
      const res = await fetch('/api/images/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: img.category,
          filename: img.filename,
        }),
      });
      if (!res.ok) {
        throw new Error(`分析失败: ${res.statusText}`);
      }
      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setAiAnalysis(data.feedback);
    } catch (e: any) {
      setAiAnalysisError(e.message || '获取 AI 分析时出错。');
    } finally {
      setAiAnalysisLoading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  const currentImage = selectedImageIndex !== null ? filteredImages[selectedImageIndex] : null;
  const isImported = currentImage ? dbArtworks[currentImage.url] : null;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link 
              href="/artworks"
              className="rounded-lg border border-book-border bg-paper/60 p-1.5 text-ink/75 hover:bg-paper transition-all"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="font-literary text-3xl font-bold tracking-tight text-ink">本地图像审阅馆</h1>
          </div>
          <p className="text-xs text-ink/50 mt-1 ml-9">对压密、整理好的小画家扫描作画进行直接预览、细节缩放、翻转与一件导入归档。</p>
        </div>

        {/* Sync Indicator */}
        <button 
          onClick={fetchData}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-ink text-parchment px-4 py-2.5 text-xs font-semibold shadow-md transition-all hover:bg-ink/90 active:scale-[0.98]"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>重新扫描目录</span>
        </button>
      </div>

      {/* Statistics Cards */}
      {!loading && !error && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="museum-card p-4.5 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-ink/40 uppercase tracking-wider">总作品数</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold font-display text-ink">{allImages.length}</span>
              <span className="text-xs text-ink/50">张图纸</span>
            </div>
            <p className="text-[10px] text-ink/40 mt-1">已在 tactics, comics, calligraphy, doodles 归档中</p>
          </div>

          <div className="museum-card p-4.5 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-ink/40 uppercase tracking-wider">原片体积总计</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold font-display text-ink">{formatSize(stats.totalOriginalSize)}</span>
            </div>
            <p className="text-[10px] text-ink/40 mt-1">扫描原图（平均约 4.6 MB/张）</p>
          </div>

          <div className="museum-card p-4.5 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-ink/40 uppercase tracking-wider">压缩后总体积</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold font-display text-terracotta">{formatSize(stats.totalCompressedSize)}</span>
            </div>
            <p className="text-[10px] text-ink/40 mt-1">1200px 尺寸，75% Quality JPEG 编码</p>
          </div>

          <div className="museum-card p-4.5 flex flex-col justify-between bg-terracotta/5 border-terracotta/20">
            <span className="text-[10px] font-bold text-terracotta/60 uppercase tracking-wider">空间节省比例</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold font-display text-terracotta">{stats.savedPercent}%</span>
              <span className="text-xs font-semibold text-terracotta">已节省</span>
            </div>
            <p className="text-[10px] text-ink/50 mt-1">减少了 {formatSize(stats.totalSaved)} 的本地磁盘占用</p>
          </div>
        </div>
      )}

      {/* Filters & Grid Settings */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-book-border/50 pb-4">
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-1">
          {(['all', 'tactics', 'comics', 'calligraphy', 'doodles'] as const).map((tab) => {
            const label = tab === 'all' ? '全部' :
                          tab === 'tactics' ? '篮球战术 (Tactics)' :
                          tab === 'comics' ? '连载漫画 (Comics)' :
                          tab === 'calligraphy' ? '书法默写 (Calligraphy)' : '涂鸦 (Doodles)';
            
            const count = tab === 'all' 
              ? allImages.length 
              : allImages.filter(img => img.category === tab).length;

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  activeTab === tab
                    ? 'bg-ink text-parchment shadow-sm'
                    : 'text-ink/65 hover:bg-paper/80'
                }`}
              >
                {label} <span className="opacity-50 ml-1">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Search, Sort, Grid controls */}
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative max-w-xs w-full sm:w-48">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-ink/40" />
            <input
              type="text"
              placeholder="搜索文件名..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-book-border bg-paper/40 pl-8.5 pr-3 py-1.5 text-xs font-medium text-ink focus:bg-paper focus:outline-none focus:ring-1 focus:ring-terracotta/50"
            />
          </div>

          {/* Sort dropdown */}
          <div className="relative flex items-center">
            <ArrowUpDown className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-ink/40 pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-lg border border-book-border bg-paper/40 pl-8.5 pr-8 py-1.5 text-xs font-semibold text-ink appearance-none focus:bg-paper focus:outline-none focus:ring-1 focus:ring-terracotta/50"
            >
              <option value="date-desc">时间从新到旧</option>
              <option value="date-asc">时间从旧到新</option>
              <option value="size-desc">大小从大到小</option>
              <option value="size-asc">大小从小到大</option>
              <option value="saved-desc">节省空间最多</option>
            </select>
          </div>

          {/* Grid Sizer */}
          <div className="flex rounded-lg border border-book-border bg-paper/40 p-0.5">
            {(['compact', 'comfortable', 'large'] as const).map((size) => (
              <button
                key={size}
                onClick={() => setGridSize(size)}
                title={`Grid size: ${size}`}
                className={`rounded-md p-1.5 transition-all ${
                  gridSize === size
                    ? 'bg-paper text-terracotta shadow-xs border border-book-border/40'
                    : 'text-ink/50 hover:text-ink'
                }`}
              >
                <Grid className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid View */}
      {loading ? (
        <div className="text-center py-24 text-ink/50 font-serif">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-terracotta mb-4" />
          正在扫描本地归档目录...
        </div>
      ) : error ? (
        <div className="museum-card p-12 text-center text-red-600 border-red-100 flex flex-col items-center justify-center">
          <AlertCircle className="h-10 w-10 text-red-500 mb-3" />
          <h3 className="text-sm font-bold">加载失败</h3>
          <p className="text-xs text-red-500 mt-1 max-w-sm">{error}</p>
        </div>
      ) : filteredImages.length > 0 ? (
        <div className={`grid gap-4 ${
          gridSize === 'compact' 
            ? 'grid-cols-2 sm:grid-cols-4 md:grid-cols-6' 
            : gridSize === 'comfortable'
              ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'
              : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
        }`}>
          {filteredImages.map((img, index) => {
            const isRegistered = dbArtworks[img.url];
            const originalSavedSize = img.originalSize - img.compressedSize;
            const savedPct = img.originalSize > 0 ? ((originalSavedSize / img.originalSize) * 100).toFixed(0) : '0';
            
            return (
              <div 
                key={img.filename}
                onClick={() => setSelectedImageIndex(index)}
                className="museum-card overflow-hidden flex flex-col justify-between group cursor-pointer border-book-border/40"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-paper/30 flex items-center justify-center border-b border-book-border/30">
                  <img
                    src={img.url}
                    alt={img.filename}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Category overlay */}
                  <span className="absolute left-2 top-2 rounded bg-ink/75 backdrop-blur-xs px-2 py-0.5 text-[8.5px] font-bold text-parchment uppercase tracking-wider">
                    {img.category}
                  </span>
                  
                  {/* Database Badge status */}
                  {isRegistered ? (
                    <span className="absolute right-2 top-2 rounded-full bg-sage/90 backdrop-blur-xs px-2 py-0.5 text-[8.5px] font-bold text-parchment flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      <span>已入馆</span>
                    </span>
                  ) : (
                    <span className="absolute right-2 top-2 rounded-full bg-gold/90 backdrop-blur-xs px-2 py-0.5 text-[8.5px] font-bold text-ink flex items-center gap-1 group-hover:bg-terracotta group-hover:text-parchment transition-colors">
                      <span>待归档</span>
                    </span>
                  )}
                </div>

                {/* Footer details */}
                <div className="p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-ink/40 font-semibold truncate max-w-[130px]" title={img.filename}>
                      {img.filename}
                    </span>
                    <span className="text-[9px] font-bold text-terracotta">
                      -{savedPct}%
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-[9px] text-ink/50">
                    <span>{new Date(img.timestamp).toLocaleDateString('zh-CN')}</span>
                    <span className="font-semibold">{formatSize(img.compressedSize)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-book-border/70 p-16 text-center text-ink/40">
          <FileImage className="h-10 w-10 text-ink/20 mb-3" />
          <h3 className="text-sm font-bold text-ink/70">没有找到匹配的图像</h3>
          <p className="text-xs text-ink/40 max-w-xs mt-1">
            您可以尝试更改顶部的分类页签或清除搜索词。
          </p>
        </div>
      )}

      {/* Lightbox / Modal Viewer */}
      {selectedImageIndex !== null && currentImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in duration-200">
          
          {/* Main Visual Workspace Area */}
          <div className="relative flex flex-col lg:flex-row h-full w-full overflow-hidden">
            
            {/* Left/Middle: Image viewer Container */}
            <div className="relative flex-1 flex flex-col justify-between items-center p-4 h-[60vh] lg:h-full">
              
              {/* Top Bar inside Viewer */}
              <div className="w-full flex items-center justify-between text-parchment/60 z-10 px-4">
                <div className="flex items-center gap-3 text-xs">
                  <span className="rounded bg-white/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-parchment">
                    {currentImage.category}
                  </span>
                  <span className="font-mono text-[11px] truncate max-w-[200px]" title={currentImage.filename}>
                    {currentImage.filename}
                  </span>
                </div>

                {/* Control bar buttons */}
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setRotation((r) => (r + 90) % 360)}
                    title="顺时针旋转 90°"
                    className="p-2.5 rounded-lg bg-white/5 hover:bg-white/15 text-parchment transition-all active:scale-95"
                  >
                    <RotateCw className="h-4.5 w-4.5" />
                  </button>
                  <button 
                    onClick={() => setScale((s) => Math.min(s + 0.2, 3.0))}
                    title="放大"
                    className="p-2.5 rounded-lg bg-white/5 hover:bg-white/15 text-parchment transition-all active:scale-95"
                  >
                    <ZoomIn className="h-4.5 w-4.5" />
                  </button>
                  <button 
                    onClick={() => setScale((s) => Math.max(s - 0.2, 1.0))}
                    title="缩小"
                    className="p-2.5 rounded-lg bg-white/5 hover:bg-white/15 text-parchment transition-all active:scale-95"
                  >
                    <ZoomOut className="h-4.5 w-4.5" />
                  </button>
                  {(scale > 1 || rotation !== 0) && (
                    <button 
                      onClick={resetTransforms}
                      className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-parchment"
                    >
                      重置视图
                    </button>
                  )}
                </div>
              </div>

              {/* Middle: Lightbox Image Frame with dynamic rotation & scale */}
              <div className="relative flex-1 w-full flex items-center justify-center overflow-hidden">
                <div 
                  className="transition-transform duration-300 ease-out"
                  style={{ 
                    transform: `rotate(${rotation}deg) scale(${scale})`,
                    cursor: scale > 1 ? 'grab' : 'default'
                  }}
                >
                  <img
                    ref={lightboxImgRef}
                    src={currentImage.url}
                    alt={currentImage.filename}
                    onLoad={handleImageLoad}
                    className="max-h-[50vh] lg:max-h-[80vh] max-w-[85vw] lg:max-w-[55vw] object-contain shadow-2xl rounded-sm border border-white/5"
                  />
                </div>

                {/* Arrow Navigation buttons */}
                <button
                  onClick={handlePrevImage}
                  className="absolute left-4 p-3 rounded-full bg-white/5 hover:bg-white/15 text-white transition-all active:scale-95"
                  title="上一张 (ArrowLeft)"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                
                <button
                  onClick={handleNextImage}
                  className="absolute right-4 p-3 rounded-full bg-white/5 hover:bg-white/15 text-white transition-all active:scale-95"
                  title="下一张 (ArrowRight)"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </div>

              {/* Bottom bar of image display */}
              <div className="text-[10px] text-white/40 font-mono tracking-wider">
                {selectedImageIndex + 1} / {filteredImages.length} • 按左右方向键浏览，Esc 退出
              </div>
            </div>

            {/* Right: Sidebar details and import form (Full Height) */}
            <div className="w-full lg:w-96 bg-parchment border-t lg:border-t-0 lg:border-l border-book-border p-5 flex flex-col justify-between h-[40vh] lg:h-full overflow-y-auto">
              
              <div className="space-y-5">
                {/* Header title */}
                <div className="flex items-center justify-between border-b border-book-border/40 pb-3">
                  <div>
                    <h3 className="font-literary text-lg font-bold text-ink">画作详细信息</h3>
                    <p className="text-[10px] text-ink/50 mt-0.5">扫描时间: {new Date(currentImage.timestamp).toLocaleString('zh-CN')}</p>
                  </div>
                  
                  {/* Close button */}
                  <button 
                    onClick={closeLightbox}
                    className="rounded-lg border border-book-border bg-paper p-1.5 text-ink/75 hover:bg-paper/50 hover:text-ink transition-all"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Metadata Table */}
                <div className="rounded-xl border border-book-border/50 bg-paper/40 p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-y-2 text-xs font-medium">
                    <span className="text-ink/40">文件名:</span>
                    <span className="text-ink truncate text-right font-mono" title={currentImage.filename}>{currentImage.filename}</span>
                    
                    <span className="text-ink/40">类别分类:</span>
                    <span className="text-ink text-right font-bold uppercase">{currentImage.category}</span>
                    
                    {naturalSize && (
                      <>
                        <span className="text-ink/40">图片分辨率:</span>
                        <span className="text-ink text-right font-mono">{naturalSize.width} × {naturalSize.height} px</span>
                      </>
                    )}

                    <span className="text-ink/40">扫描原图体积:</span>
                    <span className="text-ink text-right font-mono">{formatSize(currentImage.originalSize)}</span>

                    <span className="text-ink/40">压缩后体积:</span>
                    <span className="text-ink text-right font-mono font-bold text-terracotta">{formatSize(currentImage.compressedSize)}</span>

                    <span className="text-ink/40">存储节省率:</span>
                    <span className="text-terracotta text-right font-bold">
                      -{(100 - (currentImage.compressedSize / currentImage.originalSize) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* AI Analysis Section */}
                <div className="border-t border-book-border/30 pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-ink/70">
                      <Sparkles className="h-4 w-4 text-gold" />
                      <span>AI 智能艺术点评</span>
                    </div>
                    {aiAnalysis && (
                      <button 
                        onClick={handleAnalyzeImage}
                        disabled={aiAnalysisLoading}
                        className="text-[10px] font-bold text-terracotta hover:underline flex items-center gap-1"
                      >
                        <RefreshCw className={`h-2.5 w-2.5 ${aiAnalysisLoading ? 'animate-spin' : ''}`} />
                        <span>重新分析</span>
                      </button>
                    )}
                  </div>

                  {aiAnalysisLoading ? (
                    <div className="rounded-xl border border-book-border/50 bg-paper/20 p-4 text-center space-y-2">
                      <RefreshCw className="h-5 w-5 animate-spin mx-auto text-terracotta" />
                      <p className="text-[10px] text-ink/50 font-serif">正在读取本地画作图像特征，并请求 DeepSeek 进行专业艺术点评...</p>
                    </div>
                  ) : aiAnalysisError ? (
                    <div className="rounded-xl border border-red-100 bg-red-50/20 p-4 text-center space-y-1 text-red-600">
                      <AlertCircle className="h-5 w-5 mx-auto text-red-500" />
                      <p className="text-[10px] font-bold">分析失败</p>
                      <p className="text-[9px] text-red-500">{aiAnalysisError}</p>
                      <button 
                        onClick={handleAnalyzeImage}
                        className="mt-1 text-[10px] font-bold text-terracotta underline"
                      >
                        重试
                      </button>
                    </div>
                  ) : aiAnalysis ? (
                    <div className="rounded-xl border border-book-border bg-paper/40 p-4 max-h-[300px] overflow-y-auto scrollbar-thin text-xs text-ink/90 font-serif leading-relaxed animate-in fade-in duration-200">
                      <article className="prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {aiAnalysis}
                        </ReactMarkdown>
                      </article>
                    </div>
                  ) : (
                    <button
                      onClick={handleAnalyzeImage}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-book-border bg-paper/80 py-2.5 text-xs font-semibold text-ink hover:bg-paper transition-all active:scale-[0.98]"
                    >
                      <Sparkles className="h-4 w-4 text-gold" />
                      <span>获取 AI 艺术改良建议</span>
                    </button>
                  )}
                </div>

                {/* DB Import Section */}
                <div className="border-t border-book-border/30 pt-4 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-ink/70">
                    <Database className="h-4 w-4 text-terracotta" />
                    <span>入库状态与共创归档</span>
                  </div>

                  {isImported ? (
                    // Already imported
                    <div className="rounded-xl bg-sage/5 border border-sage/20 p-4 space-y-3">
                      <div className="flex items-center gap-2 text-sage text-xs font-bold">
                        <CheckCircle className="h-4.5 w-4.5" />
                        <span>已安全归档至创作馆</span>
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="font-bold text-ink line-clamp-1">{isImported.title}</div>
                        <p className="text-ink/60 line-clamp-2 leading-relaxed text-[11px] font-serif">{isImported.description}</p>
                      </div>
                      <Link 
                        href={`/artworks/${isImported.id}`}
                        onClick={closeLightbox}
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-ink text-parchment py-2 text-xs font-semibold hover:bg-ink/90 transition-all"
                      >
                        <span>进入作品详情页 (共创对话)</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  ) : regSuccess ? (
                    // Successfully imported just now
                    <div className="rounded-xl bg-sage/5 border border-sage/20 p-4 space-y-2.5 animate-in scale-in duration-200">
                      <div className="flex items-center gap-2 text-sage text-xs font-bold">
                        <CheckCircle className="h-4.5 w-4.5" />
                        <span>导入成功！</span>
                      </div>
                      <p className="text-[11px] text-ink/70">该作品已成功加入本地数据库，并记录至“手绘图纸”分类下。</p>
                      <button 
                        onClick={() => {
                          setRegSuccess(false);
                          updateDbMap();
                        }}
                        className="text-xs font-bold text-terracotta hover:underline"
                      >
                        继续编辑或再次导入
                      </button>
                    </div>
                  ) : (
                    // Not imported: show form
                    <form onSubmit={handleImportArtwork} className="space-y-3">
                      <p className="text-[10px] text-ink/40 leading-relaxed font-serif">
                        该图纸尚未录入系统的创作馆。将其导入后，爸爸和渊裕可以展开私密共创对话、添加故事或关联角色设定。
                      </p>

                      <div className="space-y-2.5 text-xs">
                        {/* Reg Title */}
                        <div>
                          <label className="block text-[10px] font-bold text-ink/50 uppercase tracking-wider mb-1">作品标题</label>
                          <input 
                            type="text"
                            required
                            value={regTitle}
                            onChange={(e) => setRegTitle(e.target.value)}
                            className="w-full rounded-lg border border-book-border bg-paper/40 px-3 py-1.5 text-xs font-medium text-ink focus:outline-none focus:ring-1 focus:ring-terracotta/50"
                          />
                        </div>

                        {/* Reg Desc */}
                        <div>
                          <label className="block text-[10px] font-bold text-ink/50 uppercase tracking-wider mb-1">作品设定大纲 / 简介</label>
                          <textarea 
                            rows={3}
                            value={regDesc}
                            onChange={(e) => setRegDesc(e.target.value)}
                            className="w-full rounded-lg border border-book-border bg-paper/40 px-3 py-1.5 text-xs font-medium text-ink focus:outline-none focus:ring-1 focus:ring-terracotta/50 font-serif"
                          />
                        </div>

                        {/* Reg Tags */}
                        <div>
                          <label className="block text-[10px] font-bold text-ink/50 uppercase tracking-wider mb-1">作品标签 (逗号分隔)</label>
                          <input 
                            type="text"
                            value={regTags}
                            onChange={(e) => setRegTags(e.target.value)}
                            className="w-full rounded-lg border border-book-border bg-paper/40 px-3 py-1.5 text-xs font-medium text-ink focus:outline-none focus:ring-1 focus:ring-terracotta/50"
                          />
                        </div>

                        {/* Privacy Selection */}
                        <div>
                          <label className="block text-[10px] font-bold text-ink/50 uppercase tracking-wider mb-1">可见范围</label>
                          <select 
                            value={regVisibility}
                            onChange={(e) => setRegVisibility(e.target.value as any)}
                            className="w-full rounded-lg border border-book-border bg-paper/40 px-3 py-1.5 text-xs font-medium text-ink focus:outline-none"
                          >
                            <option value="private">私密 (仅限父子可见)</option>
                            <option value="public">公开 (所有人可见)</option>
                          </select>
                        </div>
                      </div>

                      {/* Submit */}
                      {activeUser?.role !== 'Guest' ? (
                        <button
                          type="submit"
                          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-terracotta px-4.5 py-2.5 text-xs font-semibold text-parchment shadow-md hover:bg-terracotta/90 active:scale-[0.98] transition-all"
                        >
                          <Database className="h-4 w-4" />
                          <span>一键导入创作馆</span>
                        </button>
                      ) : (
                        <div className="text-center text-[10px] text-ink/40 bg-paper/60 p-2.5 rounded-lg border border-dashed border-book-border">
                          访客只读模式无法录入新作品。
                        </div>
                      )}
                    </form>
                  )}
                </div>
              </div>

              {/* Download buttons footer */}
              <div className="border-t border-book-border/40 pt-4 mt-4 grid grid-cols-2 gap-2">
                <a 
                  href={currentImage.url}
                  download={currentImage.filename}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-book-border bg-paper py-2 text-xs font-semibold text-ink hover:bg-paper/50 transition-all text-center"
                >
                  <Download className="h-3.5 w-3.5 text-ink/50" />
                  <span>下载压缩图</span>
                </a>
                
                <a 
                  href={currentImage.originalUrl}
                  download={currentImage.filename}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-book-border bg-paper py-2 text-xs font-semibold text-ink hover:bg-paper/50 transition-all text-center"
                >
                  <Download className="h-3.5 w-3.5 text-terracotta" />
                  <span>下载原片</span>
                </a>
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
