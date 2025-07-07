import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useHotkeys } from 'react-hotkeys-hook';

interface Image {
  url: string;
  alt: string;
  title?: string;
  description?: string;
}

interface EnhancedImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: Image[];
  initialIndex?: number;
  className?: string;
}

export const EnhancedImageModal: React.FC<EnhancedImageModalProps> = ({
  isOpen,
  onClose,
  images,
  initialIndex = 0,
  className = '',
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const currentImage = images[currentIndex];

  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setIsLoading(true);
      setImageError(false);
    }
  }, [isOpen, currentIndex]);

  useHotkeys('escape', onClose, { enabled: isOpen });
  useHotkeys('arrowleft', () => goToPrevious(), { enabled: isOpen });
  useHotkeys('arrowright', () => goToNext(), { enabled: isOpen });
  useHotkeys('equal', () => zoomIn(), { enabled: isOpen });
  useHotkeys('minus', () => zoomOut(), { enabled: isOpen });
  useHotkeys('0', () => resetZoom(), { enabled: isOpen });

  const goToNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const zoomIn = () => {
    setScale(prev => Math.min(prev * 1.5, 5));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev / 1.5, 0.5));
  };

  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handlePanStart = () => {
    setIsDragging(true);
  };

  const handlePan = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (scale > 1) {
      setPosition(prev => ({
        x: prev.x + info.delta.x,
        y: prev.y + info.delta.y,
      }));
    }
  };

  const handlePanEnd = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => Math.max(0.5, Math.min(5, prev * delta)));
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setImageError(true);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`fixed inset-0 z-50 flex items-center justify-center ${className}`}
        onClick={onClose}
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/90 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div
          ref={containerRef}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full h-full max-w-7xl max-h-screen p-4 flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex items-center justify-between mb-4 text-white"
          >
            <div className="flex-1">
              {currentImage?.title && (
                <h2 className="text-xl font-bold">{currentImage.title}</h2>
              )}
              {currentImage?.description && (
                <p className="text-white/70 text-sm mt-1">{currentImage.description}</p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {/* Image Counter */}
              <span className="text-white/70 text-sm">
                {currentIndex + 1} / {images.length}
              </span>

              {/* Zoom Controls */}
              <div className="flex items-center space-x-1 bg-white/10 backdrop-blur-sm rounded-lg p-1">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={zoomOut}
                  className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white transition-colors"
                >
                  -
                </motion.button>
                <span className="text-white/70 text-xs min-w-[3rem] text-center">
                  {Math.round(scale * 100)}%
                </span>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={zoomIn}
                  className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white transition-colors"
                >
                  +
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={resetZoom}
                  className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white transition-colors"
                  title="Reset zoom (0)"
                >
                  ⌂
                </motion.button>
              </div>

              {/* Close Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center text-white/70 hover:text-white transition-colors"
              >
                ✕
              </motion.button>
            </div>
          </motion.div>

          {/* Image Container */}
          <div className="flex-1 relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
            <motion.div
              className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
              style={{ cursor: isDragging ? 'grabbing' : scale > 1 ? 'grab' : 'default' }}
              onWheel={handleWheel}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="relative"
                >
                  {/* Loading Skeleton */}
                  {isLoading && (
                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="w-96 h-64 bg-white/10 rounded-lg flex items-center justify-center"
                    >
                      <div className="text-white/50">Loading...</div>
                    </motion.div>
                  )}

                  {/* Error State */}
                  {imageError && (
                    <div className="w-96 h-64 bg-white/5 rounded-lg flex flex-col items-center justify-center text-white/50">
                      <span className="text-4xl mb-2">📷</span>
                      <p>Failed to load image</p>
                    </div>
                  )}

                  {/* Main Image */}
                  {!imageError && (
                    <motion.img
                      ref={imageRef}
                      src={currentImage?.url}
                      alt={currentImage?.alt}
                      onLoad={handleImageLoad}
                      onError={handleImageError}
                      drag={scale > 1}
                      dragConstraints={containerRef}
                      onDragStart={handlePanStart}
                      onDrag={handlePan}
                      onDragEnd={handlePanEnd}
                      animate={{
                        scale,
                        x: position.x,
                        y: position.y,
                      }}
                      transition={{ type: "spring", damping: 25, stiffness: 300 }}
                      className={`max-w-full max-h-full object-contain ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                      style={{ 
                        maxWidth: '90vw', 
                        maxHeight: '70vh',
                        userSelect: 'none',
                        pointerEvents: imageError ? 'none' : 'auto'
                      }}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.div>

            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                {/* Previous Button */}
                <AnimatePresence>
                  {currentIndex > 0 && (
                    <motion.button
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={goToPrevious}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white/70 hover:text-white transition-colors"
                    >
                      ←
                    </motion.button>
                  )}
                </AnimatePresence>

                {/* Next Button */}
                <AnimatePresence>
                  {currentIndex < images.length - 1 && (
                    <motion.button
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={goToNext}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white/70 hover:text-white transition-colors"
                    >
                      →
                    </motion.button>
                  )}
                </AnimatePresence>
              </>
            )}
          </div>

          {/* Thumbnail Strip */}
          {images.length > 1 && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-4 flex justify-center space-x-2 overflow-x-auto pb-2"
            >
              {images.map((image, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentIndex(index)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                    index === currentIndex
                      ? 'border-blue-400'
                      : 'border-white/20 hover:border-white/40'
                  }`}
                >
                  <img
                    src={image.url}
                    alt={image.alt}
                    className="w-full h-full object-cover"
                  />
                </motion.button>
              ))}
            </motion.div>
          )}

          {/* Keyboard Shortcuts Help */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-2 text-center text-white/50 text-xs"
          >
            Use ← → to navigate • +/- to zoom • 0 to reset • ESC to close
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}; 