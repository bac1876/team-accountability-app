# Deployment Guide for communitynwa.com

## Step 1: Deploy to Vercel

1. **Push to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Configure for communitynwa.com deployment"
   git push origin main
   ```

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Vite configuration
   - Click "Deploy"

## Step 2: Configure Custom Domain (communitynwa.com)

### In Vercel Dashboard:

1. Go to your project's Settings → Domains
2. Add `communitynwa.com` as custom domain
3. Add `www.communitynwa.com` as well (optional)

### DNS Configuration:

You'll need to update your domain's DNS settings at your domain registrar:

#### Option A: Using A Records (Recommended)
Add these A records to your domain:
- Type: A
- Name: @ (or leave blank for root)
- Value: 76.76.21.21

#### Option B: Using CNAME (for www subdomain)
- Type: CNAME
- Name: www
- Value: cname.vercel-dns.com

#### For both root and www:
1. Add both A record for root (@) pointing to 76.76.21.21
2. Add CNAME for www pointing to cname.vercel-dns.com

### DNS Propagation:
- Changes typically take 5-30 minutes
- Can take up to 48 hours in some cases
- Check status at: https://dnschecker.org

## Step 3: SSL Certificate

Vercel automatically provisions SSL certificates once DNS is configured correctly.

## Step 4: Environment Variables (Optional)

If you plan to add backend features:

1. In Vercel Dashboard → Settings → Environment Variables
2. Add any required variables:
   - `DATABASE_URL` (when you add a database)
   - `JWT_SECRET` (for authentication)
   - `ZAPIER_WEBHOOK_URL` (for Zapier integration)

## Step 5: Verify Deployment

Once DNS propagates:
1. Visit https://communitynwa.com
2. Check SSL certificate (should show "Issued by Let's Encrypt")
3. Test the application functionality

## Continuous Deployment

After initial setup:
- Every push to `main` branch automatically deploys
- Preview deployments for pull requests
- Rollback capability in Vercel dashboard

## Domain Registrar-Specific Instructions

### GoDaddy:
1. Go to DNS Management
2. Edit A record for @ to point to 76.76.21.21
3. Add CNAME for www to cname.vercel-dns.com

### Namecheap:
1. Go to Advanced DNS
2. Add A Record: Host @ , Value 76.76.21.21
3. Add CNAME: Host www, Value cname.vercel-dns.com

### Cloudflare:
1. Set to DNS Only (not Proxied) initially
2. Add A record for root
3. Add CNAME for www
4. Can enable proxy after verification

## Troubleshooting

### Domain not working:
- Check DNS propagation: https://dnschecker.org
- Verify records in Vercel dashboard
- Ensure no conflicting records at registrar

### SSL issues:
- Wait for automatic provisioning (up to 24 hours)
- Check domain verification in Vercel
- Contact Vercel support if issues persist

### App not loading:
- Check build logs in Vercel dashboard
- Verify all dependencies are installed
- Check browser console for errors

## Support

- Vercel Documentation: https://vercel.com/docs
- Vercel Support: https://vercel.com/support
- DNS Help: Check your domain registrar's support