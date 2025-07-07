# 🧪 **Manual Testing Checklist - AI-Driven Action Detection System**

## 🎯 **Comprehensive Testing Guide**

---

## 📋 **Phase 1: Basic AI Function Testing**

### **🍕 Order Placement Testing**
- [x] **Simple Order**: "I want a pizza"
- [x] **Quantity Order**: "Give me 2 salads please" 
- [x] **Specific Item**: "I'll take the Margherita Pizza"
- [x] **Multiple Items**: "I want a pizza and a salad"
- [x] **Complex Order**: "Can I get 2 Margherita pizzas and 1 Caesar salad"

### **🔄 Order Modification Testing**
- [ ] **Add Items**: "Add garlic bread to my order"
- [ ] **Remove Items**: "Remove the salad from my order"
- [ ] **Change Quantity**: "Make that 3 pizzas instead of 2"
- [ ] **Replace Items**: "Actually, change the pizza to pepperoni"

### **💡 Recommendation Testing**
- [ ] **General Request**: "What do you recommend?"
- [ ] **Dietary Preferences**: "What's good for vegetarians?"
- [ ] **Popular Items**: "What's your most popular dish?"
- [ ] **Price-based**: "What's something affordable?"

---

## 📋 **Phase 2: Conversation Flow Testing**

### **🗣️ Natural Language Testing**
- [ ] **Casual Language**: "Hey, what's good here?"
- [ ] **Polite Requests**: "Could I please have a pizza?"
- [ ] **Informal Speech**: "Gimme something spicy"
- [ ] **Questions**: "Do you have vegetarian options?"

### **❓ Information Requests**
- [ ] **Menu Questions**: "What ingredients are in the Caesar salad?"
- [ ] **Price Inquiries**: "How much is the pizza?"
- [ ] **Availability**: "Do you have any specials today?"
- [ ] **Dietary Info**: "Is this gluten-free?"

### **📋 Order Status Testing**
- [ ] **Check Order**: "What's in my order?"
- [ ] **Order Status**: "How's my order coming?"
- [ ] **Order Total**: "What's my total?"
- [ ] **Session Orders**: "Show me my orders"

---

## 📋 **Phase 3: Edge Cases & Error Handling**

### **🚫 Invalid Requests**
- [ ] **Non-existent Items**: "I want a hamburger" (not on menu)
- [ ] **Unclear Requests**: "I want something"
- [ ] **Gibberish**: "asdfgh jkl"
- [ ] **Empty Messages**: Send empty message

### **🔄 Fallback System Testing**
- [ ] **Complex Requests**: Very long, complex orders
- [ ] **Ambiguous Items**: "I want the special"
- [ ] **Multiple Interpretations**: "I want a large one"

### **⚠️ Error Recovery**
- [ ] **Correction Attempts**: "No, I meant pepperoni pizza"
- [ ] **Clarification**: "What did you mean by that?"
- [ ] **Start Over**: "Let me start my order over"

---

## 📋 **Phase 4: Session Management Testing**

### **👤 Customer Session Flow**
- [ ] **Session Start**: First message creates session
- [ ] **Customer Name**: AI asks for customer name
- [ ] **Name Setting**: "My name is John"
- [ ] **Session Persistence**: Refresh page, continue conversation
- [ ] **Session Ending**: Complete order and end session

### **📊 Session Data**
- [ ] **Session Panel**: Click session button in chat header
- [ ] **Session Stats**: View duration, orders, total spent
- [ ] **Name Update**: Change customer name via session panel
- [ ] **Session History**: Multiple orders in same session

---

## 📋 **Phase 5: AI Analytics & Monitoring**

### **📊 Admin Dashboard Testing**
- [ ] **Access Dashboard**: Go to `/admin/dashboard`
- [ ] **AI Analytics Button**: Click "🧠 AI Analytics" button
- [ ] **Dashboard Load**: Verify AI analytics page loads
- [ ] **Real-time Data**: Check metrics display correctly

### **📈 Performance Monitoring**
- [ ] **Success Rate**: Monitor AI success percentage
- [ ] **Confidence Scores**: Check confidence levels
- [ ] **Response Times**: Verify response time tracking
- [ ] **Function Stats**: Review individual function performance

### **🔄 Time Range Testing**
- [ ] **1 Hour**: Select 1h time range
- [ ] **24 Hours**: Select 24h time range  
- [ ] **7 Days**: Select 7d time range
- [ ] **30 Days**: Select 30d time range
- [ ] **Auto Refresh**: Wait for 30-second auto refresh

---

## 📋 **Phase 6: Integration & UI Testing**

### **💻 Desktop Testing**
- [ ] **Layout**: Verify proper desktop layout
- [ ] **Quick Actions**: Check Quick Actions positioning
- [ ] **Chat Flow**: Test complete chat experience
- [ ] **Responsive**: Test different screen sizes

### **📱 Mobile Testing**
- [ ] **Mobile Layout**: Test on mobile device/emulator
- [ ] **Touch Interactions**: Tap buttons and inputs
- [ ] **Scrolling**: Verify smooth scrolling
- [ ] **Keyboard**: Test mobile keyboard interaction

### **🔄 Multi-tab Testing**
- [ ] **Multiple Tabs**: Open same restaurant in multiple tabs
- [ ] **Session Sync**: Verify session consistency
- [ ] **Order Sync**: Check order synchronization

---

## 📋 **Phase 7: Performance & Reliability**

### **⚡ Performance Testing**
- [ ] **Response Speed**: Measure AI response times
- [ ] **Multiple Users**: Test with multiple simultaneous sessions
- [ ] **Large Orders**: Test with many items in single order
- [ ] **Long Conversations**: Extended chat sessions

### **🔧 Reliability Testing**
- [ ] **Network Issues**: Test with poor connection
- [ ] **Page Refresh**: Refresh during conversation
- [ ] **Browser Back**: Use browser back button
- [ ] **Tab Close/Reopen**: Close and reopen tab

---

## 📋 **Critical Test Scenarios**

### **🎯 Priority Test Cases**
1. **"Give me 2 salads please"** - Should create proper order (not "#SALADS")
2. **Desktop Quick Actions** - Should display properly positioned
3. **Order Editing Flow** - Should be intuitive and clear
4. **Session Management** - Should track customer name and orders
5. **AI Analytics** - Should display real-time performance metrics

### **✅ Success Criteria**
- [ ] All orders process correctly without errors
- [ ] AI responses are relevant and helpful
- [ ] UI layout is clean and professional
- [ ] Session management works seamlessly
- [ ] Analytics dashboard shows meaningful data
- [ ] No console errors or crashes
- [ ] Fallback systems work when needed

---

## 🚨 **What to Watch For**

### **⚠️ Potential Issues**
- **TRPCClientError**: Menu item ID validation failures
- **Layout Problems**: Quick Actions or chat positioning
- **AI Confusion**: Inappropriate function calls
- **Session Issues**: Lost customer data or orders
- **Performance**: Slow AI response times

### **📝 Bug Reporting**
For any issues found:
1. **Screenshot** the problem
2. **Note** the exact user message that caused it
3. **Check** browser console for errors
4. **Document** steps to reproduce
5. **Test** if it happens consistently

---

## 🎉 **Testing Complete Checklist**

- [ ] **All basic AI functions work correctly**
- [ ] **Natural conversation flows smoothly** 
- [ ] **Error handling is graceful**
- [ ] **Session management is seamless**
- [ ] **Analytics dashboard is functional**
- [ ] **UI/UX is polished and professional**
- [ ] **Performance is acceptable**
- [ ] **No critical bugs found**

**🚀 Ready to launch when all checkboxes are complete!**