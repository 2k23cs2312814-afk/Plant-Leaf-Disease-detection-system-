import os
import sys

# Get absolute path to project root
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

import json
import base64
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from model_helper import predict_disease, DISEASE_KNOWLEDGE_BASE

# Initialize Flask with explicit absolute paths for templates & static assets (Required for Vercel serverless)
app = Flask(
    __name__,
    template_folder=os.path.join(BASE_DIR, 'templates'),
    static_folder=os.path.join(BASE_DIR, 'static'),
    static_url_path='/static'
)
CORS(app)

# Ensure upload directory exists in writeable location
UPLOAD_FOLDER = os.path.join('/tmp', 'uploads') if os.name != 'nt' else os.path.join(BASE_DIR, 'static', 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


@app.route('/')
def index():
    """Renders main application home dashboard."""
    return render_template('index.html')


@app.route('/api/diseases', methods=['GET'])
def get_diseases():
    """Returns disease knowledge base."""
    return jsonify({
        'status': 'success',
        'count': len(DISEASE_KNOWLEDGE_BASE),
        'diseases': DISEASE_KNOWLEDGE_BASE
    })


@app.route('/api/predict', methods=['POST'])
def predict():
    """
    Predicts plant leaf disease from uploaded image file or base64 data URL.
    """
    try:
        image_bytes = None

        # Check multipart form file
        if 'image' in request.files:
            file = request.files['image']
            if file.filename != '':
                image_bytes = file.read()

        # Check JSON payload for base64 image data
        if not image_bytes and request.is_json:
            data = request.get_json()
            if 'image_data' in data:
                base64_str = data['image_data']
                if ',' in base64_str:
                    base64_str = base64_str.split(',')[1]
                image_bytes = base64.b64decode(base64_str)

        if not image_bytes:
            return jsonify({
                'status': 'error',
                'message': 'No image file or image_data provided in request.'
            }), 400

        result = predict_disease(image_bytes)
        return jsonify(result)

    except Exception as e:
        print(f"Prediction API Error: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500


@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy', 'service': 'Plant Leaf Disease Detection API'})


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"🌿 Starting Plant Leaf Disease Detection Server on http://localhost:{port}")
    app.run(host='0.0.0.0', port=port, debug=True)
