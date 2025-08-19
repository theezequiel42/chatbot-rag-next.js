import React, { useEffect, useState } from 'react';
import { ChatMessage, Sender } from '../types';

interface MessageBubbleProps {
  message: ChatMessage;
  isLoading?: boolean;
}

const BotAvatar: React.FC = () => (
  <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0" role="img" aria-label="Avatar do Anjo Amigo">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  </div>
);


const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isLoading = false }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Trigger the animation shortly after mounting
    const timer = setTimeout(() => setShow(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const isUser = message.sender === Sender.User;

  const renderText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-semibold">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const bubbleContainerClasses = isUser
    ? 'flex justify-end'
    : 'flex justify-start items-end space-x-2';

  const bubbleClasses = isUser
    ? 'bg-pink-500 text-white rounded-br-none'
    : 'bg-purple-500 text-white rounded-bl-none';
    
  const animationClasses = show
    ? 'opacity-100 translate-y-0'
    : 'opacity-0 translate-y-2';

  return (
    <div className={bubbleContainerClasses}>
      {!isUser && <BotAvatar />}
      <div className={`py-3 px-4 rounded-2xl max-w-xs lg:max-w-md shadow-md transition-all duration-300 ease-out ${bubbleClasses} ${animationClasses}`}>
        {isLoading ? (
          <div className="flex items-center justify-center space-x-1.5">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-white rounded-full animate-pulse [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          </div>
        ) : (
          renderText(message.text)
        )}
      </div>
    </div>
  );
};

export default MessageBubble;