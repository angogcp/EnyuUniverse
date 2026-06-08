"use client";

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { db, Dream, User } from '@/lib/db';
import { 
  Target, Plus, Calendar, ShieldAlert, CheckCircle, 
  RotateCcw, Sparkles, BookOpen, KeyRound, Award
} from 'lucide-react';

export default function DreamsPage() {
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [dreams, setDreams] = useState<Dream[]>([]);

  // Form states
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTargetDate, setNewTargetDate] = useState<string>('');
  
  // Reflection modal states
  const [showReflectModal, setShowReflectModal] = useState<string | null>(null);
  const [reflectionText, setReflectionText] = useState('');

  useEffect(() => {
    setActiveUser(db.getActiveUser());
    setDreams(db.getDreams());

    const handleStorageChange = () => {
      setActiveUser(db.getActiveUser());
      setDreams(db.getDreams());
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleCreateDream = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    db.createDream({
      title: newTitle,
      content: newContent,
      target_date: newTargetDate || new Date().toISOString().substring(0, 10),
      status: 'active',
    });

    setNewTitle('');
    setNewContent('');
    setNewTargetDate('');
    setShowAddModal(false);
    setDreams(db.getDreams());
  };

  const handleAchieveDream = (id: string) => {
    // Fire confetti celebration!
    confetti({
      particleCount: 150,
      spread: 75,
      origin: { y: 0.6 },
      colors: ['#9E523A', '#586953', '#D29A42', '#FAF8F5'],
    });

    db.updateDream(id, { status: 'achieved' });
    setDreams(db.getDreams());
  };

  const handleSaveReflection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showReflectModal) return;

    db.updateDream(showReflectModal, { reflection: reflectionText });
    setReflectionText('');
    setShowReflectModal(null);
    setDreams(db.getDreams());
  };

  if (!activeUser) return null;

  const isGuest = activeUser.role === 'Guest';
  const canModify = activeUser.role === 'Child' || activeUser.role === 'Father';

  // Strict Privacy Check: Guest users are barred from viewing dreams
  if (isGuest) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] rounded-2xl border border-dashed border-book-border/70 p-12 text-center text-ink/40 max-w-lg mx-auto my-12 bg-paper/20">
        <KeyRound className="h-10 w-10 text-ink/20 mx-auto mb-3" />
        <h3 className="text-sm font-bold text-ink/70">梦想档案已锁定</h3>
        <p className="text-xs text-ink/40 mt-1 leading-relaxed">
          根据隐私安全权限，“梦想档案”记载着渊裕关于未来的自我期许和私人目标。此内容仅对家庭内部成员（渊裕与父母）开放，访客无法浏览。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-literary text-3xl font-bold tracking-tight text-ink">梦想档案</h1>
          <p className="text-xs text-ink/50 mt-1">这里记载着你在夜空里立下的远航地标。有计划的梦想，在倒计时里就会变成现实。</p>
        </div>

        {canModify && (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-terracotta px-4.5 py-2.5 text-sm font-semibold text-parchment shadow-md transition-all hover:bg-terracotta/90"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>立下新梦想</span>
          </button>
        )}
      </div>

      {/* Dream Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {dreams.map((dream) => {
          const isAchieved = dream.status === 'achieved';
          
          return (
            <div 
              key={dream.id}
              className={`museum-card flex flex-col justify-between p-6 ${
                isAchieved ? 'border-sage/40 bg-sage/[0.02]' : ''
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between border-b border-book-border/30 pb-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-paper border border-book-border text-ink/50">
                    <Target className={`h-5 w-5 ${isAchieved ? 'text-sage' : 'text-terracotta'}`} />
                  </span>
                  
                  <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold ${
                    isAchieved ? 'bg-sage/10 text-sage' : 'bg-terracotta/10 text-terracotta'
                  }`}>
                    {isAchieved ? '已达成' : '航行中'}
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className={`font-literary text-base font-bold text-ink ${isAchieved ? 'line-through opacity-70' : ''}`}>
                    {dream.title}
                  </h3>
                  
                  <p className="text-xs text-ink/75 leading-relaxed font-serif">
                    {dream.content}
                  </p>
                </div>

                {/* Target Date */}
                <div className="flex items-center gap-1.5 text-[10px] text-ink/40 font-semibold">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>目标时间: {dream.target_date}</span>
                </div>

                {/* Reflection section if present */}
                {dream.reflection && (
                  <div className="rounded-lg bg-paper/50 border border-book-border/40 p-3 space-y-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-ink/40 block">回顾记录 (Reflection)：</span>
                    <p className="font-serif text-[10px] leading-relaxed text-ink/80 italic">
                      “{dream.reflection}”
                    </p>
                  </div>
                )}
              </div>

              {/* Action area */}
              {canModify && (
                <div className="flex items-center gap-2 mt-5 pt-3 border-t border-book-border/30">
                  {!isAchieved ? (
                    <button
                      onClick={() => handleAchieveDream(dream.id)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-sage px-3 py-2 text-xs font-bold text-parchment shadow-sm transition-all hover:bg-sage/90"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>标记实现！</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        db.updateDream(dream.id, { status: 'active' });
                        setDreams(db.getDreams());
                      }}
                      className="inline-flex items-center justify-center gap-1 rounded-lg border border-book-border bg-paper/40 p-2 text-xs font-semibold text-ink hover:bg-paper"
                      title="重置为进行中"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                  )}
                  
                  <button
                    onClick={() => {
                      setReflectionText(dream.reflection || '');
                      setShowReflectModal(dream.id);
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-book-border bg-paper/40 px-3 py-2 text-xs font-semibold text-ink hover:bg-paper"
                  >
                    <BookOpen className="h-4 w-4" />
                    <span>{dream.reflection ? '修改回顾' : '添加回顾'}</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {dreams.length === 0 && (
          <div className="col-span-full text-center py-12 text-ink/40 border border-dashed border-book-border rounded-xl">
            你还没有写下任何梦想，点击右上角立下你的第一个旗帜吧。
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-book-border bg-parchment p-6 shadow-2xl animate-in scale-in duration-200">
            <h2 className="font-literary text-xl font-bold text-ink mb-4">立下新的人生目标</h2>

            <form onSubmit={handleCreateDream} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink/60 uppercase tracking-wider mb-1">梦想名称 / 目标</label>
                <input
                  type="text"
                  required
                  placeholder="你想在未来完成什么？例如: 高中毕业前当选自治会主席"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-lg border border-book-border bg-paper/40 px-3.5 py-2 text-xs font-medium text-ink focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink/60 uppercase tracking-wider mb-1">行动计划 / 内容详情</label>
                <textarea
                  rows={4}
                  placeholder="为了实现这个目标，我打算做些什么？..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full rounded-lg border border-book-border bg-paper/40 px-3.5 py-2 text-xs font-medium text-ink focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink/60 uppercase tracking-wider mb-1">期望实现日期</label>
                <input
                  type="date"
                  required
                  value={newTargetDate}
                  onChange={(e) => setNewTargetDate(e.target.value)}
                  className="w-full rounded-lg border border-book-border bg-paper/40 px-3.5 py-2 text-xs font-medium text-ink focus:outline-none"
                />
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
                  封印入梦想清单
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reflection Modal */}
      {showReflectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-book-border bg-parchment p-6 shadow-2xl animate-in scale-in duration-200">
            <h2 className="font-literary text-xl font-bold text-ink mb-4">撰写梦想达成回顾</h2>

            <form onSubmit={handleSaveReflection} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink/60 uppercase tracking-wider mb-1">回顾内容 / 经验反思</label>
                <textarea
                  rows={5}
                  placeholder="写下实现过程中的点滴，以及你在这个过程中学到了什么，或者是爸爸/妈妈对你的鼓励..."
                  value={reflectionText}
                  onChange={(e) => setReflectionText(e.target.value)}
                  className="w-full rounded-lg border border-book-border bg-paper/40 px-3.5 py-2 text-xs font-medium text-ink focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReflectModal(null)}
                  className="rounded-lg border border-book-border bg-paper/40 px-4 py-2 text-xs font-semibold text-ink hover:bg-paper"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-terracotta px-4.5 py-2 text-xs font-semibold text-parchment hover:bg-terracotta/90"
                >
                  保存回顾记录
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
