# Mandi Monitor - Technical Documentation & Development Log

A professional-grade management system for rice mill operations, designed to handle the complex intersection of official state records, private commerce, labour management, and logistics.

## 1. Application Architecture

### The Context API & State Persistence
The app is built on a "Multi-Register" architecture. Each register has its own dedicated React Context (e.g., `MandiProvider`, `LabourProvider`).
- **Storage**: We use `localStorage` to ensure data survives page refreshes.
- **Date Revival**: Because JSON doesn't support the `Date` object, we implemented a "reviver" logic during data loading to convert timestamp strings back into functional JavaScript Date objects.

## 2. Server-Independent Operation
The Mandi Monitor is designed to be **Zero-Cost** and **Self-Sufficient**. 
- **Offline Mode**: Once the page is loaded, it no longer requires a server connection to add or view records.
- **Data Portability**: Users can go to **Settings** to download a `Backup File (.json)`. This file can be shared via email or GitHub, allowing you to move your entire database to any new device or share it with partners without needing a cloud server.

## 3. Register Deep-Dive: Logic & Data Entry

### A. Mandi Register (Official Records)
Tracks the mill's relationship with the State Civil Supplies Corporation.
- **Target Allotment**: Admins set targets (in Quintals). Data entry includes Mandi Name, Date, and Target Amount.
- **Physical Lifting**: The primary entry point for paddy arrival.
    - **Integration**: Linked to the **Bag Weight Calculator**.
    - **Calculation**: It captures **Total Paddy Received** (Gross) and **Mandi Weight** (Net).
- **Monetary Lifting**: A specialized tool for admins to enter cash received. It automatically calculates the "Equivalent Quintals" based on a user-defined rate.

### B. Labour Register (Wage Management)
Tracks individual workers and group crews.
- **Wage Types**: 
    - *Daily*: Flat rate per shift.
    - *Item-Rate*: Calculated as `Quantity × Rate per Item` (e.g., loading 500 bags).
- **Accounting Logic**: 
    - `Total Wages - Total Paid = Balance`.
    - If Balance > 0: Result is flagged as **Payable**.
    - If Balance < 0: Result is flagged as **Advance**.

### C. Vehicle Register (Logistics)
Manages a fleet of owned and hired vehicles.
- **Data Grouping**: Records are grouped by **Owner Name**, allowing for "Master Statements" for transport agencies.
- **Rent Types**: Supports **Monthly** flat rates and **Per-Trip** charges.
- **Trip Log**: Automatically captures trips generated from Mandi and Private registers.

### D. Stock Register (Inventory)
The "Brain" of the mill that aggregates data from all sources.
- **Yield Logic**: When "Processing" is recorded, the app subtracts Paddy and adds three byproducts: **Rice**, **Bran**, and **Broken Rice**.
- **Yield %**: Automatically calculated as `(Rice Yield / Paddy Used) × 100`.
- **Transfers**: Features a "Private to Mandi" transfer tool to fulfill official supply requirements from private stock.

## 4. Advanced Workflow Automation

We implemented "Trigger Logic" to reduce manual entry. When a user records a **Physical Paddy Lift**:
1. **The Form Check**: It looks at the `Vehicle Type`.
2. **Vehicle Trigger**: If set to `Hired`, it immediately calls the `addTrip` function in the `VehicleContext`, logging the journey and increasing the owner's balance.
3. **Labour Trigger**: If `Labour Charge` is entered, it calls `addGroupWorkEntry` in the `LabourContext`, splitting the wage among the selected loading crew.

## 5. Security & Roles
- **Admin**: Has write access to Targets, Monetary Lifting, and sensitive stock transfers.
- **User**: Restricted to operational data entry (Lifting, Labour, Vehicle Trips).
- **Single-Page Routing**: All views are managed internally on the Root URL (`/`) to prevent 404 errors in production environments.

## 6. Reporting (PDF Statements)
Using `jspdf` and `html2canvas`, we developed a "Print-to-PDF" system.
- It creates a hidden, high-resolution clone of the statement tables.
- It captures these clones as images and embeds them into a multi-page PDF document.
- **Scope**: Available for Labour accounts, Vehicle Owner statements, and Mandi summaries.

---
*Developed with a focus on numeric stability, preventing `NaN` or `undefined` errors by strictly casting all form inputs to numbers before calculation.*
