// Talkbyte - AI Voice Ordering Dashboard Application

// Embedded SVG Logo
const TALKBYTE_LOGO_SVG = `
<svg width="45" height="45" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#7c3aed;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#14b8a6;stop-opacity:1" />
    </linearGradient>
  </defs>
  <!-- Microphone body -->
  <rect x="40" y="25" width="20" height="30" rx="10" fill="url(#logoGradient)"/>
  <!-- Microphone stand -->
  <line x1="50" y1="55" x2="50" y2="75" stroke="url(#logoGradient)" stroke-width="3" stroke-linecap="round"/>
  <line x1="35" y1="75" x2="65" y2="75" stroke="url(#logoGradient)" stroke-width="3" stroke-linecap="round"/>
  <!-- Voice waves -->
  <path d="M 20 40 Q 15 50 20 60" stroke="#7c3aed" stroke-width="2.5" fill="none" opacity="0.7"/>
  <path d="M 10 35 Q 3 50 10 65" stroke="#7c3aed" stroke-width="2" fill="none" opacity="0.5"/>
  <path d="M 80 40 Q 85 50 80 60" stroke="#14b8a6" stroke-width="2.5" fill="none" opacity="0.7"/>
  <path d="M 90 35 Q 97 50 90 65" stroke="#14b8a6" stroke-width="2" fill="none" opacity="0.5"/>
</svg>
`;

const TALKBYTE_LOGO_SMALL = `
<svg width="20" height="20" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="logoGradientSmall" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#7c3aed;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#14b8a6;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect x="40" y="25" width="20" height="30" rx="10" fill="url(#logoGradientSmall)"/>
  <line x1="50" y1="55" x2="50" y2="75" stroke="url(#logoGradientSmall)" stroke-width="3" stroke-linecap="round"/>
  <line x1="35" y1="75" x2="65" y2="75" stroke="url(#logoGradientSmall)" stroke-width="3" stroke-linecap="round"/>
  <path d="M 20 40 Q 15 50 20 60" stroke="#7c3aed" stroke-width="2.5" fill="none" opacity="0.7"/>
  <path d="M 10 35 Q 3 50 10 65" stroke="#7c3aed" stroke-width="2" fill="none" opacity="0.5"/>
  <path d="M 80 40 Q 85 50 80 60" stroke="#14b8a6" stroke-width="2.5" fill="none" opacity="0.7"/>
  <path d="M 90 35 Q 97 50 90 65" stroke="#14b8a6" stroke-width="2" fill="none" opacity="0.5"/>
</svg>
`;

const TALKBYTE_LOGO_LARGE = `
<svg width="120" height="120" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="logoGradientLarge" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#7c3aed;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#14b8a6;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect x="40" y="25" width="20" height="30" rx="10" fill="url(#logoGradientLarge)"/>
  <line x1="50" y1="55" x2="50" y2="75" stroke="url(#logoGradientLarge)" stroke-width="3" stroke-linecap="round"/>
  <line x1="35" y1="75" x2="65" y2="75" stroke="url(#logoGradientLarge)" stroke-width="3" stroke-linecap="round"/>
  <path d="M 20 40 Q 15 50 20 60" stroke="#7c3aed" stroke-width="2.5" fill="none" opacity="0.7"/>
  <path d="M 10 35 Q 3 50 10 65" stroke="#7c3aed" stroke-width="2" fill="none" opacity="0.5"/>
  <path d="M 80 40 Q 85 50 80 60" stroke="#14b8a6" stroke-width="2.5" fill="none" opacity="0.7"/>
  <path d="M 90 35 Q 97 50 90 65" stroke="#14b8a6" stroke-width="2" fill="none" opacity="0.5"/>
</svg>
`;

