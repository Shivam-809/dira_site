# 🔮 Dira Tarot - Project Structure

This document outlines the complete project structure and organization for the Dira Tarot e-commerce platform.

## 📁 Project Organization

```
dira-tarot/
├── src/                          # Source code directory
│   ├── app/                      # Next.js App Router pages & API routes
│   │   ├── admin/               # Admin panel pages
│   │   │   ├── login/           # Admin login page
│   │   │   ├── orders/          # Order management page
│   │   │   ├── users/           # User management page
│   │   │   └── page.tsx         # Admin dashboard
│   │   │
│   │   ├── api/                 # API Routes (Backend)
│   │   │   ├── admin/           # Admin-specific APIs
│   │   │   ├── auth/            # Authentication endpoints (Better Auth)
│   │   │   ├── cart/            # Shopping cart operations
│   │   │   ├── chat/            # Chat functionality
│   │   │   ├── contact/         # Contact form endpoint
│   │   │   ├── orders/          # Order management APIs
│   │   │   ├── products/        # Product CRUD operations
│   │   │   ├── sessions/        # Session booking APIs
│   │   │   └── users/           # User management APIs
│   │   │
│   │   ├── cart/                # Shopping cart page
│   │   ├── checkout/            # Checkout flow page
│   │   ├── contact/             # Contact us page
│   │   ├── login/               # User login page
│   │   ├── logout/              # Logout handler
│   │   ├── orders/              # User order history
│   │   ├── products/            # Product pages
│   │   │   └── [id]/            # Dynamic product detail page
│   │   ├── profile/             # User profile page
│   │   ├── shop/                # Shop/catalog page
│   │   ├── signup/              # User registration page
│   │   ├── layout.tsx           # Root layout with providers
│   │   └── page.tsx             # Homepage
│   │
│   ├── components/              # Reusable React components
│   │   ├── ui/                  # Shadcn UI components
│   │   ├── Footer.tsx           # Site footer
│   │   ├── Navbar.tsx           # Site navigation
│   │   └── SessionBooking.tsx   # Tarot session booking widget
│   │
│   ├── db/                      # Database layer
│   │   ├── seeds/               # Database seed files
│   │   ├── index.ts             # Database client configuration
│   │   └── schema.ts            # Drizzle ORM schema definitions
│   │
│   ├── hooks/                   # Custom React hooks
│   ├── lib/                     # Utility libraries
│   │   ├── auth.ts              # Better Auth server configuration
│   │   ├── auth-client.ts       # Better Auth client hooks
│   │   └── utils.ts             # Helper functions
│   │
│   └── visual-edits/            # Visual editing configuration
│
├── drizzle/                     # Drizzle ORM migration files
├── public/                      # Static assets
│
├── .env                         # Environment variables (DO NOT COMMIT)
├── drizzle.config.ts            # Drizzle ORM configuration
├── middleware.ts                # Next.js middleware (route protection)
├── next.config.ts               # Next.js configuration
├── package.json                 # Project dependencies
├── tsconfig.json                # TypeScript configuration
├── ADMIN_GUIDE.md               # Admin panel documentation
├── PROJECT_STRUCTURE.md         # This file
└── README.md                    # Project overview
```

---

## 🗄️ Database Schema

### Authentication Tables (Better Auth)
- **user** - User accounts with roles (user/admin)
- **session** - Active user sessions
- **account** - OAuth & password credentials
- **verification** - Email verification tokens

### E-commerce Tables
- **products** - Product catalog (tarot decks, crystals, etc.)
- **cart** - Shopping cart items per user
- **orders** - Order history and tracking
- **sessionBookings** - Tarot reading session bookings

---

## 🔐 Authentication & Authorization

### Public Routes (No login required)
- `/` - Homepage
- `/shop` - Product catalog
- `/products/[id]` - Product details
- `/contact` - Contact form
- `/login` - User login
- `/signup` - User registration
- `/admin/login` - Admin login

### Protected Routes (Login required)
- `/cart` - Shopping cart
- `/checkout` - Checkout process
- `/orders` - Order history
- `/profile` - User profile

