class FuturisticWaiterChat {
    constructor() {
        // DOM Elements
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.chatMessages = document.getElementById('chatMessages');
        this.riveContainer = document.getElementById('riveContainer');
        this.riveCanvas = document.getElementById('riveCanvas');
        this.characterLoading = document.getElementById('characterLoading');
        this.characterError = document.getElementById('characterError');
        this.menuButton = document.getElementById('menuButton');
        
        // Rive Properties
        this.riveInstance = null;
        this.riveLoaded = false;
        this.currentState = 'idle';
        this.availableStates = [];
        
        // Chat Properties
        this.responses = this.initializeResponses();
        this.isTyping = false;
        
        // Initialize
        this.init();
        this.loadRiveCharacter();
    }
    
    init() {
        // Event Listeners
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        this.menuButton.addEventListener('click', () => this.showQuickOptions());
        
        // Resize canvas when window resizes
        window.addEventListener('resize', () => this.resizeRiveCanvas());
        
        // Add some visual flair
        this.addWelcomeMessage();
    }
    
    async loadRiveCharacter() {
        try {
            console.log('🚀 Loading Rive character...');
            
            // Show loading state
            this.showLoadingState();
            
            // Initialize Rive instance
            this.riveInstance = new rive.Rive({
                src: '/assets/animations/rive/interactive_avatar.riv',
                canvas: this.riveCanvas,
                autoplay: true,
                stateMachines: ['State Machine 1'], // Common default name
                fit: rive.Fit.Contain,
                alignment: rive.Alignment.Center,
                onLoad: () => {
                    console.log('✅ Rive character loaded successfully!');
                    this.onRiveLoaded();
                },
                onLoadError: (error) => {
                    console.error('❌ Rive loading error:', error);
                    this.onRiveError(error);
                },
                onStateChange: (event) => {
                    console.log('🎭 State changed:', event);
                    this.onStateChange(event);
                }
            });
            
        } catch (error) {
            console.error('❌ Failed to initialize Rive:', error);
            this.onRiveError(error);
        }
    }
    
    onRiveLoaded() {
        this.riveLoaded = true;
        this.hideLoadingState();
        this.resizeRiveCanvas();
        this.discoverAvailableStates();
        this.addCharacterStateAnimation('greeting');
        
        // Add welcome animation after a brief delay
        setTimeout(() => {
            this.triggerCharacterState('greeting');
        }, 500);
    }
    
    onRiveError(error) {
        console.error('Rive Error:', error);
        this.hideLoadingState();
        this.showErrorState();
    }
    
    discoverAvailableStates() {
        // Try to discover available states from the Rive instance
        try {
            if (this.riveInstance && this.riveInstance.stateMachineInputs) {
                const inputs = this.riveInstance.stateMachineInputs();
                console.log('🎯 Available Rive inputs:', inputs);
                
                // Common state names to try
                const commonStates = [
                    'idle', 'greeting', 'hello', 'wave',
                    'serving', 'food', 'order', 'meal',
                    'dessert', 'coffee', 'sweet', 'cake',
                    'talking', 'thinking', 'happy', 'smile'
                ];
                
                this.availableStates = commonStates;
                console.log('🎭 Using common states:', this.availableStates);
            }
        } catch (error) {
            console.warn('Could not discover states:', error);
            this.availableStates = ['idle', 'greeting', 'serving', 'dessert'];
        }
    }
    
    triggerCharacterState(stateName) {
        if (!this.riveLoaded || !this.riveInstance) {
            console.warn('⚠️ Rive not loaded, cannot trigger state:', stateName);
            return false;
        }
        
        try {
            // Try to find and trigger the state
            const inputs = this.riveInstance.stateMachineInputs();
            if (inputs) {
                // Look for boolean triggers first
                const trigger = inputs.find(input => 
                    input.name.toLowerCase().includes(stateName.toLowerCase()) && 
                    input.type === 'boolean'
                );
                
                if (trigger) {
                    trigger.fire();
                    console.log('🎬 Triggered state:', stateName);
                    this.currentState = stateName;
                    this.addCharacterStateAnimation(stateName);
                    return true;
                }
                
                // Try number inputs
                const numberInput = inputs.find(input => 
                    input.name.toLowerCase().includes('state') && 
                    input.type === 'number'
                );
                
                if (numberInput) {
                    const stateMap = {
                        'greeting': 1,
                        'serving': 2, 
                        'dessert': 3,
                        'idle': 0
                    };
                    
                    const stateValue = stateMap[stateName] || 0;
                    numberInput.value = stateValue;
                    console.log('🔢 Set state number:', stateName, stateValue);
                    this.currentState = stateName;
                    this.addCharacterStateAnimation(stateName);
                    return true;
                }
            }
            
            console.log('🤷 No matching input found for state:', stateName);
            this.addCharacterStateAnimation(stateName); // Still add visual effect
            return false;
            
        } catch (error) {
            console.error('❌ Error triggering state:', error);
            return false;
        }
    }
    
