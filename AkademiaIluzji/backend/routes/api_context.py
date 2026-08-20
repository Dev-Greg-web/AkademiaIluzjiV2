from flask import Blueprint, jsonify, request, Response
from database import get_db_connection
from services.context_generator import generate_gpt_context

context_bp = Blueprint('context', __name__)

@context_bp.route('/api/context', methods=['GET', 'POST'])
def get_context():
    context_type = request.args.get('type') or 'quick'
    custom_data = request.get_json(silent=True)

    if request.method == 'POST' and request.json and 'type' in request.json:
        context_type = request.json['type']
        custom_data = request.json.get('custom_data')

    valid_types = ['quick', 'full', 'training', 'trick', 'session_review', 'technique_review', 'performance_review']
    if context_type not in valid_types:
        context_type = 'quick'

    conn = get_db_connection()
    cursor = conn.cursor()

    text = generate_gpt_context(cursor, context_type, custom_data)
    conn.close()

    type_titles = {
        'quick': 'Szybki kontekst (Profil & Cele)',
        'full': 'Kompletny raport Card Magic Coacha',
        'training': 'Kontekst treningowy & Spaced Repetition',
        'trick': 'Kontekst doboru nowej sztuczki',
        'session_review': 'Recenzja sesji i analiza biomechaniki',
        'technique_review': 'Głęboka analiza pojedynczego chwytu',
        'performance_review': 'Recenzja pokazu scenicznego & Patter'
    }

    return jsonify({
        "type": context_type,
        "title": type_titles.get(context_type, 'Kontekst ChatGPT'),
        "context_text": text,
        "char_count": len(text),
        "lines_count": len(text.splitlines())
    })


@context_bp.route('/api/context/export-txt', methods=['POST'])
def export_context_txt():
    data = request.get_json() or {}
    context_type = data.get('type', 'quick')
    custom_data = data.get('custom_data')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    text = generate_gpt_context(cursor, context_type, custom_data)
    conn.close()

    filename = f"card_magic_coach_kontekst_{context_type}.txt"
    return Response(
        text,
        mimetype="text/plain; charset=utf-8",
        headers={"Content-Disposition": f"attachment;filename={filename}"}
    )
