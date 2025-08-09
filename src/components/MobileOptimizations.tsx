import React, { useEffect } from 'react';

export const MobileOptimizations: React.FC = () => {
  useEffect(() => {
    // Prevent zoom on input focus (iOS Safari)
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    }

    // Add touch-action CSS for better touch handling
    const style = document.createElement('style');
    style.textContent = `
      * {
        -webkit-tap-highlight-color: transparent;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -khtml-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
      }
      
      input, textarea, [contenteditable] {
        -webkit-user-select: text;
        -khtml-user-select: text;
        -moz-user-select: text;
        -ms-user-select: text;
        user-select: text;
      }
      
      .touch-scroll {
        -webkit-overflow-scrolling: touch;
        overscroll-behavior: contain;
      }
      
      @media (max-width: 768px) {
        .card {
          padding: 1rem !important;
        }
        
        .btn-primary, .btn-secondary {
          min-height: 44px;
          padding: 0.75rem 1rem;
        }
        
        .sidebar-item {
          min-height: 48px;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return null;
};


