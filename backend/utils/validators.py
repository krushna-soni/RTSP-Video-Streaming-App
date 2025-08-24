# backend/utils/validators.py
from marshmallow import Schema, fields, validate, ValidationError

class OverlaySchema(Schema):
    name = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    type = fields.Str(required=True, validate=validate.OneOf(['text', 'logo']))
    content = fields.Str(required=True, validate=validate.Length(min=1, max=1000))
    position = fields.Dict(required=True, keys=fields.Str(), values=fields.Int())
    size = fields.Dict(required=True, keys=fields.Str(), values=fields.Int())
    style = fields.Dict(missing={}, keys=fields.Str(), values=fields.Raw())

class OverlayUpdateSchema(Schema):
    name = fields.Str(validate=validate.Length(min=1, max=100))
    type = fields.Str(validate=validate.OneOf(['text', 'logo']))
    content = fields.Str(validate=validate.Length(min=1, max=1000))
    position = fields.Dict(keys=fields.Str(), values=fields.Int())
    size = fields.Dict(keys=fields.Str(), values=fields.Int())
    style = fields.Dict(keys=fields.Str(), values=fields.Raw())

def validate_overlay_data(data, is_update=False):
    schema = OverlayUpdateSchema() if is_update else OverlaySchema()
    try:
        result = schema.load(data)
        # Additional validation for position and size
        if 'position' in result:
            if not all(key in result['position'] for key in ['x', 'y']):
                raise ValidationError("Position must contain 'x' and 'y' coordinates")
        if 'size' in result:
            if not all(key in result['size'] for key in ['width', 'height']):
                raise ValidationError("Size must contain 'width' and 'height'")
        return result, None
    except ValidationError as e:
        return None, e.messages