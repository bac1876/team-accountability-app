# Zapier + CallAction SMS Integration Setup Guide

## Overview

Your Team Accountability app now integrates with Zapier to send SMS messages through CallAction. This approach gives you maximum flexibility and doesn't require direct API access to CallAction.

## How It Works

1. **Team Accountability App** → Sends data to Zapier webhook
2. **Zapier** → Processes the data and triggers CallAction
3. **CallAction** → Sends SMS to team members
4. **Results** → Tracked in the app's message history

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
- **Webhook Integration**: Send structured data to Zapier
- **Message Templates**: Pre-written messages for common scenarios
- **Message History**: Track all sent messages with delivery status
- **Team Insights**: Identify who needs reminders vs high performers
- **Personalization**: Automatic name insertion in messages

## Setup Instructions

### Step 1: Create Zapier Webhooks

You need to create 5 separate Zaps (one for each message type):

#### 1. Daily Reminders Zap
1. **Go to Zapier**: Visit [zapier.com](https://zapier.com) and create a new Zap
2. **Trigger**: Choose "Webhooks by Zapier" → "Catch Hook"
3. **Copy Webhook URL**: Save this for the app configuration
4. **Action**: Choose "CallAction" → "Send SMS"
5. **Configure CallAction**:
   - **Phone Number**: Use `{{user__phone}}` from webhook data
   - **Message**: Use `{{message}}` from webhook data
   - **From Name**: Your business name
6. **Test & Activate**: Test the Zap and turn it on

#### 2. Weekly Goals Zap
- Follow the same steps as Daily Reminders
- Use a different webhook URL
- Same CallAction configuration

#### 3. Encouragement Messages Zap
- Follow the same steps as Daily Reminders
- Use a different webhook URL
- Same CallAction configuration

#### 4. Re-engagement Messages Zap
- Follow the same steps as Daily Reminders
- Use a different webhook URL
- Same CallAction configuration

#### 5. Custom Messages Zap
- Follow the same steps as Daily Reminders
- Use a different webhook URL
- Same CallAction configuration

### Step 2: Configure the App

1. **Login as Admin**: Use `brian@searchnwa.com` / `admin123`
2. **Go to Messaging**: Admin → Messaging → Configure Zapier tab
3. **Enter Webhook URLs**: Paste each Zapier webhook URL in the corresponding field
4. **Save Configuration**: Click "Save" for each webhook URL
5. **Test Webhooks**: Use the "Test" button to verify each webhook works

### Step 3: Set Up Vercel Environment Variable

For automated daily reminders to work:

1. **Go to Vercel Dashboard**: Visit your project settings
2. **Add Environment Variable**:
   - `MESSAGING_API_TOKEN`: Create a secure token (like `secure-zapier-token-123`)

### Step 4: Test the Integration

1. **Test Individual Webhooks**: Use the "Test" button for each webhook type
2. **Send Manual Message**: Try sending a custom message to yourself
3. **Test Automated Reminders**: Use the "Send Daily Reminders" button
4. **Check Message History**: Verify messages appear in the Message History tab

## Webhook Data Format

Each webhook sends this JSON structure to Zapier:

```json
{
  "type": "daily_reminder",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "firstName": "John"
  },
  "message": "Hi John! Don't forget to set your daily commitment...",
  "timestamp": "2024-01-01T18:00:00Z",
  "source": "Team Accountability App"
}
```

## Zapier Configuration Tips

### **CallAction Field Mapping**
- **To Phone Number**: `{{user__phone}}`
- **Message Text**: `{{message}}`
- **From Name**: Your business name (static)
- **Contact Name**: `{{user__name}}` (optional)

### **Advanced Zapier Features**
- **Filters**: Add filters to only send messages during business hours
- **Delays**: Add delays between messages to avoid rate limits
- **Formatting**: Use Zapier's formatter to modify phone numbers if needed
- **Multiple Actions**: Add multiple actions like logging to Google Sheets

### **Error Handling**
- **Zapier Retry**: Enable automatic retries for failed messages
- **Error Notifications**: Set up email notifications for failed Zaps
- **Fallback Actions**: Add backup actions if CallAction fails

## Usage Guide

### **Sending Manual Messages**

1. **Configure Zapier**: Make sure the "Custom Messages" webhook is configured
2. **Select Recipients**: Choose team members from the list
3. **Choose Template**: Pick a pre-written template or write custom message
4. **Personalize**: Use `{name}` to insert recipient's first name
5. **Send**: Click "Send to X Recipients"

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
4. **Send to Zapier**: Webhook data sent to configured Zapier webhook
5. **Zapier Processes**: Zapier receives data and triggers CallAction
6. **CallAction Sends**: SMS sent to team members
7. **Track Results**: Success/failure tracked in message history
8. **Update Stats**: Dashboard statistics updated

## Troubleshooting

### **Messages Not Sending**
- Verify all 5 Zapier webhooks are configured and active
- Check Zapier task history for errors
- Ensure CallAction is properly connected in Zapier
- Verify phone numbers are properly formatted
- Check CallAction account has sufficient credits

### **Automated Reminders Not Working**
- Verify Vercel cron job is configured (check vercel.json)
- Check Vercel environment variable `MESSAGING_API_TOKEN` is set
- Ensure daily reminders webhook is configured in the app
- Check Vercel function logs for errors

### **Webhook Test Failures**
- Verify webhook URL is correct (starts with https://hooks.zapier.com/)
- Check if Zap is turned on in Zapier
- Test the Zap directly in Zapier dashboard
- Ensure CallAction connection is working in Zapier

### **Zapier Issues**
- Check Zapier task history for detailed error messages
- Verify CallAction account is connected and active
- Test CallAction connection in Zapier
- Check for rate limits or quota issues

## Cost Considerations

- **Zapier Pricing**: Check your Zapier plan for task limits
- **CallAction Pricing**: Check your CallAction plan for SMS costs
- **Vercel Functions**: Cron jobs use Vercel function execution time
- **Rate Limiting**: Built-in delays prevent overwhelming Zapier

## Security

- **Webhook URLs**: Keep webhook URLs secure and don't share publicly
- **Authentication**: API endpoints require bearer token authentication
- **Data Privacy**: Only necessary user data is sent to Zapier
- **HTTPS**: All webhook communications use secure HTTPS

## Benefits of Zapier Integration

### **Advantages over Direct API**
- ✅ **No API Keys Required**: No need for CallAction API access
- ✅ **Visual Configuration**: Easy setup through Zapier interface
- ✅ **Error Handling**: Zapier provides built-in retry and error handling
- ✅ **Flexibility**: Easy to modify message logic without code changes
- ✅ **Multiple Integrations**: Can add other actions (logging, notifications, etc.)
- ✅ **Reliability**: Zapier handles rate limiting and delivery

### **Additional Possibilities**
- **Google Sheets Logging**: Log all messages to a spreadsheet
- **Slack Notifications**: Notify admins when messages are sent
- **Email Backup**: Send email if SMS fails
- **Time Zone Handling**: Send messages at optimal times per user
- **A/B Testing**: Test different message templates

## Support

For Zapier-specific issues:
- Visit [Zapier Help Center](https://help.zapier.com)
- Check Zapier task history for detailed error logs
- Contact Zapier support for integration issues

For CallAction-specific issues:
- Visit [CallAction Help Center](https://help.callaction.co)
- Contact CallAction support for SMS delivery issues

For app integration issues:
- Check Vercel function logs
- Review message history for error details
- Test webhook connections in the messaging center

## Next Steps

1. **Create your 5 Zapier webhooks** (one for each message type)
2. **Configure CallAction** as the action in each Zap
3. **Add webhook URLs** to the Team Accountability app
4. **Test each webhook** using the built-in test feature
5. **Set up Vercel environment variable** for automated reminders
6. **Test with a small group** before rolling out to full team
7. **Monitor message delivery rates** and adjust as needed

Your team accountability system is now ready for automated SMS engagement through Zapier! 🚀

## Quick Setup Checklist

- [ ] Create 5 Zaps in Zapier (Daily, Weekly, Encouragement, Re-engagement, Custom)
- [ ] Configure CallAction as action in each Zap
- [ ] Copy webhook URLs from each Zap
- [ ] Add webhook URLs to Team Accountability app
- [ ] Test each webhook using the "Test" button
- [ ] Set `MESSAGING_API_TOKEN` environment variable in Vercel
- [ ] Test automated daily reminders
- [ ] Send test message to yourself
- [ ] Monitor message history and success rates
- [ ] Roll out to full team

**Estimated Setup Time**: 30-45 minutes
