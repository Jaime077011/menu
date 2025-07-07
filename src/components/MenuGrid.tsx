import { useState } from "react";
import { getCategoryColor, getMenuItemInitials } from "@/utils/menuHelpers";
import { ImageModal } from "@/components/ImageModal";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  dietaryTags: {
    id: string;
    value: string;
  }[];
}

interface MenuGridProps {
  menuItems: MenuItem[];
  onItemClick?: (item: MenuItem) => void;
}

export function MenuGrid({ menuItems, onItemClick }: MenuGridProps) {
  const [selectedImage, setSelectedImage] = useState<{
    url: string;
    alt: string;
    itemName: string;
  } | null>(null);

  // Group items by category
  const itemsByCategory = menuItems.reduce((acc, item) => {
    const category = item.category ?? "Other";
    acc[category] ??= [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  const handleImageClick = (item: MenuItem, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering onItemClick
    if (item.imageUrl) {
      setSelectedImage({
        url: item.imageUrl,
        alt: item.imageAlt ?? item.name,
        itemName: item.name,
      });
    }
  };

  return (
    <>
      <div className="bg-white border-t">
        <div className="max-h-96 overflow-y-auto p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Browse Our Menu</h3>
          
          {Object.entries(itemsByCategory).map(([category, items]) => (
            <div key={category} className="mb-6">
              <h4 className="text-md font-medium text-gray-800 mb-3 flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: getCategoryColor(category) }}
                />
                {category}
              </h4>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onItemClick?.(item)}
                    className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    {/* Image */}
                    <div className="w-full h-20 mb-2 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center relative group">
                      {item.imageUrl ? (
                        <>
                          <img 
                            src={item.imageUrl} 
                            alt={item.imageAlt ?? item.name}
                            className="w-full h-full object-cover"
                          />
                          {/* Zoom overlay */}
                          <div 
                            onClick={(e) => handleImageClick(item, e)}
                            className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all cursor-zoom-in flex items-center justify-center"
                          >
                            <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-sm font-medium">
                              🔍 View
                            </span>
                          </div>
                        </>
                      ) : (
                        <div 
                          className="w-full h-full flex items-center justify-center text-white font-semibold text-sm"
                          style={{ backgroundColor: getCategoryColor(item.category) }}
                        >
                          {getMenuItemInitials(item.name)}
                        </div>
                      )}
                    </div>
                    
                    {/* Item Info */}
                    <h5 className="font-medium text-sm text-gray-900 mb-1 line-clamp-2">
                      {item.name}
                    </h5>
                    <p className="text-xs text-gray-600 mb-1 line-clamp-1">
                      {item.description}
                    </p>
                    <p className="text-sm font-semibold text-indigo-600">
                      ${Number(item.price).toFixed(2)}
                    </p>
                    
                    {/* Dietary Tags */}
                    {item.dietaryTags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.dietaryTags.slice(0, 2).map((tag) => (
                          <span
                            key={tag.id}
                            className="px-1 py-0.5 bg-green-100 text-green-700 text-xs rounded"
                          >
                            {tag.value}
                          </span>
                        ))}
                        {item.dietaryTags.length > 2 && (
                          <span className="text-xs text-gray-500">+{item.dietaryTags.length - 2}</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Image Modal */}
      <ImageModal
        isOpen={!!selectedImage}
        imageUrl={selectedImage?.url ?? ""}
        imageAlt={selectedImage?.alt ?? ""}
        itemName={selectedImage?.itemName ?? ""}
        onClose={() => setSelectedImage(null)}
      />
    </>
  );
} 