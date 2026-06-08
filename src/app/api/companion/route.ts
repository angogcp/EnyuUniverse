// src/app/api/companion/route.ts
// DeepSeek LLM API Route for Project J - AI Story Companion & Empathy Module

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { title, content, type } = await request.json();

    const apiKey = process.env.DEEPSEEK_API_KEY;
    const modelName = process.env.DEEPSEEK_ANALYSIS_MODEL || 'deepseek-v4-flash';

    if (!apiKey) {
      // Fallback response if API key is missing
      return NextResponse.json({
        questions: [
          "这个故事的核心矛盾是什么？",
          "主角在做出抉择时，最在乎的是什么？",
          "有没有人会反对主角的做法，他们的理由是什么？"
        ],
        empathyTriggered: false
      });
    }

    // Determine the type-specific instructions and system prompts
    let systemInstruction = `你是一位专注守护少年想象力的“数字成长花园编辑与提问者”。
你的核心原则是：
1. 绝对不要代替孩子写故事、补全句子或生成任何剧情代码！你只扮演提问者、倾听者和陪伴者的角色。
2. 提问语气要温暖、温柔、充满好奇心，不要像老师，也不要说教。
3. 你的任务是引导孩子深入思考他创作的世界，鼓励他完善细节。

根据用户提供的小说或设定，提出3-4个能够激发想象力和逻辑推理的开放式问题。
返回的格式必须是合法的 JSON 对象，不要包含 markdown 格式标记，结构如下：
{
  "questions": ["问题1", "问题2", "问题3"],
  "empathyTriggered": false
}`;

    // Empathy Module Trigger: If content deals with war, power, strategy, or conflict
    const isConflictRelated = 
      type === 'wargame' || 
      type === 'sci-fi' || 
      ['战争', '冲突', '权力', '胜负', '军队', '打败', '消灭', '帝国'].some(keyword => 
        (title + ' ' + content).includes(keyword)
      );

    if (isConflictRelated) {
      systemInstruction += `\n\n【重要！同理心模块触发】此创作涉及冲突、战争或权力。
你必须强制包含至少两个从不同立场（如平民、普通士兵、失败者、对手、无辜波及者）出发的反思问题。例如：
- 普通士兵在这场冲突中会面临什么？
- 战败者会如何记录这段历史？
- 被牵连的平民会有什么感受？
请把 JSON 的 "empathyTriggered" 设为 true。`;
    }

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: `作品标题: ${title}\n作品类型: ${type}\n内容大纲:\n${content}` }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.statusText}`);
    }

    const data = await response.json();
    const resultText = data.choices[0].message.content;
    const resultObj = JSON.parse(resultText);

    return NextResponse.json(resultObj);
  } catch (error) {
    console.error('Failed to generate companion questions:', error);
    return NextResponse.json(
      { error: 'Failed to contact AI Companion' },
      { status: 500 }
    );
  }
}
