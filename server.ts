import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, 'data.json');

// Initialize Gemini SDK securely on server side
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  } catch (err) {
    console.error('Failed to initialize Gemini AI:', err);
  }
}

// Initial Mock Seed Data
const initialData = {
  products: [
    {
      id: 'prod-1',
      name: 'Amrit Premium 20L Water Can',
      category: '20L Water Bottle',
      price: 35,
      image: 'https://images.unsplash.com/photo-1608889175123-8ec330b86f84?auto=format&fit=crop&q=80&w=600',
      description: 'Pristine, multi-barrier filtered 20L drinking water jar, purified at source in our state-of-the-art facility. Packed in BPA-free food-grade cans under absolute sterile conditions.',
      stock: 120,
      rating: 4.8,
      reviewsCount: 42,
      isAvailable: true
    },
    {
      id: 'prod-bulk-home',
      name: 'Bulk Order: 10 x 20L Water Jars (For Homes & Offices)',
      category: '20L Water Bottle',
      price: 330,
      image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&q=80&w=600',
      description: 'Prepaid bulk supply of 10 x 20L premium jars for residential spaces and small business settings. Freshly purified, packaged, and delivered directly with zero deposit fees.',
      stock: 80,
      rating: 4.9,
      reviewsCount: 12,
      isAvailable: true
    },
    {
      id: 'prod-bulk-office',
      name: 'Bulk Order: 25 x 20L Water Jars (For Offices & Functions)',
      category: '20L Water Bottle',
      price: 750,
      image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=600',
      description: 'Designed for corporate spaces, cafeterias, parties, and office complexes. Bundle of 25 x 20L cans directly processed in our plant and delivered with custom stand placement.',
      stock: 50,
      rating: 4.7,
      reviewsCount: 21,
      isAvailable: true
    },
    {
      id: 'prod-bulk-event',
      name: 'Bulk Order: 50 x 20L Water Jars (For Weddings & Events)',
      category: '20L Water Bottle',
      price: 1400,
      image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=600',
      description: 'Premium event hydration solution for weddings, large parties, and community gatherings. Pure 50 x 20L cans, including on-site logistics setup and prompt can collection post-event.',
      stock: 30,
      rating: 4.9,
      reviewsCount: 16,
      isAvailable: true
    }
  ],
  customers: [
    {
      id: 'cust-1',
      name: 'SK Kausik',
      email: 'kausik1027@gmail.com',
      phone: '9876543210',
      role: 'customer',
      address: 'Plot 12, High School Road, Atalapur, Jajpur, Odisha - 755009',
      outstandingBalance: 140,
      monthlySpending: 385,
      totalPurchases: 11
    },
    {
      id: 'cust-2',
      name: 'Subham Gupta (Bhojanalaya)',
      email: 'subham.bhoj@gmail.com',
      phone: '9830012345',
      role: 'customer',
      address: 'Main Bazaar Road, Atalapur, Jajpur, Odisha - 755009',
      outstandingBalance: 735,
      monthlySpending: 2100,
      totalPurchases: 60
    },
    {
      id: 'cust-3',
      name: 'Priyanka Sharma',
      email: 'priyanka.sharma@outlook.com',
      phone: '9822114455',
      role: 'customer',
      address: 'Green Park Colony, Jajpur, Odisha - 755009',
      outstandingBalance: 0,
      monthlySpending: 245,
      totalPurchases: 7
    }
  ],
  orders: [
    {
      id: 'ord-101',
      customerId: 'cust-1',
      customerName: 'SK Kausik',
      products: [
        { productId: 'prod-1', name: 'Amrit Premium 20L Water Can', price: 35, quantity: 4 }
      ],
      subtotal: 140,
      deliveryCharge: 0,
      tax: 0,
      total: 140,
      status: 'Delivered',
      paymentStatus: 'Outstanding',
      paymentMethod: 'Pay Later',
      address: 'Plot 12, High School Road, Atalapur, Jajpur, Odisha - 755009',
      preferredTime: 'Morning (08:00 AM - 11:00 AM)',
      createdAt: '2026-06-25T09:30:00Z',
      assignedDeliveryPartner: 'Self Delivery'
    },
    {
      id: 'ord-102',
      customerId: 'cust-1',
      customerName: 'SK Kausik',
      products: [
        { productId: 'prod-1', name: 'Amrit Premium 20L Water Can', price: 35, quantity: 2 }
      ],
      subtotal: 70,
      deliveryCharge: 0,
      tax: 0,
      total: 70,
      status: 'Out For Delivery',
      paymentStatus: 'Paid',
      paymentMethod: 'UPI',
      address: 'Plot 12, High School Road, Atalapur, Jajpur, Odisha - 755009',
      preferredTime: 'Afternoon (12:00 PM - 03:00 PM)',
      createdAt: '2026-06-28T14:15:00Z',
      assignedDeliveryPartner: 'Self Delivery'
    },
    {
      id: 'ord-103',
      customerId: 'cust-2',
      customerName: 'Subham Gupta (Bhojanalaya)',
      products: [
        { productId: 'prod-1', name: 'Amrit Premium 20L Water Can', price: 35, quantity: 21 }
      ],
      subtotal: 735,
      deliveryCharge: 0,
      tax: 0,
      total: 735,
      status: 'Confirmed',
      paymentStatus: 'Outstanding',
      paymentMethod: 'Pay Later',
      address: 'Main Bazaar Road, Atalapur, Jajpur, Odisha - 755009',
      preferredTime: 'Morning (08:00 AM - 11:00 AM)',
      createdAt: '2026-06-28T18:40:00Z',
      assignedDeliveryPartner: 'Self Delivery'
    }
  ],
  subscriptions: [
    {
      id: 'sub-201',
      customerId: 'cust-1',
      productName: 'Amrit Premium 20L Water Bottle',
      price: 35,
      quantity: 1,
      plan: 'Daily',
      status: 'Active',
      startDate: '2026-06-01',
      paused: false,
      skips: []
    },
    {
      id: 'sub-202',
      customerId: 'cust-2',
      productName: 'Amrit Premium 20L Water Bottle',
      price: 35,
      quantity: 5,
      plan: 'Alternate Day',
      status: 'Active',
      startDate: '2026-06-10',
      paused: false,
      skips: []
    }
  ],
  payments: [
    {
      id: 'pay-301',
      customerId: 'cust-1',
      amount: 140,
      paymentMethod: 'Pay Later (Outstanding)',
      status: 'Completed',
      orderId: 'ord-101',
      date: '2026-06-25T09:35:00Z'
    },
    {
      id: 'pay-302',
      customerId: 'cust-1',
      amount: 469,
      paymentMethod: 'UPI (GPay)',
      status: 'Completed',
      orderId: 'ord-102',
      date: '2026-06-28T14:16:00Z'
    }
  ],
  deliveryPartners: [
    { id: 'dp-1', name: 'Ramesh Kumar', phone: '9000011111', status: 'Active', vehicle: 'Eco Carry Auto', rating: 4.9, location: { lat: 22.5726, lng: 88.3639 } },
    { id: 'dp-2', name: 'Vikram Singh', phone: '9000022222', status: 'Idle', vehicle: 'Super Load Electric', rating: 4.8, location: { lat: 22.5697, lng: 88.3698 } },
    { id: 'dp-3', name: 'Ankit Sharma', phone: '9000033333', status: 'Active', vehicle: 'Eco Carry Auto', rating: 4.7, location: { lat: 22.5812, lng: 88.3514 } }
  ],
  reviews: [
    { id: 'rev-1', productId: 'prod-1', userName: 'Arun Chatterjee', rating: 5, comment: 'Pristine taste. Delivery is always spot on time in the morning. No need to follow up at all.', date: '2026-06-20' },
    { id: 'rev-2', productId: 'prod-1', userName: 'Maya Sen', rating: 5, comment: 'The app subscriptions are incredibly handy. Paused on my holiday without calling anyone.', date: '2026-06-24' }
  ],
  coupons: [
    { code: 'AMRIT50', discountType: 'fixed', value: 50, minOrder: 300, active: true },
    { code: 'WELCOME20', discountType: 'percentage', value: 20, minOrder: 100, active: true },
    { code: 'FREEDELIVERY', discountType: 'fixed', value: 20, minOrder: 50, active: true }
  ]
};

