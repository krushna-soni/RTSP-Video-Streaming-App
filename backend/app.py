# backend/app.py - FIXED VERSION WITH PROPER CONFIG
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_pymongo import PyMongo
from bson.objectid import ObjectId
import os
import sys
from datetime import datetime

# Add current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import configuration
from config.settings import Config

# Initialize Flask app with configuration
def create_app():
    app = Flask(__name__)
    
    # Load configuration
    config = Config()
    app.config.update(config.get_flask_config())
    
    return app

app = create_app()

# Enable CORS for React frontend
CORS(app, origins=Config.CORS_ORIGINS, supports_credentials=True)

# Initialize MongoDB with error handling
try:
    mongo = PyMongo(app)
    print("✅ MongoDB connection initialized")
    print(f"📝 Database URI: {Config.get_mongodb_uri()}")
except Exception as e:
    print(f"❌ MongoDB initialization failed: {e}")
    mongo = None

# Test database connection on startup
def test_db_connection():
    if mongo is None:
        return False, "MongoDB not initialized"
    
    try:
        # Test connection
        mongo.db.command('ping')
        
        # Ensure indexes exist
        mongo.db.overlays.create_index([("name", 1)])
        mongo.db.overlays.create_index([("created_at", -1)])
        
        return True, "Database connected and indexed"
    except Exception as e:
        return False, f"Database connection failed: {str(e)}"

# Test connection on startup
db_status, db_message = test_db_connection()
if db_status:
    print(f"✅ {db_message}")
else:
    print(f"❌ {db_message}")

# Import and register blueprints
try:
    from routes.overlays import overlay_bp
    app.register_blueprint(overlay_bp, url_prefix='/api')
    print("✅ Overlay routes registered")
except Exception as e:
    print(f"❌ Failed to register overlay routes: {e}")

# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint with system status"""
    db_status, db_message = test_db_connection()
    
    return jsonify({
        "success": True,
        "status": "Backend is running",
        "timestamp": datetime.utcnow().isoformat(),
        "database": {
            "status": "connected" if db_status else "error",
            "message": db_message
        },
        "config": {
            "debug": app.config.get('DEBUG', False),
            "cors_origins": Config.CORS_ORIGINS
        }
    })

# Database test endpoint
@app.route('/api/test-db', methods=['GET'])
def test_database():
    """Test database connection endpoint"""
    db_status, db_message = test_db_connection()
    
    if db_status:
        try:
            # Also test collection access
            count = mongo.db.overlays.count_documents({})
            return jsonify({
                "success": True,
                "status": "Database connected successfully",
                "overlays_count": count,
                "message": db_message
            })
        except Exception as e:
            return jsonify({
                "success": False,
                "status": "Database connection failed",
                "error": str(e)
            }), 500
    else:
        return jsonify({
            "success": False,
            "status": "Database connection failed",
            "error": db_message
        }), 500

# Initialize sample data endpoint
@app.route('/api/init-sample-data', methods=['POST'])
def init_sample_data():
    """Initialize sample overlay data for testing"""
    if not mongo:
        return jsonify({
            "success": False,
            "error": "Database not available"
        }), 500
    
    try:
        # Clear existing sample data
        mongo.db.overlays.delete_many({"name": {"$regex": "^(Sample|Test)"}})
        
        # Create sample overlays with reliable content
        sample_overlays = [
            {
                'name': 'Sample Welcome Text',
                'type': 'text',
                'content': 'Welcome to RTSP Stream!',
                'position': {'x': 10, 'y': 10},
                'size': {'width': 25, 'height': 8},
                'style': {
                    'color': '#ffffff',
                    'fontSize': '20px',
                    'fontWeight': 'bold',
                    'textShadow': '2px 2px 4px rgba(0,0,0,0.8)',
                    'backgroundColor': 'rgba(0,0,0,0.7)',
                    'padding': '10px',
                    'borderRadius': '5px'
                },
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            },
            {
                'name': 'Sample Logo SVG',
                'type': 'logo',
                'content': 'data:image/svg+xml;charset=utf-8,%3Csvg%20width%3D%22120%22%20height%3D%2240%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Crect%20width%3D%22120%22%20height%3D%2240%22%20fill%3D%22%231976d2%22%20rx%3D%225%22/%3E%3Ctext%20x%3D%2260%22%20y%3D%2225%22%20text-anchor%3D%22middle%22%20font-family%3D%22Arial%2C%20sans-serif%22%20font-size%3D%2214%22%20fill%3D%22white%22%20font-weight%3D%22bold%22%3ELOGO%3C/text%3E%3C/svg%3E',
                'position': {'x': 75, 'y': 5},
                'size': {'width': 15, 'height': 5},
                'style': {
                    'borderRadius': '5px',
                    'boxShadow': '0 2px 4px rgba(0,0,0,0.3)'
                },
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            },
            {
                'name': 'Sample Status Text',
                'type': 'text',
                'content': 'LIVE',
                'position': {'x': 85, 'y': 85},
                'size': {'width': 10, 'height': 6},
                'style': {
                    'color': '#ff0000',
                    'fontSize': '16px',
                    'fontWeight': 'bold',
                    'backgroundColor': 'rgba(255,255,255,0.9)',
                    'padding': '5px 10px',
                    'borderRadius': '15px',
                    'textAlign': 'center'
                },
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }
        ]
        
        # Insert sample overlays
        result = mongo.db.overlays.insert_many(sample_overlays)
        
        return jsonify({
            'success': True,
            'message': f'Initialized {len(result.inserted_ids)} sample overlays',
            'inserted_count': len(result.inserted_ids)
        }), 201
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to initialize sample data: {str(e)}'
        }), 500

# Cleanup problematic overlays endpoint
@app.route('/api/cleanup-overlays', methods=['DELETE'])
def cleanup_problematic_overlays():
    """Remove overlays with problematic URLs"""
    if not mongo:
        return jsonify({
            "success": False,
            "error": "Database not available"
        }), 500
    
    try:
        # Define problematic URL patterns
        problematic_patterns = [
            "via.placeholder.com",
            "picsum.photos",
            "httpbin.org"
        ]
        
        # Build query for problematic overlays
        query = {
            "$or": [
                {"content": {"$regex": pattern, "$options": "i"}} 
                for pattern in problematic_patterns
            ]
        }
        
        # Count first
        count = mongo.db.overlays.count_documents(query)
        
        if count == 0:
            return jsonify({
                'success': True,
                'message': 'No problematic overlays found',
                'deleted_count': 0
            })
        
        # Delete problematic overlays
        result = mongo.db.overlays.delete_many(query)
        
        return jsonify({
            'success': True,
            'message': f'Cleaned up {result.deleted_count} problematic overlays',
            'deleted_count': result.deleted_count
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to cleanup overlays: {str(e)}'
        }), 500

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'error': 'Endpoint not found',
        'message': 'The requested API endpoint does not exist'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'error': 'Internal server error',
        'message': 'Something went wrong on the server'
    }), 500

@app.errorhandler(400)
def bad_request(error):
    return jsonify({
        'success': False,
        'error': 'Bad request',
        'message': 'Invalid request data'
    }), 400

if __name__ == '__main__':
    # Create upload folder
    Config.create_upload_folder()
    
    print("🚀 Starting RTSP Streaming Backend...")
    print(f"🌐 Server will run on: http://{Config.HOST}:{Config.PORT}")
    print(f"🔧 Debug mode: {Config.DEBUG}")
    print(f"📊 Database: {Config.get_mongodb_uri()}")
    
    app.run(
        debug=Config.DEBUG,
        host=Config.HOST,
        port=Config.PORT,
        threaded=True
    )