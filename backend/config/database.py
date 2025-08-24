# backend/config/database.py
import os
from urllib.parse import quote_plus

class DatabaseConfig:
    """Database configuration settings"""
    
    # MongoDB connection settings
    MONGODB_HOST = os.getenv('MONGODB_HOST', 'localhost')
    MONGODB_PORT = int(os.getenv('MONGODB_PORT', 27017))
    MONGODB_DATABASE = os.getenv('MONGODB_DATABASE', 'rtsp_streaming_db')
    MONGODB_USERNAME = os.getenv('MONGODB_USERNAME', '')
    MONGODB_PASSWORD = os.getenv('MONGODB_PASSWORD', '')
    
    @classmethod
    def get_mongodb_uri(cls):
        """Generate MongoDB connection URI"""
        if cls.MONGODB_USERNAME and cls.MONGODB_PASSWORD:
            # With authentication
            username = quote_plus(cls.MONGODB_USERNAME)
            password = quote_plus(cls.MONGODB_PASSWORD)
            return f"mongodb://{username}:{password}@{cls.MONGODB_HOST}:{cls.MONGODB_PORT}/{cls.MONGODB_DATABASE}"
        else:
            # Without authentication
            return f"mongodb://{cls.MONGODB_HOST}:{cls.MONGODB_PORT}/{cls.MONGODB_DATABASE}"