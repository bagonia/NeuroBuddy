import React from 'react';
import { ChatMessage, Sender } from '../types';
import { CuteRobotIcon, UserIcon } from './icons';

interface ChatBubbleProps {
  message: ChatMessage;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isUser = message.sender === Sender.USER;

  const bubbleClasses = isUser
    ? 'bg-teal-500 text-white self-end rounded-t-2xl rounded-l-2xl'
    : 'bg-white text-slate-800 self-start rounded-t-2xl rounded-r-2xl';
  
  const containerClasses = isUser ? 'flex-row-reverse' : 'flex-row';

  const Avatar = () => {
    if(isUser) {
        return (
            <div className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center shadow-sm bg-amber-400 ml-3`}>
                <UserIcon />
            </div>
        )
    }
    return (
        <div className={`flex-shrink-0 w-12 h-12 flex items-center justify-center mr-2`}>
            <CuteRobotIcon />
        </div>
    )
  };

  return (
    <div className={`flex items-end my-3 w-full max-w-lg mx-auto ${containerClasses}`}>
      <Avatar />
      <div className={`px-5 py-3 shadow-md ${bubbleClasses}`}>
        <p className="text-base leading-relaxed">{message.text}</p>
      </div>
    </div>
  );
};

export default ChatBubble;