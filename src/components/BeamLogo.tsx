import React from 'react';

interface BeamLogoProps {
  size?: number;
  className?: string;
}

export const BeamLogo: React.FC<BeamLogoProps> = ({ size = 24, className = "" }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 64 64" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="beamGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{stopColor:"#3B82F6", stopOpacity:1}} />
          <stop offset="50%" style={{stopColor:"#2563EB", stopOpacity:1}} />
          <stop offset="100%" style={{stopColor:"#1D4ED8", stopOpacity:1}} />
        </linearGradient>
        <linearGradient id="lightBeam" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{stopColor:"#FFFFFF", stopOpacity:0}} />
          <stop offset="30%" style={{stopColor:"#FFFFFF", stopOpacity:0.8}} />
          <stop offset="70%" style={{stopColor:"#FFFFFF", stopOpacity:0.8}} />
          <stop offset="100%" style={{stopColor:"#FFFFFF", stopOpacity:0}} />
        </linearGradient>
      </defs>
      
      {/* Main circle background */}
      <circle cx="32" cy="32" r="30" fill="url(#beamGradient)" stroke="currentColor" strokeWidth="2"/>
      
      {/* Central light source */}
      <circle cx="20" cy="32" r="4" fill="#FFFFFF" opacity="0.9"/>
      
      {/* Light beams */}
      <path d="M24 32 L56 24 L56 28 L28 34 Z" fill="url(#lightBeam)" opacity="0.7"/>
      <path d="M24 32 L56 32 L56 36 L28 36 Z" fill="url(#lightBeam)" opacity="0.9"/>
      <path d="M24 32 L56 40 L56 36 L28 30 Z" fill="url(#lightBeam)" opacity="0.7"/>
      
      {/* Subtle glow effect */}
      <circle cx="20" cy="32" r="8" fill="#FFFFFF" opacity="0.2"/>
      <circle cx="20" cy="32" r="6" fill="#FFFFFF" opacity="0.3"/>
    </svg>
  );
};


