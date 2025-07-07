import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { EnhancedImageModal } from '@/components/ui/EnhancedImageModal';

// Type definition for menu item (adjust as needed for your actual model)
export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  imageAlt?: string;
  category?: string;
  available?: boolean;
  dietaryTags?: { id: string; value: string }[];
}

interface InteractiveProductCardProps {
  item: MenuItem;
  isRecommended?: boolean;
  onAddToOrder?: (item: MenuItem) => void;
  onImageClick?: (imageUrl: string, itemName: string) => void;
}

export const InteractiveProductCard = ({ 
  item, 
  isRecommended = false,
  onAddToOrder,
  onImageClick 
}: InteractiveProductCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const { ref, inView } = useInView({ threshold: 0.1, triggerOnce: true });

  const handleAddToOrder = () => {
    if (onAddToOrder) onAddToOrder(item);
    // Optionally trigger micro-interaction here
  };

  const handleImageClick = () => {
    if (onImageClick && item.imageUrl) {
      onImageClick(item.imageUrl, item.name);
    } else {
      setShowImageModal(true);
    }
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`relative bg-slate-800/50 rounded-2xl border border-white/10 shadow-lg overflow-hidden group transition-all duration-300 ${isHovered ? 'ring-2 ring-blue-400/40 scale-[1.02]' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      tabIndex={0}
    >
      <div className="relative aspect-square cursor-pointer" onClick={handleImageClick}>
        <motion.img
          src={item.imageUrl || '/placeholder-food.jpg'}
          alt={item.imageAlt || item.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          draggable={false}
        />
        {isRecommended && (
          <span className="absolute top-3 right-3 bg-gradient-to-r from-blue-500 to-purple-600 text-xs text-white px-3 py-1 rounded-full font-semibold shadow-lg">
            Recommended
          </span>
        )}
        {!item.available && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-white font-semibold">Currently Unavailable</span>
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white truncate" title={item.name}>{item.name}</h3>
          <span className="text-blue-400 font-semibold text-base">${item.price.toFixed(2)}</span>
        </div>
        <p className="text-gray-300 text-sm line-clamp-2 min-h-[2.5em]">{item.description}</p>
        {item.dietaryTags && item.dietaryTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {item.dietaryTags.map((tag) => (
              <span key={tag.id} className="bg-white/10 text-xs text-white px-2 py-0.5 rounded-full border border-white/10">
                {tag.value}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            <button
              aria-label="Decrease quantity"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-blue-500/80 text-white flex items-center justify-center text-lg transition-colors"
              type="button"
              disabled={!item.available}
            >
              -
            </button>
            <span className="text-white font-medium w-6 text-center">{quantity}</span>
            <button
              aria-label="Increase quantity"
              onClick={() => setQuantity((q) => Math.min(10, q + 1))}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-blue-500/80 text-white flex items-center justify-center text-lg transition-colors"
              type="button"
              disabled={!item.available}
            >
              +
            </button>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleAddToOrder}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold shadow hover:from-purple-600 hover:to-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
            disabled={!item.available}
          >
            Add to Order
          </motion.button>
        </div>
      </div>
      
      <AnimatePresence>
        {showImageModal && (
          <EnhancedImageModal
            isOpen={showImageModal}
            onClose={() => setShowImageModal(false)}
            images={[
              {
                url: item.imageUrl || '/placeholder-food.jpg',
                alt: item.imageAlt || item.name,
                title: item.name,
                description: item.description
              }
            ]}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}; 