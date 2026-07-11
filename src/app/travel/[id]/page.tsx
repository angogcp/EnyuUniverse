"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { db, TravelEntry, Conversation, User } from '@/lib/db';
import { 
  ArrowLeft, Eye, EyeOff, Send, MessageSquare, 
  Calendar, MapPin, User as UserIcon, Trash2, Edit3, Save 
} from 'lucide-react';

export default function TravelDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [entry, setEntry] = useState<TravelEntry | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  // Chat state
  const [newMessage, setNewMessage] = useState('');

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDestination, setEditDestination] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');

  useEffect(() => {
    const user = db.getActiveUser();
    setActiveUser(user);
    setUsers(db.getUsers());

    const log = db.getTravelEntryById(id);
    if (!log) {
      return;
    }

    // Role check: Guest user can ONLY see public logs
    if (user.role === 'Guest' && log.visibility === 'private') {
      router.push('/travel'); // Redirect unauthorized
      return;
    }

    setEntry(log);
    setEditTitle(log.title);
    setEditDestination(log.destination);
    setEditDate(log.date);
    setEditContent(log.content || '');
    setEditImageUrl(log.image_url || '');
    setConversations(db.getConversations(id));

    // Event listener for active role change
    const handleStorageChange = () => {
      const updatedUser = db.getActiveUser();
      setActiveUser(updatedUser);
      
      const updatedLog = db.getTravelEntryById(id);
      if (!updatedLog || (updatedUser.role === 'Guest' && updatedLog.visibility === 'private')) {
        router.push('/travel');
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [id, router]);

  if (!entry || !activeUser) {
    return (
      <div className="text-center py-12 text-ink/50">
        记录不存在或加载中...
      </div>
    );
  }

  // Find sender helpers
  const fatherName = users.find(u => u.role === 'Father')?.name || '爸爸';

  const getUserName = (userId: string) => {
    return users.find(u => u.id === userId)?.name || '未知成员';
  };

  const getUserRole = (userId: string) => {
    return users.find(u => u.id === userId)?.role || 'Guest';
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    db.addMessage(entry.id, newMessage);
    setNewMessage('');
    setConversations(db.getConversations(entry.id));
  };

  const handleToggleVisibility = () => {
    if (activeUser.role !== 'Child' && activeUser.role !== 'Father') return;
    const newVis = entry.visibility === 'public' ? 'private' : 'public';
    const updated = db.updateTravelEntry(entry.id, { visibility: newVis });
    setEntry(updated);
  };

  const handleSaveEdit = () => {
    const updated = db.updateTravelEntry(entry.id, {
      title: editTitle,
      destination: editDestination,
      date: editDate,
      content: editContent,
      image_url: editImageUrl || undefined
    });
    setEntry(updated);
    setIsEditing(false);
    window.dispatchEvent(new Event('storage'));
  };

  const handleDelete = () => {
    if (confirm('确定要删除这篇旅程记录吗？这也会删除所有相关的共创对话。')) {
      db.deleteTravelEntry(entry.id);
      router.push('/travel');
      window.dispatchEvent(new Event('storage'));
    }
  };

  // Check permissions
  const canModify = activeUser.role === 'Child' || activeUser.role === 'Father';
  const canSeeConversations = activeUser.role === 'Child' || activeUser.role === 'Father' || activeUser.role === 'Mother';

  return (
    <div className="space-y-6">
      
      {/* Back button and page controls */}
      <div className="flex items-center justify-between">
        <Link 
          href="/travel"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink/60 hover:text-ink transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>返回足迹列表</span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Public / Private toggle (Only for Child/Father) */}
          {canModify && !isEditing && (
            <button
              onClick={handleToggleVisibility}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-1.5 text-xs font-semibold shadow-sm transition-all ${
                entry.visibility === 'public'
                  ? 'border-sage/40 bg-sage/5 text-sage hover:bg-sage/10'
                  : 'border-book-border bg-paper/60 text-ink/70 hover:bg-paper'
              }`}
            >
              {entry.visibility === 'public' ? (
                <>
                  <Eye className="h-4 w-4 text-sage" />
                  <span>公开共享中</span>
                </>
              ) : (
                <>
                  <EyeOff className="h-4 w-4" />
                  <span>私密锁存中</span>
                </>
              )}
            </button>
          )}

          {/* Edit / Delete Buttons */}
          {canModify && (
            <>
              {isEditing ? (
                <button
                  onClick={handleSaveEdit}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-terracotta px-3.5 py-1.5 text-xs font-semibold text-parchment shadow-md hover:bg-terracotta/90"
                >
                  <Save className="h-4 w-4" />
                  <span>保存</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-book-border bg-paper/40 px-3.5 py-1.5 text-xs font-semibold text-ink hover:bg-paper"
                >
                  <Edit3 className="h-4 w-4" />
                  <span>编辑</span>
                </button>
              )}
              
              <button
                onClick={handleDelete}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50/50 px-3.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
                <span>删除</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-start">
        
        {/* Left Side: Travel Log details (Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="museum-card p-6 space-y-5">
            
            {/* Title & Metadata */}
            {isEditing ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full font-literary text-2xl font-bold border border-book-border bg-paper/50 px-3 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-terracotta/50"
                  placeholder="旅程标题..."
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={editDestination}
                    onChange={(e) => setEditDestination(e.target.value)}
                    placeholder="目的地"
                    className="w-full text-xs border border-book-border bg-paper/50 px-3 py-1.5 rounded-lg focus:outline-none"
                  />
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full text-xs border border-book-border bg-paper/50 px-3 py-1.5 rounded-lg focus:outline-none"
                  />
                </div>
                <input
                  type="text"
                  value={editImageUrl}
                  onChange={(e) => setEditImageUrl(e.target.value)}
                  placeholder="图片路径 (如: /travel_skiing.png)"
                  className="w-full text-xs border border-book-border bg-paper/50 px-3 py-1.5 rounded-lg focus:outline-none"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <h1 className="font-literary text-2.5xl font-bold text-ink leading-tight">
                  {entry.title}
                </h1>
                
                {/* Meta details */}
                <div className="flex flex-wrap items-center gap-3.5 text-[10px] font-semibold text-ink/40">
                  <span className="flex items-center gap-1 text-terracotta">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{entry.destination}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <UserIcon className="h-3.5 w-3.5" />
                    <span>记录者: {getUserName(entry.created_by)}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>日期: {entry.date}</span>
                  </span>
                </div>
              </div>
            )}

            {/* Display Media preview if image exists */}
            {entry.image_url && !isEditing && (
              <div className="overflow-hidden rounded-xl border border-book-border/50 bg-paper shadow-inner max-h-[450px] flex items-center justify-center">
                <img
                  src={entry.image_url}
                  alt={entry.title}
                  className="w-full max-h-[450px] object-cover"
                />
              </div>
            )}

            {/* Markdown Log Content */}
            <div className="border-t border-book-border/40 pt-5">
              {isEditing ? (
                <textarea
                  rows={14}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full text-sm font-mono border border-book-border bg-paper/50 p-4 rounded-lg focus:outline-none focus:ring-1 focus:ring-terracotta/50"
                  placeholder="使用 Markdown 书写详细旅行经历..."
                />
              ) : (
                <article className="prose prose-sm max-w-none text-ink/90 font-serif leading-relaxed dark:prose-invert">
                  {entry.content ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {entry.content}
                    </ReactMarkdown>
                  ) : (
                    <p className="text-xs italic text-ink/30">这篇旅程没有添加文字内容。</p>
                  )}
                </article>
              )}
            </div>

          </div>
        </div>

        {/* Right Side: Co-creation dialogue panel (Private to family) */}
        <div className="space-y-6">
          {canSeeConversations ? (
            <div className="museum-card flex flex-col h-[520px] justify-between p-4">
              
              {/* Header */}
              <div className="border-b border-book-border/50 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4.5 w-4.5 text-terracotta" />
                  <h3 className="font-display text-sm font-bold text-ink">父子行纪共创区</h3>
                </div>
                <p className="text-[10px] text-ink/50 mt-0.5">商讨下一次出发的准备，或者在这里共同回忆旅途中的欢笑瞬间。</p>
              </div>

              {/* Message Script View */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
                {conversations.length > 0 ? (
                  conversations.map((msg) => {
                    const senderRole = getUserRole(msg.sender_id);
                    const isFather = senderRole === 'Father';
                    
                    return (
                      <div key={msg.id} className="space-y-1 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${
                            isFather ? 'text-terracotta' : 'text-sage'
                          }`}>
                            {getUserName(msg.sender_id)}：
                          </span>
                          <span className="text-[8px] text-ink/30 font-semibold">
                            {new Date(msg.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        
                        <div className={`rounded-xl px-3.5 py-2.5 text-xs leading-relaxed ${
                          isFather 
                            ? 'bg-terracotta/5 border border-terracotta/10 text-ink font-serif'
                            : 'bg-sage/5 border border-sage/10 text-ink font-serif'
                        }`}>
                          {msg.content}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center text-ink/30 px-4">
                    <MessageSquare className="h-8 w-8 text-ink/10 mb-2" />
                    <h4 className="text-xs font-bold">暂无足迹对话</h4>
                    <p className="text-[10px] text-ink/40 mt-0.5">{fatherName}和渊裕可以在这里聊天——{fatherName}提问：“你最喜欢泰山的哪部分？”，孩子来回答，共同记录成长记忆！</p>
                  </div>
                )}
              </div>

              {/* Chat Input form */}
              {(activeUser.role === 'Father' || activeUser.role === 'Child') ? (
                <form onSubmit={handleSendMessage} className="border-t border-book-border/50 pt-3 mt-3 flex gap-2">
                  <input
                    type="text"
                    placeholder={`${activeUser.role === 'Father' ? `${fatherName}，给这趟旅程留言或计划建议...` : `渊裕，写写你对这趟旅行的想法...`}`}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 rounded-lg border border-book-border bg-paper/60 px-3.5 py-2 text-xs font-medium text-ink placeholder:text-ink/30 focus:outline-none focus:ring-1 focus:ring-terracotta/50"
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-ink text-parchment p-2.5 transition-all hover:bg-ink/90 active:scale-[0.98]"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              ) : (
                <div className="border-t border-book-border/50 pt-3 mt-3 text-center text-[10px] text-ink/40 italic">
                  只有 {fatherName} 和渊裕可以发表留言对话。
                </div>
              )}

            </div>
          ) : (
            <div className="museum-card p-6 text-center text-ink/40 flex flex-col items-center justify-center h-[280px]">
              <EyeOff className="h-8 w-8 text-ink/20 mb-2" />
              <h4 className="text-xs font-bold">私密对话不可见</h4>
              <p className="text-[10px] text-ink/40 mt-1 max-w-xs leading-relaxed">
                按照产品安全隐私原则，足迹共创留言对话区域为私密内容。访客用户无法浏览或参与。
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
