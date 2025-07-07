import { MenuItemCard, MenuItemCards } from "@/components/MenuItemCard";

const sampleMenuItems = [
  {
    id: "1",
    name: "Margherita Pizza",
    description: "Fresh mozzarella, tomato sauce, and basil on our signature wood-fired crust",
    price: 18.99,
    category: "Pizza",
    imageUrl: null,
    imageAlt: null,
    dietaryTags: [{ value: "Vegetarian" }],
  },
  {
    id: "2", 
    name: "Caesar Salad",
    description: "Crisp romaine lettuce with parmesan cheese, croutons, and our house-made Caesar dressing",
    price: 12.99,
    category: "Salad",
    imageUrl: null,
    imageAlt: null,
    dietaryTags: [{ value: "Vegetarian" }, { value: "Gluten-Free Option" }],
  },
  {
    id: "3",
    name: "Grilled Salmon",
    description: "Atlantic salmon grilled to perfection with lemon herb butter and seasonal vegetables",
    price: 24.99,
    category: "Main Course",
    imageUrl: null,
    imageAlt: null,
    dietaryTags: [{ value: "Gluten-Free" }, { value: "High Protein" }],
  },
];

export default function TestMenuCards() {
  const handleAddToOrder = (item: any, quantity: number) => {
    alert(`Added ${quantity} x ${item.name} to order!`);
  };

  const handleViewDetails = (item: any) => {
    alert(`Viewing details for ${item.name}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Menu Cards Test</h1>
        
        {/* Single Card Test */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Single Card (Medium)</h2>
          <div className="flex justify-center">
            <MenuItemCard
              item={sampleMenuItems[0]!}
              onAddToOrder={handleAddToOrder}
              onViewDetails={handleViewDetails}
              size="medium"
            />
          </div>
        </div>

        {/* Cards Container Test */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Cards Container (Small)</h2>
          <MenuItemCards
            items={sampleMenuItems}
            title="Recommended Items"
            onAddToOrder={handleAddToOrder}
            onViewDetails={handleViewDetails}
            maxItems={3}
          />
        </div>

        {/* Different Sizes */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Different Sizes</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Small</h3>
              <MenuItemCard
                item={sampleMenuItems[0]!}
                onAddToOrder={handleAddToOrder}
                size="small"
              />
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Medium</h3>
              <MenuItemCard
                item={sampleMenuItems[1]!}
                onAddToOrder={handleAddToOrder}
                size="medium"
              />
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Large</h3>
              <MenuItemCard
                item={sampleMenuItems[2]!}
                onAddToOrder={handleAddToOrder}
                size="large"
              />
            </div>
          </div>
        </div>

        {/* Without Add to Order Button */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Display Only (No Add to Order)</h2>
          <div className="flex justify-center">
            <MenuItemCard
              item={sampleMenuItems[0]!}
              onViewDetails={handleViewDetails}
              showAddToOrder={false}
              size="medium"
            />
          </div>
        </div>
      </div>
    </div>
  );
} 