import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import React from "react"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const renderMarkdown = (content: string): React.ReactElement[] => {
  return content
    .split('\n')
    .map((line, index) => {
      if (line.startsWith('## ')) {
        return React.createElement('h2', {
          key: index,
          className: "text-2xl font-bold text-slate-900 mb-4"
        }, line.replace('## ', ''));
      }
      if (line.startsWith('### ')) {
        return React.createElement('h3', {
          key: index,
          className: "text-lg font-semibold text-slate-800 mb-2 mt-4"
        }, line.replace('### ', ''));
      }
      if (line.startsWith('- ')) {
        return React.createElement('li', {
          key: index,
          className: "text-slate-700 mb-1"
        }, line.replace('- ', ''));
      }
      if (line.trim() === '') {
        return React.createElement('br', { key: index });
      }
      return React.createElement('p', {
        key: index,
        className: "text-slate-700 mb-2"
      }, line);
    });
};
