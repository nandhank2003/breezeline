// Price configuration (AED per sqm)
const PRICE_LIST = {
    '1BHK': { Standard: 2000, Premium: 2300 },
    '2BHK': { Standard: 2200, Premium: 2500 },
    '3BHK': { Standard: 2300, Premium: 2600 },
    'Studio Apartment': { Standard: 1600, Premium: 2000 },
    'Office': { Standard: 2600, Premium: 3000 },
    'Retail Shops': { Standard: 5500, Premium: 6500 },
    'F&B': { Standard: 5800, Premium: 6500 },
    'Villa Renovation': { Standard: 5000, Premium: 7000 }
};

// DOM Elements
const estimationForm = document.getElementById('estimationForm');
const contactForm = document.getElementById('contactForm');
const contactModal = document.getElementById('contactModal');
const resultSection = document.getElementById('resultSection');
const closeModal = document.querySelector('.close');
const cancelBtn = document.getElementById('cancelBtn');

// Form data storage
let currentEstimationData = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    updatePriceDisplay();
});

function initializeEventListeners() {
    // Estimation form submission
    estimationForm.addEventListener('submit', handleEstimationSubmit);
    
    // Contact form submission
    contactForm.addEventListener('submit', handleContactSubmit);
    
    // Modal controls
    closeModal.addEventListener('click', closeContactModal);
    cancelBtn.addEventListener('click', closeContactModal);
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === contactModal) {
            closeContactModal();
        }
    });
    
    // Real-time calculation when inputs change
    const projectTypeSelect = document.getElementById('projectType');
    const projectClassSelect = document.getElementById('projectClass');
    const areaInput = document.getElementById('area');
    
    projectTypeSelect.addEventListener('change', updatePriceDisplay);
    projectClassSelect.addEventListener('change', updatePriceDisplay);
    areaInput.addEventListener('input', updatePriceDisplay);
    
    // Area input validation
    areaInput.addEventListener('input', function(e) {
        validateArea(e.target.value);
        updatePriceDisplay();
    });
    
    // Phone input validation
    const phoneInput = document.getElementById('phone');
    phoneInput.addEventListener('input', function(e) {
        validatePhone(e.target.value);
    });
    
    // Email input validation
    const emailInput = document.getElementById('email');
    emailInput.addEventListener('input', function(e) {
        validateEmail(e.target.value);
    });
}

// NEW: Real-time price calculation display
function updatePriceDisplay() {
    const projectType = document.getElementById('projectType').value;
    const projectClass = document.getElementById('projectClass').value;
    const area = document.getElementById('area').value;
    
    const priceDisplay = document.getElementById('priceDisplay');
    
    if (projectType && projectClass && area && validateArea(area)) {
        const areaNum = parseFloat(area);
        const pricePerSqm = PRICE_LIST[projectType][projectClass];
        const totalPrice = pricePerSqm * areaNum;
        
        const formattedPricePerSqm = new Intl.NumberFormat('en-AE', {
            style: 'currency',
            currency: 'AED'
        }).format(pricePerSqm);
        
        const formattedTotalPrice = new Intl.NumberFormat('en-AE', {
            style: 'currency',
            currency: 'AED'
        }).format(totalPrice);
        
        priceDisplay.innerHTML = `
            <div class="price-breakdown">
                <div class="price-item">
                    <span>Price per sqm:</span>
                    <strong>${formattedPricePerSqm}/sqm</strong>
                </div>
                <div class="price-item">
                    <span>Area:</span>
                    <strong>${areaNum} sqm</strong>
                </div>
                <div class="price-total">
                    <span>Estimated Total:</span>
                    <strong>${formattedTotalPrice}</strong>
                </div>
            </div>
        `;
        priceDisplay.style.display = 'block';
    } else {
        priceDisplay.style.display = 'none';
    }
}

function handleEstimationSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(estimationForm);
    const projectType = formData.get('projectType');
    const projectClass = formData.get('projectClass');
    const area = formData.get('area');
    
    // Validate form
    if (!validateForm(projectType, projectClass, area)) {
        return;
    }
    
    // Calculate price per sqm and total
    const pricePerSqm = PRICE_LIST[projectType][projectClass];
    const totalPrice = pricePerSqm * parseFloat(area);
    
    // Store current estimation data
    currentEstimationData = {
        projectType,
        projectClass,
        area: parseFloat(area),
        pricePerSqm: pricePerSqm,
        totalPrice: totalPrice
    };
    
    // Show contact modal
    showContactModal();
}

function handleContactSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(contactForm);
    const phone = formData.get('phone');
    const email = formData.get('email');
    
    // Validate contact form
    if (!validatePhone(phone) || !validateEmail(email)) {
        return;
    }
    
    // Add contact info to estimation data
    currentEstimationData.phone = phone;
    currentEstimationData.email = email;
    
    // Submit data to server
    submitEstimationData(currentEstimationData);
}

function validateForm(projectType, projectClass, area) {
    let isValid = true;
    
    // Reset errors
    document.getElementById('areaError').textContent = '';
    
    if (!projectType) {
        showFieldError('projectType', 'Please select a project type');
        isValid = false;
    }
    
    if (!projectClass) {
        showFieldError('projectClass', 'Please select a project class');
        isValid = false;
    }
    
    if (!area || !validateArea(area)) {
        isValid = false;
    }
    
    return isValid;
}

