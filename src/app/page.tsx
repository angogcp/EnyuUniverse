"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { db, User, Artwork, TimelineEvent, Dream } from '@/lib/db';
import { 
  Plus, Sparkles, BookOpen, Compass, 
  Target, Calendar, ArrowRight, Library, HelpCircle, Landmark, Trophy, MapPin
} from 'lucide-react';

export default function Home() {
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [recentArtworks, setRecentArtworks] = useState<Artwork[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [achievementStats, setAchievementStats] = useState({ total: 0, unlocked: 0, percentage: 0 });

  useEffect(() => {
    // Load initial states
    setActiveUser(db.getActiveUser());
    setRecentArtworks(db.getArtworks().slice(0, 2));
    setTimelineEvents(db.getTimelineEvents().slice(-2).reverse());
    setDreams(db.getDreams().filter(d => d.status === 'active').slice(0, 2));
    setAchievementStats(db.getAchievementStats());

    // Handle updates when role changes
    const handleStorageChange = () => {
      setActiveUser(db.getActiveUser());
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  if (!activeUser) return null;

  // Custom Greetings based on user role
  const getGreeting = () => {
    switch (activeUser.role) {
      case 'Child':
        return {
          title: "欢迎回来，馆长。",
          subtitle: "你的宇宙正在等待你继续书写。",
          desc: "在这个世界里，你就是创世神。你可以随时画下你的故事、创造你的角色，或者规划你的超级梦想。"
        };
      case 'Father':
        return {
          title: "欢迎回来，爸爸。",
          subtitle: "今天，想去看看孩子创造的新世界吗？",
          desc: "查看渊裕上传的新创作，在共创区进行一场深度的父子对话，或者帮他梳理人生的成长年轮。"
        };
      case 'Mother':
        return {
          title: "欢迎回来，妈妈。",
          subtitle: "一起来见证孩子的奇妙宇宙吧！",
          desc: "浏览孩子公开的精美画作与成长足迹，留下鼓励的话语，陪伴他的想象力一同飞翔。"
        };
      default:
        return {
          title: "你好，远方的访客。",
          subtitle: "欢迎来到渊裕的数字成长花园。",
          desc: "在这里，你可以浏览渊裕公开分享的创作、世界观地图和未来梦想。有些深邃的宇宙只对家人开放哦。"
        };
    }
  };

  const greeting = getGreeting();

  return (
    <div className="space-y-10 py-4">
      {/* 1. Hero Welcome Section */}
      <section className="relative overflow-hidden rounded-2xl border border-book-border bg-paper/50 p-6 md:p-10 shadow-sm">
        <div className="absolute right-0 top-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-gold/5 blur-3xl" />
        <div className="absolute left-1/3 bottom-0 -ml-20 -mb-20 h-48 w-48 rounded-full bg-terracotta/5 blur-3xl" />
        
        <div className="relative max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-terracotta/10 px-3 py-1 text-xs font-bold text-terracotta">
            <Sparkles className="h-3.5 w-3.5" />
            <span>个人数字城堡 v4.1</span>
          </div>
          
          <h1 className="font-literary text-3.5xl md:text-5xl font-bold tracking-tight text-ink leading-tight">
            {greeting.title}
            <span className="block mt-1.5 text-terracotta font-medium font-display text-2.5xl md:text-3.5xl">
              {greeting.subtitle}
            </span>
          </h1>
          
          <p className="text-sm md:text-base leading-relaxed text-ink/75 max-w-xl">
            {greeting.desc}
          </p>

          {/* Quick actions for Child and Father */}
          <div className="pt-2 flex flex-wrap gap-3">
            {activeUser.role === 'Child' && (
              <>
                <Link 
                  href="/artworks?create=true"
                  className="inline-flex items-center gap-2 rounded-lg bg-terracotta px-4 py-2.5 text-sm font-semibold text-parchment shadow-md transition-all hover:bg-terracotta/90 hover:shadow-lg"
                >
                  <Plus className="h-4 w-4" />
                  <span>开启新创作</span>
                </Link>
                <Link 
                  href="/worldbuilding"
                  className="inline-flex items-center gap-2 rounded-lg border border-book-border bg-parchment px-4 py-2.5 text-sm font-semibold text-ink transition-all hover:bg-paper"
                >
                  <Compass className="h-4 w-4 text-sage" />
                  <span>管理世界观</span>
                </Link>
                <Link 
                  href="/blog"
                  className="inline-flex items-center gap-2 rounded-lg border border-book-border bg-parchment px-4 py-2.5 text-sm font-semibold text-ink transition-all hover:bg-paper"
                >
                  <BookOpen className="h-4 w-4 text-orange-500" />
                  <span>双城日志</span>
                </Link>
              </>
            )}

            {activeUser.role === 'Father' && (
              <>
                <Link 
                  href="/artworks"
                  className="inline-flex items-center gap-2 rounded-lg bg-terracotta px-4 py-2.5 text-sm font-semibold text-parchment shadow-md transition-all hover:bg-terracotta/90 hover:shadow-lg"
                >
                  <Library className="h-4 w-4" />
                  <span>查看作品目录</span>
                </Link>
                <Link 
                  href="/timeline"
                  className="inline-flex items-center gap-2 rounded-lg border border-book-border bg-parchment px-4 py-2.5 text-sm font-semibold text-ink transition-all hover:bg-paper"
                >
                  <Calendar className="h-4 w-4 text-sage" />
                  <span>记录成长节点</span>
                </Link>
                <Link 
                  href="/blog"
                  className="inline-flex items-center gap-2 rounded-lg border border-book-border bg-parchment px-4 py-2.5 text-sm font-semibold text-ink transition-all hover:bg-paper"
                >
                  <BookOpen className="h-4 w-4 text-orange-500" />
                  <span>双城日志</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 2. Main Dashboard grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        
        {/* Creation Hall Highlight */}
        <div className="museum-card flex flex-col justify-between p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-terracotta/10 text-terracotta">
                <Library className="h-5.5 w-5.5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink/40">创作馆</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-ink">最近的作品</h3>
              <p className="text-xs text-ink/50 mt-1">手绘图纸、科幻设定、战术演练与短篇故事</p>
            </div>
            
            <div className="space-y-3 pt-2">
              {recentArtworks.length > 0 ? (
                recentArtworks.map((art) => (
                  <Link 
                    key={art.id} 
                    href={`/artworks/${art.id}`}
                    className="group block rounded-lg border border-book-border/50 bg-parchment/60 p-3 transition-all hover:bg-parchment hover:border-terracotta/30"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-ink group-hover:text-terracotta transition-colors truncate max-w-[150px]">
                        {art.title}
                      </span>
                      <span className="rounded bg-paper px-1.5 py-0.5 text-[9px] font-medium text-ink/50 uppercase">
                        {art.type === 'hand-drawn' ? '手绘' : art.type === 'wargame' ? '战术' : art.type === 'novel' ? '故事' : '设定'}
                      </span>
                    </div>
                    {art.description && (
                      <p className="text-[11px] text-ink/65 line-clamp-1 mt-1 font-serif">
                        {art.description.replace(/[#*`]/g, '')}
                      </p>
                    )}
                  </Link>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-ink/40">暂无作品，快去上传吧</div>
              )}
            </div>
          </div>
          
          <Link 
            href="/artworks" 
            className="group mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-terracotta hover:underline"
          >
            <span>进入创作馆</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Growth rings (Timeline) Highlight */}
        <div className="museum-card flex flex-col justify-between p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sage/10 text-sage">
                <Calendar className="h-5.5 w-5.5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink/40">成长年轮</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-ink">成长轨迹</h3>
              <p className="text-xs text-ink/50 mt-1">记录生命中闪光的事件与重要里程碑</p>
            </div>

            <div className="relative border-l border-book-border pl-4 space-y-4 pt-2">
              {timelineEvents.slice(0, 2).map((ev) => (
                <div key={ev.id} className="relative">
                  <div className="absolute -left-[20.5px] top-1.5 h-3 w-3 rounded-full border-2 border-parchment bg-sage" />
                  <div className="text-[10px] font-semibold text-sage">{ev.year}年 {ev.date.substring(5)}</div>
                  <h4 className="text-xs font-bold text-ink mt-0.5">{ev.title}</h4>
                  {ev.description && (
                    <p className="text-[10px] text-ink/60 line-clamp-1 mt-0.5">{ev.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <Link 
            href="/timeline" 
            className="group mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-sage hover:underline"
          >
            <span>查看完整时间线</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Dream Archive Highlight */}
        <div className="museum-card flex flex-col justify-between p-6 md:col-span-2 lg:col-span-1">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10 text-gold-600 dark:text-gold">
                <Target className="h-5.5 w-5.5 text-gold" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink/40">梦想档案</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-ink">未来航标</h3>
              <p className="text-xs text-ink/50 mt-1">记录渊裕立下的重要目标与他的自我期许</p>
            </div>

            <div className="space-y-3 pt-2">
              {dreams.map((dream) => (
                <div 
                  key={dream.id}
                  className="rounded-lg border border-book-border/50 bg-parchment/60 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-xs text-ink line-clamp-1">
                      {dream.title}
                    </span>
                    <span className="shrink-0 rounded-full bg-gold/10 px-2 py-0.5 text-[8px] font-semibold text-gold">
                      目标: {dream.target_date.substring(0, 7)}
                    </span>
                  </div>
                  <p className="text-[10px] text-ink/65 mt-1 font-serif line-clamp-1">
                    {dream.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
          
          <Link 
            href="/dreams" 
            className="group mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-gold hover:underline"
          >
            <span>开启梦想清单</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

      </div>

      {/* 3. Achievement & quick-link strip */}
      {activeUser.role !== 'Guest' && (
        <section className="rounded-xl border border-book-border bg-paper/30 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gold/10 border border-gold/20">
                <Trophy className="h-6 w-6 text-gold" />
              </div>
              <div>
                <h4 className="font-display text-sm font-bold text-ink">成就殿堂</h4>
                <p className="text-[11px] text-ink/50 mt-0.5">
                  已解锁 <span className="font-bold text-terracotta">{achievementStats.unlocked}</span> / {achievementStats.total} 枚勋章
                </p>
                {/* mini progress bar */}
                <div className="mt-1.5 h-1.5 w-40 overflow-hidden rounded-full bg-book-border/50">
                  <div
                    className="h-full rounded-full bg-terracotta transition-all duration-700"
                    style={{ width: `${achievementStats.percentage}%` }}
                  />
                </div>
              </div>
            </div>
            <Link
              href="/achievements"
              className="inline-flex items-center gap-1.5 rounded-lg bg-terracotta px-4 py-2 text-xs font-semibold text-parchment shadow-sm hover:bg-terracotta/90 transition-all"
            >
              <span>查看全部勋章</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>
      )}

      {/* 4. Product Mission & Quote Card */}
      <section className="rounded-xl border border-book-border/40 bg-paper/20 p-6 text-center max-w-xl mx-auto space-y-3">
        <Landmark className="h-6 w-6 text-terracotta mx-auto opacity-70" />
        <h4 className="font-serif italic text-sm text-ink/80">
          “ 帮助一个少年建立属于自己的世界，同时成长为一个完整、善良、有独立思考能力的人。”
        </h4>
        <div className="h-[1px] w-12 bg-book-border mx-auto" />
        <span className="block text-[10px] uppercase tracking-wider text-ink/40 font-bold">
          Project J 核心使命
        </span>
      </section>
    </div>
  );
}
