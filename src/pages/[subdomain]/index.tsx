import { type GetServerSideProps } from "next";
import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { getRestaurantFromSubdomain } from "@/utils/restaurant";
import ModernChatContainer from "@/components/chat/ModernChatContainer";

interface RestaurantChatProps {
  restaurant: {
    id: string;
    name: string;
    subdomain: string;
  };
}

export default function RestaurantChat({ restaurant }: RestaurantChatProps) {
  console.log("🚀 ENHANCED CHAT LOADED - Phase 7 Modern Version with Rive!");
  const router = useRouter();
  const [tableNumber, setTableNumber] = useState<number | null>(null);
  const [showTableInput, setShowTableInput] = useState(true);
  const [inputError, setInputError] = useState<string | null>(null);

  // Handle QR code table parameter and session persistence
  useEffect(() => {
    // Check for table parameter from QR code
    const { table } = router.query;
    if (table && typeof table === "string") {
      const tableNum = parseInt(table, 10);
      if (tableNum > 0 && tableNum <= 999) {
        setTableNumber(tableNum);
        setShowTableInput(false);
        return; // Skip session restoration if QR code provided table
      }
    }

    // Session persistence - save to localStorage
    try {
      const savedSession = localStorage.getItem(`restaurant-${restaurant.subdomain}-session`);
      if (savedSession) {
        const session = JSON.parse(savedSession);
        if (session.tableNumber) {
          setTableNumber(session.tableNumber);
          setShowTableInput(false);
        }
      }
    } catch (error) {
      console.error("Error loading session:", error);
      localStorage.removeItem(`restaurant-${restaurant.subdomain}-session`);
    }
  }, [restaurant.subdomain, restaurant.name, router.query]);

  // Save session to localStorage
  useEffect(() => {
    if (tableNumber) {
      try {
        const session = {
          tableNumber,
          timestamp: new Date().toISOString(),
        };
        localStorage.setItem(`restaurant-${restaurant.subdomain}-session`, JSON.stringify(session));
      } catch (error) {
        console.error("Error saving session:", error);
      }
    }
  }, [tableNumber, restaurant.subdomain]);

  // Enhanced table submission with validation
  const handleTableSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    if (!tableNumber || tableNumber < 1 || tableNumber > 999) {
      setInputError("Please enter a valid table number (1-999)");
      return;
    }
    
    setInputError(null);
    setShowTableInput(false);
  };

  if (showTableInput) {
    return (
      <>
        <Head>
          <title>{restaurant.name} - Order Assistant</title>
          <meta name="description" content={`Order from ${restaurant.name} with our AI assistant`} />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>

        <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-white">🍽️</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome to {restaurant.name}
              </h1>
              <p className="text-gray-600">
                Start chatting with our AI waiter to place your order
              </p>
            </div>

            <form onSubmit={handleTableSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What's your table number?
                </label>
                <input
                  type="number"
                  value={tableNumber ?? ""}
                  onChange={(e) => {
                    setTableNumber(e.target.value ? Number(e.target.value) : null);
                    setInputError(null);
                  }}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-center text-lg transition-colors ${
                    inputError ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter table number"
                  min={1}
                  max={999}
                  required
                  autoFocus
                />
                {inputError && (
                  <p className="text-red-500 text-sm mt-1">{inputError}</p>
                )}
              </div>
              
              <button
                type="submit"
                disabled={!tableNumber || tableNumber < 1}
                className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-4"
              >
                Start Ordering
              </button>
            </form>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{restaurant.name} - Table {tableNumber}</title>
        <meta name="description" content={`Ordering from ${restaurant.name}`} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <ModernChatContainer
        restaurantId={restaurant.id}
        restaurantName={restaurant.name}
        tableNumber={tableNumber?.toString()}
        waiterName="AI Waiter"
        personality="FRIENDLY"
        className="h-screen"
      />
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const subdomain = context.params?.subdomain as string;

  if (!subdomain) {
    return {
      notFound: true,
    };
  }

  // Get restaurant data from subdomain parameter (now used as restaurant identifier)
  // For URL structure: http://localhost:3000/pizza-palace?table=1
  const restaurant = await getRestaurantFromSubdomain(subdomain);

  if (!restaurant) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      restaurant,
    },
  };
}; 