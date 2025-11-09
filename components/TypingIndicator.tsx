import React from 'react';
import { CuteRobotIcon } from './icons';

const TypingIndicator: React.FC = () => {
  return (
    <div className="flex items-end my-3 w-full max-w-lg mx-auto flex-row">
      <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center mr-2">
        <CuteRobotIcon />
      </div>
      <div className="bg-white text-slate-800 self-start rounded-t-2xl rounded-r-2xl px-5 py-3 shadow-md">
        <div className="flex items-center justify-center space-x-1.5">
          <div className="w-2.5 h-2.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2.5 h-2.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2.5 h-2.5 bg-slate-400 rounded-full animate-bounce"></div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;