import { useState } from "react";
import { api } from "@/utils/api";
import { WaiterWithSpeech } from "@/components/WaiterCharacter";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function TestChat() {
  const [message, setMessage] = useState("");
  const [conversation, setConversation] = useState<Message[]>([]);
  const [tableNumber, setTableNumber] = useState<number>(5);

  const sendMessageMutation = api.chat.sendMessage.useMutation({
    onSuccess: (data) => {
      setConversation(data.conversationHistory);
      setMessage("");
      
      // Show order creation notification
      if ('orderCreated' in data && data.orderCreated) {
        console.log("🎉 Order created successfully!", data.orderCreated);
        alert(`🎉 Order created! Order ID: ${data.orderCreated.id.slice(-6)} | Total: $${data.orderCreated.total.toFixed(2)}`);
      }
    },
    onError: (error) => {
      console.error("Chat error:", error);
      alert(`Error: ${error.message}`);
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    sendMessageMutation.mutate({
      message: message.trim(),
      tableNumber,
      restaurantId: "test-restaurant-id", // TODO: Replace with actual restaurant ID
      conversationHistory: conversation,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-gray-900">AI Chat Test</h1>
          <p className="text-gray-600">Testing restaurant AI assistant</p>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">
              Table Number:
            </label>
            <input
              type="number"
              value={tableNumber}
              onChange={(e) => setTableNumber(Number(e.target.value))}
              className="mt-1 block w-32 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              min={1}
              max={999}
            />
          </div>
        </div>

        <div className="h-96 overflow-y-auto p-6 space-y-4">
          {conversation.length === 0 ? (
            <div className="text-center py-8">
              <WaiterWithSpeech 
                mood="happy"
                restaurantName="Test Restaurant"
                waiterName="Test Waiter"
                personality="FRIENDLY"
                message="Hello! I'm your AI waiter. How can I help you today?"
                size="large"
              />
            </div>
          ) : (
            conversation.map((msg, index) => (
              <div
                key={index}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "assistant" ? (
                  <WaiterWithSpeech 
                    mood="talking"
                    restaurantName="Test Restaurant"
                    waiterName="Test Waiter"
                    personality="FRIENDLY"
                    message={msg.content}
                  />
                ) : (
                  <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-indigo-600 text-white">
                    <div className="text-sm font-semibold mb-1">You</div>
                    <div className="text-sm">{msg.content}</div>
                  </div>
                )}
              </div>
            ))
          )}

          {sendMessageMutation.isPending && (
            <div className="flex justify-start">
              <WaiterWithSpeech 
                mood="thinking"
                restaurantName="Test Restaurant"
                waiterName="Test Waiter"
                personality="FRIENDLY"
                isTyping={true}
              />
            </div>
          )}
        </div>

        <form onSubmit={handleSendMessage} className="p-6 border-t">
          <div className="flex space-x-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              disabled={sendMessageMutation.isPending}
            />
            <button
              type="submit"
              disabled={!message.trim() || sendMessageMutation.isPending}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 