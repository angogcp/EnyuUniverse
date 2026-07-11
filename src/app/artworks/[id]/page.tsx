"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { db, Artwork, Conversation, User } from '@/lib/db';
import { 
  ArrowLeft, Eye, EyeOff, Send, MessageSquare, 
  Calendar, FileText, User as UserIcon, Trash2, Edit3, Save, Sparkles,
  ChevronLeft, ChevronRight
} from 'lucide-react';

export default function ArtworkDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  // Chat state
  const [newMessage, setNewMessage] = useState('');
  
  // Gallery state for AI co-creation blueprints
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);

  // AI Companion state
  const [aiQuestions, setAiQuestions] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [empathyTriggered, setEmpathyTriggered] = useState(false);
  const [hasFetchedAi, setHasFetchedAi] = useState(false);

  const handleFetchAiQuestions = async () => {
    if (!artwork) return;
    setAiLoading(true);
    try {
      const res = await fetch('/api/companion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: artwork.title,
          content: artwork.description || '',
          type: artwork.type,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiQuestions(data.questions || []);
        setEmpathyTriggered(data.empathyTriggered || false);
        setHasFetchedAi(true);
      }
    } catch (e) {
      console.error('Failed to load AI companion questions', e);
    } finally {
      setAiLoading(false);
    }
  };

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editTags, setEditTags] = useState('');

  useEffect(() => {
    const user = db.getActiveUser();
    setActiveUser(user);
    setUsers(db.getUsers());

    const art = db.getArtworkById(id);
    if (!art) {
      return;
    }

    // Role check: Guest user can ONLY see public artworks
    if (user.role === 'Guest' && art.visibility === 'private') {
      router.push('/artworks'); // Redirect unauthorized
      return;
    }

    setArtwork(art);
    setEditTitle(art.title);
    setEditDesc(art.description || '');
    setEditTags(art.tags.join(', '));
    setConversations(db.getConversations(id));

    // Event listener for active role change
    const handleStorageChange = () => {
      const updatedUser = db.getActiveUser();
      setActiveUser(updatedUser);
      
      const updatedArt = db.getArtworkById(id);
      if (!updatedArt || (updatedUser.role === 'Guest' && updatedArt.visibility === 'private')) {
        router.push('/artworks');
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [id, router]);

  if (!artwork || !activeUser) {
    return (
      <div className="text-center py-12 text-ink/50">
        作品不存在或加载中...
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

    db.addMessage(artwork.id, newMessage);
    setNewMessage('');
    setConversations(db.getConversations(artwork.id));
  };

  const handleToggleVisibility = () => {
    // PRD: Child can toggle visibility (public/private)
    if (activeUser.role !== 'Child' && activeUser.role !== 'Father') return;
    const newVis = artwork.visibility === 'public' ? 'private' : 'public';
    const updated = db.updateArtwork(artwork.id, { visibility: newVis });
    setArtwork(updated);
  };

  const handleSaveEdit = () => {
    const updatedTags = editTags.split(/[,，\s]+/).filter(t => t.trim() !== '');
    const updated = db.updateArtwork(artwork.id, {
      title: editTitle,
      description: editDesc,
      tags: updatedTags
    });
    setArtwork(updated);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirm('确定要删除这件作品吗？这也会删除所有相关的父子共创对话。')) {
      db.deleteArtwork(artwork.id);
      router.push('/artworks');
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
          href="/artworks"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink/60 hover:text-ink transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>返回作品列表</span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Public / Private toggle (Only for Child/Father) */}
          {canModify && !isEditing && (
            <button
              onClick={handleToggleVisibility}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-1.5 text-xs font-semibold shadow-sm transition-all ${
                artwork.visibility === 'public'
                  ? 'border-sage/40 bg-sage/5 text-sage hover:bg-sage/10'
                  : 'border-book-border bg-paper/60 text-ink/70 hover:bg-paper'
              }`}
            >
              {artwork.visibility === 'public' ? (
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
        
        {/* Left Side: Artwork Display & Description (Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="museum-card p-6 space-y-4">
            
            {/* Title & Metadata */}
            {isEditing ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full font-literary text-2xl font-bold border border-book-border bg-paper/50 px-3 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-terracotta/50"
                />
                <input
                  type="text"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  placeholder="标签 (逗号分隔)"
                  className="w-full text-xs border border-book-border bg-paper/50 px-3 py-1.5 rounded-lg focus:outline-none"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <h1 className="font-literary text-2.5xl font-bold text-ink leading-tight">
                  {artwork.title}
                </h1>
                
                {/* Meta details */}
                <div className="flex flex-wrap items-center gap-3.5 text-[10px] font-semibold text-ink/40">
                  <span className="flex items-center gap-1">
                    <UserIcon className="h-3.5 w-3.5" />
                    <span>创作者: {getUserName(artwork.created_by)}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>上传于: {new Date(artwork.created_at).toLocaleString('zh-CN')}</span>
                  </span>
                </div>

                {/* Tags */}
                {artwork.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {artwork.tags.map((tag, i) => (
                      <span 
                        key={i} 
                        className="rounded-full bg-paper/85 border border-book-border/60 px-2.5 py-0.5 text-[10px] font-medium text-ink/65"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Display Media preview if image exists */}
            {artwork.drive_preview_url && (
              <div className="overflow-hidden rounded-xl border border-book-border/50 bg-paper shadow-inner max-h-[450px] flex items-center justify-center">
                <img
                  src={artwork.drive_preview_url}
                  alt={artwork.title}
                  className="w-full max-h-[450px] object-contain"
                />
              </div>
            )}

            {/* Markdown Document Content */}
            <div className="border-t border-book-border/40 pt-5">
              {isEditing ? (
                <textarea
                  rows={12}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full text-sm font-mono border border-book-border bg-paper/50 p-4 rounded-lg focus:outline-none focus:ring-1 focus:ring-terracotta/50"
                />
              ) : (
                <article className="prose prose-sm max-w-none text-ink/90 font-serif leading-relaxed dark:prose-invert">
                  {artwork.description ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {artwork.description}
                    </ReactMarkdown>
                  ) : (
                    <p className="text-xs italic text-ink/30">这件作品没有添加文字描述。</p>
                  )}
                </article>
              )}
            </div>

            {/* AI Co-creation Blueprint Gallery */}
            {artwork.gallery_images && artwork.gallery_images.length > 0 && (
              <div className="border-t border-book-border/40 pt-6 mt-6 space-y-4">
                <div className="flex items-center gap-2 pb-1">
                  <Sparkles className="h-4.5 w-4.5 text-terracotta" />
                  <h3 className="font-display text-sm font-bold text-ink">
                    AI 蓝图重构实验室 (Co-creation Blueprints)
                  </h3>
                </div>
                <p className="text-xs text-ink/65 leading-relaxed font-serif">
                  基于渊裕的构想，AI 协作渲染出了该飞船的多维宇宙探索图景：
                </p>

                {/* Slideshow */}
                <div className="relative rounded-xl border border-book-border/50 bg-paper overflow-hidden h-72 md:h-96 flex items-center justify-center group shadow-md">
                  <img
                    src={artwork.gallery_images[activeGalleryIndex]}
                    alt={`AI Blueprint Variant ${activeGalleryIndex + 1}`}
                    className="w-full h-full object-cover transition-all duration-500"
                  />
                  
                  {/* Left / Right arrows */}
                  {artwork.gallery_images.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setActiveGalleryIndex((prev) => (prev === 0 ? artwork.gallery_images!.length - 1 : prev - 1))}
                        className="absolute left-3 p-1.5 rounded-full bg-parchment/85 border border-book-border text-ink hover:bg-parchment hover:shadow shadow-sm transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 z-10"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveGalleryIndex((prev) => (prev === artwork.gallery_images!.length - 1 ? 0 : prev + 1))}
                        className="absolute right-3 p-1.5 rounded-full bg-parchment/85 border border-book-border text-ink hover:bg-parchment hover:shadow shadow-sm transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 z-10"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </>
                  )}

                  {/* Caption & Status */}
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-lg bg-ink/75 backdrop-blur-sm px-3.5 py-2 text-[10px] text-parchment font-semibold z-10">
                    <span>
                      图纸 {activeGalleryIndex + 1} / {artwork.gallery_images.length}：
                      {activeGalleryIndex === 0 && "星空跃迁 - 穿梭纳米虫洞"}
                      {activeGalleryIndex === 1 && "帝国船坞 - 停泊太空轨道站"}
                      {activeGalleryIndex === 2 && "晶冕行星 - 巡航甲烷冰川"}
                    </span>
                    <span className="rounded bg-terracotta/90 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-parchment">
                      AI 协同生成
                    </span>
                  </div>
                </div>

                {/* Dots / Thumbnails */}
                <div className="flex justify-center gap-2 pt-1 pb-3">
                  {artwork.gallery_images.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveGalleryIndex(idx)}
                      className={`h-2 rounded-full transition-all ${
                        activeGalleryIndex === idx ? 'w-6 bg-terracotta' : 'w-2 bg-book-border'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Google Drive index meta */}
            {artwork.drive_file_id && (
              <div className="rounded-lg bg-paper/40 border border-book-border/40 px-4 py-3 flex items-center justify-between text-[10px] text-ink/50 font-semibold">
                <span className="flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-sage" />
                  <span>Google Drive 备份索引 ID: <code className="bg-paper px-1 rounded font-mono text-[9px]">{artwork.drive_file_id}</code></span>
                </span>
                <span className="text-sage text-[9px] uppercase tracking-wider">文件已安全归档</span>
              </div>
            )}

          </div>
        </div>

        {/* Right Side: Co-creation dialogue panel (Private to family) */}
        <div className="space-y-6">
          {canSeeConversations ? (
            <>
              {/* Co-creation Chat Panel */}
              <div className="museum-card flex flex-col h-[520px] justify-between p-4">
                
                {/* Header */}
                <div className="border-b border-book-border/50 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4.5 w-4.5 text-terracotta" />
                    <h3 className="font-display text-sm font-bold text-ink">父子共同创作区</h3>
                  </div>
                  <p className="text-[10px] text-ink/50 mt-0.5">这不是普通的评论区，而是你们对话与共创故事的私密沙龙。</p>
                </div>

                {/* Message Script View */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
                  {conversations.length > 0 ? (
                    conversations.map((msg) => {
                      const senderRole = getUserRole(msg.sender_id);
                      const isFather = senderRole === 'Father';
                      
                      return (
                        <div key={msg.id} className="space-y-1 animate-in fade-in duration-200">
                          {/* Script-style labeling */}
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
                          
                          {/* Boxed Content */}
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
                      <h4 className="text-xs font-bold">暂无对话记录</h4>
                      <p className="text-[10px] text-ink/40 mt-0.5">{fatherName}可以在这里提问（如“它有什么弱点？”），孩子来补充设定，一起丰富这个宇宙！</p>
                    </div>
                  )}
                </div>

                {/* Chat Input form (Mother can view but maybe cannot post, or can post. Let's allow Father and Child only) */}
                {(activeUser.role === 'Father' || activeUser.role === 'Child') ? (
                  <form onSubmit={handleSendMessage} className="border-t border-book-border/50 pt-3 mt-3 flex gap-2">
                    <input
                      type="text"
                      placeholder={`${activeUser.role === 'Father' ? `${fatherName}，在这里向孩子提问...` : `渊裕，回复 ${fatherName} 或者补充设定...`}`}
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
                    只有 {fatherName} 和渊裕可以发表共创对话。
                  </div>
                )}

              </div>

              {/* AI Story Companion Panel */}
              <div className="museum-card p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-book-border/50 pb-2">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-gold animate-pulse" />
                    <h3 className="font-display text-xs font-bold text-ink">AI 故事伙伴 (DeepSeek)</h3>
                  </div>
                  {empathyTriggered && (
                    <span className="rounded-full bg-terracotta/15 px-2 py-0.5 text-[8px] font-bold text-terracotta animate-pulse">
                      同理心反思开启
                    </span>
                  )}
                </div>
                
                {hasFetchedAi ? (
                  <div className="space-y-2">
                    <p className="text-[10px] text-ink/50 font-serif leading-relaxed">
                      {empathyTriggered 
                        ? '检测到设定中包含冲突或力量对抗，同理心模块已引导了不同维度的提问。点击问题可快速填入对话框：' 
                        : 'AI 编辑为你的创作提出了以下引导问题，点击可填入对话框：'}
                    </p>
                    <div className="space-y-1.5">
                      {aiQuestions.map((q, i) => (
                        <button
                          key={i}
                          onClick={() => setNewMessage(q)}
                          className="w-full text-left rounded-lg border border-book-border/60 bg-paper/40 p-2 text-[11px] text-ink/80 hover:bg-terracotta/5 hover:border-terracotta/30 transition-all font-serif"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-2 space-y-2">
                    <p className="text-[10px] text-ink/40 font-serif">
                      想要深度挖掘当前作品的世界观设定或情感细节吗？
                    </p>
                    <button
                      onClick={handleFetchAiQuestions}
                      disabled={aiLoading}
                      className="inline-flex items-center gap-2 rounded-lg bg-ink text-parchment px-3 py-1.5 text-xs font-semibold hover:bg-ink/90 disabled:opacity-50"
                    >
                      {aiLoading ? (
                        <>
                          <div className="h-3 w-3 animate-spin rounded-full border-2 border-parchment border-t-transparent" />
                          <span>正在启发提问...</span>
                        </>
                      ) : (
                        <span>获取 AI 启发提问</span>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="museum-card p-6 text-center text-ink/40 flex flex-col items-center justify-center h-[280px]">
              <EyeOff className="h-8 w-8 text-ink/20 mb-2" />
              <h4 className="text-xs font-bold">私密对话不可见</h4>
              <p className="text-[10px] text-ink/40 mt-1 max-w-xs leading-relaxed">
                按照产品安全隐私原则，父子共创对话区域为绝对私密内容。访客用户无法浏览或参与。
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
