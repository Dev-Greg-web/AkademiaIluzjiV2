import os
from pathlib import Path
from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS
from database import init_db
from seed import seed_database

from routes.api_profile import profile_bp
from routes.api_techniques import techniques_bp
from routes.api_training import training_bp
from routes.api_routines import routines_bp
from routes.api_progress import progress_bp
from routes.api_context import context_bp
from routes.api_notes import notes_bp
from routes.api_settings import settings_bp

# Compute absolute path to frontend/dist based on app.py location
BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIST_DIR = (BASE_DIR.parent / "frontend" / "dist").resolve()

def create_app():
    app = Flask(__name__, static_folder=None)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Auto-initialize and seed DB if first run
    init_db()
    seed_database()

    # Register API Blueprints
    app.register_blueprint(profile_bp)
    app.register_blueprint(techniques_bp)
    app.register_blueprint(training_bp)
    app.register_blueprint(routines_bp)
    app.register_blueprint(progress_bp)
    app.register_blueprint(context_bp)
    app.register_blueprint(notes_bp)
    app.register_blueprint(settings_bp)

    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            "status": "online",
            "app": "Akademia Iluzji Backend",
            "version": "1.0.0"
        })

    # Serve React SPA root
    @app.route('/', methods=['GET'])
    def serve_index():
        if (FRONTEND_DIST_DIR / "index.html").exists():
            return send_from_directory(FRONTEND_DIST_DIR, "index.html")
        return jsonify({
            "message": "Akademia Iluzji Backend dziala. Zbuduj frontend (npm run build w folderze frontend), aby serwowac interfejs."
        })

    # Serve static assets and SPA fallback for frontend client-side routes
    @app.route('/<path:path>', methods=['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])
    def serve_static_or_spa(path):
        # Prevent intercepting unknown API routes -> return strict 404 JSON
        if path.startswith('api/') or path == 'api':
            return jsonify({"error": "Endpoint not found"}), 404

        # Only GET is allowed for static files & SPA
        if request.method != 'GET':
            return jsonify({"error": "Method not allowed"}), 405

        # Check if the requested file exists in dist (e.g. assets/..., favicon.svg, etc.)
        target_file = (FRONTEND_DIST_DIR / path).resolve()
        if target_file.is_file() and str(target_file).startswith(str(FRONTEND_DIST_DIR)):
            return send_from_directory(FRONTEND_DIST_DIR, path)

        # SPA fallback for all frontend GET routes (e.g. /techniques, /training, /routines)
        if (FRONTEND_DIST_DIR / "index.html").exists():
            return send_from_directory(FRONTEND_DIST_DIR, "index.html")

        return jsonify({"error": "Endpoint not found"}), 404

    @app.errorhandler(404)
    def not_found(e):
        # API requests must strictly return JSON 404
        if request.path.startswith('/api'):
            return jsonify({"error": "Endpoint not found"}), 404

        # SPA fallback for frontend GET requests
        if request.method == 'GET' and (FRONTEND_DIST_DIR / "index.html").exists():
            return send_from_directory(FRONTEND_DIST_DIR, "index.html")

        return jsonify({"error": "Endpoint not found"}), 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        if request.path.startswith('/api'):
            return jsonify({"error": "Endpoint not found"}), 404
        return jsonify({"error": "Method not allowed"}), 405

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({"error": "Internal server error", "details": str(e)}), 500

    return app

app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print("==================================================")
    print("Akademia Iluzji - Serwer Backendowy")
    print(f"API dziala na: http://127.0.0.1:{port}")
    print("==================================================")
    app.run(host='0.0.0.0', port=port, debug=False)