// State Management
const state = {
  restaurantProfile: {
    name: "Mama's Pizzeria",
    ownerName: "John Rossi",
    established: 2015,
    location: "Newtown, Sydney NSW 2042",
    phone: "+61 2 9999 0001",
    website: "www.mamaspizzeria.com.au",
    starRating: 4.8,
    reviewCount: 127,
    openStatus: "Open until 10:00 PM",
    busyLevel: "Moderate"
  },
  customerConnection: {
    totalUniqueCustomers: 245,
    regularsThisMonth: 18,
    newCustomersThisWeek: 10,
    totalRepeatRate: "68%"
  },
  topCustomers: [
    {
      name: "Sarah M.",
      orders: 56,
      favorite: "2x Pizza Margherita",
      status: "VIP Regular",
      lastOrder: "Today at 12:15 PM",
      loyaltySince: "2018"
    },
    {
      name: "Michael L.",
      orders: 1,
      favorite: "Meat Lovers Pizza",
      status: "New Customer",
      lastOrder: "Today at 1:30 PM"
    },
    {
      name: "Jessica K.",
      orders: 23,
      favorite: "Pasta Carbonara",
      status: "Regular",
      lastOrder: "Yesterday at 6:45 PM"
    }
  ],
  achievements: [
    {
      title: "325 Orders This Week",
      emoji: "🎉",
      change: "+16% vs last week",
      color: "gold"
    },
    {
      title: "4.8 Star Rating",
      emoji: "⭐",
      change: "127 reviews",
      color: "gold"
    },
    {
      title: "$2,150 Revenue",
      emoji: "💰",
      change: "+16% vs last week",
      color: "green"
    },
    {
      title: "10 New Customers",
      emoji: "👥",
      change: "This week",
      color: "blue"
    }
  ],
  topDishes: [
    {
      name: "Pizza Margherita",
      percentage: 38,
      price: 14.50,
      rating: 4.9,
      reviews: 45
    },
    {
      name: "Garlic Bread",
      percentage: 22,
      price: 5.50,
      rating: 4.8,
      reviews: 32
    },
    {
      name: "Spaghetti Carbonara",
      percentage: 18,
      price: 15.50,
      rating: 4.7,
      reviews: 28
    }
  ],
  staffTeam: [
    { name: "Maria", role: "Chef", status: "On Duty" },
    { name: "Anthony", role: "Manager", status: "On Duty" }
  ],
  testimonials: [
    { quote: "Amazing service! Ordered in 2 minutes", author: "Sarah M." },
    { quote: "Love Talkbyte - super convenient", author: "Michael L." },
    { quote: "Best pizza place ever", author: "Jessica K." }
  ],
  isLoggedIn: false,
  currentPage: 'dashboard',
  isDarkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
  calls: [
    {
      id: 'C001',
      status: 'ORDER_CONFIRMATION',
      duration: 105,
      phone: '***-***-9876',
      transcript: 'Great! So that\'s 2 Margherita pizzas, 1 garlic bread, coming to $38.50 with GST. Ready to pay?',
      confidence: 0.96,
      action: 'Confirming order details',
      fullTranscript: [
        { time: '0:00', text: 'Customer: Hi, I\'d like to order some pizzas', confidence: 0.98 },
        { time: '0:15', text: 'AI: G\'day! Happy to help. What would you like today?', confidence: 0.99 },
        { time: '0:25', text: 'Customer: Two Margherita pizzas and garlic bread please', confidence: 0.95 },
        { time: '0:45', text: 'AI: Perfect! That\'s 2 Margherita pizzas at $14.50 each and 1 garlic bread at $5.50', confidence: 0.97 },
        { time: '1:30', text: 'AI: Your total is $38.50 including GST. Ready to confirm?', confidence: 0.96 }
      ]
    },
    {
      id: 'C002',
      status: 'LISTENING',
      duration: 35,
      phone: '***-***-5432',
      transcript: 'I\'d like to order... um... one Spaghetti Carbonara...',
      confidence: 0.87,
      action: 'Customer ordering',
      fullTranscript: [
        { time: '0:00', text: 'Customer: Hello?', confidence: 0.99 },
        { time: '0:05', text: 'AI: G\'day! Welcome to Mama\'s Pizzeria. What can I get for you?', confidence: 0.99 },
        { time: '0:20', text: 'Customer: I\'d like to order... um... one Spaghetti Carbonara...', confidence: 0.87 }
      ]
    },
    {
      id: 'C003',
      status: 'COMPLETED',
      duration: 192,
      phone: '***-***-1111',
      transcript: 'Order confirmed. Payment link sent to your phone. Thanks for ordering!',
      confidence: 0.99,
      action: 'Call completed',
      fullTranscript: [
        { time: '0:00', text: 'Customer: I want to order 3 garlic breads and 2 cokes', confidence: 0.96 },
        { time: '0:30', text: 'AI: Great choice! 3 garlic breads at $5.50 each and 2 Coke 600ml at $3.95 each', confidence: 0.98 },
        { time: '1:15', text: 'Customer: Yes, that sounds good', confidence: 0.95 },
        { time: '2:00', text: 'AI: Your total is $18.90 including GST. Payment link sent!', confidence: 0.99 },
        { time: '3:00', text: 'AI: Order confirmed. Thanks for ordering from Mama\'s Pizzeria!', confidence: 0.99 }
      ]
    }
  ],
  orders: [
    {
      id: '1001',
      items: [
        { name: 'Pizza Margherita', quantity: 2, price: 14.50 },
        { name: 'Garlic Bread', quantity: 1, price: 5.50 }
      ],
      total: 38.50,
      status: 'PAYMENT_CONFIRMED',
      time: '2:15 PM',
      paymentStatus: 'Paid',
      phone: '***-***-9876',
      specialInstructions: 'Extra cheese on pizzas'
    },
    {
      id: '1002',
      items: [
        { name: 'Spaghetti Carbonara', quantity: 1, price: 15.50 },
        { name: 'Caesar Salad', quantity: 1, price: 9.50 }
      ],
      total: 32.45,
      status: 'PREPARING',
      time: '2:08 PM',
      paymentStatus: 'Paid',
      phone: '***-***-5432',
      specialInstructions: 'No onions'
    },
    {
      id: '1003',
      items: [
        { name: 'Garlic Bread', quantity: 3, price: 5.50 },
        { name: 'Coke 600ml', quantity: 2, price: 3.95 }
      ],
      total: 18.90,
      status: 'PENDING',
      time: '1:45 PM',
      paymentStatus: 'Awaiting Payment',
      phone: '***-***-1111',
      specialInstructions: 'None'
    }
  ],
  menuItems: [
    {
      category: 'Pizzas',
      items: [
        { name: 'Margherita', price: 14.50, available: true },
        { name: 'Pepperoni', price: 16.00, available: true },
        { name: 'Hawaiian', price: 16.50, available: false }
      ]
    },
    {
      category: 'Pasta',
      items: [
        { name: 'Spaghetti Carbonara', price: 15.50, available: true },
        { name: 'Penne Arrabbiata', price: 14.00, available: true }
      ]
    },
    {
      category: 'Sides',
      items: [
        { name: 'Garlic Bread', price: 5.50, available: true },
        { name: 'Caesar Salad', price: 9.50, available: true }
      ]
    }
  ],
  stats: {
    todayCalls: 24,
    activeCalls: 2,
    ordersPlaced: 18,
    todayRevenue: 485.50
  },
  selectedCall: null,
  selectedOrder: null
};

