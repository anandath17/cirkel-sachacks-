# Cirkel

A collaborative project management platform.

## Setup

1. Clone the repository
```bash
git clone https://github.com/yourusername/cirkel.git
cd cirkel
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
- Copy `.env.example` to `.env`
```bash
cp .env.example .env
```
- Fill in your Firebase configuration values in the `.env` file

4. Start the development server
```bash
npm run dev
```

## Environment Variables

The following environment variables are required to run Cirkel:

- `VITE_FIREBASE_API_KEY`: Your Firebase API key
- `VITE_FIREBASE_AUTH_DOMAIN`: Your Firebase auth domain
- `VITE_FIREBASE_PROJECT_ID`: Your Firebase project ID
- `VITE_FIREBASE_STORAGE_BUCKET`: Your Firebase storage bucket
- `VITE_FIREBASE_MESSAGING_SENDER_ID`: Your Firebase messaging sender ID
- `VITE_FIREBASE_APP_ID`: Your Firebase app ID
- `VITE_FIREBASE_MEASUREMENT_ID`: Your Firebase measurement ID

You can obtain these values from your Firebase project settings. 