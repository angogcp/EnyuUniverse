"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { db, BlogPost, Conversation, User } from '@/lib/db';
import { 
  ArrowLeft, Calendar, MapPin, Globe, Lock, Send, 
  MessageSquare, Trash2, Edit3, Save, User as UserIcon 
} from 'lucide-react';

export default function BlogDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [post, setPost] = useState<BlogPost | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  // Chat state
  const [newMessage, setNewMessage] = useState('');

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editLocation, setEditLocation] = useState('');

  useEffect(() => {
    const user = db.getActiveUser();
    setActiveUser(user);
    setUsers(db.getUsers());

    const bp = db.getBlogPostById(id);
    if (!bp) {
      return;
    }

    // Role check: Guest user can ONLY see public posts
    if (user.role === 'Guest' && bp.visibility === 'private') {
      router.push('/blog'); // Redirect unauthorized
      return;
    }

    setPost(bp);
    setEditTitle(bp.title);
    setEditContent(bp.content);
    setEditLocation(bp.location || '');
    setConversations(db.getConversations(bp.id));

    // Event listener for active role change
    const handleStorageChange = () => {
      const updatedUser = db.getActiveUser();
      setActiveUser(updatedUser);
      
      const updatedPost = db.getBlogPostById(id);
      if (!updatedPost || (updatedUser.role === 'Guest' && updatedPost.visibility === 'private')) {
        router.push('/blog');
      } else {
        setPost(updatedPost);
        setConversations(db.getConversations(updatedPost.id));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [id, router]);

  if (!post || !activeUser) {
    return (
      <div className="text-center py-12 text-ink/50">
        日志不存在或加载中...
      </div>
    );
  }

  // Find sender helpers
  const fatherName = users.find(u => u.role === 'Father')?.name || '爸爸';
  const motherName = users.find(u => u.role === 'Mother')?.name || '妈妈';

  const getUserName = (userId: string) => {
    return users.find(u => u.id === userId)?.name || '未知成员';
  };

  const getUserRole = (userId: string) => {
    return users.find(u => u.id === userId)?.role || 'Guest';
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    db.addMessage(post.id, newMessage);
    setNewMessage('');
    setConversations(db.getConversations(post.id));
    
    // Dispatch storage event to alert other tabs/components
    window.dispatchEvent(new Event('storage'));
  };

  const handleSaveEdit = () => {
    const updated = db.updateBlogPost(post.id, {
      title: editTitle,
      content: editContent,
      location: editLocation || undefined,
    });
    setPost(updated);
    setIsEditing(false);
    
    // Dispatch storage event to alert other tabs/components
    window.dispatchEvent(new Event('storage'));
  };

  const handleDelete = () => {
    if (confirm('确定要彻底删除这篇日志吗？')) {
      db.deleteBlogPost(post.id);
      router.push('/blog');
      
      // Dispatch storage event to alert other tabs/components
      window.dispatchEvent(new Event('storage'));
    }
  };

  const isAuthor = activeUser.id === post.created_by;
  const canModify = activeUser.role === 'Child' || activeUser.role === 'Father';
  const authorName = getUserName(post.created_by);
  const authorAvatar = post.created_by === 'user-father' 
    ? 'https://api.dicebear.com/7.x/bottts/svg?seed=father'
    : 'https://api.dicebear.com/7.x/bottts/svg?seed=enyu';

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4 pb-20">
      
      {/* Back navigation & Actions */}
      <div className="flex items-center justify-between">
        <Link 
          href="/blog"
          className="inline-flex items-center gap-1 text-xs font-semibold text-ink/60 hover:text-ink transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>返回日志列表</span>
        </Link>

        {canModify && isAuthor && (
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSaveEdit}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-sage px-3.5 py-1.5 text-xs font-semibold text-parchment shadow-sm hover:bg-sage/90"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>保存</span>
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="rounded-lg border border-book-border bg-paper/40 px-3.5 py-1.5 text-xs font-semibold text-ink hover:bg-paper"
                >
                  取消
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-book-border bg-paper/60 px-3.5 py-1.5 text-xs font-semibold text-ink hover:bg-paper"
                >
                  <Edit3 className="h-3.5 w-3.5 text-ink/50" />
                  <span>编辑</span>
                </button>
                <button
                  onClick={handleDelete}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-book-border bg-paper/60 px-3.5 py-1.5 text-xs font-semibold text-terracotta hover:bg-paper"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>删除</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Main Post Card */}
      <article className="museum-card overflow-hidden bg-paper/10 border border-book-border/60 p-6 md:p-10 space-y-6">
        
        {/* Cover Image */}
        {!isEditing && post.image_url && (
          <div className="relative h-64 md:h-80 w-full overflow-hidden rounded-xl border border-book-border/50 bg-paper">
            <img 
              src={post.image_url} 
              alt={post.title}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        {/* Metadata Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-book-border/40 pb-5">
          <div className="flex items-center gap-3">
            <img 
              src={authorAvatar} 
              alt={authorName} 
              className="h-10 w-10 rounded-full bg-paper p-0.5 border border-book-border"
            />
            <div>
              <div className="text-xs font-bold text-ink">{authorName}</div>
              <div className="text-[10px] text-ink/40 uppercase font-semibold">作者</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-ink/65 font-serif">
            {isEditing ? (
              <div className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-orange-500" />
                <input
                  type="text"
                  placeholder="发布地点"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="rounded border border-book-border bg-paper/50 px-2 py-0.5 text-xs text-ink focus:outline-none"
                />
              </div>
            ) : (
              post.location && (
                <span className="inline-flex items-center gap-1 bg-paper px-2.5 py-1 rounded border border-book-border/50">
                  <MapPin className="h-3.5 w-3.5 text-orange-500" />
                  {post.location}
                </span>
              )
            )}
            
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(post.created_at).toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>

            {post.visibility === 'private' ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-orange-700 font-sans text-[10px] font-bold">
                <Lock className="h-3 w-3" />
                私密 (家庭内)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-green-700 font-sans text-[10px] font-bold">
                <Globe className="h-3 w-3" />
                公开 (访客可见)
              </span>
            )}
          </div>
        </div>

        {/* Content Body */}
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-ink/60 uppercase tracking-wider mb-1">日志标题</label>
              <input
                type="text"
                required
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full rounded-lg border border-book-border bg-paper/40 px-3.5 py-2.5 text-sm font-semibold text-ink focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-ink/60 uppercase tracking-wider mb-1">正文内容 (支持 Markdown)</label>
              <textarea
                required
                rows={12}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full rounded-lg border border-book-border bg-paper/40 px-3.5 py-2 text-xs font-medium text-ink focus:outline-none font-serif leading-relaxed"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="font-literary text-2.5xl font-bold text-ink leading-tight">
              {post.title}
            </h2>
            
            <div className="prose prose-sm md:prose-base max-w-none text-ink/90 font-serif leading-relaxed space-y-4 pt-4 border-t border-book-border/20">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {post.content}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </article>

      {/* Co-creation Chat (Family Only) */}
      {activeUser.role !== 'Guest' ? (
        <section className="space-y-6">
          <div className="flex items-center gap-2 border-b border-book-border/40 pb-3">
            <MessageSquare className="h-5 w-5 text-terracotta" />
            <h3 className="font-literary text-lg font-bold text-ink">双城共创对话板</h3>
            <span className="rounded bg-paper border border-book-border/50 px-2 py-0.5 text-xs text-ink/50">
              {conversations.length} 条对话
            </span>
          </div>

          {/* Message List */}
          <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2">
            {conversations.length > 0 ? (
              conversations.map((msg) => {
                const isMsgAuthor = msg.sender_id === activeUser.id;
                const senderRole = getUserRole(msg.sender_id);
                const senderName = getUserName(msg.sender_id);
                const senderAvatar = msg.sender_id === 'user-father' 
                  ? 'https://api.dicebear.com/7.x/bottts/svg?seed=father'
                  : msg.sender_id === 'user-child'
                  ? 'https://api.dicebear.com/7.x/bottts/svg?seed=enyu'
                  : 'https://api.dicebear.com/7.x/bottts/svg?seed=mother';

                return (
                  <div 
                    key={msg.id}
                    className={`flex gap-3 max-w-2xl ${isMsgAuthor ? 'ml-auto flex-row-reverse' : ''}`}
                  >
                    <img 
                      src={senderAvatar} 
                      alt={senderName}
                      className="h-8 w-8 rounded-full bg-paper p-0.5 border border-book-border shrink-0" 
                    />
                    
                    <div className="space-y-1 max-w-[85%]">
                      {/* Name & Role */}
                      <div className={`flex items-baseline gap-1.5 text-[10px] font-semibold tracking-wider uppercase text-ink/40 ${isMsgAuthor ? 'justify-end' : ''}`}>
                        <span>{senderName}</span>
                        <span className={`rounded-full px-1.5 py-0.2 text-[8px] font-bold ${
                          senderRole === 'Father' ? 'bg-terracotta/15 text-terracotta' :
                          senderRole === 'Child' ? 'bg-sage/15 text-sage' : 'bg-gold/15 text-gold'
                        }`}>
                          {senderRole}
                        </span>
                        <span>•</span>
                        <span>{new Date(msg.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      {/* Bubble */}
                      <div className={`rounded-xl px-4 py-2.5 text-xs shadow-sm font-serif leading-relaxed ${
                        isMsgAuthor 
                          ? 'bg-terracotta text-parchment rounded-tr-none'
                          : 'bg-paper text-ink border border-book-border/70 rounded-tl-none'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-xs text-ink/40 font-serif">
                还没有留下只言片语。快写点感想或者留言，给远方的家人送去问候吧！
              </div>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              required
              placeholder={`以【${activeUser.name}】身份发表留言...`}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 rounded-xl border border-book-border bg-paper/60 px-4 py-2.5 text-xs text-ink focus:outline-none placeholder-ink/30"
            />
            <button
              type="submit"
              className="rounded-xl bg-ink text-parchment px-4.5 py-2.5 text-xs font-semibold shadow-md transition-all hover:bg-ink/90 active:scale-[0.98]"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </section>
      ) : (
        <section className="rounded-xl border border-dashed border-book-border/70 p-6 text-center text-ink/40 max-w-md mx-auto my-6 bg-paper/20">
          <UserIcon className="h-8 w-8 text-ink/20 mx-auto mb-2" />
          <h4 className="text-xs font-bold text-ink/70">评论区已隐藏</h4>
          <p className="text-[10px] text-ink/40 mt-1 leading-relaxed">
            仅家庭内阁成员（渊裕、{fatherName}、{motherName}）可以查看双城共创对话板并留言互动。
          </p>
        </section>
      )}

    </div>
  );
}
