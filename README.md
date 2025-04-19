# Cert Centre - Learning Management System (LMS)

<div align="center">
  <img src="public/cert-centre-logo.png" alt="Cert Centre Logo" width="200"/>
  <h3>Comprehensive Learning Management Solution</h3>
</div>

## 📚 Overview

Cert Centre is a modern Learning Management System (LMS) built with Next.js 13+ leveraging the App Router architecture. This platform enables educators to create, manage and sell courses while providing students with an intuitive interface to discover, purchase, and participate in educational content.

## ✨ Key Features

### For Students
- **Course Discovery** - Browse, search, and filter courses with advanced filtering options
- **Secure Payments** - Purchase courses via integrated Stripe payment processing
- **Interactive Learning** - Track progress, mark chapters as completed, and view completion stats
- **Multimedia Content** - Access video lessons with adaptive playback using Mux's HLS streaming
- **User Dashboard** - Monitor enrolled courses and progress from a centralized student portal
- **Course Certificates** - Earn and download certificates upon completing courses

### For Educators
- **Course Management** - Create, edit, and publish courses with an intuitive control panel
- **Chapter Organization** - Create and reorder chapters via drag-and-drop interface
- **Rich Content Editor** - Enhance chapter descriptions with a full-featured rich text editor
- **File Management** - Upload thumbnails, attachments, and videos with UploadThing integration
- **Enhanced Analytics** - Comprehensive dashboard with revenue trends, course performance, and student engagement metrics

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 13 (App Router)
- **UI Components**: Radix UI, Shadcn UI components
- **Styling**: Tailwind CSS, tailwindcss-animate
- **State Management**: Zustand
- **Forms**: React Hook Form with Zod validation
- **Media**: Mux for video streaming, React Quill for rich text editing

### Backend
- **API Routes**: Next.js API routes with server components
- **Authentication**: Clerk
- **Database**: MySQL via PlanetScale
- **ORM**: Prisma
- **Payment Processing**: Stripe
- **File Storage**: UploadThing

## 🔧 Prerequisites

- Node.js v18.x.x or higher
- npm or pnpm package manager
- MySQL database or PlanetScale account
- Accounts for third-party services:
  - Clerk (authentication)
  - UploadThing (file uploads)
  - Mux (video processing)
  - Stripe (payments)

## 🚀 Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/cert-centre.git
   cd cert-centre
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or with pnpm
   pnpm install
   ```

3. **Set up environment variables**

   Create a `.env` file in the root directory with the following variables:

   ```env
   # Authentication - Clerk
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
   CLERK_SECRET_KEY=
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=
   
   # Database - PlanetScale/MySQL
   DATABASE_URL=
   
   # File Upload - UploadThing
   UPLOADTHING_SECRET=
   UPLOADTHING_APP_ID=
   
   # Video Processing - Mux
   MUX_TOKEN_ID=
   MUX_TOKEN_SECRET=
   
   # Payments - Stripe
   STRIPE_API_KEY=
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   STRIPE_WEBHOOK_SECRET=
   
   # Application
   NEXT_PUBLIC_TEACHER_ID=
   ```

4. **Set up the database**

   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Push schema to your database
   npx prisma db push
   ```

5. **Optional: Generate demo data**

   ```bash
   # For general seed data
   npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
   
   # For demo teacher data (recommended for testing analytics)
   npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/generate-demo-teacher.ts
   ```

   Note: Configure your demo teacher ID in `scripts/generate-demo-teacher.ts` before running.

6. **Start the development server**

   ```bash
   npm run dev
   # or with pnpm
   pnpm dev
   ```

7. **Access the application**

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🗂️ Project Structure

```
cert-centre/
├── actions/            # Server actions for data mutations
├── app/                # Next.js App Router structure
│   ├── (auth)/         # Authentication routes
│   ├── (course)/       # Course view/consumption routes
│   ├── (dashboard)/    # User dashboard routes
│   ├── api/            # API endpoints
├── components/         # Reusable UI components
├── hooks/              # Custom React hooks
├── lib/                # Utility functions and configurations
├── prisma/             # Database schema and migrations
│   └── schema.prisma   # Prisma schema definition
├── public/             # Static assets
└── scripts/            # Utility scripts
```

## 📡 API Documentation

The API follows RESTful principles with the following main endpoints:

- `/api/courses` - Course management endpoints
- `/api/chapters` - Chapter and content management
- `/api/uploadthing` - File upload endpoints
- `/api/webhook` - Stripe webhook endpoint

For detailed API documentation, refer to the [API Documentation](docs/improvements/api-documentation.md) guide.

## 🛣️ Roadmap

- [x] Enhanced analytics dashboard for educators
- [ ] Student discussion forums for each course
- [ ] Quiz and assessment functionality
- [x] Certificate generation upon course completion
- [ ] Mobile application support

## 🤝 Contributing

We welcome contributions to the Cert Centre project! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgements

- [Next.js](https://nextjs.org/) - The React Framework
- [Clerk](https://clerk.dev/) - Authentication and user management
- [Prisma](https://prisma.io/) - ORM
- [PlanetScale](https://planetscale.com/) - Database platform
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Stripe](https://stripe.com/) - Payment processing
- [Mux](https://mux.com/) - Video hosting and streaming
- [UploadThing](https://uploadthing.com/) - File uploads

## 📬 Contact

For questions, support, or feedback, please contact:

- Email: support@certcentre.com
- Twitter: [@CertCentre](https://twitter.com/certcentre)
- Website: [www.certcentre.com](https://www.certcentre.com)