// JSON Database Helper
function readDB() {
  const getSeedUsers = () => [
    { id: 'user-papan', email: 'papan@amritdhara.com', name: 'Mr. Papan', password: 'password123', role: 'retailer' },
    { id: 'user-retailer', email: 'retailer@amritdhara.com', name: 'Retailer Admin', password: 'password123', role: 'retailer' },
    { id: 'user-kausik', email: 'kausik1027@gmail.com', name: 'SK Kausik', password: 'password123', role: 'customer', customerId: 'cust-1' },
    { id: 'user-subham', email: 'subham.bhoj@gmail.com', name: 'Subham Gupta (Bhojanalaya)', password: 'password123', role: 'customer', customerId: 'cust-2' },
    { id: 'user-priyanka', email: 'priyanka.sharma@outlook.com', name: 'Priyanka Sharma', password: 'password123', role: 'customer', customerId: 'cust-3' },
  ];

  if (!fs.existsSync(DATA_FILE)) {
    const defaultDb = { ...initialData, settings: { lowStockThreshold: 20 }, users: getSeedUsers() };
    fs.writeFileSync(DATA_FILE, JSON.stringify(defaultDb, null, 2));
    return defaultDb;
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!parsed.settings) {
      parsed.settings = { lowStockThreshold: 20 };
    }
    if (!parsed.users) {
      parsed.users = getSeedUsers();
      fs.writeFileSync(DATA_FILE, JSON.stringify(parsed, null, 2));
    }
    return parsed;
  } catch (err) {
    console.error('Error reading DB, resetting to defaults', err);
    return { ...initialData, settings: { lowStockThreshold: 20 }, users: getSeedUsers() };
  }
}

