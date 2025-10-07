# Repository Overview

## Monorepo Structure
- Web: React + Vite admin dashboard located at `Web/`
- Server: Node.js Express email/notification API in `Server/`
- App: React Native (Expo) mobile app in `App/`
- Database: Firebase config and shared initialization in `Database/`

## Web (Admin Dashboard)
- Entry: `Web/src/main.jsx`
- App: `Web/src/App.jsx`
- Navigation: `Web/navigation/WebNav.jsx`
- Admin container: `Web/src/web/AdminHome.jsx` (sidebar, AI assistant, routing of sections)
- Dashboard: `Web/src/web/Sidebar/Dashboard/Dashboard.jsx`
- Sidebar sections: `Web/src/web/Sidebar/{Loans,Deposits,Payments,Withdraws,Registrations}/`
- Services: `Web/src/services/*` and Server API client `Server/api.jsx`
- Build: Vite config `Web/vite.config.js`

Key notes:
- Dashboard has tabs: Loans Breakdown, Funds & Savings, Dividends
- Active Loans Portfolio table should render only when Loans Breakdown is active
- Dividends section shows distribution table and (added) two pie charts: overall split and members-share breakdown
- Enhanced admin AI consumes visible, display-only runtime snapshot from AdminHome

## Server (Email/Notification API)
- Entry: `Server/server.js`
- Features: CORS, static, JSON, Nodemailer (Gmail SMTP)
- Endpoints: `/send-admin-email`, `/send-delete-admin-email`, `/register` (and others)
- Requires env: `GMAIL_USER`, `GMAIL_PASS`, optional `PORT`

## App (Mobile)
- Entry: `App/App.js`
- Services: `App/src/services/enhancedFirebaseAI.js` (Gemini/OpenRouter with display-only member context)
- Features: Loans, Deposits, Payments, Withdrawals, Profile, AI Bot

## Database
- Firebase config: `Database/firebaseConfig.jsx`
- Data paths used by dashboard and AI preload include:
  - `Settings/Funds`, `Settings/Savings`, `Settings/*Percentages`
  - `Loans/{LoanApplications, ApprovedLoans, CurrentLoans}`
  - `Deposits/DepositApplications`
  - `Payments/PaymentApplications`
  - `Withdraws/WithdrawApplications`
  - `Transactions/{Registrations, Deposits, Loans, Payments, Withdrawals}`

## AI Integration Summary
- Web Admin: `generateEnhancedAdminAIResponse` via `enhancedAdminAI` with display-only `visibleContext` containing counts and totals
- App: `generateEnhancedAIResponse(prompt, userData)` using only data visible to the member

## Environment Variables
- Web/.env: Vite/React envs as needed
- Server/.env: Gmail creds
- App/.env: EXPO_PUBLIC_SERVER_URL, EXPO_PUBLIC_GEMINI_API_KEY

## Run/Build
- Web: `cd Web && npm i && npm run dev` (Vite)
- Server: `cd Server && npm i && node server.js`
- App: `cd App && npm i && npx expo start`

## Testing/Verification Checklist
- Dashboard: Loans table toggles with Loans Breakdown tab
- Dividends: Both pie charts render and percentages match Settings
- Admin AI: Ask about funds/savings/app counts; should answer without changing pages
- Server: `/send-admin-email` sends emails when env configured
- App AI: Answers member-specific queries using display-only context