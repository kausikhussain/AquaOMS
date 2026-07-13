import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Droplet, ShoppingCart, User, Users, Calendar, Award, CheckCircle, 
  Clock, AlertTriangle, ShieldCheck, CreditCard, ChevronRight, Plus, 
  Minus, Trash2, Edit, TrendingUp, Package, Truck, ArrowRight, Sparkles, 
  MapPin, HelpCircle, RefreshCw, Layers, Check, Search, Filter, Phone, 
  DollarSign, Map, X, Info, Download, FileText, Upload, Sliders, Play, Pause, ChevronLeft, LogIn, Lock, Smartphone, Settings, LogOut
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, Cell, PieChart, Pie
} from 'recharts';
import AuthScreen from './components/AuthScreen';

// App Types
interface Product {
  id: string;
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

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  customerId: string;
  customerName: string;
  products: OrderItem[];
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
  transactionRef?: string;
}

interface Subscription {
  id: string;
  customerId: string;
  productName: string;
  price: number;
  quantity: number;
  plan: 'Daily' | 'Alternate Day' | 'Weekly' | 'Monthly';
  status: 'Active' | 'Paused';
  startDate: string;
  paused: boolean;
  skips: string[];
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  address: string;
  outstandingBalance: number;
  monthlySpending: number;
  totalPurchases: number;
}

interface PaymentLog {
  id: string;
  customerId: string;
  amount: number;
  paymentMethod: string;
  status: string;
  orderId: string;
  date: string;
  transactionRef?: string;
}

interface DeliveryPartner {
  id: string;
  name: string;
  phone: string;
  status: 'Idle' | 'Active';
  vehicle: string;
  rating: number;
  location: { lat: number; lng: number };
}

interface AIInsights {
  demandPrediction: string;
  purchaseInsights: string;
  repeatSuggestions: { productName: string; reason: string }[];
  couponAdvice: string;
}

