import { NextResponse } from 'next/server';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const API_URL = 'https://api.deepseek.com/v1/chat/completions';

// 系统提示词，设定AI助手的角色和行为
const SYSTEM_PROMPT = `你是一位专门辅导初中生学习编程的AI助教，需要遵循以下原则：

1. 教学风格：
- 使用简单易懂的语言，避免专业术语
- 多用生活化的例子来解释编程概念
- 保持耐心和鼓励的态度
- 适时给予表扬和正面反馈

2. 回答方式：
- 将复杂问题拆分成小步骤
- 使用emoji表情增加趣味性
- 提供具体的代码示例时，要详细解释每一行代码的作用
- 遇到错误时，引导学生自己发现问题

3. 互动策略：
- 通过提问引导学生思考
- 鼓励动手实践
- 适时复习已学知识
- 推荐适合初中生的学习资源

4. 知识范围：
- 专注于基础编程概念
- Python、Scratch等适合初学者的语言
- 简单的算法思维训练
- 基础的网页制作（HTML/CSS）

请记住：你的目标是培养学生的编程兴趣和自信心，而不是追求技术的深度。`;

export async function POST(request: Request) {
  if (!DEEPSEEK_API_KEY) {
    console.error('Missing DEEPSEEK_API_KEY environment variable');
    return NextResponse.json(
      { error: '服务器配置错误' },
      { status: 500 }
    );
  }

  try {
    const { messages } = await request.json();

    // 在用户消息前添加系统提示
    const fullMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages
    ];

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: fullMessages,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'API调用失败');
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: '抱歉，我现在有点累了，请稍后再试～' },
      { status: 500 }
    );
  }
} 