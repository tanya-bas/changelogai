import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import React from "react"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const highlightText = (text: string, searchTerm: string): React.ReactElement[] => {
  if (!searchTerm.trim()) {
    return [React.createElement('span', { key: 0 }, text)];
  }

  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  
  return parts.map((part, index) => {
    if (part.toLowerCase() === searchTerm.toLowerCase()) {
      return React.createElement('mark', {
        key: index,
        className: "bg-yellow-200 px-1 rounded"
      }, part);
    }
    return React.createElement('span', { key: index }, part);
  });
};

export const renderMarkdown = (content: string, searchTerm: string = ""): React.ReactElement[] => {
  return content
    .split('\n')
    .map((line, index) => {
      if (line.startsWith('## ')) {
        const headerText = line.replace('## ', '');
        return React.createElement('h2', {
          key: index,
          className: "text-2xl font-bold text-slate-900 mb-4"
        }, highlightText(headerText, searchTerm));
      }
      if (line.startsWith('### ')) {
        const headerText = line.replace('### ', '');
        return React.createElement('h3', {
          key: index,
          className: "text-lg font-semibold text-slate-800 mb-2 mt-4"
        }, highlightText(headerText, searchTerm));
      }
      if (line.startsWith('- ')) {
        const listText = line.replace('- ', '');
        return React.createElement('li', {
          key: index,
          className: "text-slate-700 mb-1"
        }, highlightText(listText, searchTerm));
      }
      if (line.trim() === '') {
        return React.createElement('br', { key: index });
      }
      return React.createElement('p', {
        key: index,
        className: "text-slate-700 mb-2"
      }, highlightText(line, searchTerm));
    });
};
