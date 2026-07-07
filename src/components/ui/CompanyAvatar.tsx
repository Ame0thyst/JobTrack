'use client';

import React from 'react';

interface CompanyAvatarProps {
  companyName: string;
  companyLogo?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const CompanyAvatar: React.FC<CompanyAvatarProps> = ({
  companyName,
  companyLogo,
  size = 'md',
  className = '',
}) => {
  // Generate a consistent, stable gradient background based on hashing the company name
  const getGradient = (name: string) => {
    const gradients = [
      'from-indigo-500 to-purple-500 text-white',
      'from-emerald-500 to-teal-500 text-white',
      'from-rose-500 to-orange-500 text-white',
      'from-sky-500 to-blue-600 text-white',
      'from-amber-500 to-yellow-500 text-white',
      'from-pink-500 to-rose-500 text-white',
      'from-violet-500 to-fuchsia-500 text-white',
      'from-cyan-500 to-blue-500 text-white',
    ];

    const cleanName = name.trim().toLowerCase();
    let hash = 0;
    for (let i = 0; i < cleanName.length; i++) {
      hash = cleanName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % gradients.length;
    return gradients[index];
  };

  const getInitials = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return '?';
    return trimmed[0].toUpperCase();
  };

  const sizeClasses = {
    sm: 'h-6 w-6 rounded-lg',
    md: 'h-8 w-8 rounded-xl',
    lg: 'h-10 w-10 rounded-2xl',
  };

  const textSizeClasses = {
    sm: 'text-[10px] font-bold',
    md: 'text-xs font-bold',
    lg: 'text-sm font-bold',
  };

  // Check for valid logo: must be a non-empty string that looks like a data URL or http URL
  const hasValidLogo = companyLogo && companyLogo.length > 10 && 
    (companyLogo.startsWith('data:image') || companyLogo.startsWith('http'));

  if (hasValidLogo) {
    return (
      <div className={`shrink-0 overflow-hidden ${sizeClasses[size]} ${className}`}>
        <img
          src={companyLogo!}
          alt={companyName}
          className="h-full w-full object-cover"
          onError={(e) => {
            // If the image fails to load, hide it so the fallback shows
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center bg-gradient-to-br ${getGradient(
        companyName
      )} text-white shadow-sm ${sizeClasses[size]} ${textSizeClasses[size]} ${className}`}
    >
      <span>{getInitials(companyName)}</span>
    </div>
  );
};
