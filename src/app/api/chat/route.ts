import { NextResponse } from 'next/server';

const DEEPSEEK_API_KEY = 'sk-268b0da7cb8e4c218d8065f901c4b5cb';
const API_URL = 'https://api.deepseek.com/v1/chat/completions';

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: messages,
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
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
} 