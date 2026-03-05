
# Mandi Monitor - Operation Manual

A professional-grade management system for rice mill operations, built with Next.js 15 and Firebase Cloud Firestore.

## 📱 Mobile Use
You can install this app on your phone without an app store:
1. **Open the URL** of your published app in Chrome (Android) or Safari (iOS).
2. **Add to Home Screen**:
   - iOS: Share icon -> "Add to Home Screen".
   - Android: Menu (3 dots) -> "Install App".

## 🔑 Login Credentials
**Admin Access:**
- Email: `admin@example.com` / Password: `admin`

**User Access:**
- Email: `user@example.com` / Password: `user`

## 🚀 User Workflow

### 1. Setup
- Select the **Mill** and **KMS Year** after logging in.
- Admins set the Government **Targets** in the Mandi Register.

### 2. Daily Operations
- **Paddy Lifting**: Use the **Bag Weight Calculator** [🧮] for accuracy.
  - Paddy Received = Gross Weight.
  - Mandi Weight = Net Weight.
- **Automation**: Hired vehicles and Labour charges are automatically pushed to their respective registers.
- **Milling**: Record processing in the Stock Register to update your Rice and Bran inventory.

### 3. Payments & Reports
- Record payments to Labourers/Vehicles to maintain a clear "Balance."
- Use the **"PDF"** button to download official statements for workers or transport owners.

## ☁️ Cloud Logic
This app is powered by **Firebase Firestore**. 
- Data is stored in the cloud, not on your device.
- It works across multiple phones/computers simultaneously.
- Real-time updates: Change data on one phone, and it updates on all others instantly.

---
*Built for operational efficiency and zero-cost scaling.*
