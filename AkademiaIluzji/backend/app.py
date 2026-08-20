import os
from flask import Flask, jsonify, send_from_directory
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

def create_app():
    app = Flask(__name__)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Auto-initialize and seed DB if first run
    init_db()
    seed_database()

    # Register Blueprints
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

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Endpoint not found"}), 404

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
