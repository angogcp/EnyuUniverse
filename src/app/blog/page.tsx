"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { db, BlogPost, User } from '@/lib/db';
import { gdrive } from '@/lib/gdrive';
import { 
  Plus, Calendar, MapPin, Globe, Lock, MessageSquare, 
  ArrowRight, KeyRound, Sparkles, Send, Trash2, Heart, Image as ImageIcon
} from 'lucide-react';

export default function BlogListPage() {
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  
  // Create Form States
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [location, setLocation] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('private');
  
  // File upload state for blog cover
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setActiveUser(db.getActiveUser());
    setPosts(db.getBlogPosts());

    // Auto-set default location based on role
    const user = db.getActiveUser();
    if (user) {
      if (user.role === 'Father') setLocation('日本・大阪');
      else if (user.role === 'Child') setLocation('巴生滨华中学');
    }

    const handleStorageChange = () => {
      const u = db.getActiveUser();
      setActiveUser(u);
      setPosts(db.getBlogPosts());
      if (u) {
        if (u.role === 'Father') setLocation('日本・大阪');
        else if (u.role === 'Child') setLocation('巴生滨华中学');
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

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

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      let finalImageUrl = undefined;

      // Upload to Google Drive if file is selected
      if (uploadFile) {
        const fileData = {
          name: uploadFile.name,
          type: uploadFile.type,
          contentBase64: imagePreview || undefined
        };
        // Upload to Blog folder on Google Drive (mocked)
        const uploaded = await gdrive.uploadFile(fileData, 'Blog');
        finalImageUrl = uploaded.drive_preview_url;
      } else if (imageUrl.trim()) {
        finalImageUrl = imageUrl.trim();
      }

      db.createBlogPost({
        title,
        content,
        location: location || (activeUser?.role === 'Father' ? '日本・大阪' : '巴生滨华中学'),
        image_url: finalImageUrl,
        visibility,
      });

      // Reset Form
      setTitle('');
      setContent('');
      setImageUrl('');
      setUploadFile(null);
      setImagePreview(null);
      setShowAddModal(false);
      setPosts(db.getBlogPosts());
      
      // Dispatch storage event to keep other tabs/components in sync
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      console.error('Failed to create post:', err);
      alert('发布失败，请检查网络或授权令牌。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePost = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('确定要删除这篇日志吗？')) {
      db.deleteBlogPost(id);
      setPosts(db.getBlogPosts());
      window.dispatchEvent(new Event('storage'));
    }
  };

  if (!activeUser) return null;

  const isGuest = activeUser.role === 'Guest';
  const canModify = activeUser.role === 'Child' || activeUser.role === 'Father';

  // Filter based on privacy settings
  const visiblePosts = isGuest 
    ? posts.filter(p => p.visibility === 'public')
    : posts;

  return (
    <div className="space-y-8 py-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-literary text-3xl font-bold tracking-tight text-ink flex items-center gap-2">
            <span>双城日志</span>
            <span className="text-xs font-semibold rounded bg-orange-100 text-orange-800 px-2 py-0.5 font-sans">
              Osaka ↔ Klang
            </span>
          </h1>
          <p className="text-xs text-ink/50 mt-1 font-serif">
            隔海跨山的空间，拉不远心灵的距离。这里记录着爸爸在大阪生活、渊裕在巴生滨华中学住宿与周末回家的点点滴滴。
          </p>
        </div>

        {canModify && (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-terracotta px-4.5 py-2.5 text-sm font-semibold text-parchment shadow-md transition-all hover:bg-terracotta/90 hover:shadow-lg active:scale-[0.98]"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>写篇生活日志</span>
          </button>
        )}
      </div>

      {/* Main Grid */}
      {visiblePosts.length > 0 ? (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {visiblePosts.map((post) => {
            const commentsCount = db.getConversations(post.id).length;
            const isAuthor = activeUser.id === post.created_by;
            const authorName = post.created_by === 'user-father' ? '爸爸' : '渊裕 (Enyu)';
            const authorAvatar = post.created_by === 'user-father' 
              ? 'https://api.dicebear.com/7.x/bottts/svg?seed=father'
              : 'https://api.dicebear.com/7.x/bottts/svg?seed=enyu';
            
            return (
              <article 
                key={post.id} 
                className="museum-card flex flex-col justify-between overflow-hidden border border-book-border/60 hover:border-terracotta/30 transition-all duration-300 bg-paper/20 group"
              >
                <div>
                  {/* Blog Cover Image */}
                  {post.image_url && (
                    <div className="relative h-48 w-full overflow-hidden border-b border-book-border/50 bg-paper">
                      <img 
                        src={post.image_url} 
                        alt={post.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-102"
                      />
                    </div>
                  )}

                  <div className="p-6 space-y-4">
                    {/* Header info */}
                    <div className="flex items-center justify-between text-[11px] text-ink/40 font-semibold uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <img 
                          src={authorAvatar} 
                          alt={authorName} 
                          className="h-5 w-5 rounded-full bg-paper p-0.5 border border-book-border"
                        />
                        <span className="text-ink/80">{authorName}</span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {post.location && (
                          <span className="inline-flex items-center gap-1 text-ink/60 bg-paper px-2 py-0.5 rounded border border-book-border/50">
                            <MapPin className="h-3 w-3 text-orange-500" />
                            {post.location}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(post.created_at).toLocaleDateString('zh-CN', {
                            month: '2-digit',
                            day: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Title */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <Link href={`/blog/${post.id}`} className="hover:underline">
                          <h3 className="font-literary text-lg font-bold text-ink hover:text-terracotta transition-colors">
                            {post.title}
                          </h3>
                        </Link>
                        
                        <div className="flex items-center gap-2 shrink-0">
                          {post.visibility === 'private' ? (
                            <span className="inline-flex items-center rounded-full bg-orange-50 p-1 text-orange-700" title="私人日志 (仅家人可见)">
                              <Lock className="h-3.5 w-3.5" />
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-green-50 p-1 text-green-700" title="公开日志 (所有人可见)">
                              <Globe className="h-3.5 w-3.5" />
                            </span>
                          )}

                          {canModify && isAuthor && (
                            <button 
                              onClick={(e) => handleDeletePost(post.id, e)}
                              className="text-ink/30 hover:text-terracotta p-1 transition-colors rounded hover:bg-paper/80"
                              title="删除日志"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Markdown Snippet */}
                    <div className="prose prose-sm max-w-none text-xs text-ink/75 font-serif line-clamp-3 leading-relaxed border-t border-book-border/30 pt-3">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {post.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>

                {/* Footer bar */}
                <div className="px-6 py-4.5 bg-paper/10 border-t border-book-border/30 flex items-center justify-between">
                  <Link 
                    href={`/blog/${post.id}`}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-ink/50 group-hover:text-terracotta transition-colors hover:underline"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>共创对话 ({commentsCount})</span>
                  </Link>

                  <Link 
                    href={`/blog/${post.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-terracotta hover:underline"
                  >
                    <span>展开全文与互动</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[300px] rounded-2xl border border-dashed border-book-border/70 p-12 text-center text-ink/40 max-w-lg mx-auto bg-paper/20">
          <Globe className="h-10 w-10 text-ink/20 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-ink/70">还没有写下双城生活日志</h3>
          <p className="text-xs text-ink/40 mt-1 leading-relaxed">
            {isGuest 
              ? '抱歉，当前暂无公开的生活日志可供查阅。'
              : '不管是东京盛开的樱花，吉隆坡热辣的篮球训练，还是那些闪光的思考，都可以记录下来，让远方的家人时刻知道。'
            }
          </p>
          {canModify && (
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-terracotta px-4 py-2 text-xs font-semibold text-parchment transition-all hover:bg-terracotta/90"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>写下第一篇日志</span>
            </button>
          )}
        </div>
      )}

      {/* Add Blog Post Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-book-border bg-parchment p-6 shadow-2xl animate-in scale-in duration-200">
            <h2 className="font-literary text-lg font-bold text-ink mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-terracotta" />
              <span>记下一段生活点滴</span>
            </h2>

            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink/60 uppercase tracking-wider mb-1">日志标题</label>
                <input
                  type="text"
                  required
                  placeholder="例如: 今天在东京看落日 / 下课后的第一幅手稿完成"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-book-border bg-paper/40 px-3.5 py-2 text-xs font-medium text-ink focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-ink/60 uppercase tracking-wider mb-1">发布地点</label>
                  <input
                    type="text"
                    placeholder="日本・东京 / 马来西亚・吉隆坡"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full rounded-lg border border-book-border bg-paper/40 px-3.5 py-2 text-xs font-medium text-ink focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink/60 uppercase tracking-wider mb-1">隐私设定</label>
                  <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value as 'public' | 'private')}
                    className="w-full rounded-lg border border-book-border bg-paper/40 px-3.5 py-2.5 text-xs font-medium text-ink focus:outline-none"
                  >
                    <option value="private">私密 (仅限家庭成员可见)</option>
                    <option value="public">公开 (所有人可见)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink/60 uppercase tracking-wider mb-1">封面图片 (选填)</label>
                <div className="space-y-3">
                  {/* File Upload */}
                  <div className="flex justify-center rounded-lg border border-dashed border-book-border bg-paper/30 px-6 py-4">
                    <div className="text-center w-full">
                      {imagePreview ? (
                        <div className="relative aspect-video w-full max-h-[140px] overflow-hidden rounded-md border border-book-border mx-auto">
                          <img src={imagePreview} className="h-full w-full object-cover mx-auto" alt="preview" />
                          <button 
                            type="button"
                            onClick={() => { setUploadFile(null); setImagePreview(null); }}
                            className="absolute right-1.5 top-1.5 rounded bg-black/70 px-2 py-0.5 text-[9px] font-bold text-white transition-colors hover:bg-black/90"
                          >
                            重选
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <ImageIcon className="mx-auto h-8 w-8 text-ink/30" />
                          <div className="flex text-xs text-ink/60 justify-center">
                            <label className="relative cursor-pointer rounded bg-paper/60 px-2.5 py-1 font-semibold text-terracotta border border-book-border hover:bg-paper">
                              <span>上传日志封面 (保存至 Google Drive)</span>
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
                  
                  {/* Text URL alternative */}
                  {!imagePreview && (
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-book-border/40" />
                      </div>
                      <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
                        <span className="bg-parchment px-2 text-ink/40">或直接贴入线上图片网址</span>
                      </div>
                    </div>
                  )}

                  {!imagePreview && (
                    <input
                      type="url"
                      placeholder="https://example.com/image.jpg (选填)"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="w-full rounded-lg border border-book-border bg-paper/40 px-3.5 py-2 text-xs font-medium text-ink placeholder:text-ink/30 focus:outline-none focus:ring-1 focus:ring-terracotta/50"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink/60 uppercase tracking-wider mb-1">日志内容 (支持 Markdown 语法)</label>
                <textarea
                  required
                  rows={6}
                  placeholder="写点什么... 例如今天的小确幸，或是新作品的构思过程..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full rounded-lg border border-book-border bg-paper/40 px-3.5 py-2 text-xs font-medium text-ink focus:outline-none font-serif leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border border-book-border bg-paper/40 px-4 py-2 text-xs font-semibold text-ink hover:bg-paper disabled:opacity-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-terracotta px-4.5 py-2 text-xs font-semibold text-parchment hover:bg-terracotta/90 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-parchment border-t-transparent" />
                      正在发布...
                    </>
                  ) : (
                    '发布日志'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
