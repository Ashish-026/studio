# Mandi Monitor - Technical Blueprint

A professional-grade management system for rice mill operations, built with Next.js 15, Tailwind CSS, and Shadcn UI.

## 0. Default Login Credentials
**Admin Access:**
- Email: `admin@example.com`
- Password: `admin`

**User Access:**
- Email: `user@example.com`
- Password: `user`

## 1. Application Logic & Formulas

### A. Weight Calculations (The Bag Calculator)
The core of the system is the **Bag Weight Calculator**, which prevents manual entry errors.
- **Gross Weight**: `(Bags × Weight per Bag) / 100`
- **Net Weight**: `(Gross Weight × 100 - Total Deductions) / 100`
- **Quintal Conversion**: All internal weights are stored in Quintals (100kg = 1 Qtl).

### B. Register Accounting
- **Labour Balance**: `Sum(Daily Wages + Item Wages) - Sum(Paid Amount)`
  - *Payable*: Balance > 0
  - *Advance*: Balance < 0
- **Vehicle Balance**: `Sum(Trip Charges OR Monthly Rent) - Sum(Paid Amount)`
- **Equivalent Paddy**: `Money Received / Market Rate` (Used for Monetary Lifting).

### C. Processing & Yields
- **Yield Percentage**: `(Rice Produced / Paddy Used) × 100`
- **Inventory Tracking**: Processing `100 Qtl` of Paddy will subtract `100` from Paddy stock and add calculated yields to Rice, Bran, and Broken Rice stocks.

## 2. Automation Workflow
We implemented "Trigger Logic" to eliminate double-entry:
1. **Lifting Entry**: User enters data in the Mandi Register.
2. **Vehicle Trigger**: If the vehicle is "Hired," the system automatically adds a trip to the **Vehicle Register** and calculates the debt to the owner.
3. **Labour Trigger**: If a "Labour Charge" is recorded, the system automatically creates a work entry in the **Labour Register**, splitting the total charge among the selected workers.

## 3. Technical Features
- **localStorage Persistence**: All data is saved locally in the browser with "Date Revival" logic to maintain time-stamps.
- **Role-Based Access**: Admins handle targets and monetary lifting; Users handle operational data.
- **PDF Reporting**: High-resolution account statements for Labourers and Vehicle Owners can be downloaded as PDFs.
- **Decoupled KMS Year**: The marketing season selection acts as a filter for viewing, while data entry remains independent to ensure no records are hidden.

---
*Built for numeric stability and operational efficiency.*
