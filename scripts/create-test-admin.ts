import bcrypt from "bcryptjs";
import { db } from "../src/server/db";

async function createTestAdmin() {
  try {
    console.log("🔍 Checking for existing restaurant...");
    
    // First, let's check if there's a restaurant, if not create one
    let restaurant = await db.restaurant.findFirst();
    
    if (!restaurant) {
      console.log("🏪 Creating test restaurant...");
      restaurant = await db.restaurant.create({
        data: {
          name: "Test Restaurant",
          subdomain: "test-restaurant",
        },
      });
      console.log("✅ Restaurant created:", restaurant.name);
    } else {
      console.log("✅ Found existing restaurant:", restaurant.name);
    }

    // Check if admin already exists
    const existingAdmin = await db.adminUser.findFirst({
      where: { email: "admin@test.com" },
    });

    if (existingAdmin) {
      console.log("⚠️  Admin user already exists with email: admin@test.com");
      console.log("📧 You can use these credentials:");
      console.log("   Email: admin@test.com");
      console.log("   Password: admin123");
      return;
    }

    // Create admin user
    console.log("👤 Creating test admin user...");
    const hashedPassword = await bcrypt.hash("admin123", 10);
    
    const adminUser = await db.adminUser.create({
      data: {
        email: "admin@test.com",
        passwordHash: hashedPassword,
        restaurantId: restaurant.id,
        role: "ADMIN",
      },
    });

    console.log("✅ Test admin user created successfully!");
    console.log("📧 Login credentials:");
    console.log("   Email: admin@test.com");
    console.log("   Password: admin123");
    console.log("   Restaurant:", restaurant.name);
    
  } catch (error) {
    console.error("❌ Error creating test admin:", error);
  } finally {
    await db.$disconnect();
  }
}

// Run the script
createTestAdmin(); 