    addCharacterStateAnimation(stateName) {
        // Add CSS animation class based on state
        this.riveContainer.className = 'rive-character-container';
        this.riveContainer.classList.add(`character-state-${stateName}`);
        
        // Remove the class after animation
        setTimeout(() => {
            this.riveContainer.classList.remove(`character-state-${stateName}`);
        }, 3000);
    }
    
    resizeRiveCanvas() {
        if (this.riveInstance && this.riveLoaded) {
            try {
                this.riveInstance.resizeDrawingSurfaceToCanvas();
            } catch (error) {
                console.warn('Could not resize canvas:', error);
            }
        }
    }
    
    showLoadingState() {
        this.characterLoading.style.display = 'block';
        this.characterError.style.display = 'none';
        this.riveCanvas.style.opacity = '0.3';
    }
    
    hideLoadingState() {
        this.characterLoading.style.display = 'none';
        this.riveCanvas.style.opacity = '1';
    }
    
    showErrorState() {
        this.characterError.style.display = 'block';
        this.characterLoading.style.display = 'none';
        this.riveCanvas.style.opacity = '0.1';
    }
    
    retryRiveLoad() {
        this.characterError.style.display = 'none';
        this.riveCanvas.style.opacity = '1';
        this.loadRiveCharacter();
    }
    
    initializeResponses() {
        return {
            greetings: [
                "Welcome to the future of dining! ✨ How may I assist you today?",
                "Greetings, valued guest! 🤖 I'm your AI waiter, ready to serve!",
                "Hello! Your futuristic dining experience begins now! 🚀"
            ],
            menu: [
                "Our quantum kitchen offers exquisite dishes! 🍽️ Would you like to explore our molecular gastronomy section?",
                "I recommend our signature dishes prepared with precision AI algorithms! 🥩✨",
                "Our menu features sustainably-sourced ingredients prepared with cutting-edge culinary technology! 🌟"
            ],
            food: [
                "Excellent choice! 🎯 Our quantum chefs will prepare this masterpiece for you!",
                "That's one of our most popular AI-recommended dishes! You'll love the precision flavors! 🤖👨‍🍳",
                "Superb selection! This pairs perfectly with our synthesized wine collection! 🍷✨"
            ],
            dessert: [
                "Don't miss our molecular desserts! 🍰 They're crafted using nanotechnology for the perfect texture!",
                "Our dessert laboratory has created some amazing sweet innovations! ☕🧬",
                "Would you like to experience our levitating tiramisu? It's literally out of this world! 🛸🍮"
            ],
            technology: [
                "I'm powered by advanced AI algorithms to provide you the best service! 🤖⚡",
                "This restaurant uses quantum computing to optimize every aspect of your dining experience! 💻✨",
                "We employ holographic displays and molecular gastronomy for the ultimate futuristic meal! 🌈🔬"
            ],
            default: [
                "I'm here to make your dining experience extraordinary! 🌟",
                "How else may I enhance your futuristic dining journey? 🚀",
                "Your wish is my command protocol! What can I process for you? 🤖💫"
            ]
        };
    }
    
