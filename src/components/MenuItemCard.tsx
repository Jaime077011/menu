import { useState } from "react";
import { getMenuItemImageUrl, getMenuItemImageAlt } from "@/utils/fallback-image";

interface MenuItemCardProps {
  item: {
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    imageUrl?: string | null;
    imageAlt?: string | null;
    dietaryTags: Array<{ value: string }>;
  };
  onAddToOrder?: (item: MenuItemCardProps['item'], quantity: number) => void;
  onViewDetails?: (item: MenuItemCardProps['item']) => void;
  size?: 'small' | 'medium' | 'large';
  showAddToOrder?: boolean;
}

export function MenuItemCard({ 
  item, 
  onAddToOrder, 
  onViewDetails,
  size = 'medium',
  showAddToOrder = true 
}: MenuItemCardProps) {
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  const imageUrl = getMenuItemImageUrl(item);
  const imageAlt = getMenuItemImageAlt(item);

  // Size classes for responsive design
  const sizeClasses = {
    small: {
      container: 'w-64',
      image: 'h-32',
      text: 'text-sm',
      button: 'text-xs px-2 py-1'
    },
    medium: {
      container: 'w-80',
      image: 'h-40',
      text: 'text-sm',
      button: 'text-sm px-3 py-2'
    },
    large: {
      container: 'w-96',
      image: 'h-48',
      text: 'text-base',
      button: 'text-sm px-4 py-2'
    }
  };

  const classes = sizeClasses[size];

  const handleAddToOrder = async () => {
    if (!onAddToOrder) return;
    
    setIsAdding(true);
    try {
      await onAddToOrder(item, quantity);
      // Reset quantity after successful add
      setQuantity(1);
    } catch (error) {
      console.error('Error adding to order:', error);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className={`${classes.container} bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200`}>
      {/* Image */}
      <div className={`${classes.image} relative overflow-hidden`}>
        <img
          src={imageUrl}
          alt={imageAlt}
          className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-200"
          onClick={() => onViewDetails?.(item)}
        />
        
        {/* Price badge */}
        <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded-md text-sm font-medium">
          ${item.price.toFixed(2)}
        </div>

        {/* Dietary tags */}
        {item.dietaryTags.length > 0 && (
          <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
            {item.dietaryTags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="bg-green-500 text-white text-xs px-2 py-1 rounded-full"
              >
                {tag.value}
              </span>
            ))}
            {item.dietaryTags.length > 3 && (
              <span className="bg-gray-500 text-white text-xs px-2 py-1 rounded-full">
                +{item.dietaryTags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Name and Category */}
        <div className="mb-2">
          <h3 className={`font-semibold text-gray-900 ${classes.text} line-clamp-1`}>
            {item.name}
          </h3>
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            {item.category}
          </p>
        </div>

        {/* Description */}
        <p className={`text-gray-600 ${classes.text} line-clamp-2 mb-3`}>
          {item.description}
        </p>

        {/* Actions */}
        {showAddToOrder && (
          <div className="flex items-center justify-between">
            {/* Quantity selector */}
            <div className="flex items-center space-x-2">
              <label className="text-xs text-gray-500">Qty:</label>
              <select
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
                className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                disabled={isAdding}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>

            {/* Add to order button */}
            <button
              onClick={handleAddToOrder}
              disabled={isAdding}
              className={`${classes.button} bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-1`}
            >
              {isAdding ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <span>🛒</span>
                  <span>Add</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* View details button */}
        {onViewDetails && (
          <button
            onClick={() => onViewDetails(item)}
            className="mt-2 w-full text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center justify-center space-x-1"
          >
            <span>👁️</span>
            <span>View Details</span>
          </button>
        )}
      </div>
    </div>
  );
}

// Menu item cards container for chat
interface MenuItemCardsProps {
  items: MenuItemCardProps['item'][];
  onAddToOrder?: (item: MenuItemCardProps['item'], quantity: number) => void;
  onViewDetails?: (item: MenuItemCardProps['item']) => void;
  title?: string;
  maxItems?: number;
}

export function MenuItemCards({ 
  items, 
  onAddToOrder, 
  onViewDetails, 
  title = "Recommended Items",
  maxItems = 3 
}: MenuItemCardsProps) {
  const displayItems = items.slice(0, maxItems);

  if (displayItems.length === 0) {
    return null;
  }

  return (
    <div className="my-4">
      {title && (
        <h4 className="text-sm font-medium text-gray-700 mb-3">{title}</h4>
      )}
      
      <div className="flex space-x-3 overflow-x-auto pb-2">
        {displayItems.map((item) => (
          <div key={item.id} className="flex-shrink-0">
            <MenuItemCard
              item={item}
              onAddToOrder={onAddToOrder}
              onViewDetails={onViewDetails}
              size="small"
            />
          </div>
        ))}
      </div>

      {items.length > maxItems && (
        <p className="text-xs text-gray-500 mt-2">
          +{items.length - maxItems} more items available
        </p>
      )}
    </div>
  );
} 