# AiStager - AI-Powered Interior Design & Virtual Staging

Transform any room with AI-powered interior design. Add furniture to empty spaces, redesign existing rooms, or enhance your photos with professional staging.

![AiStager Demo](https://aistager.vercel.app/icon-512.png)

## 🚀 Features

### Core Capabilities
- **Virtual Staging**: Add furniture to empty rooms
- **Room Redesign**: Transform existing furnished spaces
- **Photo Enhancement**: Improve lighting and quality
- **Empty Rooms**: Remove all furniture from spaces
- **Style Transfer**: Apply different design aesthetics

### Supported Room Types
- Living Room
- Bedroom
- Kitchen
- Bathroom
- Dining Room
- Home Office
- Kid's Bedroom

### Design Styles
- Modern
- Coastal
- Mid-Century
- Rustic
- Minimalist
- French

### Advanced Features
- 🌙 Dark mode UI with glass-morphism design
- 📱 Progressive Web App (installable on mobile)
- 🗜️ Automatic image compression
- ⚡ Real-time processing status
- 🔄 Webhook-based asynchronous processing
- 🚫 Rate limiting for API protection

## 🛠️ Technology Stack

- **Frontend**: React (single-file component)
- **Styling**: Tailwind CSS
- **Backend**: Vercel Serverless Functions
- **AI Service**: InstantDeco API
- **Image Storage**: ImgBB
- **Deployment**: Vercel

## 📱 Installation

### As a Web App
Visit [https://aistager.vercel.app](https://aistager.vercel.app)

### As a Mobile App (PWA)

**iPhone/iPad:**
1. Open in Safari
2. Tap Share → "Add to Home Screen"
3. Name it and tap "Add"

**Android:**
1. Open in Chrome
2. Tap menu → "Install app"
3. Confirm installation

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Vercel CLI
- InstantDeco API key
- ImgBB API key

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/yourusername/aistager.git
cd aistager
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file:
```
INSTANTDECO_API_KEY=your_instantdeco_key
IMGBB_API_KEY=your_imgbb_key
```

4. Run development server:
```bash
npm run dev
# or
vercel dev
```

5. Open [http://localhost:3000](http://localhost:3000)

### Deployment

Deploy to Vercel:
```bash
vercel --prod
```

Set environment variables in Vercel dashboard:
- `INSTANTDECO_API_KEY`
- `IMGBB_API_KEY`

## 📖 API Documentation

### POST /api/stage

Generate a staged image.

**Request Body:**
```json
{
  "image": "base64_encoded_image",
  "transformation_type": "furnish|empty|enhance|redesign|renovate",
  "room_type": "living_room|bedroom|kitchen|etc",
  "design_style": "modern|coastal|minimalist|etc",
  "update_flooring": true|false,
  "block_decorative": true|false
}
```

**Response:**
```json
{
  "success": true,
  "request_id": "unique_id",
  "message": "Processing started"
}
```

### GET /api/webhook-receiver

Check staging results.

**Query Parameters:**
- `request_id`: The ID returned from /api/stage

**Response:**
```json
{
  "success": true,
  "status": "completed",
  "images": ["https://image-url.jpg"]
}
```

## 🎨 Customization

### Modifying Styles
Edit the design styles in `public/index.html`:
```javascript
const designStyles = [
  { id: 'modern', name: 'Modern' },
  // Add your custom styles here
];
```

### Adding Room Types
Update the room types array:
```javascript
const roomTypes = [
  { id: 'living_room', name: 'Living Room' },
  // Add new room types
];
```

## 🐛 Known Issues

1. **Bedroom Empty**: Uses "office" room type for better furniture removal
2. **Rate Limiting**: 45-second cooldown between requests
3. **Mobile Timeouts**: Extended to 90 seconds for slower connections

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- InstantDeco AI for the powerful staging API
- Vercel for seamless deployment
- The open-source community

## 📞 Support

For issues and feature requests, please use the [GitHub Issues](https://github.com/yourusername/aistager/issues) page.

---

Made with ❤️ by [Your Name]