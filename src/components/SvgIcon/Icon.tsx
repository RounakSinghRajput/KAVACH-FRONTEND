import React from 'react';

// 1. Identify Icon (Magnifying glass with inner crosshair/target)
export const IdentifyIcon = ({ className = "w-7 h-7" }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="10.5" cy="10.5" r="6.5" />
    <line x1="21" y1="21" x2="15.1" y2="15.1" />
    <circle cx="10.5" cy="10.5" r="2" strokeWidth="1.5" />
    <line x1="10.5" y1="6" x2="10.5" y2="7" strokeWidth="1.5" />
    <line x1="10.5" y1="14" x2="10.5" y2="15" strokeWidth="1.5" />
    <line x1="6" y1="10.5" x2="7" y2="10.5" strokeWidth="1.5" />
    <line x1="14" y1="10.5" x2="15" y2="10.5" strokeWidth="1.5" />
  </svg>
);

// 2. Analyze Icon (chart-no-axes-combined)
export const AnalyzeIcon = ({ className = "w-7 h-7" }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M4 20v-4" />
    <path d="M8 20v-8" />
    <path d="M12 20v-11" />
    <path d="M16 20v-6" />
    <path d="M3 12l5-5 4 4 7-7" />
    <path d="M15 4h4v4" />
  </svg>
);

// 3. Prevent Icon (Shield with inner checkmark)
export const PreventIcon = ({ className = "w-7 h-7" }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 11 2 2 4-4" strokeWidth="2.5" />
  </svg>
);