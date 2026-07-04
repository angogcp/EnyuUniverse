"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { db, Artwork, User } from '@/lib/db';
import { gdrive } from '@/lib/gdrive';
import { 
  Plus, Search, ShieldAlert, Eye, 
  EyeOff, Heart, MessageCircle, FileText, Image as ImageIcon, Trash2
} from 'lucide-react';

export default function ArtworksPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-ink/50 font-serif">目录加载中...</div>}>
      <ArtworksList />
    </Suspense>
  );
}

function ArtworksList() {
  const searchParams = useSearchParams();
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [filteredArtworks, setFilteredArtworks] = useState<Artwork[]>([]);
  
  // Search and tabs
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'hand-drawn' | 'comic' | 'novel' | 'lab'>('all');

  // New artwork form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState<Artwork['type']>('hand-drawn');
  const [newTags, setNewTags] = useState('');
  const [newVisibility, setNewVisibility] = useState<'public' | 'private'>('private');
  
  // File upload state for drawings
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    setActiveUser(db.getActiveUser());
    
    // Check if open modal is requested via URL query params
    if (searchParams.get('create') === 'true') {
      setShowAddModal(true);
    }

    const loadData = () => {
      const allArt = db.getArtworks();
      const user = db.getActiveUser();
      
      // Role permission: Guests can only see public works
      if (user.role === 'Guest') {
        setArtworks(allArt.filter(art => art.visibility === 'public'));
      } else {
        setArtworks(allArt);
      }
    };

    loadData();

    const handleStorageChange = () => {
      setActiveUser(db.getActiveUser());
      loadData();
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [searchParams]);

  // Handle filtering
  useEffect(() => {
    let result = artworks;

    // Filter by search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(art => 
        art.title.toLowerCase().includes(q) || 
        art.description.toLowerCase().includes(q) ||
        art.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    // Filter by tab
    if (activeTab !== 'all') {
      if (activeTab === 'lab') {
        // Labs include wargame, sci-fi, mystery, etc.
        result = result.filter(art => ['wargame', 'sci-fi', 'mystery', 'worldview'].includes(art.type));
      } else {
        result = result.filter(art => art.type === activeTab);
      }
    }

    // Sort by newest first
    result = [...result].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    setFilteredArtworks(result);
  }, [artworks, search, activeTab]);

  // Handle mock image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit new artwork
  const handleCreateArtwork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    let driveFileId = undefined;
    let drivePreviewUrl = undefined;
    let driveWebLink = undefined;

    // Handle image file or generate mock representation
    if (newType === 'hand-drawn' || newType === 'comic') {
      const fileData = uploadFile 
        ? { name: uploadFile.name, type: uploadFile.type, contentBase64: imagePreview || undefined }
        : { name: `${newTitle}.png`, type: 'image/png' };
      
      // Upload to Google Drive (mocked)
      const driveFolder = newType === 'hand-drawn' ? 'Artworks' : 'Comics';
      const uploaded = await gdrive.uploadFile(fileData, driveFolder);
      driveFileId = uploaded.drive_file_id;
      drivePreviewUrl = uploaded.drive_preview_url;
      driveWebLink = uploaded.drive_web_link;
    } else {
      // Markdown-based settings document
      const fileData = { name: `${newTitle}.md`, type: 'text/markdown', contentBase64: newDesc };
      const driveFolder = newType === 'novel' ? 'Stories' : 'Worldbuilding';
      const uploaded = await gdrive.uploadFile(fileData, driveFolder);
      driveFileId = uploaded.drive_file_id;
      drivePreviewUrl = uploaded.drive_preview_url;
      driveWebLink = uploaded.drive_web_link;
    }

    // Parse tags
    const tagsArr = newTags.split(/[,，\s]+/).filter(t => t.trim() !== '');

    db.createArtwork({
      title: newTitle,
      description: newDesc,
      type: newType,
      tags: tagsArr,
      visibility: newVisibility,
      drive_file_id: driveFileId,
      drive_preview_url: drivePreviewUrl,
      drive_folder: newType === 'hand-drawn' ? 'Artworks' : newType === 'comic' ? 'Comics' : newType === 'novel' ? 'Stories' : 'Worldbuilding',
    });

    // Reset Form
    setNewTitle('');
    setNewDesc('');
    setNewTags('');
    setNewType('hand-drawn');
    setNewVisibility('private');
    setUploadFile(null);
    setImagePreview(null);
    setShowAddModal(false);

  };

  const canModify = activeUser?.role === 'Child' || activeUser?.role === 'Father';

  const handleToggleVisibility = (id: string, currentVis: Artwork['visibility'], e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newVis = currentVis === 'public' ? 'private' : 'public';
    db.updateArtwork(id, { visibility: newVis });
    
    // Reload artworks list
    const allArt = db.getArtworks();
    const user = db.getActiveUser();
    if (user.role === 'Guest') {
      setArtworks(allArt.filter(art => art.visibility === 'public'));
    } else {
      setArtworks(allArt);
    }
    
    window.dispatchEvent(new Event('storage')); // Notify other components
  };

  const handleDeleteArtwork = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('确定要删除这件作品吗？此操作不可逆，将同时清除相关的留言记录。')) {
      db.deleteArtwork(id);
      
      // Reload artworks list
      const allArt = db.getArtworks();
      const user = db.getActiveUser();
      if (user.role === 'Guest') {
        setArtworks(allArt.filter(art => art.visibility === 'public'));
      } else {
        setArtworks(allArt);
      }
      
      window.dispatchEvent(new Event('storage')); // Notify other components
    }
  };

  if (!activeUser) return null;

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-literary text-3xl font-bold tracking-tight text-ink">创作馆</h1>
          <p className="text-xs text-ink/50 mt-1">保存和探索孩子所有的创意作品与背景设定。</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Review Local Images Button */}
          <Link
            href="/artworks/review"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-book-border bg-paper/60 px-4.5 py-2.5 text-sm font-semibold text-ink shadow-sm transition-all hover:bg-paper"
          >
            <ImageIcon className="h-4.5 w-4.5 text-terracotta" />
            <span>审阅本地扫描件</span>
          </Link>

          {/* Upload Button: Guests cannot upload */}
          {activeUser.role !== 'Guest' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-terracotta px-4.5 py-2.5 text-sm font-semibold text-parchment shadow-md transition-all hover:bg-terracotta/90 hover:scale-[1.01]"
            >
              <Plus className="h-4.5 w-4.5" />
              <span>新建创作 / 设定</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs and Search */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-book-border/50 pb-4">
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-1">
          {(['all', 'hand-drawn', 'comic', 'novel', 'lab'] as const).map((tab) => {
            const label = tab === 'all' ? '全部作品' :
                          tab === 'hand-drawn' ? '手绘图纸' :
                          tab === 'comic' ? '漫画连载' :
                          tab === 'novel' ? '小说故事' : '实验室设定';
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
                {label}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink/40" />
          <input
            type="text"
            placeholder="搜索作品、标签或简介..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-book-border bg-paper/40 pl-9 pr-4 py-2 text-xs font-medium text-ink placeholder:text-ink/30 focus:bg-paper focus:outline-none focus:ring-1 focus:ring-terracotta/50"
          />
        </div>
      </div>

      {/* Artwork Grid */}
      {filteredArtworks.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredArtworks.map((art) => {
            // Check message count
            const conversationsCount = db.getConversations(art.id).length;
            
            return (
              <Link
                key={art.id}
                href={`/artworks/${art.id}`}
                className="museum-card group flex flex-col justify-between overflow-hidden p-0"
              >
                <div className="p-4 space-y-3">
                  {/* Thumbnail / Image Preview */}
                  {art.drive_preview_url ? (
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-book-border/40 bg-paper">
                      <img
                        src={art.drive_preview_url}
                        alt={art.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-video w-full flex-col items-center justify-center rounded-lg border border-dashed border-book-border bg-paper/30 text-ink/30">
                      <FileText className="h-8 w-8 text-ink/20 mb-2" />
                      <span className="text-[10px] uppercase font-bold tracking-wider">设定文档 (Markdown)</span>
                    </div>
                  )}

                  {/* Header info */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="rounded bg-paper border border-book-border/40 px-2 py-0.5 text-[8.5px] font-bold text-ink/65 uppercase tracking-wider">
                        {art.type === 'hand-drawn' ? '手绘图' :
                         art.type === 'comic' ? '漫画' :
                         art.type === 'novel' ? '小说故事' : '实验室'}
                      </span>
                      
                      {/* Visibility indicator */}
                      {canModify ? (
                        <button
                          onClick={(e) => handleToggleVisibility(art.id, art.visibility, e)}
                          className="flex items-center gap-1 text-[9px] font-semibold text-ink/50 hover:text-terracotta hover:bg-paper px-1.5 py-0.5 rounded transition-all border border-book-border/20 hover:border-book-border bg-paper/20 shrink-0"
                          title="点击切换公开/私密"
                        >
                          {art.visibility === 'public' ? (
                            <>
                              <Eye className="h-3 w-3 text-sage" />
                              <span>公开</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-3 w-3 text-ink/40" />
                              <span>私密</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="flex items-center gap-1 text-[9px] font-semibold text-ink/40 shrink-0">
                          {art.visibility === 'public' ? (
                            <>
                              <Eye className="h-3 w-3 text-sage" />
                              <span>公开</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-3 w-3" />
                              <span>私密</span>
                            </>
                          )}
                        </span>
                      )}
                    </div>

                    <h3 className="font-literary text-base font-bold text-ink group-hover:text-terracotta transition-colors line-clamp-1">
                      {art.title}
                    </h3>
                  </div>

                  {/* Description snippet */}
                  {art.description && (
                    <p className="text-xs text-ink/70 line-clamp-2 leading-relaxed font-serif">
                      {art.description.replace(/[#*`]/g, '')}
                    </p>
                  )}
                </div>

                {/* Footer details */}
                <div className="flex items-center justify-between border-t border-book-border/40 px-4 py-3 bg-paper/30">
                  <span className="text-[10px] text-ink/40 font-semibold">
                    {new Date(art.created_at).toLocaleDateString('zh-CN')}
                  </span>
                  
                  <div className="flex items-center gap-3 text-ink/50 text-[10px]">
                    {canModify && (
                      <button
                        onClick={(e) => handleDeleteArtwork(art.id, e)}
                        className="flex items-center gap-1 text-ink/30 hover:text-terracotta hover:bg-paper/85 transition-colors p-1.5 rounded"
                        title="删除此作品"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span>{conversationsCount}</span>
                    </span>
                    <span className="text-ink/20">|</span>
                    <span className="font-semibold text-[9px] uppercase tracking-wider text-ink/60">
                      查看详情 →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-book-border/70 p-12 text-center text-ink/40">
          <ShieldAlert className="h-10 w-10 text-ink/20 mb-3" />
          <h3 className="text-sm font-bold text-ink/70">没有找到匹配的作品</h3>
          <p className="text-xs text-ink/40 max-w-xs mt-1">
            你可以重新筛选，或者点击右上角新建一个成长画作或世界观设定。
          </p>
        </div>
      )}

      {/* New Artwork Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-book-border bg-parchment p-6 shadow-2xl animate-in scale-in duration-200">
            <h2 className="font-literary text-xl font-bold text-ink mb-4">创建新作品 / 设定</h2>
            
            <form onSubmit={handleCreateArtwork} className="space-y-4">
              {/* Type Switcher */}
              <div>
                <label className="block text-xs font-bold text-ink/60 uppercase tracking-wider mb-1.5">作品类型</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'hand-drawn', label: '手绘图画' },
                    { id: 'comic', label: '漫画草稿' },
                    { id: 'novel', label: '小说故事' },
                    { id: 'worldview', label: '实验室设定' }
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setNewType(t.id as Artwork['type'])}
                      className={`rounded-lg border px-3 py-2 text-center text-xs font-semibold transition-all ${
                        newType === t.id
                          ? 'border-terracotta bg-terracotta/5 text-terracotta'
                          : 'border-book-border bg-paper/30 text-ink/75 hover:bg-paper'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-ink/60 uppercase tracking-wider mb-1">作品标题</label>
                <input
                  type="text"
                  required
                  placeholder="给作品起一个响亮的名字..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-lg border border-book-border bg-paper/40 px-3.5 py-2 text-xs font-medium text-ink placeholder:text-ink/30 focus:outline-none focus:ring-1 focus:ring-terracotta/50"
                />
              </div>

              {/* Upload image for Hand-drawn / Comics */}
              {(newType === 'hand-drawn' || newType === 'comic') && (
                <div>
                  <label className="block text-xs font-bold text-ink/60 uppercase tracking-wider mb-1">画作上传 (模拟 Google Drive)</label>
                  <div className="mt-1 flex justify-center rounded-lg border border-dashed border-book-border bg-paper/30 px-6 py-4">
                    <div className="text-center">
                      {imagePreview ? (
                        <div className="relative aspect-video w-full max-h-[140px] overflow-hidden rounded-md border border-book-border">
                          <img src={imagePreview} className="h-full w-full object-cover" alt="preview" />
                          <button 
                            type="button"
                            onClick={() => { setUploadFile(null); setImagePreview(null); }}
                            className="absolute right-1 top-1 rounded bg-black/60 px-2 py-0.5 text-[9px] text-white"
                          >
                            重选
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <ImageIcon className="mx-auto h-8 w-8 text-ink/30" />
                          <div className="flex text-xs text-ink/60">
                            <label className="relative cursor-pointer rounded bg-paper/60 px-2 py-1 font-semibold text-terracotta border border-book-border hover:bg-paper">
                              <span>选择画作图片</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="sr-only"
                              />
                            </label>
                          </div>
                          <p className="text-[10px] text-ink/40">支持 JPG, PNG, GIF</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Description / Markdown content */}
              <div>
                <label className="block text-xs font-bold text-ink/60 uppercase tracking-wider mb-1">
                  {newType === 'novel' || newType === 'worldview' ? '故事与设定内容 (支持 Markdown)' : '作品简介/描述'}
                </label>
                <textarea
                  rows={4}
                  placeholder={
                    newType === 'novel' || newType === 'worldview'
                      ? '## 章节标题\n可以使用 Markdown 语法来撰写世界观规则或小说大纲...'
                      : '写一写画作背后的想法，或者是这只恐龙的属性...'
                  }
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full rounded-lg border border-book-border bg-paper/40 px-3.5 py-2 text-xs font-medium text-ink placeholder:text-ink/30 focus:outline-none focus:ring-1 focus:ring-terracotta/50 font-mono"
                />
              </div>

              {/* Tags and Visibility */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-ink/60 uppercase tracking-wider mb-1">标签 (以逗号分隔)</label>
                  <input
                    type="text"
                    placeholder="例如: 恐龙, 科幻, 设定"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    className="w-full rounded-lg border border-book-border bg-paper/40 px-3.5 py-2 text-xs font-medium text-ink placeholder:text-ink/30 focus:outline-none focus:ring-1 focus:ring-terracotta/50"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-ink/60 uppercase tracking-wider mb-1">隐私设置</label>
                  <select
                    value={newVisibility}
                    onChange={(e) => setNewVisibility(e.target.value as 'public' | 'private')}
                    className="w-full rounded-lg border border-book-border bg-paper/40 px-3.5 py-2 text-xs font-medium text-ink focus:outline-none focus:ring-1 focus:ring-terracotta/50"
                  >
                    <option value="private">私密 (仅限父子可见)</option>
                    <option value="public">公开 (所有人可见)</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border border-book-border bg-paper/40 px-4 py-2 text-xs font-semibold text-ink hover:bg-paper"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-terracotta px-4.5 py-2 text-xs font-semibold text-parchment hover:bg-terracotta/90"
                >
                  创建并上传至 Drive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
