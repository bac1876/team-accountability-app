# Development Setup Instructions

## Prerequisites
- Node.js 18+ 
- npm or yarn package manager

## Installation Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```
   App will be available at `http://localhost:5173`

3. **Login Credentials for Testing**
   - Regular User: `bob@searchnwa.com` / `pass123`
   - Admin User: `admin@company.com` / `admin123`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Key Development Notes

### Current Working State
✅ Authentication system working
✅ Dashboard displays properly (no blank page)
✅ All 5 tabs functional
✅ Data persistence via localStorage
✅ Admin panel working

### Recent Critical Fixes
- Fixed missing React imports in Dashboard component
- Fixed email field authentication logic
- Removed localStorage session persistence

### File Structure Priority
1. `src/components/Dashboard.jsx` - Main user interface
2. `src/utils/dataStore.js` - Data management
3. `src/components/LoginPage.jsx` - Authentication
4. `src/App.jsx` - App routing and state

### Testing Workflow
1. Start dev server
2. Login with test credentials
3. Verify all dashboard tabs work
4. Test admin features with admin account
5. Check data persistence across sessions

Ready for development in Claude Code!
