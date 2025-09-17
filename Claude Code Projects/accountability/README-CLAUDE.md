# Team Accountability App - Claude Code Development Package

## Overview
A React-based team accountability application for tracking daily commitments, weekly goals, phone calls, and reflections. Built with Vite, React, and Tailwind CSS.

## Current Status ✅
- **Authentication**: Working (email-based login)
- **Dashboard**: Fixed (no more blank page after login)
- **Data Persistence**: Uses localStorage via dataStore utility
- **UI Components**: Modern design with shadcn/ui components

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```

### 3. Build for Production
```bash
npm run build
```

## Project Structure

```
src/
├── components/
│   ├── AdminDashboard.jsx      # Admin panel for user management
│   ├── Dashboard.jsx           # Main user dashboard (FIXED)
│   ├── LoginPage.jsx           # Authentication component
│   ├── Navigation.jsx          # Top navigation bar
│   ├── PhoneCallTracking.jsx   # Phone call logging
│   ├── DailyFocus.jsx         # Daily focus tracking
│   └── ui/                    # Reusable UI components
├── utils/
│   └── dataStore.js           # Data persistence layer
├── App.jsx                    # Main app component
└── main.jsx                   # Entry point
```

## Key Features

### 1. Authentication System
- Email-based login (no localStorage persistence by design)
- User roles: admin vs regular users
- Test credentials: `bob@searchnwa.com` / `pass123`

### 2. Dashboard Tabs
- **Today's Commitment**: Set and track daily goals
- **Weekly Goals**: Manage weekly objectives
- **Daily Reflection**: End-of-day reflection prompts
- **Phone Calls**: Track business calls and outcomes
- **Daily Focus**: Focus time tracking

### 3. Admin Features
- User management (add/edit/delete users)
- View all user data
- System administration

## Technical Details

### Data Storage
- Uses `localStorage` via `dataStore.js` utility
- No backend database (client-side only)
- Data structure includes users, commitments, goals, reflections

### UI Framework
- **Vite** + **React 18**
- **Tailwind CSS** for styling
- **shadcn/ui** components
- **Lucide React** icons
- **date-fns** for date handling

### Key Components Fixed
- ✅ **Dashboard.jsx**: Added missing React imports (`useState`, `useEffect`)
- ✅ **LoginPage.jsx**: Fixed email field authentication
- ✅ **App.jsx**: Removed localStorage session persistence

## Development Notes

### Recent Fixes Applied
1. **Blank Page Issue**: Fixed missing React imports in Dashboard component
2. **Authentication**: Fixed email field matching in login logic
3. **Data Persistence**: Removed localStorage session persistence per requirements

### Known Working Features
- Login/logout functionality
- Dashboard with all 5 tabs working
- User data persistence
- Admin panel functionality
- Responsive design

### Test Users Available
Check `src/utils/dataStore.js` for the complete list of 23 test users including:
- `bob@searchnwa.com` / `pass123` (regular user)
- `admin@company.com` / `admin123` (admin user)

## Deployment
- Currently deployed on Vercel
- GitHub integration for automatic deployments
- Production URL: https://team-accountability-app.vercel.app/

## Important Files to Review

### 1. `src/components/Dashboard.jsx`
The main user interface - recently fixed with proper React imports.

### 2. `src/utils/dataStore.js`
Data persistence layer managing all user data, commitments, goals, etc.

### 3. `src/components/LoginPage.jsx`
Authentication component with email-based login.

### 4. `src/App.jsx`
Main app routing and authentication state management.

## Development Tips for Claude Code

1. **Start with**: Review the current working state in `Dashboard.jsx`
2. **Data Flow**: Understand how `dataStore.js` manages persistence
3. **UI Components**: Leverage existing shadcn/ui components in `src/components/ui/`
4. **Testing**: Use the provided test credentials for development
5. **Styling**: Tailwind classes are already configured and working

## Next Steps / Potential Improvements

1. **Backend Integration**: Replace localStorage with proper database
2. **Real Authentication**: Implement proper user authentication
3. **Data Export**: Add ability to export user data
4. **Mobile Optimization**: Enhance mobile responsiveness
5. **Notifications**: Add reminder/notification system

---

**Package Created**: Ready for Claude Code development
**Last Updated**: Current working version with all critical fixes applied
**Status**: Production-ready codebase
