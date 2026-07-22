import React from 'react';

export function LogoBandungBarat({ className = "w-16 h-20" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 5 L90 25 V75 L50 115 L10 75 V25 Z" fill="#1E3A8A" stroke="#FFD700" strokeWidth="4"/>
      <path d="M50 12 L82 30 V70 L50 105 L18 70 V30 Z" fill="#047857"/>
      <path d="M50 20 L75 35 V65 L50 95 L25 65 V35 Z" fill="#FFFFFF"/>
      <circle cx="50" cy="50" r="18" fill="#F59E0B"/>
      <path d="M50 35 L55 45 L65 47 L58 55 L59 65 L50 60 L41 65 L42 55 L35 47 L45 45 Z" fill="#DC2626"/>
      <text x="50" y="82" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="bold" fontFamily="sans-serif">BANDUNG BARAT</text>
    </svg>
  );
}

export function LogoTutWuri({ className = "w-18 h-20" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 5 L92 28 V72 L50 95 L8 72 V28 Z" fill="#0284C7" stroke="#FFD700" strokeWidth="3"/>
      <polygon points="50,15 62,38 88,40 68,58 74,83 50,70 26,83 32,58 12,40 38,38" fill="#F59E0B"/>
      <circle cx="50" cy="50" r="14" fill="#FFFFFF"/>
      <path d="M50 38 Q56 46 50 58 Q44 46 50 38 Z" fill="#DC2626"/>
      <text x="50" y="88" textAnchor="middle" fill="#FFFFFF" fontSize="7" fontWeight="bold" fontFamily="sans-serif">SD NEGERI</text>
    </svg>
  );
}
