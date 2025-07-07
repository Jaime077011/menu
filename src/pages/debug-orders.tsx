import { useState } from 'react';
import { api } from '@/utils/api';

export default function DebugOrders() {
  const [restaurantId, setRestaurantId] = useState('');
  const [tableNumber, setTableNumber] = useState(4);
  const [debugResults, setDebugResults] = useState<any>(null);

  // Manual order check
  const checkOrders = api.chat.checkOrders.useQuery(
    { restaurantId, tableNumber },
    { enabled: false }
  );

  // Get all restaurants for testing
  const { data: restaurants } = api.restaurant.getAll.useQuery();

  const handleCheck = async () => {
    try {
      const result = await checkOrders.refetch();
      setDebugResults(result.data);
      console.log('Order check result:', result.data);
    } catch (error) {
      console.error('Order check error:', error);
      setDebugResults({ error: error.message });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔍 Order Checking Debug Tool</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Parameters</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Restaurant</label>
              <select 
                value={restaurantId} 
                onChange={(e) => setRestaurantId(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="">Select Restaurant</option>
                {restaurants?.map(restaurant => (
                  <option key={restaurant.id} value={restaurant.id}>
                    {restaurant.name} ({restaurant.subdomain})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Table Number</label>
              <input 
                type="number" 
                value={tableNumber} 
                onChange={(e) => setTableNumber(parseInt(e.target.value))}
                className="w-full p-2 border rounded"
                min="1"
                max="999"
              />
            </div>
          </div>
          
          <button 
            onClick={handleCheck}
            disabled={!restaurantId}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            🔍 Check Orders
          </button>
        </div>

        {debugResults && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Debug Results</h2>
            
            {debugResults.error ? (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                <strong>Error:</strong> {debugResults.error}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                  <strong>Success:</strong> {debugResults.success ? 'True' : 'False'}
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Orders Found: {debugResults.orders?.length || 0}</h3>
                  {debugResults.orders?.length > 0 ? (
                    <div className="space-y-2">
                      {debugResults.orders.map((order: any, index: number) => (
                        <div key={order.id} className="border p-3 rounded">
                          <div className="font-medium">Order #{order.id.slice(-6).toUpperCase()}</div>
                          <div className="text-sm text-gray-600">
                            Status: {order.status} | Total: ${order.total} | Created: {new Date(order.createdAt).toLocaleString()}
                          </div>
                          <div className="text-sm">
                            Items: {order.items?.map((item: any) => `${item.quantity}x ${item.name}`).join(', ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-600">No orders found</div>
                  )}
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Raw Response:</h3>
                  <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                    {JSON.stringify(debugResults, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 