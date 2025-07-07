// Category color mapping for menu item fallbacks
const CATEGORY_COLORS = {
  // Main categories
  'Pizza': '#dc2626',      // Red
  'Appetizers': '#ea580c',  // Orange
  'Salads': '#16a34a',     // Green
  'Sandwiches': '#ca8a04',  // Yellow
  'Pasta': '#9333ea',      // Purple
  'Entrees': '#0ea5e9',    // Blue
  'Seafood': '#0891b2',    // Cyan
  'Desserts': '#e11d48',   // Pink
  'Beverages': '#7c3aed',  // Violet
  'Drinks': '#7c3aed',     // Violet (alias)
  'Soups': '#f59e0b',      // Amber
  'Sides': '#10b981',      // Emerald
  'Burgers': '#dc2626',    // Red
  'Steaks': '#991b1b',     // Dark red
  'Chicken': '#fbbf24',    // Light yellow
  'Vegetarian': '#22c55e', // Light green
  'Vegan': '#15803d',      // Dark green
  'Specials': '#8b5cf6',   // Medium purple
  'Other': '#6b7280',      // Gray (default)
} as const;

/**
 * Get a color for a menu category
 */
export function getCategoryColor(category: string | null | undefined): string {
  if (!category) {
    return CATEGORY_COLORS.Other;
  }
  
  // Try exact match first
  if (category in CATEGORY_COLORS) {
    return CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS];
  }
  
  // Try case-insensitive match
  const categoryLower = category.toLowerCase();
  for (const [key, color] of Object.entries(CATEGORY_COLORS)) {
    if (key.toLowerCase() === categoryLower) {
      return color;
    }
  }
  
  // Try partial match (e.g., "Hot Appetizers" -> "Appetizers")
  for (const [key, color] of Object.entries(CATEGORY_COLORS)) {
    if (categoryLower.includes(key.toLowerCase()) || key.toLowerCase().includes(categoryLower)) {
      return color;
    }
  }
  
  // Default to gray
  return CATEGORY_COLORS.Other;
}

/**
 * Get all available category colors
 */
export function getAllCategoryColors(): Record<string, string> {
  return { ...CATEGORY_COLORS };
}

/**
 * Generate initials from a menu item name for placeholder display
 */
export function getMenuItemInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 3); // Max 3 characters
} 