# Raise - Crowdfunding Platform

A modern, full-featured crowdfunding platform built with React, TypeScript, Vite, and Supabase.

## Features

- **Campaign Management**: Create, edit, and manage crowdfunding campaigns
- **Public Donations**: Anyone can donate to campaigns without creating an account
- **User Authentication**: Secure signup and login with Supabase Auth
- **Analytics Dashboard**: Real-time campaign statistics and donation tracking
- **Interactive Charts**: Visualize donation trends with Chart.js
- **Responsive Design**: Beautiful UI built with Tailwind CSS

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **Styling**: Tailwind CSS
- **Charts**: Chart.js with react-chartjs-2
- **Routing**: React Router v6
- **Icons**: Lucide React

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
   ```

4. The database schema is already set up via Supabase migrations

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
4. Deploy

The `vercel.json` configuration is already included.

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
- Donate to campaigns (no account required)

### Authenticated Features
- Create new campaigns
- Edit own campaigns
- End campaigns
- View detailed analytics dashboard
- Track donation trends

### Analytics
- Total raised amount
- Number of donors
- Average donation
- Donation rate (per day)
- Interactive donation timeline chart
- Progress tracking

## License

MIT