function writeDB(data: any) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing DB', err);
  }
}

function checkProductStockAndNotify(db: any, product: any) {
  const threshold = db.settings?.lowStockThreshold ?? 20;
  if (product.stock < threshold) {
    if (!db.notifications) {
      db.notifications = [];
    }
    const alreadyNotified = db.notifications.some((n: any) => n.type === 'low_stock' && n.productId === product.id && n.unread);
    if (!alreadyNotified) {
      db.notifications.unshift({
        id: `notif-stock-${product.id}-${Date.now()}`,
        type: 'low_stock',
        message: `Alert: Product "${product.name}" has fallen below stock threshold. Only ${product.stock} units remaining (Threshold is ${threshold} units).`,
        productId: product.id,
        customerName: 'System Inventory',
        total: 0,
        paymentMethod: 'N/A',
        paymentStatus: 'N/A',
        timestamp: new Date().toISOString(),
        unread: true
      });
    }
  } else {
    // If stock is replenished above or equal to threshold, automatically resolve/mark related low stock warnings as read!
    if (db.notifications) {
      db.notifications.forEach((n: any) => {
        if (n.type === 'low_stock' && n.productId === product.id) {
          n.unread = false;
        }
      });
    }
  }
}

const app = express();
app.use(express.json());

// Authentication Routes
const AUTHORIZED_RETAILERS = ['papan@amritdhara.com', 'retailer@amritdhara.com', 'admin@amritdhara.com'];

app.post('/api/auth/register', (req, res) => {
  const db = readDB();
  const { name, email, password, phone, address } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required' });
  }

  const emailLower = email.toLowerCase().trim();
  const existingUser = db.users.find((u: any) => u.email.toLowerCase().trim() === emailLower);
  if (existingUser) {
    return res.status(400).json({ message: 'An account with this email already exists' });
  }

  const isRetailer = AUTHORIZED_RETAILERS.includes(emailLower);
  const role = isRetailer ? 'retailer' : 'customer';

  let customerId = undefined;
  if (role === 'customer') {
    // Check if there is an existing customer record matching this email
    const existingCustomer = db.customers.find((c: any) => c.email.toLowerCase().trim() === emailLower);
    if (existingCustomer) {
      customerId = existingCustomer.id;
    } else {
      // Create new customer record
      const newCustId = `cust-${Date.now()}`;
      const newCustomer = {
        id: newCustId,
        name,
        email: emailLower,
        phone: phone || '',
        role: 'customer',
        address: address || '',
        outstandingBalance: 0,
        monthlySpending: 0,
        totalPurchases: 0
      };
      db.customers.push(newCustomer);
      customerId = newCustId;
    }
  }

  const newUser = {
    id: `user-${Date.now()}`,
    name,
    email: emailLower,
    password,
    role,
    customerId
  };

  db.users.push(newUser);
  writeDB(db);

  res.json({
    success: true,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      customerId: newUser.customerId
    }
  });
});

