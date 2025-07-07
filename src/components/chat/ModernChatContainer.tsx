import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import RiveWaiterCharacter from '../rive/RiveWaiterCharacter';
import { useCharacterStore, getCharacterStateFromMessage } from '../../stores/characterStore';
import { api } from '@/utils/api';
import { analyzeMessageForMenuCards } from '@/utils/menuItemDetection';
import ActionConfirmationDialog from './ActionConfirmationDialog';
import QuickActionButtons, { commonQuickActions, orderQuickActions } from './QuickActionButtons';
import { CustomerSessionPanel } from './CustomerSessionPanel';
import type { PendingAction } from '@/types/chatActions';
import { isActionResponse, isPositiveResponse } from '@/utils/actionDetection';


interface ModernChatContainerProps {
  restaurantId: string;
  restaurantName: string;
  tableNumber?: string;
  waiterName?: string;
  personality?: 'FRIENDLY' | 'PROFESSIONAL' | 'CASUAL' | 'ENTHUSIASTIC';
  onSendMessage?: (message: string) => void;
  onOrderUpdate?: (items: any[]) => void;
  className?: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  menuCards?: {
    type: 'mentioned' | 'recommendation' | 'category' | 'none';
    items: any[];
    title?: string;
  };
}

export const ModernChatContainer: React.FC<ModernChatContainerProps> = ({
  restaurantId,
  restaurantName,
  tableNumber,
  waiterName = 'Waiter',
  personality = 'FRIENDLY',
  onSendMessage,
  onOrderUpdate,
  className = '',
}) => {
  const [conversation, setConversation] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showMenuSidebar, setShowMenuSidebar] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<any[]>([]);
  const [orderNotification, setOrderNotification] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isCharacterFloating, setIsCharacterFloating] = useState(false);
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(true);
  
  // Action confirmation state
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [currentOrderContext, setCurrentOrderContext] = useState<string | null>(null);
  
  // Session state
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [showSessionPanel, setShowSessionPanel] = useState(false);
  const [sessionRefreshTrigger, setSessionRefreshTrigger] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const characterRef = useRef<{ triggerState: (state: string) => boolean }>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { 
    updatePersonality, 
    addConversationContext, 
    setLastUserMessage,
    queueAnimation 
  } = useCharacterStore();

  const [headerRef, headerInView] = useInView({ threshold: 0.1 });

  // Fetch menu items for menu cards analysis
  const { data: menuItems = [] } = api.menu.getByRestaurant.useQuery(
    { restaurantId },
    { enabled: !!restaurantId }
  );

  // Fetch waiter personality settings
  const { data: waiterSettings } = api.restaurant.getWaiterSettings.useQuery(
    { restaurantId },
    { enabled: !!restaurantId }
  );

  // Order checking mutation
  const checkOrdersMutation = api.chat.checkOrders.useQuery(
    { 
      restaurantId, 
      tableNumber: tableNumber ? parseInt(tableNumber) : 1 
    },
    { enabled: false } // Only run when manually triggered
  );

  // Order editing mutation
  const editOrderMutation = api.chat.editOrder.useMutation({
    onSuccess: (data) => {
      console.log('Order edited:', data);
      setOrderNotification(`✅ ${data.message}`);
      setTimeout(() => setOrderNotification(null), 4000);
      
      // Add the response as a new assistant message
      setConversation(prev => [
        ...prev,
        { role: "assistant", content: data.message }
      ]);
    },
    onError: (error) => {
      console.error("Order edit error:", error);
      setOrderNotification("❌ Failed to edit order. Please try again.");
      setTimeout(() => setOrderNotification(null), 3000);
    },
  });

  // Action confirmation mutation
  const confirmActionMutation = api.chat.confirmAction.useMutation({
    onSuccess: (data) => {
      console.log('Action confirmed:', data);
      
      // CRITICAL: Only show success if API actually succeeded
      if (!data.success) {
        // Handle API failure with error notification
        setOrderNotification(`❌ ${data.message || 'Action failed'}`);
        setTimeout(() => setOrderNotification(null), 5000);
        
        // Keep the action pending so user can retry
        console.log('Action failed, keeping in pending state for retry');
        return;
      }
      
      // Remove the confirmed action only after API success
      setPendingActions(prev => prev.filter(action => action.id !== data.actionId));
      setAwaitingConfirmation(false);
      
      // Add the response as a new assistant message
      setConversation(prev => [
        ...prev,
        { role: "assistant", content: data.message }
      ]);
      
      // Handle order creation (only on confirmed success)
      if ('orderCreated' in data && data.orderCreated) {
        const order = data.orderCreated;
        setOrderNotification(`🎉 Order #${order.id.slice(-6).toUpperCase()} placed! Total: $${(typeof order.total === 'number' ? order.total : parseFloat(order.total.toString())).toFixed(2)}`);
        setTimeout(() => setOrderNotification(null), 8000);
        
        // Trigger celebration animation
        queueAnimation('happy');
        if (characterRef.current) {
          characterRef.current.triggerState('happy');
        }
        
        // Refresh session data to update statistics
        refreshSessionData();
      }
      // Handle order updates (add/remove/modify items) 
      else if ('orderUpdate' in data && data.orderUpdate) {
        const update = data.orderUpdate;
        
        if (update.itemAdded) {
          queueAnimation('happy');
          if (characterRef.current) {
            characterRef.current.triggerState('happy');
          }
        } else if (update.itemRemoved) {
          queueAnimation('thinking');
          if (characterRef.current) {
            characterRef.current.triggerState('thinking');
          }
        } else if (update.cancelled) {
          queueAnimation('idle');
          if (characterRef.current) {
            characterRef.current.triggerState('idle');
          }
        }
      }
      // Show general success notification (only for verified success)
      else {
        const notificationIcon = "✅";
        setOrderNotification(`${notificationIcon} ${data.message}`);
        setTimeout(() => setOrderNotification(null), 4000);
      }
    },
    onError: (error) => {
      console.error("Action confirmation error:", error);
      
      // Enhanced error handling with specific messages
      let errorMessage = "❌ Failed to process action. Please try again.";
      
      if (error.message.includes("PENDING")) {
        errorMessage = "❌ This order cannot be modified - it's already being prepared in the kitchen.";
      } else if (error.message.includes("not found")) {
        errorMessage = "❌ Order not found. It may have been cancelled or completed.";
      } else if (error.message.includes("empty")) {
        errorMessage = "❌ Cannot place empty order. Please add items first.";
      }
      
      setOrderNotification(errorMessage);
      setTimeout(() => setOrderNotification(null), 5000);
    },
  });

  // 🧠 NEW: AI-driven chat mutation with intelligent action detection
  const sendMessageMutation = api.chat.sendMessage.useMutation({
    onMutate: () => {
      setIsTyping(true);
    },
    onSuccess: (data) => {
      console.log("🧠 AI Chat Response:", {
        hasAction: !!data.pendingAction,
        hasButtons: !!data.actionButtons,
        message: data.message?.substring(0, 50) + "..."
      });

      // Process the conversation history to add menu cards
      const processedHistory = data.conversationHistory.map((msg, index) => {
        if (msg.role === "assistant" && index === data.conversationHistory.length - 1) {
          // Only analyze the latest AI message for menu cards
          const menuCardAnalysis = analyzeMessageForMenuCards(msg.content, menuItems);
          return {
            ...msg,
            menuCards: menuCardAnalysis.items.length > 0 ? menuCardAnalysis : undefined
          };
        }
        return msg;
      });

      setConversation(processedHistory);
      setIsTyping(false);
      
      // 🧠 NEW: Handle AI-detected actions directly from backend response
      if (data.pendingAction) {
        console.log('🎯 AI-detected action received:', data.pendingAction.type);
        
        // Check if action requires confirmation
        if (data.pendingAction.requiresConfirmation) {
          // Add to pending actions and wait for user confirmation
          setPendingActions(prev => [...prev, data.pendingAction]);
          setAwaitingConfirmation(true);
        } else {
          // Execute immediately for non-confirmatory actions like CHECK_ORDERS
          console.log('🚀 Executing immediate action:', data.pendingAction.type);
          
          // Use the proper action confirmation system to get formatted messages
          confirmActionMutation.mutate({
            actionId: data.pendingAction.id,
            confirmed: true,
            restaurantId,
            tableNumber: parseInt(tableNumber || '1'),
            actionData: {
              type: data.pendingAction.type,
              data: data.pendingAction.data
            }
          });
        }
        
        // Trigger appropriate character animation based on action type
        const actionMood = getCharacterMoodFromAction(data.pendingAction.type);
        queueAnimation(actionMood);
        if (characterRef.current) {
          setTimeout(() => {
            characterRef.current?.triggerState(actionMood);
          }, 300);
        }
      } else {
        // No action - just conversational response
        const conversationMood = getCharacterStateFromMessage(data.message);
        queueAnimation(conversationMood);
        if (characterRef.current) {
          setTimeout(() => {
            characterRef.current?.triggerState(conversationMood);
          }, 300);
        }
      }
      
      // Show order creation notification (legacy support)
      if ('orderCreated' in data && data.orderCreated) {
        const order = data.orderCreated;
        setOrderNotification(`🎉 Order #${order.id} created! Total: $${(typeof order.total === 'number' ? order.total : parseFloat(order.total.toString())).toFixed(2)}`);
        setTimeout(() => setOrderNotification(null), 5000);
        
        // Trigger happy animation for successful order
        queueAnimation('happy');
        if (characterRef.current) {
          characterRef.current.triggerState('happy');
        }
      }
    },
    onError: (error) => {
      console.error("🚨 AI Chat error:", error);
      setIsTyping(false);
      
      // Provide helpful error message based on error type
      const errorMessage = error.message.includes("AI") ? 
        "🤖 AI is temporarily unavailable. Using fallback system..." :
        "❌ Failed to send message. Please try again.";
        
      setOrderNotification(errorMessage);
      setTimeout(() => setOrderNotification(null), 4000);
    },
  });

  // Initialize personality settings
  useEffect(() => {
    updatePersonality({
      type: personality,
      waiterName: waiterName,
    });
  }, [personality, waiterName, updatePersonality]);

  // Initialize welcome message
  useEffect(() => {
    if (waiterSettings && conversation.length === 0) {
      // For mobile: only show welcome message after welcome screen is dismissed
      // For desktop: show welcome message immediately since there's no welcome screen
      if ((isMobile && !showWelcomeScreen) || (!isMobile)) {
        const welcomeMessage = waiterSettings.welcomeMessage || 
          `Hi! I'm ${waiterSettings.waiterName || waiterName}. What can I get for you today?`;
        
        setConversation([{
          role: "assistant",
          content: welcomeMessage
        }]);
      }
    }
  }, [waiterSettings, waiterName, conversation.length, showWelcomeScreen, isMobile]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !tableNumber || sendMessageMutation.isPending) return;

    const messageToSend = inputValue.trim();
    
    // Prevent duplicate submissions
    if (conversation.length > 0 && 
        conversation[conversation.length - 1]?.role === "user" && 
        conversation[conversation.length - 1]?.content === messageToSend) {
      return;
    }

    // 🧠 NEW: Simplified - let AI handle all action detection
    // Check if this is a response to a pending action
    if (awaitingConfirmation && pendingActions.length > 0 && isActionResponse(messageToSend)) {
      const latestAction = pendingActions[pendingActions.length - 1];
      const isConfirming = isPositiveResponse(messageToSend);
      
      // Handle the action confirmation
      confirmActionMutation.mutate({
        actionId: latestAction.id,
        confirmed: isConfirming,
        restaurantId,
        tableNumber: parseInt(tableNumber),
      });
      
      setInputValue('');
      return;
    }

    // All other messages go to AI for intelligent processing
    // The AI will decide if any actions are needed

    setLastUserMessage(messageToSend);
    addConversationContext(messageToSend);
    
    // Add user message to conversation
    setConversation(prev => [...prev, { role: 'user', content: messageToSend }]);

    // Trigger character animation based on message content
    const characterMood = getCharacterStateFromMessage(messageToSend);
    queueAnimation(characterMood);
    
    if (characterRef.current) {
      setTimeout(() => {
        characterRef.current?.triggerState(characterMood);
      }, 300);
    }

    setInputValue('');

    // Call parent's message handler
    onSendMessage?.(messageToSend);

    // Send to real tRPC endpoint
    sendMessageMutation.mutate({
      message: messageToSend,
      tableNumber: parseInt(tableNumber),
      restaurantId,
      conversationHistory: conversation,
    });
  };

  // Action confirmation handlers
  const handleActionConfirm = (actionId: string) => {
    // Find the pending action to pass as fallback data
    const pendingAction = pendingActions.find(action => action.id === actionId);
    
    if (pendingAction?.type === 'EDIT_ORDER') {
      // Trigger order editing view
      checkOrdersMutation.refetch().then((result) => {
        if (result.data?.success) {
          const editableOrders = result.data.orders.filter(order => order.canEdit);
          let message = "Here are your orders that can still be modified:";
          
          if (editableOrders.length === 0) {
            message = "You don't have any orders that can be modified right now. Orders can only be edited before they start processing in the kitchen. Would you like to place a new order?";
          } else {
                         message += "\n\n" + editableOrders.map(order => {
               const itemsList = order.items.map((item: any) => 
                 `${item.quantity}x ${item.name} ($${formatPrice(item.price)} each)`
               ).join('\n  • ');
              
              return `✏️ **Order #${order.id.slice(-6).toUpperCase()}**
📅 Placed: ${new Date(order.createdAt).toLocaleString()}
💰 Total: $${formatPrice(order.total)}

**Items:**
  • ${itemsList}

**Available actions:**
• Add more items to this order
• Remove items from this order  
• Change item quantities
• Cancel this entire order`;
            }).join('\n\n---\n\n');
            
            message += `\n\nJust tell me what you'd like to change! For example:
• "Add 2 Caesar Salads to order #${editableOrders[0].id.slice(-6).toUpperCase()}"
• "Remove the pizza from my order"
• "Change the quantity of Caesar Salad to 3"
• "Cancel order #${editableOrders[0].id.slice(-6).toUpperCase()}"`;
          }
          
          setConversation(prev => [
            ...prev,
            { role: "assistant", content: message }
          ]);
        }
      });
      
      // Remove the pending action
      setPendingActions(prev => prev.filter(action => action.id !== actionId));
      setAwaitingConfirmation(false);
      return;
    }
    
    if (pendingAction?.type === 'SPECIFIC_ORDER_EDIT') {
      // Handle specific order editing (e.g., "add salad to order #ABC123")
      const { orderId, actionType, itemData } = pendingAction.data;
      
      // First, check recent orders to find the full order ID from the short ID
      checkOrdersMutation.refetch().then((result) => {
        if (result.data?.success) {
          const orders = result.data.orders;
          // Find the order by matching the last 6 characters of the ID
          const targetOrder = orders.find(order => 
            order.id.slice(-6).toUpperCase() === orderId.toUpperCase()
          );
          
          if (!targetOrder) {
            setConversation(prev => [
              ...prev,
              { role: "assistant", content: `I couldn't find order #${orderId}. Please check your recent orders and try again.` }
            ]);
            return;
          }
          
          if (!targetOrder.canEdit) {
            setConversation(prev => [
              ...prev,
              { role: "assistant", content: `Order #${orderId} can no longer be modified as it has already started processing in the kitchen.` }
            ]);
            return;
          }
          
          // Handle different action types
          if (actionType === 'select_order') {
            // Just selecting an order - show its details and set context
            const itemsList = targetOrder.items.map((item: any) => 
              `${item.quantity}x ${item.name} ($${formatPrice(item.price)} each)`
            ).join('\n  • ');
            
            const message = `📋 **Order #${orderId} Selected**
📅 Placed: ${new Date(targetOrder.createdAt).toLocaleString()}
💰 Total: $${formatPrice(targetOrder.total)}

**Current Items:**
  • ${itemsList}

What would you like to do with this order?
• Say "add [item]" to add items
• Say "remove the [item]" to remove items  
• Say "change quantity" to modify quantities
• Say "cancel" to cancel the entire order`;

            setConversation(prev => [
              ...prev,
              { role: "assistant", content: message }
            ]);
            
            // Set context for future messages
            setCurrentOrderContext(targetOrder.id);
            
          } else if (actionType === 'add_item' && itemData) {
            // Try to find the menu item by name
            const menuItem = menuItems.find(item => 
              item.name.toLowerCase().includes(itemData.name.toLowerCase()) ||
              itemData.name.toLowerCase().includes(item.name.toLowerCase())
            );
            
            if (menuItem) {
              // Execute the order edit with the found menu item
              editOrderMutation.mutate({
                orderId: targetOrder.id, // Use full order ID
                restaurantId,
                tableNumber: tableNumber ? parseInt(tableNumber) : 1,
                action: actionType,
                itemData: {
                  menuItemId: menuItem.id,
                  quantity: itemData.quantity || 1,
                  name: menuItem.name,
                  price: menuItem.price
                },
              });
            } else {
              // Item not found in menu
              setConversation(prev => [
                ...prev,
                { role: "assistant", content: `I couldn't find "${itemData.name}" on our menu. Please check the menu and try again with the exact item name.` }
              ]);
            }
          } else if (actionType === 'remove_item' && itemData) {
            // Find the item in the order to remove
            const orderItem = targetOrder.items.find((item: any) => 
              item.name.toLowerCase().includes(itemData.name.toLowerCase()) ||
              itemData.name.toLowerCase().includes(item.name.toLowerCase())
            );
            
            if (orderItem) {
              // Execute the order edit to remove the item
              editOrderMutation.mutate({
                orderId: targetOrder.id, // Use full order ID
                restaurantId,
                tableNumber: tableNumber ? parseInt(tableNumber) : 1,
                action: actionType,
                itemData: {
                  orderItemId: orderItem.id,
                  name: orderItem.name,
                },
              });
            } else {
              // Item not found in order
              setConversation(prev => [
                ...prev,
                { role: "assistant", content: `I couldn't find "${itemData.name}" in order #${orderId}. Please check the order items and try again.` }
              ]);
            }
          } else {
            // For other actions (modify, cancel), execute directly
            const mutationData: any = {
              orderId: targetOrder.id, // Use full order ID
              restaurantId,
              tableNumber: tableNumber ? parseInt(tableNumber) : 1,
              action: actionType,
            };
            
            // Only include itemData if it's not null (for cancel_order, we don't need itemData)
            if (itemData !== null && itemData !== undefined) {
              mutationData.itemData = itemData;
            }
            
            editOrderMutation.mutate(mutationData);
          }
        }
      });
      
      // Remove the pending action
      setPendingActions(prev => prev.filter(action => action.id !== actionId));
      setAwaitingConfirmation(false);
      return;
    }
    
    // Standard confirmation flow for other actions
    confirmActionMutation.mutate({
      actionId,
      confirmed: true,
      restaurantId,
      tableNumber: tableNumber ? parseInt(tableNumber) : undefined,
      // Pass action data as fallback in case server store is cleared
      actionData: pendingAction ? {
        type: pendingAction.type,
        data: pendingAction.data
      } : undefined,
    });
  };

  const handleActionDecline = (actionId: string) => {
    // Find the pending action to pass as fallback data
    const pendingAction = pendingActions.find(action => action.id === actionId);
    
    confirmActionMutation.mutate({
      actionId,
      confirmed: false,
      restaurantId,
      tableNumber: tableNumber ? parseInt(tableNumber) : undefined,
      // Pass action data as fallback in case server store is cleared
      actionData: pendingAction ? {
        type: pendingAction.type,
        data: pendingAction.data
      } : undefined,
    });
  };

  const handleActionModify = (actionId: string, modifications: any) => {
    // Find the pending action to pass as fallback data
    const pendingAction = pendingActions.find(action => action.id === actionId);
    
    confirmActionMutation.mutate({
      actionId,
      confirmed: false,
      restaurantId,
      tableNumber: tableNumber ? parseInt(tableNumber) : undefined,
      modifications,
      // Pass action data as fallback in case server store is cleared
      actionData: pendingAction ? {
        type: pendingAction.type,
        data: pendingAction.data
      } : undefined,
    });
  };

  const handleCustomAction = (actionId: string, customAction: string) => {
    // For custom actions, send as a regular message
    setInputValue(customAction);
    setTimeout(() => {
      handleSendMessage();
    }, 100);
  };

  // Quick action handler
  const handleQuickAction = (action: string) => {
    setInputValue(action);
    setTimeout(() => {
      handleSendMessage();
    }, 100);
  };

  // Order editing handlers
  const handleEditOrder = (orderId: string, action: 'add_item' | 'remove_item' | 'modify_quantity' | 'cancel_order', itemData?: any) => {
    const mutationData: any = {
      orderId,
      restaurantId,
      tableNumber: tableNumber ? parseInt(tableNumber) : 1,
      action,
    };
    
    // Only include itemData if it's provided (for cancel_order, we don't need itemData)
    if (itemData !== null && itemData !== undefined) {
      mutationData.itemData = itemData;
    }
    
    editOrderMutation.mutate(mutationData);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleMenuSidebar = () => {
    setShowMenuSidebar(!showMenuSidebar);
  };

  // Safe price formatting helper
  const formatPrice = (price: any): string => {
    return (typeof price === 'number' ? price : parseFloat(price?.toString() || '0')).toFixed(2);
  };

  const addToOrder = (item: any) => {
    setCurrentOrder(prev => [...prev, item]);
    onOrderUpdate?.([...currentOrder, item]);
    
    // Trigger happy animation when item is added
    queueAnimation('happy');
    if (characterRef.current) {
      characterRef.current.triggerState('happy');
    }
  };

  const refreshSessionData = () => {
    // Trigger session panel refresh by incrementing the trigger
    setSessionRefreshTrigger(prev => prev + 1);
  };

  // 🧠 NEW: Get character mood based on AI-detected action type
  const getCharacterMoodFromAction = (actionType: string): string => {
    switch (actionType) {
      case 'CONFIRM_ORDER':
      case 'ADD_TO_ORDER':
        return 'happy';
      case 'CANCEL_ORDER':
      case 'REMOVE_FROM_ORDER':
        return 'sad';
      case 'CHECK_ORDERS':
      case 'EDIT_ORDER':
        return 'thinking';
      case 'REQUEST_RECOMMENDATIONS':
        return 'excited';
      default:
        return 'idle';
    }
  };

  // Mobile Layout
  if (isMobile) {
    // Welcome Screen
    if (showWelcomeScreen) {
      return (
        <div className={`h-screen flex flex-col bg-white ${className}`}>
          {/* Welcome Screen */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col items-center justify-center px-6"
          >
            {/* Restaurant Name */}
            <motion.h1
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-3xl font-bold text-gray-900 mb-2 text-center"
            >
              {restaurantName}
            </motion.h1>
            
            <motion.p
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-gray-600 mb-8 text-center"
            >
              Welcome! Meet your AI waiter
            </motion.p>

            {/* Character */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
              className="w-64 h-64 mb-8"
            >
              <RiveWaiterCharacter
                restaurantId={restaurantId}
                personality={personality}
                waiterName={waiterSettings?.waiterName || waiterName}
                className="w-full h-full"
                showNameBadge={true}
                showGlassEffect={false}
                showGlow={false}
                onLoadComplete={() => console.log('Character loaded!')}
                onError={(error) => console.error('Character error:', error)}
              />
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="w-full max-w-sm space-y-4"
            >
              <motion.button
                onClick={() => {
                  setShowWelcomeScreen(false);
                  setIsCharacterFloating(true);
                }}
                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-semibold text-lg shadow-lg"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                🍽️ Place Order
              </motion.button>
              
              <motion.button
                onClick={() => {
                  setShowWelcomeScreen(false);
                  setIsCharacterFloating(true);
                  // Open menu after a brief delay to allow transition
                  setTimeout(() => {
                    setShowMenuSidebar(true);
                  }, 300);
                }}
                className="w-full bg-gray-100 text-gray-900 py-4 rounded-2xl font-semibold text-lg"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                📋 View Menu
              </motion.button>
            </motion.div>
          </motion.div>

          {/* Menu Sidebar (same as chat interface) */}
          <AnimatePresence>
            {showMenuSidebar && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-50"
                onClick={() => setShowMenuSidebar(false)}
              >
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200">
                      <h2 className="text-xl font-semibold text-gray-900">Menu</h2>
                      <button
                        onClick={() => setShowMenuSidebar(false)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <span className="text-gray-500 text-xl">×</span>
                      </button>
                    </div>

                    {/* Menu Items */}
                    <div className="flex-1 overflow-y-auto p-4">
                      {menuItems.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="text-gray-400 text-4xl mb-2">🍽️</div>
                          <p className="text-gray-500">No menu items available</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {Object.entries(
                            menuItems.reduce((acc, item) => {
                              const category = item.category || 'Other';
                              if (!acc[category]) acc[category] = [];
                              acc[category].push(item);
                              return acc;
                            }, {} as Record<string, typeof menuItems>)
                          ).map(([category, items]) => (
                            <div key={category}>
                              <h3 className="text-lg font-medium text-gray-900 mb-2 border-b border-gray-200 pb-1">
                                {category}
                              </h3>
                              <div className="space-y-3">
                                {items.map((item) => (
                                  <div
                                    key={item.id}
                                    className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors cursor-pointer"
                                    onClick={() => addToOrder(item)}
                                  >
                                    <div className="flex justify-between items-start">
                                      <div className="flex-1">
                                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                          {item.description}
                                        </p>
                                      </div>
                                      <div className="ml-3 text-right">
                                        <div className="font-semibold text-gray-900">
                                          ${(typeof item.price === 'number' ? item.price : parseFloat(item.price.toString())).toFixed(2)}
                                        </div>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            addToOrder(item);
                                          }}
                                          className="mt-1 bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700 transition-colors"
                                        >
                                          Add
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Current Order Summary */}
                    {currentOrder.length > 0 && (
                      <div className="border-t border-gray-200 p-4">
                        <h3 className="font-medium text-gray-900 mb-2">Current Order ({currentOrder.length} items)</h3>
                        <div className="space-y-1 max-h-20 overflow-y-auto">
                          {currentOrder.map((item, index) => (
                            <div key={index} className="flex justify-between items-center text-sm">
                              <span className="text-gray-600 flex-1">{item.name}</span>
                              <div className="flex items-center space-x-2">
                                <span className="text-gray-900">${(typeof item.price === 'number' ? item.price : parseFloat(item.price.toString())).toFixed(2)}</span>
                                <button
                                  onClick={() => {
                                    setCurrentOrder(prev => prev.filter((_, i) => i !== index));
                                  }}
                                  className="text-red-500 hover:text-red-700 text-xs"
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <div className="flex justify-between font-medium mb-3">
                            <span>Total:</span>
                            <span>${formatPrice(currentOrder.reduce((sum, item) => sum + (typeof item.price === 'number' ? item.price : parseFloat(item.price.toString())), 0))}</span>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setCurrentOrder([])}
                              className="flex-1 bg-gray-500 text-white px-3 py-2 rounded-md text-sm hover:bg-gray-600 transition-colors"
                            >
                              Clear Order
                            </button>
                            <button
                              onClick={() => {
                                const orderMessage = `I'd like to order:\n${currentOrder.map(item => `• ${item.name} - $${formatPrice(item.price)}`).join('\n')}\n\nTotal: $${formatPrice(currentOrder.reduce((sum, item) => sum + (typeof item.price === 'number' ? item.price : parseFloat(item.price.toString())), 0))}`;
                                setInputValue(orderMessage);
                                setShowMenuSidebar(false);
                              }}
                              className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors"
                            >
                              🍽️ Send to Waiter
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }

    // Chat Interface (existing code)
    return (
      <div className={`mobile-vh-fix flex flex-col bg-white ${className} overflow-hidden`}>
        {/* Mobile Restaurant Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0 sticky top-0 z-20">
          <h1 className="text-lg font-semibold text-gray-900 text-center">{restaurantName}</h1>
          {tableNumber && (
            <p className="text-sm text-gray-500 text-center">Table {tableNumber}</p>
          )}
        </div>

        {/* Mobile Character Header - Only show when not floating */}
        {!isCharacterFloating && (
          <div className="bg-gray-100 py-6 px-6 flex flex-col items-center justify-center">
            <RiveWaiterCharacter
              restaurantId={restaurantId}
              personality={personality}
              waiterName={waiterSettings?.waiterName || waiterName}
              className="w-32 h-32"
              showNameBadge={false}
              showGlassEffect={false}
              showGlow={false}
              onLoadComplete={() => console.log('Character loaded!')}
              onError={(error) => console.error('Character error:', error)}
            />
          </div>
        )}

        {/* Floating Character - Show when typing started */}
        <AnimatePresence>
          {isCharacterFloating && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              drag
              dragMomentum={false}
              dragElastic={0.1}
              dragConstraints={{
                top: 80,
                left: 10,
                right: typeof window !== 'undefined' ? window.innerWidth - 120 : 300,
                bottom: typeof window !== 'undefined' ? window.innerHeight - 120 : 600,
              }}
              className="fixed top-20 right-4 w-24 h-24 bg-gray-100 rounded-full shadow-lg z-30 cursor-move overflow-hidden flex items-center justify-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="w-20 h-20 flex items-center justify-center">
                <RiveWaiterCharacter
                  restaurantId={restaurantId}
                  personality={personality}
                  waiterName={waiterSettings?.waiterName || waiterName}
                  className="w-full h-full"
                  showNameBadge={false}
                  showGlassEffect={false}
                  showGlow={false}
                  onLoadComplete={() => console.log('Character loaded!')}
                  onError={(error) => console.error('Character error:', error)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Messages */}
        <div className="flex-1 overflow-y-auto p-4 chat-messages-scroll min-h-0">
          {/* Welcome Message at Top - Only show when it's the only message */}
          {conversation.length === 1 && conversation[0]?.role === "assistant" && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4"
            >
              <div className="bg-gray-100 rounded-2xl px-4 py-3 text-left">
                <p className="text-sm text-gray-900">{conversation[0].content}</p>
              </div>
            </motion.div>
          )}

          <AnimatePresence>
            {conversation.length > 1 && conversation.slice(1).map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mb-4 ${message.role === "user" ? "text-right" : "text-left"}`}
              >
                <div
                  className={`inline-block max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                </div>
                
                {/* Menu Cards for Mobile */}
                {message.menuCards && message.menuCards.items.length > 0 && (
                  <div className="mt-3">
                    <div className="flex space-x-3 overflow-x-auto pb-2">
                      {message.menuCards.items.slice(0, 3).map((item) => (
                        <div
                          key={item.id}
                          className="flex-shrink-0 w-32 bg-white rounded-lg shadow-sm border border-gray-200 p-3 text-center"
                          onClick={() => addToOrder(item)}
                        >
                          <div className="w-16 h-16 mx-auto mb-2 bg-gray-100 rounded-full flex items-center justify-center">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-full h-full object-cover rounded-full"
                              />
                            ) : (
                              <span className="text-2xl">🍽️</span>
                            )}
                          </div>
                          <h4 className="font-medium text-xs text-gray-900 mb-1 line-clamp-1">
                            {item.name}
                          </h4>
                          <p className="text-xs font-semibold text-gray-900">
                            ${(typeof item.price === 'number' ? item.price : parseFloat(item.price.toString())).toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4"
            >
              <div className="inline-block bg-gray-100 rounded-2xl px-4 py-3">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                  </div>
                  <span className="text-xs text-gray-600">{waiterName} is typing...</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Action Confirmation Dialogs */}
          <AnimatePresence>
            {pendingActions.map((action) => (
              <ActionConfirmationDialog
                key={action.id}
                action={action}
                onConfirm={handleActionConfirm}
                onDecline={handleActionDecline}
                onModify={handleActionModify}
                onCustomAction={handleCustomAction}
              />
            ))}
          </AnimatePresence>

          {/* Quick Action Buttons - Mobile - Show after initial message */}
          {!awaitingConfirmation && conversation.length === 1 && conversation[0]?.role === "assistant" && (
            <div className="px-4 mb-4">
              <QuickActionButtons
                actions={orderQuickActions}
                onActionClick={handleQuickAction}
                title="Quick Actions"
                maxVisible={3}
              />
            </div>
          )}

          {/* Quick Action Buttons for ongoing conversations - Mobile */}
          {!awaitingConfirmation && conversation.length > 1 && (
            <div className="px-4 mb-4">
              <QuickActionButtons
                actions={orderQuickActions}
                onActionClick={handleQuickAction}
                title="Quick Actions"
                maxVisible={3}
              />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Mobile Input */}
        <div className="bg-white border-t border-gray-200 p-4 flex-shrink-0 sticky bottom-0 z-20">
          <div className="flex space-x-3">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              onFocus={() => {
                console.log('🎈 Input focused - floating character');
                setIsCharacterFloating(true);
              }}
              placeholder="Message"
              className="flex-1 bg-gray-100 text-gray-900 placeholder-gray-500 rounded-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <motion.button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || sendMessageMutation.isPending}
              className="bg-black text-white px-6 py-3 rounded-full font-medium disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Send
            </motion.button>
          </div>
        </div>

        {/* Mobile Menu Button - Draggable */}
        <motion.button
          onClick={toggleMenuSidebar}
          drag
          dragMomentum={false}
          dragElastic={0.1}
          dragConstraints={{
            top: 80,
            left: 10,
            right: typeof window !== 'undefined' ? window.innerWidth - 80 : 300,
            bottom: typeof window !== 'undefined' ? window.innerHeight - 80 : 600,
          }}
          className="fixed top-20 left-4 bg-blue-600 text-white p-3 rounded-full shadow-lg z-40 cursor-move"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          📋
        </motion.button>

        {/* Menu Sidebar for Chat Interface */}
        <AnimatePresence>
          {showMenuSidebar && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setShowMenuSidebar(false)}
            >
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">Menu</h2>
                    <button
                      onClick={() => setShowMenuSidebar(false)}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <span className="text-gray-500 text-xl">×</span>
                    </button>
                  </div>

                  {/* Menu Items */}
                  <div className="flex-1 overflow-y-auto p-4">
                    {menuItems.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="text-gray-400 text-4xl mb-2">🍽️</div>
                        <p className="text-gray-500">No menu items available</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {Object.entries(
                          menuItems.reduce((acc, item) => {
                            const category = item.category || 'Other';
                            if (!acc[category]) acc[category] = [];
                            acc[category].push(item);
                            return acc;
                          }, {} as Record<string, typeof menuItems>)
                        ).map(([category, items]) => (
                          <div key={category}>
                            <h3 className="text-lg font-medium text-gray-900 mb-2 border-b border-gray-200 pb-1">
                              {category}
                            </h3>
                            <div className="space-y-3">
                              {items.map((item) => (
                                <div
                                  key={item.id}
                                  className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors cursor-pointer"
                                  onClick={() => addToOrder(item)}
                                >
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <h4 className="font-medium text-gray-900">{item.name}</h4>
                                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                        {item.description}
                                      </p>
                                    </div>
                                    <div className="ml-3 text-right">
                                      <div className="font-semibold text-gray-900">
                                        ${formatPrice(item.price)}
                                      </div>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          addToOrder(item);
                                        }}
                                        className="mt-1 bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700 transition-colors"
                                      >
                                        Add
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Current Order Summary */}
                  {currentOrder.length > 0 && (
                    <div className="border-t border-gray-200 p-4">
                      <h3 className="font-medium text-gray-900 mb-2">Current Order ({currentOrder.length} items)</h3>
                      <div className="space-y-1 max-h-20 overflow-y-auto">
                        {currentOrder.map((item, index) => (
                          <div key={index} className="flex justify-between items-center text-sm">
                            <span className="text-gray-600 flex-1">{item.name}</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-900">${item.price.toFixed(2)}</span>
                              <button
                                onClick={() => {
                                  setCurrentOrder(prev => prev.filter((_, i) => i !== index));
                                }}
                                className="text-red-500 hover:text-red-700 text-xs"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <div className="flex justify-between font-medium mb-3">
                          <span>Total:</span>
                          <span>${currentOrder.reduce((sum, item) => sum + item.price, 0).toFixed(2)}</span>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setCurrentOrder([])}
                            className="flex-1 bg-gray-500 text-white px-3 py-2 rounded-md text-sm hover:bg-gray-600 transition-colors"
                          >
                            Clear Order
                          </button>
                          <button
                            onClick={() => {
                              const orderMessage = `I'd like to order:\n${currentOrder.map(item => `• ${item.name} - $${item.price.toFixed(2)}`).join('\n')}\n\nTotal: $${currentOrder.reduce((sum, item) => sum + item.price, 0).toFixed(2)}`;
                              setInputValue(orderMessage);
                              setShowMenuSidebar(false);
                            }}
                            className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors"
                          >
                            🍽️ Send to Waiter
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className={`h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 ${className}`}>
      {/* Menu Sidebar */}
      <AnimatePresence>
        {showMenuSidebar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setShowMenuSidebar(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 h-full w-96 bg-white shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Menu</h2>
                  <button
                    onClick={() => setShowMenuSidebar(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <span className="text-gray-500 text-xl">×</span>
                  </button>
                </div>

                {/* Menu Items */}
                <div className="flex-1 overflow-y-auto p-4">
                  {menuItems.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-gray-400 text-4xl mb-2">🍽️</div>
                      <p className="text-gray-500">No menu items available</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Group by category */}
                      {Object.entries(
                        menuItems.reduce((acc, item) => {
                          const category = item.category || 'Other';
                          if (!acc[category]) acc[category] = [];
                          acc[category].push(item);
                          return acc;
                        }, {} as Record<string, typeof menuItems>)
                      ).map(([category, items]) => (
                        <div key={category}>
                          <h3 className="text-lg font-medium text-gray-900 mb-2 border-b border-gray-200 pb-1">
                            {category}
                          </h3>
                          <div className="space-y-3">
                            {items.map((item) => (
                              <div
                                key={item.id}
                                className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors cursor-pointer"
                                onClick={() => addToOrder(item)}
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <h4 className="font-medium text-gray-900">{item.name}</h4>
                                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                      {item.description}
                                    </p>
                                    {item.dietaryTags && item.dietaryTags.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-2">
                                        {item.dietaryTags.map((tag) => (
                                          <span
                                            key={tag.id}
                                            className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                                          >
                                            {tag.value}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  <div className="ml-3 text-right">
                                    <div className="font-semibold text-gray-900">
                                      ${item.price.toFixed(2)}
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        addToOrder(item);
                                      }}
                                      className="mt-1 bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700 transition-colors"
                                    >
                                      Add
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Current Order Summary */}
                {currentOrder.length > 0 && (
                  <div className="border-t border-gray-200 p-4">
                    <h3 className="font-medium text-gray-900 mb-2">Current Order ({currentOrder.length} items)</h3>
                    <div className="space-y-1 max-h-20 overflow-y-auto">
                      {currentOrder.map((item, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span className="text-gray-600 flex-1">{item.name}</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-900">${item.price.toFixed(2)}</span>
                            <button
                              onClick={() => {
                                setCurrentOrder(prev => prev.filter((_, i) => i !== index));
                              }}
                              className="text-red-500 hover:text-red-700 text-xs"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <div className="flex justify-between font-medium mb-3">
                        <span>Total:</span>
                        <span>${currentOrder.reduce((sum, item) => sum + item.price, 0).toFixed(2)}</span>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setCurrentOrder([])}
                          className="flex-1 bg-gray-500 text-white px-3 py-2 rounded-md text-sm hover:bg-gray-600 transition-colors"
                        >
                          Clear Order
                        </button>
                        <button
                          onClick={() => {
                            const orderMessage = `I'd like to order:\n${currentOrder.map(item => `• ${item.name} - $${item.price.toFixed(2)}`).join('\n')}\n\nTotal: $${currentOrder.reduce((sum, item) => sum + item.price, 0).toFixed(2)}`;
                            setInputValue(orderMessage);
                            setShowMenuSidebar(false);
                          }}
                          className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors"
                        >
                          🍽️ Send to Waiter
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Character & Chat Section */}
      <div className="flex-1 flex max-w-full">
        {/* Character Display */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="w-80 flex-shrink-0 bg-slate-900 flex items-center justify-center"
        >
          <div className="w-64 h-64 flex items-center justify-center">
            <RiveWaiterCharacter
              restaurantId={restaurantId}
              personality={personality}
              waiterName={waiterSettings?.waiterName || waiterName}
              className="w-full h-full"
              onLoadComplete={() => console.log('Character loaded!')}
              onError={(error) => console.error('Character error:', error)}
            />
          </div>
        </motion.div>

        {/* Chat Messages */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="flex-1 flex flex-col bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl m-4 overflow-hidden min-h-0"
          style={{
            height: 'calc(100vh - 2rem)', // Full height minus margins
            maxHeight: 'calc(100vh - 2rem)',
            minWidth: 0 // Ensure flex item can shrink
          }}
        >
          {/* Desktop Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-lg">🍽️</span>
              </div>
              <div>
                <h1 className="text-white font-semibold text-xl">{restaurantName}</h1>
                {tableNumber && (
                  <p className="text-white/60 text-sm">Table {tableNumber}</p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <motion.button
                onClick={() => setShowSessionPanel(!showSessionPanel)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                👤 Session
              </motion.button>
              <motion.button
                onClick={toggleMenuSidebar}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                📋 Menu
              </motion.button>
            </div>
          </div>

          {/* Order Notification */}
          {orderNotification && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mx-6 mt-4 bg-green-600 text-white px-4 py-3 rounded-xl shadow-lg"
            >
              {orderNotification}
            </motion.div>
          )}

          {/* Messages Container */}
          <div 
            className="flex-1 overflow-y-auto overflow-x-hidden p-6 chat-messages-scroll relative min-h-0 max-h-full" 
            style={{ 
              scrollBehavior: 'smooth',
              height: '0', // Force flex item to respect container height
              flexGrow: 1,
              flexShrink: 1,
              flexBasis: '0%'
            }}
          >
            {/* Welcome Message for Desktop - Only show when it's the only message */}
            {conversation.length === 1 && conversation[0]?.role === "assistant" && (
              <div className="flex items-start justify-start mb-6">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-6 py-4 text-left shadow-lg max-w-md"
                >
                  <p className="text-white/90 text-sm">{conversation[0].content}</p>
                </motion.div>
              </div>
            )}

            {/* Customer Session Panel */}
            {showSessionPanel && tableNumber && (
              <div className="mb-6">
                <CustomerSessionPanel
                  restaurantId={restaurantId}
                  tableNumber={tableNumber}
                  refreshTrigger={sessionRefreshTrigger}
                  onSessionUpdate={(session) => {
                    setCurrentSession(session);
                    console.log('Session updated:', session);
                  }}
                  className="max-w-md"
                />
              </div>
            )}

            {/* Quick Action Buttons - Desktop - Show only when not awaiting confirmation and conversation started */}
            {!awaitingConfirmation && conversation.length === 1 && conversation[0]?.role === "assistant" && (
              <div className="mb-6">
                <QuickActionButtons
                  actions={orderQuickActions}
                  onActionClick={handleQuickAction}
                  title="Quick Actions"
                  maxVisible={4}
                  className="bg-white/10 backdrop-blur-sm border-white/20"
                />
              </div>
            )}

            <AnimatePresence>
              {conversation.length > 1 && conversation.slice(1).map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mb-4 ${message.role === "user" ? "text-right" : "text-left"}`}
                >
                  <div
                    className={`inline-block max-w-[70%] rounded-2xl px-4 py-3 ${
                      message.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-white/10 backdrop-blur-sm border border-white/20 text-white/90"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>
                  
                  {/* Menu Cards for Desktop */}
                  {message.menuCards && message.menuCards.items.length > 0 && (
                    <div className="mt-3">
                      <div className="flex space-x-3 overflow-x-auto pb-2">
                        {message.menuCards.items.slice(0, 3).map((item) => (
                          <div
                            key={item.id}
                            className="flex-shrink-0 w-40 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-3 text-center cursor-pointer hover:bg-white/20 transition-colors"
                            onClick={() => addToOrder(item)}
                          >
                            <div className="w-16 h-16 mx-auto mb-2 bg-white/20 rounded-full flex items-center justify-center">
                              {item.imageUrl ? (
                                <img
                                  src={item.imageUrl}
                                  alt={item.name}
                                  className="w-full h-full object-cover rounded-full"
                                />
                              ) : (
                                <span className="text-2xl">🍽️</span>
                              )}
                            </div>
                            <h4 className="font-medium text-xs text-white/90 mb-1 line-clamp-1">
                              {item.name}
                            </h4>
                            <p className="text-xs font-semibold text-white/90">
                              ${item.price.toFixed(2)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4"
              >
                <div className="inline-block bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce delay-100" />
                      <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce delay-200" />
                    </div>
                    <span className="text-xs text-white/60">{waiterName} is typing...</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Action Confirmation Dialogs - Desktop */}
            <AnimatePresence>
              {pendingActions.map((action) => (
                <ActionConfirmationDialog
                  key={action.id}
                  action={action}
                  onConfirm={handleActionConfirm}
                  onDecline={handleActionDecline}
                  onModify={handleActionModify}
                  onCustomAction={handleCustomAction}
                  className="bg-gradient-to-br from-blue-50/90 to-indigo-50/90 backdrop-blur-sm border-blue-200/50"
                />
              ))}
            </AnimatePresence>

            {/* Quick Action Buttons for ongoing conversations - Desktop */}
            {!awaitingConfirmation && conversation.length > 1 && (
              <div className="mt-4">
                <QuickActionButtons
                  actions={orderQuickActions}
                  onActionClick={handleQuickAction}
                  title="Quick Actions"
                  maxVisible={4}
                  className="bg-white/10 backdrop-blur-sm border-white/20"
                />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Desktop Input */}
          <div className="p-6 border-t border-white/10">
            <div className="flex space-x-3">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                onFocus={() => {
                  console.log('🎈 Input focused - floating character');
                  setIsCharacterFloating(true);
                }}
                placeholder={`Message ${waiterName}...`}
                className="flex-1 bg-white/5 text-white placeholder-white/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-white/10"
              />
              <motion.button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || sendMessageMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-medium transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Send
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ModernChatContainer;