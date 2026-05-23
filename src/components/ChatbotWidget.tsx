import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Minimize2 } from 'lucide-react';
import { API_URL } from '../lib/api';
import { useChat } from '../context/ChatContext';

interface Message {
  id: number;
  sender: 'bot' | 'user';
  text: string;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: 0,
    sender: 'bot',
    text: "Hi! I'm LiForce AI. I can check your donation eligibility, help you find nearby blood banks, or answer questions about the donation process. How can I help you?",
  },
];

// Removed mock BOT_RESPONSES and getBotReply
const ChatbotWidget: React.FC = () => {
  const { isOpen, toggleChat, closeChat } = useChat();
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const sendMessage = async (presetText?: string) => {
    const text = presetText || inputValue.trim();
    if (!text) return;

    const userMsg: Message = { id: Date.now(), sender: 'user', text };
    const currentMessages = [...messages, userMsg];
    setMessages(currentMessages);
    if (!presetText) setInputValue('');
    setIsTyping(true);

    try {
      // Convert to Anthropic format
      const apiMessages = currentMessages
        .filter(m => m.id !== 0) // Skip initial greeting
        .map(m => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text
        }));

      const response = await fetch(`${API_URL}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages })
      });
      
      const data = await response.json();
      
      const botMsg: Message = {
        id: Date.now() + 1,
        sender: 'bot',
        text: data.reply || "Sorry, I'm having trouble connecting right now.",
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      console.error("AI Error:", error);
      const botMsg: Message = {
        id: Date.now() + 1,
        sender: 'bot',
        text: "I am unable to connect to the AI service right now.",
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const QUICK_REPLIES = ['Am I eligible?', 'Find nearby banks', 'Emergency help', 'What to eat?'];

  return (
    <>
      {/* Floating Toggle Button */}
      <div className="fixed bottom-6 right-4 sm:right-6 z-50 flex flex-col items-end gap-3">
        <AnimatePresence>
          {!isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="bg-white px-3 py-1.5 rounded-full shadow-md border border-border text-sm font-medium text-text-primary whitespace-nowrap"
            >
              Ask LiForce AI 🤖
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleChat}
          className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center shadow-xl shadow-red-500/30 border-4 border-white hover:bg-primary-dark transition-colors"
          aria-label="Toggle chat"
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                <X className="w-6 h-6" />
              </motion.span>
            ) : (
              <motion.span key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
                <Bot className="w-6 h-6" />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-24 right-6 z-50 w-[340px] sm:w-[380px] bg-surface rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col"
            style={{ maxHeight: 'min(500px, calc(100vh - 120px))' }}
          >
            {/* Header */}
            <div className="bg-primary px-5 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center">
                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center mr-3 border border-white/30">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-white text-sm leading-none">LiForce AI</p>
                  <p className="text-primary-light text-xs mt-0.5 flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 mr-1.5 animate-pulse"></span>
                    Online now
                  </p>
                </div>
              </div>
              <button type="button" onClick={closeChat} className="text-white/70 hover:text-white transition-colors p-1">
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-grow overflow-y-auto p-4 space-y-3 bg-gray-50">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'bot' && (
                    <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center mr-2 shrink-0 mt-1">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-primary text-white rounded-tr-sm'
                        : 'bg-white text-text-primary shadow-sm border border-border rounded-tl-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                </motion.div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center">
                  <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center mr-2 shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-white border border-border px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm flex items-center space-x-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Replies */}
            <div className="px-4 pt-3 pb-2 flex gap-2 overflow-x-auto hide-scrollbar shrink-0 bg-white border-t border-border">
              {QUICK_REPLIES.map((reply) => (
                <button
                  key={reply}
                  onClick={() => {
                    setInputValue('');
                    sendMessage(reply);
                  }}
                  className="shrink-0 text-xs bg-gray-100 hover:bg-primary-light hover:text-primary-dark border border-border px-3 py-1.5 rounded-full font-medium transition-colors whitespace-nowrap"
                >
                  {reply}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <div className="flex items-center px-4 pb-4 pt-2 gap-2 bg-white shrink-0">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about blood donation…"
                className="flex-grow px-4 py-2.5 rounded-xl border border-border bg-gray-50 text-sm outline-none focus:border-primary transition-colors"
              />
              <button
                onClick={() => sendMessage()}
                disabled={!inputValue.trim()}
                className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatbotWidget;
