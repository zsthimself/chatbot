'use client';
import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function Home() {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<Message[]>([
    {
      role: 'assistant',
      content: '你好！我是AI助手，很高兴为你服务。请告诉我你的需求？'
    }
  ]);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // 自动滚动到最新消息
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    const userMessage = message.trim();
    setMessage('');
    setIsLoading(true);

    // 添加用户消息到聊天历史
    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            ...chatHistory,
            { role: 'user', content: userMessage }
          ]
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '请求失败');
      }

      // 添加AI响应到聊天历史
      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: data.choices[0].message.content
      }]);
    } catch (error) {
      console.error('Chat error:', error);
      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: '抱歉，发生了错误。请稍后重试。'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // 自定义Markdown组件样式
  const MarkdownComponents = {
    // 代码块样式
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline ? (
        <pre className="bg-gray-800 rounded-lg p-4 my-2 overflow-x-auto">
          <code className={`${className} text-sm text-gray-200`} {...props}>
            {children}
          </code>
        </pre>
      ) : (
        <code className="bg-gray-100 rounded px-1 py-0.5 text-gray-800" {...props}>
          {children}
        </code>
      );
    },
    // 列表样式
    ul({ children }: any) {
      return <ul className="list-disc ml-4 my-2">{children}</ul>;
    },
    ol({ children }: any) {
      return <ol className="list-decimal ml-4 my-2">{children}</ol>;
    },
    // 链接样式
    a({ children, href }: any) {
      return (
        <a href={href} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      );
    },
    // 标题样式
    h1: ({ children }: any) => <h1 className="text-2xl font-bold my-4">{children}</h1>,
    h2: ({ children }: any) => <h2 className="text-xl font-bold my-3">{children}</h2>,
    h3: ({ children }: any) => <h3 className="text-lg font-bold my-2">{children}</h3>,
    // 段落样式
    p: ({ children }: any) => <p className="my-2">{children}</p>,
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              AI智能助手
            </span>
          </h1>
        </div>

        {/* 聊天界面 */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* 聊天历史 */}
          <div 
            ref={chatContainerRef}
            className="h-[500px] overflow-y-auto p-4 space-y-4 scroll-smooth"
          >
            {chatHistory.map((chat, index) => (
              <div
                key={index}
                className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    chat.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-gray-100 text-gray-800 rounded-bl-none'
                  }`}
                >
                  {chat.role === 'assistant' ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw, rehypeSanitize]}
                      components={MarkdownComponents}
                      className="prose prose-sm max-w-none"
                    >
                      {chat.content}
                    </ReactMarkdown>
                  ) : (
                    chat.content
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl px-4 py-2 rounded-bl-none">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 输入框 */}
          <form onSubmit={handleSubmit} className="border-t border-gray-200 p-4">
            <div className="flex gap-4">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="输入你的问题..."
                disabled={isLoading}
                className="flex-1 rounded-full border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="rounded-full bg-blue-600 px-6 py-2 text-white font-semibold hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 disabled:bg-blue-400 disabled:cursor-not-allowed"
              >
                {isLoading ? '发送中...' : '发送'}
              </button>
            </div>
          </form>
        </div>

        {/* Features Section */}
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="flex items-center p-4 bg-white rounded-xl shadow-sm"
            >
              <div className="rounded-lg bg-blue-50 p-2">
                {feature.icon}
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-semibold text-gray-900">
                  {feature.title}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

const features = [
  {
    icon: (
      <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
    title: '智能对话',
  },
  {
    icon: (
      <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: '即时响应',
  },
  {
    icon: (
      <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: '安全可靠',
  },
];