export default function App() {
  // Global App States
  const [currentUser, setCurrentUser] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('currentUser');
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object' && parsed.role && parsed.name) {
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  });

  const [activeRole, setActiveRole] = useState<'customer' | 'retailer'>(() => {
    try {
      const saved = localStorage.getItem('currentUser');
      if (!saved) return 'customer';
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object' && parsed.role) {
        return parsed.role;
      }
      return 'customer';
    } catch {
      return 'customer';
    }
  });

  const [activeCustomerId, setActiveCustomerId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('currentUser');
      if (!saved) return 'cust-1';
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object' && parsed.role === 'customer') {
        return parsed.customerId || 'cust-1';
      }
      return 'cust-1';
    } catch {
      return 'cust-1';
    }
  });

  const [activeTab, setActiveTab] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('currentUser');
      if (!saved) return 'home';
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object' && parsed.role === 'retailer') {
        return 'dashboard';
      }
      return 'home';
    } catch {
      return 'home';
    }
  });

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // DB Sync States
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [payments, setPayments] = useState<PaymentLog[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Cart & UI States
  const [cart, setCart] = useState<{ [prodId: string]: number }>({});
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<string>('');
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [deliveryAddress, setDeliveryAddress] = useState<string>('Plot 12, High School Road, Atalapur, Jajpur, Odisha – 755009');
  const [selectedSlot, setSelectedSlot] = useState<string>('Morning (08:00 AM - 11:00 AM)');
  const [paymentMethod, setPaymentMethod] = useState<string>('UPI');
  const [deliveryOption, setDeliveryOption] = useState<'delivery' | 'pickup'>('delivery');
  
  // Modals & Tracking
  const [activeTrackingOrder, setActiveTrackingOrder] = useState<Order | null>(null);
  const [payDueModalOpen, setPayDueModalOpen] = useState(false);
  const [payDueAmount, setPayDueAmount] = useState<number>(0);
  const [selectedPayDueMethod, setSelectedPayDueMethod] = useState<string>('UPI');
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);
  const [loadingInsights, setLoadingInsights] = useState<boolean>(false);
  const [showDuesNotification, setShowDuesNotification] = useState<boolean>(false);

  // Interactive Payment Gateway and Polling Notification States
  const [checkoutPaymentModalOpen, setCheckoutPaymentModalOpen] = useState(false);
  const [simulatingPaymentStep, setSimulatingPaymentStep] = useState<'idle' | 'processing' | 'success' | 'pending' | 'failed'>('idle');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [sandboxMode, setSandboxMode] = useState<'success' | 'pending' | 'failed'>('success');
  const [cardHolder, setCardHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [upiUtr, setUpiUtr] = useState('');
  const [duesUtr, setDuesUtr] = useState('');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [liveAlert, setLiveAlert] = useState<any | null>(null);
  const [settings, setSettings] = useState<{ lowStockThreshold: number }>({ lowStockThreshold: 20 });
  const [thresholdInput, setThresholdInput] = useState<number>(20);
  
  // Admin & Retailer UI Controls
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '', category: '20L Water Bottle', price: 0, image: '', description: '', stock: 100
  });
  const [adminSearchTerm, setAdminSearchTerm] = useState('');
  const [adminCategoryFilter, setAdminCategoryFilter] = useState('All');
  const [selectedDispatchStage, setSelectedDispatchStage] = useState<string>('Pending');
  
  // Delivery Partner UI Controls
  const [riderOnline, setRiderOnline] = useState(true);
  const [simulatedSignature, setSimulatedSignature] = useState('');
  const [simulatedPhoto, setSimulatedPhoto] = useState<string | null>(null);
  const [completingOrderId, setCompletingOrderId] = useState<string | null>(null);

  // Setup dynamic toast notifications
  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Sync data from Express server
  const fetchData = async () => {
    try {
      setLoading(true);
      const [prodsRes, ordersRes, subsRes, custsRes, paysRes, analyticsRes, settingsRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/orders'),
        fetch('/api/subscriptions'),
        fetch('/api/customers'),
        fetch('/api/payments'),
        fetch('/api/analytics'),
        fetch('/api/settings')
      ]);

      const prods = await prodsRes.json();
      const ords = await ordersRes.json();
      const subs = await subsRes.json();
      const custs = await custsRes.json();
      const pays = await paysRes.json();
      const alyt = await analyticsRes.json();
      const setts = await settingsRes.json();

      setProducts(prods);
      setOrders(ords);
      setSubscriptions(subs);
      setCustomers(custs);
      setPayments(pays);
      setAnalytics(alyt);
      setSettings(setts);

      // Pre-set outstanding due modal state
      const currCust = custs.find((c: any) => c.id === activeCustomerId);
      if (currCust) {
        setPayDueAmount(currCust.outstandingBalance);
      }
    } catch (err) {
      console.error('Failed to sync data:', err);
      showToast('Error syncing with backend server. Check development console.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (settings && typeof settings.lowStockThreshold === 'number') {
      setThresholdInput(settings.lowStockThreshold);
    }
  }, [settings]);

  useEffect(() => {
    // Initial fetch
    fetchData();

    const intervalId = setInterval(async () => {
      // Fetch latest orders & payments in the background silently to keep screens in sync
      try {
        const [ordersRes, paysRes, custsRes, alytRes, notifRes, settingsRes] = await Promise.all([
          fetch('/api/orders'),
          fetch('/api/payments'),
          fetch('/api/customers'),
          fetch('/api/analytics'),
          fetch('/api/notifications'),
          fetch('/api/settings')
        ]);
        const ords = await ordersRes.json();
        const pays = await paysRes.json();
        const custs = await custsRes.json();
        const alyt = await alytRes.json();
        const notifs = await notifRes.json();
        const setts = await settingsRes.json();

        setOrders(ords);
        setPayments(pays);
        setCustomers(custs);
        setAnalytics(alyt);
        setNotifications(notifs);
        setSettings(setts);

        // If shop owner (role === retailer) is active, flag any new unread notification as a high-fidelity popup!
        if (notifs && notifs.length > 0 && activeRole === 'retailer') {
          const unreadAlerts = notifs.filter((n: any) => n.unread);
          if (unreadAlerts.length > 0) {
            const latest = unreadAlerts[0];
            setLiveAlert(latest);
          }
        }
      } catch (err) {
        console.error('Silent background sync failure:', err);
      }
    }, 4000);

    return () => clearInterval(intervalId);
  }, [activeCustomerId, activeRole]);

  // Keep customer tracking order in sync with the backend
  useEffect(() => {
    if (activeTrackingOrder) {
      const updated = orders.find(o => o.id === activeTrackingOrder.id);
      if (updated && updated.status !== activeTrackingOrder.status) {
        setActiveTrackingOrder(updated);
        showToast(`Your order status was updated in real-time to: ${updated.status}`, 'info');
      }
    }
  }, [orders, activeTrackingOrder]);

  // Show temporary dues notification immediately after login/switching to role
  useEffect(() => {
    if (activeRole === 'retailer' || activeRole === 'customer') {
      const currentCust = customers.find(c => c.id === activeCustomerId);
      if (currentCust && currentCust.outstandingBalance > 0) {
        setShowDuesNotification(true);
        const timer = setTimeout(() => {
          setShowDuesNotification(false);
        }, 5000);
        return () => clearTimeout(timer);
      }
    } else {
      setShowDuesNotification(false);
    }
  }, [activeCustomerId, activeRole, customers]);

  const handleMarkNotificationsRead = async () => {
    try {
      await fetch('/api/notifications/read', { method: 'POST' });
      setLiveAlert(null);
      const res = await fetch('/api/notifications');
      const data = await res.json();
      setNotifications(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearNotifications = async () => {
    try {
      await fetch('/api/notifications/clear', { method: 'POST' });
      setLiveAlert(null);
      setNotifications([]);
    } catch (err) {
      console.error(err);
    }
  };

  // Load Gemini AI insights
  const loadAiInsights = async () => {
    try {
      setLoadingInsights(true);
      const res = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: activeCustomerId })
      });
      const data = await res.json();
      setAiInsights(data);
    } catch (err) {
      console.error(err);
      showToast('Unable to fetch AI insights. Check API configuration.', 'info');
    } finally {
      setLoadingInsights(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'insights') {
      loadAiInsights();
    }
  }, [activeTab, activeCustomerId]);

  // Sync address if active customer changes
  useEffect(() => {
    const currentCust = customers.find(c => c.id === activeCustomerId);
    if (currentCust) {
      setDeliveryAddress(currentCust.address);
      setPayDueAmount(currentCust.outstandingBalance);
    }
  }, [activeCustomerId, customers]);

  // Synchronize state when currentUser changes or activeTab is modified (Role-based page protection)
  useEffect(() => {
    if (!currentUser) {
      return;
    }
    // Enforce role-based tab restrictions
    const customerTabs = ['home', 'products', 'orders', 'payments', 'profile', 'subscriptions', 'insights'];
    const retailerTabs = ['dashboard', 'orders', 'customers', 'payments', 'inventory', 'profile'];

    if (currentUser.role === 'customer') {
      if (!customerTabs.includes(activeTab)) {
        setActiveTab('home');
      }
    } else if (currentUser.role === 'retailer') {
      if (!retailerTabs.includes(activeTab)) {
        setActiveTab('dashboard');
      }
    }
  }, [currentUser, activeTab]);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
    setActiveRole('customer');
    setActiveCustomerId('cust-1');
    setActiveTab('home');
    setCart({});
    showToast('Logged out successfully', 'success');
  };

  // Role adjustment helpers
  const handleRoleChange = (role: 'customer' | 'retailer') => {
    console.log('Role change via simulator disabled');
  };

  // Cart Management
  const addToCart = (productId: string) => {
    setCart(prev => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1
    }));
    const p = products.find(p => p.id === productId);
    if (p) showToast(`${p.name} added to cart`, 'success');
  };

  const updateCartQuantity = (productId: string, qty: number) => {
    if (qty <= 0) {
      const copy = { ...cart };
      delete copy[productId];
      setCart(copy);
    } else {
      setCart(prev => ({ ...prev, [productId]: qty }));
    }
  };

  const getCartTotal = () => {
    let subtotal = 0;
    Object.keys(cart).forEach(id => {
      const p = products.find(prod => prod.id === id);
      if (p) {
        let rate = p.price;
        if (p.id === 'prod-1' || p.category === '20L Water Bottle') {
          if (deliveryOption === 'pickup') {
            rate = (activeRole === 'retailer') ? 20 : 25;
          } else {
            rate = (activeRole === 'retailer') ? 30 : 35;
          }
        }
        subtotal += rate * cart[id];
      }
    });

    // Apply Coupon
    let discount = 0;
    if (selectedCoupon === 'AMRIT50' && subtotal >= 300) {
      discount = 50;
    } else if (selectedCoupon === 'WELCOME20') {
      discount = Number((subtotal * 0.2).toFixed(2));
    } else if (selectedCoupon === 'FREEDELIVERY') {
      discount = 0; // Since delivery charges are already ₹0 / included!
    }

    // Both Delivery (₹35) and Pickup (₹25) are completely inclusive of GST and delivery charges!
    const deliveryCharge = 0;
    const tax = 0;
    const total = Math.max(0, subtotal - discount);

    return {
      subtotal,
      discount,
      deliveryCharge,
      tax,
      total: Number(total.toFixed(2))
    };
  };

  const handleApplyCoupon = (code: string) => {
    const totals = getCartTotal();
    if (code === 'AMRIT50' && totals.subtotal < 300) {
      showToast('Coupon AMRIT50 requires a minimum order value of ₹300', 'error');
      return;
    }
    if (code === 'WELCOME20' && totals.subtotal < 100) {
      showToast('Coupon WELCOME20 requires a minimum order value of ₹100', 'error');
      return;
    }
    setSelectedCoupon(code);
    showToast(`Coupon ${code} applied successfully!`, 'success');
  };

  // Place Order Action (Triggers Payment Gateway Modal)
  const handleCheckout = () => {
    const totals = getCartTotal();
    const orderItems: OrderItem[] = Object.keys(cart).map(id => {
      const p = products.find(prod => prod.id === id)!;
      if (!p) return { productId: id, name: 'Product', price: 0, quantity: 0 };
      let rate = p.price;
      if (p.id === 'prod-1' || p.category === '20L Water Bottle') {
        if (deliveryOption === 'pickup') {
          rate = (activeRole === 'retailer') ? 20 : 25;
        } else {
          rate = (activeRole === 'retailer') ? 30 : 35;
        }
      }
      return {
        productId: id,
        name: p.name,
        price: rate,
        quantity: cart[id]
      };
    }).filter(i => i.quantity > 0);

    if (orderItems.length === 0) {
      showToast('Your shopping cart is currently empty!', 'error');
      return;
    }

    // Reset card state
    setCardHolder('');
    setCardNumber('');
    setCardExpiry('');
    setCardCvv('');
    setUpiUtr('');

    // Open Interactive Payment Gateway Modal
    setCheckoutPaymentModalOpen(true);
    setSimulatingPaymentStep('idle');
    setPaymentError(null);
  };

  const handleCompleteSecureCheckout = async (simulatedStatus: 'Paid' | 'Outstanding' | 'Pending') => {
    setSimulatingPaymentStep('processing');
    setPaymentError(null);

    // Dynamic countdown delay for deep production-ready look & feel
    await new Promise(resolve => setTimeout(resolve, 2000));

    if (sandboxMode === 'failed') {
      setSimulatingPaymentStep('failed');
      setPaymentError('Gateway transaction error: DECLINED_BY_ISSUING_BANK. Your account was not charged. Please try again.');
      showToast('Payment processing failed. Please check your credentials or try another method.', 'error');
      return;
    }

    const totals = getCartTotal();
    const orderItems: OrderItem[] = Object.keys(cart).map(id => {
      const p = products.find(prod => prod.id === id)!;
      if (!p) return { productId: id, name: 'Product', price: 0, quantity: 0 };
      let rate = p.price;
      if (p.id === 'prod-1' || p.category === '20L Water Bottle') {
        if (deliveryOption === 'pickup') {
          rate = (activeRole === 'retailer') ? 20 : 25;
        } else {
          rate = (activeRole === 'retailer') ? 30 : 35;
        }
      }
      return {
        productId: id,
        name: p.name,
        price: rate,
        quantity: cart[id]
      };
    }).filter(i => i.quantity > 0);

    const currentCust = customers.find(c => c.id === activeCustomerId)!;

    // Build checkout order payload
    const payload = {
      customerId: activeCustomerId,
      customerName: currentCust.name,
      products: orderItems,
      subtotal: totals.subtotal,
      deliveryCharge: totals.deliveryCharge,
      tax: totals.tax,
      total: totals.total,
      paymentMethod: paymentMethod,
      paymentStatus: simulatedStatus,
      address: deliveryOption === 'pickup' ? 'Self Pickup (Amrit Central Outlet, Atalapur, Jajpur, Odisha – 755009)' : deliveryAddress,
      preferredTime: selectedSlot,
      transactionRef: upiUtr || ''
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const placedOrder = await res.json();
      
      setCart({});
      setSelectedCoupon('');
      setCartDrawerOpen(false);
      setCheckoutPaymentModalOpen(false);
      setSimulatingPaymentStep('idle');
      setActiveTrackingOrder(placedOrder);
      
      if (simulatedStatus === 'Paid') {
        showToast(`Secure Payment Processed! Order #${placedOrder.id} is confirmed.`, 'success');
      } else if (simulatedStatus === 'Pending') {
        showToast(`Order #${placedOrder.id} placed. Payment status is set to PENDING.`, 'info');
      } else {
        showToast(`Order #${placedOrder.id} logged to your credit account ledger!`, 'success');
      }

      setActiveTab('dashboard');
      fetchData(); // Sync metrics instantly
    } catch (err) {
      console.error(err);
      setSimulatingPaymentStep('failed');
      setPaymentError('Critical error synchronizing with central water database.');
      showToast('Checkout communication failed.', 'error');
    }
  };

  // Subscribe Action
  const handleSubscribe = async (product: Product, plan: any, qty: number) => {
    const payload = {
      customerId: activeCustomerId,
      productName: product.name,
      price: product.price,
      quantity: qty,
      plan: plan,
      startDate: new Date().toISOString().split('T')[0]
    };

    try {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const newSub = await res.json();
      showToast(`Subscribed successfully to ${newSub.productName}!`, 'success');
      setActiveTab('subscriptions');
      fetchData();
    } catch (err) {
      console.error(err);
      showToast('Failed to create subscription', 'error');
    }
  };

  // Toggle/Pause Subscription
  const handleToggleSub = async (sub: Subscription) => {
    const nextPausedState = !sub.paused;
    try {
      const res = await fetch(`/api/subscriptions/${sub.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paused: nextPausedState, status: nextPausedState ? 'Paused' : 'Active' })
      });
      const updated = await res.json();
      showToast(updated.paused ? 'Subscription paused' : 'Subscription resumed successfully', 'success');
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Pay Dues Outstanding
  const handleSettleDue = async () => {
    if (payDueAmount <= 0) {
      showToast('Due balance is already zero!', 'info');
      return;
    }
    try {
      const res = await fetch('/api/payments/settle-due', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: activeCustomerId,
          amount: payDueAmount,
          method: selectedPayDueMethod,
          transactionRef: duesUtr || ''
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Dues of ₹${payDueAmount} settled successfully via ${selectedPayDueMethod}!`, 'success');
        setPayDueModalOpen(false);
        fetchData();
      }
    } catch (err) {
      console.error(err);
      showToast('Settlement failed', 'error');
    }
  };

  // Admin: Update Order Status
  const handleUpdateOrderStatus = async (orderId: string, nextStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        showToast(`Order ${orderId} status set to ${nextStatus}`, 'success');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Admin: Product actions
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingProduct ? 'PUT' : 'POST';
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productForm)
      });
      if (res.ok) {
        showToast(editingProduct ? 'Product edited successfully' : 'Product added successfully', 'success');
        setEditingProduct(null);
        setProductForm({ name: '', category: '20L Water Bottle', price: 0, image: '', description: '', stock: 100 });
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditProductClick = (prod: Product) => {
    setEditingProduct(prod);
    setProductForm({
      name: prod.name,
      category: prod.category,
      price: prod.price,
      image: prod.image,
      description: prod.description,
      stock: prod.stock
    });
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product from Amrit Dhara catalog?')) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Product removed from catalog', 'info');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lowStockThreshold: thresholdInput })
      });
      if (res.ok) {
        showToast('Low stock threshold settings updated successfully!', 'success');
        fetchData();
      } else {
        showToast('Failed to save settings.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error connecting to settings API.', 'error');
    }
  };

  // Rider: Simulating Delivery Completion
  const triggerDeliverConfirm = (orderId: string) => {
    setCompletingOrderId(orderId);
    setSimulatedSignature('Verified customer confirmation signature');
    setSimulatedPhoto('https://images.unsplash.com/photo-1621905252507-b354bc25edac?auto=format&fit=crop&q=80&w=400');
  };

  const handleCompleteDelivery = async () => {
    if (!completingOrderId) return;
    try {
      const res = await fetch(`/api/orders/${completingOrderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Delivered', paymentStatus: 'Paid' })
      });
      if (res.ok) {
        showToast(`Order ${completingOrderId} delivered securely. Client profile updated.`, 'success');
        setCompletingOrderId(null);
        setSimulatedPhoto(null);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Utility to count items
  const getCartCount = (): number => (Object.values(cart) as number[]).reduce((a: number, b: number) => a + b, 0);

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(adminSearchTerm.toLowerCase()) || 
                          p.description.toLowerCase().includes(adminSearchTerm.toLowerCase());
    const matchesCategory = adminCategoryFilter === 'All' || p.category === adminCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Calculate current active customer stats
  const currentCustomer = customers.find(c => c.id === activeCustomerId);

  if (!currentUser) {
    return (
      <div id="app-root" className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans transition-all">
        {toast && (
          <div 
            id="global-toast" 
            className="fixed top-6 right-6 z-50 max-w-sm w-full bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-800/80 p-4 overflow-hidden animate-toast-in text-left flex gap-3.5 relative"
          >
            <div className={`p-2 rounded-xl self-start ${
              toast.type === 'success' ? 'bg-emerald-500/15 text-emerald-400' :
              toast.type === 'error' ? 'bg-rose-500/15 text-rose-400' :
              'bg-blue-500/15 text-blue-400'
            }`}>
              {toast.type === 'success' && <CheckCircle className="w-5 h-5" />}
              {toast.type === 'error' && <AlertTriangle className="w-5 h-5" />}
              {toast.type === 'info' && <Sparkles className="w-5 h-5" />}
            </div>
            <div className="flex-grow pr-6 space-y-0.5 self-center">
              <h5 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                {toast.type === 'success' ? 'Success' :
                 toast.type === 'error' ? 'Attention' :
                 'Alert'}
              </h5>
              <p className="text-xs font-semibold text-slate-200 leading-normal">{toast.message}</p>
            </div>
            <button 
              onClick={() => setToast(null)}
              className="absolute top-3.5 right-3.5 p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <AuthScreen onLoginSuccess={(user: any) => {
          setCurrentUser(user);
          localStorage.setItem('currentUser', JSON.stringify(user));
          setActiveRole(user.role);
          setActiveCustomerId(user.role === 'customer' ? user.customerId : 'cust-1');
          setActiveTab(user.role === 'retailer' ? 'dashboard' : 'home');
          showToast(`Welcome back, ${user.name}!`, 'success');
        }} />
      </div>
    );
  }

  return (
    <div id="app-root" className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans transition-all">
      
      {/* Dynamic Action Toast Notifications */}
      {toast && (
        <div 
          id="global-toast" 
          className="fixed top-6 right-6 z-50 max-w-sm w-full bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-800/80 p-4 overflow-hidden animate-toast-in text-left flex gap-3.5 relative"
        >
          {/* Accent Badge */}
          <div className={`p-2 rounded-xl self-start ${
            toast.type === 'success' ? 'bg-emerald-500/15 text-emerald-400' :
            toast.type === 'error' ? 'bg-rose-500/15 text-rose-400' :
            'bg-blue-500/15 text-blue-400'
          }`}>
            {toast.type === 'success' && <CheckCircle className="w-5 h-5" />}
            {toast.type === 'error' && <AlertTriangle className="w-5 h-5" />}
            {toast.type === 'info' && <Sparkles className="w-5 h-5" />}
          </div>

          {/* Content */}
          <div className="flex-grow pr-6 space-y-0.5 self-center">
            <h5 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              {toast.type === 'success' ? 'Success' :
               toast.type === 'error' ? 'Attention' :
               'Alert'}
            </h5>
            <p className="text-xs font-semibold text-slate-200 leading-normal">{toast.message}</p>
          </div>

          {/* Close Button */}
          <button 
            onClick={() => setToast(null)}
            className="absolute top-3.5 right-3.5 p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Modern High-End Commercial Header Bar */}
      <header id="main-header" className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Logo & Slogan */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('landing')}>
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-sky-400 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <Droplet className="w-5.5 h-5.5 fill-white" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-slate-800 flex items-center gap-1">
                Amrit Dhara
              </span>
              <p className="text-[10px] uppercase tracking-widest font-bold text-sky-600">Pure Water. Delivered Smarter.</p>
            </div>
          </div>

          {/* Logged-In User Status & Logout Button */}
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/60 rounded-2xl px-3.5 py-1.5 self-center">
            <div className="w-7.5 h-7.5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black text-xs uppercase shadow-sm">
              {currentUser?.name ? currentUser.name.substring(0, 2) : 'AD'}
            </div>
            <div className="text-left">
              <p className="text-xs font-black text-slate-800 leading-none mb-1">{currentUser?.name || 'User'}</p>
              <span className={`text-[8px] tracking-wider font-extrabold uppercase px-1.5 py-0.5 rounded-md ${
                currentUser?.role === 'retailer' 
                  ? 'bg-amber-100 text-amber-700 border border-amber-200/60' 
                  : 'bg-blue-100 text-blue-700 border border-blue-200/60'
              }`}>
                {currentUser?.role || 'Guest'}
              </span>
            </div>
            <div className="h-6 w-px bg-slate-200/80 mx-1" />
            <button 
              id="logout-btn"
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
              title="Logout from portal"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Action Navigation Buttons */}
          <div className="flex items-center gap-3 justify-end">
            {activeRole === 'customer' && (
              <>
                <button 
                  onClick={() => setActiveTab('home')} 
                  className={`text-sm font-semibold px-3 py-2 rounded-xl transition-all ${activeTab === 'home' ? 'text-blue-600 bg-blue-50/80' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  Home
                </button>
                <button 
                  onClick={() => setActiveTab('products')} 
                  className={`text-sm font-semibold px-3 py-2 rounded-xl transition-all ${activeTab === 'products' ? 'text-blue-600 bg-blue-50/80' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  Products
                </button>
                <button 
                  onClick={() => setActiveTab('orders')} 
                  className={`text-sm font-semibold px-3 py-2 rounded-xl transition-all ${activeTab === 'orders' ? 'text-blue-600 bg-blue-50/80' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  Orders
                </button>
                <button 
                  onClick={() => setActiveTab('payments')} 
                  className={`text-sm font-semibold px-3 py-2 rounded-xl transition-all ${activeTab === 'payments' ? 'text-blue-600 bg-blue-50/80' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  Payments
                </button>
                <button 
                  onClick={() => setActiveTab('profile')} 
                  className={`text-sm font-semibold px-3 py-2 rounded-xl transition-all ${activeTab === 'profile' ? 'text-blue-600 bg-blue-50/80' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  Profile
                </button>
                
                {/* Shopping Cart Trigger */}
                <button 
                  id="open-cart-btn"
                  onClick={() => setCartDrawerOpen(true)}
                  className="relative p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200/80 transition-all text-slate-700"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {getCartCount() > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-blue-600 text-white rounded-full text-[10px] font-extrabold flex items-center justify-center animate-pulse">
                      {getCartCount()}
                    </span>
                  )}
                </button>
              </>
            )}

            {activeRole === 'retailer' && (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setActiveTab('dashboard')} 
                  className={`text-xs font-bold px-3 py-2 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-amber-50 text-amber-700' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  Dashboard
                </button>
                <button 
                  onClick={() => setActiveTab('orders')} 
                  className={`text-xs font-bold px-3 py-2 rounded-xl transition-all ${activeTab === 'orders' ? 'bg-amber-50 text-amber-700' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  Orders ({orders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled').length})
                </button>
                <button 
                  onClick={() => setActiveTab('customers')} 
                  className={`text-xs font-bold px-3 py-2 rounded-xl transition-all ${activeTab === 'customers' ? 'bg-amber-50 text-amber-700' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  Customers
                </button>
                <button 
                  onClick={() => setActiveTab('payments')} 
                  className={`text-xs font-bold px-3 py-2 rounded-xl transition-all ${activeTab === 'payments' ? 'bg-amber-50 text-amber-700' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  Payments
                </button>
                <button 
                  onClick={() => setActiveTab('inventory')} 
                  className={`text-xs font-bold px-3 py-2 rounded-xl transition-all ${activeTab === 'inventory' ? 'bg-amber-50 text-amber-700' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  Inventory
                </button>
                <button 
                  onClick={() => setActiveTab('profile')} 
                  className={`text-xs font-bold px-3 py-2 rounded-xl transition-all ${activeTab === 'profile' ? 'bg-amber-50 text-amber-700' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  Profile
                </button>
              </div>
            )}



          </div>
        </div>
      </header>

      {/* Temporary Alert Card if there are Outstanding Credits (Auto-dismisses in 5s) */}
      {showDuesNotification && currentCustomer && currentCustomer.outstandingBalance > 0 && (activeRole === 'customer' || activeRole === 'retailer') && (
        <div 
          id="outstanding-alert" 
          className="fixed top-24 right-6 z-50 max-w-md bg-white border border-amber-200 rounded-3xl p-5 shadow-2xl flex items-start gap-3.5 animate-toast-in text-left"
        >
          <div className="p-2.5 bg-amber-50 rounded-xl text-amber-500 shrink-0">
            <AlertTriangle className="w-5 h-5 animate-bounce" />
          </div>
          <div className="flex-grow space-y-1.5 pr-2">
            <p className="text-[10px] uppercase font-bold text-amber-600 tracking-widest">Outstanding Balance Notice</p>
            <p className="text-xs font-semibold text-slate-700 leading-normal">
              You have a pending ledger balance of <strong className="text-slate-900">₹{currentCustomer.outstandingBalance}</strong> from previous water deliveries.
            </p>
            <div className="flex gap-3 pt-1">
              <button 
                onClick={() => {
                  setPayDueAmount(currentCustomer.outstandingBalance);
                  setPayDueModalOpen(true);
                  setShowDuesNotification(false);
                }} 
                className="text-xs font-bold text-blue-600 hover:text-blue-700 underline flex items-center gap-0.5"
              >
                Settle Ledger Now <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => setShowDuesNotification(false)}
                className="text-xs font-semibold text-slate-400 hover:text-slate-500"
              >
                Dismiss
              </button>
            </div>
          </div>
          <button 
            onClick={() => setShowDuesNotification(false)} 
            className="p-1 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-600 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* VIEWPORT AREA */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 lg:px-8 py-8">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <RefreshCw className="w-10 h-10 text-blue-600 animate-spin" />
            <p className="text-slate-500 font-semibold">Updating Amrit Dhara terminal state...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {/* 1. LANDING/HOME VIEW */}
            {activeTab === 'home' && activeRole === 'customer' && (
              <motion.div
                key="home"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                id="landing-view"
                className="space-y-20"
              >
                
                {/* Premium Sleek Hero Section */}
                <section className="relative bg-slate-950 text-white rounded-[32px] overflow-hidden p-8 md:p-20 border border-slate-900 shadow-2xl">
                  {/* Subtle water drop background graphic */}
                  <div className="absolute top-1/2 -translate-y-1/2 right-10 opacity-[0.03] pointer-events-none hidden lg:block">
                    <Droplet className="w-[450px] h-[450px] fill-white text-white" />
                  </div>
                  
                  <div className="max-w-3xl space-y-8 relative z-10 text-left">
                    <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-3.5 py-1.5 rounded-full text-xs font-semibold text-blue-400">
                      <Sparkles className="w-3.5 h-3.5" /> Direct From Our Purification Springs
                    </div>
                    
                    <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tight leading-[1.1]">
                      Purified at Source.<br/>
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-teal-300">Delivered Directly.</span>
                    </h1>
                    
                    <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-xl font-normal">
                      We never buy or resell cheap third-party packaged water. At <strong className="text-slate-200">Amrit Dhara</strong>, we extract pure water from pristine aquifers, filter it through our advanced in-house multi-stage RO, UV, and mineralization system, fill our BPA-free 20L jars, and deliver them directly to your doorstep.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                      <button 
                        onClick={() => setActiveTab('products')} 
                        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-semibold text-xs shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        Order 20L Water Jars
                        <ArrowRight className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setActiveTab('subscriptions')} 
                        className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 px-8 py-4 rounded-2xl font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        Set Regular Delivery
                        <Calendar className="w-4 h-4 text-sky-400" />
                      </button>
                    </div>

                    {/* Quality Highlights */}
                    <div className="grid grid-cols-3 gap-6 pt-12 border-t border-slate-900 text-left">
                      <div>
                        <p className="text-2xl font-display font-bold text-blue-400">₹35 / ₹25</p>
                        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-1">Delivery / Pickup Price</p>
                      </div>
                      <div>
                        <p className="text-2xl font-display font-bold text-sky-400">10-Stage</p>
                        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-1">In-House Purification</p>
                      </div>
                      <div>
                        <p className="text-2xl font-display font-bold text-teal-400">100%</p>
                        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-1">BPA-Free Certified Cans</p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Direct-From-Source Extraction and Purification Pipeline */}
                <section className="space-y-12">
                  <div className="text-center max-w-xl mx-auto space-y-3">
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full">Our Pipeline</span>
                    <h2 className="text-3xl font-display font-bold text-slate-900 tracking-tight">The Amrit Filtration Standard</h2>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Unlike traditional resellers, we handle 100% of the extraction, purification, and direct-to-door logistics under clinical, sterile supervision.
                    </p>
                  </div>

                  {/* Purification steps cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs flex flex-col justify-between text-left space-y-4 hover:border-slate-200 transition-all">
                      <div className="space-y-3">
                        <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">STEP 01</span>
                        <h3 className="text-base font-bold text-slate-800">Source Extraction</h3>
                        <p className="text-xs text-slate-500 leading-relaxed">Extracted from deep, naturally-protected mineral aquifers far beneath geological contamination layers.</p>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs flex flex-col justify-between text-left space-y-4 hover:border-slate-200 transition-all">
                      <div className="space-y-3">
                        <span className="text-[10px] font-black text-sky-600 bg-sky-50 px-2.5 py-1 rounded-md">STEP 02</span>
                        <h3 className="text-base font-bold text-slate-800">10-Stage RO Filtration</h3>
                        <p className="text-xs text-slate-500 leading-relaxed">Filtered through advanced physical Reverse Osmosis membranes to extract particulate and microscopic dissolved solids.</p>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs flex flex-col justify-between text-left space-y-4 hover:border-slate-200 transition-all">
                      <div className="space-y-3">
                        <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">STEP 03</span>
                        <h3 className="text-base font-bold text-slate-800">UV & Ozone Chamber</h3>
                        <p className="text-xs text-slate-500 leading-relaxed">Ozone sterilized and UV-radiation sanitization ensures 100% microbiological safety and crystal-clear purity.</p>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs flex flex-col justify-between text-left space-y-4 hover:border-slate-200 transition-all">
                      <div className="space-y-3">
                        <span className="text-[10px] font-black text-teal-600 bg-teal-50 px-2.5 py-1 rounded-md">STEP 04</span>
                        <h3 className="text-base font-bold text-slate-800">Contactless Bottling</h3>
                        <p className="text-xs text-slate-500 leading-relaxed">Filled, capped, and hermetically sealed automatically in our clinical, robotic food-grade polycarbonate 20L jars.</p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Standard vs Bulk focused products presentation */}
                <section className="bg-slate-50 rounded-[32px] border border-slate-100 p-8 md:p-16 space-y-10">
                  <div className="flex flex-col md:flex-row items-start justify-between gap-6">
                    <div className="space-y-3 max-w-xl text-left">
                      <span className="text-xs font-bold text-blue-600 uppercase tracking-wider bg-blue-100/60 px-3 py-1 rounded-full">Focused catalog</span>
                      <h3 className="text-2xl md:text-3xl font-display font-bold text-slate-900 tracking-tight">Our Straightforward 20L Offerings</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        We believe in doing one thing with absolute perfection. We specialize exclusively in heavy-duty, sanitized, food-grade 20L water cans. Choose between a single jar on-demand or pre-paid bulk bundles designed for corporate spaces or weddings.
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
                      <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-500" /> BIS Certified</span>
                      <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-500" /> 100% Recyclable</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Standard Card */}
                    <div className="bg-white rounded-3xl p-8 border border-slate-200/50 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between text-left space-y-6">
                      <div className="space-y-3">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                          <Droplet className="w-6 h-6 fill-blue-500/10" />
                        </div>
                        <h4 className="text-lg font-bold text-slate-900">Standard 20L Drinking Jar</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">Perfect for daily drinking water needs of nuclear families or local shops. Delivered sealed, fresh, and cold if required.</p>
                      </div>
                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Pricing</p>
                          <p className="text-lg font-black text-slate-800">₹35 <span className="text-xs font-normal text-slate-400">/ Delivered</span></p>
                        </div>
                        <button 
                          onClick={() => {
                            addToCart('prod-1');
                            setCartDrawerOpen(true);
                          }}
                          className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-xl font-semibold text-xs transition-all cursor-pointer"
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>

                    {/* Bulk Card */}
                    <div className="bg-white rounded-3xl p-8 border border-slate-200/50 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between text-left space-y-6">
                      <div className="space-y-3">
                        <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center">
                          <Users className="w-6 h-6" />
                        </div>
                        <h4 className="text-lg font-bold text-slate-900">Bulk Event & Corporate Packs</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">Discounted bundles of 10, 20, or 50 water cans designed for offices, wedding banquets, seminars, and co-working offices.</p>
                      </div>
                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Bundles Start At</p>
                          <p className="text-lg font-black text-slate-800">₹330 <span className="text-xs font-normal text-slate-400">/ 10 Cans Pack</span></p>
                        </div>
                        <button 
                          onClick={() => {
                            setActiveTab('products');
                            setAdminCategoryFilter('All');
                          }}
                          className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-xl font-semibold text-xs transition-all cursor-pointer"
                        >
                          View Bulk Bundles
                        </button>
                      </div>
                    </div>
                  </div>
                </section>

                {/* FAQ Section */}
                <section className="space-y-8 max-w-4xl mx-auto text-left">
                  <h3 className="text-2xl font-display font-bold text-slate-900 text-center">Operational FAQ</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200/50 shadow-xs space-y-2">
                      <p className="font-bold text-sm text-slate-800">Who manufactures your water?</p>
                      <p className="text-xs text-slate-500 leading-relaxed">We do! We own and operate a premium multi-barrier purification spring facility in Atalapur, Jajpur, Odisha – 755009. We do not source from cheap third-party bottlers.</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-200/50 shadow-xs space-y-2">
                      <p className="font-bold text-sm text-slate-800">How do you sanitize empty returned 20L jars?</p>
                      <p className="text-xs text-slate-500 leading-relaxed">All incoming empty canisters are physically inspected, washed via advanced high-pressure automated jet-wash inside-out, sterilized under high-temperature steam tunnels, and sanitized with food-grade ozone wash.</p>
                    </div>
                  </div>
                </section>

              </motion.div>
            )}

            {/* 2. CUSTOMER / RETAILER WORKSPACE */}
            {(activeRole === 'customer' || activeRole === 'retailer') && activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                id="customer-dashboard"
                className="space-y-8 text-left"
              >
                
                {/* =========================================================================
                    A. RETAILER ENTERPRISE DASHBOARD
                    ========================================================================= */}
                {activeRole === 'retailer' && (
                  <div id="retailer-enterprise-workspace" className="space-y-8">
                    
                    {/* Header Banner */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-slate-900 text-white p-6 md:p-8 rounded-[32px] border border-slate-800 shadow-xl relative overflow-hidden">
                      <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none">
                        <Layers className="w-64 h-64 text-white" />
                      </div>
                      
                      <div className="space-y-3 relative z-10">
                        <div className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full text-[10px] font-extrabold text-amber-400 uppercase tracking-widest">
                          <Award className="w-3.5 h-3.5" /> Authorized Wholesale Partner
                        </div>
                        <h2 className="text-2xl md:text-3xl font-display font-black tracking-tight">
                          {currentCustomer ? currentCustomer.name : 'Enterprise Partner'}
                        </h2>
                        <p className="text-xs text-slate-400 max-w-xl">
                          Wholesale Merchant Panel • GSTIN: 19AAHCA8492K1Z9 • High-Volume 20L Water Refills & Ledger Billing
                        </p>
                      </div>

                      {/* Store Outlet Locator */}
                      <div className="flex items-center gap-3.5 bg-slate-800/60 border border-slate-700/50 p-4 rounded-2xl max-w-sm self-start lg:self-center shrink-0">
                        <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Registered Outlet Address</p>
                          <p className="text-xs font-bold text-slate-200 max-w-[200px] truncate">{deliveryAddress}</p>
                        </div>
                      </div>
                    </div>

                    {/* Retailer Specific Metrics Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                      
                      {/* Monthly Spent Metric */}
                      <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-xs space-y-4">
                        <div className="flex justify-between items-center text-slate-400">
                          <span className="text-[10px] uppercase font-extrabold tracking-widest">Wholesale Spend</span>
                          <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
                            <TrendingUp className="w-4 h-4" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-2xl font-black text-slate-800">₹{currentCustomer ? currentCustomer.monthlySpending : 0}</p>
                          <p className="text-[10px] text-slate-400 leading-tight">Total billed during active cycle (₹30/Can Wholesale Tariff)</p>
                        </div>
                      </div>

                      {/* Outstanding Dues Ledger */}
                      <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-xs space-y-4">
                        <div className="flex justify-between items-center text-slate-400">
                          <span className="text-[10px] uppercase font-extrabold tracking-widest">Outstanding Ledger</span>
                          <div className={`p-1.5 rounded-lg ${currentCustomer && currentCustomer.outstandingBalance > 0 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                            <AlertTriangle className="w-4 h-4" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-2xl font-black text-slate-800">₹{currentCustomer ? currentCustomer.outstandingBalance : 0}</p>
                          {currentCustomer && currentCustomer.outstandingBalance > 0 ? (
                            <button 
                              onClick={() => {
                                setPayDueAmount(currentCustomer.outstandingBalance);
                                setPayDueModalOpen(true);
                              }}
                              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 rounded-xl text-[10px] transition-colors flex items-center justify-center gap-1 cursor-pointer"
                            >
                              Settle Ledger <ChevronRight className="w-3 h-3" />
                            </button>
                          ) : (
                            <p className="text-[10px] text-emerald-600 font-bold">● Ledger fully clear</p>
                          )}
                        </div>
                      </div>

                      {/* Lifetime Refills */}
                      <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-xs space-y-4">
                        <div className="flex justify-between items-center text-slate-400">
                          <span className="text-[10px] uppercase font-extrabold tracking-widest">Lifetime Volume</span>
                          <div className="p-1.5 bg-sky-50 rounded-lg text-sky-600">
                            <Droplet className="w-4 h-4 fill-sky-200" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-2xl font-black text-slate-800">{currentCustomer ? currentCustomer.totalPurchases : 0} Jars</p>
                          <p className="text-[10px] text-slate-400">Accumulated 20L water cans purchased</p>
                        </div>
                      </div>

                      {/* Active Dispatch Contract */}
                      <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-xs space-y-4">
                        <div className="flex justify-between items-center text-slate-400">
                          <span className="text-[10px] uppercase font-extrabold tracking-widest">Refill Contracts</span>
                          <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
                            <Calendar className="w-4 h-4" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-2xl font-black text-slate-800">
                            {subscriptions.filter(s => s.customerId === activeCustomerId && s.status === 'Active').length} Active
                          </p>
                          <button 
                            onClick={() => setActiveTab('subscriptions')}
                            className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5"
                          >
                            Configure Schedule <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                    </div>

                    {/* Layout Core: Refill Desk + AI Stock Optimizer & Statement History */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      
                      {/* Left Column (8 cols): Wholesale Refill Desk & Tracking */}
                      <div className="lg:col-span-8 space-y-8">
                        
                        {/* Interactive Wholesale Desk */}
                        <div className="bg-white p-6 rounded-[28px] border border-slate-200/60 shadow-xs space-y-6">
                          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                            <div>
                              <h3 className="text-base font-black text-slate-800">Wholesale Bulk Order Desk</h3>
                              <p className="text-xs text-slate-400">Select bulk quantities of 20L jars with instant wholesale pricing</p>
                            </div>
                            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-extrabold border border-emerald-100 px-2.5 py-1 rounded-lg">Exclusive Tariff Active</span>
                          </div>

                          {/* Quick selection bulk matrices */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {[
                              { label: 'Standard Refill', count: 10, total: 300, desc: 'Ideal for small offices or cafes' },
                              { label: 'Restaurant Refill', count: 21, total: 630, desc: 'Ideal for medium dine-outs' },
                              { label: 'Commercial Bulk Pack', count: 50, total: 1500, desc: 'Special occasions & events' }
                            ].map((bulk, idx) => (
                              <div key={idx} className="border border-slate-200/80 hover:border-blue-500 rounded-2xl p-4 flex flex-col justify-between space-y-4 hover:shadow-md transition-all bg-slate-50/40 hover:bg-white group text-left">
                                <div className="space-y-1">
                                  <span className="text-[9px] uppercase font-extrabold text-blue-600 tracking-wider bg-blue-50 px-2 py-0.5 rounded-md">{bulk.label}</span>
                                  <p className="text-xl font-black text-slate-800 pt-1">{bulk.count} Cans</p>
                                  <p className="text-[10px] text-slate-400 leading-tight">{bulk.desc}</p>
                                </div>
                                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                                  <div>
                                    <span className="text-[8px] text-slate-400 block font-bold">TOTAL COST</span>
                                    <span className="text-sm font-extrabold text-slate-700">₹{bulk.total}</span>
                                  </div>
                                  <button 
                                    onClick={() => {
                                      const p = products.find(prod => prod.id === 'prod-1' || prod.category === '20L Water Bottle');
                                      if (p) {
                                        setCart({ [p.id]: bulk.count });
                                        setCartDrawerOpen(true);
                                        showToast(`Wholesale order of ${bulk.count} cans loaded into dispatch!`, 'success');
                                      }
                                    }}
                                    className="p-2 bg-slate-100 group-hover:bg-blue-600 text-slate-600 group-hover:text-white rounded-xl transition-all"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Custom Order Dispatch Trigger */}
                          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div className="flex items-center gap-3 text-left">
                              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-bold">
                                20L
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-700">Need a custom bulk volume?</p>
                                <p className="text-[10px] text-slate-400">Browse other dispensers, events packages, and corporate stands</p>
                              </div>
                            </div>
                            <button 
                              onClick={() => {
                                setActiveTab('products');
                                setAdminCategoryFilter('All');
                              }} 
                              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-blue-100 transition-colors"
                            >
                              Explore Product Catalog
                            </button>
                          </div>
                        </div>

                        {/* Live Dispatch Tracking Map Widget */}
                        {activeTrackingOrder && activeTrackingOrder.status !== 'Delivered' && activeTrackingOrder.status !== 'Cancelled' && (
                          <div id="live-tracking-panel" className="bg-gradient-to-r from-blue-50 to-sky-50 rounded-3xl border border-blue-200 p-6 space-y-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center animate-pulse">
                                  <Truck className="w-5 h-5" />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Lightning Delivery Out Now</p>
                                  <h4 className="text-lg font-black text-slate-800">Tracking Order #{activeTrackingOrder.id}</h4>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-xl border border-blue-100 text-xs">
                                <Clock className="w-4 h-4 text-slate-500" />
                                <span className="font-semibold text-slate-600">ETA: <strong>18 Mins</strong></span>
                              </div>
                            </div>

                            {/* Timeline visualization of Delivery stages */}
                            <div className="relative pt-2">
                              <div className="absolute top-6 left-5 right-5 h-1 bg-slate-200 -z-1" />
                              
                              <div className="grid grid-cols-5 text-center relative z-10">
                                <div className="space-y-2">
                                  <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center ${
                                    ['Pending', 'Confirmed', 'Preparing', 'Out For Delivery', 'Delivered'].includes(activeTrackingOrder.status)
                                      ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'
                                  }`}>
                                    <Check className="w-4 h-4" />
                                  </div>
                                  <p className="text-[10px] font-extrabold text-slate-700">Received</p>
                                </div>

                                <div className="space-y-2">
                                  <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center ${
                                    ['Confirmed', 'Preparing', 'Out For Delivery', 'Delivered'].includes(activeTrackingOrder.status)
                                      ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'
                                  }`}>
                                    <ShieldCheck className="w-4 h-4" />
                                  </div>
                                  <p className="text-[10px] font-extrabold text-slate-700">Confirmed</p>
                                </div>

                                <div className="space-y-2">
                                  <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center ${
                                    ['Preparing', 'Out For Delivery', 'Delivered'].includes(activeTrackingOrder.status)
                                      ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'
                                  }`}>
                                    <Package className="w-4 h-4" />
                                  </div>
                                  <p className="text-[10px] font-extrabold text-slate-700">Preparing</p>
                                </div>

                                <div className="space-y-2">
                                  <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center ${
                                    ['Out For Delivery', 'Delivered'].includes(activeTrackingOrder.status)
                                      ? 'bg-blue-600 text-white animate-bounce' : 'bg-slate-200 text-slate-400'
                                  }`}>
                                    <Truck className="w-4 h-4" />
                                  </div>
                                  <p className="text-[10px] font-extrabold text-slate-700">On The Way</p>
                                </div>

                                <div className="space-y-2">
                                  <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center ${
                                    (activeTrackingOrder.status as string) === 'Delivered'
                                      ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
                                  }`}>
                                    <CheckCircle className="w-4 h-4" />
                                  </div>
                                  <p className="text-[10px] font-extrabold text-slate-700">Delivered</p>
                                </div>
                              </div>
                            </div>

                            {/* Rider info */}
                            <div className="bg-white p-4 rounded-2xl border border-blue-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-sky-100 text-sky-700 rounded-full flex items-center justify-center font-bold">
                                  {activeTrackingOrder.assignedDeliveryPartner ? activeTrackingOrder.assignedDeliveryPartner.charAt(0) : 'R'}
                                </div>
                                <div className="text-left">
                                  <p className="text-xs font-bold text-slate-700">{activeTrackingOrder.assignedDeliveryPartner || 'Delivery Rider'}</p>
                                  <p className="text-[10px] text-slate-400">Assigned Amrit Dhara Logistics Partner</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <a href="tel:9000011111" className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5">
                                  <Phone className="w-3.5 h-3.5" /> Call Rider
                                </a>
                                <button 
                                  onClick={() => {
                                    const nextMap: { [key: string]: string } = {
                                      'Pending': 'Confirmed',
                                      'Confirmed': 'Preparing',
                                      'Preparing': 'Out For Delivery',
                                      'Out For Delivery': 'Delivered'
                                    };
                                    const next = nextMap[activeTrackingOrder.status] || 'Delivered';
                                    handleUpdateOrderStatus(activeTrackingOrder.id, next);
                                    setActiveTrackingOrder({ ...activeTrackingOrder, status: next as any });
                                  }} 
                                  className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" /> Simulate Next Stage
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Recent Order History / Invoices */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-extrabold text-slate-800">Business Ledger Statement</h3>
                          <div className="bg-white rounded-[28px] border border-slate-200/60 shadow-xs p-5">
                            {orders.filter(o => o.customerId === activeCustomerId).length === 0 ? (
                              <p className="text-xs text-slate-400 text-center py-8">No billing cycles or invoices recorded yet.</p>
                            ) : (
                              <div className="divide-y divide-slate-100 max-h-[350px] overflow-y-auto pr-1">
                                {orders.filter(o => o.customerId === activeCustomerId).map(o => (
                                  <div key={o.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-extrabold text-slate-800">Invoice #{o.id}</span>
                                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                          o.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                          o.status === 'Cancelled' ? 'bg-slate-50 text-slate-500' :
                                          'bg-amber-50 text-amber-700 border border-amber-100'
                                        }`}>
                                          {o.status}
                                        </span>
                                      </div>
                                      <p className="text-[10px] text-slate-400">
                                        Billed: {new Date(o.createdAt).toLocaleDateString()} • {o.products.reduce((acc, p) => acc + p.quantity, 0)} Jars • Method: {o.paymentMethod}
                                      </p>
                                    </div>

                                    <div className="flex items-center gap-4 justify-between sm:justify-end">
                                      <div className="text-right">
                                        <p className="text-sm font-black text-slate-800">₹{o.total}</p>
                                        <span className={`text-[10px] font-bold block ${
                                          o.paymentStatus === 'Paid' ? 'text-emerald-600' : 'text-amber-600 animate-pulse'
                                        }`}>
                                          {o.paymentStatus}
                                        </span>
                                      </div>

                                      {o.paymentStatus !== 'Paid' && (
                                        <button 
                                          onClick={() => {
                                            setPayDueAmount(o.total);
                                            setPayDueModalOpen(true);
                                          }}
                                          className="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-3.5 py-1.5 rounded-xl text-[10px] font-bold transition-all"
                                        >
                                          Settle UPI
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                      </div>

                      {/* Right Column (4 cols): AI Demand Advisor & Pricing SLA */}
                      <div className="lg:col-span-4 space-y-6 text-left">
                        
                        {/* Gemini AI Stock Buffer Optimizer */}
                        <div className="bg-gradient-to-br from-violet-600 to-indigo-700 text-white p-6 rounded-[28px] shadow-xl relative overflow-hidden space-y-4">
                          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
                            <Sparkles className="w-40 h-40 fill-white" />
                          </div>
                          
                          <div className="space-y-1 relative z-10">
                            <span className="text-[9px] font-extrabold uppercase bg-white/15 px-2.5 py-1 rounded-md tracking-widest text-violet-200">AI Stock Shield</span>
                            <h3 className="text-base font-black pt-1 flex items-center gap-1.5">
                              <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" /> Dynamic Demand Forecast
                            </h3>
                          </div>

                          <div className="space-y-3 relative z-10 text-xs">
                            {loadingInsights ? (
                              <div className="py-6 flex flex-col items-center justify-center gap-2">
                                <RefreshCw className="w-6 h-6 text-violet-200 animate-spin" />
                                <p className="text-[10px] text-violet-200 font-medium">Analyzing restaurant refill rates...</p>
                              </div>
                            ) : aiInsights ? (
                              <>
                                <div className="space-y-1">
                                  <p className="text-[9px] uppercase font-bold text-violet-200">Recommended Stock Window</p>
                                  <p className="font-extrabold text-white bg-white/10 p-2.5 rounded-xl border border-white/5">{aiInsights.demandPrediction}</p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-[9px] uppercase font-bold text-violet-200">Consumption Insights</p>
                                  <p className="text-violet-100 text-[11px] leading-relaxed font-medium bg-white/10 p-2.5 rounded-xl border border-white/5">{aiInsights.purchaseInsights}</p>
                                </div>
                              </>
                            ) : (
                              <p className="text-violet-100 leading-normal text-[11px]">Consistent alternate-day consumption pattern detected. Keep an emergency stock buffer of 5 extra jars during summer peak weekends.</p>
                            )}
                          </div>
                          <button 
                            onClick={loadAiInsights}
                            className="w-full py-2.5 bg-white text-indigo-700 rounded-xl font-bold text-[10px] uppercase tracking-wider hover:bg-violet-50 transition-all cursor-pointer relative z-10"
                          >
                            Refresh Live Forecast
                          </button>
                        </div>

                        {/* Wholesale Operational Pricing SLA */}
                        <div className="bg-white p-6 rounded-[28px] border border-slate-200/60 shadow-xs space-y-4">
                          <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2">Wholesale Tariff Grid</h4>
                          <div className="space-y-3 text-xs">
                            <div className="flex justify-between items-center py-1">
                              <span className="text-slate-500 font-medium">Standard Delivery Rate</span>
                              <strong className="text-slate-800">₹30 / Can <span className="text-[9px] text-slate-400 font-normal">(vs ₹35)</span></strong>
                            </div>
                            <div className="flex justify-between items-center py-1">
                              <span className="text-slate-500 font-medium">Self-Pickup Tariff</span>
                              <strong className="text-emerald-600">₹20 / Can <span className="text-[9px] text-slate-400 font-normal">(vs ₹25)</span></strong>
                            </div>
                            <div className="flex justify-between items-center py-1">
                              <span className="text-slate-500 font-medium">BPA-Free Jar Deposit</span>
                              <strong className="text-emerald-600">Waived <span className="text-[9px] text-slate-400 font-normal">($0 Security)</span></strong>
                            </div>
                            <div className="flex justify-between items-center py-1">
                              <span className="text-slate-500 font-medium">SLA Priority Slots</span>
                              <strong className="text-slate-800">06:00 AM Express</strong>
                            </div>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-2xl text-[10px] text-slate-500 leading-relaxed border border-slate-100 text-left">
                            <strong>Note:</strong> Bulk rates apply automatically upon cart checkout when logged in under the Retailer role.
                          </div>
                        </div>

                      </div>

                    </div>

                  </div>
                )}


                {/* =========================================================================
                    B. CUSTOMER PORTAL
                    ========================================================================= */}
                {activeRole === 'customer' && (
                  <div id="customer-household-workspace" className="space-y-8">
                    
                    {/* Greeting Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h2 className="text-2xl md:text-3xl font-display font-black tracking-tight text-slate-800">
                          Welcome back, {currentCustomer ? currentCustomer.name : 'Valued Customer'}!
                        </h2>
                        <p className="text-xs text-slate-500">Track deliveries, manage subscriptions, and examine consumption insights.</p>
                      </div>
                      
                      {/* Location Box */}
                      <div className="flex items-center gap-3 bg-white border border-slate-200 p-3 rounded-2xl shadow-xs self-start">
                        <MapPin className="w-5 h-5 text-sky-500" />
                        <div className="text-left">
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Delivery Sector</p>
                          <p className="text-xs font-bold text-slate-700 max-w-xs truncate">{deliveryAddress}</p>
                        </div>
                      </div>
                    </div>

                    {/* Customer Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-xs space-y-2">
                        <div className="flex justify-between items-center text-slate-400">
                          <span className="text-[11px] uppercase font-bold">Monthly Spent</span>
                          <TrendingUp className="w-4.5 h-4.5 text-blue-500" />
                        </div>
                        <p className="text-2xl font-extrabold text-slate-800">₹{currentCustomer ? currentCustomer.monthlySpending : 0}</p>
                        <p className="text-[10px] text-slate-400">Total spent during this month</p>
                      </div>

                      <div className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-xs space-y-2">
                        <div className="flex justify-between items-center text-slate-400">
                          <span className="text-[11px] uppercase font-bold">Dues Credit</span>
                          <AlertTriangle className="w-4.5 h-4.5 text-amber-500" />
                        </div>
                        <p className="text-2xl font-extrabold text-slate-800">₹{currentCustomer ? currentCustomer.outstandingBalance : 0}</p>
                        {currentCustomer && currentCustomer.outstandingBalance > 0 ? (
                          <button 
                            onClick={() => {
                              setPayDueAmount(currentCustomer.outstandingBalance);
                              setPayDueModalOpen(true);
                            }}
                            className="text-[10px] font-bold text-amber-600 hover:text-amber-700 flex items-center gap-0.5"
                          >
                            Clear Balance <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <p className="text-[10px] text-slate-400">All balances are settled</p>
                        )}
                      </div>

                      <div className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-xs space-y-2">
                        <div className="flex justify-between items-center text-slate-400">
                          <span className="text-[11px] uppercase font-bold">Total Bottles</span>
                          <Droplet className="w-4.5 h-4.5 text-sky-500 fill-sky-200" />
                        </div>
                        <p className="text-2xl font-extrabold text-slate-800">{currentCustomer ? currentCustomer.totalPurchases : 0}</p>
                        <p className="text-[10px] text-slate-400">Purchased since membership</p>
                      </div>

                      <div className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-xs space-y-2">
                        <div className="flex justify-between items-center text-slate-400">
                          <span className="text-[11px] uppercase font-bold">Subscriptions</span>
                          <Calendar className="w-4.5 h-4.5 text-indigo-500" />
                        </div>
                        <p className="text-2xl font-extrabold text-slate-800">
                          {subscriptions.filter(s => s.customerId === activeCustomerId && s.status === 'Active').length}
                        </p>
                        <button 
                          onClick={() => setActiveTab('subscriptions')}
                          className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5"
                        >
                          Manage Schedules <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Active Tracking Display */}
                    {activeTrackingOrder && activeTrackingOrder.status !== 'Delivered' && activeTrackingOrder.status !== 'Cancelled' && (
                      <div id="live-tracking-panel" className="bg-gradient-to-r from-blue-50 to-sky-50 rounded-3xl border border-blue-200 p-6 space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center animate-pulse">
                              <Truck className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Lightning Delivery Out Now</p>
                              <h4 className="text-lg font-black text-slate-800">Tracking Order #{activeTrackingOrder.id}</h4>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-xl border border-blue-100 text-xs">
                            <Clock className="w-4 h-4 text-slate-500" />
                            <span className="font-semibold text-slate-600">ETA: <strong>18 Mins</strong></span>
                          </div>
                        </div>

                        {/* Timeline visualization of Delivery stages */}
                        <div className="relative pt-2">
                          <div className="absolute top-6 left-5 right-5 h-1 bg-slate-200 -z-1" />
                          
                          <div className="grid grid-cols-5 text-center relative z-10">
                            <div className="space-y-2">
                              <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center ${
                                ['Pending', 'Confirmed', 'Preparing', 'Out For Delivery', 'Delivered'].includes(activeTrackingOrder.status)
                                  ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'
                              }`}>
                                <Check className="w-4 h-4" />
                              </div>
                              <p className="text-[10px] font-extrabold text-slate-700">Received</p>
                            </div>

                            <div className="space-y-2">
                              <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center ${
                                ['Confirmed', 'Preparing', 'Out For Delivery', 'Delivered'].includes(activeTrackingOrder.status)
                                  ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'
                              }`}>
                                <ShieldCheck className="w-4 h-4" />
                              </div>
                              <p className="text-[10px] font-extrabold text-slate-700">Confirmed</p>
                            </div>

                            <div className="space-y-2">
                              <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center ${
                                ['Preparing', 'Out For Delivery', 'Delivered'].includes(activeTrackingOrder.status)
                                  ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'
                              }`}>
                                <Package className="w-4 h-4" />
                              </div>
                              <p className="text-[10px] font-extrabold text-slate-700">Preparing</p>
                            </div>

                            <div className="space-y-2">
                              <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center ${
                                ['Out For Delivery', 'Delivered'].includes(activeTrackingOrder.status)
                                  ? 'bg-blue-600 text-white animate-bounce' : 'bg-slate-200 text-slate-400'
                              }`}>
                                <Truck className="w-4 h-4" />
                              </div>
                              <p className="text-[10px] font-extrabold text-slate-700">On The Way</p>
                            </div>

                            <div className="space-y-2">
                              <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center ${
                                (activeTrackingOrder.status as string) === 'Delivered'
                                  ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
                              }`}>
                                <CheckCircle className="w-4 h-4" />
                              </div>
                              <p className="text-[10px] font-extrabold text-slate-700">Delivered</p>
                            </div>
                          </div>
                        </div>

                        {/* Rider info */}
                        <div className="bg-white p-4 rounded-2xl border border-blue-100 flex flex-col md:flex-row items-center justify-between gap-4">
                          <div className="flex items-center gap-3 text-left">
                            <div className="w-10 h-10 bg-sky-100 text-sky-700 rounded-full flex items-center justify-center font-bold">
                              {activeTrackingOrder.assignedDeliveryPartner ? activeTrackingOrder.assignedDeliveryPartner.charAt(0) : 'R'}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-700">{activeTrackingOrder.assignedDeliveryPartner || 'Delivery Rider'}</p>
                              <p className="text-[10px] text-slate-400">Assigned Amrit Dhara Logistics Partner</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <a href="tel:9000011111" className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5" /> Call Rider
                            </a>
                            <button 
                              onClick={() => {
                                const nextMap: { [key: string]: string } = {
                                  'Pending': 'Confirmed',
                                  'Confirmed': 'Preparing',
                                  'Preparing': 'Out For Delivery',
                                  'Out For Delivery': 'Delivered'
                                };
                                const next = nextMap[activeTrackingOrder.status] || 'Delivered';
                                handleUpdateOrderStatus(activeTrackingOrder.id, next);
                                setActiveTrackingOrder({ ...activeTrackingOrder, status: next as any });
                              }} 
                              className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5"
                            >
                              <RefreshCw className="w-3.5 h-3.5" /> Simulate Next Delivery Stage
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Household Columns: Quick Refill vs History */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      
                      {/* Household Cans Quick Refill */}
                      <div className="space-y-4">
                        <div className="flex justify-between items-center text-left">
                          <h3 className="text-lg font-extrabold text-slate-800">Quick Refill Water Cans</h3>
                          <button onClick={() => setActiveTab('products')} className="text-xs font-bold text-blue-600 hover:underline">View All</button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {products.slice(0, 2).map(p => (
                            <div key={p.id} className="bg-white border border-slate-200/60 rounded-3xl p-4 shadow-xs space-y-3 flex flex-col justify-between text-left">
                              <img src={p.image} alt={p.name} className="w-full h-32 object-cover rounded-2xl" />
                              <div className="space-y-1">
                                <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{p.name}</h4>
                                <p className="text-[10px] text-slate-400 line-clamp-2">{p.description}</p>
                              </div>
                              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                <div>
                                  <span className="text-[10px] text-slate-400 block font-semibold">PRICE</span>
                                  {p.category === '20L Water Bottle' ? (
                                    <p className="text-[11px] font-black text-slate-800">
                                      ₹35 <span className="text-[9px] text-slate-400 font-normal">Del</span> / ₹25 <span className="text-[9px] text-slate-400 font-normal">Pick</span>
                                    </p>
                                  ) : (
                                    <p className="text-sm font-extrabold text-slate-800">₹{p.price}</p>
                                  )}
                                </div>
                                <button 
                                  onClick={() => addToCart(p.id)} 
                                  className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1"
                                >
                                  <Plus className="w-4 h-4" /> Add
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Customer Recent Order History */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-extrabold text-slate-800 text-left">Recent Order History</h3>
                        <div className="bg-white rounded-3xl border border-slate-200/60 shadow-xs p-5">
                          {orders.filter(o => o.customerId === activeCustomerId).length === 0 ? (
                            <p className="text-xs text-slate-400 text-center py-6">No previous orders logged.</p>
                          ) : (
                            <div className="divide-y divide-slate-100 max-h-[290px] overflow-y-auto pr-1">
                              {orders.filter(o => o.customerId === activeCustomerId).map(o => (
                                <div key={o.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4 text-left">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-extrabold text-slate-800">Order #{o.id}</span>
                                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                        o.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                        o.status === 'Cancelled' ? 'bg-slate-50 text-slate-500' :
                                        'bg-amber-50 text-amber-700 border border-amber-100'
                                      }`}>
                                        {o.status}
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-slate-400">{new Date(o.createdAt).toLocaleDateString()} • {o.products.reduce((acc, p) => acc + p.quantity, 0)} Items</p>
                                  </div>

                                  <div className="text-right space-y-1">
                                    <p className="text-xs font-extrabold text-slate-800">₹{o.total}</p>
                                    <span className={`text-[9px] font-bold block ${
                                      o.paymentStatus === 'Paid' ? 'text-emerald-600' : 'text-amber-600'
                                    }`}>
                                      {o.paymentStatus} ({o.paymentMethod})
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                    </div>

                  </div>
                )}

              </motion.div>
            )}

            {/* 3. PRODUCT CATALOG SHOPPING PAGE */}
            {(activeRole === 'customer' || activeRole === 'retailer') && activeTab === 'products' && (
              <motion.div
                key="products"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                id="product-catalog-view"
                className="space-y-8"
              >
                
                {/* Search / filter control */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/60 shadow-xs">
                  <div className="relative flex-grow max-w-md">
                    <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search 20L water cans and bulk packages..." 
                      value={adminSearchTerm}
                      onChange={e => setAdminSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  {/* Filter tabs */}
                  <div className="flex items-center gap-1.5 overflow-x-auto">
                    {['All', '20L Water Bottle'].map(cat => (
                      <button 
                        key={cat} 
                        onClick={() => setAdminCategoryFilter(cat)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                          adminCategoryFilter === cat 
                            ? 'bg-blue-600 text-white shadow-md' 
                            : 'text-slate-600 hover:bg-slate-100 border border-slate-200/40'
                        }`}
                      >
                        {cat === 'All' ? 'All Formats' : 'Standard & Bulk 20L'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Catalog Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map(p => {
                    const rate = (activeRole === 'retailer' && p.category === '20L Water Bottle') ? 30 : p.price;
                    return (
                      <div key={p.id} className="bg-white border border-slate-200/60 rounded-3xl overflow-hidden shadow-xs flex flex-col justify-between group">
                        
                        {/* Image & rating */}
                        <div className="relative">
                          <img src={p.image} alt={p.name} className="w-full h-48 object-cover group-hover:scale-101 transition-all" />
                          <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs px-2 py-1 rounded-lg border border-slate-200 text-[10px] font-bold text-slate-700">
                            ★ {p.rating} ({p.reviewsCount})
                          </div>
                          {p.stock < 20 && (
                            <div className="absolute top-3 right-3 bg-rose-500 text-white px-2 py-1 rounded-lg text-[9px] font-extrabold uppercase">
                              Low Stock ({p.stock} left)
                            </div>
                          )}
                        </div>

                        {/* Details */}
                        <div className="p-5 flex-grow space-y-3">
                          <span className="text-[10px] uppercase font-bold text-sky-600 tracking-wider bg-sky-50 px-2.5 py-1 rounded-md">{p.category}</span>
                          <h4 className="font-extrabold text-slate-800 text-sm">{p.name}</h4>
                          <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">{p.description}</p>
                        </div>

                        {/* Interaction Actions */}
                        <div className="p-5 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-semibold">PRICE</span>
                            {p.category === '20L Water Bottle' && !p.id.includes('bulk') ? (
                              <div className="space-y-0.5">
                                <span className="text-sm font-black text-slate-800 block">₹35 <span className="text-[9px] text-slate-400 font-normal">Delivery</span></span>
                                <span className="text-xs font-bold text-slate-600 block">₹25 <span className="text-[9px] text-slate-400 font-normal">Pickup</span></span>
                                {activeRole === 'retailer' && (
                                  <span className="text-[9px] text-emerald-600 block font-bold">Wholesale: ₹30 / ₹20</span>
                                )}
                              </div>
                            ) : (
                              <>
                                <span className="text-base font-black text-slate-800">₹{rate}</span>
                              </>
                            )}
                          </div>

                          <div className="flex gap-2">
                            {/* Standard Cart add */}
                            <button 
                              onClick={() => addToCart(p.id)} 
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-blue-100 flex items-center gap-1"
                            >
                              <Plus className="w-4 h-4" /> Add
                            </button>

                            {/* Set up automatic schedule option */}
                            {p.category === '20L Water Bottle' && (
                              <button 
                                onClick={() => handleSubscribe(p, 'Daily', 1)} 
                                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-2.5 rounded-xl text-xs font-bold"
                                title="Set up recurring delivery schedule"
                              >
                                <Calendar className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>

              </motion.div>
            )}

            {/* 4. SUBSCRIPTION MANAGEMENT PORTAL */}
            {(activeRole === 'customer' || activeRole === 'retailer') && activeTab === 'subscriptions' && (
              <motion.div
                key="subscriptions"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                id="subscriptions-portal-view"
                className="space-y-8"
              >
                
                {/* Headings */}
                <div className="bg-gradient-to-r from-indigo-900 to-blue-900 text-white rounded-3xl p-6 md:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-sky-300 uppercase tracking-wider">Automated schedule engine</span>
                    <h2 className="text-2xl md:text-3xl font-extrabold">Hands-Free Water Delivery</h2>
                    <p className="text-xs md:text-sm text-slate-300">Set your bottle quantity once. We dispatch your orders autonomously, and you pay once a month via credit dues!</p>
                  </div>

                  <button 
                    onClick={() => setActiveTab('products')} 
                    className="bg-white text-indigo-900 px-5 py-3 rounded-2xl font-bold text-xs hover:bg-sky-50 transition-all flex items-center gap-1.5 self-start md:self-center"
                  >
                    <Plus className="w-4 h-4" /> Subscribe To Cans
                  </button>
                </div>

                {/* Subscriptions Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {subscriptions.filter(s => s.customerId === activeCustomerId).length === 0 ? (
                    <div className="col-span-2 bg-white rounded-3xl p-12 text-center border border-slate-200/60 shadow-xs space-y-4">
                      <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
                      <div>
                        <h4 className="font-bold text-slate-700">No active subscriptions detected</h4>
                        <p className="text-xs text-slate-400">Subscribe your household or business for autonomous doorstep dispatch.</p>
                      </div>
                      <button onClick={() => setActiveTab('products')} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs">Browse 20L Water Cans</button>
                    </div>
                  ) : (
                    subscriptions.filter(s => s.customerId === activeCustomerId).map(sub => (
                      <div key={sub.id} className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-xs space-y-5">
                        
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <span className={`text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-full ${
                              sub.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700'
                            }`}>
                              ● {sub.status}
                            </span>
                            <h4 className="font-black text-slate-800 text-sm pt-2">{sub.productName}</h4>
                            <p className="text-xs text-slate-400">Monthly estimated delivery: {sub.quantity * 15} Cans</p>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block font-bold">DELIVERY SCHEDULE</span>
                            <span className="text-xs font-extrabold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg inline-block">{sub.plan}</span>
                          </div>
                        </div>

                        {/* Stats block */}
                        <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-2xl text-center">
                          <div>
                            <span className="text-[9px] text-slate-400 block">Bottle Qty</span>
                            <span className="text-sm font-bold text-slate-700">{sub.quantity} Can(s)</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 block">Unit Cost</span>
                            <span className="text-sm font-bold text-slate-700">₹{sub.price}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 block">Daily Total</span>
                            <span className="text-sm font-bold text-slate-700">₹{sub.price * sub.quantity}</span>
                          </div>
                        </div>

                        {/* Interactive Pause/Resume and date skip controls */}
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 justify-between">
                          <button 
                            onClick={() => handleToggleSub(sub)}
                            className={`flex-grow py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
                              sub.paused 
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            {sub.paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                            {sub.paused ? 'Resume Subscription' : 'Pause Deliveries'}
                          </button>

                          <button 
                            onClick={() => {
                              showToast('Tomorrow skipped! Enjoy your holiday.', 'info');
                            }} 
                            disabled={sub.paused}
                            className="bg-amber-50 hover:bg-amber-100 text-amber-700 px-4 py-2.5 rounded-xl text-xs font-bold disabled:opacity-55"
                          >
                            Skip Tomorrow
                          </button>
                        </div>

                      </div>
                    ))
                  )}
                </div>

              </motion.div>
            )}

            {/* 5. AI INSIGHTS TAB */}
            {(activeRole === 'customer' || activeRole === 'retailer') && activeTab === 'insights' && (
              <motion.div
                key="insights"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                id="ai-insights-view"
                className="space-y-8"
              >
                
                {/* Header banner */}
                <div className="bg-gradient-to-r from-violet-900 via-indigo-950 to-purple-900 text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
                    <Sparkles className="w-80 h-80 text-violet-400 fill-violet-400" />
                  </div>
                  
                  <div className="space-y-3 relative z-10 max-w-xl">
                    <span className="text-xs font-bold text-violet-300 bg-violet-500/10 border border-violet-500/30 px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 fill-violet-300" /> Smart Demand Forecast
                    </span>
                    <h2 className="text-2xl md:text-3xl font-extrabold">Amrit AI Concierge</h2>
                    <p className="text-xs md:text-sm text-slate-300">Evaluating your household drinking rates in real-time. Powered by Google Gemini model to avoid running dry during high heatwaves.</p>
                  </div>
                </div>

                {loadingInsights ? (
                  <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3 flex flex-col items-center justify-center">
                    <RefreshCw className="w-10 h-10 text-violet-600 animate-spin" />
                    <p className="text-xs font-bold text-slate-600 animate-pulse">Running Gemini analysis on customer purchase ledger...</p>
                  </div>
                ) : aiInsights ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Forecast box */}
                    <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-xs space-y-4 md:col-span-2">
                      <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                        <TrendingUp className="w-5 h-5 text-violet-600" />
                        <h3 className="font-extrabold text-slate-800">Your Consumption Analytics</h3>
                      </div>

                      <div className="space-y-4">
                        <div className="p-4 bg-violet-50/50 rounded-2xl space-y-1">
                          <span className="text-[10px] text-violet-700 font-extrabold uppercase tracking-wider">Demand Projection</span>
                          <p className="text-sm font-extrabold text-slate-800">{aiInsights.demandPrediction}</p>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
                          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Purchase Profile</span>
                          <p className="text-xs text-slate-600 leading-relaxed">{aiInsights.purchaseInsights}</p>
                        </div>
                      </div>
                    </div>

                    {/* AI smart recommendation cards */}
                    <div className="space-y-6">
                      <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-xs space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                          <Sparkles className="w-5 h-5 text-violet-500 fill-violet-100" />
                          <h3 className="font-extrabold text-slate-800 text-sm">Recommended Next Buy</h3>
                        </div>

                        <div className="space-y-3">
                          {aiInsights.repeatSuggestions.map((s, idx) => (
                            <div key={idx} className="p-3 bg-violet-50/30 rounded-xl space-y-1">
                              <p className="text-xs font-extrabold text-slate-800">{s.productName}</p>
                              <p className="text-[10px] text-slate-500 leading-relaxed">{s.reason}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Coupon tips */}
                      <div className="bg-gradient-to-tr from-violet-600 to-indigo-700 text-white rounded-3xl p-6 shadow-md space-y-3">
                        <span className="text-[9px] font-bold bg-white/20 px-2.5 py-1 rounded-md uppercase tracking-wider">PROMO STRATEGY</span>
                        <p className="text-xs font-bold leading-relaxed">{aiInsights.couponAdvice}</p>
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
                    <button onClick={loadAiInsights} className="bg-violet-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 mx-auto">
                      <Sparkles className="w-4 h-4 fill-white" /> Get Personalized AI Insights
                    </button>
                  </div>
                )}

              </motion.div>
            )}

            {/* 6. RETAILER: ANALYTICS & REVENUE COMMAND CENTER */}
            {activeRole === 'retailer' && activeTab === 'dashboard' && analytics && (
              <motion.div
                key="retailer-analytics"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                id="admin-analytics-view"
                className="space-y-8"
              >
                
                {/* Statistics panel */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-xs space-y-1.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Sales Income</span>
                    <p className="text-2xl font-black text-slate-800">₹{analytics.revenue}</p>
                    <span className="text-[10px] text-emerald-600 font-bold">↑ 14% this week</span>
                  </div>
                  <div className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-xs space-y-1.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Receivable Dues</span>
                    <p className="text-2xl font-black text-slate-800 text-amber-600">₹{analytics.outstandingBalance}</p>
                    <span className="text-[10px] text-slate-400 font-bold">Uncollected retailer bills</span>
                  </div>
                  <div className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-xs space-y-1.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pending Orders</span>
                    <p className="text-2xl font-black text-slate-800">{analytics.pendingDeliveries}</p>
                    <span className="text-[10px] text-slate-400 font-bold">Currently in transit queue</span>
                  </div>
                  <div className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-xs space-y-1.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Low Stock Warnings</span>
                    <p className={`text-2xl font-black ${analytics.lowStockAlerts > 0 ? 'text-rose-600 animate-pulse' : 'text-slate-800'}`}>
                      {analytics.lowStockAlerts}
                    </p>
                    <span className="text-[10px] text-slate-400 font-bold">Products under threshold</span>
                  </div>
                </div>

                {/* Analytical charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Daily sales flow chart */}
                  <div className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-xs space-y-4">
                    <h4 className="font-extrabold text-slate-800 text-sm">Amrit daily income flow (₹)</h4>
                    <div className="h-64">
                      {analytics.revenueChart.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center pt-24">No transaction logs captured yet.</p>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={analytics.revenueChart}>
                            <defs>
                              <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }} />
                            <Area type="monotone" dataKey="revenue" name="Daily Revenue" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  {/* Customer outstanding balance chart */}
                  <div className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-xs space-y-4">
                    <h4 className="font-extrabold text-slate-800 text-sm">Customer Uncollected Credits (₹)</h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.outstandingTrends}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }} />
                          <Bar dataKey="due" name="Dues Outstanding (₹)" fill="#e11d48" radius={[8, 8, 0, 0]}>
                            {analytics.outstandingTrends.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={entry.due > 300 ? '#e11d48' : '#f59e0b'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                </div>

                {/* Logistics status map view list */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-sm">Logistics Fleet & Rider Status</h4>
                      <p className="text-[11px] text-slate-400">Track online delivery agents and vehicle load values</p>
                    </div>
                    <span className="text-xs text-blue-600 bg-blue-50 px-2.5 py-1.5 rounded-lg font-bold">3 Agents Online</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {analytics.deliveryPartners.map((dp: any) => (
                      <div key={dp.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-xs font-bold text-slate-800">{dp.name}</p>
                            <p className="text-[10px] text-slate-400">{dp.vehicle}</p>
                          </div>
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                            dp.status === 'Active' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {dp.status === 'Active' ? 'On Trip' : 'Awaiting Orders'}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-semibold space-y-1">
                          <p>⭐ Partner Rating: {dp.rating}</p>
                          <p>📍 Location coordinates: {dp.location.lat}, {dp.location.lng}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </motion.div>
            )}

            {/* 7. RETAILER: ORDERS DISPATCH BOARD */}
            {activeRole === 'retailer' && activeTab === 'orders' && (
              <motion.div
                key="retailer-orders"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                id="admin-orders-board"
                className="space-y-6"
              >
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black text-slate-800">Dispatch Order Queue</h3>
                    <p className="text-xs text-slate-500">Advance customer delivery stages, allocate delivery agents, and inspect payments.</p>
                  </div>
                </div>

                {/* Mobile & Tablet-optimized Stage Switcher (Hidden on Large screens) */}
                <div className="block lg:hidden space-y-4">
                  {/* Stage switching pill tabs */}
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
                    {['Pending', 'Confirmed', 'Preparing', 'Out For Delivery', 'Delivered'].map(stage => {
                      const count = orders.filter(o => o.status === stage).length;
                      const isActive = selectedDispatchStage === stage;
                      return (
                        <button
                          key={stage}
                          onClick={() => setSelectedDispatchStage(stage)}
                          className={`snap-center flex-shrink-0 px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all ${
                            isActive 
                              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/10 scale-102' 
                              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <span>{stage}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                            isActive ? 'bg-amber-700 text-white' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Active stage details & order cards stack */}
                  <div className="space-y-4">
                    {orders.filter(o => o.status === selectedDispatchStage).length === 0 ? (
                      <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-slate-200 p-6 space-y-2">
                        <p className="text-xs text-slate-400 font-bold">No dispatch orders are currently {selectedDispatchStage.toLowerCase()}.</p>
                        <p className="text-[10px] text-slate-400">All caught up here!</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {orders.filter(o => o.status === selectedDispatchStage).map(o => (
                          <div key={o.id} className="bg-white rounded-2xl p-4 border border-slate-200/50 shadow-xs space-y-3 text-left">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-xs font-black text-slate-800">Order #{o.id}</p>
                                <p className="text-[10px] text-slate-400">{new Date(o.createdAt).toLocaleTimeString()}</p>
                              </div>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                o.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                              }`}>
                                ₹{o.total}
                              </span>
                            </div>

                            <p className="text-xs font-semibold text-slate-600">Client: <strong>{o.customerName}</strong></p>
                            
                            <div className="text-[11px] text-slate-500 leading-normal border-t border-slate-100 pt-2">
                              {o.products.map((item, idx) => (
                                <div key={idx} className="flex justify-between">
                                  <span>{item.name} x{item.quantity}</span>
                                  <span className="font-bold">₹{item.price * item.quantity}</span>
                                </div>
                              ))}
                            </div>

                            <div className="text-[10px] text-slate-400 bg-slate-50 p-2 rounded-lg truncate">
                              📍 {o.address}
                            </div>

                            {o.transactionRef && (
                              <div className="text-[10px] text-blue-700 bg-blue-50/50 border border-blue-100 p-2 rounded-lg font-mono flex items-center justify-between">
                                <span className="truncate mr-1">💳 UTR: <strong>{o.transactionRef}</strong></span>
                                <span className="text-[9px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-sans font-bold uppercase shrink-0">Verify Live</span>
                              </div>
                            )}

                            {/* Progress buttons */}
                            <div className="flex gap-2 pt-2 border-t border-slate-100">
                              {selectedDispatchStage === 'Pending' && (
                                <button onClick={() => handleUpdateOrderStatus(o.id, 'Confirmed')} className="w-full bg-blue-600 text-white text-[10px] font-bold py-2 rounded-lg">Confirm Order</button>
                              )}
                              {selectedDispatchStage === 'Confirmed' && (
                                <button onClick={() => handleUpdateOrderStatus(o.id, 'Preparing')} className="w-full bg-amber-600 text-white text-[10px] font-bold py-2 rounded-lg">Load Stock Can</button>
                              )}
                              {selectedDispatchStage === 'Preparing' && (
                                <button onClick={() => handleUpdateOrderStatus(o.id, 'Out For Delivery')} className="w-full bg-indigo-600 text-white text-[10px] font-bold py-2 rounded-lg">Dispatch Rider</button>
                              )}
                              {selectedDispatchStage === 'Out For Delivery' && (
                                <button onClick={() => handleUpdateOrderStatus(o.id, 'Delivered')} className="w-full bg-emerald-600 text-white text-[10px] font-bold py-2 rounded-lg">Complete Delivery</button>
                              )}
                              {selectedDispatchStage === 'Delivered' && (
                                <span className="text-[10px] text-emerald-600 font-extrabold flex items-center justify-center gap-1 w-full"><CheckCircle className="w-4 h-4" /> Completed</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Desktop Multi-column Layout (Visible only on Large screens) */}
                <div className="hidden lg:grid lg:grid-cols-3 xl:grid-cols-5 gap-6">
                  {['Pending', 'Confirmed', 'Preparing', 'Out For Delivery', 'Delivered'].map(stage => {
                    const stageOrders = orders.filter(o => o.status === stage);

                    return (
                      <div key={stage} className="bg-slate-100 rounded-3xl p-4 space-y-3 min-h-[400px]">
                        <div className="flex justify-between items-center px-2">
                          <span className="text-xs font-black text-slate-600 uppercase">{stage}</span>
                          <span className="text-xs bg-slate-200 text-slate-700 font-black px-2 py-0.5 rounded-full">{stageOrders.length}</span>
                        </div>

                        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                          {stageOrders.map(o => (
                            <div key={o.id} className="bg-white rounded-2xl p-4 border border-slate-200/50 shadow-xs space-y-3 text-left">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="text-xs font-black text-slate-800">Order #{o.id}</p>
                                  <p className="text-[10px] text-slate-400">{new Date(o.createdAt).toLocaleTimeString()}</p>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  o.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                                }`}>
                                  ₹{o.total}
                                </span>
                              </div>

                              <p className="text-xs font-semibold text-slate-600">Client: <strong>{o.customerName}</strong></p>
                              
                              <div className="text-[11px] text-slate-500 leading-normal border-t border-slate-100 pt-2">
                                {o.products.map((item, idx) => (
                                  <div key={idx} className="flex justify-between">
                                    <span>{item.name} x{item.quantity}</span>
                                    <span className="font-bold">₹{item.price * item.quantity}</span>
                                  </div>
                                ))}
                              </div>

                              <div className="text-[10px] text-slate-400 bg-slate-50 p-2 rounded-lg truncate">
                                📍 {o.address}
                              </div>

                              {o.transactionRef && (
                                <div className="text-[10px] text-blue-700 bg-blue-50/50 border border-blue-100 p-2 rounded-lg font-mono flex items-center justify-between">
                                  <span className="truncate mr-1">💳 UTR Ref: <strong>{o.transactionRef}</strong></span>
                                  <span className="text-[9px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-sans font-bold uppercase shrink-0">Verify Live</span>
                                </div>
                              )}

                              {/* Progress buttons */}
                              <div className="flex gap-2 pt-2 border-t border-slate-100">
                                {stage === 'Pending' && (
                                  <button onClick={() => handleUpdateOrderStatus(o.id, 'Confirmed')} className="w-full bg-blue-600 text-white text-[10px] font-bold py-2 rounded-lg">Confirm Order</button>
                                )}
                                {stage === 'Confirmed' && (
                                  <button onClick={() => handleUpdateOrderStatus(o.id, 'Preparing')} className="w-full bg-amber-600 text-white text-[10px] font-bold py-2 rounded-lg">Load Stock Can</button>
                                )}
                                {stage === 'Preparing' && (
                                  <button onClick={() => handleUpdateOrderStatus(o.id, 'Out For Delivery')} className="w-full bg-indigo-600 text-white text-[10px] font-bold py-2 rounded-lg">Dispatch Rider</button>
                                )}
                                {stage === 'Out For Delivery' && (
                                  <button onClick={() => handleUpdateOrderStatus(o.id, 'Delivered')} className="w-full bg-emerald-600 text-white text-[10px] font-bold py-2 rounded-lg">Complete Delivery</button>
                                )}
                                {stage === 'Delivered' && (
                                  <span className="text-[10px] text-emerald-600 font-extrabold flex items-center justify-center gap-1 w-full"><CheckCircle className="w-4 h-4" /> Completed</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

              </motion.div>
            )}

            {/* 8. RETAILER: CATALOG EDIT MODE */}
            {activeRole === 'retailer' && activeTab === 'inventory' && (
              <motion.div
                key="retailer-inventory"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                id="admin-catalog-manager"
                className="space-y-8"
              >
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  
                  {/* Form to Add/Edit Product */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-xs h-fit space-y-5">
                    <h4 className="font-extrabold text-slate-800 text-sm">
                      {editingProduct ? 'Modify Catalog Product' : 'Register New Water Product'}
                    </h4>

                    <form onSubmit={handleSaveProduct} className="space-y-4 text-left">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-slate-500">Product Name</label>
                        <input 
                          type="text" 
                          required
                          value={productForm.name}
                          onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-slate-500">Category</label>
                        <select 
                          value={productForm.category}
                          onChange={e => setProductForm({ ...productForm, category: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs"
                        >
                          <option>20L Water Bottle</option>
                          <option>Bottle Stand</option>
                          <option>Dispenser</option>
                          <option>Bottle Cap</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase font-bold text-slate-500">Price (₹)</label>
                          <input 
                            type="number" 
                            required
                            value={productForm.price || ''}
                            onChange={e => setProductForm({ ...productForm, price: Number(e.target.value) })}
                            className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase font-bold text-slate-500">Stock Units</label>
                          <input 
                            type="number" 
                            required
                            value={productForm.stock || ''}
                            onChange={e => setProductForm({ ...productForm, stock: Number(e.target.value) })}
                            className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-slate-500">Image URL</label>
                        <input 
                          type="text" 
                          required
                          value={productForm.image}
                          onChange={e => setProductForm({ ...productForm, image: e.target.value })}
                          placeholder="Unsplash picture link"
                          className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-slate-500">Description</label>
                        <textarea 
                          rows={3}
                          required
                          value={productForm.description}
                          onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs"
                        />
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button type="submit" className="flex-grow bg-rose-600 hover:bg-rose-700 text-white py-2.5 rounded-xl text-xs font-bold">
                          {editingProduct ? 'Update Product' : 'Add to Catalog'}
                        </button>
                        {editingProduct && (
                          <button 
                            type="button" 
                            onClick={() => {
                              setEditingProduct(null);
                              setProductForm({ name: '', category: '20L Water Bottle', price: 0, image: '', description: '', stock: 100 });
                            }} 
                            className="bg-slate-100 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </form>

                    {/* Configurable Stock Alert Settings Card */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-xs space-y-4 text-left">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 bg-amber-50 rounded-lg text-amber-600">
                          <Settings className="w-4 h-4" />
                        </span>
                        <div>
                          <h4 className="font-extrabold text-slate-800 text-xs">Inventory Threshold Settings</h4>
                          <p className="text-[10px] text-slate-400">Configure automated low stock alerts</p>
                        </div>
                      </div>

                      <form onSubmit={handleSaveSettings} className="space-y-3">
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase font-bold text-slate-500">
                            Low Stock Alert Threshold ({settings?.lowStockThreshold ?? 20} units)
                          </label>
                          <div className="relative flex items-center">
                            <input 
                              type="number" 
                              required
                              min={1}
                              max={1000}
                              value={thresholdInput}
                              onChange={e => setThresholdInput(parseInt(e.target.value) || 0)}
                              className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold pr-16"
                              placeholder="e.g. 20"
                            />
                            <span className="absolute right-3.5 text-[10px] text-slate-400 font-bold">Units</span>
                          </div>
                          <p className="text-[10px] text-slate-400 leading-relaxed">
                            An automated high-fidelity system warning alert is dispatched to the admin dashboard instantly whenever any product's stock levels fall below this configured threshold.
                          </p>
                        </div>

                        <button 
                          type="submit" 
                          className="w-full bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold py-2.5 rounded-xl transition-all"
                        >
                          Save Inventory Threshold
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* Product Catalog Registry Grid for edits */}
                  <div className="lg:col-span-2 space-y-4">
                    <h4 className="font-extrabold text-slate-800 text-sm text-left">Active Catalog Inventory ({products.length} Products)</h4>
                    
                    <div className="bg-white rounded-3xl border border-slate-200/60 overflow-hidden shadow-xs">
                      <table className="w-full border-collapse text-left">
                        <thead>
                          <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-200">
                            <th className="p-4">Item Details</th>
                            <th className="p-4">Category</th>
                            <th className="p-4">Price</th>
                            <th className="p-4">Stock Status</th>
                            <th className="p-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                          {products.map(p => (
                            <tr key={p.id}>
                              <td className="p-4 flex items-center gap-3">
                                <img src={p.image} alt={p.name} className="w-10 h-10 object-cover rounded-lg" />
                                <span className="font-bold text-slate-800 line-clamp-1">{p.name}</span>
                              </td>
                              <td className="p-4 text-slate-500 font-semibold">{p.category}</td>
                              <td className="p-4 font-bold text-slate-800">₹{p.price}</td>
                              <td className="p-4">
                                <span className={`font-bold ${p.stock < (settings?.lowStockThreshold ?? 20) ? 'text-rose-600 font-black animate-pulse' : 'text-slate-500'}`}>{p.stock} units</span>
                              </td>
                              <td className="p-4 text-right">
                                <div className="flex gap-2 justify-end">
                                  <button onClick={() => handleEditProductClick(p)} className="p-1.5 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-lg">
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => handleDeleteProduct(p.id)} className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>

              </motion.div>
            )}

            {/* 9. RETAILER: CUSTOMER LEDGER & DEBT COLLECTOR */}
            {activeRole === 'retailer' && (activeTab === 'customers' || activeTab === 'payments') && (
              <motion.div
                key="retailer-ledger"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                id="admin-debt-ledger"
                className="space-y-6"
              >
                
                {activeTab === 'customers' && (
                  <>
                    <div>
                      <h3 className="text-lg font-black text-slate-800">Outstanding Customer Credits Ledger</h3>
                      <p className="text-xs text-slate-500">Audit unpaid accounts and track retailer credit thresholds.</p>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-200/60 overflow-hidden shadow-xs">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-200">
                        <th className="p-4">Client Name</th>
                        <th className="p-4">Registered Contact</th>
                        <th className="p-4">Credit Limit Profile</th>
                        <th className="p-4">Outstanding Balance</th>
                        <th className="p-4 text-right">Settlement Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {customers.map(c => (
                        <tr key={c.id}>
                          <td className="p-4">
                            <p className="font-black text-slate-800">{c.name}</p>
                            <p className="text-[10px] text-slate-400 truncate max-w-xs">📍 {c.address}</p>
                          </td>
                          <td className="p-4 text-slate-600 font-semibold">{c.email} <br/> <span className="text-[10px] text-slate-400">{c.phone}</span></td>
                          <td className="p-4 text-slate-500 font-bold">Standard Account</td>
                          <td className="p-4 font-black">
                            <span className={c.outstandingBalance > 0 ? 'text-rose-600 font-extrabold' : 'text-emerald-600'}>
                              ₹{c.outstandingBalance}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            {c.outstandingBalance > 0 ? (
                              <button 
                                onClick={() => {
                                  setActiveCustomerId(c.id);
                                  setPayDueAmount(c.outstandingBalance);
                                  setPayDueModalOpen(true);
                                }} 
                                className="bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 font-extrabold px-3 py-1.5 rounded-lg text-xs"
                              >
                                Collect Dues
                              </button>
                            ) : (
                              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-md">✔ All Settled</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {activeTab === 'payments' && (
              <div className="space-y-3 pt-4">
                <div>
                  <h4 className="text-sm font-black text-slate-800">Merchant Payment & Settlement Audit Logs</h4>
                    <p className="text-xs text-slate-500">Cross-verify customer-submitted transaction reference numbers (UTRs) with payments processed to the mobile number <strong className="text-blue-600">7327070843</strong>.</p>
                  </div>

                  <div className="bg-white rounded-3xl border border-slate-200/60 overflow-hidden shadow-xs">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-200">
                          <th className="p-4">Payment Timestamp</th>
                          <th className="p-4">Customer</th>
                          <th className="p-4">Reference No (UTR)</th>
                          <th className="p-4">Method</th>
                          <th className="p-4">Amount</th>
                          <th className="p-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {payments.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-slate-400 font-semibold">No recent payment logs found.</td>
                          </tr>
                        ) : (
                          payments.map(p => {
                            const cust = customers.find(c => c.id === p.customerId);
                            return (
                              <tr key={p.id}>
                                <td className="p-4 text-slate-500 font-medium">
                                  {new Date(p.date || Date.now()).toLocaleString()}
                                </td>
                                <td className="p-4">
                                  <span className="font-extrabold text-slate-800">{cust ? cust.name : 'Unknown Customer'}</span>
                                  <p className="text-[9px] text-slate-400">{cust ? cust.phone : ''}</p>
                                </td>
                                <td className="p-4">
                                  {p.transactionRef ? (
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-100 rounded-lg text-blue-700 font-mono font-bold select-all">
                                      <span>💳 {p.transactionRef}</span>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 italic">No UTR Provided</span>
                                  )}
                                </td>
                                <td className="p-4 text-slate-600 font-bold uppercase">{p.paymentMethod}</td>
                                <td className="p-4 font-black text-slate-800">₹{p.amount}</td>
                                <td className="p-4">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                    p.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                                  }`}>
                                    {p.status}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          </AnimatePresence>
        )}

      </main>

      {/* SHOPPING CART OVERLAY DRAWER PANEL */}
      {cartDrawerOpen && (
        <div id="cart-drawer-backdrop" className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex justify-end">
          <div id="cart-drawer" className="bg-white w-full max-w-md h-full flex flex-col justify-between shadow-2xl border-l border-slate-200 text-left animate-slide-in">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-200/80 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ShoppingCart className="text-blue-600 w-5 h-5" />
                <span className="font-extrabold text-slate-800 text-base">My Smart Cart</span>
              </div>
              <button 
                id="close-cart-btn"
                onClick={() => setCartDrawerOpen(false)} 
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart content */}
            <div className="flex-grow overflow-y-auto p-5 space-y-6">
              {getCartCount() === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                  <ShoppingCart className="w-12 h-12 text-slate-300" />
                  <div>
                    <h4 className="font-bold text-slate-700">Your cart is empty</h4>
                    <p className="text-xs text-slate-400">Choose Amrit items to start your delivery.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.keys(cart).map(id => {
                    const p = products.find(prod => prod.id === id)!;
                    let rate = p.price;
                    if (p.id === 'prod-1' || p.category === '20L Water Bottle') {
                      if (deliveryOption === 'pickup') {
                        rate = (activeRole === 'retailer') ? 20 : 25;
                      } else {
                        rate = (activeRole === 'retailer') ? 30 : 35;
                      }
                    }
                    return (
                      <div key={id} className="flex items-center justify-between gap-4 p-3 border border-slate-100 rounded-2xl">
                        <img src={p.image} alt={p.name} className="w-12 h-12 object-cover rounded-xl" />
                        <div className="flex-grow">
                          <h5 className="text-xs font-black text-slate-800 line-clamp-1">{p.name}</h5>
                          <p className="text-xs font-bold text-slate-500">₹{rate}</p>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded-xl">
                          <button onClick={() => updateCartQuantity(id, cart[id] - 1)} className="p-1 hover:bg-slate-200 rounded-md">
                            <Minus className="w-3.5 h-3.5 text-slate-600" />
                          </button>
                          <span className="text-xs font-black text-slate-800 w-4 text-center">{cart[id]}</span>
                          <button onClick={() => updateCartQuantity(id, cart[id] + 1)} className="p-1 hover:bg-slate-200 rounded-md">
                            <Plus className="w-3.5 h-3.5 text-slate-600" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Coupon section */}
                  <div className="border-t border-slate-100 pt-4 space-y-2">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Available Amrit Coupons</label>
                    <div className="flex gap-2">
                      <button onClick={() => handleApplyCoupon('AMRIT50')} className="flex-grow text-[10px] font-bold py-1.5 border border-dashed border-blue-300 text-blue-700 hover:bg-blue-50 rounded-lg">AMRIT50 (Save ₹50)</button>
                      <button onClick={() => handleApplyCoupon('WELCOME20')} className="flex-grow text-[10px] font-bold py-1.5 border border-dashed border-indigo-300 text-indigo-700 hover:bg-indigo-50 rounded-lg">WELCOME20 (20% Off)</button>
                    </div>
                  </div>

                  {/* Delivery details form */}
                  <div className="border-t border-slate-100 pt-4 space-y-3">
                    
                    {/* Fulfillment Choice */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Fulfillment Method</label>
                      <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setDeliveryOption('delivery')}
                          className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                            deliveryOption === 'delivery'
                              ? 'bg-white text-blue-600 shadow-xs'
                              : 'text-slate-600 hover:text-slate-800'
                          }`}
                        >
                          <Truck className="w-3.5 h-3.5" />
                          Delivery (₹35)
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeliveryOption('pickup')}
                          className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                            deliveryOption === 'pickup'
                              ? 'bg-white text-blue-600 shadow-xs'
                              : 'text-slate-600 hover:text-slate-800'
                          }`}
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          Self Pickup (₹25)
                        </button>
                      </div>
                    </div>

                    {deliveryOption === 'delivery' ? (
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-slate-400">Drop-off Address</label>
                        <input 
                          type="text" 
                          value={deliveryAddress}
                          onChange={e => setDeliveryAddress(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs rounded-xl"
                        />
                      </div>
                    ) : (
                      <div className="space-y-1 bg-blue-50/50 p-3 rounded-xl border border-blue-100/60">
                        <label className="text-[10px] uppercase font-bold text-blue-700 block">Pickup Location Hub</label>
                        <p className="text-xs font-bold text-slate-700">Amrit Central Outlet</p>
                        <p className="text-[10px] text-slate-500">Atalapur, Jajpur, Odisha – 755009 (Open 8 AM - 8 PM)</p>
                      </div>
                    )}

                    {deliveryOption === 'delivery' && (
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-slate-400">Preferred Delivery Slot</label>
                        <select 
                          value={selectedSlot}
                          onChange={e => setSelectedSlot(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs rounded-xl"
                        >
                          <option>Morning (08:00 AM - 11:00 AM)</option>
                          <option>Afternoon (12:00 PM - 03:00 PM)</option>
                          <option>Evening (04:00 PM - 07:00 PM)</option>
                        </select>
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400">Payment Option</label>
                      <select 
                        value={paymentMethod}
                        onChange={e => setTransitionPaymentMethod(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs rounded-xl"
                      >
                        <option value="UPI">UPI (GooglePay / PhonePe / Paytm)</option>
                        <option value="Card">Credit / Debit Card</option>
                        <option value="Pay Later">Pay Later (Account outstanding credit dues)</option>
                        <option value="Cash on Delivery">Cash on Delivery</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Price calculation summary */}
            {getCartCount() > 0 && (
              <div className="p-5 border-t border-slate-200 bg-slate-50 space-y-4">
                <div className="space-y-1.5 text-xs text-slate-500 leading-normal">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-bold text-slate-700">₹{getCartTotal().subtotal}</span>
                  </div>
                  {getCartTotal().discount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Promo Discount Applied</span>
                      <span>- ₹{getCartTotal().discount}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-500">
                    <span>Logistics / Pickup Fee</span>
                    <span className="text-emerald-600 font-bold">₹0 (Free/Included)</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>GST (5%)</span>
                    <span className="text-emerald-600 font-bold">₹0 (Included)</span>
                  </div>
                  <div className="flex justify-between text-base font-black text-slate-800 border-t border-slate-200 pt-2">
                    <span>Grand Total</span>
                    <span>₹{getCartTotal().total}</span>
                  </div>
                </div>

                <button 
                  id="checkout-confirm-btn"
                  onClick={handleCheckout} 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3.5 rounded-2xl text-xs shadow-lg shadow-blue-100 flex items-center justify-center gap-1.5"
                >
                  <CreditCard className="w-4.5 h-4.5" /> Confirm & Place Water Order
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* MODAL: COLLECT DUES OUTSTANDING PAYMENT INTERFACE */}
      {payDueModalOpen && (
        <div id="pay-due-modal" className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-5 text-left animate-scale-up">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h4 className="font-extrabold text-slate-800 flex items-center gap-1.5"><CreditCard className="w-5 h-5 text-amber-500" /> Settle Credit Balance</h4>
              <button onClick={() => setPayDueModalOpen(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-amber-50 rounded-2xl text-amber-900">
                <p className="text-[10px] uppercase font-bold text-amber-700">Account Outstanding Dues</p>
                <p className="text-xl font-black">₹{payDueAmount}</p>
                <p className="text-[10px] text-amber-600 leading-relaxed font-semibold pt-1">Unpaid orders will be marked paid upon clearing this balance.</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-400">UPI/Pay Gateway Provider</label>
                <div className="grid grid-cols-3 gap-2">
                  <button 
                    onClick={() => setSelectedPayDueMethod('UPI (GooglePay)')} 
                    className={`p-3 border rounded-xl text-center text-xs font-bold transition-all ${selectedPayDueMethod.includes('GooglePay') ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600'}`}
                  >
                    GPay
                  </button>
                  <button 
                    onClick={() => setSelectedPayDueMethod('UPI (PhonePe)')} 
                    className={`p-3 border rounded-xl text-center text-xs font-bold transition-all ${selectedPayDueMethod.includes('PhonePe') ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-slate-200 text-slate-600'}`}
                  >
                    PhonePe
                  </button>
                  <button 
                    onClick={() => setSelectedPayDueMethod('UPI (Paytm)')} 
                    className={`p-3 border rounded-xl text-center text-xs font-bold transition-all ${selectedPayDueMethod.includes('Paytm') ? 'border-sky-500 bg-sky-50 text-sky-700' : 'border-slate-200 text-slate-600'}`}
                  >
                    Paytm
                  </button>
                </div>
              </div>

              {/* Designated UPI ID Area with Real QR and Redirects */}
              {(() => {
                const payDueProviderId = selectedPayDueMethod.includes('GooglePay') ? '7327070843@okaxis' : selectedPayDueMethod.includes('Paytm') ? '7327070843@paytm' : '7327070843@ybl';
                const payDueUpiString = `upi://pay?pa=${payDueProviderId}&pn=Amrit%20Dhara&am=${payDueAmount}&cu=INR&tn=SettleDue`;
                return (
                  <div className="space-y-4">
                    <div className="space-y-3 bg-blue-50/50 p-4 rounded-3xl border border-blue-100 text-center">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Real-time Dynamic Scan-to-Pay</p>
                      
                      <div className="relative w-36 h-36 mx-auto bg-white border border-slate-200 rounded-2xl p-2 flex items-center justify-center overflow-hidden shadow-inner">
                        <div className="absolute left-0 right-0 h-0.5 bg-blue-500 shadow-sm shadow-blue-400 animate-pulse top-1/2" style={{ animationDuration: '2s', animationIterationCount: 'infinite' }}></div>
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(payDueUpiString)}`}
                          alt="Due Settlement QR"
                          className="w-32 h-32 object-contain relative z-10"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      <div className="text-center">
                        <p className="text-xs font-black text-blue-600 font-mono tracking-wide">{payDueProviderId}</p>
                        <p className="text-[10px] text-slate-500 mt-1 font-semibold">Payable to: <strong>Amrit Dhara Corporation</strong></p>
                      </div>

                      <div className="pt-1.5">
                        <a 
                          href={payDueUpiString}
                          onClick={() => showToast('Launching UPI Application...', 'info')}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-black rounded-xl hover:bg-blue-700 transition-all shadow-md"
                        >
                          📲 Pay Directly via {selectedPayDueMethod.replace('UPI (', '').replace(')', '')}
                        </a>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Confirm Transaction Ref No (UTR No)</label>
                      <input 
                        type="text" 
                        maxLength={12}
                        placeholder="Enter 12-digit payment reference number"
                        value={duesUtr}
                        onChange={(e) => setDuesUtr(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-3 py-2 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-xs rounded-xl font-mono"
                      />
                      <p className="text-[9px] text-slate-400 font-medium">Please enter the 12-digit UTR from your UPI payment success screen to verify instant settlement.</p>
                    </div>
                  </div>
                );
              })()}
            </div>

            <button 
              onClick={() => {
                if (duesUtr.length > 0 && duesUtr.length !== 12) {
                  showToast('Please enter a valid 12-digit UPI UTR No, or leave blank to continue.', 'error');
                  return;
                }
                handleSettleDue();
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3.5 rounded-2xl text-xs shadow-lg shadow-blue-100 flex items-center justify-center gap-1.5"
            >
              Confirm Settlement of ₹{payDueAmount}
            </button>
          </div>
        </div>
      )}

      {/* MODAL: AMRITPAY SECURE CHECKOUT GATEWAY */}
      {checkoutPaymentModalOpen && (
        <div id="checkout-payment-modal" className="fixed inset-0 bg-slate-900/65 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-100 shadow-2xl overflow-hidden animate-scale-up text-left">
            
            {/* Header */}
            <div className="bg-slate-950 text-white p-6 relative">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-black text-blue-400 tracking-widest uppercase bg-blue-500/15 border border-blue-500/20 px-2.5 py-1 rounded-full">AmritPay Secure Checkout</span>
                  <h4 className="text-xl font-bold mt-3 text-white flex items-center gap-2">
                    <Lock className="w-5 h-5 text-emerald-400 fill-emerald-500/20" /> Autopay Gateway
                  </h4>
                </div>
                <button 
                  onClick={() => {
                    setCheckoutPaymentModalOpen(false);
                    setSimulatingPaymentStep('idle');
                  }} 
                  className="p-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-slate-300 hover:text-white transition-all"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Badges */}
              <div className="flex gap-4 mt-4 pt-4 border-t border-white/10 text-[10px] font-semibold text-slate-400">
                <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> PCI-DSS v4.0 Compliant</span>
                <span className="flex items-center gap-1"><Lock className="w-3.5 h-3.5 text-blue-400" /> AES-256 Bit SSL Tunnel</span>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-6 max-h-[65vh] overflow-y-auto">
              
              {/* Payment Summary */}
              <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Grand Total Amount</p>
                  <p className="text-2xl font-black text-slate-900">₹{getCartTotal().total}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-600">Selected Method</p>
                  <p className="text-xs font-black text-blue-600 uppercase tracking-wider bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-xl mt-1 inline-block">{paymentMethod}</p>
                </div>
              </div>

              {/* SANDBOX CONTROLS */}
              <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-amber-600" /> Gateway Sandbox Simulator
                  </span>
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-md">Simulation Flags</span>
                </div>
                <p className="text-[11px] text-amber-700 leading-normal">Configure the bank server simulated response below to verify success, pending order states, or decline alerts instantly.</p>
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <button 
                    type="button"
                    onClick={() => {
                      setSandboxMode('success');
                      showToast('Sandbox mode: Simulate success configured.', 'info');
                    }}
                    className={`px-3 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${sandboxMode === 'success' ? 'bg-emerald-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    <Check className="w-3.5 h-3.5" /> Simulate Success
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      setSandboxMode('failed');
                      showToast('Sandbox mode: Simulate bank decline configured.', 'info');
                    }}
                    className={`px-3 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${sandboxMode === 'failed' ? 'bg-rose-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" /> Simulate Decline
                  </button>
                </div>
              </div>

              {/* Dynamic Interface based on paymentMethod */}
              {simulatingPaymentStep === 'idle' && (
                <div className="space-y-4">
                  
                  {paymentMethod === 'UPI' && (() => {
                    const totalAmt = getCartTotal().total;
                    const upiString = `upi://pay?pa=7327070843@ybl&pn=Amrit%20Dhara&am=${totalAmt}&cu=INR&tn=WaterOrder`;
                    return (
                      <div className="space-y-4 text-center">
                        <p className="text-xs font-bold text-slate-500">Scan this real dynamic QR code with any UPI app to complete the payment of <strong className="text-slate-800">₹{totalAmt}</strong> directly to our merchant account:</p>
                        
                        {/* Real interactive QR box with animated scanning laser line */}
                        <div className="relative w-44 h-44 mx-auto bg-white border border-slate-200 rounded-3xl p-3 flex items-center justify-center overflow-hidden shadow-inner">
                          {/* Laser Scan line */}
                          <div className="absolute left-0 right-0 h-0.5 bg-blue-500 shadow-md shadow-blue-400 animate-pulse top-1/2" style={{ animationDuration: '2s', animationIterationCount: 'infinite' }}></div>

                          {/* Dynamic QR code */}
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiString)}`}
                            alt="Scan to Pay QR"
                            className="w-36 h-36 object-contain relative z-10"
                            referrerPolicy="no-referrer"
                          />
                        </div>

                        {/* App Redirection Links */}
                        <div className="space-y-2">
                          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Or pay directly using your mobile UPI App:</p>
                          <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                            <a 
                              href={`upi://pay?pa=7327070843@okaxis&pn=Amrit%20Dhara&am=${totalAmt}&cu=INR&tn=WaterOrder`}
                              onClick={() => showToast('Redirecting to Google Pay...', 'info')}
                              className="flex flex-col items-center justify-center p-2.5 border border-slate-200 hover:border-blue-500 rounded-xl hover:bg-blue-50/30 transition-all text-center"
                            >
                              <span className="text-[10px] font-black text-slate-700">Google Pay</span>
                              <span className="text-[9px] text-blue-600 mt-1 font-bold">Pay Direct</span>
                            </a>
                            <a 
                              href={`upi://pay?pa=7327070843@ybl&pn=Amrit%20Dhara&am=${totalAmt}&cu=INR&tn=WaterOrder`}
                              onClick={() => showToast('Redirecting to PhonePe...', 'info')}
                              className="flex flex-col items-center justify-center p-2.5 border border-slate-200 hover:border-purple-500 rounded-xl hover:bg-purple-50/30 transition-all text-center"
                            >
                              <span className="text-[10px] font-black text-slate-700">PhonePe</span>
                              <span className="text-[9px] text-purple-600 mt-1 font-bold">Pay Direct</span>
                            </a>
                            <a 
                              href={`upi://pay?pa=7327070843@paytm&pn=Amrit%20Dhara&am=${totalAmt}&cu=INR&tn=WaterOrder`}
                              onClick={() => showToast('Redirecting to Paytm...', 'info')}
                              className="flex flex-col items-center justify-center p-2.5 border border-slate-200 hover:border-sky-500 rounded-xl hover:bg-sky-50/30 transition-all text-center"
                            >
                              <span className="text-[10px] font-black text-slate-700">Paytm</span>
                              <span className="text-[9px] text-sky-600 mt-1 font-bold">Pay Direct</span>
                            </a>
                          </div>
                        </div>

                        {/* Designated Merchant Info & UTR input */}
                        <div className="space-y-3 bg-blue-50/40 p-4 rounded-2xl border border-blue-100 max-w-sm mx-auto text-left">
                          <div className="text-center pb-1.5 border-b border-blue-100/60">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Linked Payment Account</p>
                            <p className="text-xs font-black text-blue-600 font-mono tracking-wide">7327070843@ybl</p>
                            <p className="text-[9px] text-slate-500">Merchant: Amrit Dhara Mineral Springs Corp.</p>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Confirm Transaction Ref No (UTR No)</label>
                            <input 
                              type="text" 
                              maxLength={12}
                              placeholder="Enter 12-digit payment reference number"
                              value={upiUtr}
                              onChange={(e) => setUpiUtr(e.target.value.replace(/\D/g, ''))}
                              className="w-full px-3 py-2 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-xs rounded-xl font-mono"
                            />
                            <p className="text-[9px] text-slate-400 font-medium">Please enter the 12-digit UTR from your UPI payment success screen to verify instant settlement.</p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {paymentMethod === 'Card' && (
                    <div className="space-y-4">
                      
                      {/* Virtual interactive credit card */}
                      <div className="bg-gradient-to-tr from-slate-900 to-slate-800 text-white rounded-2xl p-5 shadow-lg space-y-8 relative overflow-hidden">
                        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
                          <Droplet className="w-40 h-40 fill-white" />
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-bold text-slate-400 tracking-widest">AMRIT PREPAID DIRECT</span>
                          <span className="font-extrabold italic text-sm text-blue-400">AmritPay</span>
                        </div>

                        <div className="space-y-4">
                          <p className="font-mono text-base tracking-widest text-slate-100">
                            {cardNumber ? cardNumber.replace(/(\d{4})/g, '$1 ').trim() : '•••• •••• •••• ••••'}
                          </p>
                          
                          <div className="flex justify-between items-end">
                            <div>
                              <p className="text-[8px] uppercase font-bold text-slate-400">Card Holder</p>
                              <p className="text-xs font-bold uppercase tracking-wider text-slate-200">{cardHolder || 'Your Full Name'}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[8px] uppercase font-bold text-slate-400">Expires</p>
                              <p className="text-xs font-bold text-slate-200">{cardExpiry || 'MM/YY'}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Card Inputs */}
                      <div className="space-y-3">
                        <div>
                          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Cardholder Full Name</label>
                          <input 
                            type="text" 
                            required
                            placeholder="e.g. Ramesh Kumar"
                            value={cardHolder}
                            onChange={(e) => setCardHolder(e.target.value)}
                            className="w-full mt-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Card Number (16 Digits)</label>
                          <input 
                            type="text" 
                            required
                            maxLength={16}
                            placeholder="4111 2222 3333 4444"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ''))}
                            className="w-full mt-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Expiry Date (MM/YY)</label>
                            <input 
                              type="text" 
                              required
                              maxLength={5}
                              placeholder="12/28"
                              value={cardExpiry}
                              onChange={(e) => setCardExpiry(e.target.value)}
                              className="w-full mt-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Secure CVV Code</label>
                            <input 
                              type="password" 
                              required
                              maxLength={3}
                              placeholder="•••"
                              value={cardCvv}
                              onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                              className="w-full mt-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                          </div>
                        </div>
                      </div>

                    </div>
                  )}

                  {paymentMethod === 'Pay Later' && (
                    <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex gap-3">
                      <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl self-start">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-800">Corporate Credit Line Active</p>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          This order will be successfully processed and recorded directly as outstanding credit on your customer file. Dues can be cleared monthly.
                        </p>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'Cash on Delivery' && (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex gap-3">
                      <div className="p-2.5 bg-slate-200 text-slate-700 rounded-xl self-start">
                        <Truck className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-800">No Instant Charge</p>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          No instant online transaction required. Please hand over cash or scan the delivery executive's smartphone terminal upon bottle arrival.
                        </p>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* Loader while simulating */}
              {simulatingPaymentStep === 'processing' && (
                <div className="flex flex-col items-center justify-center py-10 space-y-4 text-center">
                  <RefreshCw className="w-12 h-12 text-blue-600 animate-spin" />
                  <div className="space-y-1.5">
                    <p className="text-sm font-extrabold text-slate-800">Processing Encrypted Deposit...</p>
                    <p className="text-xs text-slate-400">Verifying 3D-Secure transaction with bank node...</p>
                  </div>
                </div>
              )}

              {/* Decline / Fail state error block */}
              {simulatingPaymentStep === 'failed' && paymentError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl p-4 flex gap-3 animate-pulse">
                  <AlertTriangle className="w-5 h-5 text-rose-600 self-start mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-extrabold">Transaction Authorization Failed</p>
                    <p className="text-[11px] text-rose-700 leading-normal">{paymentError}</p>
                    <button 
                      onClick={() => setSimulatingPaymentStep('idle')} 
                      className="mt-2 text-[10px] font-black uppercase text-rose-600 hover:underline"
                    >
                      Try Again / Change payment flag
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* Bottom Actions */}
            {simulatingPaymentStep !== 'processing' && (
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                <button 
                  type="button"
                  onClick={() => {
                    setCheckoutPaymentModalOpen(false);
                    setSimulatingPaymentStep('idle');
                  }}
                  className="w-1/3 py-3 rounded-xl border border-slate-200 text-slate-500 text-xs font-extrabold hover:bg-slate-100 transition-all text-center"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    if (paymentMethod === 'UPI') {
                      if (!upiUtr) {
                        showToast('Please enter the 12-digit UPI UTR / Transaction Reference No to confirm your payment.', 'error');
                        return;
                      }
                      if (upiUtr.length !== 12) {
                        showToast('Invalid UTR Reference! UPI Transaction Reference numbers must be exactly 12 digits.', 'error');
                        return;
                      }
                    }
                    // Route to correct payment result based on selection
                    const status = (paymentMethod === 'Pay Later') ? 'Outstanding' : 'Paid';
                    handleCompleteSecureCheckout(status);
                  }}
                  className="w-2/3 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-lg shadow-blue-100 flex items-center justify-center gap-1.5 transition-all"
                >
                  Authorize Payment of ₹{getCartTotal().total}
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* FLOATING REAL-TIME MERCHANT ALERT POPUP (FOR ADMIN/SHOP OWNER) */}
      {activeRole === 'retailer' && liveAlert && (
        <div id="merchant-live-alert" className={`fixed bottom-6 left-6 z-50 max-w-sm w-full text-white rounded-2xl shadow-2xl p-5 overflow-hidden animate-bounce-subtle space-y-4 border ${
          liveAlert.type === 'low_stock' ? 'bg-amber-950 border-amber-500/40' : 'bg-slate-900 border-blue-500/30'
        }`}>
          
          {/* Header pulsing */}
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full animate-ping ${liveAlert.type === 'low_stock' ? 'bg-amber-500' : 'bg-rose-500'}`}></span>
              <span className={`text-[10px] font-black uppercase tracking-widest ${liveAlert.type === 'low_stock' ? 'text-amber-400' : 'text-rose-400'}`}>
                {liveAlert.type === 'low_stock' ? '⚠️ Stock Depletion Warning' : 'Live Incoming Order'}
              </span>
            </span>
            <button 
              onClick={handleMarkNotificationsRead}
              className="p-1 hover:bg-white/10 text-white/60 hover:text-white rounded-lg transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-white/60">
              {liveAlert.type === 'low_stock' ? 'Automated Inventory Monitor' : `Order ID: #${liveAlert.orderId || 'NEW'}`}
            </p>
            <p className="text-sm font-extrabold text-white">
              {liveAlert.type === 'low_stock' ? 'Low Stock Threshold Breached' : `Customer: ${liveAlert.customerName}`}
            </p>
            <p className="text-xs text-white/85 leading-relaxed">{liveAlert.message}</p>
          </div>

          {liveAlert.type !== 'low_stock' && (
            <div className="flex justify-between items-center bg-slate-800/60 px-3 py-2 rounded-xl text-xs">
              <span className="text-slate-400">Order Total:</span>
              <span className="font-extrabold text-emerald-400 text-sm">₹{liveAlert.total}</span>
            </div>
          )}

          <div className="flex gap-2">
            <button 
              onClick={handleMarkNotificationsRead}
              className={`w-full text-white text-xs font-extrabold py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                liveAlert.type === 'low_stock' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <CheckCircle className="w-4 h-4" /> {liveAlert.type === 'low_stock' ? 'Acknowledge Warning' : 'Acknowledge & Prepare'}
            </button>
          </div>
        </div>
      )}

      {/* Visual Footer */}
      <footer className="mt-auto bg-slate-900 text-slate-400 py-10 px-4 lg:px-8 border-t border-slate-800 text-center text-xs space-y-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-extrabold text-white text-sm">Amrit Dhara Corporation</span>
          <div className="flex gap-4">
            <span className="hover:text-white cursor-pointer">Security Protocol</span>
            <span className="hover:text-white cursor-pointer">Consumer Guarantee</span>
            <span className="hover:text-white cursor-pointer">Licensed BIS Outlets</span>
          </div>
        </div>
        <p>© 2026 Amrit Dhara. Certified drinking water platform. Pure water. Delivered Smarter.</p>
      </footer>

    </div>
  );

  // Helper inside standard select box
  function setTransitionPaymentMethod(val: string) {
    setPaymentMethod(val);
  }
}
