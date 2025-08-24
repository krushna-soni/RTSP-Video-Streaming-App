# RTSP Streaming Application - User Guide

## Table of Contents
- [Overview](#overview)
- [System Requirements](#system-requirements)
- [Installation & Setup](#installation--setup)
- [Getting Started](#getting-started)
- [Feature Guide](#feature-guide)
- [Mobile & Touch Support](#mobile--touch-support)
- [Troubleshooting](#troubleshooting)
- [Advanced Configuration](#advanced-configuration)
- [FAQ](#faq)

## Overview

The RTSP Streaming Application is a full-stack web application that allows you to:
- Stream video from RTSP, HTTP, or file URLs
- Add customizable text and logo overlays
- Position and resize overlays with drag-and-drop
- Manage overlays through a REST API
- Enjoy mobile-responsive design with touch controls

**Tech Stack:**
- **Frontend:** React + TypeScript + Material-UI
- **Backend:** Python Flask + MongoDB
- **Video Player:** ReactPlayer with HLS.js support

## System Requirements

### Development Environment
- **Node.js:** 16.x or higher
- **Python:** 3.8 or higher
- **MongoDB:** 4.4 or higher
- **Operating System:** Windows, macOS, or Linux

### Browser Support
- **Desktop:** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile:** iOS Safari 14+, Chrome Mobile 90+, Samsung Internet 14+

### Network Requirements
- Stable internet connection for streaming
- CORS-enabled video sources for external streams

## Installation & Setup

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd rtsp-streaming-app
```

### Step 2: Backend Setup

1. **Navigate to backend directory:**
```bash
cd backend
```

2. **Create virtual environment:**
```bash
python -m venv venv
```

3. **Activate virtual environment:**
```bash
# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

4. **Install dependencies:**
```bash
pip install -r requirements.txt
```

5. **Set up environment variables:**
Create a `.env` file in the `backend` directory:
```env
FLASK_ENV=development
FLASK_APP=app.py
MONGO_URI=mongodb://localhost:27017/rtsp_streaming_db
SECRET_KEY=your-secret-key-change-in-production
```

6. **Start MongoDB:**
```bash
# Using MongoDB service
sudo systemctl start mongod  # Linux
brew services start mongodb  # macOS
# Or start MongoDB manually on Windows
```

7. **Start the backend server:**
```bash
python app.py
```
Backend will run on `http://localhost:5000`

### Step 3: Frontend Setup

1. **Open a new terminal and navigate to frontend:**
```bash
cd frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start the development server:**
```bash
npm start
```
Frontend will run on `http://localhost:3000`

### Step 4: Verify Installation

1. Open `http://localhost:3000` in your browser
2. Check system status - all indicators should be green
3. Click "Initialize Sample Data" to create test overlays

## Getting Started

### First Launch

1. **System Check:** The app automatically checks backend and database connectivity
2. **Sample Data:** Click "Initialize Sample Data" for demo overlays
3. **Stream URL:** Enter a video URL or use provided sample URLs

### Basic Workflow

1. **Load a Video Stream**
   - Enter an RTSP, HTTP, or file URL
   - Use sample URLs for testing
   - Click "Load Stream" to start playback

2. **Manage Overlays**
   - View existing overlays in the management panel
   - Create new text or logo overlays
   - Edit overlay properties (name, content, styling)

3. **Edit Mode**
   - Toggle "Edit Overlays" switch to enter edit mode
   - Drag overlays to reposition them
   - Resize using corner handles (desktop) or pinch gestures (mobile)

4. **Save Changes**
   - Changes are automatically saved when you move or resize overlays
   - Look for "Saving changes..." indicator

## Feature Guide

### Video Player Features

#### Supported Formats
- **RTSP Streams:** `rtsp://example.com/stream`
- **HTTP Streams:** `http://example.com/video.mp4`
- **HLS Streams:** `http://example.com/playlist.m3u8`
- **Local Files:** Direct file URLs

#### Player Controls
- **Play/Pause:** Space bar or click button
- **Volume:** Mouse wheel over player or volume slider
- **Seeking:** Click progress bar or use arrow keys
- **Fullscreen:** F key or fullscreen button

#### Mobile Controls
- **Touch to Show Controls:** Tap video area
- **Auto-hide:** Controls automatically hide after 4 seconds
- **Gesture Support:** Pinch to zoom, swipe for seeking

### Overlay Management

#### Creating Overlays

**Text Overlays:**
1. Click "Add Text Overlay" in the management panel
2. Enter overlay name and text content
3. Customize styling (color, font size, background)
4. Set initial position and size
5. Click "Create" to add to video

**Logo Overlays:**
1. Click "Add Logo Overlay" in the management panel
2. Enter overlay name and image URL
3. Supported formats: PNG, JPG, GIF, SVG
4. Set styling options (borders, shadows)
5. Click "Create" to add to video

#### Editing Overlays

**Edit Mode Controls:**
- Toggle "Edit Overlays" switch to activate edit mode
- Blue dashed borders appear around editable overlays
- Status panel shows editing state for each overlay

**Positioning (Desktop):**
- **Drag to Move:** Click and drag overlay to reposition
- **Precise Movement:** Use arrow keys for pixel-perfect positioning
- **Snap to Grid:** Hold Shift while dragging for grid alignment

**Positioning (Mobile/Touch):**
- **Touch and Hold:** Long press overlay to enter drag mode
- **Drag Gesture:** Move finger to reposition overlay
- **Haptic Feedback:** Device vibration confirms edit mode activation

**Resizing (Desktop):**
- **Corner Handles:** Drag bottom-right corner to resize proportionally
- **Edge Handles:** Drag edges for width/height-only resizing
- **Keyboard:** Use Ctrl + arrow keys for precise sizing

**Resizing (Mobile/Touch):**
- **Pinch Gesture:** Use two fingers to resize overlay
- **Proportional:** Maintains aspect ratio during resize
- **Constraints:** Minimum and maximum sizes are enforced

#### Advanced Styling

**Text Overlay Styles:**
```css
{
  "color": "#ffffff",           /* Text color */
  "fontSize": "18px",           /* Font size */
  "fontWeight": "bold",         /* Font weight */
  "fontStyle": "italic",        /* Font style */
  "textShadow": "2px 2px 4px rgba(0,0,0,0.8)", /* Text shadow */
  "backgroundColor": "rgba(0,0,0,0.7)",         /* Background */
  "padding": "10px",            /* Inner spacing */
  "borderRadius": "5px",        /* Rounded corners */
  "border": "2px solid white"   /* Border */
}
```

**Logo Overlay Styles:**
```css
{
  "borderRadius": "10px",       /* Rounded corners */
  "boxShadow": "0 4px 8px rgba(0,0,0,0.3)",    /* Drop shadow */
  "border": "2px solid white",  /* Border */
  "backgroundColor": "white"    /* Background color */
}
```

### API Integration

#### Frontend API Usage
The application includes a comprehensive API service layer:

```javascript
import { overlayAPI } from './services/api';

// Get all overlays
const response = await overlayAPI.getAll();
const overlays = response.data;

// Create new overlay
const newOverlay = await overlayAPI.create({
  name: "My Text",
  type: "text",
  content: "Hello World!",
  position: { x: 10, y: 10 },
  size: { width: 20, height: 5 }
});

// Update overlay position
await overlayAPI.update(overlayId, {
  position: { x: 30, y: 40 }
});
```

#### Error Handling
- **Network Errors:** Automatic retry with exponential backoff
- **Validation Errors:** Clear error messages with specific field information
- **Connection Issues:** Network status monitoring with reconnection attempts

## Mobile & Touch Support

### Mobile-First Design

The application is built mobile-first with responsive breakpoints:
- **Mobile:** < 600px width
- **Tablet:** 600px - 900px width
- **Desktop:** > 900px width

### Touch Optimizations

**Video Player:**
- Larger touch targets (minimum 44px)
- Touch-friendly sliders and buttons
- Auto-hiding controls optimized for touch

**Overlay Editing:**
- **Long Press:** Activates drag mode (200ms delay)
- **Drag Gesture:** Single finger movement for positioning
- **Pinch Gesture:** Two-finger resizing
- **Double Tap:** Toggle selection/edit mode
- **Haptic Feedback:** Vibration confirms interactions

**Mobile-Specific Features:**
- Orientation change handling
- Viewport meta tag optimization
- Prevention of iOS zoom on input focus
- Touch action optimization for smooth interactions

### Responsive Behaviors

**Layout Adaptations:**
- Collapsible sections on mobile
- Stacked layouts for narrow screens
- Optimized spacing and typography
- Larger buttons and touch targets

**Performance Optimizations:**
- Reduced animation complexity on mobile
- Battery-saving network request intervals
- Optimized image loading for logos
- Memory-efficient overlay rendering

## Troubleshooting

### Common Issues

#### 1. System Status Shows Errors

**Backend Not Connected:**
- ✅ Verify backend is running on port 5000
- ✅ Check MongoDB is running and accessible
- ✅ Verify `.env` configuration
- ✅ Check firewall/security settings

**Database Not Connected:**
- ✅ Ensure MongoDB service is running
- ✅ Verify `MONGO_URI` in `.env` file
- ✅ Check database permissions
- ✅ Try restarting MongoDB service

**Network Issues:**
- ✅ Check internet connectivity
- ✅ Verify proxy/VPN settings
- ✅ Clear browser cache and cookies
- ✅ Try different network connection

#### 2. Video Streaming Problems

**Video Won't Load:**
- ✅ Verify URL is accessible and correct
- ✅ Check CORS headers for cross-origin streams
- ✅ Try sample URLs to test player functionality
- ✅ Check browser console for error messages

**Playback Issues:**
- ✅ Try different video formats/codecs
- ✅ Check network bandwidth and stability
- ✅ Update browser to latest version
- ✅ Disable browser extensions temporarily

**RTSP Streams Not Working:**
- ⚠️ Note: Direct RTSP requires special browser configuration
- ✅ Use RTSP-to-HLS conversion services
- ✅ Try HTTP/HLS streams instead
- ✅ Consider using dedicated streaming servers

#### 3. Overlay Issues

**Overlays Not Saving:**
- ✅ Check backend connectivity
- ✅ Verify database permissions
- ✅ Look for JavaScript console errors
- ✅ Try refreshing the page

**Edit Mode Not Working:**
- ✅ Ensure "Edit Overlays" is toggled on
- ✅ Check for JavaScript errors
- ✅ Try different browser or device
- ✅ Clear browser cache

**Mobile Touch Issues:**
- ✅ Disable browser zoom/pan settings
- ✅ Try in different mobile browser
- ✅ Check touch event handling in dev tools
- ✅ Verify device touch screen calibration

### Advanced Debugging

#### Browser Developer Tools

1. **Console Errors:**
```javascript
// Check for errors
console.error('Error details appear here')

// API call debugging
// Look for network requests in Network tab
```

2. **Network Requests:**
- Monitor API calls in Network tab
- Check request/response headers
- Verify status codes (200, 201, 400, 404, 500)

3. **Application Storage:**
- Check Local Storage for cached data
- Verify Service Worker status
- Monitor memory usage in Performance tab

#### Backend Debugging

1. **Flask Debug Mode:**
```bash
export FLASK_DEBUG=1
python app.py
```

2. **MongoDB Connection:**
```bash
# Test MongoDB connection
mongo
use rtsp_streaming_db
db.overlays.find()
```

3. **API Testing:**
```bash
# Test health endpoint
curl http://localhost:5000/api/health

# Test database
curl http://localhost:5000/api/test-db
```

## Advanced Configuration

### Custom Video Sources

#### RTSP Configuration
For production RTSP streaming, consider:
- RTSP-to-WebRTC gateways
- HLS conversion services
- Streaming media servers (Wowza, Nginx RTMP)

#### CDN Integration
```javascript
// Example CDN configuration
const videoSources = {
  hls: 'https://cdn.example.com/playlist.m3u8',
  mp4: 'https://cdn.example.com/video.mp4',
  webm: 'https://cdn.example.com/video.webm'
};
```

### Database Optimization

#### MongoDB Indexes
```javascript
// Recommended indexes for production
db.overlays.createIndex({ "name": 1 })
db.overlays.createIndex({ "created_at": -1 })
db.overlays.createIndex({ "type": 1, "position.x": 1 })
```

#### Connection Pooling
```python
# Production MongoDB configuration
MONGO_URI = "mongodb://localhost:27017/rtsp_streaming_db?maxPoolSize=50&w=majority"
```

### Environment Variables

#### Production Settings
```env
FLASK_ENV=production
FLASK_DEBUG=False
SECRET_KEY=your-secure-production-key
MONGO_URI=mongodb://prod-server:27017/rtsp_streaming_db
CORS_ORIGINS=https://yourdomain.com
```

#### Security Headers
```python
# Add to Flask app for production
@app.after_request
def after_request(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    return response
```

## FAQ

### General Questions

**Q: What video formats are supported?**
A: MP4, WebM, HLS (m3u8), and any format supported by HTML5 video or HLS.js. RTSP requires conversion to web-compatible formats.

**Q: Can I use this for live streaming?**
A: Yes, the app supports live streams via HLS, RTMP (converted), and other web-compatible protocols.

**Q: Is authentication required?**
A: No authentication is implemented in the current version. Add authentication before production deployment.

### Technical Questions

**Q: How are overlay positions calculated?**
A: Positions use percentage-based coordinates (0-100) relative to video dimensions, ensuring responsiveness across different screen sizes.

**Q: Can I customize overlay animations?**
A: Currently, overlays are static. Custom animations can be added through CSS transitions in the style properties.

**Q: What's the maximum number of overlays?**
A: No hard limit is set, but performance may degrade with many complex overlays. Test with your specific use case.

### Mobile Questions

**Q: Why doesn't pinch-to-zoom work on overlays?**
A: Pinch gestures are reserved for overlay resizing in edit mode. Video zoom would interfere with overlay editing.

**Q: Can I edit overlays on small screens?**
A: Yes, the mobile interface is optimized for touch editing with larger controls and simplified gestures.

**Q: Does it work offline?**
A: The app requires network connectivity for API communication and video streaming. Local video files can work with cached API data.

### Performance Questions

**Q: How do I optimize for slow connections?**
A: Use lower resolution streams, enable network status monitoring, and consider implementing progressive loading for overlays.

**Q: Can I cache video content?**
A: Browser caching depends on video server headers. For local caching, consider implementing a media server with cache control.

**Q: How do I improve mobile performance?**
A: Reduce overlay complexity, optimize images, enable hardware acceleration, and use efficient video codecs.

---

**🚀 Need More Help?**

- Check the browser console for error messages
- Review the API documentation for integration details  
- Monitor network requests for debugging API issues
- Consider the troubleshooting steps for common problems

**📧 Support:** For technical issues, create detailed bug reports with browser/device info, console logs, and reproduction steps.