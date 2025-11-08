
import React from 'react';
import { ChatMessage, Sender } from '../types';
import { RobotIcon, UserIcon } from './icons';

interface ChatBubbleProps {
  message: ChatMessage;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isUser = message.sender === Sender.USER;

  const bubbleClasses = isUser
    ? 'bg-blue-500 text-white self-end rounded-l-xl rounded-tr-xl'
    : 'bg-white text-gray-700 self-start rounded-r-xl rounded-tl-xl';
  
  const containerClasses = isUser ? 'flex-row-reverse' : 'flex-row';

  const Avatar = () => (
    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${isUser ? 'bg-blue-400 ml-3' : 'bg-purple-400 mr-3'}`}>
      {isUser ? <UserIcon /> : <RobotIcon />}
    </div>
  );

  return (
    <div className={`flex items-start my-2 w-full max-w-lg mx-auto ${containerClasses}`}>
      <Avatar />
      <div className={`px-4 py-3 shadow-md ${bubbleClasses}`}>
        <p className="text-base">{message.text}</p>
      </div>
    </div>
  );
};

export default ChatBubble;