app.post('/api/auth/login', (req, res) => {
  const db = readDB();
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const emailLower = email.toLowerCase().trim();
  const user = db.users.find((u: any) => u.email.toLowerCase().trim() === emailLower && u.password === password);

  if (!user) {
    return res.status(400).json({ message: 'Invalid email or password' });
  }

  res.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      customerId: user.customerId
    }
  });
});

// API ENDPOINTS

// 0. SETTINGS
app.get('/api/settings', (req, res) => {
  const db = readDB();
  res.json(db.settings || { lowStockThreshold: 20 });
});

app.post('/api/settings', (req, res) => {
  const db = readDB();
  db.settings = {
    ...db.settings,
    ...req.body
  };
  // Re-run stock check on all existing products when threshold settings change
  db.products.forEach((p: any) => {
    checkProductStockAndNotify(db, p);
  });
  writeDB(db);
  res.json(db.settings);
});

// 1. PRODUCTS
app.get('/api/products', (req, res) => {
  const db = readDB();
  res.json(db.products);
});

app.post('/api/products', (req, res) => {
  const db = readDB();
  const newProd = {
    id: `prod-${Date.now()}`,
    rating: 5.0,
    reviewsCount: 0,
    isAvailable: true,
    ...req.body
  };
  db.products.push(newProd);
  checkProductStockAndNotify(db, newProd);
  writeDB(db);
  res.status(201).json(newProd);
});

app.put('/api/products/:id', (req, res) => {
  const db = readDB();
  const idx = db.products.findIndex((p: any) => p.id === req.params.id);
  if (idx !== -1) {
    db.products[idx] = { ...db.products[idx], ...req.body };
    checkProductStockAndNotify(db, db.products[idx]);
    writeDB(db);
    res.json(db.products[idx]);
  } else {
    res.status(404).json({ error: 'Product not found' });
  }
});

app.delete('/api/products/:id', (req, res) => {
  const db = readDB();
  db.products = db.products.filter((p: any) => p.id !== req.params.id);
  writeDB(db);
  res.json({ success: true });
});

// 2. ORDERS
app.get('/api/orders', (req, res) => {
  const db = readDB();
  const { customerId } = req.query;
  if (customerId) {
    return res.json(db.orders.filter((o: any) => o.customerId === customerId));
  }
  res.json(db.orders);
});

app.post('/api/orders', (req, res) => {
  const db = readDB();
  const orderData = req.body;
  
  const newOrder = {
    id: `ord-${Math.floor(100 + Math.random() * 900)}`,
    status: 'Pending',
    createdAt: new Date().toISOString(),
    assignedDeliveryPartner: db.deliveryPartners[Math.floor(Math.random() * db.deliveryPartners.length)].name,
    ...orderData
  };

  db.orders.unshift(newOrder);

  // If order is pay later, adjust outstanding balance
  if (newOrder.paymentStatus === 'Outstanding' || newOrder.paymentMethod === 'Pay Later') {
    const custIdx = db.customers.findIndex((c: any) => c.id === newOrder.customerId);
    if (custIdx !== -1) {
      db.customers[custIdx].outstandingBalance += newOrder.total;
    }
  }

  // Record spending metric
  const custIdx = db.customers.findIndex((c: any) => c.id === newOrder.customerId);
  if (custIdx !== -1) {
    db.customers[custIdx].monthlySpending += newOrder.total;
    db.customers[custIdx].totalPurchases += newOrder.products.reduce((acc: number, p: any) => acc + (p.quantity || 1), 0);
  }

  // Create payment log entry
  db.payments.push({
    id: `pay-${Date.now()}`,
    customerId: newOrder.customerId,
    amount: newOrder.total,
    paymentMethod: newOrder.paymentMethod,
    status: newOrder.paymentStatus === 'Paid' ? 'Completed' : 'Pending',
    orderId: newOrder.id,
    date: new Date().toISOString()
  });

  // Deduct stock levels and check for automated stock alerts
  newOrder.products.forEach((p: any) => {
    const pIdx = db.products.findIndex((prod: any) => prod.id === p.productId);
    if (pIdx !== -1) {
      db.products[pIdx].stock = Math.max(0, db.products[pIdx].stock - p.quantity);
      checkProductStockAndNotify(db, db.products[pIdx]);
    }
  });

  // Create automatic merchant/admin real-time notification
  if (!db.notifications) {
    db.notifications = [];
  }
  db.notifications.unshift({
    id: `notif-${Date.now()}`,
    type: 'new_order',
    message: `New Order #${newOrder.id} placed by ${newOrder.customerName}`,
    orderId: newOrder.id,
    customerName: newOrder.customerName,
    total: newOrder.total,
    paymentMethod: newOrder.paymentMethod,
    paymentStatus: newOrder.paymentStatus,
    timestamp: new Date().toISOString(),
    unread: true
  });

  writeDB(db);
  res.status(201).json(newOrder);
});

