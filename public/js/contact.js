// Mobile Menu Toggle
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');

hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('active');
});

// Close menu when a link is clicked
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('active');
    });
});

// Form Validation and Submission
const contactForm = document.getElementById('contactForm');

contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Get form data
    const formData = {
        name: document.getElementById('name').value.trim(),
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        subject: document.getElementById('subject').value.trim(),
        service: document.getElementById('service').value,
        message: document.getElementById('message').value.trim()
    };

    // Validate form
    if (!formData.name || !formData.email || !formData.subject || !formData.service || !formData.message) {
        showAlert('Please fill in all required fields', 'error');
        return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
        showAlert('Please enter a valid email address', 'error');
        return;
    }

    // Phone validation (if provided)
    if (formData.phone && !/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
        showAlert('Please enter a valid phone number', 'error');
        return;
    }

    try {
        // Disable submit button
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerText;
        submitBtn.disabled = true;
        submitBtn.innerText = 'Sending...';

        // In a real application, you would send this data to a server
        // For now, we'll simulate a successful submission
        await simulateFormSubmission(formData);

        // Show success message
        showAlert('Message sent successfully! We will get back to you soon.', 'success');

        // Reset form
        contactForm.reset();

        // Reset button
        submitBtn.disabled = false;
        submitBtn.innerText = originalText;

    } catch (error) {
        showAlert('An error occurred. Please try again later.', 'error');
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.innerText = 'Send Message';
    }
});

// Simulate form submission (replace with actual API call)
function simulateFormSubmission(data) {
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log('Form submitted with data:', data);
            // Here you would typically send data to your backend API
            // Example: fetch('/api/contact', { method: 'POST', body: JSON.stringify(data) })
            resolve();
        }, 1500);
    });
}

// Alert/Toast Notification
function showAlert(message, type = 'info') {
    // Create alert element
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `
        <div class="alert-content">
            <span>${message}</span>
            <button class="alert-close">&times;</button>
        </div>
    `;

    // Add styles dynamically
    const style = document.createElement('style');
    if (!document.querySelector('style[data-alert-styles]')) {
        style.setAttribute('data-alert-styles', 'true');
        style.textContent = `
            .alert {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 1rem 1.5rem;
                border-radius: 4px;
                z-index: 1000;
                animation: slideIn 0.3s ease-out;
                max-width: 400px;
                box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
            }

            .alert-success {
                background-color: #4CAF50;
                color: white;
            }

            .alert-error {
                background-color: #f44336;
                color: white;
            }

            .alert-info {
                background-color: #2196F3;
                color: white;
            }

            .alert-content {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 1rem;
            }

            .alert-close {
                background: none;
                border: none;
                color: white;
                font-size: 1.5rem;
                cursor: pointer;
                padding: 0;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .alert-close:hover {
                opacity: 0.8;
            }

            @keyframes slideIn {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }

            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(400px);
                    opacity: 0;
                }
            }

            .alert.removing {
                animation: slideOut 0.3s ease-out;
            }

            @media (max-width: 768px) {
                .alert {
                    right: 10px;
                    left: 10px;
                    max-width: none;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Append alert to body
    document.body.appendChild(alert);

    // Close button functionality
    const closeBtn = alert.querySelector('.alert-close');
    closeBtn.addEventListener('click', () => removeAlert(alert));

    // Auto remove after 5 seconds
    setTimeout(() => removeAlert(alert), 5000);
}

// Remove alert with animation
function removeAlert(alert) {
    alert.classList.add('removing');
    setTimeout(() => {
        alert.remove();
    }, 300);
}

// Smooth scroll for internal links
document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(link.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// Add input focus animation
const inputs = document.querySelectorAll('input, select, textarea');
inputs.forEach(input => {
    input.addEventListener('focus', function() {
        this.style.boxShadow = '0 0 0 2px rgba(212, 175, 55, 0.2)';
    });

    input.addEventListener('blur', function() {
        this.style.boxShadow = 'none';
    });
});

// Intersection Observer for fade-in animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe contact cards
document.querySelectorAll('.info-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'all 0.6s ease';
    observer.observe(card);
});

// Form field character counter for message
const messageField = document.getElementById('message');
if (messageField) {
    const charCounter = document.createElement('div');
    charCounter.className = 'char-counter';
    charCounter.style.cssText = `
        margin-top: 0.5rem;
        font-size: 0.85rem;
        color: #999;
        text-align: right;
    `;
    messageField.parentNode.appendChild(charCounter);

    const maxChars = 1000;

    messageField.addEventListener('input', function() {
        const remaining = maxChars - this.value.length;
        charCounter.textContent = `${this.value.length}/${maxChars} characters`;
        
        if (remaining < 100) {
            charCounter.style.color = '#d4af37';
        } else {
            charCounter.style.color = '#999';
        }
    });
}

// Lazy load images
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                }
                imageObserver.unobserve(img);
            }
        });
    });

    document.querySelectorAll('img[data-src]').forEach(img => imageObserver.observe(img));
}

// Add active state to current navigation link
window.addEventListener('load', () => {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
});

// Handle form input validation in real-time
document.getElementById('email')?.addEventListener('blur', function() {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (this.value && !emailRegex.test(this.value)) {
        this.style.borderColor = '#f44336';
    } else {
        this.style.borderColor = '';
    }
});

document.getElementById('phone')?.addEventListener('blur', function() {
    if (this.value && !/^[\d\s\-\+\(\)]+$/.test(this.value)) {
        this.style.borderColor = '#f44336';
    } else {
        this.style.borderColor = '';
    }
});

// Prevent form submission on Enter key in text inputs (except textarea)
document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"]').forEach(input => {
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
        }
    });
});

// Add loading state to PDF download
document.querySelectorAll('a[download]').forEach(link => {
    link.addEventListener('click', function(e) {
        const originalText = this.innerHTML;
        this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Downloading...';
        
        setTimeout(() => {
            this.innerHTML = originalText;
        }, 2000);
    });
});

// Scroll to top button
window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // You can add a scroll-to-top button here if needed
    if (scrollTop > 500) {
        // Show scroll to top button
    }
});

// Form accessibility improvements
const formInputs = document.querySelectorAll('input, select, textarea');
formInputs.forEach((input, index) => {
    if (!input.id) {
        input.id = `form-input-${index}`;
    }
});

console.log('Contact page script loaded successfully');