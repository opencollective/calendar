import React from 'react';

/**
 * Converts URLs in text to clickable links
 * @param text - The text containing URLs
 * @returns React nodes with clickable links
 */
export const makeLinksClickable = (text: string): React.ReactNode => {
  if (!text) return text;
  
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  
  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return React.createElement('a', {
        key: index,
        href: part,
        target: '_blank',
        rel: 'noopener noreferrer',
        className: 'text-blue-600 hover:text-blue-800 underline'
      }, part);
    }
    return part;
  });
}; 