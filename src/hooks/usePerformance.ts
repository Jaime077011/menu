import { useState, useEffect, useCallback, useRef } from 'react';

// Performance metrics interfaces
export interface CoreWebVitals {
  fcp: number | null; // First Contentful Paint
  lcp: number | null; // Largest Contentful Paint
  cls: number | null; // Cumulative Layout Shift
  fid: number | null; // First Input Delay
  ttfb: number | null; // Time to First Byte
}

export interface CustomMetrics {
  characterLoadTime: number | null;
  memoryUsage: number | null;
  jsHeapSize: number | null;
  domNodes: number | null;
  imageLoadTime: number | null;
  apiResponseTime: number | null;
}

export interface PerformanceMetrics {
  coreWebVitals: CoreWebVitals;
  customMetrics: CustomMetrics;
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  isLoading: boolean;
  lastUpdated: Date | null;
}

// Performance thresholds based on Google's recommendations
const THRESHOLDS = {
  fcp: { good: 1800, needsImprovement: 3000 },
  lcp: { good: 2500, needsImprovement: 4000 },
  cls: { good: 0.1, needsImprovement: 0.25 },
  fid: { good: 100, needsImprovement: 300 },
  ttfb: { good: 800, needsImprovement: 1800 },
};

export const usePerformance = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    coreWebVitals: {
      fcp: null,
      lcp: null,
      cls: null,
      fid: null,
      ttfb: null,
    },
    customMetrics: {
      characterLoadTime: null,
      memoryUsage: null,
      jsHeapSize: null,
      domNodes: null,
      imageLoadTime: null,
      apiResponseTime: null,
    },
    score: 0,
    grade: 'F',
    isLoading: true,
    lastUpdated: null,
  });

  const observerRef = useRef<PerformanceObserver | null>(null);
  const startTimeRef = useRef<number>(performance.now());

  // Calculate performance score
  const calculateScore = useCallback((vitals: CoreWebVitals): { score: number; grade: 'A' | 'B' | 'C' | 'D' | 'F' } => {
    const scores: number[] = [];

    // FCP Score
    if (vitals.fcp !== null) {
      if (vitals.fcp <= THRESHOLDS.fcp.good) scores.push(100);
      else if (vitals.fcp <= THRESHOLDS.fcp.needsImprovement) scores.push(75);
      else scores.push(50);
    }

    // LCP Score
    if (vitals.lcp !== null) {
      if (vitals.lcp <= THRESHOLDS.lcp.good) scores.push(100);
      else if (vitals.lcp <= THRESHOLDS.lcp.needsImprovement) scores.push(75);
      else scores.push(50);
    }

    // CLS Score
    if (vitals.cls !== null) {
      if (vitals.cls <= THRESHOLDS.cls.good) scores.push(100);
      else if (vitals.cls <= THRESHOLDS.cls.needsImprovement) scores.push(75);
      else scores.push(50);
    }

    // FID Score
    if (vitals.fid !== null) {
      if (vitals.fid <= THRESHOLDS.fid.good) scores.push(100);
      else if (vitals.fid <= THRESHOLDS.fid.needsImprovement) scores.push(75);
      else scores.push(50);
    }

    const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    
    let grade: 'A' | 'B' | 'C' | 'D' | 'F' = 'F';
    if (averageScore >= 90) grade = 'A';
    else if (averageScore >= 80) grade = 'B';
    else if (averageScore >= 70) grade = 'C';
    else if (averageScore >= 60) grade = 'D';

    return { score: Math.round(averageScore), grade };
  }, []);

  // Measure Core Web Vitals
  const measureCoreWebVitals = useCallback(() => {
    if (!('PerformanceObserver' in window)) return;

    // Clean up existing observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      
      entries.forEach((entry) => {
        setMetrics(prev => {
          const newVitals = { ...prev.coreWebVitals };
          
          switch (entry.entryType) {
            case 'paint':
              if (entry.name === 'first-contentful-paint') {
                newVitals.fcp = entry.startTime;
              }
              break;
            case 'largest-contentful-paint':
              newVitals.lcp = entry.startTime;
              break;
            case 'layout-shift':
              if (!(entry as any).hadRecentInput) {
                newVitals.cls = (newVitals.cls || 0) + (entry as any).value;
              }
              break;
            case 'first-input':
              newVitals.fid = (entry as any).processingStart - entry.startTime;
              break;
            case 'navigation':
              const navEntry = entry as PerformanceNavigationTiming;
              newVitals.ttfb = navEntry.responseStart - navEntry.requestStart;
              break;
          }

          const { score, grade } = calculateScore(newVitals);
          
          return {
            ...prev,
            coreWebVitals: newVitals,
            score,
            grade,
            lastUpdated: new Date(),
          };
        });
      });
    });

    // Observe different entry types
    try {
      observerRef.current.observe({ entryTypes: ['paint'] });
      observerRef.current.observe({ entryTypes: ['largest-contentful-paint'] });
      observerRef.current.observe({ entryTypes: ['layout-shift'] });
      observerRef.current.observe({ entryTypes: ['first-input'] });
      observerRef.current.observe({ entryTypes: ['navigation'] });
    } catch (error) {
      console.warn('Some performance entry types are not supported:', error);
    }
  }, [calculateScore]);

  // Measure custom metrics
  const measureCustomMetrics = useCallback(() => {
    const updateCustomMetrics = () => {
      setMetrics(prev => {
        const newCustomMetrics = { ...prev.customMetrics };

        // Memory usage
        if ('memory' in performance) {
          const memory = (performance as any).memory;
          newCustomMetrics.memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // MB
          newCustomMetrics.jsHeapSize = memory.totalJSHeapSize / 1024 / 1024; // MB
        }

        // DOM nodes count
        newCustomMetrics.domNodes = document.querySelectorAll('*').length;

        return {
          ...prev,
          customMetrics: newCustomMetrics,
          lastUpdated: new Date(),
        };
      });
    };

    updateCustomMetrics();
    
    // Update every 5 seconds
    const interval = setInterval(updateCustomMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  // Measure character load time
  const measureCharacterLoadTime = useCallback((startTime?: number) => {
    const loadTime = performance.now() - (startTime || startTimeRef.current);
    
    setMetrics(prev => ({
      ...prev,
      customMetrics: {
        ...prev.customMetrics,
        characterLoadTime: loadTime,
      },
      lastUpdated: new Date(),
    }));
  }, []);

  // Measure API response time
  const measureApiResponseTime = useCallback((startTime: number, endTime: number) => {
    const responseTime = endTime - startTime;
    
    setMetrics(prev => ({
      ...prev,
      customMetrics: {
        ...prev.customMetrics,
        apiResponseTime: responseTime,
      },
      lastUpdated: new Date(),
    }));
  }, []);

  // Measure image load time
  const measureImageLoadTime = useCallback((imageUrl: string) => {
    const startTime = performance.now();
    const img = new Image();
    
    img.onload = () => {
      const loadTime = performance.now() - startTime;
      setMetrics(prev => ({
        ...prev,
        customMetrics: {
          ...prev.customMetrics,
          imageLoadTime: loadTime,
        },
        lastUpdated: new Date(),
      }));
    };
    
    img.src = imageUrl;
  }, []);

  // Get performance insights
  const getInsights = useCallback((): string[] => {
    const insights: string[] = [];
    const { coreWebVitals, customMetrics } = metrics;

    if (coreWebVitals.fcp && coreWebVitals.fcp > THRESHOLDS.fcp.needsImprovement) {
      insights.push('First Contentful Paint is slow. Consider optimizing critical resources.');
    }

    if (coreWebVitals.lcp && coreWebVitals.lcp > THRESHOLDS.lcp.needsImprovement) {
      insights.push('Largest Contentful Paint is slow. Optimize images and critical rendering path.');
    }

    if (coreWebVitals.cls && coreWebVitals.cls > THRESHOLDS.cls.needsImprovement) {
      insights.push('Cumulative Layout Shift is high. Ensure proper sizing for dynamic content.');
    }

    if (coreWebVitals.fid && coreWebVitals.fid > THRESHOLDS.fid.needsImprovement) {
      insights.push('First Input Delay is high. Reduce JavaScript execution time.');
    }

    if (customMetrics.memoryUsage && customMetrics.memoryUsage > 100) {
      insights.push('High memory usage detected. Consider optimizing memory-intensive operations.');
    }

    if (customMetrics.domNodes && customMetrics.domNodes > 1500) {
      insights.push('High DOM complexity. Consider reducing the number of DOM nodes.');
    }

    return insights;
  }, [metrics]);

  // Start monitoring
  const startMonitoring = useCallback(() => {
    setMetrics(prev => ({ ...prev, isLoading: true }));
    measureCoreWebVitals();
    const cleanup = measureCustomMetrics();
    
    setTimeout(() => {
      setMetrics(prev => ({ ...prev, isLoading: false }));
    }, 2000);

    return cleanup;
  }, [measureCoreWebVitals, measureCustomMetrics]);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
  }, []);

  // Reset metrics
  const resetMetrics = useCallback(() => {
    setMetrics({
      coreWebVitals: {
        fcp: null,
        lcp: null,
        cls: null,
        fid: null,
        ttfb: null,
      },
      customMetrics: {
        characterLoadTime: null,
        memoryUsage: null,
        jsHeapSize: null,
        domNodes: null,
        imageLoadTime: null,
        apiResponseTime: null,
      },
      score: 0,
      grade: 'F',
      isLoading: false,
      lastUpdated: null,
    });
    startTimeRef.current = performance.now();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, [stopMonitoring]);

  return {
    metrics,
    startMonitoring,
    stopMonitoring,
    resetMetrics,
    measureCharacterLoadTime,
    measureApiResponseTime,
    measureImageLoadTime,
    getInsights,
    thresholds: THRESHOLDS,
  };
}; 