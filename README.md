# AniDigital Harvest Hub

A comprehensive agricultural platform for farmers in the Philippines, providing marketplace, crop diagnosis, financial tracking, and climate advisory services.

## Features

- **User Authentication**: Secure login and registration with Supabase Auth
- **Marketplace**: Buy and sell agricultural products
- **Crop Doctor**: AI-powered crop disease diagnosis with image upload
- **Financial Tracking**: Track income, expenses, and profits
- **Climate Advisory**: Real-time weather data and farming recommendations via Agromonitoring API
- **Profile Management**: Manage farm details and personal information

## Setup Instructions

### Prerequisites

- Node.js & npm installed
- Supabase account and project
- Agromonitoring API key (for weather features)

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Agromonitoring API Key (optional, for weather features)
# Get your API key from: https://agromonitoring.com/api
VITE_AGROMONITORING_API_KEY=your_agromonitoring_api_key

# Plant.id Crop Health API Key (optional, for Crop Doctor features)
# Get your API key from: https://crop.kindwise.com/api/v1
VITE_PLANT_ID_API_KEY=your_plant_id_api_key
```

### Installation

```sh
# Step 1: Clone the repository
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory
cd anidigital-harvest-hub

# Step 3: Install dependencies
npm install

# Step 4: Create .env file with your API keys (see above)

# Step 5: Start the development server
npm run dev
```

## Project info

## How can I edit this code?

There are several ways of editing your application.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

You can deploy this project using any static hosting service like Vercel, Netlify, or GitHub Pages.

## Seeding Mock Data

The application includes seed data for testing. Kent's account has been pre-seeded with:
- 5 marketplace products
- 7 financial transactions
- 3 notifications

### Creating Test Users (with email confirmation disabled)

To create 4 additional test users with seeded data, run this in your browser console:

```javascript
import { createAndSeedTestUsers } from '@/lib/createTestUsers';
await createAndSeedTestUsers();
```

This will automatically:
1. Create user accounts for 4 test users
2. Create their profiles with Kapatagan, Lanao Del Norte location
3. Seed 2-3 marketplace products for each user
4. Seed 3-5 financial transactions for each user
5. Seed notifications for each user

**Test users that will be created:**
- Maria Santos (maria.santos@example.com / Test123!@#) - Rice and vegetables
- Juan Dela Cruz (juan.delacruz@example.com / Test123!@#) - Fruits
- Rosa Garcia (rosa.garcia@example.com / Test123!@#) - Vegetables
- Carlos Reyes (carlos.reyes@example.com / Test123!@#) - Corn and beans

All users are from **Kapatagan, Lanao Del Norte** and will have marketplace listings.

### Alternative: Manual Seeding

If users already exist, you can seed data individually:

```javascript
import { seedDataForUserByEmail } from '@/lib/seedHelper';
await seedDataForUserByEmail('user@example.com');
```

Or seed data for all mock users at once:
```javascript
import { seedDataForAllMockUsers } from '@/lib/seedHelper';
await seedDataForAllMockUsers();
```
