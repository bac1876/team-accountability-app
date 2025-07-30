# AiStager - AI Interior Design Application

Transform your living spaces with AI-powered interior design suggestions. Upload a photo of any room and get instant AI-staged variations with beautiful furniture and decor while preserving the exact room structure.

![AI Interior Designer](https://img.shields.io/badge/AI-Powered-blue)
![Render](https://img.shields.io/badge/Deploy-Render-green)
![Flask](https://img.shields.io/badge/Backend-Flask-black)

## Features

- 🏠 **Room Types**: Living Room, Bedroom, Kitchen, Bathroom, Dining Room
- 🎨 **Design Styles**: Modern, Contemporary, Scandinavian, Minimal (AI auto-detects if not specified)
- 🖼️ **Structure Preservation**: Keeps walls, windows, and room layout intact
- 🚀 **AI Staging**: Powered by ReimagineHome AI for professional virtual staging
- 📷 **Smart Image Hosting**: Automatic upload to Cloudinary (with fallback options)
- ⚡ **Webhook Integration**: Real-time results via webhooks
- 📱 **Responsive Design**: Works on desktop and mobile devices

## Quick Start

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd AiStager
```

### 2. Install Dependencies

Python dependencies:
```bash
pip install -r requirements.txt
```

Node.js dependencies (for Vercel deployment):
```bash
npm install
```

### 3. Set Up Environment Variables
Copy the example environment file and add your API keys:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your keys:
```
# Required for AI staging
REIMAGINEHOME_API_KEY=your-reimaginehome-api-key

# Recommended for reliable image hosting
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Alternative image hosting
IMGBB_API_KEY=your-imgbb-key
```

Get your API keys at:
- ReimagineHome: https://www.reimaginehome.ai (7-day free trial)
- Cloudinary: https://cloudinary.com (free tier available)
- ImgBB: https://api.imgbb.com (free tier available)

### 4. Run Development Server

Flask backend:
```bash
python app.py
```

Visit http://localhost:5000 to see the app.

## Deployment

### Deploy to Render (Recommended)

1. Push your code to GitHub
2. Visit [render.com](https://render.com) and create a new Web Service
3. Connect your GitHub repository
4. Configure the service:
   - Runtime: Python 3
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn app:app`
5. Add environment variables in Render dashboard:
   - `REIMAGINEHOME_API_KEY`
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
6. Deploy!

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

## How It Works

1. **Upload**: Drag and drop or click to upload a room photo
2. **Select Room Type**: Choose from Living Room, Bedroom, Kitchen, etc.
3. **Choose Style**: Select a design theme or let AI decide
4. **Generate**: AI stages your room with appropriate furniture and decor
5. **View Results**: Get your professionally staged room image

## Technology Stack

- **Frontend**: Embedded HTML with Tailwind CSS
- **Backend**: Flask (Python) with gunicorn
- **AI Service**: ReimagineHome API for virtual staging
- **Image Hosting**: Cloudinary (primary), 0x0.st (fallback)
- **Deployment**: Render.com

## Project Structure

```
AiStager/
├── app.py                # Main Flask backend with ReimagineHome integration
├── requirements.txt      # Python dependencies
├── render.yaml          # Render deployment config
├── public/              # Frontend variations
│   └── *.html          # Different UI implementations
├── pages/api/           # Vercel API endpoints (alternative)
├── app_*.py             # Various backend implementations
├── test_*.py            # Test scripts
└── .env.local           # Environment variables (create from .env.local.example)
```

## Development

### Current Implementation (app.py)
- Uses ReimagineHome API for professional virtual staging
- Implements webhook-based asynchronous processing
- Automatic image hosting with Cloudinary (falls back to 0x0.st)
- Stores recent stagings for user convenience

### Alternative Implementations
- `app_dalle.py`: Uses OpenAI DALL-E for image generation
- `app_controlnet.py`: Uses Replicate's ControlNet
- `app_reimaginehome_*.py`: Various ReimagineHome integration approaches
- `main.py`: Simple local-only implementation

## Troubleshooting

### Image Upload Issues
- Ensure Cloudinary is configured in `.env.local`
- Check that your image is under 10MB
- Verify the ReimagineHome API accepts the image URL

### Staging Not Completing
- Check webhook URL is accessible (not localhost when deployed)
- Verify ReimagineHome API key is valid
- Check browser console for errors

### API Key Issues
- ReimagineHome offers a 7-day free trial
- Ensure API key is properly set in environment variables
- Test API connection with `python test_api_status.py`

## Contributing

Feel free to open issues or submit pull requests to improve the application!

## License

MIT

## Current Status (July 29, 2025)

### Recent Changes
- **Fixed Environment Variables**: Resolved issue where environment variables weren't loading in Vercel due to ES modules configuration
  - Removed `"type": "module"` from package.json
  - Converted all API files from ES modules to CommonJS
  - Downgraded node-fetch from v3 to v2.7.0 for CommonJS compatibility

- **API Integration**: Successfully integrated InstantDecoAI for virtual staging
  - Fixed authentication issues with Bearer token format
  - Ensured all required parameters (room_type, design, block_element) are included in requests
  - Current API key: bhqAdea6X9lehYWyi5HzZ9Z5gobNhm00

- **Webhook & Polling System**: Implemented dual approach for receiving results
  - Created `/api/webhook-receiver` endpoint to receive results from InstantDeco
  - Created `/api/check-result` endpoint for polling results
  - Frontend polls check-result endpoint which checks both webhook storage and memory
  - Removed test endpoints to stay under Vercel's 12 function limit

### Architecture Notes
- **Current Endpoints**:
  - `/api/stage.js` - Main staging endpoint that uploads images to ImgBB and calls InstantDeco
  - `/api/webhook-receiver.js` - Receives and stores results from InstantDeco webhooks
  - `/api/check-result.js` - Polling endpoint that checks for completed results
  - `/api/health.js` - Health check endpoint
  - `/api/recent-stagings.js` - Returns recent staging history

- **Image Flow**:
  1. User uploads image → Base64 encoded
  2. Backend uploads to ImgBB → Gets URL
  3. Sends URL to InstantDeco with webhook URL
  4. InstantDeco processes and sends results to webhook
  5. Frontend polls check-result until completion

### Known Issues & Solutions
- **Timeouts**: InstantDeco can take 30-60 seconds, implemented polling with 180s timeout
- **Vercel Function Limit**: Limited to 12 functions on hobby plan, removed test endpoints
- **CORS**: All endpoints properly configured with CORS headers

### Next Steps
- Deploy current webhook implementation
- Monitor webhook reliability in production
- Consider database for persistent storage instead of in-memory