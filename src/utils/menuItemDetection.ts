interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string | null;
  imageAlt?: string | null;
  dietaryTags: Array<{ value: string }>;
}

/**
 * Detects menu items mentioned in an AI message and returns them for card display
 */
export function detectMentionedMenuItems(
  message: string,
  menuItems: MenuItem[]
): MenuItem[] {
  const mentionedItems: MenuItem[] = [];
  const normalizedMessage = message.toLowerCase();

  // Look for each menu item in the message
  for (const item of menuItems) {
    const itemName = item.name.toLowerCase();
    
    // Create different patterns to find the item
    const patterns = [
      // Exact name match
      new RegExp(`\\b${itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i'),
      // Name with possessive ('s)
      new RegExp(`\\b${itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'s\\b`, 'i'),
      // Name with plural (simple 's' addition)
      new RegExp(`\\b${itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}s\\b`, 'i'),
      // Name in quotes
      new RegExp(`"${itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'i'),
    ];

    // Check if any pattern matches
    const isFound = patterns.some(pattern => pattern.test(message));
    
    if (isFound && !mentionedItems.find(existing => existing.id === item.id)) {
      mentionedItems.push(item);
    }
  }

  return mentionedItems;
}

/**
 * Detects if an AI message is making recommendations and extracts relevant items
 */
export function detectRecommendations(
  message: string,
  menuItems: MenuItem[]
): { isRecommendation: boolean; items: MenuItem[] } {
  const recommendationKeywords = [
    'recommend', 'suggest', 'try', 'popular', 'favorite', 'best',
    'delicious', 'special', 'signature', 'chef recommends', 'must try'
  ];

  const isRecommendation = recommendationKeywords.some(keyword => 
    message.toLowerCase().includes(keyword)
  );

  if (!isRecommendation) {
    return { isRecommendation: false, items: [] };
  }

  // If it's a recommendation, detect mentioned items
  const items = detectMentionedMenuItems(message, menuItems);
  
  return { isRecommendation: true, items };
}

/**
 * Detects if user is asking about specific categories
 */
export function detectCategoryQuery(
  message: string,
  menuItems: MenuItem[]
): { category: string | null; items: MenuItem[] } {
  const normalizedMessage = message.toLowerCase();
  
  // Get all unique categories from menu
  const categories = [...new Set(menuItems.map(item => item.category.toLowerCase()))];
  
  // Look for category mentions
  for (const category of categories) {
    const categoryPattern = new RegExp(`\\b${category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
    
    if (categoryPattern.test(message)) {
      const categoryItems = menuItems.filter(
        item => item.category.toLowerCase() === category
      );
      
      return { 
        category: category, 
        items: categoryItems.slice(0, 6) // Limit to 6 items
      };
    }
  }

  // Check for common category queries
  const categoryQueries = {
    'appetizer': ['appetizer', 'starter', 'small plate'],
    'main': ['main', 'entree', 'dinner', 'lunch'],
    'dessert': ['dessert', 'sweet', 'cake', 'ice cream'],
    'drink': ['drink', 'beverage', 'cocktail', 'wine', 'beer'],
    'vegetarian': ['vegetarian', 'veggie', 'plant-based'],
    'vegan': ['vegan'],
  };

  for (const [category, keywords] of Object.entries(categoryQueries)) {
    if (keywords.some(keyword => normalizedMessage.includes(keyword))) {
      // Find items that match this category or have relevant dietary tags
      const matchingItems = menuItems.filter(item => {
        const itemCategory = item.category.toLowerCase();
        const itemTags = item.dietaryTags.map(tag => tag.value.toLowerCase());
        
        return keywords.some(keyword => 
          itemCategory.includes(keyword) || 
          itemTags.some(tag => tag.includes(keyword))
        );
      });

      if (matchingItems.length > 0) {
        return { 
          category: category, 
          items: matchingItems.slice(0, 6)
        };
      }
    }
  }

  return { category: null, items: [] };
}

/**
 * Main function to analyze a message and determine what menu cards to show
 */
export function analyzeMessageForMenuCards(
  message: string,
  menuItems: MenuItem[]
): {
  type: 'mentioned' | 'recommendation' | 'category' | 'none';
  items: MenuItem[];
  title?: string;
} {
  // First check for recommendations
  const recommendation = detectRecommendations(message, menuItems);
  if (recommendation.isRecommendation && recommendation.items.length > 0) {
    return {
      type: 'recommendation',
      items: recommendation.items,
      title: 'Recommended Items'
    };
  }

  // Check for category queries
  const categoryQuery = detectCategoryQuery(message, menuItems);
  if (categoryQuery.category && categoryQuery.items.length > 0) {
    return {
      type: 'category',
      items: categoryQuery.items,
      title: `${categoryQuery.category.charAt(0).toUpperCase() + categoryQuery.category.slice(1)} Options`
    };
  }

  // Check for mentioned items
  const mentionedItems = detectMentionedMenuItems(message, menuItems);
  if (mentionedItems.length > 0) {
    return {
      type: 'mentioned',
      items: mentionedItems,
      title: 'Mentioned Items'
    };
  }

  return {
    type: 'none',
    items: []
  };
} 