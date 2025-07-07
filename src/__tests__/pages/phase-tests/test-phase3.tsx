import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EnhancedImageModal } from '@/components/ui/EnhancedImageModal';
import { InteractiveProductCard } from '@/components/menu/InteractiveProductCard';
import { MicroInteractions } from '@/components/ui/MicroInteractions';

// Sample data for testing
const SAMPLE_IMAGES = [
  {
    url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=600&fit=crop',
    alt: 'Delicious Pizza',
    title: 'Margherita Pizza',
    description: 'Fresh tomatoes, mozzarella, and basil on a crispy crust'
  },
  {
    url: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&h=600&fit=crop',
    alt: 'Gourmet Burger',
    title: 'Classic Burger',
    description: 'Juicy beef patty with lettuce, tomato, and special sauce'
  },
  {
    url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=600&fit=crop',
    alt: 'Fresh Salad',
    title: 'Garden Salad',
    description: 'Mixed greens with seasonal vegetables and vinaigrette'
  },
  {
    url: 'https://images.unsplash.com/photo-1563379091339-03246963d51a?w=800&h=600&fit=crop',
    alt: 'Pasta Dish',
    title: 'Spaghetti Carbonara',
    description: 'Creamy pasta with pancetta and parmesan cheese'
  }
];

const SAMPLE_MENU_ITEMS = [
  {
    id: '1',
    name: 'Margherita Pizza',
    description: 'Fresh tomatoes, mozzarella cheese, and basil leaves on our signature wood-fired crust',
    price: 18.99,
    category: 'Pizza',
    imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
    imageAlt: 'Margherita Pizza',
    available: true,
    dietaryTags: [
      { id: '1', value: 'vegetarian' },
      { id: '2', value: 'organic' }
    ]
  },
  {
    id: '2',
    name: 'Classic Cheeseburger',
    description: 'Juicy beef patty with aged cheddar, lettuce, tomato, and our special sauce',
    price: 16.50,
    category: 'Burgers',
    imageUrl: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=300&fit=crop',
    imageAlt: 'Classic Cheeseburger',
    available: true,
    dietaryTags: []
  },
  {
    id: '3',
    name: 'Quinoa Power Bowl',
    description: 'Nutrient-rich quinoa with roasted vegetables, avocado, and tahini dressing',
    price: 14.99,
    category: 'Healthy',
    imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop',
    imageAlt: 'Quinoa Power Bowl',
    available: true,
    dietaryTags: [
      { id: '3', value: 'vegan' },
      { id: '4', value: 'gluten-free' },
      { id: '5', value: 'organic' }
    ]
  },
  {
    id: '4',
    name: 'Spicy Chicken Wings',
    description: 'Crispy wings tossed in our signature hot sauce, served with blue cheese dip',
    price: 12.99,
    category: 'Appetizers',
    imageUrl: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=400&h=300&fit=crop',
    imageAlt: 'Spicy Chicken Wings',
    available: false,
    dietaryTags: [
      { id: '6', value: 'spicy' },
      { id: '7', value: 'keto' }
    ]
  },
  {
    id: '5',
    name: 'Salmon Teriyaki',
    description: 'Grilled Atlantic salmon glazed with house-made teriyaki sauce',
    price: 24.99,
    category: 'Seafood',
    imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=300&fit=crop',
    imageAlt: 'Salmon Teriyaki',
    available: true,
    dietaryTags: [
      { id: '8', value: 'dairy-free' },
      { id: '9', value: 'organic' }
    ]
  },
  {
    id: '6',
    name: 'Chocolate Lava Cake',
    description: 'Warm chocolate cake with molten center, served with vanilla ice cream',
    price: 8.99,
    category: 'Desserts',
    imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&h=300&fit=crop',
    imageAlt: 'Chocolate Lava Cake',
    available: true,
    dietaryTags: [
      { id: '10', value: 'vegetarian' }
    ]
  }
];

