# Amrit Dhara — "Pure Water. Delivered Smarter."

Welcome to **Amrit Dhara**, a production-ready, enterprise-grade full-stack digital platform for managing drinking water delivery, recurring subscriptions, customer credit (outstanding balance tracking), and logistics operations. 

This platform digitizes the entire supply chain workflow, empowering customers, retail store managers, delivery riders, and administrators through a highly polished, responsive interface.

---

## 🚀 Key Features

### 1. Unified Multitenant Persona Workspace
Instantly switch between four business roles to test and operate different levels of the application:
*   👤 **Customer Persona**: Custom catalog shopping, real-time lightning delivery tracking, coupon calculations (`AMRIT50`, `WELCOME20`), and alternate-day subscriptions management.
*   🏪 **Retailer Persona**: Automatically applies wholesale bulk-order discounts (e.g., ₹30 per 20L bottle instead of ₹35) and supports large credit-line outstanding balances.
*   🚚 **Delivery Rider Persona**: Provides a dedicated mobile-friendly list of assigned orders, status toggles, and integrated verification (electronic signature and geo-tagged photo uploads).
*   🏢 **Admin Command Center**: Real-time sales metrics, uncollected outstanding customer due ledgers, interactive revenue trends, and catalog product creation.

### 2. Automated Subscription Engine
Enables households and companies to schedule deliveries:
*   Options: Daily, Alternate Days, Weekly, or Monthly.
*   Single-tap Vacation Pause & Skip Tomorrow controls.

### 3. Credit Line & Outstanding Settlement
*   Automated "Pay Later" ledger to let trusted retailers order water bottles on interest-free credit lines.
*   Interactive settlement interface simulating live UPI/Paytm/PhonePe gateway integration.

### 4. Google Gemini AI Insights
Integrated server-side via the modern `@google/genai` SDK to:
*   Predict future water can demand based on actual consumer purchase habits.
*   Formulate personalized promotional coupon strategy recommendations.

---

## 🛠️ Tech Stack & Architecture

*   **Frontend**: React 19, TypeScript, Tailwind CSS, Recharts (for dynamic admin reports and revenue trends), Lucide icons.
*   **Backend API**: Node.js, Express.js with robust routing.
*   **Gemini AI integration**: Server-side client proxy via `@google/genai` to secure private API credentials completely.
*   **Local DB Persistence**: Encapsulated state tracker saving data directly to a local file system (`data.json`) across reloads.
*   **Build System**: High-speed bundling using `Vite` for client-side assets and `esbuild` for Node server files.

---

## 🗄️ Database Schemas (MongoDB Atlas Blueprint)

The backend handles the business logic for the following collections, which are fully modeled in `/server.ts` and synced dynamically:

### 1. Users
```typescript
interface User {
  id: string;          // Primary Key
  name: string;
  email: string;       // Unique Key
  phone: string;
  role: 'customer' | 'admin' | 'delivery' | 'retailer';
  address: string;
  outstandingBalance: number;
  monthlySpending: number;
  totalPurchases: number;
}
```

### 2. Products
```typescript
interface Product {
  id: string;          // Primary Key
  name: string;
  category: string;
  price: number;
  image: string;
  description: string;
  stock: number;
  rating: number;
  reviewsCount: number;
  isAvailable: boolean;
}
```

### 3. Orders
```typescript
interface Order {
  id: string;          // Primary Key
  customerId: string;  // Foreign Key -> Users
  customerName: string;
  products: {
    productId: string;
    name: string;
    price: number;
    quantity: number;
  }[];
  subtotal: number;
  deliveryCharge: number;
  tax: number;
  total: number;
  status: 'Pending' | 'Confirmed' | 'Preparing' | 'Out For Delivery' | 'Delivered' | 'Cancelled';
  paymentStatus: 'Paid' | 'Outstanding' | 'Pending';
  paymentMethod: string;
  address: string;
  preferredTime: string;
  createdAt: string;
  assignedDeliveryPartner?: string;
}
```

### 4. Subscriptions
```typescript
interface Subscription {
  id: string;          // Primary Key
  customerId: string;  // Foreign Key -> Users
  productName: string;
  price: number;
  quantity: number;
  plan: 'Daily' | 'Alternate Day' | 'Weekly' | 'Monthly';
  status: 'Active' | 'Paused';
  startDate: string;
  paused: boolean;
  skips: string[];
}
```

---

## ⚙️ Environment Variables (`.env.example`)

Document and configure the following inside `.env`:
```env
# Required for Amrit Dhara server-side Gemini analytical reports
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"

# Public hosting address
APP_URL="http://localhost:3000"
```

---

## 📦 Getting Started & Local Development

### Prerequisites
*   Node.js v20 or higher
*   NPM v10+

### Installation
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server (runs Express server and handles hot-reloaded Vite client on port 3000):
   ```bash
   npm run dev
   ```

### Production Build
1. Build the static React distribution files and bundle the backend using esbuild:
   ```bash
   npm run build
   ```
2. Launch the production bundle:
   ```bash
   npm run start
   ```

### Docker deployment
1. Build the production image:
   ```bash
   docker build -t amritdhara .
   ```
2. Start the container on port 3000:
   ```bash
   docker run -p 3000:3000 --env GEMINI_API_KEY="your_api_key" amritdhara
   ```

---

## 🎨 Visual Identity & Brand Styling
*   **Colors**: Modern ocean gradients combined with slate grays and white card layers.
*   **Typography**: Highly structured layouts featuring spacious borders, rounded shapes, and readable sans-serif pairings.
*   **Feedback**: Instant toast banners mapping successes, errors, and system events.
