"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { db, TimelineEvent, Artwork, User } from '@/lib/db';
import { 
  Calendar, Plus, Landmark, GraduationCap, 
  Sparkles, Award, Link as LinkIcon, Trash2 
} from 'lucide-react';

export default function TimelinePage() {
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  
  // Form states
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDesc, setNewEventDesc] = useState('');
  const [newEventYear, setNewEventYear] = useState<number>(new Date().getFullYear());
  const [newEventDate, setNewEventDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [newEventType, setNewEventType] = useState<TimelineEvent['type']>('life');
  const [relatedArtworkId, setRelatedArtworkId] = useState<string>('');

  useEffect(() => {
    setActiveUser(db.getActiveUser());
    setEvents(db.getTimelineEvents());
    setArtworks(db.getArtworks());

    const handleStorageChange = () => {
      setActiveUser(db.getActiveUser());
      setEvents(db.getTimelineEvents());
      setArtworks(db.getArtworks());
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;

    db.createTimelineEvent({
      year: Number(newEventYear),
      date: newEventDate,
      title: newEventTitle,
      description: newEventDesc,
      type: newEventType,
      related_artwork_id: relatedArtworkId || undefined,
    });

    // Reset Form
    setNewEventTitle('');
    setNewEventDesc('');
    setNewEventYear(new Date().getFullYear());
    setNewEventDate(new Date().toISOString().substring(0, 10));
    setNewEventType('life');
    setRelatedArtworkId('');
    setShowAddModal(false);
    setEvents(db.getTimelineEvents());
  };

  const handleDeleteEvent = (id: string) => {
    if (confirm('确认删除此成长年轮事件吗？')) {
      db.deleteTimelineEvent(id);
      setEvents(db.getTimelineEvents());
    }
  };

  if (!activeUser) return null;

  // Render event icon based on type
  const getEventIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'school':
        return <GraduationCap className="h-4.5 w-4.5 text-sage" />;
      case 'creation':
        return <Sparkles className="h-4.5 w-4.5 text-terracotta" />;
      case 'life':
        return <Award className="h-4.5 w-4.5 text-accent" />;
      default:
        return <Landmark className="h-4.5 w-4.5 text-ink/50" />;
    }
  };

  const canModify = activeUser.role === 'Father' || activeUser.role === 'Child';
  const isGuest = activeUser.role === 'Guest';

  // Guest users cannot see private timeline events
  // PRD 7.3 says growth timeline ("成长年轮") is private by default, but let's show events if they are marked public or if active user is family
  const visibleEvents = isGuest 
    ? events.filter(e => {
        if (!e.related_artwork_id) return false;
        const linkedArt = artworks.find(a => a.id === e.related_artwork_id);
        return linkedArt?.visibility === 'public';
      })
    : events;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-literary text-3xl font-bold tracking-tight text-ink">成长年轮</h1>
          <p className="text-xs text-ink/50 mt-1">记录生命的轨迹与重要时刻。这棵大树的每一圈年轮，都刻着你努力长大的痕迹。</p>
        </div>

        {canModify && (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-terracotta px-4.5 py-2.5 text-sm font-semibold text-parchment shadow-md transition-all hover:bg-terracotta/90"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>记录成长年轮</span>
          </button>
        )}
      </div>

      {isGuest && visibleEvents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-book-border/70 p-12 text-center text-ink/40 max-w-lg mx-auto">
          <Landmark className="h-10 w-10 text-ink/20 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-ink/70">私密时间线不可见</h3>
          <p className="text-xs text-ink/40 mt-1 leading-relaxed">
            按照产品隐私设置，“成长年轮”属于家庭私密内容。目前没有公开关联的作品时间线可供浏览。
          </p>
        </div>
      ) : (
        <div className="relative border-l-2 border-book-border/60 ml-4 md:ml-32 py-4 space-y-10">
          {visibleEvents.map((ev, index) => {
            const linkedArt = ev.related_artwork_id ? artworks.find(a => a.id === ev.related_artwork_id) : null;
            
            return (
              <div key={ev.id} className="relative animate-in slide-in-from-bottom-3 duration-300" style={{ animationDelay: `${index * 50}ms` }}>
                
                {/* Year Label (Desktop only) */}
                <div className="hidden md:block absolute -left-36 top-0 text-right w-28 pr-4">
                  <span className="font-display text-lg font-bold text-terracotta">{ev.year}年</span>
                  <span className="block text-[10px] font-semibold text-ink/40 mt-0.5">{ev.date}</span>
                </div>

                {/* Timeline node icon dot */}
                <div className="absolute -left-[14px] top-1 flex h-6 w-6 items-center justify-center rounded-full border border-book-border bg-parchment shadow-sm">
                  {getEventIcon(ev.type)}
                </div>

                {/* Node details */}
                <div className="pl-6 md:pl-8 max-w-2xl">
                  <div className="museum-card p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        {/* Year/Date (Mobile view only) */}
                        <div className="md:hidden text-[10px] font-bold text-terracotta uppercase tracking-wide mb-0.5">
                          {ev.year}年 • {ev.date}
                        </div>
                        <h3 className="font-literary text-base font-bold text-ink">{ev.title}</h3>
                      </div>
                      
                      {canModify && (
                        <button
                          onClick={() => handleDeleteEvent(ev.id)}
                          className="text-ink/30 hover:text-red-600 p-1 rounded transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    <p className="text-xs leading-relaxed text-ink/80 font-serif">
                      {ev.description}
                    </p>

                    {/* Linked Artwork block */}
                    {linkedArt && (
                      <Link
                        href={`/artworks/${linkedArt.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-terracotta/20 bg-terracotta/5 px-3 py-1.5 text-[10px] font-bold text-terracotta transition-all hover:bg-terracotta/10"
                      >
                        <LinkIcon className="h-3 w-3" />
                        <span>关联作品: {linkedArt.title}</span>
                      </Link>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-book-border bg-parchment p-6 shadow-2xl animate-in scale-in duration-200">
            <h2 className="font-literary text-xl font-bold text-ink mb-4">记录新的年轮节点</h2>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-ink/60 uppercase tracking-wider mb-1">年份</label>
                  <input
                    type="number"
                    required
                    value={newEventYear}
                    onChange={(e) => setNewEventYear(Number(e.target.value))}
                    className="w-full rounded-lg border border-book-border bg-paper/40 px-3.5 py-2 text-xs font-medium text-ink focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink/60 uppercase tracking-wider mb-1">具体日期</label>
                  <input
                    type="date"
                    required
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className="w-full rounded-lg border border-book-border bg-paper/40 px-3.5 py-2 text-xs font-medium text-ink focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink/60 uppercase tracking-wider mb-1">事件名称</label>
                <input
                  type="text"
                  required
                  placeholder="例如: 连任卫生股长, 开启艾尔德兰画册..."
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  className="w-full rounded-lg border border-book-border bg-paper/40 px-3.5 py-2 text-xs font-medium text-ink focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink/60 uppercase tracking-wider mb-1">事件详情描述</label>
                <textarea
                  rows={3}
                  placeholder="记录下这件事情的发生经过，或者当时的心情..."
                  value={newEventDesc}
                  onChange={(e) => setNewEventDesc(e.target.value)}
                  className="w-full rounded-lg border border-book-border bg-paper/40 px-3.5 py-2 text-xs font-medium text-ink focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-ink/60 uppercase tracking-wider mb-1">事件类别</label>
                  <select
                    value={newEventType}
                    onChange={(e) => setNewEventType(e.target.value as TimelineEvent['type'])}
                    className="w-full rounded-lg border border-book-border bg-paper/40 px-3.5 py-2 text-xs font-medium text-ink focus:outline-none"
                  >
                    <option value="life">生活日常 (Life)</option>
                    <option value="school">学校教育 (School)</option>
                    <option value="creation">创作爆发 (Creation)</option>
                    <option value="other">其他</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink/60 uppercase tracking-wider mb-1">关联作品 (可选)</label>
                  <select
                    value={relatedArtworkId}
                    onChange={(e) => setRelatedArtworkId(e.target.value)}
                    className="w-full rounded-lg border border-book-border bg-paper/40 px-3.5 py-2 text-xs font-medium text-ink focus:outline-none"
                  >
                    <option value="">-- 无关联 --</option>
                    {artworks.map((art) => (
                      <option key={art.id} value={art.id}>
                        [{art.type === 'hand-drawn' ? '手绘' : '设定'}] {art.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
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
                  写入年轮卷宗
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
