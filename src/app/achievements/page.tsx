"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { db, Achievement, AchievementCategory, User } from '@/lib/db';
import { Trophy, Lock, Star, Zap, ChevronRight } from 'lucide-react';

const CATEGORY_LABELS: Record<AchievementCategory | 'all', string> = {
  all:      '全部成就',
  creation: '🎨 创作之路',
  travel:   '🧳 探险足迹',
  world:    '🌍 世界构建',
  dream:    '⭐ 梦想档案',
  social:   '💬 共创纽带',
  special:  '🚀 特别成就',
};

const RARITY_STYLES: Record<Achievement['rarity'], { badge: string; border: string; glow: string; label: string }> = {
  common:   { badge: 'bg-ink/10 text-ink/60', border: 'border-book-border', glow: '', label: '普通' },
  rare:     { badge: 'bg-sage/15 text-sage', border: 'border-sage/30', glow: 'shadow-sage/10', label: '稀有' },
  legendary:{ badge: 'bg-gold/15 text-gold', border: 'border-gold/40', glow: 'shadow-gold/20', label: '传说' },
};

export default function AchievementsPage() {
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [activeTab, setActiveTab] = useState<AchievementCategory | 'all'>('all');
  const [showOnlyUnlocked, setShowOnlyUnlocked] = useState(false);
  const [celebratedIds, setCelebratedIds] = useState<Set<string>>(new Set());
  const confettiRef = useRef(false);

  useEffect(() => {
    setActiveUser(db.getActiveUser());
    const list = db.getAchievements();
    setAchievements(list);

    // Fire confetti once if there are many unlocked achievements (first visit)
    const unlockedCount = list.filter(a => a.unlocked).length;
    if (unlockedCount >= 5 && !confettiRef.current) {
      confettiRef.current = true;
      setTimeout(() => {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.5 }, colors: ['#9E523A', '#586953', '#D29A42'] });
      }, 600);
    }

    const handler = () => {
      setActiveUser(db.getActiveUser());
      setAchievements(db.getAchievements());
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const stats = {
    total: achievements.length,
    unlocked: achievements.filter(a => a.unlocked).length,
  };

  const filtered = achievements.filter(a => {
    if (activeTab !== 'all' && a.category !== activeTab) return false;
    if (showOnlyUnlocked && !a.unlocked) return false;
    return true;
  });

  const handleBadgeClick = (a: Achievement) => {
    if (!a.unlocked || celebratedIds.has(a.id)) return;
    setCelebratedIds(prev => new Set([...prev, a.id]));
    confetti({ particleCount: 60, spread: 50, origin: { y: 0.6 }, colors: ['#9E523A', '#D29A42'] });
  };

  if (!activeUser) return null;

  return (
    <div className="space-y-8">

      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-literary text-3xl font-bold tracking-tight text-ink">
            成就殿堂
          </h1>
          <p className="text-xs text-ink/50 mt-1">
            每一枚勋章，都是你在这个宇宙里留下的印记。
          </p>
        </div>

        {/* Overall progress ring */}
        <div className="museum-card flex items-center gap-5 px-6 py-4 shrink-0">
          {/* SVG ring */}
          <div className="relative h-16 w-16 shrink-0">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor"
                className="text-book-border" strokeWidth="2.5" />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor"
                className="text-terracotta transition-all duration-1000"
                strokeWidth="2.5"
                strokeDasharray={`${Math.round((stats.unlocked / stats.total) * 100)} 100`}
                strokeLinecap="round" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-ink">
              {Math.round((stats.unlocked / stats.total) * 100)}%
            </span>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink/40">总完成度</p>
            <p className="text-2xl font-bold font-display text-ink">
              {stats.unlocked} <span className="text-base text-ink/40">/ {stats.total}</span>
            </p>
            <p className="text-[10px] text-ink/50 mt-0.5">枚勋章已解锁</p>
          </div>
        </div>
      </div>

      {/* ── Category tabs + filter ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-book-border/50 pb-4">
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(CATEGORY_LABELS) as Array<AchievementCategory | 'all'>).map(cat => {
            const count = cat === 'all'
              ? achievements.filter(a => a.unlocked).length
              : achievements.filter(a => a.category === cat && a.unlocked).length;
            const total = cat === 'all'
              ? achievements.length
              : achievements.filter(a => a.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  activeTab === cat
                    ? 'bg-ink text-parchment shadow-sm'
                    : 'text-ink/60 hover:bg-paper/80'
                }`}
              >
                {CATEGORY_LABELS[cat]}
                <span className="ml-1.5 opacity-50 text-[10px]">{count}/{total}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setShowOnlyUnlocked(!showOnlyUnlocked)}
          className={`flex items-center gap-1.5 rounded-lg border px-3.5 py-1.5 text-xs font-semibold transition-all ${
            showOnlyUnlocked
              ? 'border-terracotta/30 bg-terracotta/5 text-terracotta'
              : 'border-book-border text-ink/60 hover:bg-paper'
          }`}
        >
          <Trophy className="h-3.5 w-3.5" />
          <span>只看已解锁</span>
        </button>
      </div>

      {/* ── Badge Grid ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(a => {
          const r = RARITY_STYLES[a.rarity];
          return (
            <button
              key={a.id}
              onClick={() => handleBadgeClick(a)}
              className={`museum-card text-left flex items-start gap-4 p-5 transition-all cursor-default border ${r.border} ${
                a.unlocked
                  ? `hover:shadow-lg ${r.glow} cursor-pointer`
                  : 'opacity-50 saturate-0'
              }`}
            >
              {/* Icon */}
              <div className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-3xl border ${r.border} ${
                a.unlocked ? 'bg-paper shadow-sm' : 'bg-paper/40'
              }`}>
                {a.unlocked ? (
                  <span className="select-none">{a.icon}</span>
                ) : (
                  <Lock className="h-5 w-5 text-ink/25" />
                )}
                {/* Rarity star for rare+ */}
                {a.rarity !== 'common' && (
                  <span className={`absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full text-[8px] ${r.badge}`}>
                    {a.rarity === 'legendary' ? '★' : '◆'}
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 space-y-1.5 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className={`font-display text-sm font-bold leading-tight ${a.unlocked ? 'text-ink' : 'text-ink/50'}`}>
                    {a.title}
                  </h3>
                  <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${r.badge}`}>
                    {r.label}
                  </span>
                </div>

                <p className="text-[11px] text-ink/60 leading-relaxed font-serif line-clamp-2">
                  {a.unlocked ? a.description : (a.hint || a.description)}
                </p>

                {/* Progress bar for locked badges */}
                {!a.unlocked && a.progress !== undefined && a.progress > 0 && (
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-[9px] text-ink/40 font-semibold">
                      <span>进度</span>
                      <span>{a.progress}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-book-border/50">
                      <div
                        className="h-full rounded-full bg-terracotta/60 transition-all duration-1000"
                        style={{ width: `${a.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Unlocked celebration text */}
                {a.unlocked && (
                  <div className="flex items-center gap-1 text-[9px] font-bold text-sage/80 pt-0.5">
                    <Star className="h-3 w-3 fill-current" />
                    <span>已解锁 · 点击庆祝！</span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-book-border/70 p-16 text-center">
          <Trophy className="h-10 w-10 text-ink/20 mb-3" />
          <p className="text-sm font-bold text-ink/50">这个分类下暂无已解锁的勋章</p>
          <p className="text-xs text-ink/35 mt-1">继续创作、记录旅行和立下梦想，勋章将会自动解锁！</p>
        </div>
      )}

      {/* ── Next targets hint ── */}
      {activeUser.role !== 'Guest' && (() => {
        const nextUp = achievements
          .filter(a => !a.unlocked && (a.progress || 0) > 0)
          .sort((x, y) => (y.progress || 0) - (x.progress || 0))
          .slice(0, 3);
        if (nextUp.length === 0) return null;
        return (
          <section className="rounded-xl border border-terracotta/20 bg-terracotta/[0.015] p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4.5 w-4.5 text-terracotta" />
              <h4 className="font-literary text-sm font-bold text-ink">即将解锁的勋章</h4>
            </div>
            <div className="space-y-2">
              {nextUp.map(a => (
                <div key={a.id} className="flex items-center gap-3">
                  <span className="text-xl">{a.icon}</span>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-ink/80">{a.title}</span>
                      <span className="text-[10px] text-ink/40">{a.progress}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-book-border/50">
                      <div
                        className="h-full rounded-full bg-terracotta transition-all"
                        style={{ width: `${a.progress}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-ink/50 font-serif">{a.hint}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-ink/30 shrink-0" />
                </div>
              ))}
            </div>
          </section>
        );
      })()}

    </div>
  );
}
