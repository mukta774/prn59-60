/**
 * Landing Page - JavaScript Interactions
 * VaccineAssess System
 */

// DOM Elements
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
const navbar = document.getElementById('navbar');
const faqItems = document.querySelectorAll('.faq-item');

// ============================================================================
// Mobile Navigation Toggle
// ============================================================================

navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('active');
    navLinks.classList.toggle('active');
});

// Close mobile menu when clicking on a link
navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        navToggle.classList.remove('active');
        navLinks.classList.remove('active');
    });
});

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-container')) {
        navToggle.classList.remove('active');
        navLinks.classList.remove('active');
    }
});

// ============================================================================
// Navbar Background on Scroll
// ============================================================================

window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.style.boxShadow = `0 10px 15px -3px rgba(0, 0, 0, 0.1)`;
    } else {
        navbar.style.boxShadow = `0 1px 2px 0 rgba(0, 0, 0, 0.05)`;
    }
});

// ============================================================================
// FAQ Accordion Functionality
// ============================================================================

function toggleFaq(index) {
    const faqItem = faqItems[index];

    // Close all other items
    faqItems.forEach((item, i) => {
        if (i !== index) {
            item.classList.remove('active');
        }
    });

    // Toggle current item
    faqItem.classList.toggle('active');
}

// Keyboard navigation for FAQ
faqItems.forEach((item, index) => {
    const question = item.querySelector('.faq-question');

    question.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleFaq(index);
        }
    });
});

// ============================================================================
// Smooth Scroll to Section
// ============================================================================

function scrollToSection(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return false;
    }
}

// Handle smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#') {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        }
    });
});

// ============================================================================
// Intersection Observer for Animations
// ============================================================================

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.animation = 'slideInUp 0.6s ease-out forwards';
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe elements for animation
document.querySelectorAll('.step-card, .myth-card, .trust-card, .faq-item').forEach(el => {
    observer.observe(el);
});

// ============================================================================
// Dynamic Statistics Counter
// ============================================================================

function animateCounter(element, target, duration = 2000) {
    let current = 0;
    const increment = target / (duration / 16);

    const updateCounter = () => {
        current += increment;
        if (current < target) {
            element.textContent = Math.floor(current) + (target > 1000 ? '+' : '%');
            requestAnimationFrame(updateCounter);
        } else {
            element.textContent = target + (target > 1000 ? '+' : '%');
        }
    };

    updateCounter();
}

// Animate stats when they come into view
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.classList.contains('animated')) {
            entry.target.classList.add('animated');
            const numbers = [10, 500, 95, 24];
            document.querySelectorAll('.stat-number').forEach((el, i) => {
                if (numbers[i] > 1) {
                    animateCounter(el, numbers[i]);
                }
            });
        }
    });
}, { threshold: 0.5 });

const statsSection = document.querySelector('.stats-section');
if (statsSection) {
    statsObserver.observe(statsSection);
}

// ============================================================================
// Form Validation (if any forms are added)
// ============================================================================

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// ============================================================================
// Accessibility Enhancements
// ============================================================================

// Ensure all interactive elements are keyboard accessible
document.querySelectorAll('.btn, [onclick]').forEach(element => {
    if (!element.hasAttribute('tabindex')) {
        element.setAttribute('tabindex', '0');
    }
});

// ============================================================================
// Analytics Helpers (if needed)
// ============================================================================

function trackEvent(eventName, eventData = {}) {
    // This can be connected to Google Analytics or other tracking
    console.log(`Event: ${eventName}`, eventData);
}

// Track CTA clicks
document.querySelectorAll('.btn-primary, .nav-cta').forEach(btn => {
    btn.addEventListener('click', () => {
        trackEvent('cta_clicked', {
            text: btn.textContent,
            page: 'landing'
        });
    });
});

// ============================================================================
// Performance Optimization
// ============================================================================

// Lazy load images (if any)
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.add('loaded');
                observer.unobserve(img);
            }
        });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

// ============================================================================
// Initialization
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('VaccineAssess Landing Page Loaded');

    // Any initialization code here
    // E.g., fetch data from API, set up real-time updates
});

// ============================================================================
// Error Handling
// ============================================================================

window.addEventListener('error', (e) => {
    console.error('An error occurred:', e.error);
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
});

// ============================================================================
// Local Storage Helpers
// ============================================================================

const storage = {
    set: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.warn('localStorage unavailable:', e);
        }
    },
    get: (key) => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (e) {
            console.warn('localStorage unavailable:', e);
            return null;
        }
    },
    remove: (key) => {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.warn('localStorage unavailable:', e);
        }
    }
};

// Track user preferences
function saveUserPreference(key, value) {
    storage.set(`user_${key}`, value);
}

function getUserPreference(key, defaultValue) {
    return storage.get(`user_${key}`) || defaultValue;
}

// ============================================================================
// Theme Support (Light/Dark Mode)
// ============================================================================

const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

function setupTheme() {
    const savedTheme = getUserPreference('theme', null);

    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    } else if (prefersDark.matches) {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
}

// Listen for theme changes
prefersDark.addEventListener('change', (e) => {
    const newTheme = e.matches ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    saveUserPreference('theme', newTheme);
});

setupTheme();

// ============================================================================
// Utility Functions
// ============================================================================

// Debounce function for scroll events
function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
}

// Throttle function for frequent events
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Format numbers with commas
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Get query parameters
function getQueryParam(param) {
    const params = new URLSearchParams(window.location.search);
    return params.get(param);
}

// ============================================================================
// Print Friendly Styles
// ============================================================================

function setupPrintStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @media print {
            .navbar, .footer, .btn { display: none; }
            body { font-size: 12pt; }
        }
    `;
    document.head.appendChild(style);
}

setupPrintStyles();

// Export for use in other modules if needed
window.VaccineAssess = {
    scrollToSection,
    toggleFaq,
    trackEvent,
    storage,
    saveUserPreference,
    getUserPreference,
    formatNumber,
    getQueryParam,
    debounce,
    throttle
};