// Utility Functions
function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatCurrency(amount) {
  return `$${amount.toFixed(2)}`;
}

function getStatusClass(status) {
  const statusMap = {
    'INCOMING': 'status-incoming',
    'LISTENING': 'status-listening',
    'SPEAKING': 'status-speaking',
    'ORDER_CONFIRMATION': 'status-confirming',
    'COMPLETED': 'status-completed',
    'PENDING': 'status-pending',
    'CONFIRMED': 'status-confirmed',
    'PREPARING': 'status-preparing',
    'PAYMENT_CONFIRMED': 'status-payment-confirmed'
  };
  return statusMap[status] || '';
}

function getStatusLabel(status) {
  return status.replace(/_/g, ' ');
}

function getConfidenceClass(confidence) {
  if (confidence >= 0.9) return 'confidence-high';
  if (confidence >= 0.7) return 'confidence-medium';
  return 'confidence-low';
}

// Render Functions
function renderLoginPage() {
  return `
    <div class="login-page">
      <div class="login-container">
        <div class="login-header">
          <div class="logo-icon">
            ${TALKBYTE_LOGO_LARGE}
          </div>
          <div class="logo">
            <span>Talkbyte</span>
          </div>
          <div class="login-subtitle">AI Voice Ordering for Modern Restaurants</div>
        </div>
        <form id="loginForm" onsubmit="handleLogin(event)">
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" id="email" class="form-input" placeholder="admin@mamaspizzeria.com.au" required autocomplete="email">
          </div>
          <div class="form-group">
            <label class="form-label">Password</label>
            <input type="password" id="password" class="form-input" placeholder="Enter password" required autocomplete="current-password">
          </div>
          <button type="submit" class="btn btn-primary">🔐 Login</button>
          <button type="button" class="btn btn-secondary" onclick="handleDemoLogin()">⚡ Demo Login</button>
        </form>
        <div class="login-footer">
          ✨ Trusted by 500+ Australian restaurants
        </div>
      </div>
    </div>
  `;
}

function renderTopNav() {
  const pages = ['Dashboard', 'Calls', 'Orders', 'Analytics', 'Menu', 'Settings'];
  return `
    <div class="top-nav">
      <div class="nav-left">
        <div class="nav-logo" onclick="navigateTo('dashboard')" style="cursor: pointer;">
          <div class="nav-logo-icon">
            ${TALKBYTE_LOGO_SVG}
          </div>
          <span>Talkbyte</span>
        </div>
        <div class="nav-links">
          ${pages.map(page => `
            <div class="nav-link ${state.currentPage === page.toLowerCase() ? 'active' : ''}" 
                 onclick="navigateTo('${page.toLowerCase()}')">
              ${page}
            </div>
          `).join('')}
        </div>
      </div>
      <div class="nav-right">
        <button class="theme-toggle" onclick="toggleTheme()">
          ${state.isDarkMode ? '☀️' : '🌙'}
        </button>
        <div class="user-profile">
          <div class="user-avatar">🍕</div>
          <span>Mama's Pizzeria</span>
        </div>
      </div>
    </div>
  `;
}

