# RTSP Streaming Application

A full-stack, mobile-responsive video streaming application with real-time overlay management, built with React, Flask, and MongoDB.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.8+-green.svg)
![React](https://img.shields.io/badge/react-18+-blue.svg)
![TypeScript](https://img.shields.io/badge/typescript-4.8+-blue.svg)
![MongoDB](https://img.shields.io/badge/mongodb-4.4+-green.svg)

## 🌟 Features

### 🎥 Video Streaming
* **Multi-format Support:** RTSP, HTTP, HLS, MP4, WebM
* **Adaptive Quality:** Automatic quality adjustment based on connection
* **Mobile Optimized:** Touch-friendly controls with auto-hide functionality
* **Cross-browser:** Works on all modern browsers including mobile

### 🎨 Dynamic Overlays
* **Real-time Editing:** Drag-and-drop positioning with live preview
* **Dual Types:** Text overlays with custom styling, Logo overlays with image support
* **Touch Controls:** Mobile-optimized editing with pinch-to-resize
* **Auto-save:** Seamless persistence of overlay changes

### 📱 Mobile-First Design
* **Responsive Layout:** Adapts from mobile (320px) to desktop (1920px+)
* **Touch Optimized:** Large touch targets, haptic feedback, gesture support
* **Performance:** Battery-efficient rendering and network usage

### 🔧 Developer Features
* **REST API:** Comprehensive CRUD operations for overlay management
* **Type Safety:** Full TypeScript implementation with proper typing
* **Error Handling:** Robust error boundaries and network resilience
* **Documentation:** Complete API docs and user guides included

## 🚀 Quick Start

### Prerequisites
- **Node.js** 16.x or higher
- **Python** 3.8 or higher
- **MongoDB** 4.4 or higher

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd rtsp-streaming-app
```

2. **Backend Setup**
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your MongoDB connection string

python app.py
```

3. **Frontend Setup**
```bash
cd frontend
npm install
npm start
```

4. **Access the Application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Health Check: http://localhost:5000/api/health

## 📁 Project Structure

```
rtsp-streaming-app/
├── backend/                    # Python Flask API server
│   ├── config/                # App configuration
│   │   ├── __init__.py
│   │   ├── app.py            # Flask app config
│   │   ├── database.py       # MongoDB connection
│   │   └── settings.py       # Environment settings
│   ├── models/               # Data models
│   │   ├── __init__.py
│   │   └── overlay.py        # Overlay schema
│   ├── routes/               # API endpoints
│   │   ├── __init__.py
│   │   └── overlays.py       # Overlay CRUD routes
│   ├── utils/                # Helper utilities
│   │   ├── __init__.py
│   │   ├── helpers.py        # Common functions
│   │   └── validators.py     # Input validation
│   ├── app.py               # Main Flask application
│   ├── requirements.txt     # Python dependencies
│   └── .env                # Environment variables
│
├── frontend/                 # React TypeScript client
│   ├── public/              # Static assets
│   └── src/
│       ├── components/      # React components
│       │   ├── LandingPage.tsx    # Main app interface
│       │   ├── VideoPlayer.tsx    # Video streaming component
│       │   ├── DraggableOverlay.tsx # Overlay positioning
│       │   ├── ErrorBoundary.tsx  # Error handling
│       │   └── ToastProvider.tsx  # Notifications
│       ├── services/        # API communication
│       │   └── api.ts       # API service layer
│       ├── hooks/           # Custom React hooks
│       │   ├── useOverlayPosition.ts # Overlay management
│       │   └── useNetworkStatus.ts  # Connection monitoring
│       ├── types/           # TypeScript definitions
│       │   └── react-player.d.ts   # Video player types
│       └── utils/           # Frontend utilities
│
├── docs/                    # Documentation
│   ├── API_Documentation.md # Complete API reference
│   └── User_Guide.md       # User manual & setup guide
│
├── README.md               # This file
├── .gitignore             # Git ignore patterns
└── package.json           # Project metadata
```

## 🎮 Usage

### Basic Video Streaming

1. **Load a Video Stream**
   - Enter RTSP, HTTP, or file URL in the input field
   - Use provided sample URLs for testing
   - Click "Load Stream" to start playback

2. **Video Controls**
   - **Play/Pause:** Spacebar or click button
   - **Volume:** Mouse wheel over player
   - **Seeking:** Click progress bar or arrow keys
   - **Fullscreen:** F key or fullscreen button

### Overlay Management

#### Creating Overlays

**Text Overlay:**
```javascript
{
  "name": "Live Status",
  "type": "text",
  "content": "LIVE",
  "position": {"x": 85, "y": 10},
  "size": {"width": 12, "height": 6},
  "style": {
    "color": "#ff0000",
    "fontSize": "18px",
    "fontWeight": "bold"
  }
}
```

**Logo Overlay:**
```javascript
{
  "name": "Company Logo",
  "type": "logo", 
  "content": "https://example.com/logo.png",
  "position": {"x": 75, "y": 5},
  "size": {"width": 20, "height": 8}
}
```

#### Interactive Editing

1. **Enable Edit Mode:** Toggle the "Edit Overlays" switch
2. **Drag to Position:** Click and drag overlays (desktop) or long-press and drag (mobile)
3. **Resize:** Drag corner handles (desktop) or use pinch gestures (mobile)
4. **Auto-Save:** Changes are automatically persisted to the database

### Mobile Touch Controls

- **Long Press:** Activates drag mode for overlay positioning
- **Pinch Gesture:** Two-finger resize for overlays
- **Double Tap:** Toggle overlay selection
- **Haptic Feedback:** Device vibration confirms interactions

## 🔌 API Reference

### Base URL
```
http://localhost:5000/api
```

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | System health check |
| GET | `/overlays` | Get all overlays |
| GET | `/overlays/{id}` | Get overlay by ID |
| POST | `/overlays` | Create new overlay |
| PUT | `/overlays/{id}` | Update overlay |
| DELETE | `/overlays/{id}` | Delete overlay |

### Example API Usage

```bash
# Create a text overlay
curl -X POST http://localhost:5000/api/overlays \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Welcome Text",
    "type": "text",
    "content": "Welcome to our stream!",
    "position": {"x": 10, "y": 10},
    "size": {"width": 25, "height": 8}
  }'

# Update overlay position
curl -X PUT http://localhost:5000/api/overlays/65b1234567890abcdef12345 \
  -H "Content-Type: application/json" \
  -d '{"position": {"x": 50, "y": 50}}'
```

For complete API documentation, see [API_Documentation.md](docs/API_Documentation.md).

## 🛠️ Development

### Environment Configuration

**Backend (.env):**
```env
FLASK_ENV=development
FLASK_APP=app.py
MONGO_URI=mongodb://localhost:27017/rtsp_streaming_db
SECRET_KEY=your-secret-key-change-in-production
CORS_ORIGINS=http://localhost:3000
```

### Running in Development Mode

```bash
# Backend with auto-reload
cd backend
export FLASK_DEBUG=1
python app.py

# Frontend with hot reload  
cd frontend
npm run dev
```

### Testing

```bash
# Backend tests
cd backend
python -m pytest tests/

# Frontend tests
cd frontend
npm test

# API health check
curl http://localhost:5000/api/health

# Initialize sample data
curl -X POST http://localhost:5000/api/init-sample-data
```

## 📱 Browser Support

### Desktop
- **Chrome** 90+ ✅
- **Firefox** 88+ ✅  
- **Safari** 14+ ✅
- **Edge** 90+ ✅

### Mobile
- **iOS Safari** 14+ ✅
- **Chrome Mobile** 90+ ✅
- **Samsung Internet** 14+ ✅
- **Firefox Mobile** 88+ ✅

## 🔧 Advanced Features

### Custom Video Sources
- **RTSP Streams:** Requires conversion to web-compatible formats
- **HLS Streams:** Native support via HLS.js
- **Local Files:** Direct file URL support
- **CDN Integration:** Optimized delivery for production

### Performance Optimizations
- **Lazy Loading:** Components loaded on demand
- **Network Monitoring:** Automatic quality adjustment
- **Mobile Battery:** Efficient rendering and reduced network usage
- **Caching:** API responses and video metadata cached

### Security Features
- **Input Validation:** Comprehensive server-side validation
- **CORS Configuration:** Secure cross-origin resource sharing
- **Error Sanitization:** Safe error messages without sensitive data
- **Rate Limiting:** Protection against API abuse (production)

## 🚨 Troubleshooting

### Common Issues

**Backend Connection Failed:**
```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Verify Flask server
curl http://localhost:5000/api/health
```

**Video Won't Load:**
- Verify URL is accessible and CORS-enabled
- Try sample URLs for testing
- Check browser console for errors
- Ensure network connectivity

**Overlays Not Saving:**
- Check backend connectivity
- Verify database permissions  
- Look for JavaScript console errors
- Try refreshing the page

**Mobile Touch Issues:**
- Disable browser zoom settings
- Clear browser cache
- Try different mobile browser
- Check device touch screen calibration

For detailed troubleshooting, see [User_Guide.md](docs/User_Guide.md).

## 📚 Documentation

- **[API Documentation](docs/API_Documentation.md)** - Complete REST API reference
- **[User Guide](docs/User_Guide.md)** - Installation, setup, and usage instructions

## 👥 Acknowledgments

- **ReactPlayer** - Flexible video player component
- **Material-UI** - React component library
- **HLS.js** - JavaScript HLS client
- **Flask-PyMongo** - MongoDB integration for Flask
- **React DnD** - Drag and drop utilities

---