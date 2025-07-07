import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';

interface ThemeToggleProps {
  variant?: 'default' | 'compact' | 'icon-only';
  className?: string;
}

export function ThemeToggle({ variant = 'default', className = '' }: ThemeToggleProps) {
  const { theme, actualTheme, setTheme } = useTheme();

  const themes = [
    {
      value: 'light' as const,
      label: 'Light',
      icon: SunIcon,
      description: 'Light theme',
    },
    {
      value: 'dark' as const,
      label: 'Dark',
      icon: MoonIcon,
      description: 'Dark theme',
    },
  ];

  if (variant === 'icon-only') {
    return (
      <button
        onClick={() => {
          const currentIndex = themes.findIndex(t => t.value === theme);
          const nextIndex = (currentIndex + 1) % themes.length;
          setTheme(themes[nextIndex].value);
        }}
        className={`
          relative p-2 rounded-lg transition-all duration-300 group
          ${actualTheme === 'dark' 
            ? 'bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50 hover:border-amber-400/50' 
            : 'bg-white/50 hover:bg-gray-100/50 border border-gray-200/50 hover:border-amber-400/50'
          }
          ${className}
        `}
        title={`Current: ${themes.find(t => t.value === theme)?.label} theme`}
      >
        {(() => {
          const currentTheme = themes.find(t => t.value === theme);
          const IconComponent = currentTheme?.icon || SunIcon;
          return (
            <IconComponent 
              className={`
                h-5 w-5 transition-all duration-300 group-hover:scale-110
                ${actualTheme === 'dark' ? 'text-amber-400' : 'text-amber-600'}
              `} 
            />
          );
        })()}
      </button>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center space-x-1 ${className}`}>
        {themes.map((themeOption) => {
          const IconComponent = themeOption.icon;
          const isActive = theme === themeOption.value;
          
          return (
            <button
              key={themeOption.value}
              onClick={() => setTheme(themeOption.value)}
              className={`
                relative p-2 rounded-lg transition-all duration-300
                ${isActive 
                  ? actualTheme === 'dark'
                    ? 'bg-amber-600/20 text-amber-400 border border-amber-400/50'
                    : 'bg-amber-100 text-amber-700 border border-amber-300'
                  : actualTheme === 'dark'
                    ? 'text-gray-400 hover:text-amber-400 hover:bg-gray-800/50 border border-transparent hover:border-gray-700/50'
                    : 'text-gray-600 hover:text-amber-600 hover:bg-gray-100/50 border border-transparent hover:border-gray-200/50'
                }
              `}
              title={themeOption.description}
            >
              <IconComponent className="h-4 w-4" />
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center space-x-1 p-1 rounded-lg ${
      actualTheme === 'dark' 
        ? 'bg-gray-800/50 border border-gray-700/50' 
        : 'bg-gray-100/50 border border-gray-200/50'
    } ${className}`}>
      {themes.map((themeOption) => {
        const IconComponent = themeOption.icon;
        const isActive = theme === themeOption.value;
        
        return (
          <button
            key={themeOption.value}
            onClick={() => setTheme(themeOption.value)}
            className={`
              relative flex items-center space-x-2 px-3 py-2 rounded-md transition-all duration-300 font-medium text-sm
              ${isActive 
                ? actualTheme === 'dark'
                  ? 'bg-amber-600/20 text-amber-400 shadow-lg shadow-amber-400/20'
                  : 'bg-white text-amber-700 shadow-lg shadow-amber-200/50'
                : actualTheme === 'dark'
                  ? 'text-gray-400 hover:text-amber-400 hover:bg-gray-700/50'
                  : 'text-gray-600 hover:text-amber-600 hover:bg-white/50'
              }
            `}
            title={themeOption.description}
          >
            <IconComponent className="h-4 w-4" />
            <span>{themeOption.label}</span>
          </button>
        );
      })}
    </div>
  );
} 