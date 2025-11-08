
import React from 'react';
import { RobotIcon } from './icons';

const TypingIndicator: React.FC = () => {
  return (
    <div className="flex items-start my-2 w-full max-w-lg mx-auto flex-row">
      <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-purple-400 mr-3">
        <RobotIcon />
      </div>
      <div className="bg-white text-gray-700 self-start rounded-r-xl rounded-tl-xl px-4 py-3 shadow-md">
        <div className="flex items-center justify-center space-x-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
