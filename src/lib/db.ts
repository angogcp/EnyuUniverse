// src/lib/db.ts
// Local-first persistent mock database for Project J

export type UserRole = 'Father' | 'Child' | 'Mother' | 'Guest';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar_url: string;
  created_at: string;
}

export interface Artwork {
  id: string;
  title: string;
  description: string;
  type: 'hand-drawn' | 'draft' | 'comic' | 'novel' | 'wargame' | 'sci-fi' | 'mystery' | 'character' | 'worldview';
  tags: string[];
  visibility: 'public' | 'private';
  drive_file_id?: string;
  drive_preview_url?: string;
  drive_folder?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  gallery_images?: string[];
}

export interface Conversation {
  id: string;
  artwork_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export interface Character {
  id: string;
  name: string;
  description: string;
  dream: string;
  weakness: string;
  personality: string;
  related_artwork_ids: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
  image_url?: string;
}

export interface World {
  id: string;
  name: string;
  description: string;
  rules: string;
  history: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TimelineEvent {
  id: string;
  year: number;
  date: string;
  title: string;
  description: string;
  type: 'creation' | 'school' | 'life' | 'other';
  related_artwork_id?: string;
  created_by: string;
  created_at: string;
}

export interface Dream {
  id: string;
  title: string;
  content: string;
  target_date: string;
  status: 'active' | 'achieved' | 'paused';
  reflection?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TravelEntry {
  id: string;
  title: string;
  destination: string;
  date: string; // YYYY-MM-DD
  type: 'plan' | 'story' | 'blog' | 'album';
  content: string; // Markdown details
  image_url?: string;
  visibility: 'public' | 'private';
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type AchievementCategory = 'creation' | 'travel' | 'dream' | 'world' | 'social' | 'special';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;        // Emoji icon
  category: AchievementCategory;
  rarity: 'common' | 'rare' | 'legendary';
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;   // 0-100
  hint?: string;       // Hint shown when locked
}

// Default Preloaded Data
const DEFAULT_USERS: User[] = [
  {
    id: 'user-father',
    name: '爸爸 (Enyu)',
    email: 'enyu.father@example.com',
    role: 'Father',
    avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=father',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'user-child',
    name: '渊裕',
    email: 'yuanyu.child@example.com',
    role: 'Child',
    avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=child',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'user-mother',
    name: '妈妈 (Sarah)',
    email: 'sarah.mother@example.com',
    role: 'Mother',
    avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=mother',
    created_at: '2025-01-01T00:00:00Z',
  },
];

const DEFAULT_ARTWORKS: Artwork[] = [
  {
    id: 'art-dino',
    title: '我的第一只雷龙巨兽',
    description: '今天在美术课上画的，它有三层楼那么高，身上长满了岩石一样的硬甲。',
    type: 'hand-drawn',
    tags: ['恐龙', '手绘', '岩石甲'],
    visibility: 'public',
    drive_file_id: 'drive_dino_01',
    drive_preview_url: '/dino.png',
    drive_folder: 'Artworks',
    created_by: 'user-child',
    created_at: '2024-05-12T14:30:00Z',
    updated_at: '2024-05-12T14:30:00Z',
  },
  {
    id: 'art-banana-rocket',
    title: '星际香蕉号：Nano Banana 2',
    description: '这是我设计并建模的第三代星际科幻飞行器。香蕉型的弯曲弧度在物理力学上能完美包裹微型纳米曲率空间，从而减少跳跃时的量子力阻力。搭载了最先进的纳米反物质引擎，可以一口气穿越三个虫洞！',
    type: 'sci-fi',
    tags: ['科幻', '太空船', '香蕉号', '设定'],
    visibility: 'public',
    drive_file_id: 'drive_banana_rocket_01',
    drive_preview_url: '/banana.png',
    drive_folder: 'SciFi-Lab',
    created_by: 'user-child',
    created_at: '2026-06-06T15:00:00Z',
    updated_at: '2026-06-06T15:00:00Z',
    gallery_images: [
      '/nano_banana_2_warp.png',
      '/nano_banana_2_station.png',
      '/nano_banana_2_planet.png'
    ],
  },
  {
    id: 'art-dorm-strategy',
    title: '宿舍卫生自治协定',
    description: `## 宿舍卫生得分与游戏积分挂钩方案
我们把打扫卫生拆分成了几个模块：
- **扫地与拖地**：得分 +10 分
- **整理公共桌面**：得分 +5 分
- **倒垃圾**：得分 +3 分

每周结算一次。积分最高的室友，周末可以优先挑选 2 小时的电脑游戏时段！
### 惩罚机制
如果有人逃避值日，下周分值扣除双倍，并且需要帮打扫两次。`,
    type: 'wargame',
    tags: ['宿舍', '自治', '积分机制'],
    visibility: 'private',
    drive_folder: 'Strategy-Lab',
    created_by: 'user-child',
    created_at: '2025-09-18T19:00:00Z',
    updated_at: '2025-09-18T19:00:00Z',
  },
  {
    id: 'art-aelderan-lore',
    title: '艾尔德兰帝国：黎明誓言',
    description: `## 第一卷：被封印的圣树
在艾尔德兰大陆的中心，矗立着古老的圣树。帝国法律规定，任何人都不能在圣树周围两公里内使用攻击性魔法。
圣树每年结出三个“黎明之实”，这是维持帝国魔法屏障的核心燃料。

### 帝国核心危机
随着北境阴影的蔓延，今年圣树只结出了一个果实……如果结界在冬天来临前破裂，北境的冰原巨兽将会冲破防线。`,
    type: 'novel',
    tags: ['世界观', '帝国', '史诗科幻'],
    visibility: 'private',
    drive_folder: 'Worldbuilding',
    created_by: 'user-child',
    created_at: '2026-03-10T21:15:00Z',
    updated_at: '2026-03-10T21:15:00Z',
  },
  {
    id: 'art-castle-murder',
    title: '暴风雪山庄：古堡钟声',
    description: `## 案件设定
暴风雪导致古堡与外界失联。
晚上 12:00，沉寂了三十年的古堡大钟突然敲响了四下。
随后，男爵被发现死在锁着的书房内。

### 嫌疑人列表
1. **老管家 托马斯**：在钟声响起时，声称自己在地下酒窖。但他的靴子上有新鲜的雪迹。
2. **侄子 阿尔伯特**：欠下巨额赌债，声称自己在客房睡觉。但他的房门钥匙丢失了。
3. **女家庭教师 艾米丽**：声称在大厅看书，钟声敲响时听到了重物倒地的声音。

### 线索
- 书房地毯上有未融化的雪花。
- 男爵的怀表停在 11:45。`,
    type: 'mystery',
    tags: ['推理', '密室', '暴风雪山庄'],
    visibility: 'private',
    drive_preview_url: '/castle.png',
    drive_folder: 'Mystery-Lab',
    created_by: 'user-child',
    created_at: '2026-05-20T22:30:00Z',
    updated_at: '2026-05-20T22:30:00Z',
  },
];

const DEFAULT_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-1',
    artwork_id: 'art-dino',
    sender_id: 'user-father',
    content: '这只恐龙的眼神很有神！它是食草的还是食肉的？',
    created_at: '2024-05-12T16:00:00Z',
  },
  {
    id: 'conv-2',
    artwork_id: 'art-dino',
    sender_id: 'user-child',
    content: '它是食草的，但它有很厚的岩石装甲，食肉动物不敢惹它！',
    created_at: '2024-05-12T17:12:00Z',
  },
  {
    id: 'conv-3',
    artwork_id: 'art-dino',
    sender_id: 'user-father',
    content: '原来如此，它的尾巴像流星锤一样，防御力确实高。你画得真棒，很有想象力！',
    created_at: '2024-05-12T18:05:00Z',
  },
  {
    id: 'conv-4',
    artwork_id: 'art-dorm-strategy',
    sender_id: 'user-father',
    content: '制定规则是建立秩序的开始。你是怎么说服室友同意这个方案的？',
    created_at: '2025-09-19T09:20:00Z',
  },
  {
    id: 'conv-5',
    artwork_id: 'art-dorm-strategy',
    sender_id: 'user-child',
    content: '我们之前总是因为谁去倒垃圾吵架。我提出可以用多做值日换周末玩电脑的选择权，他们觉得很公平，因为大家都想先玩电脑。',
    created_at: '2025-09-19T11:45:00Z',
  },
  {
    id: 'conv-6',
    artwork_id: 'art-dorm-strategy',
    sender_id: 'user-father',
    content: '很好的激励机制。如果有人拿到第一选了游戏时间，结果反悔不倒垃圾了，你会怎么处理？',
    created_at: '2025-09-19T13:00:00Z',
  },
  {
    id: 'conv-7',
    artwork_id: 'art-dorm-strategy',
    sender_id: 'user-child',
    content: '那他下周的惩罚就是双倍的，并且取消他下周参与积分的资格。大家都同意了这个硬性规则！',
    created_at: '2025-09-19T14:10:00Z',
  },
];

const DEFAULT_CHARACTERS: Character[] = [
  {
    id: 'char-lothar',
    name: '洛萨将军 (General Lothar)',
    description: '艾尔德兰帝国的边境守卫将军，曾经单枪匹马在风暴峡谷阻挡魔兽潮汐。',
    dream: '看到北方雪原恢复绿色，帝国不再受魔兽威胁。',
    weakness: '过于信任他人的荣誉感，容易被伪装的敌人利用。',
    personality: '沉稳、坚毅、对士兵极其护短，但对帝国贵族的官僚主义深恶痛绝。',
    related_artwork_ids: ['art-aelderan-lore'],
    created_by: 'user-child',
    created_at: '2026-03-11T08:00:00Z',
    updated_at: '2026-03-11T08:00:00Z',
    image_url: '/char_lothar.png',
  },
  {
    id: 'char-alto',
    name: '星风者 阿尔托 (Alto)',
    description: '一个年轻的法术探险家，喜欢游历大陆寻找失落的古代遗迹。',
    dream: '找到传说中存放创世法术的“旧日图书馆”。',
    weakness: '求知欲过盛，常常在搞清楚危险前就触碰了机关。',
    personality: '乐观、幽默、对什么都充满好奇，随身携带一本厚厚的探险日记。',
    related_artwork_ids: ['art-aelderan-lore'],
    created_by: 'user-child',
    created_at: '2026-03-12T10:00:00Z',
    updated_at: '2026-03-12T10:00:00Z',
    image_url: '/char_alto.png',
  },
];

const DEFAULT_WORLDS: World[] = [
  {
    id: 'world-aelderan',
    name: '艾尔德兰宇宙 (Aelderan)',
    description: '一个魔法与机械共存的幻想世界。由于古老圣树的存在，大陆有着稳定的结界，但也因为能源枯竭逐渐产生裂痕。',
    rules: '1. 圣树周围两公里为绝对禁魔区。\n2. 魔法使用需要消耗“源石”或圣树结出的“黎明之实”。\n3. 机械义肢和蒸汽核心是普通人对抗魔兽的主要手段。',
    history: '圣树纪元742年，帝国建立，依靠圣树屏障迎来了三百年的黄金和平。纪元1050年，北境冰原的魔兽开始异变，屏障能量急剧消耗，帝国边境重回战火。',
    created_by: 'user-child',
    created_at: '2026-03-10T20:00:00Z',
    updated_at: '2026-03-10T20:00:00Z',
  },
];

const DEFAULT_TIMELINE_EVENTS: TimelineEvent[] = [
  {
    id: 'time-1',
    year: 2024,
    date: '2024-09-01',
    title: '开启寄宿学校生活',
    description: '第一次离开家住校，开始独立整理房间和面对集体生活。',
    type: 'school',
    created_by: 'user-child',
    created_at: '2024-09-01T10:00:00Z',
  },
  {
    id: 'time-2',
    year: 2024,
    date: '2024-11-15',
    title: '深入喜欢欧洲史',
    description: '在图书馆借阅了大量关于罗马帝国 and 中世纪欧洲的书籍，开始对国家制度产生兴趣。',
    type: 'life',
    created_by: 'user-child',
    created_at: '2024-11-15T12:00:00Z',
  },
  {
    id: 'time-3',
    year: 2025,
    date: '2025-03-10',
    title: '开始研究 NBA 历史与球队战术',
    description: '分析了公牛王朝和勇士小球战术，尝试在草稿纸上模拟篮球战术跑位。',
    type: 'life',
    created_by: 'user-child',
    created_at: '2025-03-10T15:00:00Z',
  },
  {
    id: 'time-4',
    year: 2025,
    date: '2025-09-15',
    title: '当选宿舍自治会股长',
    description: '被舍友推选为卫生股长，为了解决倒垃圾的冲突，和爸爸讨论制定了卫生自治方案。',
    type: 'school',
    related_artwork_id: 'art-dorm-strategy',
    created_by: 'user-child',
    created_at: '2025-09-15T08:00:00Z',
  },
  {
    id: 'time-5',
    year: 2026,
    date: '2026-03-10',
    title: '开始建立原创角色宇宙 (艾尔德兰)',
    description: '第一次在网上整理自己的小说世界观和角色人设，上传了第一个帝国世界观文档。',
    type: 'creation',
    related_artwork_id: 'art-aelderan-lore',
    created_by: 'user-child',
    created_at: '2026-03-10T22:00:00Z',
  },
];

const DEFAULT_DREAMS: Dream[] = [
  {
    id: 'dream-president',
    title: '高中毕业前当选自治会主席',
    content: '希望能用公正的规则帮助更多同学，并在学校建立一个真正好玩的桌游/战略社团。',
    target_date: '2027-06-01',
    status: 'active',
    reflection: '连任了宿舍股长，大家都很支持我的值日积分规则。下一步要在班级甚至年级展示组织能力。',
    created_by: 'user-child',
    created_at: '2025-09-20T10:00:00Z',
    updated_at: '2026-01-10T14:00:00Z',
  },
  {
    id: 'dream-novel',
    title: '完成《艾尔德兰黎明》第一部小说',
    content: '写满 10 个章节，把洛萨将军和阿尔托的故事写完，并由爸爸作为首位读者提供编辑建议。',
    target_date: '2026-12-31',
    status: 'active',
    created_by: 'user-child',
    created_at: '2026-03-15T09:00:00Z',
    updated_at: '2026-03-15T09:00:00Z',
  },
  {
    id: 'dream-lego',
    title: '与爸爸共同拼装艾尔德兰帝国的王城乐高',
    content: '用超过 5000 块积木，复现圣树和帝国大殿，作为我们共同的数字帝国纪念。',
    target_date: '2027-02-01',
    status: 'active',
    created_by: 'user-child',
    created_at: '2026-04-01T11:00:00Z',
    updated_at: '2026-04-01T11:00:00Z',
  },
];

const DEFAULT_TRAVEL_ENTRIES: TravelEntry[] = [
  {
    id: 'travel-taishan',
    title: '夜登泰山与日出奇景',
    destination: '山东泰安',
    date: '2025-10-02',
    type: 'story',
    visibility: 'public',
    image_url: '/travel_taishan.png',
    content: `## 泰山日出与挑山工 (2025年国庆)
这是我们最难忘的一次攀登。爸爸和渊裕进行了一场体能与意志的极限挑战！

### 🧗‍♀️ 攀登记录
我们选择在晚上 **11:00** 从红门开始夜登。
一路上只有手电筒的光芒和周围登山者的欢声笑语。
* 走到**中天门**（约凌晨 1:30）时，渊裕的腿开始酸痛了，我们买了两根黄瓜补水。
* 看到迎面走来的**挑山工**，挑着沉甸甸的饮料和食物，在陡峭的山路上一步一步稳健攀爬。渊裕说：“他们才是真正的勇士，我也不能放弃。”
* 挑战**十八盘**（约凌晨 3:30）：这是最陡的一段，几乎有70度角。我们数着台阶，每爬50级就休息一下，互相拉着手往上爬。
* 凌晨 **5:10**，我们终于登上了南天门，迎着冷冽的寒风，在观日峰找到了位置。

### 🌅 破晓一刻
凌晨 **5:42**，当天际线从墨蓝色变成金黄色，红日犹如一颗火球猛地跳出云海时，整座山峰的登山者都欢呼了起来。
太阳的光芒照在渊裕冻得红扑扑的脸庞上。我们紧紧拥抱在一起。

> 爸爸说：“克服困难登顶看到的风景，是一生都不会忘记的。”
> 渊裕说：“爸爸，我觉得我变成了一个更强大的人！”`,
    created_by: 'user-child',
    created_at: '2025-10-03T12:00:00Z',
    updated_at: '2025-10-03T12:00:00Z'
  },
  {
    id: 'travel-qinghai',
    title: '大美青海西北大环线冒险计划',
    destination: '青海、甘肃',
    date: '2026-07-15',
    type: 'plan',
    visibility: 'private',
    image_url: '/travel_qinghai.png',
    content: `## 青海-甘肃大环线 7 日自驾游计划 (2026年暑假)
这里是爸爸和渊裕一起制定的西北探险计划。我们要开过高原、穿过沙漠，用画笔记录沿途的奇妙风景！

### 🗓️ 每日行程安排
* **D1 (7月15日)**: 兰州/西宁集合。入住酒店，去吃地道的手抓羊肉和牦牛酸奶。
* **D2 (7月16日)**: 经过塔尔寺（了解藏传佛教与壁画），下午到达青海湖，在黑马河租自行车环湖骑行看日落，晚上住在湖边帐篷。
* **D3 (7月17日)**: 早起看青海湖日出，前往茶卡盐湖（天空之镜）。渊裕要在白色的盐湖中央画一幅雷龙巨兽在盐湖漫步的科幻草图！
* **D4 (7月18日)**: 穿越柴达木盆地，经过最美水上雅丹，晚上抵达大柴旦。
* **D5 (7月19日)**: 参观莫高窟。爸爸要 and 渊裕一起寻找关于九色鹿的壁画，并记录在我们的“世界观实验室”里。晚上爬鸣沙山，滑沙，看沙漠月牙泉。
* **D6 (7月20日)**: 游览嘉峪关（天下第一雄关），晚上在张家口/张掖吃夜市，看七彩丹霞地貌。
* **D7 (7月21日)**: 经过祁连山大草原，返回西宁/兰州，解散。

### 🎒 行囊装备清单
1. **电子与防晒**：防晒霜（高倍）、墨镜、遮阳帽、相机、微型曲率空间设定笔记本。
2. **御寒衣物**：虽然是夏天，但高原早晚温差大，必须带上一件冲锋衣和轻薄羽绒服。
3. **创作工具**：渊裕的速写本、铅笔和水彩笔。
4. **旅行作业**：每天完成30分钟的口算和英语阅读！`,
    created_by: 'user-father',
    created_at: '2026-06-01T10:00:00Z',
    updated_at: '2026-06-01T10:00:00Z'
  },
  {
    id: 'travel-skiing',
    title: '塞北崇礼滑雪初体验',
    destination: '河北张家口',
    date: '2025-01-20',
    type: 'album',
    visibility: 'private',
    image_url: '/travel_skiing.png',
    content: `## 崇礼万龙雪场：渊裕的滑雪第一课
2025年寒假，爸爸带渊裕来到了张家口崇礼的万龙滑雪场，体验雪原上的飞翔。

### ⛷️ 教学日志
* **第一天**：学习单板穿戴和单脚滑行。渊裕摔了不下二十个跟头，屁股都摔麻了，但他笑得特别开心。
* **第二天**：教练教了推坡和叶子飘（落叶飘）。渊裕掌握了核心的重心转移诀窍，能稳稳地从初级道滑下来了！
* **第三天**：我们一起坐缆车上了中级道。从高处滑下的时候，雪花飞溅，像是驾驭着飞船穿越风雪。

爸爸给渊裕拍了很多滑雪的英姿，还录制了一段漂移视频！`,
    created_by: 'user-father',
    created_at: '2025-01-22T15:30:00Z',
    updated_at: '2025-01-22T15:30:00Z'
  }
];

// In-Memory Database Controller (Syncs to LocalStorage in Browser)
class ProjectJDatabase {
  private users: User[] = [];
  private artworks: Artwork[] = [];
  private conversations: Conversation[] = [];
  private characters: Character[] = [];
  private worlds: World[] = [];
  private timelineEvents: TimelineEvent[] = [];
  private dreams: Dream[] = [];
  private travelEntries: TravelEntry[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  private loadFromStorage() {
    if (!this.isBrowser()) {
      // Server-side default in-memory arrays
      this.users = [...DEFAULT_USERS];
      this.artworks = [...DEFAULT_ARTWORKS];
      this.conversations = [...DEFAULT_CONVERSATIONS];
      this.characters = [...DEFAULT_CHARACTERS];
      this.worlds = [...DEFAULT_WORLERS()]; // See helper function below
      this.timelineEvents = [...DEFAULT_TIMELINE_EVENTS];
      this.dreams = [...DEFAULT_DREAMS];
      this.travelEntries = [...DEFAULT_TRAVEL_ENTRIES];
      return;
    }

    try {
      const getOrInit = <T>(key: string, defaultVal: T[]): T[] => {
        const item = localStorage.getItem(`project_j_${key}`);
        if (!item) {
          localStorage.setItem(`project_j_${key}`, JSON.stringify(defaultVal));
          return defaultVal;
        }
        return JSON.parse(item);
      };

      this.users = getOrInit('users', DEFAULT_USERS);
      this.artworks = getOrInit('artworks', DEFAULT_ARTWORKS);
      this.conversations = getOrInit('conversations', DEFAULT_CONVERSATIONS);
      this.characters = getOrInit('characters', DEFAULT_CHARACTERS);
      this.worlds = getOrInit('worlds', DEFAULT_WORLDS);
      this.timelineEvents = getOrInit('timeline_events', DEFAULT_TIMELINE_EVENTS);
      this.dreams = getOrInit('dreams', DEFAULT_DREAMS);
      this.travelEntries = getOrInit('travel_entries', DEFAULT_TRAVEL_ENTRIES);
    } catch (e) {
      console.error('Failed to load database from localStorage, fallback to defaults', e);
      this.users = [...DEFAULT_USERS];
      this.artworks = [...DEFAULT_ARTWORKS];
      this.conversations = [...DEFAULT_CONVERSATIONS];
      this.characters = [...DEFAULT_CHARACTERS];
      this.worlds = [...DEFAULT_WORLDS];
      this.timelineEvents = [...DEFAULT_TIMELINE_EVENTS];
      this.dreams = [...DEFAULT_DREAMS];
      this.travelEntries = [...DEFAULT_TRAVEL_ENTRIES];
    }
  }

  private saveToStorage(key: string, data: any) {
    if (!this.isBrowser()) return;
    try {
      localStorage.setItem(`project_j_${key}`, JSON.stringify(data));
    } catch (e) {
      console.error(`Failed to save project_j_${key} to localStorage`, e);
    }
  }

  // Active User Helper
  public getActiveUser(): User {
    if (!this.isBrowser()) return DEFAULT_USERS[1]; // Default to Child (Yuan Yu) on server render
    const activeRoleId = localStorage.getItem('project_j_active_role_id') || 'user-child';
    return this.users.find(u => u.id === activeRoleId) || this.users[1];
  }

  public setActiveUser(userId: string) {
    if (!this.isBrowser()) return;
    localStorage.setItem('project_j_active_role_id', userId);
    window.dispatchEvent(new Event('storage')); // Notify components
  }

  // Users APIs
  public getUsers(): User[] {
    return this.users;
  }

  // Artworks APIs
  public getArtworks(): Artwork[] {
    return this.artworks;
  }

  public getArtworkById(id: string): Artwork | undefined {
    return this.artworks.find(art => art.id === id);
  }

  public createArtwork(art: Omit<Artwork, 'id' | 'created_by' | 'created_at' | 'updated_at'>): Artwork {
    const activeUser = this.getActiveUser();
    const newArt: Artwork = {
      ...art,
      id: `art-${Math.random().toString(36).substr(2, 9)}`,
      created_by: activeUser.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.artworks.push(newArt);
    this.saveToStorage('artworks', this.artworks);
    return newArt;
  }

  public updateArtwork(id: string, updates: Partial<Artwork>): Artwork {
    const index = this.artworks.findIndex(art => art.id === id);
    if (index === -1) throw new Error('Artwork not found');
    this.artworks[index] = {
      ...this.artworks[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.saveToStorage('artworks', this.artworks);
    return this.artworks[index];
  }

  public deleteArtwork(id: string) {
    this.artworks = this.artworks.filter(art => art.id !== id);
    this.saveToStorage('artworks', this.artworks);
    // clean up related conversations
    this.conversations = this.conversations.filter(c => c.artwork_id !== id);
    this.saveToStorage('conversations', this.conversations);
  }

  // Conversations APIs
  public getConversations(artworkId: string): Conversation[] {
    return this.conversations
      .filter(c => c.artwork_id === artworkId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  public addMessage(artworkId: string, content: string): Conversation {
    const activeUser = this.getActiveUser();
    const newMsg: Conversation = {
      id: `conv-${Math.random().toString(36).substr(2, 9)}`,
      artwork_id: artworkId,
      sender_id: activeUser.id,
      content,
      created_at: new Date().toISOString(),
    };
    this.conversations.push(newMsg);
    this.saveToStorage('conversations', this.conversations);
    return newMsg;
  }

  // Characters APIs
  public getCharacters(): Character[] {
    return this.characters;
  }

  public getCharacterById(id: string): Character | undefined {
    return this.characters.find(c => c.id === id);
  }

  public createCharacter(char: Omit<Character, 'id' | 'created_by' | 'created_at' | 'updated_at'>): Character {
    const activeUser = this.getActiveUser();
    const newChar: Character = {
      ...char,
      id: `char-${Math.random().toString(36).substr(2, 9)}`,
      created_by: activeUser.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.characters.push(newChar);
    this.saveToStorage('characters', this.characters);
    return newChar;
  }

  public updateCharacter(id: string, updates: Partial<Character>): Character {
    const index = this.characters.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Character not found');
    this.characters[index] = {
      ...this.characters[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.saveToStorage('characters', this.characters);
    return this.characters[index];
  }

  // Worlds APIs
  public getWorlds(): World[] {
    return this.worlds;
  }

  public createWorld(world: Omit<World, 'id' | 'created_by' | 'created_at' | 'updated_at'>): World {
    const activeUser = this.getActiveUser();
    const newWorld: World = {
      ...world,
      id: `world-${Math.random().toString(36).substr(2, 9)}`,
      created_by: activeUser.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.worlds.push(newWorld);
    this.saveToStorage('worlds', this.worlds);
    return newWorld;
  }

  public updateWorld(id: string, updates: Partial<World>): World {
    const index = this.worlds.findIndex(w => w.id === id);
    if (index === -1) throw new Error('World not found');
    this.worlds[index] = {
      ...this.worlds[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.saveToStorage('worlds', this.worlds);
    return this.worlds[index];
  }

  // Timeline Events APIs
  public getTimelineEvents(): TimelineEvent[] {
    return this.timelineEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  public createTimelineEvent(event: Omit<TimelineEvent, 'id' | 'created_by' | 'created_at'>): TimelineEvent {
    const activeUser = this.getActiveUser();
    const newEvent: TimelineEvent = {
      ...event,
      id: `time-${Math.random().toString(36).substr(2, 9)}`,
      created_by: activeUser.id,
      created_at: new Date().toISOString(),
    };
    this.timelineEvents.push(newEvent);
    this.saveToStorage('timeline_events', this.timelineEvents);
    return newEvent;
  }

  public deleteTimelineEvent(id: string) {
    this.timelineEvents = this.timelineEvents.filter(e => e.id !== id);
    this.saveToStorage('timeline_events', this.timelineEvents);
  }

  // Dreams APIs
  public getDreams(): Dream[] {
    return this.dreams;
  }

  public createDream(dream: Omit<Dream, 'id' | 'created_by' | 'created_at' | 'updated_at'>): Dream {
    const activeUser = this.getActiveUser();
    const newDream: Dream = {
      ...dream,
      id: `dream-${Math.random().toString(36).substr(2, 9)}`,
      created_by: activeUser.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.dreams.push(newDream);
    this.saveToStorage('dreams', this.dreams);
    return newDream;
  }

  public updateDream(id: string, updates: Partial<Dream>): Dream {
    const index = this.dreams.findIndex(d => d.id === id);
    if (index === -1) throw new Error('Dream not found');
    this.dreams[index] = {
      ...this.dreams[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.saveToStorage('dreams', this.dreams);
    return this.dreams[index];
  }

  public deleteDream(id: string) {
    this.dreams = this.dreams.filter(d => d.id !== id);
    this.saveToStorage('dreams', this.dreams);
  }

  // Travel Entries APIs
  public getTravelEntries(): TravelEntry[] {
    return this.travelEntries;
  }

  public getTravelEntryById(id: string): TravelEntry | undefined {
    return this.travelEntries.find(entry => entry.id === id);
  }

  public createTravelEntry(entry: Omit<TravelEntry, 'id' | 'created_by' | 'created_at' | 'updated_at'>): TravelEntry {
    const activeUser = this.getActiveUser();
    const newEntry: TravelEntry = {
      ...entry,
      id: `travel-${Math.random().toString(36).substr(2, 9)}`,
      created_by: activeUser.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.travelEntries.push(newEntry);
    this.saveToStorage('travel_entries', this.travelEntries);
    return newEntry;
  }

  public updateTravelEntry(id: string, updates: Partial<TravelEntry>): TravelEntry {
    const index = this.travelEntries.findIndex(entry => entry.id === id);
    if (index === -1) throw new Error('Travel entry not found');
    this.travelEntries[index] = {
      ...this.travelEntries[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.saveToStorage('travel_entries', this.travelEntries);
    return this.travelEntries[index];
  }

  public deleteTravelEntry(id: string) {
    this.travelEntries = this.travelEntries.filter(entry => entry.id !== id);
    this.saveToStorage('travel_entries', this.travelEntries);
  }

  // ---- Achievements (Computed from live data, not stored) ----
  public getAchievements(): Achievement[] {
    const artworks = this.artworks;
    const characters = this.characters;
    const worlds = this.worlds;
    const dreams = this.dreams;
    const travel = this.travelEntries;
    const conversations = this.conversations;
    const achievedDreams = dreams.filter(d => d.status === 'achieved');
    const travelStories = travel.filter(t => t.type === 'story');
    const travelPlans = travel.filter(t => t.type === 'plan');
    const travelAlbums = travel.filter(t => t.type === 'album');
    const publicArtworks = artworks.filter(a => a.visibility === 'public');
    const childCreations = artworks.filter(a => a.created_by === 'user-child');

    type A = Achievement;
    const def = (
      id: string, title: string, description: string, icon: string,
      category: AchievementCategory, rarity: A['rarity'],
      unlocked: boolean, progress?: number, hint?: string
    ): A => ({
      id, title, description, icon, category, rarity, unlocked,
      unlockedAt: unlocked ? new Date().toISOString() : undefined,
      progress, hint,
    });

    return [
      // Creation
      def('first-artwork', '第一幅画', '完成了第一件创作并收录进创作馆。', '🎨', 'creation', 'common',
        childCreations.length >= 1, Math.min(100, childCreations.length * 100)),
      def('five-artworks', '五件作品', '创作馆里已有五件作品，一个真正的创作者！', '🖼️', 'creation', 'common',
        childCreations.length >= 5, Math.min(100, Math.round(childCreations.length / 5 * 100)),
        `再创作 ${Math.max(0, 5 - childCreations.length)} 件`),
      def('ten-artworks', '十件作品', '十件作品守护者，宇宙博物馆正式开张！', '🏛️', 'creation', 'rare',
        childCreations.length >= 10, Math.min(100, Math.round(childCreations.length / 10 * 100)),
        `再创作 ${Math.max(0, 10 - childCreations.length)} 件`),
      def('public-sharer', '公开分享者', '至少有一件作品对外公开展示。', '📢', 'creation', 'common',
        publicArtworks.length >= 1, publicArtworks.length >= 1 ? 100 : 0,
        '将一件作品设为"公开"'),

      // Travel
      def('first-travel', '出发！', '记录了第一次旅行或出行计划。', '🧳', 'travel', 'common',
        travel.length >= 1, Math.min(100, travel.length * 100)),
      def('first-story', '游记作家', '写下了第一篇游记故事。', '✍️', 'travel', 'common',
        travelStories.length >= 1, Math.min(100, travelStories.length * 100),
        '添加一条"游记故事"类型的记录'),
      def('three-cities', '三城漫游者', '足迹馆里记录了三个或以上旅程。', '🗺️', 'travel', 'rare',
        travel.length >= 3, Math.min(100, Math.round(travel.length / 3 * 100)),
        `还需 ${Math.max(0, 3 - travel.length)} 个记录`),
      def('planner', '家庭参谋长', '制定了第一份正式的旅行计划文书。', '📋', 'travel', 'common',
        travelPlans.length >= 1, Math.min(100, travelPlans.length * 100),
        '添加一条"旅行计划"类型的记录'),
      def('photographer', '定格时光', '创建了第一个旅行相册。', '📸', 'travel', 'common',
        travelAlbums.length >= 1, Math.min(100, travelAlbums.length * 100),
        '添加一条"相册相片"类型的记录'),

      // World Building
      def('first-world', '创世纪', '建立了第一个世界观框架。', '🌍', 'world', 'common',
        worlds.length >= 1, Math.min(100, worlds.length * 100)),
      def('first-character', '造物主', '创建了第一个角色档案。', '🧙', 'world', 'common',
        characters.length >= 1, Math.min(100, characters.length * 100)),
      def('three-characters', '角色缔造者', '已有三位以上角色生活在你的世界里。', '👥', 'world', 'rare',
        characters.length >= 3, Math.min(100, Math.round(characters.length / 3 * 100)),
        `还需 ${Math.max(0, 3 - characters.length)} 个角色`),

      // Dreams
      def('first-dream', '许下心愿', '在梦想档案里立下了第一个人生目标。', '⭐', 'dream', 'common',
        dreams.length >= 1, Math.min(100, dreams.length * 100)),
      def('five-dreams', '星图绘制者', '记录了五个以上的人生梦想。', '🌠', 'dream', 'rare',
        dreams.length >= 5, Math.min(100, Math.round(dreams.length / 5 * 100)),
        `还需 ${Math.max(0, 5 - dreams.length)} 个梦想`),
      def('achieved-dream', '梦想成真', '第一次把梦想标记为已达成！', '🎉', 'dream', 'rare',
        achievedDreams.length >= 1, Math.min(100, achievedDreams.length * 100),
        '将一个梦想标记为"已达成"'),

      // Social
      def('first-chat', '共创启航', '第一次在作品或旅程下留下共创对话。', '💬', 'social', 'common',
        conversations.length >= 1, Math.min(100, conversations.length * 100)),
      def('ten-conversations', '对话达人', '父子共创对话已超过十条。', '📝', 'social', 'rare',
        conversations.length >= 10, Math.min(100, Math.round(conversations.length / 10 * 100)),
        `还需 ${Math.max(0, 10 - conversations.length)} 条对话`),

      // Special
      def('universe-builder', '宇宙构建者', '同时拥有世界观、旅行记录和梦想档案，三位一体！', '🚀', 'special', 'legendary',
        worlds.length >= 1 && travel.length >= 1 && dreams.length >= 1,
        Math.round(((worlds.length >= 1 ? 1 : 0) + (travel.length >= 1 ? 1 : 0) + (dreams.length >= 1 ? 1 : 0)) / 3 * 100),
        '同时拥有世界观、足迹记录和梦想'),
      def('nano-banana-fan', '香蕉号忠实机师', '收录了与 Nano Banana 2 相关的创作。', '🍌', 'special', 'legendary',
        artworks.some(a => a.title.includes('香蕉') || a.tags.some(t => t.includes('香蕉'))),
        artworks.some(a => a.title.includes('香蕉') || a.tags.some(t => t.includes('香蕉'))) ? 100 : 0,
        '与星际香蕉号有关的创作'),
    ];
  }

  public getAchievementStats(): { total: number; unlocked: number; percentage: number } {
    const all = this.getAchievements();
    const unlocked = all.filter(a => a.unlocked).length;
    return { total: all.length, unlocked, percentage: Math.round((unlocked / all.length) * 100) };
  }
}

// Fallback to avoid error in compile/SSR
function DEFAULT_WORLERS() {
  return DEFAULT_WORLDS;
}

// Global Single Instance
export const db = new ProjectJDatabase();
