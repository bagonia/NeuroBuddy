import React from 'react';

export const CuteRobotIcon = ({ className = "h-12 w-12" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="5" y="10" width="14" height="9" rx="3" fill="#A7F3D0" />
    <rect x="5" y="8" width="14" height="5" rx="2" fill="#D1FAE5" />
    <circle cx="12" cy="13" r="3" fill="white" />
    <circle cx="12" cy="13" r="1.5" fill="#1F2937" />
    <path d="M9 8L8 5M15 8L16 5" stroke="#34D399" strokeWidth="1.5" strokeLinecap="round" />
    <rect x="7" y="19" width="3" height="3" rx="1.5" fill="#6EE7B7" />
    <rect x="14" y="19" width="3" height="3" rx="1.5" fill="#6EE7B7" />
  </svg>
);


export const NeuroBuddyIcon = ({ className = "h-8 w-8 text-white" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    viewBox="0 0 24 24"
    strokeWidth="1.5"
    stroke="currentColor"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M11.25 21.75a2.25 2.25 0 0 1 -2.25 -2.25v-1.5a4.5 4.5 0 0 1 4.5 -4.5h1.5a4.5 4.5 0 0 1 4.5 4.5v1.5a2.25 2.25 0 0 1 -2.25 2.25z" />
    <path d="M12 18h3.75" />
    <path d="M4.5 12.75v-3a2.25 2.25 0 0 1 2.25 -2.25h10.5a2.25 2.25 0 0 1 2.25 2.25v3" />
    <circle cx="15.75" cy="11.25" r="1.5" fill="currentColor" />
    <circle cx="8.25" cy="11.25" r="1.5" fill="currentColor" />
    <path d="M14.25 7.5l.75 -3" />
    <path d="M9.75 7.5l-.75 -3" />
  </svg>
);


export const UserIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-7 w-7 text-white"
    viewBox="0 0 24 24"
    strokeWidth="1.5"
    stroke="currentColor"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="10" r="3" />
    <path d="M6.168 18.849a4 4 0 0 1 3.832 -2.849h4a4 4 0 0 1 3.834 2.855" />
  </svg>
);

export const PaperPlaneIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    viewBox="0 0 24 24"
    strokeWidth="2"
    stroke="currentColor"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
     <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
     <path d="M15 10l-4 4l6 6l4 -16l-18 7l4 2l2 6l3 -4" />
  </svg>
);


export const MicrophoneIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    viewBox="0 0 24 24"
    strokeWidth="2"
    stroke="currentColor"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <rect x="9" y="2" width="6" height="11" rx="3" />
    <path d="M5 10a7 7 0 0 0 14 0" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);

export const InfoIcon = ({className = "h-6 w-6"}) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className={className}
        viewBox="0 0 24 24" 
        strokeWidth="2" 
        stroke="currentColor" 
        fill="none" 
        strokeLinecap="round" 
        strokeLinejoin="round">
        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <circle cx="12" cy="12" r="9" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
        <polyline points="11 12 12 12 12 16 13 16" />
    </svg>
);