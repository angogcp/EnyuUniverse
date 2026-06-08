"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db, User } from '@/lib/db';
import { gdrive } from '@/lib/gdrive';
import { 
  Building2, Sword, ShieldAlert, Sparkles, HelpCircle, 
  ArrowRight, Landmark, Compass, Eye, EyeOff, BookOpen 
} from 'lucide-react';

interface LabTemplate {
  id: string;
  name: string;
  icon: any;
  tagline: string;
  description: string;
  colorClass: string;
  badgeColor: string;
  prompts: string[];
  markdownTemplate: string;
}

const LAB_TEMPLATES: LabTemplate[] = [
  {
    id: 'empire',
    name: '帝国实验室',
    icon: Landmark,
    tagline: '设定你的文明规则、国家体系或权力同盟。',
    description: '通过建立社会公约、等级或组织结构，思考公平与权力的本质。',
    colorClass: 'border-terracotta bg-terracotta/[0.02]',
    badgeColor: 'bg-terracotta/10 text-terracotta',
    prompts: [
      '为什么其他人会愿意追随这个组织/文明？',
      '在面对内部矛盾时，权力分配如何处理冲突？',
      '这个社会的制度设计，是如何保护弱者不受侵害的？',
      '规则的设计是否对所有人足够公平？是否有特权阶级？',
      '如果帝国在战争中取得胜利，胜利之后要承担怎样的历史责任？'
    ],
    markdownTemplate: `# [文明/帝国名称] 设定卷宗

## 1. 权力架构与制度
- **社会公约/核心法律**：
- **追随者因何团结**（为什么大家愿意追随）：

## 2. 冲突解决与公平
- **内部矛盾处理机制**：
- **对弱者的保护措施**：

## 3. 胜利与责任
- **帝国的大局观**（胜利之后要承担什么责任）：`
  },
  {
    id: 'strategy',
    name: '战略实验室',
    icon: Sword,
    tagline: '推演战争战术、团队协作或公共管理机制。',
    description: '通过对具体的资源分配或冲突方案进行选择，并权衡每次决策的代价。',
    colorClass: 'border-sage bg-sage/[0.02]',
    badgeColor: 'bg-sage/10 text-sage',
    prompts: [
      '为什么在这里做出这样决策？它的底层逻辑是什么？',
      '这个决策的代价是什么？为了得到这个结果，你们牺牲了什么？',
      '这个决定一旦执行，会影响到哪些无辜的群体或普通人？',
      '是否存在其他损害更小、性价比更高的替代方案？'
    ],
    markdownTemplate: `# [战略/演练方案名称] 推演报告

## 1. 核心决策大纲
- **战略目的**：
- **实施计划**：

## 2. 代价与利益相关方
- **本次决策的代价**（我们牺牲了什么）：
- **波及群体分析**（谁会受到影响）：

## 3. 替代方案研判
- **是否存在其他更好、损害更小的方案**：`
  },
  {
    id: 'mystery',
    name: '推理工坊',
    icon: ShieldAlert,
    tagline: '设计连环密室、嫌疑人档案与出人意料的反转。',
    description: '设计烧脑的本格推理，邀请爸爸作为首位警探来破解你精心布置的迷局。',
    colorClass: 'border-accent bg-accent/[0.02]',
    badgeColor: 'bg-gold/10 text-gold-700 dark:text-gold',
    prompts: [
      '案件的起因与犯罪动机（Motives）是什么？',
      '有哪些核心嫌疑人？他们分别拥有怎样的不在场证明？',
      '关键线索（Clues）与具有误导性的红鲱鱼（Red Herrings）有哪些？',
      '隐藏的终极真相（Truth）与结局的反转（Twists）是什么？'
    ],
    markdownTemplate: `# [案件/剧本名称] 迷雾卷宗

## 1. 核心案件设定
- **案发现场与钟声**：
- **核心动机**：

## 2. 嫌疑人名册 (Suspects)
- **嫌疑人A**：[姓名与背景] - [不在场证明]
- **嫌疑人B**：[姓名与背景] - [不在场证明]

## 3. 线索与误导 (Clues & Red Herrings)
- **真线索**：
- **误导红鲱鱼**：

## 4. 终极真相与反转 (The Twist)
- **案件真相**：`
  },
  {
    id: 'scifi',
    name: '科幻实验室',
    icon: Compass,
    tagline: '设定“如果……会怎样”的宇宙规则与文明灾变。',
    description: '构想颠覆性的科技发明，设定生存危机，并拷问人类在末日面前的选择。',
    colorClass: 'border-indigo-200 bg-indigo-50/[0.02]',
    badgeColor: 'bg-indigo-100 text-indigo-700 dark:text-indigo-300',
    prompts: [
      '设定核心假设：如果“某个物理规则改变了/发明了新科技”会发生什么？',
      '这种新科技对大众生活和国家政权会产生什么连锁反应？',
      '文明的生存危机（Crisis）是如何爆发的？',
      '在终极危机面前，人类文明做出了怎样的伦理抉择？'
    ],
    markdownTemplate: `# [世界观/科技设定名称] 研究报告

## 1. 核心幻想假设 (What-If)
- **如果……会怎样**：
- **新科技/宇宙法则参数**：

## 2. 文明连锁反应
- **科技普及对普通人的改变**：
- **社会的结构性重组**：

## 3. 生存危机与人类选择
- **毁灭性危机起源**：
- **最终的选择与道德代价**：`
  }
];

