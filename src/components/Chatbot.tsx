import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Settings, Bot, User, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';

import { useUser } from '../contexts/UserContext';
import { API_CONFIG, getAuthHeaders } from '../lib/apiConfig';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatbotProps {
  isDark: boolean;
}

async function chatWithGroq(
  message: string,
  history: { role: string; content: string }[]
): Promise<string> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.chat}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message,
        history: history.map(h => ({ role: h.role, content: h.content }))
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to send message' }));
      throw new Error(error.message || `API error: ${response.status}`);
    }

    const data = await response.json();
    return data.message || 'Sorry, I could not generate a response.';
  } catch (error) {
    console.error('Chat API error:', error);
    throw error;
  }
}

export function Chatbot({ isDark }: ChatbotProps) {
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Welcome to Motif! I\'m your AI assistant here to help with startup ideas, business planning, and entrepreneurship questions. What would you like to explore today?',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const chatButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    // Close chatbot when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      // Check if click is inside a Dialog portal (settings popup)
      const target = event.target as HTMLElement;
      const isInsideDialog = target.closest('[data-slot="dialog-portal"]') ||
        target.closest('[data-slot="dialog-content"]') ||
        target.closest('[data-slot="dialog-overlay"]');

      if (
        isOpen &&
        chatWindowRef.current &&
        chatButtonRef.current &&
        !chatWindowRef.current.contains(event.target as Node) &&
        !chatButtonRef.current.contains(event.target as Node) &&
        !isInsideDialog
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    if (!user) {
      toast.error('Please login to use the chatbot');
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Send message to Groq API directly
      const history = messages.slice(1).map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const responseText = await chatWithGroq(inputValue, history);

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseText,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';

      if (errorMessage.includes('Rate limit') || errorMessage.includes('rate_limit')) {
        toast.error('Rate limit exceeded. Please try again in a moment.');
      } else if (errorMessage.includes('Not authenticated')) {
        toast.error('Please login to use the chat feature.');
      } else if (errorMessage.includes('Failed to fetch') || errorMessage.includes('Network')) {
        toast.error('Cannot connect to AI service. Please ensure the backend is running.');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: 'Welcome to Motif! I\'m your AI assistant here to help with startup ideas, business planning, and entrepreneurship questions. What would you like to explore today?',
        timestamp: new Date()
      }
    ]);
    toast.success('Chat cleared!');
  };

  const saveSettings = () => {
    setIsSettingsOpen(false);
    toast.success('Chat cleared successfully!');
  };

  return (
    <div>
      {/* Chat Toggle Button */}
      <div
        ref={chatButtonRef}
        className="chatbot-button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: isDark
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)',
          zIndex: 9999,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: 'scale(1)',
          animation: 'pulse 2s infinite'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1) translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 12px 40px rgba(102, 126, 234, 0.6)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1) translateY(0px)';
          e.currentTarget.style.boxShadow = '0 8px 32px rgba(102, 126, 234, 0.4)';
        }}
      >
        <MessageCircle size={28} />
        <Sparkles
          size={16}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            animation: 'sparkle 1.5s ease-in-out infinite'
          }}
        />
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div
          ref={chatWindowRef}
          className="chatbot-window"
          style={{
            position: 'fixed',
            bottom: '100px',
            right: '24px',
            width: '420px',
            height: '650px',
            zIndex: 9998,
            background: isDark
              ? 'linear-gradient(145deg, #1f2937 0%, #111827 100%)'
              : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '20px',
            boxShadow: isDark
              ? '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05)'
              : '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            backdropFilter: 'blur(20px)',
            animation: 'slideInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          {/* Header */}
          <div style={{
            padding: '20px',
            background: isDark
              ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)'
              : 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
            borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'glow 2s ease-in-out infinite alternate'
              }}>
                <Bot size={20} color="white" />
              </div>
              <div>
                <div style={{
                  fontWeight: '700',
                  fontSize: '18px',
                  color: isDark ? '#f9fafb' : '#111827',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  Motif AI
                </div>
                <div style={{
                  fontSize: '12px',
                  color: isDark ? '#9ca3af' : '#6b7280',
                  opacity: 0.8
                }}>
                  • Online
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogTrigger asChild>
                  <button style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '8px',
                    borderRadius: '8px',
                    color: isDark ? '#9ca3af' : '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
                      e.currentTarget.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}>
                    <Settings size={18} />
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Chatbot Settings</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Clear your conversation history to start fresh.
                    </p>
                    <Button onClick={clearChat} className="w-full">
                      Clear Chat History
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '8px',
                  color: isDark ? '#9ca3af' : '#6b7280',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div style={{
            flex: '1',
            overflowY: 'auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {messages.map((message, index) => (
              <div
                key={message.id}
                style={{
                  display: 'flex',
                  gap: '12px',
                  flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
                  animation: `messageSlideIn 0.3s ease-out ${index * 0.1}s both`
                }}
              >
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '12px',
                  background: message.role === 'user'
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : (isDark ? 'linear-gradient(135deg, #374151 0%, #4b5563 100%)' : 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)'),
                  color: message.role === 'user'
                    ? '#ffffff'
                    : (isDark ? '#d1d5db' : '#6b7280'),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  border: '2px solid rgba(255, 255, 255, 0.1)'
                }}>
                  {message.role === 'user' ? <User size={18} /> : <Bot size={18} />}
                </div>
                <div style={{
                  maxWidth: '300px',
                  padding: '14px 18px',
                  borderRadius: '18px',
                  background: message.role === 'user'
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : (isDark
                      ? 'linear-gradient(135deg, #374151 0%, #4b5563 100%)'
                      : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'),
                  color: message.role === 'user'
                    ? '#ffffff'
                    : (isDark ? '#f9fafb' : '#1e293b'),
                  wordWrap: 'break-word',
                  wordBreak: 'break-word',
                  whiteSpace: 'pre-wrap',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  border: message.role !== 'user' ? `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}` : 'none',
                  position: 'relative',
                  animation: 'messageGlow 0.5s ease-out'
                }}>
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div style={{
                display: 'flex',
                gap: '12px',
                animation: 'messageSlideIn 0.3s ease-out'
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '12px',
                  background: isDark ? 'linear-gradient(135deg, #374151 0%, #4b5563 100%)' : 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                  color: isDark ? '#d1d5db' : '#6b7280',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  border: '2px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <Bot size={18} />
                </div>
                <div style={{
                  padding: '14px 18px',
                  borderRadius: '18px',
                  background: isDark ? 'linear-gradient(135deg, #374151 0%, #4b5563 100%)' : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                  display: 'flex',
                  gap: '6px',
                  alignItems: 'center',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    animation: 'typingDot 1.4s infinite',
                    animationDelay: '0s'
                  }}></div>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    animation: 'typingDot 1.4s infinite',
                    animationDelay: '0.2s'
                  }}></div>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    animation: 'typingDot 1.4s infinite',
                    animationDelay: '0.4s'
                  }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: '20px',
            background: isDark
              ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)'
              : 'linear-gradient(135deg, rgba(102, 126, 234, 0.02) 0%, rgba(118, 75, 162, 0.02) 100%)',
            borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.05)',
          }}>
            <div style={{
              display: 'flex',
              gap: '12px',
              padding: '12px',
              borderRadius: '16px',
              background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
            }}>
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={isLoading}
                style={{
                  flex: '1',
                  border: 'none',
                  background: 'transparent',
                  fontSize: '14px'
                }}
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !inputValue.trim()}
                style={{
                  background: inputValue.trim()
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : (isDark ? '#374151' : '#e5e7eb'),
                  color: inputValue.trim() ? '#ffffff' : (isDark ? '#9ca3af' : '#6b7280'),
                  border: 'none',
                  borderRadius: '12px',
                  padding: '10px',
                  cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  transform: 'scale(1)',
                  boxShadow: inputValue.trim() ? '0 4px 12px rgba(102, 126, 234, 0.3)' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (inputValue.trim()) {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = inputValue.trim() ? '0 4px 12px rgba(102, 126, 234, 0.3)' : 'none';
                }}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }

        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0.5) rotate(0deg); }
          50% { opacity: 1; transform: scale(1) rotate(180deg); }
        }

        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes messageSlideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes messageGlow {
          0% { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); }
          50% { box-shadow: 0 8px 24px rgba(102, 126, 234, 0.2); }
          100% { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); }
        }

        @keyframes glow {
          0% { box-shadow: 0 0 5px rgba(102, 126, 234, 0.5); }
          100% { box-shadow: 0 0 20px rgba(102, 126, 234, 0.8), 0 0 30px rgba(118, 75, 162, 0.4); }
        }

        @keyframes typingDot {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }

        .chatbot-window::-webkit-scrollbar {
          width: 4px;
        }

        .chatbot-window::-webkit-scrollbar-track {
          background: transparent;
        }

        .chatbot-window::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
}