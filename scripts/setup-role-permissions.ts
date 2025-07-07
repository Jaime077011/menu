import { db } from "@/server/db";
import { SuperAdminRole } from "@/utils/roles";

async function setupRolePermissions() {
  try {
    console.log("🔧 Setting up role permissions...");

    // Create/update Support Admin permissions to allow role management
    const supportAdminPermissions = {
      canManageAdmins: true, // Allow role management
      canManageRestaurants: true,
      canManageSubscriptions: true,
      canManagePlans: false,
      canViewAnalytics: true,
      canViewBilling: false,
      canManageSettings: false,
      canManageTemplates: false,
      canManageKnowledge: true,
    };

    // Get or create a Super Admin to use as the creator
    const superAdmin = await db.superAdmin.findFirst({
      where: { role: SuperAdminRole.SUPER_ADMIN },
    });

    if (!superAdmin) {
      console.error("❌ No Super Admin found. Please create a Super Admin first.");
      return;
    }

    // Upsert Support Admin permissions
    await db.rolePermission.upsert({
      where: { role: SuperAdminRole.SUPPORT_ADMIN },
      update: {
        permissions: JSON.stringify(supportAdminPermissions),
        createdBy: superAdmin.id,
      },
      create: {
        role: SuperAdminRole.SUPPORT_ADMIN,
        permissions: JSON.stringify(supportAdminPermissions),
        createdBy: superAdmin.id,
      },
    });

    console.log("✅ Support Admin permissions updated:");
    console.log("   - Can manage administrators: ✅");
    console.log("   - Can manage restaurants: ✅");
    console.log("   - Can manage subscriptions: ✅");
    console.log("   - Can manage knowledge: ✅");
    console.log("   - Cannot manage plans: ❌");
    console.log("   - Cannot view billing: ❌");
    console.log("   - Cannot manage settings: ❌");
    console.log("   - Cannot manage templates: ❌");

    console.log("\n🎉 Role permissions setup complete!");
    console.log("Support Admins can now access the Role Permissions page.");

  } catch (error) {
    console.error("❌ Error setting up role permissions:", error);
  } finally {
    await db.$disconnect();
  }
}

setupRolePermissions(); 