export default function LabsPage() {
  const router = useRouter();
  const [activeUser, setActiveUser] = useState<User | null>(null);
  
  // Selected lab state
  const [selectedLabId, setSelectedLabId] = useState<string | null>(null);
  const [showEmpathyTips, setShowEmpathyTips] = useState(false);

  // Form states for creating a new lore file from the lab
  const [title, setTitle] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('private');

  useEffect(() => {
    setActiveUser(db.getActiveUser());

    const handleStorageChange = () => {
      setActiveUser(db.getActiveUser());
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleStartLabProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLabId || !title.trim()) return;

    const template = LAB_TEMPLATES.find(l => l.id === selectedLabId);
    if (!template) return;

    // Save to Google Drive (mocked)
    const fileData = { name: `${title}.md`, type: 'text/markdown', contentBase64: template.markdownTemplate };
    const driveFolder = selectedLabId === 'scifi' ? 'SciFi-Lab' : 
                        selectedLabId === 'strategy' ? 'Strategy-Lab' : 
                        selectedLabId === 'mystery' ? 'Mystery-Lab' : 'Worldbuilding';

    const uploaded = await gdrive.uploadFile(fileData, driveFolder);

    // Create artwork in DB
    const newArt = db.createArtwork({
      title,
      description: template.markdownTemplate,
      type: selectedLabId === 'scifi' ? 'sci-fi' : 
            selectedLabId === 'strategy' ? 'wargame' : 
            selectedLabId === 'mystery' ? 'mystery' : 'worldview',
      tags: [template.name, '实验室共创'],
      visibility,
      drive_file_id: uploaded.drive_file_id,
      drive_preview_url: uploaded.drive_preview_url,
      drive_folder: driveFolder,
    });

    // Reset states and redirect to the editor page
    setTitle('');
    setSelectedLabId(null);
    router.push(`/artworks/${newArt.id}`);
  };

  if (!activeUser) return null;

  const canModify = activeUser.role === 'Child' || activeUser.role === 'Father';

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="font-literary text-3xl font-bold tracking-tight text-ink">实验室引擎</h1>
        <p className="text-xs text-ink/50 mt-1">专为少年创世神设计的逻辑引导沙盒，通过系统性发问，引导创作向深水区迈进。</p>
      </div>

      {/* Empathy guidelines alert */}
      <section className="rounded-xl border border-terracotta/20 bg-terracotta/[0.01] p-5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4.5 w-4.5 text-terracotta" />
            <h4 className="font-literary text-sm font-bold text-ink">核心机制：同理心反思模块</h4>
          </div>
          <button 
            onClick={() => setShowEmpathyTips(!showEmpathyTips)}
            className="text-[10px] font-bold text-terracotta hover:underline"
          >
            {showEmpathyTips ? '折叠提示' : '阅读发问大纲'}
          </button>
        </div>
        
        <p className="text-xs text-ink/75 leading-relaxed font-serif">
          我们的创作不以“如何赢”或单纯的力量强大为终点。当你的世界涉及战争、权力或规则冲突时，本引擎将自动开启同理心镜像提问，引导你换位思考。
        </p>

        {showEmpathyTips && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 pt-3 border-t border-book-border/40 text-[10px] text-ink/75 font-serif">
            <div className="space-y-1">
              <span className="font-bold text-terracotta">1. 失败者立场：</span>
              <p>他们会如何记录这段历史？他们失去了什么家园？</p>
            </div>
            <div className="space-y-1">
              <span className="font-bold text-sage">2. 士兵与平民：</span>
              <p>普通人在宏大战争决策前，将面临怎样的具体生活？</p>
            </div>
            <div className="space-y-1">
              <span className="font-bold text-accent">3. 对手与反派：</span>
              <p>反派有怎样的成长痛楚？他们为何坚信自己代表正义？</p>
            </div>
          </div>
        )}
      </section>

      {/* Lab Grid Selector */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {LAB_TEMPLATES.map((lab) => {
          const Icon = lab.icon;
          return (
            <div 
              key={lab.id} 
              className={`museum-card p-6 flex flex-col justify-between ${lab.colorClass}`}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-paper border border-book-border text-ink">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${lab.badgeColor}`}>
                    {lab.name}
                  </span>
                </div>

                <div>
                  <h3 className="font-literary text-lg font-bold text-ink">{lab.name}</h3>
                  <p className="text-xs text-ink/40 mt-0.5">{lab.tagline}</p>
                  <p className="text-xs text-ink/75 mt-2 leading-relaxed font-serif">{lab.description}</p>
                </div>

                {/* Prompts display */}
                <div className="rounded-lg bg-paper/50 border border-book-border/30 p-4 space-y-2">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-ink/40 block flex items-center gap-1">
                    <HelpCircle className="h-3 w-3" />
                    <span>系统引导提问 (AI Prompting)：</span>
                  </span>
                  <ul className="list-disc pl-4 space-y-1.5 text-[10px] text-ink/70 font-serif">
                    {lab.prompts.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {canModify && (
                <button
                  onClick={() => setSelectedLabId(lab.id)}
                  className="group mt-5 w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-book-border bg-parchment py-2 text-xs font-semibold text-ink transition-all hover:bg-paper"
                >
                  <span>选择此引擎开展创作</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Start Project Modal */}
      {selectedLabId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-book-border bg-parchment p-6 shadow-2xl animate-in scale-in duration-200">
            <h2 className="font-literary text-lg font-bold text-ink mb-4">
              开辟【{LAB_TEMPLATES.find(l => l.id === selectedLabId)?.name}】研究设定
            </h2>

            <form onSubmit={handleStartLabProject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink/60 uppercase tracking-wider mb-1">设定文档标题</label>
                <input
                  type="text"
                  required
                  placeholder="例如: 艾尔德兰的法律契约, 星核跃迁的代价..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-book-border bg-paper/40 px-3.5 py-2 text-xs font-medium text-ink focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink/60 uppercase tracking-wider mb-1">隐私设置</label>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as 'public' | 'private')}
                  className="w-full rounded-lg border border-book-border bg-paper/40 px-3.5 py-2 text-xs font-medium text-ink focus:outline-none"
                >
                  <option value="private">私密 (仅限父子共创)</option>
                  <option value="public">公开 (所有人可见)</option>
                </select>
              </div>

              <p className="text-[10px] text-ink/40 font-serif leading-relaxed">
                * 本引擎会自动在创作馆生成一份预先编排好问题骨架的 Markdown 文档。进入文档后，你可以对照引导问题进行细化撰写，并与爸爸展开共创对话。
              </p>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedLabId(null)}
                  className="rounded-lg border border-book-border bg-paper/40 px-4 py-2 text-xs font-semibold text-ink hover:bg-paper"
                >
                  返回
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-terracotta px-4.5 py-2 text-xs font-semibold text-parchment hover:bg-terracotta/90"
                >
                  生成实验案卷
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
