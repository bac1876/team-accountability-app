# CallAction SMS Integration Setup Guide

## Overview

Your Team Accountability app now includes direct CallAction API integration for automated SMS messaging. This allows you to send daily reminders, encouragement messages, and custom communications to your team members.

## Features

### ✅ **Automated Daily Reminders**
- Automatically sends SMS reminders at 6 PM daily
- Only messages users who haven't set their daily commitments
- Prevents duplicate messages (won't send if already sent today)

### ✅ **Smart Messaging Types**
- **Daily Reminders**: For users without today's commitments
- **Weekly Goal Reminders**: For users with stale or missing goals
- **Encouragement Messages**: For high performers (80%+ completion rate)
- **Re-engagement Messages**: For inactive users (3+ days without activity)
- **Custom Messages**: Send personalized messages to selected users

### ✅ **Advanced Features**
- **Bulk SMS**: Send to multiple users with rate limiting
- **Message Templates**: Pre-written messages for common scenarios
- **Message History**: Track all sent messages with delivery status
- **Team Insights**: Identify who needs reminders vs high performers
- **Personalization**: Automatic name insertion in messages

## Setup Instructions

### 1. Get Your CallAction API Key

1. **Login to CallAction**: Go to [callaction.co](https://callaction.co) and sign in
2. **Navigate to Settings**: Click Profile → Settings → Integrations
3. **Generate API Key**: Find the API section and create a new key
4. **Copy the Key**: Save it securely - you'll need it for configuration

### 2. Configure the App

1. **Login as Admin**: Use `brian@searchnwa.com` / `admin123`
2. **Go to Messaging**: Admin → Messaging tab
3. **Enter API Key**: Paste your CallAction API key
4. **Save Configuration**: Click "Save Configuration"

### 3. Set Up Vercel Environment Variables

For automated daily reminders to work, you need to configure environment variables in Vercel:

1. **Go to Vercel Dashboard**: Visit your project settings
2. **Add Environment Variables**:
   - `CALLACTION_API_KEY`: Your CallAction API key
   - `MESSAGING_API_TOKEN`: A secure token for API authentication (create your own)

### 4. Test the Integration

1. **Manual Test**: Send a test message to yourself first
2. **Automated Test**: Use the "Send Daily Reminders" button
3. **Check History**: Verify messages appear in the Message History tab

## Usage Guide

### **Sending Manual Messages**

1. **Select Recipients**: Choose team members from the list
2. **Choose Template**: Pick a pre-written template or write custom message
3. **Personalize**: Use `{name}` to insert recipient's first name
4. **Send**: Click "Send to X Recipients"

### **Automated Reminders**

The system automatically sends daily reminders at 6 PM to users who:
- Haven't set their daily commitment for today
- Haven't received a reminder today already

### **Message Templates**

- **Daily Reminder**: "Hi {name}! Don't forget to set your daily commitment..."
- **Weekly Goals**: "Hey {name}! Time to update your weekly goals..."
- **Encouragement**: "Great work {name}! Your consistency is paying off..."
- **Check-in**: "Hi {name}, just checking in! How are you doing..."
- **Re-engagement**: "We miss you {name}! It's been a while..."

### **Team Insights**

The app automatically identifies:
- **Users Needing Reminders**: Completion rate < 50%
- **High Performers**: Completion rate ≥ 80%
- **Inactive Users**: No activity for 3+ days

## API Endpoints

### **Daily Reminders Endpoint**
```
POST /api/messaging/daily-reminders
Authorization: Bearer your-messaging-api-token

Body:
{
  "type": "daily|weekly|encouragement|reengagement",
  "force": false,
  "dryRun": false
}
```

### **Cron Schedule**
The app is configured to automatically call the daily reminders endpoint at 6 PM daily using Vercel Cron Jobs.

## Message Flow

1. **6 PM Daily**: Vercel cron job triggers
2. **Check Users**: System identifies users without today's commitments
3. **Filter Duplicates**: Skip users who already received reminders today
4. **Send SMS**: CallAction API sends personalized messages
5. **Log Results**: Success/failure tracked in message history
6. **Update Stats**: Dashboard statistics updated

## Troubleshooting

### **Messages Not Sending**
- Verify CallAction API key is correct
- Check Vercel environment variables are set
- Ensure phone numbers are properly formatted
- Check CallAction account has sufficient credits

### **Automated Reminders Not Working**
- Verify Vercel cron job is configured
- Check environment variables in Vercel dashboard
- Ensure `MESSAGING_API_TOKEN` matches in both places
- Check Vercel function logs for errors

### **API Key Issues**
- Regenerate API key in CallAction dashboard
- Update key in both app configuration and Vercel environment
- Test connection using the "Test Connection" feature

## Cost Considerations

- **CallAction Pricing**: Check your CallAction plan for SMS costs
- **Vercel Functions**: Cron jobs use Vercel function execution time
- **Rate Limiting**: Built-in delays prevent API rate limit issues

## Security

- **API Keys**: Stored securely in environment variables
- **Authentication**: API endpoints require bearer token authentication
- **Data Privacy**: Message history stored locally, not transmitted externally

## Support

For CallAction-specific issues:
- Visit [CallAction Help Center](https://help.callaction.co)
- Contact CallAction support for API issues

For app integration issues:
- Check Vercel function logs
- Review message history for error details
- Test API connection in the messaging center

## Next Steps

1. **Configure your CallAction API key**
2. **Set up Vercel environment variables**
3. **Test with a small group first**
4. **Monitor message delivery rates**
5. **Adjust messaging frequency as needed**

Your team accountability system is now ready for automated SMS engagement! 🚀
