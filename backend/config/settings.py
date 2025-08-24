# backend/config/settings.py
from .database import DatabaseConfig
from .app import AppConfig

# Combine all configurations
class Config(DatabaseConfig, AppConfig):
    """Combined configuration class"""
    
    def __init__(self):
        # Create necessary directories
        self.create_upload_folder()
    
    @classmethod
    def get_flask_config(cls):
        """Get Flask-specific configuration dictionary"""
        return {
            'SECRET_KEY': cls.SECRET_KEY,
            'DEBUG': cls.DEBUG,
            'MONGO_URI': cls.get_mongodb_uri(),
            'MAX_CONTENT_LENGTH': cls.MAX_CONTENT_LENGTH,
            'UPLOAD_FOLDER': cls.UPLOAD_FOLDER
        }