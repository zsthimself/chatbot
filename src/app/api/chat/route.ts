import { NextResponse } from 'next/server';
import { requestQueue } from '@/lib/requestQueue';

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

请记住：你的目标是培养学生的编程���趣和自信心，而不是追求技术的深度。`;

interface ApiError {
  message: string;
  stack?: string;
  cause?: unknown;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1秒

async function makeRequest(request: Request, retryCount = 0): Promise<Response> {
  try {
    if (!DEEPSEEK_API_KEY) {
      console.error('Missing DEEPSEEK_API_KEY environment variable');
      return NextResponse.json(
        { error: '服务器配置错误' },
        { status: 500 }
      );
    }

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
        'retry-after': '2',
      },
      signal: AbortSignal.timeout(10000),
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: fullMessages,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (response.status === 429) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      return makeRequest(request);
    }

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'API调用失败');
    }

    return NextResponse.json(data);
  } catch (error) {
    const apiError = error as ApiError;
    console.error('Chat API Error:', {
      message: apiError.message || '未知错误',
      status: apiError.name === 'AbortError' ? '请求超时' : apiError.message,
      timestamp: new Date().toISOString(),
      stack: apiError.stack,
    });
    
    if (retryCount < MAX_RETRIES) {
      console.log(`重试请求 ${retryCount + 1}/${MAX_RETRIES}`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return makeRequest(request, retryCount + 1);
    }
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const response = await makeRequest(request);

    if (response.status === 429) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      return POST(request);
    }

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'API调用失败');
    }

    return NextResponse.json(data);
  } catch (error) {
    const apiError = error as ApiError;
    console.error('Chat API Error:', {
      message: apiError.message || '未知错误',
      status: apiError.name === 'AbortError' ? '请求超时' : apiError.message,
      timestamp: new Date().toISOString(),
      stack: apiError.stack,
    });
    
    return NextResponse.json(
      { 
        error: apiError.name === 'AbortError' 
          ? '请求超时，请稍后重试' 
          : (apiError.message || '服务器错误')
      },
      { status: apiError.name === 'AbortError' ? 408 : 500 }
    );
  }
} 