
import React from 'react';

const IncaPattern: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.03]">
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="inca" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
            <path d="M0 50 L25 50 L25 25 L50 25 L50 0 M50 100 L50 75 L75 75 L75 50 L100 50" 
                  fill="none" stroke="currentColor" strokeWidth="2" />
            <rect x="10" y="10" width="10" height="10" fill="currentColor" />
            <rect x="60" y="60" width="10" height="10" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#inca)" />
      </svg>
    </div>
  );
};

export default IncaPattern;