app.put('/api/orders/:id', (req, res) => {
  const db = readDB();
  const idx = db.orders.findIndex((o: any) => o.id === req.params.id);
  if (idx !== -1) {
    db.orders[idx] = { ...db.orders[idx], ...req.body };
    writeDB(db);
    res.json(db.orders[idx]);
  } else {
    res.status(404).json({ error: 'Order not found' });
  }
});

// 3. SUBSCRIPTIONS
app.get('/api/subscriptions', (req, res) => {
  const db = readDB();
  const { customerId } = req.query;
  if (customerId) {
    return res.json(db.subscriptions.filter((s: any) => s.customerId === customerId));
  }
  res.json(db.subscriptions);
});

app.post('/api/subscriptions', (req, res) => {
  const db = readDB();
  const newSub = {
    id: `sub-${Math.floor(200 + Math.random() * 800)}`,
    status: 'Active',
    paused: false,
    skips: [],
    ...req.body
  };
  db.subscriptions.unshift(newSub);
  writeDB(db);
  res.status(201).json(newSub);
});

app.put('/api/subscriptions/:id', (req, res) => {
  const db = readDB();
  const idx = db.subscriptions.findIndex((s: any) => s.id === req.params.id);
  if (idx !== -1) {
    db.subscriptions[idx] = { ...db.subscriptions[idx], ...req.body };
    writeDB(db);
    res.json(db.subscriptions[idx]);
  } else {
    res.status(404).json({ error: 'Subscription not found' });
  }
});

app.delete('/api/subscriptions/:id', (req, res) => {
  const db = readDB();
  db.subscriptions = db.subscriptions.filter((s: any) => s.id !== req.params.id);
  writeDB(db);
  res.json({ success: true });
});

// 4. OUTSTANDING/PAYMENTS
app.get('/api/customers', (req, res) => {
  const db = readDB();
  res.json(db.customers);
});

app.get('/api/payments', (req, res) => {
  const db = readDB();
  res.json(db.payments);
});

app.post('/api/payments/settle-due', (req, res) => {
  const db = readDB();
  const { customerId, amount, method } = req.body;
  const custIdx = db.customers.findIndex((c: any) => c.id === customerId);
  
  if (custIdx !== -1) {
    const previousDue = db.customers[custIdx].outstandingBalance;
    db.customers[custIdx].outstandingBalance = Math.max(0, previousDue - amount);
    
    // Add real payment log
    const paymentId = `pay-${Date.now()}`;
    db.payments.push({
      id: paymentId,
      customerId,
      amount,
      paymentMethod: method || 'UPI',
      status: 'Completed',
      orderId: 'Settle Due',
      date: new Date().toISOString(),
      transactionRef: req.body.transactionRef || ''
    });

    // Mark outstanding orders as paid if possible
    let creditReduction = amount;
    db.orders.forEach((o: any) => {
      if (o.customerId === customerId && o.paymentStatus === 'Outstanding' && creditReduction > 0) {
        if (o.total <= creditReduction) {
          o.paymentStatus = 'Paid';
          creditReduction -= o.total;
        } else {
          creditReduction = 0;
        }
      }
    });

    writeDB(db);
    res.json({ success: true, newBalance: db.customers[custIdx].outstandingBalance });
  } else {
    res.status(404).json({ error: 'Customer not found' });
  }
});

