
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Chat } from '@google/genai';
import { ChatMessage, Sender } from '../types';
import { createChatSession, sendMessageToBot } from '../services/geminiService';
import MessageBubble from './MessageBubble';

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chat, setChat] = useState<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const initializeChat = useCallback(() => {
    const newChat = createChatSession();
    setChat(newChat);
    const welcomeMessage: ChatMessage = {
        id: `bot-welcome-${Date.now()}`,
        text: "Olá! Eu sou o Anjo Amigo. Estou aqui para conversar e te ajudar a entender mais sobre relacionamentos e violência doméstica. Como posso te ajudar hoje?",
        sender: Sender.Bot,
    };
    setMessages([welcomeMessage]);
  }, []);

  useEffect(() => {
    initializeChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !chat) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      text: input,
      sender: Sender.User,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    let botResponses: string[] = [];

    try {
        botResponses = await sendMessageToBot(chat, input);
        
        botResponses.forEach((text, index) => {
            setTimeout(() => {
                const botMessage: ChatMessage = {
                    id: `bot-${Date.now()}-${index}`,
                    text,
                    sender: Sender.Bot,
                };
                setMessages((prev) => [...prev, botMessage]);
            }, (index + 1) * 600); // Stagger the appearance of bubbles
        });

    } catch (error) {
        console.error("Failed to get response from bot:", error);
        const errorMessage: ChatMessage = {
            id: `bot-error-${Date.now()}`,
            text: "Desculpe, ocorreu um erro. Por favor, tente novamente.",
            sender: Sender.Bot,
        };
        setMessages((prev) => [...prev, errorMessage]);
    } finally {
        // Wait for all staggered messages to be displayed before hiding loading
        setTimeout(() => {
            setIsLoading(false);
        }, botResponses.length * 600);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow p-6 overflow-y-auto bg-gray-50/50">
        <div className="flex flex-col space-y-4">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          {isLoading && (
            <div className="flex justify-start">
                <div className="bg-gray-200 rounded-lg p-3 max-w-lg">
                    <div className="flex items-center justify-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-gray-500 animate-pulse"></div>
                        <div className="w-2 h-2 rounded-full bg-gray-500 animate-pulse [animation-delay:0.2s]"></div>
                        <div className="w-2 h-2 rounded-full bg-gray-500 animate-pulse [animation-delay:0.4s]"></div>
                    </div>
                </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="p-4 bg-white border-t border-gray-200">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua mensagem..."
            disabled={isLoading}
            className="flex-grow px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:opacity-50 transition-shadow"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="flex-shrink-0 p-2 text-white bg-purple-600 rounded-full hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 disabled:bg-purple-300 disabled:cursor-not-allowed transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
