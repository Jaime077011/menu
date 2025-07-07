import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // Create super admin first
  const superAdmin = await prisma.superAdmin.upsert({
    where: { email: "superadmin@nexus.com" },
    update: {},
    create: {
      email: "superadmin@nexus.com",
      passwordHash: await bcrypt.hash("superadmin123", 12),
      name: "System Administrator",
      role: "SUPER_ADMIN"
    }
  });

  console.log("👑 Created super admin:", superAdmin.email);

  // Create waiter personality templates
  const templates = await Promise.all([
    prisma.waiterPersonalityTemplate.upsert({
      where: { name: "Friendly & Welcoming" },
      update: {},
      create: {
        name: "Friendly & Welcoming",
        description: "Warm, approachable, and makes customers feel at home",
        tone: "CASUAL",
        responseStyle: "HELPFUL",
        defaultWelcomeMessage: "Welcome! I'm so happy you're here. I'm here to make sure you have an amazing dining experience today!",
        createdById: superAdmin.id
      }
    }),
    prisma.waiterPersonalityTemplate.upsert({
      where: { name: "Professional & Efficient" },
      update: {},
      create: {
        name: "Professional & Efficient",
        description: "Courteous, knowledgeable, and focused on service excellence",
        tone: "FORMAL",
        responseStyle: "CONCISE",
        defaultWelcomeMessage: "Good day. I'm your server and I'll be assisting you today. How may I help you?",
        createdById: superAdmin.id
      }
    }),
    prisma.waiterPersonalityTemplate.upsert({
      where: { name: "Casual & Conversational" },
      update: {},
      create: {
        name: "Casual & Conversational",
        description: "Relaxed, laid-back, and easy to talk to",
        tone: "CASUAL",
        responseStyle: "DETAILED",
        defaultWelcomeMessage: "Hey there! Welcome to our place. I'm here if you need anything - just let me know!",
        createdById: superAdmin.id
      }
    }),
    prisma.waiterPersonalityTemplate.upsert({
      where: { name: "Enthusiastic & Playful" },
      update: {},
      create: {
        name: "Enthusiastic & Playful",
        description: "Energetic, fun, and brings personality to every interaction",
        tone: "CASUAL",
        responseStyle: "PLAYFUL",
        defaultWelcomeMessage: "Welcome to the best part of your day! I'm absolutely thrilled to help you discover something delicious!",
        createdById: superAdmin.id
      }
    })
  ]);

  console.log("🎭 Created waiter personality templates:", templates.map(t => t.name));

  // Create knowledge snippets
  const knowledgeSnippetTitles = [
    {
      title: "Dietary Restrictions Help",
      content: "Always ask about allergies and dietary restrictions. Common ones include: gluten-free, dairy-free, vegan, vegetarian, nut allergies, and shellfish allergies. Offer suitable alternatives when available.",
      category: "dietary"
    },
    {
      title: "Wine Pairing Basics",
      content: "Red wines pair well with red meat and rich dishes. White wines complement fish, poultry, and lighter fare. Sparkling wines are great with appetizers and celebrations. Ask about preferences and suggest accordingly.",
      category: "beverage"
    },
    {
      title: "Upselling Techniques",
      content: "Suggest appetizers, desserts, or premium options naturally. Focus on enhancing the dining experience rather than just increasing the bill. Ask about special occasions to suggest celebratory items.",
      category: "sales"
    }
  ];

  const knowledgeSnippets = [];
  for (const snippet of knowledgeSnippetTitles) {
    const existing = await prisma.knowledgeSnippet.findFirst({
      where: { 
        title: snippet.title,
        createdById: superAdmin.id 
      }
    });

    if (!existing) {
      const created = await prisma.knowledgeSnippet.create({
        data: {
          ...snippet,
          createdById: superAdmin.id
        }
      });
      knowledgeSnippets.push(created);
    } else {
      knowledgeSnippets.push(existing);
    }
  }

  console.log("📚 Created knowledge snippets:", knowledgeSnippets.map(k => k.title));

  // Create subscription plans
  const starterPlan = await prisma.subscriptionPlan.upsert({
    where: { name: "STARTER" },
    update: {},
    create: {
      name: "STARTER",
      displayName: "Starter Plan",
      description: "Perfect for small cafes, food trucks, and single-location restaurants",
      price: 29.00,
      billingInterval: "MONTHLY",
      maxLocations: 1,
      maxMenuItems: 50,
      maxWaiters: 1, // Only basic waiter
      features: JSON.stringify({
        basicAI: true,
        qrOrdering: true,
        basicAnalytics: true,
        emailSupport: true,
        customPersonality: false,
        advancedAnalytics: false,
        phoneSupport: false,
        customBranding: false,
        apiAccess: false,
        integrations: false
      }),
      isActive: true,
      sortOrder: 1,
    },
  });

  const professionalPlan = await prisma.subscriptionPlan.upsert({
    where: { name: "PROFESSIONAL" },
    update: {},
    create: {
      name: "PROFESSIONAL",
      displayName: "Professional Plan",
      description: "Ideal for growing restaurants and small chains",
      price: 79.00,
      billingInterval: "MONTHLY",
      maxLocations: 3,
      maxMenuItems: 200,
      maxWaiters: 3, // Multiple waiter personalities
      features: JSON.stringify({
        basicAI: true,
        qrOrdering: true,
        basicAnalytics: true,
        emailSupport: true,
        customPersonality: true,
        advancedAnalytics: true,
        phoneSupport: true,
        customBranding: true,
        multiLocation: true,
        staffManagement: true,
        advancedReporting: true,
        webhooks: true,
        apiAccess: false,
        integrations: false
      }),
      isActive: true,
      sortOrder: 2,
    },
  });

  const enterprisePlan = await prisma.subscriptionPlan.upsert({
    where: { name: "ENTERPRISE" },
    update: {},
    create: {
      name: "ENTERPRISE",
      displayName: "Enterprise Plan",
      description: "For restaurant chains and high-volume establishments",
      price: 199.00,
      billingInterval: "MONTHLY",
      maxLocations: -1, // Unlimited
      maxMenuItems: -1, // Unlimited
      maxWaiters: -1, // Unlimited waiter personalities
      features: JSON.stringify({
        basicAI: true,
        qrOrdering: true,
        basicAnalytics: true,
        emailSupport: true,
        customPersonality: true,
        advancedAnalytics: true,
        phoneSupport: true,
        customBranding: true,
        multiLocation: true,
        staffManagement: true,
        advancedReporting: true,
        webhooks: true,
        apiAccess: true,
        integrations: true,
        whiteLabel: true,
        prioritySupport: true,
        dedicatedManager: true,
        customDevelopment: true,
        slaGuarantee: true,
        dataExport: true
      }),
      isActive: true,
      sortOrder: 3,
    },
  });

  console.log("💳 Created subscription plans:", { starterPlan, professionalPlan, enterprisePlan });

  // Create test restaurants
  const pizzaPalace = await prisma.restaurant.upsert({
    where: { subdomain: "pizza-palace" },
    update: {},
    create: {
      name: "Pizza Palace",
      subdomain: "pizza-palace",
    },
  });

  const burgerBarn = await prisma.restaurant.upsert({
    where: { subdomain: "burger-barn" },
    update: {},
    create: {
      name: "Burger Barn",
      subdomain: "burger-barn",
    },
  });

  console.log("🏪 Created restaurants:", { pizzaPalace, burgerBarn });

  // Create trial subscriptions for test restaurants
  const trialEndDate = new Date();
  trialEndDate.setDate(trialEndDate.getDate() + 14); // 14 days from now

  const pizzaSubscription = await prisma.restaurantSubscription.create({
    data: {
      restaurantId: pizzaPalace.id,
      planId: starterPlan.id,
      status: "TRIAL",
      currentPeriodStart: new Date(),
      currentPeriodEnd: trialEndDate,
      trialEnd: trialEndDate,
    },
  });

  const burgerSubscription = await prisma.restaurantSubscription.create({
    data: {
      restaurantId: burgerBarn.id,
      planId: professionalPlan.id,
      status: "TRIAL",
      currentPeriodStart: new Date(),
      currentPeriodEnd: trialEndDate,
      trialEnd: trialEndDate,
    },
  });

  console.log("🔄 Created trial subscriptions:", { pizzaSubscription, burgerSubscription });

  // Create admin users for each restaurant
  const adminPassword = await bcrypt.hash("admin123", 12);

  const pizzaAdmin = await prisma.adminUser.upsert({
    where: { email: "admin@pizzapalace.com" },
    update: {},
    create: {
      email: "admin@pizzapalace.com",
      passwordHash: adminPassword,
      restaurantId: pizzaPalace.id,
    },
  });

  const burgerAdmin = await prisma.adminUser.upsert({
    where: { email: "admin@burgerbarn.com" },
    update: {},
    create: {
      email: "admin@burgerbarn.com",
      passwordHash: adminPassword,
      restaurantId: burgerBarn.id,
    },
  });

  console.log("👤 Created admin users:", { pizzaAdmin, burgerAdmin });

  // Create menu items for Pizza Palace
  const pizzaItems = [
    {
      name: "Margherita Pizza",
      description: "Classic tomato sauce, fresh mozzarella, and basil",
      category: "Pizza",
      price: 16.99,
      available: true,
      dietaryTags: ["Vegetarian"],
    },
    {
      name: "Pepperoni Pizza",
      description: "Tomato sauce, mozzarella, and pepperoni",
      category: "Pizza",
      price: 18.99,
      available: true,
      dietaryTags: [],
    },
    {
      name: "Caesar Salad",
      description: "Romaine lettuce, parmesan, croutons, and Caesar dressing",
      category: "Salads",
      price: 12.99,
      available: true,
      dietaryTags: ["Vegetarian"],
    },
    {
      name: "Garlic Bread",
      description: "Fresh baked bread with garlic butter",
      category: "Appetizers",
      price: 6.99,
      available: true,
      dietaryTags: ["Vegetarian"],
    },
  ];

  for (const item of pizzaItems) {
    const menuItem = await prisma.menuItem.upsert({
      where: {
        restaurantId_name: {
          restaurantId: pizzaPalace.id,
          name: item.name,
        },
      },
      update: {},
      create: {
        name: item.name,
        description: item.description,
        category: item.category,
        price: item.price,
        available: item.available,
        restaurantId: pizzaPalace.id,
      },
    });

    // Add dietary tags
    for (const tagValue of item.dietaryTags) {
      await prisma.dietaryTag.upsert({
        where: {
          menuItemId_value: {
            menuItemId: menuItem.id,
            value: tagValue,
          },
        },
        update: {},
        create: {
          value: tagValue,
          menuItemId: menuItem.id,
        },
      });
    }
  }

  // Create menu items for Burger Barn
  const burgerItems = [
    {
      name: "Classic Cheeseburger",
      description: "Beef patty, cheese, lettuce, tomato, onion, pickles",
      category: "Burgers",
      price: 14.99,
      available: true,
      dietaryTags: [],
    },
    {
      name: "Veggie Burger",
      description: "Plant-based patty, lettuce, tomato, onion, avocado",
      category: "Burgers",
      price: 15.99,
      available: true,
      dietaryTags: ["Vegetarian", "Vegan"],
    },
    {
      name: "BBQ Bacon Burger",
      description: "Beef patty, bacon, BBQ sauce, onion rings, cheese",
      category: "Burgers",
      price: 17.99,
      available: true,
      dietaryTags: [],
    },
    {
      name: "Sweet Potato Fries",
      description: "Crispy sweet potato fries with sea salt",
      category: "Sides",
      price: 7.99,
      available: true,
      dietaryTags: ["Vegetarian", "Vegan", "Gluten-Free"],
    },
    {
      name: "Chocolate Milkshake",
      description: "Rich chocolate milkshake with whipped cream",
      category: "Beverages",
      price: 5.99,
      available: true,
      dietaryTags: ["Vegetarian"],
    },
  ];

  for (const item of burgerItems) {
    const menuItem = await prisma.menuItem.upsert({
      where: {
        restaurantId_name: {
          restaurantId: burgerBarn.id,
          name: item.name,
        },
      },
      update: {},
      create: {
        name: item.name,
        description: item.description,
        category: item.category,
        price: item.price,
        available: item.available,
        restaurantId: burgerBarn.id,
      },
    });

    // Add dietary tags
    for (const tagValue of item.dietaryTags) {
      await prisma.dietaryTag.upsert({
        where: {
          menuItemId_value: {
            menuItemId: menuItem.id,
            value: tagValue,
          },
        },
        update: {},
        create: {
          value: tagValue,
          menuItemId: menuItem.id,
        },
      });
    }
  }

  console.log("🍕 Created menu items for both restaurants");

  // Create some test orders
  const margheritaPizza = await prisma.menuItem.findFirst({
    where: { restaurantId: pizzaPalace.id, name: "Margherita Pizza" },
  });
  
  const caesarSalad = await prisma.menuItem.findFirst({
    where: { restaurantId: pizzaPalace.id, name: "Caesar Salad" },
  });

  if (!margheritaPizza || !caesarSalad) {
    throw new Error("Required menu items not found for test order");
  }

  // Calculate total for the test order
  const orderTotal = (Number(margheritaPizza.price) * 2) + (Number(caesarSalad.price) * 1);

  const testOrder = await prisma.order.create({
    data: {
      restaurantId: pizzaPalace.id,
      tableNumber: "Table 5",
      customerName: "John Doe",
      total: orderTotal,
      status: "PENDING",
      notes: "Please make extra crispy",
      items: {
        create: [
          {
            menuItemId: margheritaPizza.id,
            quantity: 2,
            priceAtTime: margheritaPizza.price,
            notes: "Extra cheese",
          },
          {
            menuItemId: caesarSalad.id,
            quantity: 1,
            priceAtTime: caesarSalad.price,
          },
        ],
      },
    },
  });

  console.log("📝 Created test order:", testOrder);

  // Assign knowledge to waiter personality templates
  const templateKnowledgeAssignments = [
    // Basic template gets basic knowledge
    { templateName: "Friendly & Welcoming", knowledgeTitle: "Dietary Restrictions Help" },
    { templateName: "Friendly & Welcoming", knowledgeTitle: "Upselling Techniques" },
    
    // Professional template gets wine pairing + dietary
    { templateName: "Professional & Efficient", knowledgeTitle: "Wine Pairing Basics" },
    { templateName: "Professional & Efficient", knowledgeTitle: "Dietary Restrictions Help" },
    
    // Casual template gets upselling + dietary  
    { templateName: "Casual & Conversational", knowledgeTitle: "Upselling Techniques" },
    { templateName: "Casual & Conversational", knowledgeTitle: "Dietary Restrictions Help" },
    
    // Enthusiastic template gets all knowledge
    { templateName: "Enthusiastic & Playful", knowledgeTitle: "Dietary Restrictions Help" },
    { templateName: "Enthusiastic & Playful", knowledgeTitle: "Wine Pairing Basics" },
    { templateName: "Enthusiastic & Playful", knowledgeTitle: "Upselling Techniques" },
  ];

  for (const assignment of templateKnowledgeAssignments) {
    const template = templates.find((t: any) => t.name === assignment.templateName);
    const knowledge = knowledgeSnippets.find((k: any) => k.title === assignment.knowledgeTitle);
    
    if (template && knowledge) {
      await prisma.templateKnowledge.upsert({
        where: {
          templateId_snippetId: {
            templateId: template.id,
            snippetId: knowledge.id
          }
        },
        update: {},
        create: {
          templateId: template.id,
          snippetId: knowledge.id,
          createdBy: superAdmin.id
        }
      });
    }
  }

  console.log("🧠 Assigned knowledge to waiter templates");

  // Set premium templates for higher plans
  await prisma.waiterPersonalityTemplate.update({
    where: { name: "Professional & Efficient" },
    data: { 
      minimumPlan: "PROFESSIONAL",
      isPremium: false
    }
  });

  await prisma.waiterPersonalityTemplate.update({
    where: { name: "Enthusiastic & Playful" },
    data: { 
      minimumPlan: "PROFESSIONAL", 
      isPremium: true
    }
  });

  console.log("🎯 Set plan requirements for premium templates");

  // Create a few more test orders with different statuses
  const pepperoniPizza = await prisma.menuItem.findFirst({
    where: { restaurantId: pizzaPalace.id, name: "Pepperoni Pizza" },
  });
  
  const garlicBread = await prisma.menuItem.findFirst({
    where: { restaurantId: pizzaPalace.id, name: "Garlic Bread" },
  });

  if (pepperoniPizza && garlicBread) {
    // Order 2 - Preparing status
    await prisma.order.create({
      data: {
        restaurantId: pizzaPalace.id,
        tableNumber: "Table 3",
        customerName: "Jane Smith",
        total: Number(pepperoniPizza.price) + Number(garlicBread.price),
        status: "PREPARING",
        notes: "No olives please",
        createdAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
        items: {
          create: [
            {
              menuItemId: pepperoniPizza.id,
              quantity: 1,
              priceAtTime: pepperoniPizza.price,
            },
            {
              menuItemId: garlicBread.id,
              quantity: 1,
              priceAtTime: garlicBread.price,
              notes: "Extra garlic",
            },
          ],
        },
      },
    });

    // Order 3 - Ready status
    await prisma.order.create({
      data: {
        restaurantId: pizzaPalace.id,
        tableNumber: "Table 8",
        customerName: "Mike Johnson",
        total: Number(margheritaPizza.price),
        status: "READY",
        createdAt: new Date(Date.now() - 25 * 60 * 1000), // 25 minutes ago
        items: {
          create: [
            {
              menuItemId: margheritaPizza.id,
              quantity: 1,
              priceAtTime: margheritaPizza.price,
            },
          ],
        },
      },
    });
  }

  console.log("✅ Seed completed successfully!");
  console.log("\n🔐 Admin Login Credentials:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🍕 Pizza Palace Admin:");
  console.log("   Email: admin@pizzapalace.com");
  console.log("   Password: admin123");
  console.log("   URL: http://localhost:3000/admin/login");
  console.log("");
  console.log("🍔 Burger Barn Admin:");
  console.log("   Email: admin@burgerbarn.com");
  console.log("   Password: admin123");
  console.log("   URL: http://localhost:3000/admin/login");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  }); 