const TestPhase3: React.FC = () => {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [showNotification, setShowNotification] = useState(false);
  const [showShake, setShowShake] = useState(false);
  const [showBounce, setShowBounce] = useState(false);

  const handleImageClick = (imageUrl: string, itemName: string) => {
    const imageIndex = SAMPLE_IMAGES.findIndex(img => img.url === imageUrl);
    if (imageIndex !== -1) {
      setSelectedImageIndex(imageIndex);
      setIsImageModalOpen(true);
    }
  };

  const handleAddToOrder = (item: any) => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const simulateProgress = () => {
    setShowProgress(true);
    setProgressValue(0);
    
    const interval = setInterval(() => {
      setProgressValue(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setShowProgress(false), 1000);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const triggerNotification = () => {
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const triggerShake = () => {
    setShowShake(true);
    setTimeout(() => setShowShake(false), 1000);
  };

  const triggerBounce = () => {
    setShowBounce(true);
    setTimeout(() => setShowBounce(false), 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-white mb-4">
            🎨 Phase 3: Advanced Visual Features
          </h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            Testing enhanced image modals, interactive product cards, and micro-interactions
          </p>
        </motion.div>

        {/* Micro-Interactions Demo */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-white mb-6">🎭 Micro-Interactions</h2>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowSuccess(true)}
                className="bg-green-500/20 hover:bg-green-500/30 text-green-300 px-4 py-2 rounded-lg border border-green-400/30 transition-colors"
              >
                Success Animation
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={simulateProgress}
                className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 px-4 py-2 rounded-lg border border-blue-400/30 transition-colors"
              >
                Progress Demo
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={triggerNotification}
                className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 px-4 py-2 rounded-lg border border-purple-400/30 transition-colors"
              >
                Notification
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={triggerShake}
                className="bg-red-500/20 hover:bg-red-500/30 text-red-300 px-4 py-2 rounded-lg border border-red-400/30 transition-colors"
              >
                Shake Error
              </motion.button>
            </div>

            {/* Micro-Interactions Display */}
            <div className="flex justify-center space-x-8">
              <MicroInteractions.SuccessAnimation isVisible={showSuccess} />
              <MicroInteractions.ProgressIndicator 
                isVisible={showProgress} 
                progress={progressValue} 
              />
              <MicroInteractions.PulseNotification 
                isVisible={showNotification}
                message="Order added to cart!"
              />
              <MicroInteractions.ShakeAnimation isActive={showShake}>
                <div className="w-16 h-16 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <span className="text-red-300 text-2xl">❌</span>
                </div>
              </MicroInteractions.ShakeAnimation>
            </div>
          </div>
        </motion.section>

        {/* Interactive Product Cards */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-white mb-6">🍽️ Interactive Product Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SAMPLE_MENU_ITEMS.map((item, index) => (
              <InteractiveProductCard
                key={item.id}
                item={item}
                isRecommended={index === 0 || index === 2}
                onAddToOrder={handleAddToOrder}
                onImageClick={handleImageClick}
              />
            ))}
          </div>
        </motion.section>

        {/* Image Gallery Demo */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-white mb-6">🖼️ Enhanced Image Gallery</h2>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <p className="text-white/70 mb-4">
              Click on any image to open the enhanced modal with zoom, pan, and keyboard navigation
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {SAMPLE_IMAGES.map((image, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSelectedImageIndex(index);
                    setIsImageModalOpen(true);
                  }}
                  className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
                >
                  <img
                    src={image.url}
                    alt={image.alt}
                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-2xl">🔍</span>
                  </div>
                  <div className="absolute bottom-2 left-2 right-2">
                    <h3 className="text-white text-sm font-medium truncate">
                      {image.title}
                    </h3>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Feature Status */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-2xl font-bold text-white mb-6">✅ Phase 3 Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-green-400 mb-4">🖼️ Enhanced Image Modal</h3>
              <ul className="space-y-2 text-white/70">
                <li>✅ Zoom and pan functionality</li>
                <li>✅ Keyboard shortcuts (←→, +/-, 0, ESC)</li>
                <li>✅ Carousel navigation</li>
                <li>✅ Thumbnail strip</li>
                <li>✅ Loading states and error handling</li>
                <li>✅ Drag constraints and smooth animations</li>
              </ul>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-blue-400 mb-4">🍽️ Interactive Product Cards</h3>
              <ul className="space-y-2 text-white/70">
                <li>✅ Hover effects and animations</li>
                <li>✅ Dietary tag filtering with colors</li>
                <li>✅ "Recommended by waiter" badges</li>
                <li>✅ Availability states</li>
                <li>✅ Shimmer animations</li>
                <li>✅ Image click handlers</li>
              </ul>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-purple-400 mb-4">🎭 Micro-Interactions</h3>
              <ul className="space-y-2 text-white/70">
                <li>✅ Success animations</li>
                <li>✅ Progress indicators with shimmer</li>
                <li>✅ Floating action buttons</li>
                <li>✅ Pulse notifications</li>
                <li>✅ Shake animations for errors</li>
                <li>✅ Bounce animations for success</li>
              </ul>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-yellow-400 mb-4">🎨 Visual Enhancements</h3>
              <ul className="space-y-2 text-white/70">
                <li>✅ Smooth 60fps animations</li>
                <li>✅ Backdrop blur effects</li>
                <li>✅ Gradient backgrounds</li>
                <li>✅ Loading skeletons</li>
                <li>✅ Hover glow effects</li>
                <li>✅ Responsive design</li>
              </ul>
            </div>
          </div>
        </motion.section>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center text-white/50 text-sm"
        >
          <p>🎮 Interactive Demo • Click images to open modal • Hover cards for effects • Test all micro-interactions</p>
        </motion.div>
      </div>

      {/* Image Modal */}
      <EnhancedImageModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        images={SAMPLE_IMAGES}
        initialIndex={selectedImageIndex}
      />
    </div>
  );
};

export default TestPhase3;
