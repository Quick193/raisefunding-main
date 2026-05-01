# Raise - Crowdfunding Platform

A modern crowdfunding platform built with React, TypeScript, Vite, and Supabase.

## Features

- **Campaign Management**: Create, edit, and manage crowdfunding campaigns
- **Public Campaigns**: Anyone can browse campaigns and view campaign details
- **User Authentication**: Secure signup and login with Supabase Auth
- **Analytics Dashboard**: Real-time campaign statistics and donation tracking
- **Interactive Charts**: Visualize donation trends with Chart.js
- **Featured Placement**: Optional featured campaign placement through Razorpay checkout
- **Campaign Reporting**: Public reporting flow for suspicious or unsafe campaigns
- **Responsive Design**: Beautiful UI built with Tailwind CSS

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **Styling**: Tailwind CSS
- **Charts**: Chart.js with react-chartjs-2
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Payments**: Razorpay integration in progress

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
   ```

4. Apply the Supabase schema from the files in `supabase/migrations/` or use `supabase/setup.sql` for a fresh local setup.

5. Start the development server:
   ```bash
   npm run dev
   ```

## Deployment

### Vercel (Frontend)

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_RAZORPAY_KEY_ID` once payment checkout is enabled
4. Deploy

The `vercel.json` configuration is already included.

### Supabase Secrets

Set these for Supabase Edge Functions:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`

The Razorpay donation flow still needs server-side order creation and verification before production launch. Direct public donation inserts are disabled in the UI until that flow is completed.

## Project Structure

```
src/
├── components/       # Reusable UI components
├── context/         # React context providers
├── lib/            # External library configurations
├── pages/          # Page components
├── types/          # TypeScript type definitions
└── utils/          # Utility functions
```

## Database Schema

The platform uses the following main tables:

- **profiles**: User profiles linked to Supabase Auth
- **campaigns**: Campaign information and metadata
- **donations**: Donation records with donor information

Row Level Security (RLS) is enabled on all tables for secure data access.

## Features in Detail

### Public Features
- Browse all campaigns
- View campaign details
- View campaign progress and featured campaigns
- Report suspicious campaigns

### Authenticated Features
- Create new campaigns
- Edit own campaigns
- End campaigns
- View detailed analytics dashboard
- Track donation trends

## Production Readiness Checklist

- Run `npm run lint`, `npm run typecheck`, and `npm run build` before deploys.
- Apply database migrations and storage bucket policies in Supabase.
- Configure Vercel environment variables and Supabase Edge Function secrets.
- Complete verified Razorpay donation processing before accepting real donations.
- Review submitted campaign reports in Supabase until an admin review UI is added.
- Replace placeholder social sharing image metadata with a hosted Raise brand image when available.

### Analytics
- Total raised amount
- Number of donors
- Average donation
- Donation rate (per day)
- Interactive donation timeline chart
- Progress tracking

## License

MIT
