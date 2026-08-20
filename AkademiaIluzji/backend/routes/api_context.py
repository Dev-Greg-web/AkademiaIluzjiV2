from flask import Blueprint, jsonify, request, Response
from database import get_db_connection
from services.context_generator import generate_gpt_context

context_bp = Blueprint('context', __name__)

@context_bp.route('/api/context', methods=['GET'])
def get_context():
    context_type = request.args.get('type', 'quick').lower()
    valid_types = ['quick', 'full', 'training', 'trick']
    if context_type not in valid_types:
        context_type = 'quick'

    conn = get_db_connection()
    cursor = conn.cursor()

    text = generate_gpt_context(cursor, context_type)
    conn.close()

    type_titles = {
        'quick': 'Szybki kontekst (Podsumowanie)',
        'full': 'Pełny raport i kontekst iluzjonisty',
        'training': 'Kontekst treningowy i analiza błędów',
        'trick': 'Kontekst doboru nowej sztuczki'
    }

    return jsonify({
        "type": context_type,
        "title": type_titles.get(context_type, 'Kontekst GPT'),
        "context_text": text,
        "char_count": len(text),
        "lines_count": len(text.splitlines())
    })


@context_bp.route('/api/context/export-txt', methods=['POST'])
def export_context_txt():
    data = request.get_json() or {}
    context_type = data.get('type', 'quick')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    text = generate_gpt_context(cursor, context_type)
    conn.close()

    filename = f"akademia_iluzji_kontekst_{context_type}.txt"
    return Response(
        text,
        mimetype="text/plain; charset=utf-8",
        headers={"Content-Disposition": f"attachment;filename={filename}"}
    )
