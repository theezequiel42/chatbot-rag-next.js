
import React from 'react';
import { ChatMessage, Sender } from '../types';

interface MessageBubbleProps {
  message: ChatMessage;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.sender === Sender.User;

  // Function to parse and render bold text
  const renderText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-bold">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const bubbleClasses = isUser
    ? 'bg-purple-600 text-white self-end rounded-br-none'
    : 'bg-gray-200 text-gray-800 self-start rounded-bl-none';

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-lg lg:max-w-xl px-4 py-3 rounded-2xl shadow-md ${bubbleClasses}`}>
        <p className="text-sm">{renderText(message.text)}</p>
      </div>
    </div>
  );
};

export default MessageBubble;
