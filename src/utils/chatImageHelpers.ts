import { getCategoryColor, getMenuItemInitials } from "./menuHelpers";

interface MenuItem {
  id: string;
  name: string;
  price: number;
  imageUrl?: string | null;
  imageAlt?: string | null;
  category?: string | null;
}

interface MenuItemMatch {
  item: MenuItem;
  mentionedName: string;
}

// Find menu items mentioned in AI text response
export function findMenuItemsInText(text: string, menuItems: MenuItem[]): MenuItemMatch[] {
  const matches: MenuItemMatch[] = [];
  const lowerText = text.toLowerCase();
  
  for (const item of menuItems) {
    const itemName = item.name.toLowerCase();
    
    // Check for exact name matches (case insensitive)
    if (lowerText.includes(itemName)) {
      matches.push({
        item,
        mentionedName: item.name,
      });
    }
  }
  
  return matches;
}

// Generate image HTML for a menu item
export function generateMenuItemImageHtml(item: MenuItem): string {
  const fallbackColor = getCategoryColor(item.category ?? 'Other');
  
  if (item.imageUrl) {
    return `
      <div class="menu-item-image">
        <img 
          src="${item.imageUrl}" 
          alt="${item.imageAlt ?? item.name}"
          style="width: 64px; height: 64px; object-fit: cover; border-radius: 8px; border: 2px solid #e5e7eb;"
        />
      </div>
    `;
  } else {
    return `
      <div class="menu-item-image">
        <div 
          style="width: 64px; height: 64px; background-color: ${fallbackColor}; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 12px; text-align: center; line-height: 1.2;"
        >
          ${getMenuItemInitials(item.name)}
        </div>
      </div>
    `;
  }
}

// Enhanced chat message that includes images for mentioned menu items
export function enhanceMessageWithImages(message: string, menuItems: MenuItem[]): string {
  const foundItems = findMenuItemsInText(message, menuItems);
  
  if (foundItems.length === 0) {
    return message;
  }
  
  // Add images at the end of the message
  let enhancedMessage = message;
  
  const imageSection = foundItems.map(({ item }) => {
    const imageHtml = generateMenuItemImageHtml(item);
    return `
      <div style="display: flex; align-items: center; gap: 12px; margin: 8px 0; padding: 8px; background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
        ${imageHtml}
        <div>
          <div style="font-weight: 600; color: #111927;">${item.name}</div>
          <div style="color: #6b7280; font-size: 14px;">$${Number(item.price).toFixed(2)}</div>
        </div>
      </div>
    `;
  }).join('');
  
  enhancedMessage += '\n\n' + imageSection;
  
  return enhancedMessage;
} 