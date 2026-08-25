const now = new Date();
const iso = (daysAgo = 0, monthsAgo = 0) => new Date(now.getFullYear(), now.getMonth() - monthsAgo, now.getDate() - daysAgo).toISOString();

const data = {
  products: {
    PRD1001: { name: 'Amul Butter 500g', sku: 'PRD1001', emoji: '🧈', brand: 'Amul', category: 'Dairy', price: 280, mrp: 310, stock: 48, reorderLevel: 10, status: 'Active', description: 'Fresh & creamy salted butter', featured: true, createdAt: iso(0, 6) },
    PRD1002: { name: 'Parle-G Biscuits 1kg', sku: 'PRD1002', emoji: '🍪', brand: 'Parle', category: 'Snacks', price: 120, mrp: 150, stock: 60, reorderLevel: 15, status: 'Active', description: 'Glucose biscuits family pack', featured: true, createdAt: iso(1, 6) },
    PRD1003: { name: 'Red Bull Energy 250ml', sku: 'PRD1003', emoji: '⚡', brand: 'Red Bull', category: 'Beverages', price: 125, mrp: 125, stock: 72, reorderLevel: 20, status: 'Active', description: 'Energy drink can', featured: true, createdAt: iso(2, 6) },
    PRD1004: { name: 'Lay\'s Magic Masala 52g', sku: 'PRD1004', emoji: '🥔', brand: 'Lay\'s', category: 'Snacks', price: 20, mrp: 20, stock: 90, reorderLevel: 30, status: 'Active', description: 'Crispy potato chips', featured: true, createdAt: iso(3, 6) },
    PRD1005: { name: 'Maggi 2-Minute Noodles 280g', sku: 'PRD1005', emoji: '🍜', brand: 'Nestlé', category: 'Instant Food', price: 60, mrp: 70, stock: 85, reorderLevel: 20, status: 'Active', description: 'Instant noodles masala pack', featured: false, createdAt: iso(4, 6) },
    PRD1006: { name: 'Coca-Cola 750ml', sku: 'PRD1006', emoji: '🥤', brand: 'Coca-Cola', category: 'Beverages', price: 40, mrp: 45, stock: 100, reorderLevel: 25, status: 'Active', description: 'Soft drink bottle', featured: false, createdAt: iso(5, 5) },
    PRD1007: { name: 'Britannia Good Day 400g', sku: 'PRD1007', emoji: '🍪', brand: 'Britannia', category: 'Bakery', price: 80, mrp: 95, stock: 55, reorderLevel: 15, status: 'Active', description: 'Cashew cookies', featured: false, createdAt: iso(6, 5) },
    PRD1008: { name: 'Tata Salt 1kg', sku: 'PRD1008', emoji: '🧂', brand: 'Tata', category: 'Grocery', price: 28, mrp: 30, stock: 110, reorderLevel: 30, status: 'Active', description: 'Iodised cooking salt', featured: false, createdAt: iso(7, 5) },
    PRD1009: { name: 'Dettol Soap Pack of 3', sku: 'PRD1009', emoji: '🧼', brand: 'Dettol', category: 'Personal Care', price: 95, mrp: 120, stock: 40, reorderLevel: 12, status: 'Active', description: 'Original antibacterial soap', featured: false, createdAt: iso(8, 5) },
    PRD1010: { name: 'Nescafé Classic 100g', sku: 'PRD1010', emoji: '☕', brand: 'Nestlé', category: 'Beverages', price: 275, mrp: 310, stock: 35, reorderLevel: 10, status: 'Active', description: 'Instant coffee jar', featured: false, createdAt: iso(9, 5) }
  },
  categories: {
    CAT001: { name: 'Dairy', description: 'Milk, butter and dairy products', totalProducts: 1, status: 'Active', createdAt: iso(0, 6) },
    CAT002: { name: 'Snacks', description: 'Chips, biscuits and munchies', totalProducts: 2, status: 'Active', createdAt: iso(1, 6) },
    CAT003: { name: 'Beverages', description: 'Soft drinks, energy drinks and coffee', totalProducts: 3, status: 'Active', createdAt: iso(2, 6) },
    CAT004: { name: 'Instant Food', description: 'Noodles, soups and quick meals', totalProducts: 1, status: 'Active', createdAt: iso(3, 6) },
    CAT005: { name: 'Bakery', description: 'Bread, cookies and bakery items', totalProducts: 1, status: 'Active', createdAt: iso(4, 6) },
    CAT006: { name: 'Grocery', description: 'Daily kitchen staples', totalProducts: 1, status: 'Active', createdAt: iso(5, 5) },
    CAT007: { name: 'Personal Care', description: 'Soaps and hygiene products', totalProducts: 1, status: 'Active', createdAt: iso(6, 5) }
  },
  customers: {
    CUS1001: { name: 'Rahul Sharma', email: 'rahul@email.com', phone: '9876543210', membership: 'Premium', orders: 25, totalPurchase: 125800, status: 'Active', createdAt: iso(0, 3) },
    CUS1002: { name: 'Priya Singh', email: 'priya@email.com', phone: '9812345678', membership: 'Gold', orders: 18, totalPurchase: 86500, status: 'Active', createdAt: iso(1, 3) },
    CUS1003: { name: 'Aman Verma', email: 'aman@email.com', phone: '9898989898', membership: 'Silver', orders: 9, totalPurchase: 32450, status: 'Inactive', createdAt: iso(2, 3) },
    CUS1004: { name: 'Neha Gupta', email: 'neha@email.com', phone: '9871234567', membership: 'Premium', orders: 31, totalPurchase: 210500, status: 'Active', createdAt: iso(3, 3) },
    CUS1005: { name: 'Rohit Kumar', email: 'rohit@email.com', phone: '9988776655', membership: 'Gold', orders: 16, totalPurchase: 78900, status: 'Active', createdAt: iso(4, 2) },
    CUS1006: { name: 'Simran Kaur', email: 'simran@email.com', phone: '9765432101', membership: 'Silver', orders: 7, totalPurchase: 22350, status: 'Inactive', createdAt: iso(5, 2) },
    CUS1007: { name: 'Arjun Patel', email: 'arjun@email.com', phone: '9012345678', membership: 'Gold', orders: 20, totalPurchase: 115600, status: 'Active', createdAt: iso(6, 2) },
    CUS1008: { name: 'Karan Mehta', email: 'karan@email.com', phone: '9090909090', membership: 'Regular', orders: 3, totalPurchase: 8250, status: 'Blocked', createdAt: iso(7, 2) }
  },
  suppliers: {
    SUP001: { name: 'Rahul Sharma', company: 'TechWorld Pvt Ltd', email: 'rahul@techworld.com', phone: '9876543210', city: 'Delhi', orders: 54, status: 'Active', createdAt: iso(0, 4) },
    SUP002: { name: 'Priya Singh', company: 'Global Electronics', email: 'priya@global.com', phone: '9812345678', city: 'Mumbai', orders: 38, status: 'Active', createdAt: iso(1, 4) },
    SUP003: { name: 'Amit Verma', company: 'Prime Supplies', email: 'amit@prime.com', phone: '9898989898', city: 'Lucknow', orders: 25, status: 'Inactive', createdAt: iso(2, 4) },
    SUP004: { name: 'Neha Gupta', company: 'NextGen Traders', email: 'neha@nextgen.com', phone: '9765432101', city: 'Bengaluru', orders: 62, status: 'Active', createdAt: iso(3, 4) },
    SUP005: { name: 'Karan Mehta', company: 'Universal Distributors', email: 'karan@universal.com', phone: '9123456789', city: 'Pune', orders: 19, status: 'Active', createdAt: iso(4, 3) },
    SUP006: { name: 'Simran Kaur', company: 'Metro Traders', email: 'simran@metro.com', phone: '9988776655', city: 'Chandigarh', orders: 41, status: 'Active', createdAt: iso(5, 3) },
    SUP007: { name: 'Rohit Kumar', company: 'Smart Wholesale', email: 'rohit@smart.com', phone: '9090909090', city: 'Jaipur', orders: 14, status: 'Blocked', createdAt: iso(6, 3) },
    SUP008: { name: 'Arjun Patel', company: 'Bright Solutions', email: 'arjun@bright.com', phone: '9000011111', city: 'Ahmedabad', orders: 47, status: 'Active', createdAt: iso(7, 3) }
  },
  sales: {
    INV1001: { invoice: 'INV1001', customer: 'Rahul Sharma', date: iso(0, 1), items: 5, total: 12850, payment: 'Paid', createdAt: iso(0, 1) },
    INV1002: { invoice: 'INV1002', customer: 'Priya Singh', date: iso(0, 1), items: 3, total: 8450, payment: 'Pending', createdAt: iso(0, 1) },
    INV1003: { invoice: 'INV1003', customer: 'Aman Verma', date: iso(1, 1), items: 8, total: 24600, payment: 'Paid', createdAt: iso(1, 1) },
    INV1004: { invoice: 'INV1004', customer: 'Neha Gupta', date: iso(1, 1), items: 2, total: 5980, payment: 'Failed', createdAt: iso(1, 1) },
    INV1005: { invoice: 'INV1005', customer: 'Arjun Patel', date: iso(2, 1), items: 11, total: 38750, payment: 'Paid', createdAt: iso(2, 1) }
  },
  purchases: {
    PO1001: { invoice: 'PO1001', supplier: 'TechWorld', date: iso(0, 1), items: 12, total: 85000, payment: 'Paid', status: 'Received', createdAt: iso(0, 1) },
    PO1002: { invoice: 'PO1002', supplier: 'Metro Traders', date: iso(1, 1), items: 8, total: 42500, payment: 'Pending', status: 'Processing', createdAt: iso(1, 1) },
    PO1003: { invoice: 'PO1003', supplier: 'Prime Supplies', date: iso(2, 1), items: 15, total: 112000, payment: 'Paid', status: 'Received', createdAt: iso(2, 1) },
    PO1004: { invoice: 'PO1004', supplier: 'NextGen', date: iso(3, 1), items: 6, total: 26700, payment: 'Overdue', status: 'Pending', createdAt: iso(3, 1) },
    PO1005: { invoice: 'PO1005', supplier: 'Universal', date: iso(4, 1), items: 10, total: 63500, payment: 'Paid', status: 'Received', createdAt: iso(4, 1) }
  },
  stock: {
    P001: { product: 'Wireless Mouse', category: 'Accessories', available: 120, minimum: 20, warehouse: 'W1', status: 'In Stock', createdAt: iso(0, 2) },
    P002: { product: 'Mechanical Keyboard', category: 'Accessories', available: 15, minimum: 20, warehouse: 'W1', status: 'Low Stock', createdAt: iso(1, 2) },
    P003: { product: '27 Inch Monitor', category: 'Electronics', available: 45, minimum: 10, warehouse: 'W2', status: 'In Stock', createdAt: iso(2, 2) },
    P004: { product: 'USB Cable', category: 'Accessories', available: 0, minimum: 25, warehouse: 'W3', status: 'Out Of Stock', createdAt: iso(3, 2) },
    P005: { product: 'Laptop Stand', category: 'Furniture', available: 32, minimum: 8, warehouse: 'W2', status: 'In Stock', createdAt: iso(4, 2) },
    P006: { product: 'External SSD', category: 'Storage', available: 9, minimum: 10, warehouse: 'W1', status: 'Low Stock', createdAt: iso(5, 2) }
  },
  expenses: {
    EXP001: { category: 'Rent', description: 'Office Rent', amount: 45000, date: iso(0, 1), method: 'Bank Transfer', status: 'Paid', createdAt: iso(0, 1) },
    EXP002: { category: 'Salary', description: 'Employee Salary', amount: 125000, date: iso(1, 1), method: 'Bank Transfer', status: 'Paid', createdAt: iso(1, 1) },
    EXP003: { category: 'Electricity', description: 'Electric Bill', amount: 18600, date: iso(2, 1), method: 'UPI', status: 'Pending', createdAt: iso(2, 1) },
    EXP004: { category: 'Transport', description: 'Delivery Charges', amount: 9850, date: iso(3, 1), method: 'Cash', status: 'Paid', createdAt: iso(3, 1) },
    EXP005: { category: 'Marketing', description: 'Social Media Ads', amount: 32500, date: iso(4, 1), method: 'Card', status: 'Paid', createdAt: iso(4, 1) },
    EXP006: { category: 'Maintenance', description: 'System Maintenance', amount: 14200, date: iso(5, 1), method: 'UPI', status: 'Pending', createdAt: iso(5, 1) },
    EXP007: { category: 'Internet', description: 'Broadband Bill', amount: 2100, date: iso(6, 1), method: 'UPI', status: 'Paid', createdAt: iso(6, 1) },
    EXP008: { category: 'Office Supplies', description: 'Stationery Purchase', amount: 6750, date: iso(7, 1), method: 'Cash', status: 'Paid', createdAt: iso(7, 1) }
  },
  users: {
    U001: { name: 'Yash Chauhan', email: 'admin@scanimart.com', role: 'Admin', password: 'admin123', status: 'Active', lastLogin: 'Today 10:25 AM', createdAt: iso(0, 6) },
    U002: { name: 'Priya Singh', email: 'user@scanimart.com', role: 'User', password: 'user123', status: 'Active', lastLogin: 'Today 09:10 AM', createdAt: iso(1, 6) },
    U003: { name: 'Rahul Sharma', email: 'staff@scanimart.com', role: 'Staff', password: 'staff123', status: 'Active', lastLogin: 'Yesterday', createdAt: iso(2, 6) },
    U004: { name: 'Amit Verma', email: 'security@scanimart.com', role: 'Security', password: 'security123', status: 'Active', lastLogin: 'Today 11:00 AM', createdAt: iso(3, 6) },
    U005: { name: 'Neha Gupta', email: 'neha@email.com', role: 'Manager', status: 'Inactive', lastLogin: '30 Jul 2026', createdAt: iso(4, 5) },
    U006: { name: 'Arjun Patel', email: 'arjun@email.com', role: 'Cashier', status: 'Active', lastLogin: '29 Jul 2026', createdAt: iso(5, 5) }
  },
  orders: {
    ORD1001: { customer: 'Rahul Sharma', product: 'Gaming Laptop', category: 'Electronics', total: 55000, status: 'Delivered', createdAt: iso(0, 1) },
    ORD1002: { customer: 'Priya Singh', product: 'Mechanical Keyboard', category: 'Accessories', total: 2800, status: 'Pending', createdAt: iso(0, 3) },
    ORD1003: { customer: 'Aman Verma', product: 'Bluetooth Headphones', category: 'Electronics', total: 1750, status: 'Delivered', createdAt: iso(1, 5) },
    ORD1004: { customer: 'Neha Gupta', product: '24 Inch Monitor', category: 'Electronics', total: 11999, status: 'Cancelled', createdAt: iso(2, 8) },
    ORD1005: { customer: 'Rahul Sharma', product: 'Wireless Mouse', category: 'Accessories', total: 899, status: 'Delivered', createdAt: iso(3, 2) },
    ORD1006: { customer: 'Priya Singh', product: 'Gaming Laptop', category: 'Electronics', total: 60000, status: 'Delivered', createdAt: iso(4, 4) }
  },
  activities: {
    ACT001: { message: 'New order placed by Rahul Sharma', icon: 'fa-circle-check', createdAt: iso(0, 0) },
    ACT002: { message: 'Product Gaming Laptop updated', icon: 'fa-box', createdAt: iso(0, 1) },
    ACT003: { message: 'New customer registered', icon: 'fa-user-plus', createdAt: iso(0, 2) },
    ACT004: { message: 'Wireless Mouse stock is low', icon: 'fa-triangle-exclamation', createdAt: iso(0, 3) }
  }
};

module.exports = { data };
