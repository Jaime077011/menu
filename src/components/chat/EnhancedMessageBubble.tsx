import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface EnhancedMessageBubbleProps {
  id: string;
  content: string;
  sender: 'user' | 'waiter';
  timestamp: Date;
  type?: 'text' | 'menu-items' | 'order-confirmation';
  metadata?: any;
  isDelivered?: boolean;
  isRead?: boolean;
  onReaction?: (messageId: string, reaction: string) => void;
  onQuickReply?: (reply: string) => void;
  className?: string;
}

const REACTIONS = ['👍', '❤️', '😊', '🤔', '👌', '🔥'];

const QUICK_REPLIES = [
  'Yes, please!',
  'No, thank you',
  'Tell me more',
  'What do you recommend?',
  'Add to order',
  'Show menu',
];

export const EnhancedMessageBubble: React.FC<EnhancedMessageBubbleProps> = ({
  id,
  content,
  sender,
  timestamp,
  type = 'text',
  metadata,
  isDelivered = true,
  isRead = false,
  onReaction,
  onQuickReply,
  className = '',
}) => {
  const [showReactions, setShowReactions] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [selectedReaction, setSelectedReaction] = useState<string | null>(null);

  const isUser = sender === 'user';
  const isWaiter = sender === 'waiter';

  const handleReaction = (reaction: string) => {
    setSelectedReaction(reaction);
    onReaction?.(id, reaction);
    setShowReactions(false);
  };

  const handleQuickReply = (reply: string) => {
    onQuickReply?.(reply);
    setShowQuickReplies(false);
  };

  const bubbleVariants = {
    initial: { 
      opacity: 0, 
      y: 20, 
      scale: 0.95,
      x: isUser ? 20 : -20 
    },
    animate: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      x: 0,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 300
      }
    },
    exit: { 
      opacity: 0, 
      y: -20, 
      scale: 0.95,
      transition: { duration: 0.2 }
    },
    hover: {
      scale: 1.02,
      transition: { duration: 0.2 }
    }
  };

  const reactionVariants = {
    initial: { scale: 0, opacity: 0 },
    animate: { 
      scale: 1, 
      opacity: 1,
      transition: {
        type: "spring",
        damping: 20,
        stiffness: 300
      }
    },
    exit: { scale: 0, opacity: 0 }
  };

  return (
    <motion.div
      variants={bubbleVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      whileHover="hover"
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} group ${className}`}
    >
      <div className={`relative max-w-[80%] ${isUser ? 'order-2' : 'order-1'}`}>
        {/* Message Bubble */}
        <motion.div
          className={`relative p-4 rounded-2xl backdrop-blur-sm ${
            isUser
              ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25'
              : 'bg-white/10 text-white border border-white/20 shadow-lg shadow-black/10'
          }`}
        >
          {/* Message Content */}
          <div className="relative z-10">
            {type === 'text' && (
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
            )}
            
            {type === 'menu-items' && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Menu Recommendations:</p>
                <div className="space-y-1">
                  {/* This would be populated with actual menu items */}
                  <p className="text-xs opacity-80">{content}</p>
                </div>
              </div>
            )}

            {type === 'order-confirmation' && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-green-400">✓</span>
                  <p className="text-sm font-medium">Order Confirmed</p>
                </div>
                <p className="text-xs opacity-80">{content}</p>
              </div>
            )}
          </div>

          {/* Message Status & Timestamp */}
          <div className={`flex items-center justify-between mt-2 text-xs ${
            isUser ? 'text-blue-100' : 'text-white/60'
          }`}>
            <span>
              {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            
            {isUser && (
              <div className="flex items-center space-x-1">
                {isDelivered && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-blue-200"
                  >
                    ✓
                  </motion.span>
                )}
                {isRead && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-blue-200"
                  >
                    ✓
                  </motion.span>
                )}
              </div>
            )}
          </div>

          {/* Reaction Badge */}
          <AnimatePresence>
            {selectedReaction && (
              <motion.div
                variants={reactionVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-white/20"
              >
                <span className="text-sm">{selectedReaction}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hover Actions */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              transition: { delay: 0.1 }
            }}
            className={`absolute top-2 opacity-0 group-hover:opacity-100 transition-opacity ${
              isUser ? '-left-12' : '-right-12'
            }`}
          >
            <div className="flex flex-col space-y-1">
              {/* Reaction Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowReactions(!showReactions)}
                className="w-8 h-8 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-colors"
              >
                😊
              </motion.button>

              {/* Quick Reply Button (only for waiter messages) */}
              {isWaiter && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowQuickReplies(!showQuickReplies)}
                  className="w-8 h-8 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-colors"
                >
                  ⚡
                </motion.button>
              )}
            </div>
          </motion.div>
        </motion.div>

        {/* Reactions Popup */}
        <AnimatePresence>
          {showReactions && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              className={`absolute top-full mt-2 ${
                isUser ? 'right-0' : 'left-0'
              } bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-2 shadow-xl z-20`}
            >
              <div className="flex space-x-1">
                {REACTIONS.map((reaction, index) => (
                  <motion.button
                    key={reaction}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleReaction(reaction)}
                    className="w-8 h-8 hover:bg-white/10 rounded-lg flex items-center justify-center transition-colors"
                  >
                    <span className="text-lg">{reaction}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Replies Popup */}
        <AnimatePresence>
          {showQuickReplies && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              className={`absolute top-full mt-2 ${
                isUser ? 'right-0' : 'left-0'
              } bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 shadow-xl z-20 min-w-[200px]`}
            >
              <div className="space-y-2">
                <p className="text-xs text-white/60 font-medium">Quick Replies:</p>
                <div className="grid grid-cols-1 gap-1">
                  {QUICK_REPLIES.map((reply, index) => (
                    <motion.button
                      key={reply}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.02, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleQuickReply(reply)}
                      className="text-left px-3 py-2 text-sm text-white/80 hover:text-white rounded-lg transition-colors"
                    >
                      {reply}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Avatar (for waiter messages) */}
      {isWaiter && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3 order-1"
        >
          🤖
        </motion.div>
      )}
    </motion.div>
  );
};

export default EnhancedMessageBubble;