function validateArea(area) {
    const areaError = document.getElementById('areaError');
    
    if (!area) {
        areaError.textContent = 'Area is required';
        return false;
    }
    
    const areaNum = parseFloat(area);
    if (isNaN(areaNum) || areaNum <= 0) {
        areaError.textContent = 'Please enter a valid positive number';
        return false;
    }
    
    if (areaNum > 10000) {
        areaError.textContent = 'Area seems too large. Please contact us directly.';
        return false;
    }
    
    if (areaNum < 10) {
        areaError.textContent = 'Minimum area should be 10 sqm';
        return false;
    }
    
    areaError.textContent = '';
    return true;
}

function validatePhone(phone) {
    const phoneError = document.getElementById('phoneError');
    
    if (!phone) {
        phoneError.textContent = 'Phone number is required';
        return false;
    }
    
    // UAE phone number validation
    const uaePhoneRegex = /^(\+971|0)?5[0-9]\s?[0-9]{3}\s?[0-9]{4}$/;
    const cleanedPhone = phone.replace(/\s/g, '');
    
    if (!uaePhoneRegex.test(cleanedPhone)) {
        phoneError.textContent = 'Please enter a valid UAE phone number (e.g., 05X XXX XXXX or +971 5X XXX XXXX)';
        return false;
    }
    
    phoneError.textContent = '';
    return true;
}

function validateEmail(email) {
    const emailError = document.getElementById('emailError');
    
    if (!email) {
        emailError.textContent = 'Email is required';
        return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        emailError.textContent = 'Please enter a valid email address';
        return false;
    }
    
    emailError.textContent = '';
    return true;
}

function showFieldError(fieldName, message) {
    const field = document.getElementById(fieldName);
    const errorElement = document.getElementById(fieldName + 'Error') || field.nextElementSibling;
    
    if (errorElement && errorElement.classList.contains('error-message')) {
        errorElement.textContent = message;
    }
}

function showContactModal() {
    contactModal.style.display = 'block';
    document.getElementById('phone').value = '';
    document.getElementById('email').value = '';
    document.getElementById('phoneError').textContent = '';
    document.getElementById('emailError').textContent = '';
}

function closeContactModal() {
    contactModal.style.display = 'none';
}

async function submitEstimationData(data) {
    try {
        // Show loading state
        const submitBtn = contactForm.querySelector('.btn-primary');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Submitting...';
        submitBtn.disabled = true;
        
        const response = await fetch('/submit-estimation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            // Show success result
            showEstimationResult(data);
            closeContactModal();
        } else {
            throw new Error('Failed to submit estimation');
        }
        
    } catch (error) {
        console.error('Error submitting estimation:', error);
        alert('Sorry, there was an error submitting your estimation. Please try again.');
    } finally {
        // Reset button state
        const submitBtn = contactForm.querySelector('.btn-primary');
        submitBtn.textContent = 'Submit & Get Estimate';
        submitBtn.disabled = false;
    }
}

function showEstimationResult(data) {
    const totalPrice = data.totalPrice;
    const pricePerSqm = data.pricePerSqm;
    
    const formattedPricePerSqm = new Intl.NumberFormat('en-AE', {
        style: 'currency',
        currency: 'AED'
    }).format(pricePerSqm);
    
    const formattedTotalPrice = new Intl.NumberFormat('en-AE', {
        style: 'currency',
        currency: 'AED'
    }).format(totalPrice);
    
    // Update result display with detailed breakdown
    document.getElementById('totalPrice').textContent = formattedTotalPrice;
    document.getElementById('resultDetails').innerHTML = `
        <div class="result-breakdown">
            <div class="breakdown-item">
                <span>Project Type:</span>
                <strong>${data.projectType}</strong>
            </div>
            <div class="breakdown-item">
                <span>Service Class:</span>
                <strong>${data.projectClass}</strong>
            </div>
            <div class="breakdown-item">
                <span>Area:</span>
                <strong>${data.area} sqm</strong>
            </div>
            <div class="breakdown-item">
                <span>Price per sqm:</span>
                <strong>${formattedPricePerSqm}/sqm</strong>
            </div>
        </div>
    `;
    
    // Show result section and hide form
    document.getElementById('estimationForm').style.display = 'none';
    document.getElementById('result').style.display = 'block';
    
    // Scroll to result
    document.getElementById('result').scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
    });
}

function resetForm() {
    // Reset forms
    estimationForm.reset();
    contactForm.reset();
    
    // Show form and hide result
    document.getElementById('estimationForm').style.display = 'block';
    document.getElementById('result').style.display = 'none';
    
    // Clear errors
    document.querySelectorAll('.error-message').forEach(el => {
        el.textContent = '';
    });
    
    // Hide price display
    document.getElementById('priceDisplay').style.display = 'none';
    
    // Reset current data
    currentEstimationData = null;
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Utility function to format phone number
function formatPhoneNumber(phone) {
    const cleaned = phone.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{2})(\d{3})(\d{4})$/);
    if (match) {
        return '+971 ' + match[1] + ' ' + match[2] + ' ' + match[3];
    }
    return phone;
}

// NEW: Add CSS for price display and breakdown
function addPriceDisplayStyles() {
    const styles = `
        .price-display {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 1.5rem;
            border-radius: 12px;
            margin: 1.5rem 0;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }
        
        .price-breakdown {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
        }
        
        .price-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.5rem 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .price-total {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 1.2rem;
            font-weight: bold;
            padding-top: 0.5rem;
            border-top: 2px solid rgba(255, 255, 255, 0.3);
            margin-top: 0.5rem;
        }
        
        .result-breakdown {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            margin-top: 1rem;
        }
        
        .breakdown-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.5rem 0;
            border-bottom: 1px solid #e0e0e0;
        }
        
        .breakdown-item:last-child {
            border-bottom: none;
        }
    `;
    
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
}

// Initialize styles when DOM is loaded
document.addEventListener('DOMContentLoaded', addPriceDisplayStyles);