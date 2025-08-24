# RTSP Streaming Application - API Documentation

## Table of Contents
- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Response Format](#response-format)
- [Error Handling](#error-handling)
- [API Endpoints](#api-endpoints)
- [Data Models](#data-models)
- [Status Codes](#status-codes)
- [Rate Limiting](#rate-limiting)
- [Examples](#examples)

## Overview

The RTSP Streaming Application API provides RESTful endpoints for managing video overlay settings. This API supports CRUD operations for text and logo overlays that can be positioned and resized on video streams.

**Content-Type:** `application/json`

## Base URL

```
http://localhost:5000/api
```

## Authentication

Currently, no authentication is required. All endpoints are publicly accessible.

⚠️ **Production Note:** Implement authentication before deploying to production.

## Response Format

All API responses follow a consistent structure:

### Success Response
```json
{
  "success": true,
  "data": {},
  "message": "Optional success message"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message",
  "details": {} // Optional additional error details
}
```

## Error Handling

The API uses standard HTTP status codes and provides detailed error messages:

- **400 Bad Request:** Invalid input data or malformed request
- **404 Not Found:** Resource not found
- **500 Internal Server Error:** Server-side error

### Common Error Types
- `Validation failed`: Input data validation errors
- `Invalid overlay ID format`: Malformed MongoDB ObjectId
- `Overlay not found`: Requested overlay doesn't exist
- `No data provided`: Missing request body
- `Failed to fetch/create/update/delete overlay`: Database operation errors

## API Endpoints

### 1. Health Check

Check API and database status.

**Endpoint:** `GET /api/health`

**Response:**
```json
{
  "success": true,
  "status": "Backend is running",
  "timestamp": "2025-01-24T10:30:00.000Z",
  "database": {
    "status": "connected",
    "message": "Database connected and indexed"
  },
  "config": {
    "debug": true,
    "cors_origins": ["http://localhost:3000"]
  }
}
```

### 2. Database Test

Test database connectivity and get collection statistics.

**Endpoint:** `GET /api/test-db`

**Response:**
```json
{
  "success": true,
  "status": "Database connected successfully",
  "overlays_count": 3,
  "message": "Database connected and indexed"
}
```

### 3. Get All Overlays

Retrieve all overlay configurations.

**Endpoint:** `GET /api/overlays`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "65b1234567890abcdef12345",
      "name": "Welcome Text",
      "type": "text",
      "content": "Welcome to RTSP Stream!",
      "position": { "x": 10, "y": 10 },
      "size": { "width": 25, "height": 8 },
      "style": {
        "color": "#ffffff",
        "fontSize": "20px",
        "fontWeight": "bold",
        "backgroundColor": "rgba(0,0,0,0.7)"
      },
      "created_at": "2025-01-24T10:00:00.000Z",
      "updated_at": "2025-01-24T10:00:00.000Z"
    }
  ],
  "count": 1
}
```

### 4. Get Overlay by ID

Retrieve a specific overlay by its ID.

**Endpoint:** `GET /api/overlays/{overlay_id}`

**Parameters:**
- `overlay_id` (string, required): MongoDB ObjectId of the overlay

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "65b1234567890abcdef12345",
    "name": "Welcome Text",
    "type": "text",
    "content": "Welcome to RTSP Stream!",
    "position": { "x": 10, "y": 10 },
    "size": { "width": 25, "height": 8 },
    "style": {
      "color": "#ffffff",
      "fontSize": "20px"
    },
    "created_at": "2025-01-24T10:00:00.000Z",
    "updated_at": "2025-01-24T10:00:00.000Z"
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": "Overlay not found"
}
```

### 5. Create Overlay

Create a new overlay configuration.

**Endpoint:** `POST /api/overlays`

**Request Body:**
```json
{
  "name": "My Custom Text",
  "type": "text",
  "content": "Hello World!",
  "position": { "x": 20, "y": 15 },
  "size": { "width": 30, "height": 10 },
  "style": {
    "color": "#ff0000",
    "fontSize": "18px",
    "fontWeight": "bold"
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Overlay created successfully",
  "data": {
    "_id": "65b1234567890abcdef12346",
    "name": "My Custom Text",
    "type": "text",
    "content": "Hello World!",
    "position": { "x": 20, "y": 15 },
    "size": { "width": 30, "height": 10 },
    "style": {
      "color": "#ff0000",
      "fontSize": "18px",
      "fontWeight": "bold"
    },
    "created_at": "2025-01-24T10:30:00.000Z",
    "updated_at": "2025-01-24T10:30:00.000Z"
  }
}
```

### 6. Update Overlay

Update an existing overlay configuration.

**Endpoint:** `PUT /api/overlays/{overlay_id}`

**Parameters:**
- `overlay_id` (string, required): MongoDB ObjectId of the overlay

**Request Body (partial update supported):**
```json
{
  "position": { "x": 25, "y": 20 },
  "style": {
    "color": "#00ff00"
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Overlay updated successfully",
  "data": {
    "_id": "65b1234567890abcdef12346",
    "name": "My Custom Text",
    "type": "text",
    "content": "Hello World!",
    "position": { "x": 25, "y": 20 },
    "size": { "width": 30, "height": 10 },
    "style": {
      "color": "#00ff00",
      "fontSize": "18px",
      "fontWeight": "bold"
    },
    "created_at": "2025-01-24T10:30:00.000Z",
    "updated_at": "2025-01-24T10:35:00.000Z"
  }
}
```

### 7. Delete Overlay

Delete an overlay configuration.

**Endpoint:** `DELETE /api/overlays/{overlay_id}`

**Parameters:**
- `overlay_id` (string, required): MongoDB ObjectId of the overlay

**Response (200):**
```json
{
  "success": true,
  "message": "Overlay deleted successfully"
}
```

### 8. Initialize Sample Data

Create sample overlay data for testing purposes.

**Endpoint:** `POST /api/init-sample-data`

**Response (201):**
```json
{
  "success": true,
  "message": "Initialized 3 sample overlays",
  "inserted_count": 3
}
```

### 9. Cleanup Problematic Overlays

Remove overlays with problematic URLs (placeholder/test URLs).

**Endpoint:** `DELETE /api/cleanup-overlays`

**Response (200):**
```json
{
  "success": true,
  "message": "Cleaned up 2 problematic overlays",
  "deleted_count": 2
}
```

## Data Models

### Overlay Model

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | string | Auto-generated | MongoDB ObjectId |
| `name` | string | Yes | Display name for the overlay |
| `type` | string | Yes | Either "text" or "logo" |
| `content` | string | Yes | Text content or image URL |
| `position` | object | Yes | `{x: number, y: number}` - percentage-based positioning |
| `size` | object | Yes | `{width: number, height: number}` - percentage-based sizing |
| `style` | object | No | CSS-like styling properties |
| `created_at` | string | Auto-generated | ISO 8601 timestamp |
| `updated_at` | string | Auto-updated | ISO 8601 timestamp |

### Position Object
```json
{
  "x": 10.5,  // X position as percentage (0-100)
  "y": 20.0   // Y position as percentage (0-100)
}
```

### Size Object
```json
{
  "width": 25.0,  // Width as percentage (0-100)
  "height": 8.0   // Height as percentage (0-100)
}
```

### Style Object (Optional)
For text overlays:
```json
{
  "color": "#ffffff",
  "fontSize": "16px",
  "fontWeight": "bold",
  "fontStyle": "italic",
  "textShadow": "2px 2px 4px rgba(0,0,0,0.8)",
  "backgroundColor": "rgba(0,0,0,0.7)",
  "padding": "10px",
  "borderRadius": "5px"
}
```

For logo overlays:
```json
{
  "borderRadius": "5px",
  "boxShadow": "0 2px 4px rgba(0,0,0,0.3)",
  "backgroundColor": "transparent"
}
```

## Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 404 | Not Found |
| 500 | Internal Server Error |

## Rate Limiting

Currently, no rate limiting is implemented. Consider implementing rate limiting for production use.

## Examples

### Creating a Text Overlay
```bash
curl -X POST http://localhost:5000/api/overlays \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Live Status",
    "type": "text",
    "content": "LIVE",
    "position": {"x": 85, "y": 10},
    "size": {"width": 12, "height": 6},
    "style": {
      "color": "#ff0000",
      "fontSize": "18px",
      "fontWeight": "bold",
      "backgroundColor": "rgba(255,255,255,0.9)",
      "padding": "5px 10px",
      "borderRadius": "15px"
    }
  }'
```

### Creating a Logo Overlay
```bash
curl -X POST http://localhost:5000/api/overlays \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Company Logo",
    "type": "logo",
    "content": "https://example.com/logo.png",
    "position": {"x": 75, "y": 5},
    "size": {"width": 20, "height": 8},
    "style": {
      "borderRadius": "5px",
      "boxShadow": "0 2px 4px rgba(0,0,0,0.3)"
    }
  }'
```

### Updating Overlay Position
```bash
curl -X PUT http://localhost:5000/api/overlays/65b1234567890abcdef12345 \
  -H "Content-Type: application/json" \
  -d '{
    "position": {"x": 50, "y": 50}
  }'
```

### JavaScript/Frontend Usage

```javascript
import { overlayAPI } from './services/api';

// Get all overlays
const overlays = await overlayAPI.getAll();

// Create new overlay
const newOverlay = await overlayAPI.create({
  name: "My Overlay",
  type: "text",
  content: "Hello World",
  position: { x: 10, y: 10 },
  size: { width: 20, height: 5 }
});

// Update overlay
await overlayAPI.update(overlayId, {
  position: { x: 30, y: 40 }
});

// Delete overlay
await overlayAPI.delete(overlayId);
```

## Testing

### Health Check
```bash
curl http://localhost:5000/api/health
```

### Database Test
```bash
curl http://localhost:5000/api/test-db
```

### Initialize Sample Data
```bash
curl -X POST http://localhost:5000/api/init-sample-data
```

## Error Scenarios

### Invalid ObjectId
**Request:** `GET /api/overlays/invalid-id`
**Response (400):**
```json
{
  "success": false,
  "error": "Invalid overlay ID format"
}
```

### Validation Error
**Request:** `POST /api/overlays` with missing required fields
**Response (400):**
```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "name": "Name is required",
    "type": "Type must be either 'text' or 'logo'"
  }
}
```

### Database Error
**Response (500):**
```json
{
  "success": false,
  "error": "Failed to fetch overlay",
  "message": "Database connection error"
}
```

---

**📝 Note:** This API documentation reflects the current implementation as of January 2025. For the most up-to-date information, always refer to the source code and test the endpoints directly.
