/* ========================================
   PROJECT PAGE - CATEGORY FILTERING
   ======================================== */

// Category Information Database
const categoryData = {
    all: {
        title: "Our Portfolio",
        subtitle: "Showcasing exceptional interior transformations across Dubai",
        heading: "All Projects",
        description: "Explore our comprehensive portfolio of luxury interior design projects across Dubai. From residential sanctuaries to commercial masterpieces, each project reflects our commitment to excellence and attention to detail."
    },
    commercial: {
        title: "Commercial Projects",
        subtitle: "Sophisticated business environments that inspire success",
        heading: "Commercial Interior Design",
        description: "We create powerful commercial spaces that blend functionality with luxury. Our commercial projects in Dubai reflect modern business aesthetics while maintaining the highest standards of comfort and efficiency."
    },
    residential: {
        title: "Residential Projects",
        subtitle: "Luxury living spaces crafted with passion",
        heading: "Residential Interior Design",
        description: "Transform your home into a luxurious sanctuary. Our residential projects showcase timeless elegance, personalized design, and meticulous attention to detail across Dubai's most prestigious addresses."
    },
    retail: {
        title: "Retail Showrooms",
        subtitle: "Captivating retail spaces that drive customer engagement",
        heading: "Retail Interior Design",
        description: "Creating immersive retail experiences that captivate customers and elevate your brand. Our showroom designs combine aesthetic appeal with strategic space planning to maximize impact and sales."
    },
    office: {
        title: "Office Fitouts",
        subtitle: "Modern workspaces that boost productivity",
        heading: "Office Interior Design",
        description: "Design innovative office environments that inspire collaboration and productivity. Our office fitouts blend contemporary aesthetics with ergonomic functionality to create spaces where teams thrive."
    },
    healthcare: {
        title: "Healthcare Solutions",
        subtitle: "Healing environments designed with care",
        heading: "Healthcare Interior Design",
        description: "Creating calming, hygienic, and efficient healthcare environments. Our medical interiors prioritize patient comfort while meeting the stringent requirements of modern healthcare facilities."
    },
    food: {
        title: "F&B Solutions",
        subtitle: "Dining experiences that delight all senses",
        heading: "Restaurant & Cafe Design",
        description: "Crafting unforgettable dining atmospheres that enhance culinary experiences. From fine dining to casual cafes, our F&B designs create memorable spaces that keep customers coming back."
    },
    hotel: {
        title: "Hotel Interior Design",
        subtitle: "Luxurious hospitality spaces that create lasting impressions",
        heading: "Hotel & Resort Design",
        description: "Designing exceptional hospitality interiors that provide guests with unforgettable experiences. Our hotel projects combine luxury, comfort, and functionality to create world-class accommodations."
    },
    exhibitions: {
        title: "Exhibitions",
        subtitle: "Dynamic exhibition spaces that captivate audiences",
        heading: "Exhibition Design",
        description: "Creating engaging exhibition spaces that showcase your brand and products in the best light. Our exhibition designs combine creativity with strategic planning to maximize visitor engagement and impact."
    }
};

// Initialize page on load
document.addEventListener('DOMContentLoaded', function() {
    initializeProjectPage();
    setupMobileDropdown();
});

// Main initialization function
function initializeProjectPage() {
    // Get category from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category') || 'all';
    
    // Update page content based on category
    updatePageContent(category);
    
    // Filter projects
    filterProjects(category);
    
    // Update active navigation state
    updateActiveNavigation(category);
}

// Update page titles and descriptions
function updatePageContent(category) {
    const data = categoryData[category] || categoryData.all;
    
    // Update hero section
    const heroTitle = document.getElementById('category-title');
    const heroSubtitle = document.getElementById('category-subtitle');
    
    if (heroTitle) heroTitle.textContent = data.title;
    if (heroSubtitle) heroSubtitle.textContent = data.subtitle;
    
    // Update category description section
    const categoryHeading = document.getElementById('category-heading');
    const categoryDescription = document.getElementById('category-description');
    
    if (categoryHeading) categoryHeading.textContent = data.heading;
    if (categoryDescription) categoryDescription.textContent = data.description;
    
    // Update page title
    document.title = `${data.title} - Breezeline Interiors Dubai`;
}

// Filter and display projects
function filterProjects(category) {
    const projectCards = document.querySelectorAll('.project-card');
    const projectsGrid = document.getElementById('projectsGrid');
    let visibleCount = 0;
    
    // Remove existing no-results message if any
    removeNoResultsMessage();
    
    projectCards.forEach((card, index) => {
        const cardCategory = card.getAttribute('data-category');
        
        if (category === 'all' || cardCategory === category) {
            card.style.display = 'block';
            // Reset and reapply animation
            card.style.animation = 'none';
            setTimeout(() => {
                card.style.animation = `fadeIn 0.6s ease-out ${visibleCount * 0.05}s both`;
            }, 10);
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });
    
    // Show "no results" message if no projects found
    if (visibleCount === 0) {
        showNoResultsMessage(category);
    }
}

// Show no results message
function showNoResultsMessage(category) {
    const projectsGrid = document.getElementById('projectsGrid');
    const categoryName = categoryData[category]?.title || 'this category';
    
    const noResultsDiv = document.createElement('div');
    noResultsDiv.className = 'no-results';
    noResultsDiv.id = 'no-results-message';
    noResultsDiv.innerHTML = `
        <h3>No Projects Found</h3>
        <p>We currently don't have any projects in ${categoryName}.</p>
        <p>Please check back soon or explore our other categories.</p>
        <a href="project.html" class="btn btn-primary">View All Projects</a>
    `;
    
    projectsGrid.appendChild(noResultsDiv);
}

// Remove no results message
function removeNoResultsMessage() {
    const existingMessage = document.getElementById('no-results-message');
    if (existingMessage) {
        existingMessage.remove();
    }
}

// Update active navigation state
function updateActiveNavigation(category) {
    const dropdownLinks = document.querySelectorAll('.dropdown-menu a');
    
    dropdownLinks.forEach(link => {
        const linkCategory = new URLSearchParams(link.search).get('category') || 'all';
        
        if (linkCategory === category) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Setup mobile dropdown toggle
function setupMobileDropdown() {
    const dropdownTrigger = document.querySelector('.dropdown-trigger');
    const navDropdown = document.querySelector('.nav-dropdown');
    
    if (dropdownTrigger && navDropdown) {
        dropdownTrigger.addEventListener('click', function(e) {
            if (window.innerWidth <= 768) {
                e.preventDefault();
                navDropdown.classList.toggle('active');
            }
        });
    }
}

// Smooth scroll to projects section
window.addEventListener('load', function() {
    // If coming from external link, smooth scroll to projects
    if (window.location.search) {
        setTimeout(() => {
            const categorySection = document.querySelector('.category-content-section');
            if (categorySection) {
                categorySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 500);
    }
});