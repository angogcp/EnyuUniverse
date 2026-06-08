"use client";

import React, { useState, useEffect } from 'react';
import { db, Character, World, User } from '@/lib/db';
import { 
  Compass, Plus, Target, Heart, Sparkles, 
  BookOpen, HelpCircle, Eye, ShieldAlert, ArrowRight, Shield 
} from 'lucide-react';

export default function WorldbuildingPage() {
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [worlds, setWorlds] = useState<World[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [activeTab, setActiveTab] = useState<'characters' | 'worlds'>('characters');

  // Form states
  const [showAddModal, setShowAddModal] = useState(false);
  const [charName, setCharName] = useState('');
  const [charDesc, setCharDesc] = useState('');
  const [charDream, setCharDream] = useState('');
  const [charWeakness, setCharWeakness] = useState('');
  const [charPersonality, setCharPersonality] = useState('');
  
  const [worldName, setWorldName] = useState('');
  const [worldDesc, setWorldDesc] = useState('');
  const [worldRules, setWorldRules] = useState('');
  const [worldHistory, setWorldHistory] = useState('');

  useEffect(() => {
    setActiveUser(db.getActiveUser());
    setWorlds(db.getWorlds());
    setCharacters(db.getCharacters());

    const handleStorageChange = () => {
      setActiveUser(db.getActiveUser());
      setWorlds(db.getWorlds());
      setCharacters(db.getCharacters());
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleCreateCharacter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!charName.trim()) return;

    db.createCharacter({
      name: charName,
      description: charDesc,
      dream: charDream,
      weakness: charWeakness,
      personality: charPersonality,
      related_artwork_ids: [],
    });

    // Reset Form
    setCharName('');
    setCharDesc('');
    setCharDream('');
    setCharWeakness('');
    setCharPersonality('');
    setShowAddModal(false);
    setCharacters(db.getCharacters());
  };

  const handleCreateWorld = (e: React.FormEvent) => {
    e.preventDefault();
    if (!worldName.trim()) return;

    db.createWorld({
      name: worldName,
      description: worldDesc,
      rules: worldRules,
      history: worldHistory,
    });

    // Reset Form
    setWorldName('');
    setWorldDesc('');
    setWorldRules('');
    setWorldHistory('');
    setShowAddModal(false);
    setWorlds(db.getWorlds());
  };

  if (!activeUser) return null;

  const canModify = activeUser.role === 'Child' || activeUser.role === 'Father';

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-literary text-3xl font-bold tracking-tight text-ink">世界观实验室</h1>
          <p className="text-xs text-ink/50 mt-1">在这里创造人物设定与星系秩序，构建你庞大的虚构帝国背景。</p>
        </div>

        {canModify && (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-terracotta px-4.5 py-2.5 text-sm font-semibold text-parchment shadow-md transition-all hover:bg-terracotta/90"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>{activeTab === 'characters' ? '创造新角色' : '设定新世界'}</span>
          </button>
        )}
      </div>

      {/* Tab Selectors */}
      <div className="flex border-b border-book-border/50">
        <button
          onClick={() => setActiveTab('characters')}
          className={`flex items-center gap-2 border-b-2 px-6 py-3 text-xs font-bold uppercase tracking-wider transition-all ${
            activeTab === 'characters'
              ? 'border-terracotta text-terracotta'
              : 'border-transparent text-ink/50 hover:text-ink'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          <span>角色卡馆 ({characters.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('worlds')}
          className={`flex items-center gap-2 border-b-2 px-6 py-3 text-xs font-bold uppercase tracking-wider transition-all ${
            activeTab === 'worlds'
              ? 'border-terracotta text-terracotta'
              : 'border-transparent text-ink/50 hover:text-ink'
          }`}
        >
          <Compass className="h-4 w-4" />
          <span>星系与文明 ({worlds.length})</span>
        </button>
      </div>

      {/* Content views */}
      {activeTab === 'characters' ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {characters.map((char) => (
            <div key={char.id} className="museum-card overflow-hidden flex flex-col justify-between">
              {char.image_url && (
                <div className="relative h-44 w-full border-b border-book-border/20 bg-paper/50 overflow-hidden">
                  <img
                    src={char.image_url}
                    alt={char.name}
                    className="w-full h-full object-cover transition-all duration-500 hover:scale-[1.03]"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-ink/10 to-transparent" />
                </div>
              )}
              <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-start justify-between border-b border-book-border/30 pb-3">
                    <div>
                      <h3 className="font-literary text-lg font-bold text-ink">{char.name}</h3>
                      <p className="text-[10px] text-ink/40 font-semibold mt-0.5">创建于: {new Date(char.created_at).toLocaleDateString('zh-CN')}</p>
                    </div>
                    <span className="rounded-full bg-sage/10 px-2.5 py-0.5 text-[9px] font-bold text-sage">角色人设</span>
                  </div>

                  <div className="space-y-3 text-xs leading-relaxed text-ink/80">
                    <div>
                      <span className="font-bold text-ink/65 block">背景简述：</span>
                      <p className="font-serif bg-paper/30 p-2.5 rounded border border-book-border/40 mt-1">{char.description || '暂无描述'}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-1">
                      <div className="space-y-1">
                        <span className="font-bold text-terracotta block">核心梦想 (Dream)：</span>
                        <p className="font-serif text-[11px] leading-relaxed bg-terracotta/5 p-2 rounded border border-terracotta/10">{char.dream || '未设定'}</p>
                      </div>
                      
                      <div className="space-y-1">
                        <span className="font-bold text-ink/65 block">性格特征 (Personality)：</span>
                        <p className="font-serif text-[11px] leading-relaxed bg-paper/40 p-2 rounded border border-book-border/50">{char.personality || '未设定'}</p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="font-bold text-red-700/80 block">致命弱点 (Weakness)：</span>
                      <p className="font-serif text-[11px] leading-relaxed bg-red-50/20 p-2 rounded border border-red-100">{char.weakness || '未设定'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {characters.length === 0 && (
            <div className="md:col-span-2 text-center py-12 text-ink/40 border border-dashed border-book-border rounded-xl">
              没有找到已创建的角色卡。
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {worlds.map((world) => (
            <div key={world.id} className="museum-card p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-book-border/30 pb-3">
                <div>
                  <h3 className="font-literary text-xl font-bold text-ink">{world.name}</h3>
                  <p className="text-[10px] text-ink/40 font-semibold mt-0.5">起源时间: {new Date(world.created_at).toLocaleDateString('zh-CN')}</p>
                </div>
                <span className="rounded-full bg-terracotta/10 px-2.5 py-0.5 text-[9px] font-bold text-terracotta">宇宙大纲</span>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-1 space-y-2">
                  <h4 className="text-xs font-bold text-ink/65 uppercase tracking-wider flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5 text-sage" />
                    <span>世界简介</span>
                  </h4>
                  <p className="text-xs leading-relaxed text-ink/85 font-serif bg-paper/30 p-3.5 rounded-lg border border-book-border/40">
                    {world.description}
                  </p>
                </div>

                <div className="lg:col-span-1 space-y-2">
                  <h4 className="text-xs font-bold text-terracotta uppercase tracking-wider flex items-center gap-1">
                    <Target className="h-3.5 w-3.5 text-terracotta" />
                    <span>铁律/运行法则 (Rules)</span>
                  </h4>
                  <div className="text-xs leading-relaxed text-ink/85 font-serif bg-terracotta/5 p-3.5 rounded-lg border border-terracotta/10 whitespace-pre-line">
                    {world.rules || '暂无设定'}
                  </div>
                </div>

                <div className="lg:col-span-1 space-y-2">
                  <h4 className="text-xs font-bold text-ink/65 uppercase tracking-wider flex items-center gap-1">
                    <Compass className="h-3.5 w-3.5 text-accent" />
                    <span>历史纪元 (History)</span>
                  </h4>
                  <div className="text-xs leading-relaxed text-ink/85 font-serif bg-paper/40 p-3.5 rounded-lg border border-book-border/50 whitespace-pre-line">
                    {world.history || '暂无设定'}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {worlds.length === 0 && (
            <div className="text-center py-12 text-ink/40 border border-dashed border-book-border rounded-xl">
              没有找到已设定的星系大纲。
            </div>
          )}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-book-border bg-parchment p-6 shadow-2xl animate-in scale-in duration-200">
            <h2 className="font-literary text-xl font-bold text-ink mb-4">
              {activeTab === 'characters' ? '创造新人物设定' : '设定新文明大纲'}
            </h2>

            {activeTab === 'characters' ? (
              <form onSubmit={handleCreateCharacter} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-ink/60 uppercase tracking-wider mb-1">人物姓名</label>
                  <input
                    type="text"
                    required
                    placeholder="例如: 洛萨将军, 阿尔托..."
                    value={charName}
                    onChange={(e) => setCharName(e.target.value)}
                    className="w-full rounded-lg border border-book-border bg-paper/40 px-3.5 py-2 text-xs font-medium text-ink focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink/60 uppercase tracking-wider mb-1">背景故事/描述</label>
                  <textarea
                    rows={3}
                    placeholder="人物的身世背景，在世界里扮演什么角色..."
                    value={charDesc}
                    onChange={(e) => setCharDesc(e.target.value)}
                    className="w-full rounded-lg border border-book-border bg-paper/40 px-3.5 py-2 text-xs font-medium text-ink focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-terracotta uppercase tracking-wider mb-1">核心梦想 / 信念</label>
                    <input
                      type="text"
                      placeholder="他最想要实现什么？"
                      value={charDream}
                      onChange={(e) => setCharDream(e.target.value)}
                      className="w-full rounded-lg border border-book-border bg-paper/40 px-3.5 py-2 text-xs font-medium text-ink focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-ink/60 uppercase tracking-wider mb-1">性格设定</label>
                    <input
                      type="text"
                      placeholder="开朗、谨慎、孤僻等"
                      value={charPersonality}
                      onChange={(e) => setCharPersonality(e.target.value)}
                      className="w-full rounded-lg border border-book-border bg-paper/40 px-3.5 py-2 text-xs font-medium text-ink focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-red-700/80 uppercase tracking-wider mb-1">致命弱点 (塑造角色弧光的核心)</label>
                  <input
                    type="text"
                    placeholder="什么样的性格或外部阻碍会让他面临危机？"
                    value={charWeakness}
                    onChange={(e) => setCharWeakness(e.target.value)}
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
                    归入人设案卷
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleCreateWorld} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-ink/60 uppercase tracking-wider mb-1">世界/文明名称</label>
                  <input
                    type="text"
                    required
                    placeholder="例如: 艾尔德兰帝国, 泰拉星区..."
                    value={worldName}
                    onChange={(e) => setWorldName(e.target.value)}
                    className="w-full rounded-lg border border-book-border bg-paper/40 px-3.5 py-2 text-xs font-medium text-ink focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink/60 uppercase tracking-wider mb-1">世界简介</label>
                  <textarea
                    rows={3}
                    placeholder="这是个什么样的世界？它面临着怎样的核心危机或生存法则？"
                    value={worldDesc}
                    onChange={(e) => setWorldDesc(e.target.value)}
                    className="w-full rounded-lg border border-book-border bg-paper/40 px-3.5 py-2 text-xs font-medium text-ink focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-terracotta uppercase tracking-wider mb-1">世界运行铁律 (Rules)</label>
                  <textarea
                    rows={3}
                    placeholder="例如:\n1. 严禁超光速通讯。\n2. 圣树周围无法使用攻击性魔法..."
                    value={worldRules}
                    onChange={(e) => setWorldRules(e.target.value)}
                    className="w-full rounded-lg border border-book-border bg-paper/40 px-3.5 py-2 text-xs font-medium text-ink focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink/60 uppercase tracking-wider mb-1">历史大纲纪元 (History)</label>
                  <textarea
                    rows={3}
                    placeholder="简述关键的历史大事件和时间节点..."
                    value={worldHistory}
                    onChange={(e) => setWorldHistory(e.target.value)}
                    className="w-full rounded-lg border border-book-border bg-paper/40 px-3.5 py-2 text-xs font-medium text-ink focus:outline-none font-mono"
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
                    确立新宇宙法案
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