function renderRestaurantHero() {
  const { name, location, starRating, reviewCount, established, openStatus, busyLevel } = state.restaurantProfile;
  const currentYear = new Date().getFullYear();
  const yearsInBusiness = currentYear - established;
  
  return `
    <div class="restaurant-hero">
      <div class="restaurant-hero-content">
        <div class="restaurant-header">
          <div class="restaurant-logo">🍕</div>
          <div class="restaurant-info">
            <h1>${name}</h1>
            <div class="powered-by-talkbyte">
              ${TALKBYTE_LOGO_SMALL}
              <span>Powered by Talkbyte</span>
            </div>
            <div class="restaurant-subtitle" style="margin-top: 8px;">
              <div class="star-rating">
                <span>⭐ ${starRating}</span>
                <span style="opacity: 0.9;">(${reviewCount} reviews)</span>
              </div>
              <span>•</span>
              <span>📍 ${location}</span>
            </div>
          </div>
        </div>
        <div class="restaurant-badges">
          <div class="restaurant-badge">
            <span>🕐</span>
            <span>${openStatus}</span>
          </div>
          <div class="restaurant-badge">
            <span>📊</span>
            <span>${busyLevel} Traffic</span>
          </div>
          <div class="restaurant-badge">
            <span>🎂</span>
            <span>Established ${established} (${yearsInBusiness} years)</span>
          </div>
        </div>
        <div class="restaurant-actions">
          <button class="btn-hero btn-hero-primary">📝 Update Restaurant Info</button>
          <button class="btn-hero btn-hero-secondary">🌐 View Website</button>
        </div>
      </div>
    </div>
  `;
}

function renderGreeting() {
  const hour = new Date().getHours();
  let greeting = "Good afternoon";
  let message = "Your restaurant is performing well today!";
  
  if (hour < 12) {
    greeting = "Good morning";
    message = "Morning rush incoming - ready for a great day!";
  } else if (hour >= 18) {
    greeting = "Good evening";
    message = "Evening service is in full swing!";
  }
  
  return `
    <div class="greeting-section">
      <div class="greeting-card">
        <div class="greeting-text">
          <h2>${greeting}, ${state.restaurantProfile.ownerName}! 👋</h2>
          <p class="greeting-subtext">${message}</p>
          <div class="talkbyte-badge" style="margin-top: 12px;">
            ${TALKBYTE_LOGO_SMALL}
            <span>Your success is our success</span>
          </div>
        </div>
        <div class="stat-change">✨ ${state.customerConnection.totalUniqueCustomers} unique customers this month</div>
      </div>
    </div>
  `;
}

