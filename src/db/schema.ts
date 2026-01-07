import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';

// Better-auth required tables with TEXT IDs (standard better-auth format)
export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).default(false),
  name: text('name').notNull(),
  image: text('image'),
  password: text('password'),
  role: text('role').notNull().default('user'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const session = sqliteTable('session', {
  id: text('id').primaryKey(),
  expiresAt: text('expires_at').notNull(),
  token: text('token').notNull().unique(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => user.id),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const account = sqliteTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => user.id),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: text('access_token_expires_at'),
  refreshTokenExpiresAt: text('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const verification = sqliteTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Admin authentication tables
export const admin = sqliteTable('admin', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).default(false),
  name: text('name').notNull(),
  image: text('image'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const adminAccount = sqliteTable('admin_account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull().default('credential'),
  adminId: text('admin_id').notNull().references(() => admin.id),
  password: text('password'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const adminSession = sqliteTable('admin_session', {
  id: text('id').primaryKey(),
  token: text('token').notNull().unique(),
  adminId: text('admin_id').notNull().references(() => admin.id),
  expiresAt: text('expires_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Renamed and fixed tables
export const products = sqliteTable('products', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  price: real('price').notNull(),
  category: text('category'),
  imageUrl: text('image_url'),
  stock: integer('stock').default(0),
  featured: integer('featured', { mode: 'boolean' }).default(false),
  originalPrice: real('original_price'),
  benefits: text('benefits'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const services = sqliteTable('services', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  heading: text('heading').notNull(),
  subheading: text('subheading'),
  description: text('description'),
  price: real('price').notNull().default(0),
  category: text('category'), // Book Consultation, Book Healing, Advance Services
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const courses = sqliteTable('courses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  heading: text('heading').notNull(),
  subheading: text('subheading'),
  description: text('description'),
  price: real('price').notNull().default(0),
  pdfUrl: text('pdf_url'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const cart = sqliteTable('cart', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => user.id),
  productId: integer('product_id').notNull().references(() => products.id),
  quantity: integer('quantity').default(1),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const orders = sqliteTable('orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => user.id),
  items: text('items', { mode: 'json' }),
  totalAmount: real('total_amount'),
  status: text('status').notNull().default('pending'),
  paymentIntentId: text('payment_intent_id'),
  shippingAddress: text('shipping_address', { mode: 'json' }),
  shippingOrderId: text('shipping_order_id'),
  shippingShipmentId: text('shipping_shipment_id'),
  awbCode: text('awb_code'),
  trackingUrl: text('tracking_url'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const serviceBookings = sqliteTable('service_bookings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').references(() => user.id),
  serviceId: integer('service_id').notNull().references(() => services.id),
  sessionType: text('session_type'), // Descriptive name of the service/session
  clientName: text('client_name').notNull(),
  clientEmail: text('client_email').notNull(),
  clientPhone: text('client_phone').notNull(),
  date: text('date').notNull(),
  timeSlot: text('time_slot').notNull(),
  notes: text('notes'),
  status: text('status').notNull().default('pending'),
  paymentId: text('payment_id'),
  razorpayOrderId: text('razorpay_order_id'),
  amount: real('amount'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const sessionBookings = serviceBookings; // Alias for backward compatibility

export const courseEnrollments = sqliteTable('course_enrollments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').references(() => user.id),
  courseId: integer('course_id').notNull().references(() => courses.id),
  clientName: text('client_name').notNull(),
  clientEmail: text('client_email').notNull(),
  clientPhone: text('client_phone').notNull(),
  deliveryType: text('delivery_type').notNull(), // 'one-to-one' | 'recorded'
  status: text('status').notNull().default('pending'),
  paymentId: text('payment_id'),
  razorpayOrderId: text('razorpay_order_id'),
  amount: real('amount'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const serviceSlots = sqliteTable('service_slots', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  serviceId: integer('service_id').references(() => services.id), // If null, general slot
  date: text('date').notNull(), // YYYY-MM-DD
  time: text('time').notNull(), // e.g., "9:00 AM"
  isAvailable: integer('is_available', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const contactMessages = sqliteTable('contact_messages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userName: text('user_name').notNull(),
  userEmail: text('user_email').notNull(),
  message: text('message').notNull(),
  status: text('status').notNull().default('unread'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const orderTracking = sqliteTable('order_tracking', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderId: integer('order_id').notNull().references(() => orders.id),
  status: text('status').notNull(),
  description: text('description').notNull(),
  location: text('location'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});
