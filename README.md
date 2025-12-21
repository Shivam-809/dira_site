# Dira Tarot - E-commerce Platform

A full-stack tarot products e-commerce platform built with Next.js 15, featuring authentication, product management, shopping cart, and payment processing.

## 🌟 Features

### User Features
- **Authentication System**: Sign up, login, and logout with JWT-based authentication (Better-Auth)
- **Product Browsing**: Browse all products with search and category filters
- **Product Details**: View detailed product information with stock availability
- **Shopping Cart**: Add/remove items, update quantities
- **Checkout**: Complete checkout flow with payment simulation
- **Order History**: View all past orders with status tracking

### Admin Features
- **Product Management**: Full CRUD operations (Create, Read, Update, Delete)
- **Inventory Management**: Track stock levels and featured products
- **Category Management**: Organize products by categories (Decks, Crystals, Books, Accessories)

### Additional Features
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Dark Mode Ready**: Purple-themed mystical design
- **Toast Notifications**: User feedback with Sonner
- **Loading States**: Skeleton loaders and spinners
- **Form Validation**: Zod schema validation with React Hook Form

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: Shadcn/UI
- **Forms**: React Hook Form + Zod
- **State Management**: React Hooks
- **Icons**: Lucide React

### Backend
- **API**: Next.js API Routes
- **Database**: Turso (LibSQL)
- **ORM**: Drizzle ORM
- **Authentication**: Better-Auth (JWT)
- **Password Hashing**: Bcrypt

### Payment Processing
- **Gateway**: Razorpay (Card + UPI payments)

## 📁 Project Structure

```
├── src/
│   ├── app/                      # Next.js App Router pages
│   │   ├── page.tsx             # Homepage
│   │   ├── shop/                # Shop page
│   │   ├── products/[id]/       # Product detail page
│   │   ├── contact/             # Contact page
│   │   ├── login/               # Login page
│   │   ├── signup/              # Signup page
│   │   ├── cart/                # Shopping cart
│   │   ├── checkout/            # Checkout page
│   │   ├── orders/              # Order history
│   │   ├── admin/               # Admin dashboard
│   │   ├── logout/              # Logout page
│   │   └── api/                 # API routes
│   │       ├── auth/[...all]/   # Auth endpoints
│   │       ├── users/           # User CRUD
│   │       ├── products/        # Product CRUD
│   │       ├── cart/            # Cart CRUD
│   │       └── orders/          # Order CRUD
│   ├── components/              # React components
│   │   ├── ui/                  # Shadcn UI components
│   │   ├── Navbar.tsx           # Navigation bar
│   │   └── Footer.tsx           # Footer
│   ├── db/                      # Database
│   │   ├── index.ts             # DB connection
│   │   ├── schema.ts            # Database schema
│   │   └── seeds/               # Seed data
│   ├── lib/                     # Utilities
│   │   ├── auth.ts              # Server auth config
│   │   ├── auth-client.ts       # Client auth config
│   │   └── utils.ts             # Helper functions
│   └── middleware.ts            # Route protection
├── .env                         # Environment variables
├── package.json                 # Dependencies
└── README.md                    # Documentation
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or Bun
- npm, yarn, pnpm, or bun

### Installation

1. **Clone the repository** (or use the existing project)

2. **Install dependencies**
```bash
npm install
# or
bun install
```

3. **Environment Variables**

The `.env` file is already configured with:
```env
TURSO_CONNECTION_URL=libsql://db-830bc00c-f7d0-4386-ade8-0f3636f11ab9-orchids.aws-us-west-2.turso.io
TURSO_AUTH_TOKEN=eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9...
BETTER_AUTH_SECRET=PIShRZHwZLWdDGWYHo0iOc8xE4OaOLc6mpBtWOhGBNk=
```

4. **Start the development server**
```bash
npm run dev
# or
bun dev
```

5. **Open your browser**
Navigate to `http://localhost:3000`

## 👤 Default Credentials

### Admin Account
- **Email**: `admin@tarot.com`
- **Password**: `admin123`
- **Access**: Full admin dashboard access

### Test User Account
- **Email**: `user@tarot.com`
- **Password**: `user123`
- **Access**: Regular user access

## 🗄️ Database Schema

### Users Table
- `id` - Text (Primary Key)
- `email` - Text (Unique)
- `name` - Text
- `emailVerified` - Boolean
- `image` - Text
- `createdAt` - Timestamp
- `updatedAt` - Timestamp

### Products Table
- `id` - Integer (Primary Key, Auto-increment)
- `name` - Text (Required)
- `description` - Text
- `price` - Real (Required)
- `category` - Text (decks, crystals, books, accessories)
- `imageUrl` - Text
- `stock` - Integer (Default: 0)
- `featured` - Boolean (Default: false)
- `createdAt` - Timestamp
- `updatedAt` - Timestamp

