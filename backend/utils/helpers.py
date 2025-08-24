# backend/utils/helpers.py
from bson.objectid import ObjectId
import json

class JSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        if hasattr(obj, 'isoformat'):
            return obj.isoformat()
        return super().default(obj)

def serialize_overlay(overlay_data):
    """Convert MongoDB document to JSON-serializable format"""
    if overlay_data:
        overlay_data['_id'] = str(overlay_data['_id'])
        if 'created_at' in overlay_data:
            overlay_data['created_at'] = overlay_data['created_at'].isoformat()
        if 'updated_at' in overlay_data:
            overlay_data['updated_at'] = overlay_data['updated_at'].isoformat()
    return overlay_data

def serialize_overlay_list(overlay_list):
    """Convert list of MongoDB documents to JSON-serializable format"""
    return [serialize_overlay(overlay) for overlay in overlay_list]