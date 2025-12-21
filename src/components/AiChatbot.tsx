"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MessageCircle, X, Send, Sparkles, Loader2, Sun } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AiChatbotProps {
  domain?: 'tarot' | 'astrology' | 'chakra' | 'general';
}

export default function AiChatbot({ domain = 'general' }: AiChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessages: Record<string, string> = {
        tarot: "Welcome, seeker. I am your Tarot guide. Ask me about card meanings, spreads, or request a reading. How may I illuminate your path today?",
        astrology: "Greetings, celestial traveler. I am your Astrology advisor. Ask about zodiac signs, planetary transits, or cosmic influences. What wisdom do you seek from the stars?",
        chakra: "Namaste, beautiful soul. I am your Chakra healing guide. Ask about energy centers, balancing techniques, or holistic wellness. How may I help harmonize your energy?",
        general: "Welcome to Dira's Mystical Advisor. I'm here to guide you through tarot, astrology, chakras, and spiritual matters. What wisdom do you seek?",
      };

      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: welcomeMessages[domain] || welcomeMessages.general,
        timestamp: new Date(),
      }]);
    }
  }, [isOpen, domain, messages.length]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const assistantMessageId = `assistant-${Date.now()}`;
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, assistantMessage]);

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages
            .filter(m => m.id !== 'welcome')
            .concat(userMessage)
            .map(m => ({ role: m.role, content: m.content })),
          domain,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        let errorMessage = 'Failed to get response';
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const error = await response.json();
            errorMessage = error.error || errorMessage;
          } else {
            const text = await response.text();
            errorMessage = text || errorMessage;
          }
        } catch {
          errorMessage = `Server error (${response.status})`;
        }
        throw new Error(errorMessage);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          assistantContent += chunk;

          setMessages(prev =>
            prev.map(m =>
              m.id === assistantMessageId
                ? { ...m, content: assistantContent }
                : m
            )
          );
        }
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Chat error:', error);
        toast.error(error.message || 'Failed to get response');
        
        setMessages(prev => prev.filter(m => m.id !== assistantMessageId));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setIsOpen(false);
  };

  const domainConfig = {
    tarot: {
      title: 'Tarot Advisor',
      subtitle: 'Card readings & interpretations',
      icon: '🔮',
    },
    astrology: {
      title: 'Astrology Guide',
      subtitle: 'Cosmic wisdom & insights',
      icon: '✨',
    },
    chakra: {
      title: 'Chakra Healer',
      subtitle: 'Energy & wellness',
      icon: '🧘',
    },
    general: {
      title: 'Mystical Advisor',
      subtitle: 'Your spiritual companion',
      icon: '🌙',
    },
  };

  const config = domainConfig[domain] || domainConfig.general;

  return (
    <>
      {!isOpen && (
          <Button
            onClick={() => setIsOpen(true)}
            size="lg"
            className="fixed bottom-6 right-6 z-50 rounded-full h-16 w-16 shadow-2xl bg-primary hover:bg-primary/90 hover:scale-110 transition-all duration-300"
          >
            <Sun className="h-8 w-8 text-primary-foreground" />
          </Button>

      )}

      {isOpen && (
        <Card className="fixed bottom-6 right-6 z-50 w-[400px] h-[600px] flex flex-col shadow-2xl overflow-hidden bg-card border-primary/20 gold-border">
          <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 p-4 border-b border-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                  <span className="text-xl">{config.icon}</span>
                </div>
                <div>
                  <h3 className="font-bebas text-2xl tracking-wide text-primary">{config.title}</h3>
                  <p className="text-sm font-serif italic text-muted-foreground">{config.subtitle}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClearChat}
                className="hover:bg-primary/10"
              >
                <X className="h-5 w-5 text-primary" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/50 font-serif">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-4 py-2 rounded-2xl shadow-sm ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-white/80 border border-primary/10'
                  }`}
                >
                  {message.role === 'assistant' && message.id === 'welcome' && (
                    <Sparkles className="h-4 w-4 inline mr-2 text-primary" />
                  )}
                  <p className="text-base whitespace-pre-wrap italic">{message.content}</p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-card border border-primary/20 px-4 py-2 rounded-2xl">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="border-t border-primary/20 p-4 bg-card">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask your question..."
                disabled={isLoading}
                className="flex-1 px-4 py-2 border border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 disabled:opacity-50 bg-background text-foreground placeholder:text-muted-foreground"
              />
              <Button
                type="submit"
                disabled={!input.trim() || isLoading}
                size="icon"
                className="bg-primary hover:bg-primary/90"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </>
  );
}