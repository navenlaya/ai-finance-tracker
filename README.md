# AI Finance Tracker

A modern, AI-powered personal finance tracking application built with Next.js, featuring intelligent spending analysis, budget recommendations, and comprehensive transaction management.

## 🚀 Features

### Core Functionality
- **Bank Account Integration**: Secure connection to bank accounts via Plaid
- **Transaction Management**: Automatic transaction syncing and categorization
- **AI-Powered Insights**: Personalized financial recommendations using Groq AI
- **Interactive Dashboard**: Comprehensive financial overview with charts and metrics
- **Real-time Analytics**: Spending trends, category breakdowns, and budget tracking

### Security & Performance
- **Rate Limiting**: API protection against abuse
- **Input Validation**: Comprehensive Zod schemas for all user inputs
- **Error Handling**: Robust error boundaries and user-friendly error messages
- **Performance Monitoring**: Built-in performance tracking and optimization
- **Accessibility**: WCAG AA compliant with screen reader support

### User Experience
- **Responsive Design**: Mobile-first design that works on all devices
- **Loading States**: Skeleton loaders and progress indicators
- **Empty States**: Engaging empty states for better user onboarding
- **Toast Notifications**: Real-time feedback for user actions
- **Tooltips**: Helpful tooltips explaining financial concepts

## 🛠️ Tech Stack

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Recharts**: Data visualization library
- **Lucide React**: Icon library

### Backend
- **Next.js API Routes**: Serverless API endpoints
- **Prisma**: Database ORM
- **PostgreSQL**: Primary database (via Supabase)
- **Clerk**: Authentication and user management

### AI & External Services
- **Groq**: AI-powered financial insights
- **Plaid**: Bank account connectivity
- **Supabase**: Database hosting and management

### Development Tools
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Zod**: Runtime type validation
- **Performance Monitoring**: Built-in performance tracking

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- PostgreSQL database (or Supabase account)
- Plaid account for bank connectivity
- Groq API key for AI features

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-finance-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file with the following variables:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/ai_finance_tracker"
   
   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
   CLERK_SECRET_KEY="sk_test_..."
   
   # Plaid
   PLAID_CLIENT_ID="your_plaid_client_id"
   PLAID_SECRET="your_plaid_secret"
   PLAID_ENV="sandbox"
   
   # AI Services
   GROQ_API_KEY="your_groq_api_key"
   
   # Encryption
   ENCRYPTION_KEY="your_32_character_encryption_key"
   
   # Optional
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   NODE_ENV="development"
   ```

4. **Database Setup**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Dashboard pages
│   └── api/               # API routes
├── components/            # React components
│   ├── dashboard/         # Dashboard-specific components
│   ├── insights/          # AI insights components
│   ├── transactions/      # Transaction components
│   └── ui/               # Reusable UI components
├── lib/                  # Utility libraries
│   ├── ai/               # AI service integration
│   ├── plaid/            # Plaid integration
│   ├── utils/            # Utility functions
│   └── validation/       # Input validation schemas
└── types/                # TypeScript type definitions
```

## 🔧 Configuration

### Rate Limiting
API routes are protected with configurable rate limits:
- `/api/insights/generate`: 5 requests/hour
- `/api/plaid/sync`: 10 requests/hour
- `/api/plaid/*`: 20 requests/hour

### Security Headers
The application includes comprehensive security headers:
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- Strict-Transport-Security: max-age=31536000

### Performance Optimization
- Dynamic imports for heavy components
- Skeleton loading states
- Memoized calculations
- Optimized database queries

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms
The application can be deployed to any platform supporting Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 📊 Monitoring & Analytics

### Performance Monitoring
Built-in performance monitoring tracks:
- API response times
- Database query performance
- AI operation timing
- Component render times

### Error Tracking
Comprehensive error handling with:
- User-friendly error messages
- Detailed error logging
- Automatic error recovery
- Error boundary protection

## 🔒 Security Features

### Data Protection
- Encrypted sensitive data storage
- Secure API key management
- Input validation and sanitization
- SQL injection prevention (via Prisma)

### Authentication
- Clerk-based authentication
- JWT token management
- Session security
- User permission validation

## 🧪 Testing

### Manual Testing Checklist
- [ ] User authentication flow
- [ ] Bank account connection
- [ ] Transaction syncing
- [ ] AI insight generation
- [ ] Dashboard functionality
- [ ] Mobile responsiveness
- [ ] Error handling
- [ ] Rate limiting

### Performance Testing
- [ ] Page load times
- [ ] API response times
- [ ] Database query performance
- [ ] AI operation timing
- [ ] Memory usage

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Code Standards
- Use TypeScript for type safety
- Follow ESLint configuration
- Write meaningful commit messages
- Add JSDoc comments for complex functions

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

### Common Issues

**Database Connection Errors**
- Verify DATABASE_URL is correct
- Check database server is running
- Ensure proper permissions

**Plaid Integration Issues**
- Verify Plaid credentials
- Check PLAID_ENV setting
- Ensure webhook URLs are configured

**AI Service Errors**
- Verify GROQ_API_KEY is valid
- Check API quota limits
- Monitor rate limiting

### Getting Help
- Check the documentation
- Review error logs
- Open an issue on GitHub
- Contact support team

## 🔮 Roadmap

### Upcoming Features
- [ ] Budget planning tools
- [ ] Investment tracking
- [ ] Bill reminders
- [ ] Financial goal setting
- [ ] Multi-currency support
- [ ] Advanced reporting
- [ ] Mobile app (React Native)
- [ ] API for third-party integrations

### Performance Improvements
- [ ] Server-side rendering optimization
- [ ] Database query optimization
- [ ] Caching strategies
- [ ] CDN integration
- [ ] Image optimization

---

Built with ❤️ using Next.js, TypeScript, and modern web technologies.