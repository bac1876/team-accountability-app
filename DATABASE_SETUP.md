# Database Setup Guide - Vercel Postgres

This guide walks you through setting up Vercel Postgres for your Team Accountability app to replace localStorage with persistent database storage.

## 🚀 Quick Setup Steps

### 1. Create Vercel Postgres Database

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Navigate to Storage**: Click "Storage" in the left sidebar
3. **Create Database**: Click "Create Database" → "Postgres"
4. **Name your database**: `team-accountability-db`
5. **Select region**: Choose closest to your users
6. **Create**: Click "Create" and wait for provisioning

### 2. Connect Database to Project

1. **Go to your project**: Navigate to `team-accountability-app` project
2. **Settings tab**: Click "Settings" → "Environment Variables"
3. **Connect Storage**: Click "Connect Store" → Select your Postgres database
4. **Auto-configure**: Vercel will automatically add all required environment variables:
   - `POSTGRES_URL`
   - `POSTGRES_PRISMA_URL`
   - `POSTGRES_URL_NON_POOLING`
   - `POSTGRES_USER`
   - `POSTGRES_HOST`
   - `POSTGRES_PASSWORD`
   - `POSTGRES_DATABASE`

### 3. Add Additional Environment Variables

Add these manually in Vercel Dashboard → Project Settings → Environment Variables:

```
DATABASE_INIT_TOKEN=secure-init-token-123
MESSAGING_API_TOKEN=secure-messaging-token-456
```

### 4. Initialize Database Schema

After deployment, initialize the database:

```bash
curl -X POST https://your-app.vercel.app/api/database/init \
  -H "Content-Type: application/json" \
  -d '{"token": "secure-init-token-123"}'
```

## 📊 Database Schema

The database includes these tables:

### **users**
- User accounts with email, password, name, phone, role
- Primary key: `id`
- Unique constraint: `email`

### **daily_commitments**
- Daily commitments for each user
- Links to users via `user_id`
- Unique constraint: `user_id + commitment_date`

### **weekly_goals**
- Weekly goals with progress tracking
- Links to users via `user_id`
- Status: active, completed, paused, cancelled

### **reflections**
- Daily reflections with wins, challenges, tomorrow focus
- Links to users via `user_id`
- Unique constraint: `user_id + reflection_date`

### **message_history**
- SMS messaging history and delivery status
- Links to users via `user_id`

### **webhook_config**
- Zapier webhook URLs configuration
- Webhook types: daily_reminder, weekly_goals, etc.

## 🔄 Migration from localStorage

The app includes automatic migration from localStorage to database:

### **What gets migrated:**
- ✅ All user accounts
- ✅ Daily commitments with status
- ✅ Weekly goals with progress
- ✅ Reflection entries
- ✅ User preferences

### **Migration process:**
1. **Automatic detection**: App detects existing localStorage data
2. **User prompt**: Asks if you want to migrate
3. **Data transfer**: Moves all data to database
4. **Verification**: Shows migration results
5. **Cleanup**: Optionally clears localStorage

## 🛠 API Endpoints

### **Authentication**
- `POST /api/auth/login` - User login

### **User Management**
- `GET /api/users` - Get all users
- `POST /api/users` - Create user
- `PUT /api/users` - Update user
- `DELETE /api/users` - Delete user
- `GET /api/users/bulk-import` - Preview bulk import
- `POST /api/users/bulk-import` - Execute bulk import

### **Commitments**
- `GET /api/commitments` - Get commitments
- `POST /api/commitments` - Create/update commitment
- `PUT /api/commitments` - Update commitment status

### **Goals**
- `GET /api/goals` - Get goals
- `POST /api/goals` - Create goal
- `PUT /api/goals` - Update goal progress
- `DELETE /api/goals` - Delete goal

### **Analytics**
- `GET /api/analytics` - Get team analytics

## 🔧 Troubleshooting

### **Database Connection Issues**
1. Check environment variables are set correctly
2. Verify database is running in Vercel dashboard
3. Check function logs in Vercel dashboard

### **Migration Issues**
1. Ensure database is initialized first
2. Check browser console for errors
3. Verify API endpoints are working

### **Performance Optimization**
1. Database includes optimized indexes
2. Connection pooling enabled by default
3. Queries are optimized for common operations

## 🚀 Benefits of Database Migration

### **Before (localStorage)**
- ❌ Data lost when browser cleared
- ❌ No cross-device synchronization
- ❌ Limited to single browser
- ❌ No real-time updates
- ❌ No backup/recovery

### **After (Vercel Postgres)**
- ✅ Persistent data storage
- ✅ Cross-device synchronization
- ✅ Multi-user real-time access
- ✅ Automatic backups
- ✅ Scalable to unlimited users
- ✅ Professional-grade reliability

## 📈 Next Steps

After database setup:

1. **Test the migration**: Import your team and verify data persistence
2. **Configure messaging**: Set up Zapier webhooks for SMS
3. **Monitor usage**: Use Vercel analytics to track performance
4. **Scale up**: Add more team members as needed

Your Team Accountability app is now enterprise-ready with professional database backend! 🎉
