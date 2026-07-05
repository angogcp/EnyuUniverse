import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';

export async function POST(request: Request) {
  try {
    const { category, filename } = await request.json();

    if (!category || !filename) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const baseDir = path.join(process.cwd(), 'art-work');
    const targetFilePath = path.join(baseDir, category, filename);

    // Security check: prevent directory traversal
    const relative = path.relative(baseDir, targetFilePath);
    const isSafe = relative && !relative.startsWith('..') && !path.isAbsolute(relative);
    
    if (!isSafe) {
      return NextResponse.json({ error: 'Access Denied' }, { status: 403 });
    }

    if (!fs.existsSync(targetFilePath)) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // Run Python feature extractor script
    const scriptPath = path.join(baseDir, 'analyze_features.py');
    const cmd = `python "${scriptPath}" "${targetFilePath}"`;

    let features: any;
    try {
      features = await new Promise((resolve, reject) => {
        exec(cmd, (error, stdout, stderr) => {
          if (error) {
            reject(new Error(`Python extractor failed: ${stderr || error.message}`));
            return;
          }
          try {
            const parsed = JSON.parse(stdout.trim());
            if (parsed.error) {
              reject(new Error(parsed.error));
            } else {
              resolve(parsed);
            }
          } catch (e) {
            reject(new Error(`Failed to parse Python stdout: ${stdout}`));
          }
        });
      });
    } catch (pythonError: any) {
      console.warn("Python feature extraction failed. Falling back to mock features:", pythonError.message);
      // Fallback mock features
      features = {
        width: 1200,
        height: 900,
        aspect_ratio: 1.33,
        brightness: 135.0,
        contrast: 60.0,
        saturation: 50.0,
        line_density_percent: 10.0,
        is_grayscale: category === 'calligraphy' || category === 'comics' || category === 'tactics',
        dominant_colors: [
          { hex: "#b6b7bb", rgb: [182, 183, 187] },
          { hex: "#9b9ca0", rgb: [155, 156, 160] }
        ]
      };
    }

    // Call DeepSeek LLM
    const apiKey = process.env.DEEPSEEK_API_KEY;
    const modelName = process.env.DEEPSEEK_ANALYSIS_MODEL || 'deepseek-v4-flash';

    if (!apiKey) {
      // Fallback local mock feedback if API key is missing (for robust offline dev/showcase)
      const mockFeedback = generateMockFeedback(category, filename, features);
      return NextResponse.json({ feedback: mockFeedback, isMock: true });
    }

    try {
      const systemMessage = `你是一位专业的小画家艺术导师、漫画分镜编辑和战术教练。
你的职责是基于画作的“局部视觉特征报告”（包括亮度、对比度、饱和度、线条密度和主色调）以及作品类别，为家长与孩子提供极具启发性、鼓励性且专业的画面改进与产品优化建议。

请根据输入的数据，扮演对应的角色生成反馈：
- 若类别是 'tactics'，扮演【战术画板教练】：重点关注图纸符号的规范性、布局的清晰度、多色线标引导及战术信息的可读性。
- 若类别是 'comics'，扮演【少年漫画主编】：重点关注镜头张力、分镜间隙对比、背景与人物的线条对比、色彩的情感渲染以及对话框留白。
- 若类别是 'calligraphy'，扮演【国学书法督导】：重点关注字形间距、字体的笔画粗细对比、布局纸面整洁度，并给予传统书法审美的点评。
- 若类别是 'doodles'，扮演【概念设计艺术总监】：鼓励自由创意，提出光影暗部、立体空间感和故事化场景的加深技巧。

你的语言风格必须是：
1. 充满温度：积极肯定少年的创意与劳动（例如“非常棒的线条张力”、“主色调配置很棒”）。
2. 极具专业深度：使用专业艺术或战术词汇（如“分镜透视”、“笔画转折”、“视觉流向”、“明暗对比”、“防守对位”）。
3. 给出 3 条具体的、可实操的改进小妙招（例如“可以尝试用更细的0.38中性笔画背景，让0.7的粗线勾勒主体人物”、“可以引入红色箭头标示强侧传球路线”）。

请以漂亮的 Markdown 格式输出，排版需整洁，多用小标题。请使用中文。`;

    const userMessage = `文件名: ${filename}
作品分类: ${category}

【视觉特征报告数据】
- 画布分辨率: ${features.width} x ${features.height} (宽高比: ${features.aspect_ratio})
- 画面平均亮度: ${features.brightness} / 255
- 画面对比度 (标准差): ${features.contrast} (对比度越高，说明墨迹与背景的划分越分明)
- 线条像素密度: ${features.line_density_percent}% (代表画面线条的复杂程度)
- 是否为黑白/灰阶: ${features.is_grayscale ? '是 (单色手稿)' : '否 (彩色绘制)'}
- 画面主色调 (提取的视觉像素色板): ${features.dominant_colors.map((c: any) => c.hex).join(', ')}

请根据这些具体的视觉特征，给出一份专业的分析报告与改进意见书。`;

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.statusText}`);
    }

    const responseText = await response.text();
    console.log("DeepSeek API Raw Response:", responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError: any) {
      throw new Error(`Failed to parse DeepSeek response JSON. Error: ${parseError.message}`);
    }
    const feedbackText = data.choices?.[0]?.message?.content || "";

    return NextResponse.json({ feedback: feedbackText, isMock: false });
    
    } catch (llmError: any) {
      console.warn("DeepSeek API call failed. Falling back to local mock feedback:", llmError.message);
      const mockFeedback = generateMockFeedback(category, filename, features);
      return NextResponse.json({ feedback: mockFeedback, isMock: true, warning: llmError.message });
    }

  } catch (error: any) {
    console.error('Image analysis error:', error.stack || error);
    return NextResponse.json(
      { error: 'Failed to analyze image: ' + error.message },
      { status: 500 }
    );
  }
}

function generateMockFeedback(category: string, filename: string, features: any): string {
  const dateStr = new Date().toLocaleDateString('zh-CN');
  
  if (category === 'tactics') {
    return `### 🏀 战术画板教练点评报告

这幅战术板的画面整体亮度为 **${features.brightness}/255**，线条密度约为 **${features.line_density_percent}%**，提取出的主要颜色包含了 **${features.dominant_colors.slice(0, 3).map((c: any) => c.hex).join(', ')}**。

**【画面结构评估】**
- **战术流向明确**：线条密度适中，表明跑位路线设计得清晰而不杂乱。
- **色彩引导明显**：主色调展现了良好的防守/进攻色块划分，视觉焦点非常突出。

**【战术画板教练的 3 个改进小妙招】**
1. **统一符号规范**：建议用圆圈（◯）代表进攻队员，三角（▲）代表防守队员，实线代表运球，虚线代表传球，使图纸达到专业教练术语的标准。
2. **强化强弱侧标记**：可以在画面中采用提取到的醒目暖色调（如对比色）标注“强侧（Ball Side）”的无球掩护跑位，便于直观识别战术核心。
3. **增加文字边框留白**：在右下角增加一个干净的小方框用于撰写“核心执行说明”（如“1号位突分后，4号位落底角”），提升战术图的可读性。`;
  }

  if (category === 'comics') {
    return `### 🎨 少年漫画主编点评报告

这页漫画分镜的对比度为 **${features.contrast}**，线条像素密度为 **${features.line_density_percent}%**，画面色调主要是 **${features.dominant_colors.slice(0, 3).map((c: any) => c.hex).join(', ')}**。

**【画面画风评估】**
- **分镜动感度强**：较高的线条密度（${features.line_density_percent}%）反映了动作场面的丰富细节，笔触很有张力。
- **明暗层次适中**：对比度为 **${features.contrast}**，白纸黑墨的分界清晰，能很好地勾勒出人物边缘。

**【少年漫画主编的 3 个改进小妙招】**
1. **拉大镜头对比度**：对于高潮打斗的特写格，可以增加黑色墨水的使用面积（提升画面对比度），让主色调的灰影产生体积感，使镜头更加震撼。
2. **善用“线条粗细”区分层次**：画近处的主角用粗线（0.7mm），画远处的背景或建筑用细线（0.3mm），这样可以在线稿阶段就营造出完美的空气透视感。
3. **优化对话框呼吸感**：在动作激烈的格子中，对话框边缘要留出足够的白色边距，防止字迹和密集的战斗线条挤在一起，保持画面的可读性。`;
  }

  if (category === 'calligraphy') {
    return `### ✍️ 国学书法督导点评报告

这份书法/默写练习的纸面亮度为 **${features.brightness}/255**，对比度为 **${features.contrast}**，主色调包含了 **${features.dominant_colors.slice(0, 2).map((c: any) => c.hex).join(', ')}**。

**【书风纸面评估】**
- **纸面干净整洁**：亮度为 **${features.brightness}**，对比度极高（**${features.contrast}**），墨迹乌黑，没有多余的污渍，书写态度十分端正。
- **笔画密度平稳**：线条像素密度呈现了良好的控笔稳定性。

**【书法督导的 3 个改进小妙招】**
1. **注意字间距与“计白当黑”**：可以尝试让字与字之间留出半个字大小的间距，行与行之间留出一整个字的高度，让整篇字富有呼吸感。
2. **练习“横平竖直，粗细有别”**：钢笔书写时，横画要稍微提笔起锋，写得稍细一点；竖画和折画则可稍微用力按笔，写得粗重一些，增加字体的风骨与骨骼感。
3. **增加朱砂红批注区**：建议在左侧或右侧留出一条专门的红线区域，留给爸爸用红笔写下评语或鼓励的话，极具中式书法长卷的交互美感。`;
  }

  // default / doodles
  return `### 🎨 概念设计总监点评报告

这幅概念涂鸦的分辨率为 **${features.width}x${features.height}**，主色调主要是 **${features.dominant_colors.slice(0, 3).map((c: any) => c.hex).join(', ')}**，饱和度约为 **${features.saturation}**。

**【画面第一印象】**
- **配色新颖**：色板中的主色调展现了极具个性的色彩搭配，氛围十分有趣。
- **构图饱满**：宽高比为 **${features.aspect_ratio}**，画面主体位置明确。

**【艺术总监的 3 个改进小妙招】**
1. **确立单一光源，添加投影**：选定一个方向（比如左上方）作为光源，在主体的相反一侧（右下方）用淡淡的排线或灰色调画出投影，能立刻让平面的涂鸦变得立体起来。
2. **加入故事性小元素**：比如在怪兽或角色的脚边画一朵盛开的小花，或者一只惊慌逃跑的小蜘蛛，用细节给画面赋予故事情境。
3. **利用对比色丰富层次**：可以从我们提取出的 dominant colors 以外，引入少量的对比色作为点缀高光，点亮画面的视觉重心。`;
}