// 5. COUPONS
app.get('/api/coupons', (req, res) => {
  const db = readDB();
  res.json(db.coupons);
});

// 5.1. NOTIFICATIONS FOR MERCHANT/ADMIN
app.get('/api/notifications', (req, res) => {
  const db = readDB();
  if (!db.notifications) {
    db.notifications = [];
  }
  res.json(db.notifications);
});

app.post('/api/notifications/read', (req, res) => {
  const db = readDB();
  if (!db.notifications) {
    db.notifications = [];
  }
  db.notifications.forEach((n: any) => {
    n.unread = false;
  });
  writeDB(db);
  res.json({ success: true });
});

app.post('/api/notifications/clear', (req, res) => {
  const db = readDB();
  db.notifications = [];
  writeDB(db);
  res.json({ success: true });
});

// 6. ANALYTICS
app.get('/api/analytics', (req, res) => {
  const db = readDB();
  
  const totalRevenue = db.payments
    .filter((p: any) => p.status === 'Completed')
    .reduce((sum: number, p: any) => sum + p.amount, 0);

  const outstandingBalance = db.customers.reduce((sum: number, c: any) => sum + c.outstandingBalance, 0);
  const pendingDeliveries = db.orders.filter((o: any) => o.status !== 'Delivered' && o.status !== 'Cancelled').length;
  
  // Calculate total stock and low stock warnings based on configured threshold
  const lowStockThreshold = db.settings?.lowStockThreshold ?? 20;
  const lowStockProducts = db.products.filter((p: any) => p.stock < lowStockThreshold).length;

  // Revenue chart (by date of payments)
  const revenueHistory: { [key: string]: number } = {};
  db.payments.forEach((p: any) => {
    if (p.status === 'Completed') {
      const date = p.date.split('T')[0];
      revenueHistory[date] = (revenueHistory[date] || 0) + p.amount;
    }
  });

  const revenueChart = Object.keys(revenueHistory).map(date => ({
    date,
    revenue: revenueHistory[date]
  })).sort((a,b) => a.date.localeCompare(b.date));

  // Outstanding Trends
  const outstandingTrends = db.customers.map((c: any) => ({
    name: c.name,
    due: c.outstandingBalance,
    purchases: c.totalPurchases
  }));

  res.json({
    revenue: totalRevenue,
    outstandingBalance,
    pendingDeliveries,
    lowStockAlerts: lowStockProducts,
    totalBottlesSold: db.customers.reduce((sum: number, c: any) => sum + c.totalPurchases, 0),
    revenueChart,
    outstandingTrends,
    deliveryPartners: db.deliveryPartners
  });
});

