# Team Accountability Web Application

A comprehensive web application for team accountability that helps team members track daily commitments, weekly goals, and reflections while providing admin oversight capabilities.

## Features

### User Authentication & Roles
- **Multi-user login system** with secure authentication
- **Two user roles**: Regular team members and Admin users
- **Role-based access control** with different dashboard views

### Core Functionality
- **Daily Commitments**: Track and update daily commitment status
- **Weekly Goals**: Set, track, and manage weekly objectives
- **Reflection System**: Daily reflection with structured prompts
- **Progress Tracking**: Visual progress indicators and completion rates
- **Admin Dashboard**: Comprehensive team oversight and analytics

### Technical Features
- **Responsive Design**: Works seamlessly on mobile and desktop
- **Modern UI**: Built with shadcn/ui components and Tailwind CSS
- **Real-time Updates**: Immediate feedback for all user actions
- **Professional Interface**: Clean, intuitive design with smooth transitions

## Demo Accounts

The application includes demo accounts for testing:

- **Admin**: `admin` / `admin123`
- **Member**: `john` / `john123`
- **Member**: `jane` / `jane123`

## Technology Stack

- **Frontend**: React 19 with Vite
- **UI Components**: shadcn/ui with Tailwind CSS
- **Icons**: Lucide React
- **Routing**: React Router DOM
- **Date Handling**: date-fns
- **Form Management**: React Hook Form with Zod validation

## Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Start the development server:
   ```bash
   pnpm run dev
   ```

4. Open [http://localhost:5173](http://localhost:5173) in your browser

### Building for Production

```bash
pnpm run build
```

The built files will be in the `dist` directory.

## Deployment to Vercel

This application is optimized for Vercel deployment:

1. **Connect to Vercel**:
   - Push your code to GitHub/GitLab/Bitbucket
   - Import the project in Vercel dashboard
   - Vercel will automatically detect the Vite framework

2. **Automatic Configuration**:
   - The included `vercel.json` configures optimal settings
   - Build command: `pnpm run build`
   - Output directory: `dist`
   - SPA routing is properly configured

3. **Environment Variables** (for future backend integration):
   - `DATABASE_URL`: Database connection string
   - `JWT_SECRET`: Secret for authentication tokens
   - `ZAPIER_WEBHOOK_SECRET`: Secret for Zapier integration

## Future Enhancements

This application is designed to be extended with:

- **Backend API**: Database integration for persistent data
- **Real Authentication**: JWT-based authentication system
- **Zapier Integration**: Automated reminder system
- **Email Notifications**: Backup notification system
- **Data Export**: CSV/Excel export functionality
- **Advanced Analytics**: Detailed performance metrics

## Project Structure

```
src/
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── LoginPage.jsx    # Authentication interface
│   ├── Navigation.jsx   # Navigation bar
│   ├── Dashboard.jsx    # User dashboard
│   └── AdminDashboard.jsx # Admin interface
├── assets/              # Static assets
├── App.jsx             # Main application component
├── App.css             # Global styles
└── main.jsx            # Application entry point
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
