# Mandi Monitor - Development Summary

A comprehensive management system for rice mill operations, tracking official mandi records, private stock, labour, and logistics.

## Step-by-Step Development Guide

### 1. Foundation & Auth
- **Next.js 15 App Router**: Built with React 18, Tailwind CSS, and Shadcn UI.
- **Role-Based Access**: Implemented `admin` and `user` roles with a dedicated `AuthProvider`.
- **Operational Context**: Established a flow requiring Mill and KMS Year selection before dashboard access.

### 2. Multi-Register Architecture
- **Interconnected Contexts**: Created four React Contexts (`Mandi`, `Stock`, `Labour`, `Vehicle`) using `localStorage` for persistent data.
- **Date Revival**: Implemented custom JSON parsing to maintain `Date` object integrity in storage.

### 3. Advanced Calculation Logic
- **Bag Weight Calculator**: Developed a dual-mode tool for Uniform and Non-Uniform bag entries.
- **Auto-Population**: Configured forms to automatically calculate Gross vs. Net weights and populate relevant register fields.
- **Numeric Handling**: Hardened calculations to prevent `toFixed` crashes by strictly casting string inputs to numbers.

### 4. Automated Workflows
- **Cross-Talk Integration**: Single data entries (like Lifting) automatically generate related records in the Labour (wages) and Vehicle (trips) registers.
- **Stock Transformation**: Implemented processing logic to handle yields (Rice, Bran, Broken Rice) and transfers between private and mandi stocks.

### 5. Data Integrity & Reporting
- **KMS Decoupling**: Optimized data visibility by separating entry dates from the viewing season (KMS year).
- **PDF Statements**: Integrated `jspdf` for generating professional account summaries.

### 6. Production Hardening
- **Defensive Checks**: Added safety logic to all array operations (`.reduce`, `.map`) to ensure compatibility with strict production builds.
- **Deployment Ready**: Resolved all TypeScript and build-time errors for successful publishing.

## Credentials (Demo)
- **Admin**: `admin@example.com` / `admin`
- **User**: `user@example.com` / `user`
