
# Mandi Monitor - Standalone Independence Guide

This application is now **100% server-independent** and ready for hosting on your own GitHub or Vercel account.

## 🚀 How to Host (Free & Permanent)

### Option 1: Vercel (Recommended for Beginners)
1. Create a free account at [vercel.com](https://vercel.com).
2. Connect your GitHub repository.
3. Click **"Deploy"**. Vercel will automatically build and host the app.
4. You will get a permanent link (e.g., `your-mill.vercel.app`). Open this link on your phone and **"Add to Home Screen"**.

### Option 2: GitHub Pages
1. Push this code to a GitHub repository.
2. Go to **Settings** -> **Pages**.
3. Under Build and deployment, set source to **GitHub Actions**.
4. Use the "Next.js" starter template provided by GitHub.

## 📱 Multi-Device Sync
This app uses **Local-First** storage. Data does not automatically sync via the cloud (saving you database costs). 
To sync multiple devices:
1. On Device A: Go to **Settings** -> **Download Sync File**.
2. Send this file to Device B (WhatsApp/Email).
3. On Device B: Go to **Settings** -> **Import & Merge Records**.
4. The databases will be combined automatically.

## 🔒 Security
- The app stores credentials locally on the device.
- You can change the default `admin@mill.com` / `password123` in the **Settings** menu.
- **Offline Access**: Once opened, the app will work even if your internet is disconnected.

## 🛠 Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS + ShadCN UI
- **Database**: Browser IndexedDB (Unlimited local capacity)
- **Offline**: PWA Service Worker
