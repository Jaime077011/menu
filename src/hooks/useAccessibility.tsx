import { useState, useEffect, useRef, useCallback } from 'react';

// Accessibility preferences
export interface AccessibilityPreferences {
  reducedMotion: boolean;
  highContrast: boolean;
  largeText: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
}

// Focus management
export interface FocusableElement {
  element: HTMLElement;
  tabIndex: number;
  isVisible: boolean;
  isDisabled: boolean;
}

// Keyboard navigation hook
export const useKeyboardNavigation = (containerRef: React.RefObject<HTMLElement>) => {
  const [currentFocusIndex, setCurrentFocusIndex] = useState(0);
  const [focusableElements, setFocusableElements] = useState<HTMLElement[]>([]);
  const [isActive, setIsActive] = useState(false);

  const updateFocusableElements = useCallback(() => {
    if (!containerRef.current) return;

    const elements = Array.from(
      containerRef.current.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
      )
    ) as HTMLElement[];

    // Filter out hidden elements
    const visibleElements = elements.filter(el => {
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetParent !== null;
    });

    setFocusableElements(visibleElements);
  }, [containerRef]);

  const focusNext = useCallback(() => {
    if (focusableElements.length === 0) return;
    const nextIndex = (currentFocusIndex + 1) % focusableElements.length;
    setCurrentFocusIndex(nextIndex);
    focusableElements[nextIndex]?.focus();
  }, [currentFocusIndex, focusableElements]);

  const focusPrevious = useCallback(() => {
    if (focusableElements.length === 0) return;
    const prevIndex = (currentFocusIndex - 1 + focusableElements.length) % focusableElements.length;
    setCurrentFocusIndex(prevIndex);
    focusableElements[prevIndex]?.focus();
  }, [currentFocusIndex, focusableElements]);

  const focusFirst = useCallback(() => {
    if (focusableElements.length === 0) return;
    setCurrentFocusIndex(0);
    focusableElements[0]?.focus();
  }, [focusableElements]);

  const focusLast = useCallback(() => {
    if (focusableElements.length === 0) return;
    const lastIndex = focusableElements.length - 1;
    setCurrentFocusIndex(lastIndex);
    focusableElements[lastIndex]?.focus();
  }, [focusableElements]);

  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Tab':
          e.preventDefault();
          if (e.shiftKey) {
            focusPrevious();
          } else {
            focusNext();
          }
          break;
        case 'Home':
          e.preventDefault();
          focusFirst();
          break;
        case 'End':
          e.preventDefault();
          focusLast();
          break;
        case 'Escape':
          setIsActive(false);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isActive, focusNext, focusPrevious, focusFirst, focusLast]);

  useEffect(() => {
    updateFocusableElements();
    
    // Update on DOM changes
    const observer = new MutationObserver(updateFocusableElements);
    if (containerRef.current) {
      observer.observe(containerRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['disabled', 'tabindex', 'hidden']
      });
    }

    return () => observer.disconnect();
  }, [updateFocusableElements]);

  return {
    isActive,
    setIsActive,
    currentFocusIndex,
    focusableElements,
    focusNext,
    focusPrevious,
    focusFirst,
    focusLast,
    updateFocusableElements,
  };
};

// Accessibility preferences hook
export const useAccessibilityPreferences = (): AccessibilityPreferences => {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>({
    reducedMotion: false,
    highContrast: false,
    largeText: false,
    screenReader: false,
    keyboardNavigation: false,
  });

  useEffect(() => {
    // Check for reduced motion preference
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    const largeTextQuery = window.matchMedia('(prefers-reduced-data: reduce)');

    const updatePreferences = () => {
      setPreferences(prev => ({
        ...prev,
        reducedMotion: reducedMotionQuery.matches,
        highContrast: highContrastQuery.matches,
        largeText: largeTextQuery.matches,
        screenReader: !!navigator.userAgent.match(/NVDA|JAWS|VoiceOver|ORCA|Narrator/i),
      }));
    };

    updatePreferences();

    reducedMotionQuery.addEventListener('change', updatePreferences);
    highContrastQuery.addEventListener('change', updatePreferences);
    largeTextQuery.addEventListener('change', updatePreferences);

    return () => {
      reducedMotionQuery.removeEventListener('change', updatePreferences);
      highContrastQuery.removeEventListener('change', updatePreferences);
      largeTextQuery.removeEventListener('change', updatePreferences);
    };
  }, []);

  return preferences;
};

// ARIA live region hook
export const useAriaLiveRegion = () => {
  const liveRegionRef = useRef<HTMLDivElement>(null);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!liveRegionRef.current) return;

    liveRegionRef.current.setAttribute('aria-live', priority);
    liveRegionRef.current.textContent = message;

    // Clear after announcement
    setTimeout(() => {
      if (liveRegionRef.current) {
        liveRegionRef.current.textContent = '';
      }
    }, 1000);
  }, []);

  const LiveRegion = useCallback(() => (
    <div
      ref={liveRegionRef}
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    />
  ), []);

  return { announce, LiveRegion };
};

// Focus trap hook
export const useFocusTrap = (isActive: boolean) => {
  const containerRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    // Store the previously focused element
    previousFocusRef.current = document.activeElement as HTMLElement;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus the first element
    firstElement?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Restore focus to the previously focused element
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [isActive]);

  return containerRef;
};

// Skip links hook
export const useSkipLinks = () => {
  const skipLinksRef = useRef<HTMLDivElement>(null);
  const [skipLinks, setSkipLinks] = useState<Array<{ id: string; label: string }>>([]);

  const addSkipLink = useCallback((id: string, label: string) => {
    setSkipLinks(prev => [...prev.filter(link => link.id !== id), { id, label }]);
  }, []);

  const removeSkipLink = useCallback((id: string) => {
    setSkipLinks(prev => prev.filter(link => link.id !== id));
  }, []);

  const SkipLinks = useCallback(() => (
    <div
      ref={skipLinksRef}
      className="fixed top-0 left-0 z-[9999] transform -translate-y-full focus-within:translate-y-0 transition-transform"
    >
      {skipLinks.map(({ id, label }) => (
        <a
          key={id}
          href={`#${id}`}
          className="block bg-blue-600 text-white px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          onFocus={(e) => e.currentTarget.scrollIntoView()}
        >
          Skip to {label}
        </a>
      ))}
    </div>
  ), [skipLinks]);

  return { addSkipLink, removeSkipLink, SkipLinks };
};

// Color contrast checker
export const useColorContrast = () => {
  const checkContrast = useCallback((foreground: string, background: string): number => {
    // Convert hex to RGB
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    };

    // Calculate relative luminance
    const getLuminance = (r: number, g: number, b: number) => {
      const [rs, gs, bs] = [r, g, b].map(c => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    };

    const fg = hexToRgb(foreground);
    const bg = hexToRgb(background);

    if (!fg || !bg) return 0;

    const fgLuminance = getLuminance(fg.r, fg.g, fg.b);
    const bgLuminance = getLuminance(bg.r, bg.g, bg.b);

    const lighter = Math.max(fgLuminance, bgLuminance);
    const darker = Math.min(fgLuminance, bgLuminance);

    return (lighter + 0.05) / (darker + 0.05);
  }, []);

  const meetsWCAG = useCallback((contrast: number, level: 'AA' | 'AAA' = 'AA', size: 'normal' | 'large' = 'normal'): boolean => {
    const threshold = level === 'AA' 
      ? (size === 'large' ? 3 : 4.5)
      : (size === 'large' ? 4.5 : 7);
    
    return contrast >= threshold;
  }, []);

  return { checkContrast, meetsWCAG };
}; 