function renderCustomerConnection() {
  return `
    <div class="customer-section">
      <div class="section-header">
        <div style="display: flex; align-items: center;">
          <div class="section-icon">💚</div>
          <h2 class="section-title">Your Regular Customers</h2>
        </div>
        <span class="stat-change">❤️ Building loyal relationships</span>
      </div>
      <div class="customer-grid">
        ${state.topCustomers.map(customer => {
          const initials = customer.name.split(' ').map(n => n[0]).join('');
          const statusClass = customer.status.includes('VIP') ? 'status-vip' : 
                            customer.status.includes('New') ? 'status-new' : 'status-regular';
          return `
            <div class="customer-card">
              <div class="customer-avatar">${initials}</div>
              <div class="customer-name">${customer.name}</div>
              <div class="customer-status ${statusClass}">${customer.status}</div>
              <div class="customer-detail-row">
                <span class="customer-detail-label">Total Orders</span>
                <span class="customer-detail-value">${customer.orders} orders</span>
              </div>
              <div class="customer-detail-row">
                <span class="customer-detail-label">Favorite Order</span>
                <span class="customer-detail-value">${customer.favorite}</span>
              </div>
              <div class="customer-detail-row">
                <span class="customer-detail-label">Last Order</span>
                <span class="customer-detail-value">${customer.lastOrder}</span>
              </div>
              ${customer.loyaltySince ? `
                <div class="customer-detail-row">
                  <span class="customer-detail-label">Loyal Since</span>
                  <span class="customer-detail-value">${customer.loyaltySince} ❤️</span>
                </div>
              ` : ''}
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function renderAchievements() {
  return `
    <div class="section-header">
      <div style="display: flex; align-items: center;">
        <div class="section-icon">🏆</div>
        <h2 class="section-title">This Week's Achievements</h2>
      </div>
      <span class="stat-change">🎊 You're doing amazing!</span>
    </div>
    <div class="achievements-grid">
      ${state.achievements.map(achievement => `
        <div class="achievement-card ${achievement.color}">
          <div class="achievement-emoji">${achievement.emoji}</div>
          <div class="achievement-title">${achievement.title}</div>
          <div class="achievement-change">${achievement.change}</div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderTopDishes() {
  return `
    <div class="section-header">
      <div style="display: flex; align-items: center;">
        <div class="section-icon">🍽️</div>
        <h2 class="section-title">Top Selling Dishes</h2>
      </div>
      <span class="stat-change">📈 Your customers love these!</span>
    </div>
    <div class="dishes-grid">
      ${state.topDishes.map((dish, index) => `
        <div class="dish-card">
          <div class="dish-icon">${index === 0 ? '🍕' : index === 1 ? '🥖' : '🍝'}</div>
          <div class="dish-header">
            <div class="dish-name">${dish.name}</div>
            <div class="dish-price">$${dish.price.toFixed(2)}</div>
          </div>
          <div class="dish-rating">
            <span>⭐ ${dish.rating}</span>
            <span style="color: var(--color-text-secondary); font-size: var(--font-size-sm);">(${dish.reviews} reviews)</span>
          </div>
          <div class="dish-percentage">${dish.percentage}% of all orders</div>
          ${index === 0 ? '<div class="top-seller-badge">🏆 #1 Best Seller</div>' : ''}
        </div>
      `).join('')}
    </div>
  `;
}

function renderTestimonials() {
  return `
    <div class="testimonials-section">
      <div class="section-header">
        <div style="display: flex; align-items: center;">
          <div class="section-icon">💬</div>
          <h2 class="section-title">What Customers Say</h2>
        </div>
        <span class="stat-change">⭐ ${state.restaurantProfile.starRating}/5 average rating</span>
      </div>
      <div class="testimonials-grid">
        ${state.testimonials.map(testimonial => {
          const initials = testimonial.author.split(' ').map(n => n[0]).join('');
          return `
            <div class="testimonial-card">
              <div class="testimonial-quote">"${testimonial.quote}"</div>
              <div class="testimonial-author">
                <div class="testimonial-avatar">${initials}</div>
                <div class="testimonial-name">${testimonial.author}</div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function renderStaffSection() {
  return `
    <div class="section-header">
      <div style="display: flex; align-items: center;">
        <div class="section-icon">👨‍🍳</div>
        <h2 class="section-title">Your Team</h2>
      </div>
      <span class="stat-change">🌟 All hands on deck</span>
    </div>
    <div class="staff-grid">
      ${state.staffTeam.map(staff => `
        <div class="staff-card">
          <div class="staff-avatar">${staff.role === 'Chef' ? '👨‍🍳' : '👔'}</div>
          <div class="staff-name">${staff.name}</div>
          <div class="staff-role">${staff.role}</div>
          <div class="staff-status">${staff.status}</div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderStatsCards() {
  return `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-label">TODAY'S CALLS</span>
          <div class="stat-icon purple">📞</div>
        </div>
        <div class="stat-value">${state.stats.todayCalls}</div>
        <div class="stat-change">↑ 12% from yesterday</div>
      </div>
      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-label">ACTIVE CALLS</span>
          <div class="stat-icon teal pulse">📞</div>
        </div>
        <div class="stat-value">${state.stats.activeCalls}</div>
        <div class="stat-change">Live now</div>
      </div>
      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-label">ORDERS PLACED</span>
          <div class="stat-icon orange">📦</div>
        </div>
        <div class="stat-value">${state.stats.ordersPlaced}</div>
        <div class="stat-change">↑ 8% from yesterday</div>
      </div>
      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-label">TODAY'S REVENUE</span>
          <div class="stat-icon green">💰</div>
        </div>
        <div class="stat-value">${formatCurrency(state.stats.todayRevenue)}</div>
        <div class="stat-change">AUD inc. GST</div>
      </div>
    </div>
  `;
}

function renderCallsList() {
  return `
    <div class="section-header">
      <div style="display: flex; align-items: center;">
        <div class="section-icon">📞</div>
        <h2 class="section-title">Live Calls</h2>
      </div>
      <span class="stat-change">🔴 Real-time monitoring</span>
    </div>
    <div class="calls-list">
      ${state.calls.map(call => `
        <div class="call-card" onclick="showCallDetails('${call.id}')">
          <div class="call-header">
            <div>
              <span class="call-id">${call.customerName || 'Call ' + call.id}</span>
              ${call.customerContext ? `<div style="font-size: var(--font-size-xs); color: var(--color-text-secondary); margin-top: 4px;">${call.customerContext}</div>` : ''}
              <div class="talkbyte-badge" style="margin-top: 6px;">
                ${TALKBYTE_LOGO_SMALL}
                <span>Managed by Talkbyte</span>
              </div>
            </div>
            <span class="call-status-badge ${getStatusClass(call.status)}">
              ${getStatusLabel(call.status)}
            </span>
          </div>
          <div class="call-details">
            <div class="call-detail">
              <span class="call-detail-label">Phone</span>
              <span class="call-detail-value">${call.phone}</span>
            </div>
            <div class="call-detail">
              <span class="call-detail-label">Duration</span>
              <span class="call-detail-value">${formatDuration(call.duration)}</span>
            </div>
            <div class="call-detail">
              <span class="call-detail-label">Action</span>
              <span class="call-detail-value">${call.action}</span>
            </div>
            <div class="call-detail">
              <span class="call-detail-label">Confidence</span>
              <span class="call-detail-value">${(call.confidence * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderOrdersList() {
  return `
    <div class="section-header">
      <div style="display: flex; align-items: center;">
        <div class="section-icon">📦</div>
        <h2 class="section-title">Order Queue</h2>
      </div>
      <span class="stat-change">📊 ${state.orders.length} orders today</span>
    </div>
    <div class="orders-grid">
      ${state.orders.map(order => `
        <div class="order-card" onclick="showOrderDetails('${order.id}')">
          <div class="order-header">
            <div>
              <span class="order-id">Order #${order.id}</span>
              ${order.status === 'PAYMENT_CONFIRMED' ? `<div class="talkbyte-badge" style="margin-top: 6px;">${TALKBYTE_LOGO_SMALL}<span>Talkbyte Verified ✓</span></div>` : ''}
            </div>
            <span class="order-time">${order.time}</span>
          </div>
          <div class="order-items">
            ${order.items.map(item => `
              <div class="order-item">${item.quantity}x ${item.name}</div>
            `).join('')}
          </div>
          <div class="order-footer">
            <span class="order-total">${formatCurrency(order.total)}</span>
            <span class="order-status-badge ${getStatusClass(order.status)}">
              ${getStatusLabel(order.status)}
            </span>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderAnalytics() {
  return `
    <div class="section-header">
      <div style="display: flex; align-items: center;">
        <div class="section-icon">📊</div>
        <h2 class="section-title">Analytics Dashboard</h2>
      </div>
      <button class="btn btn-primary" style="width: auto; padding: 8px 16px;">📥 Export Report</button>
    </div>
    <div class="analytics-grid">
      <div class="analytics-card">
        <div class="stat-label">CALL SUCCESS RATE</div>
        <div class="stat-value">83%</div>
        <div class="stat-change">20 of 24 calls completed</div>
      </div>
      <div class="analytics-card">
        <div class="stat-label">AVG ORDER VALUE</div>
        <div class="stat-value">$26.97</div>
        <div class="stat-change">AUD inc. GST</div>
      </div>
      <div class="analytics-card">
        <div class="stat-label">AVG CALL DURATION</div>
        <div class="stat-value">2:18</div>
        <div class="stat-change">Minutes:Seconds</div>
      </div>
    </div>
    <div class="chart-container">
      <canvas id="callVolumeChart"></canvas>
    </div>
    <div class="chart-container">
      <canvas id="orderStatusChart"></canvas>
    </div>
  `;
}

function renderMenu() {
  return `
    <div class="section-header">
      <div style="display: flex; align-items: center;">
        <div class="section-icon">🍽️</div>
        <h2 class="section-title">Menu Management</h2>
      </div>
      <button class="btn btn-primary" style="width: auto; padding: 8px 16px;">➕ Add Item</button>
    </div>
    <div class="menu-grid">
      ${state.menuItems.map(category => `
        <div class="menu-category">
          <h3 class="category-title">${category.category}</h3>
          <div class="menu-items">
            ${category.items.map((item, idx) => `
              <div class="menu-item">
                <div>
                  <span class="menu-item-name">${item.name}</span>
                </div>
                <div style="display: flex; gap: 16px; align-items: center;">
                  <span class="menu-item-price">${formatCurrency(item.price)}</span>
                  <button class="availability-toggle ${item.available ? 'available' : 'unavailable'}" 
                          onclick="toggleAvailability('${category.category}', ${idx})">
                    ${item.available ? 'Available' : 'Unavailable'}
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderSettings() {
  return `
    <div class="section-header">
      <div style="display: flex; align-items: center;">
        <div class="section-icon">⚙️</div>
        <h2 class="section-title">Settings</h2>
      </div>
    </div>
    <div class="settings-grid">
      <div class="settings-card">
        <h3 class="settings-title">🏪 Restaurant Profile</h3>
        <div class="settings-row">
          <span class="settings-label">Name</span>
          <span class="settings-value">Mama's Pizzeria</span>
        </div>
        <div class="settings-row">
          <span class="settings-label">Location</span>
          <span class="settings-value">Newtown, Sydney NSW 2042</span>
        </div>
        <div class="settings-row">
          <span class="settings-label">Phone</span>
          <span class="settings-value">+61 2 9999 0001</span>
        </div>
        <div class="settings-row">
          <span class="settings-label">Business Hours</span>
          <span class="settings-value">11am - 10pm Mon-Sun</span>
        </div>
      </div>
      <div class="settings-card">
        <h3 class="settings-title">🔗 Integrations</h3>
        <div class="settings-row">
          <span class="settings-label">💳 Square POS</span>
          <span class="connection-status">
            <span class="status-dot"></span>
            Connected
          </span>
        </div>
        <div class="settings-row">
          <span class="settings-label">💰 Stripe Payments</span>
          <span class="connection-status">
            <span class="status-dot"></span>
            Connected
          </span>
        </div>
        <div class="settings-row">
          <span class="settings-label">🔑 API Key</span>
          <span class="settings-value">vp_live_••••••••••••3x7k</span>
        </div>
      </div>
    </div>
  `;
}

function renderCallModal() {
  if (!state.selectedCall) return '';
  const call = state.calls.find(c => c.id === state.selectedCall);
  if (!call) return '';

  return `
    <div class="modal-overlay" onclick="closeModal(event)">
      <div class="modal" onclick="event.stopPropagation()">
        <div class="modal-header">
          <h3 class="modal-title">Call ${call.id} - Transcript</h3>
          <button class="modal-close" onclick="closeModal()">&times;</button>
        </div>
        <div class="modal-body">
          <div style="margin-bottom: 16px;">
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 16px;">
              <div>
                <span class="call-detail-label">Phone</span><br>
                <span class="call-detail-value">${call.phone}</span>
              </div>
              <div>
                <span class="call-detail-label">Duration</span><br>
                <span class="call-detail-value">${formatDuration(call.duration)}</span>
              </div>
              <div>
                <span class="call-detail-label">Status</span><br>
                <span class="call-status-badge ${getStatusClass(call.status)}">
                  ${getStatusLabel(call.status)}
                </span>
              </div>
              <div>
                <span class="call-detail-label">Overall Confidence</span><br>
                <span class="call-detail-value">${(call.confidence * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
          <h4 style="margin-bottom: 16px; font-weight: 600;">Full Transcript</h4>
          ${call.fullTranscript.map(item => `
            <div class="transcript-item">
              <div class="transcript-time">${item.time}</div>
              <div class="transcript-text">${item.text}</div>
              <div class="confidence-bar">
                <div class="confidence-fill ${getConfidenceClass(item.confidence)}" 
                     style="width: ${item.confidence * 100}%"></div>
              </div>
              <div style="font-size: 11px; color: var(--color-text-secondary); margin-top: 4px;">
                Confidence: ${(item.confidence * 100).toFixed(0)}%
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderOrderModal() {
  if (!state.selectedOrder) return '';
  const order = state.orders.find(o => o.id === state.selectedOrder);
  if (!order) return '';

  const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const gst = subtotal * 0.1;

  return `
    <div class="modal-overlay" onclick="closeModal(event)">
      <div class="modal" onclick="event.stopPropagation()">
        <div class="modal-header">
          <h3 class="modal-title">Order #${order.id}</h3>
          <button class="modal-close" onclick="closeModal()">&times;</button>
        </div>
        <div class="modal-body">
          <div style="margin-bottom: 24px;">
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 16px;">
              <div>
                <span class="call-detail-label">Customer Phone</span><br>
                <span class="call-detail-value">${order.phone}</span>
              </div>
              <div>
                <span class="call-detail-label">Order Time</span><br>
                <span class="call-detail-value">${order.time}</span>
              </div>
              <div>
                <span class="call-detail-label">Payment Status</span><br>
                <span class="call-detail-value">${order.paymentStatus}</span>
              </div>
              <div>
                <span class="call-detail-label">Order Status</span><br>
                <span class="order-status-badge ${getStatusClass(order.status)}">
                  ${getStatusLabel(order.status)}
                </span>
              </div>
            </div>
          </div>
          <h4 style="margin-bottom: 12px; font-weight: 600;">Order Items</h4>
          <div style="background: var(--color-bg-1); padding: 16px; border-radius: 8px; margin-bottom: 16px;">
            ${order.items.map(item => `
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span>${item.quantity}x ${item.name}</span>
                <span style="font-weight: 600;">${formatCurrency(item.price * item.quantity)}</span>
              </div>
            `).join('')}
            <div style="border-top: 1px solid var(--color-border); margin-top: 12px; padding-top: 12px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span>Subtotal</span>
                <span>${formatCurrency(subtotal)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span>GST (10%)</span>
                <span>${formatCurrency(gst)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: 700;">
                <span>Total</span>
                <span>${formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>
          <div>
            <span class="call-detail-label">Special Instructions</span><br>
            <span class="call-detail-value">${order.specialInstructions}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderDashboard() {
  let content = '';
  
  switch(state.currentPage) {
    case 'dashboard':
      content = renderRestaurantHero() + 
                renderGreeting() + 
                renderAchievements() + 
                '<div style="margin-top: 32px;">' + renderCustomerConnection() + '</div>' +
                '<div style="margin-top: 32px;">' + renderTopDishes() + '</div>' +
                '<div style="margin-top: 32px;">' + renderStaffSection() + '</div>' +
                '<div style="margin-top: 32px;">' + renderTestimonials() + '</div>' +
                '<div style="margin-top: 32px;">' + renderStatsCards() + '</div>' +
                '<div style="margin-top: 32px;">' + renderCallsList() + '</div>';
      break;
    case 'calls':
      content = renderCallsList();
      break;
    case 'orders':
      content = renderOrdersList();
      break;
    case 'analytics':
      content = renderAnalytics();
      break;
    case 'menu':
      content = renderMenu();
      break;
    case 'settings':
      content = renderSettings();
      break;
  }

  return `
    <div class="dashboard">
      ${renderTopNav()}
      <div class="main-content">
        ${content}
      </div>
    </div>
    ${state.selectedCall ? renderCallModal() : ''}
    ${state.selectedOrder ? renderOrderModal() : ''}
  `;
}

function render() {
  const app = document.getElementById('app');
  if (state.isLoggedIn) {
    app.innerHTML = renderDashboard();
    if (state.currentPage === 'analytics') {
      setTimeout(initCharts, 100);
    }
  } else {
    app.innerHTML = renderLoginPage();
  }
}

// Event Handlers
function handleLogin(event) {
  event.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  if (email && password) {
    state.isLoggedIn = true;
    render();
    startSimulation();
  }
}

function handleDemoLogin() {
  document.getElementById('email').value = 'admin@mamaspizzeria.com.au';
  document.getElementById('password').value = 'demo123';
  state.isLoggedIn = true;
  render();
  startSimulation();
}

function navigateTo(page) {
  state.currentPage = page;
  render();
}

function toggleTheme() {
  state.isDarkMode = !state.isDarkMode;
  document.documentElement.setAttribute(
    'data-color-scheme',
    state.isDarkMode ? 'dark' : 'light'
  );
  render();
}

function showCallDetails(callId) {
  state.selectedCall = callId;
  render();
}

function showOrderDetails(orderId) {
  state.selectedOrder = orderId;
  render();
}

function closeModal(event) {
  if (!event || event.target.classList.contains('modal-overlay') || event.target.classList.contains('modal-close')) {
    state.selectedCall = null;
    state.selectedOrder = null;
    render();
  }
}

function toggleAvailability(category, itemIndex) {
  const cat = state.menuItems.find(c => c.category === category);
  if (cat && cat.items[itemIndex]) {
    cat.items[itemIndex].available = !cat.items[itemIndex].available;
    render();
  }
}

// Simulation Functions
function startSimulation() {
  // Update call durations
  setInterval(() => {
    // Enhanced call updates with customer context
    state.calls.forEach((call, idx) => {
      // Add customer names for better connection
      if (!call.customerName) {
        const customerNames = ['Sarah M.', 'Michael L.', 'Jessica K.', 'Tony R.', 'Emma S.'];
        call.customerName = customerNames[idx % customerNames.length];
        call.customerContext = idx === 0 ? 'Regular customer - 56 orders' : 
                              idx === 1 ? 'New customer - make great impression!' :
                              'Returning customer - 23 orders';
      }
    });
    
    state.calls.forEach(call => {
      if (call.status !== 'COMPLETED') {
        call.duration++;
      }
    });
    if (state.isLoggedIn && (state.currentPage === 'dashboard' || state.currentPage === 'calls')) {
      render();
    }
  }, 1000);

  // Simulate call status changes
  setInterval(() => {
    const statuses = ['INCOMING', 'LISTENING', 'SPEAKING', 'ORDER_CONFIRMATION', 'COMPLETED'];
    state.calls.forEach(call => {
      if (Math.random() > 0.7 && call.status !== 'COMPLETED') {
        const currentIndex = statuses.indexOf(call.status);
        if (currentIndex < statuses.length - 1) {
          call.status = statuses[currentIndex + 1];
          if (call.status === 'COMPLETED') {
            state.stats.todayCalls++;
            state.stats.activeCalls = Math.max(0, state.stats.activeCalls - 1);
          }
        }
      }
    });
    if (state.isLoggedIn) {
      render();
    }
  }, 8000);

  // Add new orders occasionally
  setInterval(() => {
    if (Math.random() > 0.7 && state.orders.length < 10) {
      const newOrderId = (parseInt(state.orders[0].id) + 1).toString();
      const newOrder = {
        id: newOrderId,
        items: [
          { name: 'Pizza Margherita', quantity: 1, price: 14.50 }
        ],
        total: 14.50,
        status: 'PENDING',
        time: new Date().toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true }),
        paymentStatus: 'Awaiting Payment',
        phone: '***-***-' + Math.floor(1000 + Math.random() * 9000),
        specialInstructions: 'None'
      };
      state.orders.unshift(newOrder);
      state.stats.ordersPlaced++;
      state.stats.todayRevenue += newOrder.total;
      if (state.isLoggedIn) {
        render();
      }
    }
  }, 15000);
}

// Chart initialization
function initCharts() {
  // Call Volume Chart
  const callVolumeCtx = document.getElementById('callVolumeChart');
  if (callVolumeCtx) {
    new Chart(callVolumeCtx, {
      type: 'bar',
      data: {
        labels: ['11am', '12pm', '1pm', '2pm', '3pm', '4pm', '5pm'],
        datasets: [{
          label: 'Calls',
          data: [2, 5, 4, 6, 3, 7, 8],
          backgroundColor: '#21808d',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: 'Call Volume by Hour',
            font: { size: 16, weight: '600' }
          }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }

  // Order Status Chart
  const orderStatusCtx = document.getElementById('orderStatusChart');
  if (orderStatusCtx) {
    new Chart(orderStatusCtx, {
      type: 'doughnut',
      data: {
        labels: ['Completed', 'Preparing', 'Pending'],
        datasets: [{
          data: [12, 4, 2],
          backgroundColor: ['#21808d', '#a84b2f', '#c0152f']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' },
          title: {
            display: true,
            text: 'Order Status Breakdown',
            font: { size: 16, weight: '600' }
          }
        }
      }
    });
  }
}

// Initialize app
render();