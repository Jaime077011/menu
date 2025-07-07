import { hash } from "bcryptjs";
import { db } from "../src/server/db";

async function createSuperAdmin() {
  try {
    console.log("🔍 Checking for existing super admin...");
    
    // Check if super admin already exists
    const existingSuperAdmin = await db.superAdmin.findFirst({
      where: { email: "superadmin@nexus.com" },
    });

    if (existingSuperAdmin) {
      console.log("⚠️  Super admin already exists with email: superadmin@nexus.com");
      console.log("📧 You can use these credentials:");
      console.log("   Email: superadmin@nexus.com");
      console.log("   Password: superadmin123");
      return;
    }

    // Create super admin user
    console.log("👑 Creating super admin user...");
    const hashedPassword = await hash("superadmin123", 12);
    
    const superAdmin = await db.superAdmin.create({
      data: {
        email: "superadmin@nexus.com",
        passwordHash: hashedPassword,
        name: "Super Administrator",
        role: "SUPER_ADMIN",
        isActive: true,
      },
    });

    console.log("✅ Super admin user created successfully!");
    console.log("📧 Login credentials:");
    console.log("   Email: superadmin@nexus.com");
    console.log("   Password: superadmin123");
    console.log("   Name:", superAdmin.name);
    console.log("   Role:", superAdmin.role);
    
  } catch (error) {
    console.error("❌ Error creating super admin:", error);
  } finally {
    await db.$disconnect();
  }
}

// Run the script
createSuperAdmin(); 