// 7. REVIEWS
app.post('/api/reviews', (req, res) => {
  const db = readDB();
  const newReview = {
    id: `rev-${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
    ...req.body
  };
  db.reviews.unshift(newReview);

  // Recalculate product rating
  const pIdx = db.products.findIndex((p: any) => p.id === newReview.productId);
  if (pIdx !== -1) {
    const prodReviews = db.reviews.filter((r: any) => r.productId === newReview.productId);
    const totalRating = prodReviews.reduce((acc: number, r: any) => acc + r.rating, 0);
    db.products[pIdx].rating = Number((totalRating / prodReviews.length).toFixed(1));
    db.products[pIdx].reviewsCount = prodReviews.length;
  }

  writeDB(db);
  res.status(201).json(newReview);
});

// 8. EXTRA AI FEATURES: Smart Insights (Gemini)
app.post('/api/ai/insights', async (req, res) => {
  const db = readDB();
  const { customerId } = req.body;
  const customer = db.customers.find((c: any) => c.id === customerId) || db.customers[0];
  const customerOrders = db.orders.filter((o: any) => o.customerId === customer.id);
  const customerSubs = db.subscriptions.filter((s: any) => s.customerId === customer.id);

  if (!ai) {
    // Elegant fallback mock if Gemini API Key isn't provided or set
    return res.json({
      demandPrediction: "High (Estimated 3-4 Cans for next week based on summer peak values)",
      purchaseInsights: `Consistent monthly drinking pattern detected. Prefers delivery on morning slots (08:00 AM - 11:00 AM). You usually order 4 cans every 12 days.`,
      repeatSuggestions: [
        {
          productName: "Amrit Premium 20L Water Can",
          reason: "Your regular consumption pattern suggests running out in 3 days. Order now to secure early slot delivery."
        },
        {
          productName: "Bulk Order: 10 x 20L Water Jars (For Homes & Offices)",
          reason: "Recommended based on regular hydration requirements. Substantial savings compared to single can purchases."
        }
      ],
      couponAdvice: "Apply AMRIT50 for flat ₹50 off on next bulk purchase of 10+ cans."
    });
  }

  try {
    const promptText = `
      You are an elite AI retail advisor for Amrit Dhara, a premium 20L water can delivery startup.
      Analyze the following customer metrics and order data:
      - Customer Name: ${customer.name}
      - Outstanding Credit Balance: ₹${customer.outstandingBalance}
      - Monthly Spending: ₹${customer.monthlySpending}
      - Active Subscriptions: ${JSON.stringify(customerSubs)}
      - Purchase History (Orders): ${JSON.stringify(customerOrders)}

      Provide an optimization insight JSON back containing precisely these fields (do not output markdown format markers, strictly clean JSON):
      {
        "demandPrediction": "Brief projection of water demand (how many bottles they need over the next 7-10 days)",
        "purchaseInsights": "Engaging humanized brief summary of their buying patterns, timing preference, and active habits",
        "repeatSuggestions": [
          {
            "productName": "name of recommended product",
            "reason": "personalized explanation detailing why they need this based on current inventory, usage rate, or season"
          }
        ],
        "couponAdvice": "Which coupon they should use and why, tailored directly to their current shopping patterns"
      }
    `;

    // Robust retry mechanism to handle transient 503 / 429 errors from Google Gemini backend
    const generateWithRetry = async (client: any, params: any, retries = 3, initialDelay = 1000) => {
      let delay = initialDelay;
      for (let i = 0; i < retries; i++) {
        try {
          return await client.models.generateContent(params);
        } catch (err: any) {
          const errMessage = String(err?.message || err || '').toLowerCase();
          const isTransient = errMessage.includes('503') || 
                              errMessage.includes('demand') || 
                              errMessage.includes('unavailable') || 
                              errMessage.includes('429') || 
                              errMessage.includes('limit') || 
                              errMessage.includes('overloaded');
          
          if (isTransient && i < retries - 1) {
            console.warn(`Gemini API busy (attempt ${i + 1}/${retries}). Retrying in ${delay}ms...`, err);
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2; // exponential backoff
          } else {
            throw err;
          }
        }
      }
    };

    const response = await generateWithRetry(ai, {
      model: 'gemini-3.5-flash',
      contents: promptText,
    });

    const cleanText = response.text ? response.text.replace(/```json/gi, '').replace(/```/gi, '').trim() : '';
    const insights = JSON.parse(cleanText);
    res.json(insights);
  } catch (error) {
    console.error('Gemini API call failed, using mock data:', error);
    res.json({
      demandPrediction: "Optimal consumption (Estimated 3 Cans for the next week)",
      purchaseInsights: `${customer.name} demonstrates a stable recurring need. Prefers early morning delivery schedules.`,
      repeatSuggestions: [
        {
          productName: "Amrit Premium 20L Water Can",
          reason: "Keep stock secure. Hot season peaks indicate elevated residential water demand."
        }
      ],
      couponAdvice: "Apply WELCOME20 to save 20% on your next order!"
    });
  }
});


// Production vs. Development modes
const isProd = process.env.NODE_ENV === 'production';

if (!isProd) {
  // Integrate Vite Dev Server as a middleware
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'custom'
  });
  
  app.use(vite.middlewares);
  
  app.use('*', async (req, res, next) => {
    const url = req.originalUrl;
    try {
      let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
      template = await vite.transformIndexHtml(url, template);
      res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
} else {
  // Serve static files from production build folder
  app.use(express.static(path.join(__dirname, 'dist')));
  
  app.use('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Amrit Dhara server listening on http://localhost:${PORT}`);
});