### Cart Table
- `id` - Integer (Primary Key, Auto-increment)
- `userId` - Text (Foreign Key → users.id)
- `productId` - Integer (Foreign Key → products.id)
- `quantity` - Integer (Default: 1)
- `createdAt` - Timestamp
- `updatedAt` - Timestamp

### Orders Table
- `id` - Integer (Primary Key, Auto-increment)
- `userId` - Text (Foreign Key → users.id)
- `items` - JSON Array
- `totalAmount` - Real
- `status` - Text (pending, paid, shipped, delivered, cancelled)
- `paymentIntentId` - Text
- `shippingAddress` - JSON Object
- `createdAt` - Timestamp
- `updatedAt` - Timestamp

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/sign-up/email` - Register new user
- `POST /api/auth/sign-in/email` - Login user
- `POST /api/auth/sign-out` - Logout user
- `GET /api/auth/get-session` - Get current session

### Users API
- `GET /api/users` - List all users
- `GET /api/users?id={id}` - Get user by ID
- `POST /api/users` - Create user
- `PUT /api/users?id={id}` - Update user
- `DELETE /api/users?id={id}` - Delete user

### Products API
- `GET /api/products` - List products (supports: `?limit`, `?offset`, `?search`, `?category`, `?featured`)
- `GET /api/products?id={id}` - Get product by ID
- `POST /api/products` - Create product
- `PUT /api/products?id={id}` - Update product
- `DELETE /api/products?id={id}` - Delete product

### Cart API
- `GET /api/cart` - List cart items (supports: `?userId`)
- `GET /api/cart?id={id}` - Get cart item by ID
- `POST /api/cart` - Add item to cart
- `PUT /api/cart?id={id}` - Update cart item quantity
- `DELETE /api/cart?id={id}` - Remove item from cart

### Orders API
- `GET /api/orders` - List orders (supports: `?userId`, `?status`)
- `GET /api/orders?id={id}` - Get order by ID
- `POST /api/orders` - Create order
- `PUT /api/orders?id={id}` - Update order
- `DELETE /api/orders?id={id}` - Delete order

## 📱 Pages Overview

### Public Pages
- `/` - Homepage with featured products
- `/shop` - All products with filters
- `/products/[id]` - Product detail page
- `/contact` - Contact form
- `/login` - Login page
- `/signup` - Registration page

### Protected Pages (Require Login)
- `/cart` - Shopping cart
- `/checkout` - Checkout and payment
- `/orders` - Order history
- `/admin` - Admin dashboard (product management)

## 🎨 Design Features

- **Custom Purple Theme**: Mystical purple color palette
- **Cinzel Font**: Elegant serif font for headings
- **Inter Font**: Clean sans-serif for body text
- **Gradient Backgrounds**: Subtle purple gradients
- **Animated Elements**: Pulse and spin animations
- **Responsive Grid**: Mobile-first responsive design

## 🔒 Security Features

- JWT-based authentication with Better-Auth
- Password hashing with bcrypt
- Protected routes with middleware
- Session management with bearer tokens
- Input validation with Zod schemas
- SQL injection protection with Drizzle ORM

## 🛒 Shopping Flow

1. **Browse Products** → Shop page or homepage featured products
2. **View Details** → Click on any product
3. **Add to Cart** → Select quantity and add (requires login)
4. **View Cart** → Review items and update quantities
5. **Checkout** → Enter shipping and payment info
6. **Order Confirmation** → View order in order history

## 👨‍💼 Admin Flow

1. **Login** → Use admin credentials
2. **Access Admin** → Click user menu → Admin Dashboard
3. **Manage Products** → Add, edit, or delete products
4. **Set Featured** → Mark products as featured for homepage
5. **Manage Stock** → Update inventory levels

## 📦 Seeded Products

The database includes 12 pre-seeded products:
- **Tarot Decks**: Rider-Waite ($29.99), Celtic Cross ($34.99), Modern Witch ($27.99)
- **Crystals**: Crystal Balls, Healing Sets, Amethyst ($19.99-$89.99)
- **Books**: Beginner's Guide, Advanced Techniques ($15.99-$24.99)
- **Accessories**: Incense, Reading Cloths, Candle Sets ($9.99-$18.99)

## 🌐 Deployment

This project is ready to deploy on:
- **Vercel** (Recommended for Next.js)
- **Netlify**
- **Railway**
- Any platform supporting Next.js 15

### Environment Variables for Production
Make sure to set all environment variables in your deployment platform.

## 🚀 Running the Project

Everything is already set up! Just run:
```bash
npm run dev
# or
bun dev
```

Then visit `http://localhost:3000` and start exploring!

---

**Built with ❤️ for mystical shopping experiences**