"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { db, TravelEntry, User } from '@/lib/db';
import { 
  MapPin, Plus, Search, Calendar, Eye, EyeOff, 
  Map, MessageSquare, BookOpen, Camera, FileText, 
  Compass, ArrowRight, ShieldAlert, Award
} from 'lucide-react';

export default function TravelPage() {
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [travelEntries, setTravelEntries] = useState<TravelEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<TravelEntry[]>([]);
  
  // Filtering & search
  const [activeTab, setActiveTab] = useState<'all' | 'plan' | 'story' | 'blog' | 'album'>('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc'>('date-desc');

  // Form states for creating a new log
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDestination, setNewDestination] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newType, setNewType] = useState<TravelEntry['type']>('plan');
  const [newContent, setNewContent] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newVisibility, setNewVisibility] = useState<'public' | 'private'>('private');

  useEffect(() => {
    setActiveUser(db.getActiveUser());
    loadData();

    const handleStorageChange = () => {
      setActiveUser(db.getActiveUser());
      loadData();
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const loadData = () => {
    const allLogs = db.getTravelEntries();
    const user = db.getActiveUser();

    // Enforce privacy permissions: Guest role can only see public travel entries
    if (user.role === 'Guest') {
      setTravelEntries(allLogs.filter(log => log.visibility === 'public'));
    } else {
      setTravelEntries(allLogs);
    }
  };

  // Filter and Sort logs
  useEffect(() => {
    let result = [...travelEntries];

    // Filter by search (title or destination)
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(log => 
        log.title.toLowerCase().includes(q) || 
        log.destination.toLowerCase().includes(q)
      );
    }

    // Filter by category tab
    if (activeTab !== 'all') {
      result = result.filter(log => log.type === activeTab);
    }

    // Sort by date
    result.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortBy === 'date-desc' ? dateB - dateA : dateA - dateB;
    });

    setFilteredEntries(result);
  }, [travelEntries, activeTab, search, sortBy]);

  const handleCreateTravel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDestination.trim()) return;

    db.createTravelEntry({
      title: newTitle,
      destination: newDestination,
      date: newDate || new Date().toISOString().substring(0, 10),
      type: newType,
      content: newContent,
      image_url: newImageUrl || undefined,
      visibility: newVisibility
    });

    // Reset Form
    setNewTitle('');
    setNewDestination('');
    setNewDate('');
    setNewType('plan');
    setNewContent('');
    setNewImageUrl('');
    setNewVisibility('private');
    setShowAddModal(false);

    // Refresh Data
    loadData();
    window.dispatchEvent(new Event('storage'));
  };

  if (!activeUser) return null;

  const canModify = activeUser.role === 'Father' || activeUser.role === 'Child';

  // Compute stats
  const totalLogs = travelEntries.length;
  // Get unique cities
  const uniqueCities = Array.from(new Set(travelEntries.map(log => log.destination.split(/[、,，\s]+/)[0]))).filter(Boolean);
  const totalDays = travelEntries.reduce((acc, log) => {
    // Estimating travel duration from content or count 2 days per log
    return acc + (log.type === 'plan' ? 7 : 3);
  }, 0);

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-literary text-3xl font-bold tracking-tight text-ink">足迹馆</h1>
          <p className="text-xs text-ink/50 mt-1">记录父子在现实世界的探险足迹——旅行计划、游记故事、随笔日记与照片墙。</p>
        </div>

        {canModify && (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-terracotta px-4.5 py-2.5 text-sm font-semibold text-parchment shadow-md transition-all hover:bg-terracotta/90"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>记录新旅程</span>
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="museum-card p-4.5 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-ink/40 uppercase tracking-wider">探险足迹</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-display text-ink">{totalLogs}</span>
            <span className="text-xs text-ink/50">个足迹记录</span>
          </div>
          <p className="text-[10px] text-ink/40 mt-1">包含计划中与已达成的里程碑</p>
        </div>

        <div className="museum-card p-4.5 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-ink/40 uppercase tracking-wider">丈量城市</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-display text-terracotta">{uniqueCities.length}</span>
            <span className="text-xs text-ink/50">个目的地</span>
          </div>
          <p className="text-[10px] text-ink/40 mt-1">已点亮: {uniqueCities.join(', ') || '暂无'}</p>
        </div>

        <div className="museum-card p-4.5 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-ink/40 uppercase tracking-wider">漫游天数</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-display text-ink">{totalDays}</span>
            <span className="text-xs text-ink/50">天旅程</span>
          </div>
          <p className="text-[10px] text-ink/40 mt-1">走过的每一步，都算数</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-book-border/50 pb-4">
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-1">
          {(['all', 'plan', 'story', 'blog', 'album'] as const).map((tab) => {
            const label = tab === 'all' ? '全部足迹' :
                          tab === 'plan' ? '旅行计划 (Plans)' :
                          tab === 'story' ? '游记故事 (Stories)' :
                          tab === 'blog' ? '旅行日记 (Blogs)' : '精彩瞬间 (Photos)';
            
            const count = tab === 'all' 
              ? travelEntries.length 
              : travelEntries.filter(log => log.type === tab).length;

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

        {/* Search & Sort */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative max-w-xs w-full sm:w-48">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-ink/40" />
            <input
              type="text"
              placeholder="搜索目的地或名称..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-book-border bg-paper/40 pl-8.5 pr-3 py-1.5 text-xs font-medium text-ink focus:bg-paper focus:outline-none focus:ring-1 focus:ring-terracotta/50"
            />
          </div>

          <div className="relative flex items-center">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-lg border border-book-border bg-paper/40 pl-3.5 pr-8 py-1.5 text-xs font-semibold text-ink focus:bg-paper focus:outline-none focus:ring-1 focus:ring-terracotta/50"
            >
              <option value="date-desc">日期最新优先</option>
              <option value="date-asc">日期最早优先</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid of travel cards */}
      {filteredEntries.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEntries.map((log) => {
            const conversationsCount = db.getConversations(log.id).length;
            
            let icon = <FileText className="h-5 w-5" />;
            if (log.type === 'plan') icon = <Compass className="h-5 w-5 text-terracotta" />;
            else if (log.type === 'story') icon = <BookOpen className="h-5 w-5 text-sage" />;
            else if (log.type === 'album') icon = <Camera className="h-5 w-5 text-gold" />;

            return (
              <Link
                key={log.id}
                href={`/travel/${log.id}`}
                className="museum-card group flex flex-col justify-between overflow-hidden p-0"
              >
                <div className="p-5 space-y-4">
                  {/* Image/Map Placeholder */}
                  {log.image_url ? (
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-book-border/40 bg-paper">
                      <img
                        src={log.image_url}
                        alt={log.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-video w-full flex-col items-center justify-center rounded-lg border border-dashed border-book-border bg-paper/30 text-ink/30">
                      {icon}
                      <span className="text-[9px] uppercase font-bold tracking-wider mt-2">
                        {log.type === 'plan' ? '旅行计划' : log.type === 'story' ? '游记故事' : '日常随笔'}
                      </span>
                    </div>
                  )}

                  {/* Title & Metadata */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-terracotta uppercase tracking-wider">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{log.destination}</span>
                      </span>

                      {/* Privacy indicator */}
                      <span className="flex items-center gap-1 text-[9px] font-semibold text-ink/40">
                        {log.visibility === 'public' ? (
                          <Eye className="h-3 w-3 text-sage" />
                        ) : (
                          <EyeOff className="h-3 w-3" />
                        )}
                        <span>{log.visibility === 'public' ? '公开' : '私密'}</span>
                      </span>
                    </div>

                    <h3 className="font-literary text-base font-bold text-ink group-hover:text-terracotta transition-colors line-clamp-1">
                      {log.title}
                    </h3>
                  </div>

                  {/* Content snippet */}
                  {log.content && (
                    <p className="text-xs text-ink/70 line-clamp-3 leading-relaxed font-serif">
                      {log.content.replace(/[#*`>]/g, '')}
                    </p>
                  )}
                </div>

                {/* Footer details */}
                <div className="flex items-center justify-between border-t border-book-border/40 px-5 py-3 bg-paper/30">
                  <span className="text-[10px] text-ink/40 font-semibold">
                    {new Date(log.date).toLocaleDateString('zh-CN')}
                  </span>
                  
                  <div className="flex items-center gap-3 text-ink/50 text-[10px]">
                    <span className="flex items-center gap-1" title="Co-creation comments count">
                      <MessageSquare className="h-3.5 w-3.5" />
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
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-book-border/70 p-16 text-center text-ink/40 bg-paper/20">
          <ShieldAlert className="h-10 w-10 text-ink/20 mb-3" />
          <h3 className="text-sm font-bold text-ink/70">没有找到匹配的足迹</h3>
          {activeUser.role === 'Guest' ? (
            <p className="text-xs text-ink/40 max-w-xs mt-1">
              访客模式下只能浏览公开性质的游记故事，私密计划和旅行博客已隐藏。
            </p>
          ) : (
            <p className="text-xs text-ink/40 max-w-xs mt-1">
              点击右上角的“记录新旅程”添加你们的第一个出行足迹吧。
            </p>
          )}
        </div>
      )}

      {/* Add Travel Entry Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-book-border bg-parchment p-6 shadow-2xl animate-in scale-in duration-200">
            <h2 className="font-literary text-xl font-bold text-ink mb-4">记录新的出行足迹</h2>
            
            <form onSubmit={handleCreateTravel} className="space-y-4">
              {/* Type Switcher */}
              <div>
                <label className="block text-xs font-bold text-ink/60 uppercase tracking-wider mb-1.5">记录类型</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'plan', label: '旅行计划' },
                    { id: 'story', label: '游记故事' },
                    { id: 'blog', label: '出行随笔' },
                    { id: 'album', label: '相册相片' }
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setNewType(t.id as TravelEntry['type'])}
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

              {/* Title & Destination */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-ink/60 uppercase tracking-wider mb-1">旅行主题</label>
                  <input
                    type="text"
                    required
                    placeholder="给旅程起个亮眼的主题..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full rounded-lg border border-book-border bg-paper/40 px-3.5 py-2 text-xs font-medium text-ink focus:outline-none focus:ring-1 focus:ring-terracotta/50"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-ink/60 uppercase tracking-wider mb-1">目的地</label>
                  <input
                    type="text"
                    required
                    placeholder="如: 山东泰安、北京"
                    value={newDestination}
                    onChange={(e) => setNewDestination(e.target.value)}
                    className="w-full rounded-lg border border-book-border bg-paper/40 px-3.5 py-2 text-xs font-medium text-ink focus:outline-none focus:ring-1 focus:ring-terracotta/50"
                  />
                </div>
              </div>

              {/* Date & Image */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-ink/60 uppercase tracking-wider mb-1">出行/计划日期</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full rounded-lg border border-book-border bg-paper/40 px-3.5 py-2 text-xs font-medium text-ink focus:outline-none focus:ring-1 focus:ring-terracotta/50"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-ink/60 uppercase tracking-wider mb-1">封面图片网址 (可选)</label>
                  <input
                    type="text"
                    placeholder="如: /travel_skiing.png"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    className="w-full rounded-lg border border-book-border bg-paper/40 px-3.5 py-2 text-xs font-medium text-ink focus:outline-none focus:ring-1 focus:ring-terracotta/50"
                  />
                </div>
              </div>

              {/* Content (Markdown) */}
              <div>
                <label className="block text-xs font-bold text-ink/60 uppercase tracking-wider mb-1">
                  内容详情 (支持 Markdown 语法)
                </label>
                <textarea
                  rows={5}
                  placeholder={
                    newType === 'plan'
                      ? '### 🗓️ 每日游玩计划\n* D1: 早上出发到达...\n* D2: 游览...\n\n### 🎒 物品备忘录\n- 相机、画板...'
                      : '记录旅途上的见闻与心情故事...'
                  }
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full rounded-lg border border-book-border bg-paper/40 px-3.5 py-2 text-xs font-medium text-ink focus:outline-none focus:ring-1 focus:ring-terracotta/50 font-serif"
                />
              </div>

              {/* Privacy settings */}
              <div>
                <label className="block text-xs font-bold text-ink/60 uppercase tracking-wider mb-1">可见设置</label>
                <select
                  value={newVisibility}
                  onChange={(e) => setNewVisibility(e.target.value as 'public' | 'private')}
                  className="w-full rounded-lg border border-book-border bg-paper/40 px-3.5 py-2 text-xs font-medium text-ink focus:outline-none"
                >
                  <option value="private">私密 (仅限家庭内部成员可见)</option>
                  <option value="public">公开 (所有人可见)</option>
                </select>
              </div>

              {/* Actions */}
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
                  保存记录至足迹馆
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
