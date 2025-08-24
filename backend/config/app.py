# backend/config/app.py
import os

class AppConfig:
    """Application configuration settings"""
    
    # Flask app settings
    SECRET_KEY = os.getenv('SECRET_KEY', 'your-secret-key-change-in-production-immediately')
    DEBUG = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    HOST = os.getenv('FLASK_HOST', '127.0.0.1')
    PORT = int(os.getenv('FLASK_PORT', 5000))
    
    # CORS settings
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:3000,http://127.0.0.1:3000').split(',')
    
    # File upload settings (for future overlay image uploads)
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads')
    
    # API settings
    API_VERSION = 'v1'
    API_PREFIX = '/api'
    
    @classmethod
    def create_upload_folder(cls):
        """Create upload folder if it doesn't exist"""
        os.makedirs(cls.UPLOAD_FOLDER, exist_ok=True)