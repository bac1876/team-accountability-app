# Vercel Deployment Guide

## Quick Deployment Steps

### Option 1: Deploy from GitHub (Recommended)

1. **Push to GitHub**:
   ```bash
   # Create a new repository on GitHub first, then:
   git remote add origin https://github.com/yourusername/team-accountability-app.git
   git branch -M main
   git push -u origin main
   ```

2. **Deploy on Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will automatically detect the Vite framework
   - Click "Deploy"

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```

4. **Follow the prompts**:
   - Set up and deploy? **Y**
   - Which scope? Select your account
   - Link to existing project? **N**
   - What's your project's name? **team-accountability-app**
   - In which directory is your code located? **./**

### Option 3: Drag & Drop Deployment

1. **Build the project**:
   ```bash
   pnpm run build
   ```

2. **Deploy the dist folder**:
   - Go to [vercel.com](https://vercel.com)
   - Drag and drop the `dist` folder to the deployment area

## Configuration Details

### Automatic Configuration
The included `vercel.json` file automatically configures:
- **Build Command**: `pnpm run build`
- **Output Directory**: `dist`
- **Framework**: Vite (auto-detected)
- **SPA Routing**: Properly configured for React Router

### Environment Variables (Future Use)
When you add backend functionality, set these in Vercel dashboard:
- `DATABASE_URL`: Your database connection string
- `JWT_SECRET`: Secret for authentication tokens
- `ZAPIER_WEBHOOK_SECRET`: Secret for Zapier integration

## Post-Deployment

### Custom Domain (Optional)
1. Go to your project settings in Vercel
2. Navigate to "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

### Performance Optimization
The application is already optimized with:
- ✅ Code splitting with Vite
- ✅ CSS optimization with Tailwind
- ✅ Asset optimization
- ✅ Gzip compression (automatic on Vercel)

### Monitoring
- View deployment logs in Vercel dashboard
- Monitor performance with Vercel Analytics
- Set up error tracking if needed

## Testing Your Deployment

After deployment, test these features:
1. **Login System**: Try all demo accounts
2. **Navigation**: Test all routes and tabs
3. **Responsive Design**: Check mobile and desktop views
4. **Data Persistence**: Verify localStorage functionality
5. **Role-Based Access**: Test admin vs member permissions

## Demo Accounts for Testing

- **Admin**: `admin` / `admin123`
- **Member**: `john` / `john123`
- **Member**: `jane` / `jane123`

## Troubleshooting

### Common Issues

**Build Fails**:
- Check that all dependencies are in `package.json`
- Ensure no TypeScript errors (this is a JavaScript project)
- Verify all imports are correct

**Routing Issues**:
- The `vercel.json` handles SPA routing
- All routes should redirect to `index.html`

**Styling Issues**:
- Tailwind CSS is properly configured
- All shadcn/ui components are included

### Getting Help

1. Check Vercel deployment logs
2. Review the build output
3. Test locally with `pnpm run build && pnpm run preview`
4. Check browser console for errors

## Next Steps

After successful deployment, consider:
1. **Backend Integration**: Add a database and API
2. **Real Authentication**: Implement JWT-based auth
3. **Zapier Integration**: Set up automated reminders
4. **Analytics**: Add user behavior tracking
5. **Performance Monitoring**: Set up error tracking

Your Team Accountability app is now ready for production use! 🚀
