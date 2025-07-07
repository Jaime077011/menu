import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function exportMenuData() {
  try {
    console.log('🔄 Exporting menu data from database...');

    // Export menu items with all relevant information
    const menuItems = await prisma.menuItem.findMany({
      include: {
        category: true,
        restaurant: {
          select: {
            id: true,
            name: true,
            subdomain: true,
          }
        },
        // Include any other relations you have
      }
    });

    // Transform the data for RAG consumption
    const transformedMenuItems = menuItems.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description || '',
      price: item.price,
      category: item.category?.name || 'Uncategorized',
      categoryId: item.categoryId,
      ingredients: item.ingredients || [],
      allergens: item.allergens || [],
      dietaryTags: item.dietaryTags || [],
      available: item.available ?? true,
      preparationTime: item.preparationTime || 15,
      imageUrl: item.imageUrl || null,
      restaurantId: item.restaurantId,
      restaurantName: item.restaurant?.name || 'Unknown Restaurant',
      restaurantSubdomain: item.restaurant?.subdomain || null,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    // Export restaurants data
    const restaurants = await prisma.restaurant.findMany({
      select: {
        id: true,
        name: true,
        subdomain: true,
        description: true,
        cuisine: true,
        location: true,
        phone: true,
        email: true,
        hours: true,
        // Add any other restaurant fields you have
      }
    });

    // Ensure data directory exists
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir);
    }

    // Write menu data
    fs.writeFileSync(
      path.join(dataDir, 'menu.json'),
      JSON.stringify(transformedMenuItems, null, 2)
    );

    // Write restaurant data
    fs.writeFileSync(
      path.join(dataDir, 'restaurants.json'),
      JSON.stringify(restaurants, null, 2)
    );

    // Create a combined restaurant info file for the first restaurant (or you can modify this logic)
    const primaryRestaurant = restaurants[0];
    if (primaryRestaurant) {
      const restaurantInfo = {
        id: primaryRestaurant.id,
        name: primaryRestaurant.name,
        subdomain: primaryRestaurant.subdomain,
        description: primaryRestaurant.description || '',
        cuisine: primaryRestaurant.cuisine || 'International',
        location: primaryRestaurant.location || 'Local',
        phone: primaryRestaurant.phone || '',
        email: primaryRestaurant.email || '',
        hours: primaryRestaurant.hours || '9:00 AM - 10:00 PM',
        specialties: [], // You can add this field to your database or derive it
        policies: {
          reservations: 'Contact us for reservations',
          dietary: 'We accommodate most dietary restrictions - please inform your server'
        }
      };

      fs.writeFileSync(
        path.join(dataDir, 'restaurant.json'),
        JSON.stringify(restaurantInfo, null, 2)
      );
    }

    console.log(`✅ Exported ${transformedMenuItems.length} menu items`);
    console.log(`✅ Exported ${restaurants.length} restaurants`);
    console.log('📁 Files created:');
    console.log('   - data/menu.json');
    console.log('   - data/restaurants.json');
    console.log('   - data/restaurant.json');

    // Show some stats
    const categories = [...new Set(transformedMenuItems.map(item => item.category))];
    const avgPrice = transformedMenuItems.reduce((sum, item) => sum + item.price, 0) / transformedMenuItems.length;
    
    console.log('\n📊 Menu Statistics:');
    console.log(`   - Categories: ${categories.join(', ')}`);
    console.log(`   - Average Price: $${avgPrice.toFixed(2)}`);
    console.log(`   - Available Items: ${transformedMenuItems.filter(item => item.available).length}`);

  } catch (error) {
    console.error('❌ Error exporting menu data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

exportMenuData(); 