    addWelcomeMessage() {
        setTimeout(() => {
            this.addMessage("🚀 Welcome to the Quantum Bistro! I'm your AI waiter assistant. How may I enhance your dining experience today?", 'bot');
        }, 1000);
    }
    
    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message || this.isTyping) return;
        
        // Add user message
        this.addMessage(message, 'user');
        this.messageInput.value = '';
        
        // Set typing state
        this.isTyping = true;
        this.addTypingIndicator();
        
        // Generate response with delay for realism
        setTimeout(async () => {
            const response = this.generateResponse(message);
            this.removeTypingIndicator();
            this.addMessage(response.text, 'bot');
            
            // Trigger character state
            await this.triggerCharacterState(response.state);
            
            this.isTyping = false;
        }, 1200 + Math.random() * 800); // Random delay for human-like response
    }
    
    generateResponse(message) {
        const lowerMessage = message.toLowerCase();
        
        // Enhanced keyword detection with context
        if (this.containsWords(lowerMessage, ['hello', 'hi', 'hey', 'greetings', 'welcome'])) {
            return {
                text: this.getRandomResponse('greetings'),
                state: 'greeting'
            };
        } else if (this.containsWords(lowerMessage, ['menu', 'food', 'eat', 'order', 'hungry', 'dish'])) {
            return {
                text: this.getRandomResponse('menu'),
                state: 'serving'
            };
        } else if (this.containsWords(lowerMessage, ['steak', 'pasta', 'chicken', 'fish', 'pizza', 'burger', 'salad'])) {
            return {
                text: this.getRandomResponse('food'),
                state: 'serving'
            };
        } else if (this.containsWords(lowerMessage, ['dessert', 'cake', 'coffee', 'sweet', 'ice cream', 'chocolate'])) {
            return {
                text: this.getRandomResponse('dessert'),
                state: 'dessert'
            };
        } else if (this.containsWords(lowerMessage, ['ai', 'robot', 'technology', 'futuristic', 'quantum', 'tech'])) {
            return {
                text: this.getRandomResponse('technology'),
                state: 'greeting'
            };
        } else {
            return {
                text: this.getRandomResponse('default'),
                state: 'idle'
            };
        }
    }
    
    containsWords(text, words) {
        return words.some(word => text.includes(word));
    }
    
    getRandomResponse(category) {
        const responses = this.responses[category];
        return responses[Math.floor(Math.random() * responses.length)];
    }
    
    addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'message-bubble';
        
        // Add some sparkle to bot messages
        if (sender === 'bot') {
            bubbleDiv.innerHTML = text;
        } else {
            bubbleDiv.textContent = text;
        }
        
        messageDiv.appendChild(bubbleDiv);
        this.chatMessages.appendChild(messageDiv);
        
        // Smooth scroll to bottom
        this.smoothScrollToBottom();
        
        // Add entrance animation
        setTimeout(() => {
            messageDiv.style.opacity = '1';
            messageDiv.style.transform = 'translateY(0)';
        }, 50);
        
        // Set initial state for animation
        messageDiv.style.opacity = '0';
        messageDiv.style.transform = 'translateY(20px)';
        messageDiv.style.transition = 'all 0.3s ease';
    }
    
    addTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot-message typing-indicator';
        typingDiv.id = 'typingIndicator';
        
        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'message-bubble';
        bubbleDiv.innerHTML = `
            <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;
        
        typingDiv.appendChild(bubbleDiv);
        this.chatMessages.appendChild(typingDiv);
        this.smoothScrollToBottom();
    }
    
    removeTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) {
            indicator.remove();
        }
    }
    
    smoothScrollToBottom() {
        this.chatMessages.scrollTo({
            top: this.chatMessages.scrollHeight,
            behavior: 'smooth'
        });
    }
    
    showQuickOptions() {
        const options = [
            "🍽️ Show me the quantum menu",
            "🤖 Tell me about your AI technology", 
            "🍰 What desserts do you recommend?",
            "🥩 What's your signature dish?",
            "☕ I'd like something to drink"
        ];
        
        const optionsHtml = options.map(option => 
            `<button class="quick-option" onclick="waiterChat.selectQuickOption('${option}')">${option}</button>`
        ).join('');
        
        this.addMessage(`Here are some popular requests: <div class="quick-options">${optionsHtml}</div>`, 'bot');
    }
    
    selectQuickOption(option) {
        // Remove the emoji and send the clean message
        const cleanOption = option.replace(/^[^\s]+\s/, '');
        this.messageInput.value = cleanOption;
        this.sendMessage();
    }
    
    onStateChange(event) {
        console.log('🎭 Rive state change detected:', event);
        // Handle any additional state change logic here
    }
    
    // Cleanup method
    cleanup() {
        if (this.riveInstance) {
            this.riveInstance.cleanup();
            this.riveInstance = null;
        }
    }
}

// Add typing indicator CSS
const typingIndicatorStyle = document.createElement('style');
typingIndicatorStyle.textContent = `
    .typing-dots {
        display: flex;
        gap: 4px;
        padding: 8px 0;
    }
    
    .typing-dots span {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: rgba(120, 219, 255, 0.8);
        animation: typingBounce 1.4s infinite ease-in-out both;
    }
    
    .typing-dots span:nth-child(1) { animation-delay: -0.32s; }
    .typing-dots span:nth-child(2) { animation-delay: -0.16s; }
    
    @keyframes typingBounce {
        0%, 80%, 100% {
            transform: scale(0);
            opacity: 0.5;
        }
        40% {
            transform: scale(1);
            opacity: 1;
        }
    }
`;
document.head.appendChild(typingIndicatorStyle);

// Global error handler for Rive
window.addEventListener('error', (event) => {
    if (event.filename && event.filename.includes('rive')) {
        console.error('🚨 Rive runtime error:', event.error);
    }
});

// Initialize the futuristic waiter chat when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Add a small delay to ensure all resources are loaded
    setTimeout(() => {
        window.waiterChat = new FuturisticWaiterChat();
        console.log('🚀 Futuristic Waiter Chat initialized!');
    }, 100);
});

// Expose retry function globally for error button
window.retryRiveLoad = () => {
    if (window.waiterChat) {
        window.waiterChat.retryRiveLoad();
    }
}; 