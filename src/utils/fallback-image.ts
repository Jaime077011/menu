/**
 * Utility functions for handling menu item fallback images
 */

// Generate a placeholder image URL based on menu item category
export function getFallbackImageUrl(category: string, name: string): string {
  // Use a placeholder service with category-based colors
  const categoryColors: Record<string, string> = {
    'Pizza': 'ff6b6b',
    'Burgers': 'feca57',
    'Salads': '48ca8b',
    'Appetizers': 'ff9ff3',
    'Beverages': '54a0ff',
    'Desserts': 'ffeaa7',
    'Sides': 'dda0dd',
    'default': '95a5a6',
  };

  const color = categoryColors[category || 'default'] ?? categoryColors.default;
  const size = '400x300';
  const text = encodeURIComponent((name || 'Menu Item').substring(0, 20));
  
  return `https://via.placeholder.com/${size}/${color}/ffffff?text=${text}`;
}

// Get appropriate alt text for fallback images
export function getFallbackImageAlt(name: string, category: string): string {
  return `${name} - ${category} menu item`;
}

// Check if an image URL is a fallback/placeholder
export function isFallbackImage(imageUrl: string): boolean {
  return imageUrl.includes('via.placeholder.com') || imageUrl.includes('placeholder');
}

// Get the best available image URL (uploaded image or fallback)
export function getMenuItemImageUrl(item: {
  imageUrl?: string | null;
  name: string;
  category: string;
}): string {
  if (item.imageUrl && item.imageUrl.trim() !== '') {
    return item.imageUrl;
  }
  return getFallbackImageUrl(item.category, item.name);
}

// Get the best available alt text
export function getMenuItemImageAlt(item: {
  imageAlt?: string | null;
  imageUrl?: string | null;
  name: string;
  category: string;
}): string {
  if (item.imageAlt && item.imageAlt.trim() !== '') {
    return item.imageAlt;
  }
  if (item.imageUrl && !isFallbackImage(item.imageUrl)) {
    return `Photo of ${item.name}`;
  }
  return getFallbackImageAlt(item.name, item.category);
} 