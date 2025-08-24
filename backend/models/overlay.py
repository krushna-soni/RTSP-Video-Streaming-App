# backend/models/overlay.py
from datetime import datetime
from bson.objectid import ObjectId

class Overlay:
    def __init__(self, name, type, content, position, size, style=None, created_at=None):
        self.name = name
        self.type = type  # 'text' or 'logo'
        self.content = content  # text content or image URL
        self.position = position  # {'x': int, 'y': int}
        self.size = size  # {'width': int, 'height': int}
        self.style = style or {}  # color, font-size, opacity, etc.
        self.created_at = created_at or datetime.utcnow()
        self.updated_at = datetime.utcnow()

    def to_dict(self):
        return {
            'name': self.name,
            'type': self.type,
            'content': self.content,
            'position': self.position,
            'size': self.size,
            'style': self.style,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }

    @staticmethod
    def from_dict(data):
        return Overlay(
            name=data.get('name'),
            type=data.get('type'),
            content=data.get('content'),
            position=data.get('position'),
            size=data.get('size'),
            style=data.get('style', {}),
            created_at=data.get('created_at')
        )