# backend/routes/overlays.py 
from flask import Blueprint, request, jsonify
from bson.objectid import ObjectId
from datetime import datetime
import sys
import os

# Add the parent directory to Python path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.overlay import Overlay
from utils.validators import validate_overlay_data
from utils.helpers import serialize_overlay, serialize_overlay_list

overlay_bp = Blueprint('overlays', __name__)

def get_mongo():
    from app import mongo
    return mongo

@overlay_bp.route('/overlays', methods=['GET'])  # FIXED: Removed /api prefix
def get_all_overlays():
    """Get all overlay settings"""
    try:
        mongo = get_mongo()
        overlays = list(mongo.db.overlays.find())
        return jsonify({
            'success': True,
            'data': serialize_overlay_list(overlays),
            'count': len(overlays)
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to fetch overlays',
            'message': str(e)
        }), 500

@overlay_bp.route('/overlays/<overlay_id>', methods=['GET'])  # FIXED: Removed /api prefix
def get_overlay_by_id(overlay_id):
    """Get specific overlay by ID"""
    try:
        if not ObjectId.is_valid(overlay_id):
            return jsonify({
                'success': False,
                'error': 'Invalid overlay ID format'
            }), 400
        
        mongo = get_mongo()
        overlay = mongo.db.overlays.find_one({'_id': ObjectId(overlay_id)})
        
        if not overlay:
            return jsonify({
                'success': False,
                'error': 'Overlay not found'
            }), 404
        
        return jsonify({
            'success': True,
            'data': serialize_overlay(overlay)
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to fetch overlay',
            'message': str(e)
        }), 500

@overlay_bp.route('/overlays', methods=['POST'])  # FIXED: Removed /api prefix
def create_overlay():
    """Create new overlay setting"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400

        # Validate input data
        validated_data, validation_errors = validate_overlay_data(data)
        if validation_errors:
            return jsonify({
                'success': False,
                'error': 'Validation failed',
                'details': validation_errors
            }), 400

        # Create overlay object
        overlay = Overlay.from_dict(validated_data)
        overlay_dict = overlay.to_dict()

        # Insert into database
        mongo = get_mongo()
        result = mongo.db.overlays.insert_one(overlay_dict)
        
        # Fetch the created overlay
        created_overlay = mongo.db.overlays.find_one({'_id': result.inserted_id})
        
        return jsonify({
            'success': True,
            'message': 'Overlay created successfully',
            'data': serialize_overlay(created_overlay)
        }), 201
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to create overlay',
            'message': str(e)
        }), 500

@overlay_bp.route('/overlays/<overlay_id>', methods=['PUT'])  # FIXED: Removed /api prefix
def update_overlay(overlay_id):
    """Update existing overlay"""
    try:
        if not ObjectId.is_valid(overlay_id):
            return jsonify({
                'success': False,
                'error': 'Invalid overlay ID format'
            }), 400

        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400

        # Validate input data (allow partial updates)
        validated_data, validation_errors = validate_overlay_data(data, is_update=True)
        if validation_errors:
            return jsonify({
                'success': False,
                'error': 'Validation failed',
                'details': validation_errors
            }), 400

        # Add updated timestamp
        validated_data['updated_at'] = datetime.utcnow()

        # Update in database
        mongo = get_mongo()
        result = mongo.db.overlays.update_one(
            {'_id': ObjectId(overlay_id)},
            {'$set': validated_data}
        )

        if result.matched_count == 0:
            return jsonify({
                'success': False,
                'error': 'Overlay not found'
            }), 404

        # Fetch updated overlay
        updated_overlay = mongo.db.overlays.find_one({'_id': ObjectId(overlay_id)})
        
        return jsonify({
            'success': True,
            'message': 'Overlay updated successfully',
            'data': serialize_overlay(updated_overlay)
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to update overlay',
            'message': str(e)
        }), 500

@overlay_bp.route('/overlays/<overlay_id>', methods=['DELETE'])  # FIXED: Removed /api prefix
def delete_overlay(overlay_id):
    """Delete overlay"""
    try:
        if not ObjectId.is_valid(overlay_id):
            return jsonify({
                'success': False,
                'error': 'Invalid overlay ID format'
            }), 400

        mongo = get_mongo()
        result = mongo.db.overlays.delete_one({'_id': ObjectId(overlay_id)})

        if result.deleted_count == 0:
            return jsonify({
                'success': False,
                'error': 'Overlay not found'
            }), 404

        return jsonify({
            'success': True,
            'message': 'Overlay deleted successfully'
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to delete overlay',
            'message': str(e)
        }), 500
