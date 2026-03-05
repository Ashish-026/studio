# Mandi Monitor - Operation Manual

A professional-grade management system for rice mill operations, built with Next.js 15 and Firebase Cloud Firestore.

## 0. Login Credentials
**Admin Access:**
- Email: `admin@example.com` / Password: `admin`

**User Access:**
- Email: `user@example.com` / Password: `user`

## 1. User Workflow

### A. The Setup Phase
1. **Context**: Upon login, select the operational Mill and the Marketing Season (KMS). 
2. **Targets**: Admins should record the Government Allotted Targets in the Mandi Register.

### B. Daily Operations
1. **Paddy Lifting**: Record arrivals in the Mandi Register. Use the **Bag Weight Calculator** to ensure precision.
   - *Automation*: Selecting "Hired Vehicle" or adding "Labour Charges" during lifting will automatically create entries in the Vehicle and Labour registers respectively.
2. **Milling (Processing)**: In the Stock Register, record the processing of paddy.
   - *Logic*: Processing 100 Qtl of Paddy will decrease Paddy stock and increase Rice, Bran, and Broken Rice stock based on the yields you enter.
3. **Payments**: Record payments to Labourers and Vehicle Owners directly in their respective registers to maintain an accurate "Balance."

## 2. Calculation Logic

### Weight Calculations
- **Gross Weight**: Total weight of paddy including bags.
- **Net Weight**: Weight after deducting bag tare and moisture.
- **Mapping**: Paddy Received = Gross; Mandi Weight = Net.

### Accounting
- **Balance**: `Total Earned (Wages/Rent) - Total Paid`.
- **Positive Balance**: Money the Mill owes (Payable).
- **Negative Balance**: Money paid in advance (Advance).

## 3. Cloud Synchronization
This app uses **Firebase Firestore**. 
- **Real-Time**: Changes made on one device appear on all other logged-in devices instantly.
- **Security**: Data is persistent and stored safely in Google’s cloud infrastructure.

## 4. Reporting
Use the **"Download PDF"** buttons found in the Labour and Vehicle accounts to generate high-resolution statements for external stakeholders.

---
*Built for operational efficiency and numeric stability.*