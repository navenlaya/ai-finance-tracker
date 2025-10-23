# AI Finance Tracker

A full-stack financial insights application built with Next.js 14, TypeScript, and AI-powered analysis.

## Features

- 🔐 **Secure Authentication** - Clerk-powered user authentication
- 🏦 **Bank Integration** - Connect bank accounts via Plaid (sandbox)
- 🤖 **AI Insights** - OpenAI-powered spending analysis and recommendations
- 📊 **Real-time Analytics** - Track spending patterns and financial health
- 💰 **Budget Management** - Smart budgeting recommendations
- 📱 **Mobile Responsive** - Clean, modern UI with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Clerk
- **Banking**: Plaid API
- **AI**: OpenAI API

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database (or Supabase account)
- Clerk account for authentication
- Plaid account for bank integration
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-finance-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Fill in your environment variables:
   - `DATABASE_URL` - PostgreSQL connection string
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk publishable key
   - `CLERK_SECRET_KEY` - Clerk secret key
   - `PLAID_CLIENT_ID` - Plaid client ID
   - `PLAID_SECRET` - Plaid secret
   - `OPENAI_API_KEY` - OpenAI API key
   - `ENCRYPTION_KEY` - 32-character encryption key for sensitive data

4. **Set up the database**
   ```bash
   npm run db:push
   npm run db:generate
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
src/
├── app/                    # Next.js 14 App Router
│   ├── api/               # API routes
│   │   └── plaid/         # Plaid integration endpoints
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Dashboard pages
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── plaid/            # Plaid-specific components
│   └── dashboard/        # Dashboard components
├── lib/                  # Utility libraries
│   ├── api/              # API client functions
│   ├── db/               # Prisma database client
│   └── utils/            # Utility functions
├── types/                # TypeScript type definitions
└── hooks/                # Custom React hooks
```

## Database Schema

The application uses the following main models:

- **User** - User account information
- **Account** - Connected bank accounts
- **Transaction** - Financial transactions
- **Insight** - AI-generated insights

## Security Features

- 🔒 **Encrypted Storage** - Sensitive data (Plaid tokens) are encrypted
- 🛡️ **Authentication Middleware** - Protected routes with Clerk
- 🔐 **Type-safe APIs** - Full TypeScript coverage
- 🚫 **Input Validation** - Proper error handling and validation

## API Endpoints

### Plaid Integration
- `POST /api/plaid/create-link-token` - Create Plaid link token
- `POST /api/plaid/exchange-token` - Exchange public token for access token
- `GET /api/plaid/transactions` - Fetch transactions

### Future Endpoints
- `GET /api/insights` - Get AI-generated insights
- `POST /api/insights/generate` - Generate new insights

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, please open an issue in the GitHub repository.
