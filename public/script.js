/* ========================================
   BREEZELINE INTERIORS - INTERACTIVE JS
   ======================================== */

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Loaded - Initializing Breezeline');
    
    // ========================================
    // MOBILE MENU TOGGLE
    // ========================================
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');
    
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', function() {
            this.classList.toggle('active');
            navLinks.classList.toggle('active');
            
            if (navLinks.classList.contains('active')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        });
        
        const navItems = navLinks.querySelectorAll('a');
        navItems.forEach(item => {
            item.addEventListener('click', function() {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    }
    
    // ========================================
    // HERO SLIDESHOW
    // ========================================
    const slides = document.querySelectorAll('.hero-slide');
    const indicators = document.querySelectorAll('.indicator');
    let currentSlide = 0;
    let slideInterval;
    
    function showSlide(index) {
        slides.forEach(slide => slide.classList.remove('active'));
        indicators.forEach(indicator => indicator.classList.remove('active'));
        
        slides[index].classList.add('active');
        indicators[index].classList.add('active');
    }
    
    function nextSlide() {
        currentSlide = (currentSlide + 1) % slides.length;
        showSlide(currentSlide);
    }
    
    function startSlideshow() {
        slideInterval = setInterval(nextSlide, 5000);
    }
    
    function stopSlideshow() {
        clearInterval(slideInterval);
    }
    
    if (slides.length > 0) {
        startSlideshow();
        
        indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', function() {
                stopSlideshow();
                currentSlide = index;
                showSlide(currentSlide);
                startSlideshow();
            });
        });
        
        const hero = document.querySelector('.hero');
        if (hero) {
            hero.addEventListener('mouseenter', stopSlideshow);
            hero.addEventListener('mouseleave', startSlideshow);
        }
    }
    
    // ========================================
    // SCROLL ANIMATIONS
    // ========================================
    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const fadeInObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                fadeInObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    const fadeInUpObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                fadeInUpObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    const aboutSection = document.querySelector('.about-preview');
    if (aboutSection) {
        fadeInObserver.observe(aboutSection);
    }
    
    const workCards = document.querySelectorAll('.work-card');
    workCards.forEach(card => {
        fadeInUpObserver.observe(card);
    });
    
    // ========================================
    // NAVBAR SCROLL EFFECT
    // ========================================
    const header = document.querySelector('header');
    
    window.addEventListener('scroll', function() {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 50) {
            header.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.5)';
            header.style.background = 'rgba(0, 0, 0, 0.98)';
        } else {
            header.style.boxShadow = 'none';
            header.style.background = 'rgba(0, 0, 0, 0.95)';
        }
    });
    
    // ========================================
    // SMOOTH SCROLL FOR ANCHOR LINKS
    // ========================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href !== '#' && href !== '') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    const headerOffset = 80;
                    const elementPosition = target.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                    
                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
    
    // ========================================
    // WORK CARD HOVER EFFECT
    // ========================================
    const workCardsForHover = document.querySelectorAll('.work-card');
    
    workCardsForHover.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
            this.style.transition = 'transform 0.3s ease';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
    
    // ========================================
    // BUTTON RIPPLE EFFECT
    // ========================================
    const buttons = document.querySelectorAll('.btn');
    
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple');
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
    
    // ========================================
    // LAZY LOADING IMAGES
    // ========================================
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.src;
                    imageObserver.unobserve(img);
                }
            });
        });
        
        lazyImages.forEach(img => imageObserver.observe(img));
    }
    
    // ========================================
    // CHATBOT FUNCTIONALITY - COMPLETE FIX
    // ========================================
    console.log('Initializing Chatbot...');
    
    const chatbotToggle = document.getElementById('chatbot-toggle');
    const chatbotWidget = document.getElementById('chatbot-widget');
    const chatbotClose = document.getElementById('chatbot-close');
    const chatbotInput = document.getElementById('chatbot-input');
    const chatbotSend = document.getElementById('chatbot-send');
    const chatbotMessages = document.getElementById('chatbot-messages');
    const quickReplyButtons = document.querySelectorAll('.quick-reply');
    
    console.log('Chatbot Elements:', {
        toggle: chatbotToggle,
        widget: chatbotWidget,
        close: chatbotClose,
        input: chatbotInput,
        send: chatbotSend,
        messages: chatbotMessages,
        quickReplies: quickReplyButtons.length
    });
    
    // Predefined bot responses
    const botResponses = {
        'services': 'We offer comprehensive interior design and fit-out services including: Residential Design, Commercial Spaces, Hospitality Projects, and Custom Furniture. All services are tailored to your unique needs.',
        'quote': 'To get a personalized quote, please visit our Estimation Calculator page or contact us directly at +971 50 269 1799. We\'ll assess your project and provide a detailed estimate.',
        'contact': 'You can reach us at:\n📞 Phone: +971 58 985 0165\n📧 Email: info@breezelineinteriors.com📍 Location: Dubai, UAE\nOr use our WhatsApp for quick enquiries!',
        'default': 'Thank you for your interest in Breezeline Interiors! How else can I assist you?'
    };
    
    // Add message to chat
    function addMessage(text, sender) {
        if (!chatbotMessages) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sender}-message`;
        
        const paragraph = document.createElement('p');
        paragraph.textContent = text;
        paragraph.style.margin = '0';
        
        messageDiv.appendChild(paragraph);
        chatbotMessages.appendChild(messageDiv);
        
        // Scroll to bottom
        setTimeout(() => {
            chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
        }, 100);
    }
    
    // Get bot response based on user input
    function getResponse(userMessage) {
        const lowerMessage = userMessage.toLowerCase();
        
        if (lowerMessage.includes('service') || lowerMessage.includes('offer')) {
            return botResponses.services;
        } else if (lowerMessage.includes('quote') || lowerMessage.includes('price') || lowerMessage.includes('cost')) {
            return botResponses.quote;
        } else if (lowerMessage.includes('contact') || lowerMessage.includes('phone') || lowerMessage.includes('email')) {
            return botResponses.contact;
        } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
            return 'Hello! Welcome to Breezeline Interiors. How can I help you transform your space into luxury?';
        } else if (lowerMessage.includes('project') || lowerMessage.includes('portfolio')) {
            return 'We have an impressive portfolio of luxury residential and commercial projects. Visit our Projects page to see our latest work!';
        } else if (lowerMessage.includes('design') || lowerMessage.includes('interior')) {
            return 'Our design team specializes in creating timeless elegance with contemporary innovation. Every project is customized to reflect your unique vision.';
        } else {
            return botResponses.default;
        }
    }
    
    // Send message function
    function sendMessage() {
        if (!chatbotInput) return;
        
        const message = chatbotInput.value.trim();
        
        if (message === '') return;
        
        // Add user message
        addMessage(message, 'user');
        chatbotInput.value = '';
        
        // Simulate bot response delay
        setTimeout(() => {
            const response = getResponse(message);
            addMessage(response, 'bot');
        }, 500);
    }
    
    // Setup event listeners only if elements exist
    if (chatbotToggle && chatbotWidget && chatbotClose) {
        console.log('Setting up chatbot event listeners...');
        
        chatbotToggle.addEventListener('click', function(e) {
            console.log('Toggle clicked');
            e.preventDefault();
            e.stopPropagation();
            chatbotWidget.classList.add('active');
            chatbotToggle.classList.add('hidden');
            if (chatbotInput) {
                setTimeout(() => chatbotInput.focus(), 300);
            }
        });
        
        chatbotClose.addEventListener('click', function(e) {
            console.log('Close clicked');
            e.preventDefault();
            e.stopPropagation();
            chatbotWidget.classList.remove('active');
            chatbotToggle.classList.remove('hidden');
        });
        
        if (chatbotSend) {
            chatbotSend.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Send clicked');
                sendMessage();
            });
        }
        
        if (chatbotInput) {
            chatbotInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    sendMessage();
                }
            });
        }
        
        quickReplyButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                const message = this.getAttribute('data-msg');
                if (chatbotInput) {
                    chatbotInput.value = message;
                    sendMessage();
                }
            });
        });
        
        console.log('Chatbot event listeners setup complete');
    } else {
        console.error('Chatbot elements not found:', {
            toggle: !chatbotToggle,
            widget: !chatbotWidget,
            close: !chatbotClose
        });
    }
    
    // ========================================
    // ADMIN LOGIN - KEYBOARD SHORTCUT
    // ========================================
    let adminKeySequence = '';
    
    document.addEventListener('keydown', function(e) {
        // Press 'A' key three times to access admin login
        if (e.key.toLowerCase() === 'a' || e.key.toLowerCase() === 'admin') {
            adminKeySequence += e.key.toLowerCase();
            
            // Clear sequence if more than 3 As
            if (adminKeySequence.length > 3) {
                adminKeySequence = adminKeySequence.slice(-3);
            }
            
            // Check if user pressed A three times
            if (adminKeySequence === 'aaa') {
                console.log('Admin login accessed');
                adminKeySequence = '';
                window.location.href = 'admin-panel.html';
            }
            
            // Reset after 3 seconds of inactivity
            setTimeout(() => {
                adminKeySequence = '';
            }, 3000);
        }
    });
    
    // Admin login button click
    const adminLogin = document.querySelector('.admin-login');
    if (adminLogin) {
        adminLogin.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Admin login accessed');
            window.location.href = 'admin-login.html';
        });
    }
    
    // ========================================
    // KEYBOARD NAVIGATION
    // ========================================
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (chatbotWidget && chatbotWidget.classList.contains('active')) {
                chatbotWidget.classList.remove('active');
                if (chatbotToggle) chatbotToggle.classList.remove('hidden');
            }
            
            if (navLinks && navLinks.classList.contains('active')) {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
                document.body.style.overflow = '';
            }
        }
    });
    
    // ========================================
    // CONSOLE MESSAGE
    // ========================================
    console.log('%c🏆 Breezeline Interiors - Dubai', 'color: #d4af37; font-size: 24px; font-weight: bold; font-family: Playfair Display;');
    console.log('%cImagine. Create. Transform.', 'color: #ffffff; font-size: 14px; font-family: Poppins;');
    console.log('%cWebsite crafted with excellence 💎', 'color: #d4af37; font-size: 12px;');
    
});

// ========================================
// SERVICE WORKER (OPTIONAL - FOR PWA)
// ========================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        // Uncomment to enable service worker
        // navigator.serviceWorker.register('/sw.js');
    });
}