### Admin Routes (Admin role required)
- `/admin` - Admin dashboard
- `/admin/orders` - Order management
- `/admin/users` - User management

**Middleware:** `middleware.ts` handles route protection automatically.

---

## 🛒 E-commerce Flow

### User Journey
1. **Browse** → Visit `/shop` or homepage featured products
2. **View Details** → Click product → `/products/[id]`
3. **Add to Cart** → Login prompt if not authenticated → Item added to `/cart`
4. **Checkout** → Fill shipping/payment form → `/checkout`
5. **Order Complete** → View order history → `/orders`

### Admin Journey
1. **Login** → `/admin/login` with admin credentials
2. **Dashboard** → View stats, recent orders, users
3. **Manage Products** → Create, edit, delete products
4. **Process Orders** → Update order statuses
5. **User Management** → View and manage users

---

## 📧 Contact Form

- **Frontend:** `src/app/contact/page.tsx`
- **API:** `src/app/api/contact/route.ts`
- **Recipient:** `malhotrashivam809@gmail.com`

Messages are currently logged to console. To enable email sending:
1. Choose email service (Resend, SendGrid, SMTP)
2. Add API keys to `.env`
3. Implement email logic in `/api/contact/route.ts`

---

## 🔑 Environment Variables

See `.env` file for complete configuration. Key sections:

### Database
- `TURSO_CONNECTION_URL` - Turso database URL
- `TURSO_AUTH_TOKEN` - Turso authentication token

### Authentication
- `BETTER_AUTH_SECRET` - Better Auth secret key
- `BETTER_AUTH_URL` - Base URL for auth callbacks

### Email (Optional)
- `CONTACT_EMAIL` - Contact form recipient
- Email service API keys (Resend, SendGrid, SMTP)

### Payment Gateway (Optional)
- Razorpay API keys for payment processing

### Admin Access
- **Email:** diratarot@admin.com
- **Password:** @Fghj5678

---

## 🎨 Design System

- **Fonts:**
  - Headings: Cinzel (serif)
  - Body: Inter (sans-serif)
  - Mystical text: Great Vibes (cursive)
  - Brand: Cinzel Decorative

- **Color Scheme:** Purple/mystical theme with dark mode support
- **UI Components:** Shadcn UI with Tailwind CSS v4
- **Icons:** Lucide React

---

## 🚀 Getting Started

### Installation
```bash
bun install
```

### Development
```bash
bun run dev
```
Access at: http://localhost:3000

### Database Operations
```bash
# Generate migration
bun drizzle-kit generate

# Apply migration
bun drizzle-kit migrate

# Open database studio
bun drizzle-kit studio
```

---

## 📊 Key Features

✅ **User Authentication** - Better Auth with email/password  
✅ **Product Catalog** - Full CRUD operations  
✅ **Shopping Cart** - Add, update, remove items  
✅ **Checkout Flow** - Shipping & payment forms  
✅ **Order Management** - Track order status  
✅ **Admin Panel** - Complete dashboard  
✅ **Session Booking** - Tarot reading appointments  
✅ **Contact Form** - Customer inquiries  
✅ **Responsive Design** - Mobile-friendly UI  
✅ **Dark Mode** - Theme switching support  

---

## 🛠️ Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Database:** Turso (SQLite)
- **ORM:** Drizzle ORM
- **Authentication:** Better Auth
- **UI:** Shadcn UI + Tailwind CSS v4
- **Forms:** React Hook Form + Zod
- **Icons:** Lucide React
- **Package Manager:** Bun

---

## 📝 Notes

- All API routes are protected with proper authentication checks
- Product images use placeholder URLs (Unsplash)
- Payment processing is simulated (integrate Stripe for production)
- Email sending requires service integration
- Admin password can be changed via `/api/admin/set-password`

---

## 🔗 Important Files

- **Authentication Config:** `src/lib/auth.ts`
- **Database Schema:** `src/db/schema.ts`
- **Route Protection:** `middleware.ts`
- **Environment Setup:** `.env`
- **Admin Guide:** `ADMIN_GUIDE.md`

---

**Last Updated:** 2025-01-01  
**Version:** 1.0.0