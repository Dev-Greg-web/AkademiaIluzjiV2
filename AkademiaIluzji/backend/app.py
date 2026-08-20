import os
import mimetypes
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
from routes.api_quizzes import quizzes_bp
from routes.api_achievements import achievements_bp
from routes.api_goals import goals_bp
from routes.api_performance import performance_bp
from routes.api_videos import videos_bp

BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIST_DIR = (BASE_DIR.parent / "frontend" / "dist").resolve()

# Ensure common web MIME types are registered properly
mimetypes.add_type('application/javascript', '.js')
mimetypes.add_type('text/css', '.css')
mimetypes.add_type('image/svg+xml', '.svg')
mimetypes.add_type('application/json', '.json')

def create_app():
    app = Flask(__name__, static_folder=None)
    CORS(app)

    # Initialize SQLite database and seed initial Card Magic Coach content
    init_db()
    seed_database()

    # Register all API Blueprints
    app.register_blueprint(profile_bp)
    app.register_blueprint(techniques_bp)
    app.register_blueprint(training_bp)
    app.register_blueprint(routines_bp)
    app.register_blueprint(progress_bp)
    app.register_blueprint(context_bp)
    app.register_blueprint(notes_bp)
    app.register_blueprint(settings_bp)
    app.register_blueprint(quizzes_bp)
    app.register_blueprint(achievements_bp)
    app.register_blueprint(goals_bp)
    app.register_blueprint(performance_bp)
    app.register_blueprint(videos_bp)

    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            "status": "online",
            "app": "CARD MAGIC COACH (Akademia Iluzji)",
            "version": "2.0.0"
        })

    # Serve React Frontend SPA
    @app.route('/', methods=['GET'])
    def serve_index():
        if (FRONTEND_DIST_DIR / "index.html").is_file():
            return send_from_directory(FRONTEND_DIST_DIR, "index.html")
        return jsonify({
            "app": "CARD MAGIC COACH Backend",
            "message": "Frontend build not found. Run 'npm run build' in the frontend directory."
        })

    @app.route('/<path:path>', methods=['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])
    def serve_static_or_spa(path):
        if path.startswith('api/') or path == 'api':
            return jsonify({"error": "Endpoint not found"}), 404

        if request.method != 'GET':
            return jsonify({"error": "Method not allowed"}), 405

        target_file = (FRONTEND_DIST_DIR / path).resolve()
        if target_file.is_file() and str(target_file).startswith(str(FRONTEND_DIST_DIR)):
            return send_from_directory(FRONTEND_DIST_DIR, path)

        if (FRONTEND_DIST_DIR / "index.html").is_file():
            return send_from_directory(FRONTEND_DIST_DIR, "index.html")

        return jsonify({"error": "Resource not found"}), 404

    @app.errorhandler(404)
    def handle_404(e):
        if request.path.startswith('/api'):
            return jsonify({"error": "Endpoint not found"}), 404
        if request.method == 'GET' and (FRONTEND_DIST_DIR / "index.html").is_file():
            return send_from_directory(FRONTEND_DIST_DIR, "index.html")
        return jsonify({"error": "Page not found"}), 404

    @app.errorhandler(405)
    def handle_405(e):
        return jsonify({"error": "Method not allowed"}), 405

    return app

app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print("=" * 50)
    print("CARD MAGIC COACH — Serwer Backendowy")
    print(f"API działa na: http://127.0.0.1:{port}")
    print("=" * 50)
    app.run(host='0.0.0.0', port=port, debug=False)
