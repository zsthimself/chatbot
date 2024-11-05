import { useRef, useEffect, useState } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function Chat() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // 在消息发送后保持输入框焦点
  const maintainFocus = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // 组件加载时自动聚焦输入框
  useEffect(() => {
    maintainFocus();
  }, []);

  // 每次消息更新后也保持焦点
  useEffect(() => {
    maintainFocus();
  }, [messages]);

  const sendMessage = async (message: string, retryCount = 0) => {
    if (!message.trim()) return;
    
    try {
      setIsLoading(true);
      // 立即添加用户消息到界面
      setMessages(prev => [...prev, { role: 'user', content: message }]);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: message }]
        }),
      });

      if (!response.ok) {
        if (retryCount < 3) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          return sendMessage(message, retryCount + 1);
        }
        throw new Error('API请求失败');
      }

      const data = await response.json();
      
      // 添加AI响应到消息列表
      if (data.choices?.[0]?.message) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.choices[0].message.content
        }]);
      }
    } catch (error) {
      console.error('发送消息失败:', error);
      // 显示错误消息
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '抱歉，发生了错误，请稍后重试。'
      }]);
    } finally {
      setIsLoading(false);
      // 重置输入框并保持焦点
      if (inputRef.current) {
        inputRef.current.value = '';
        maintainFocus();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
      e.preventDefault();
      const message = e.currentTarget.value.trim();
      if (message) {
        sendMessage(message);
      }
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg ${
              message.role === 'user' 
                ? 'bg-blue-500 text-white ml-auto' 
                : 'bg-gray-100 mr-auto'
            }`}
          >
            {message.content}
          </div>
        ))}
        {isLoading && (
          <div className="text-center text-gray-500">
            AI正在思考...
          </div>
        )}
      </div>

      {/* 输入区域 */}
      <div className="border-t p-4">
        <div className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="输入你的问题..."
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            autoFocus
            // 防止失去焦点
            onBlur={maintainFocus}
          />
          <button
            className={`px-4 py-2 rounded-lg ${
              isLoading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-500 hover:bg-blue-600'
            } text-white`}
            onClick={() => {
              const input = inputRef.current;
              if (input && input.value.trim() && !isLoading) {
                sendMessage(input.value.trim());
              }
            }}
            disabled={isLoading}
          >
            发送
          </button>
        </div>
      </div>
    </div>
  );
} 