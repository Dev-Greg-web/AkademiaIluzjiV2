import json
from datetime import datetime

def get_context_data(cursor):
    # Profile
    cursor.execute("SELECT * FROM user_profile WHERE id = 1")
    profile_row = cursor.fetchone()
    profile = dict(profile_row) if profile_row else {}

    # Techniques
    cursor.execute("""
        SELECT t.id, t.name, t.track, t.category, t.difficulty, t.mastery_percentage, t.status, 
               t.training_minutes, t.sessions_count, t.total_reps_count, t.last_trained_at, t.notes, t.avg_score
        FROM techniques t
        ORDER BY t.mastery_percentage DESC, t.name ASC
    """)
    techniques = [dict(r) for r in cursor.fetchall()]

    mastered = [t for t in techniques if t["status"] in ["Mastered", "Mastered+"] or t["mastery_percentage"] >= 80]
    practicing = [t for t in techniques if t["status"] == "Practicing" or (20 <= t["mastery_percentage"] < 80)]
    started = [t for t in techniques if t["status"] == "Started" or (0 < t["mastery_percentage"] < 20)]

    # Active problems
    cursor.execute("""
        SELECT p.problem_text, p.priority, p.problem_tag, t.name as technique_name, t.mastery_percentage
        FROM technique_problems p
        JOIN techniques t ON p.technique_id = t.id
        WHERE p.is_resolved = 0
        ORDER BY CASE p.priority WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 ELSE 3 END, t.mastery_percentage DESC
    """)
    problems = [dict(r) for r in cursor.fetchall()]

    # Last 5 training sessions
    cursor.execute("""
        SELECT s.* FROM training_sessions s
        ORDER BY s.date DESC
        LIMIT 5
    """)
    recent_sessions = [dict(r) for r in cursor.fetchall()]

    # Routines
    cursor.execute("SELECT name, description, effect, difficulty, techniques_json FROM routines")
    routines = []
    for r in cursor.fetchall():
        r_dict = dict(r)
        try:
            r_dict["techniques"] = json.loads(r_dict["techniques_json"])
        except Exception:
            r_dict["techniques"] = []
        routines.append(r_dict)

    return {
        "profile": profile,
        "mastered": mastered,
        "practicing": practicing,
        "started": started,
        "problems": problems,
        "recent_sessions": recent_sessions,
        "routines": routines
    }


def generate_gpt_context(cursor, context_type: str = "quick", custom_data: dict = None) -> str:
    data = get_context_data(cursor)
    profile = data["profile"]
    mastered = data["mastered"]
    practicing = data["practicing"]
    problems = data["problems"]
    recent = data["recent_sessions"]
    routines = data["routines"]
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M")

    if context_type == "quick":
        lines = [
            "--------------------------------------------------",
            "CARD MAGIC COACH — SZYBKI KONTEKST UŻYTKOWNIKA",
            f"Data: {now_str}",
            "--------------------------------------------------",
            "",
            f"Poziom ogólny: {profile.get('rank_tier', 'Beginner')} (Level {profile.get('level', 1)} • {profile.get('xp', 0)} XP)",
            f"Streak: {profile.get('streak', 0)} dni z rzędu | Łączny czas: {profile.get('total_training_minutes', 0)} min",
            f"Główny cel: {profile.get('primary_goal', 'Doskonalenie techniki')}",
            "",
            "OPANOWANE TECHNIKI (Mastered 80%+):"
        ]
        if mastered:
            for t in mastered[:6]:
                lines.append(f"- {t['name']} ({t['category']}) — {t['mastery_percentage']}%")
        else:
            lines.append("- (Budowanie solidnych podstaw)")

        lines.extend([
            "",
            "W TRAKCIE INTENSYWNEGO TRENINGU:"
        ])
        if practicing:
            for t in practicing[:6]:
                lines.append(f"- {t['name']} ({t['difficulty']}) — {t['mastery_percentage']}%")
        else:
            lines.append("- (Brak)")

        if problems:
            lines.extend([
                "",
                "NAJWIĘKSZE PROBLEMY / TRUDNOŚCI:"
            ])
            for p in problems[:4]:
                lines.append(f"• [{p['technique_name']} | {p['problem_tag']} | Priorytet: {p['priority']}]: {p['problem_text']}")

        lines.extend([
            "",
            "--------------------------------------------------",
            "INSTRUKCJA DLA CHATGPT:",
            "Jesteś moim prywatnym Card Magic Coachem.",
            "1. Dostosuj odpowiedź do mojego poziomu.",
            "2. Uwzględnij powyższe problemy biomechaniczne i zasugeruj 2 konkretne mikro-ćwiczenia.",
            "--------------------------------------------------"
        ])
        return "\n".join(lines)

    elif context_type == "full":
        lines = [
            "==================================================",
            "🃏 CARD MAGIC COACH — KOMPLETNY RAPORT I PROFIL",
            f"Data: {now_str}",
            "==================================================",
            "",
            "1. PROFIL:",
            f"- Użytkownik: {profile.get('name', 'Iluzjonista')}",
            f"- Ranga: {profile.get('rank_tier', 'Beginner')} | Poziom: {profile.get('level', 1)}/20 ({profile.get('xp', 0)} XP)",
            f"- Magic Level: {profile.get('magic_level', 1)} | Cardistry Level: {profile.get('cardistry_level', 1)} | Performance Level: {profile.get('performance_level', 1)}",
            f"- Dni z rzędu: {profile.get('streak', 0)} dni (Rekord: {profile.get('best_streak', 0)} dni)",
            f"- Łączny czas: {profile.get('total_training_minutes', 0)} min ({profile.get('total_sessions_count', 0)} sesji)",
            f"- Główny cel: {profile.get('primary_goal')}",
            "",
            "2. OPANOWANY ARSENAŁ (80-100%):"
        ]
        if mastered:
            for t in mastered:
                lines.append(f"  ✓ {t['name']} [{t['category']}] | Mastery: {t['mastery_percentage']}% | Powtórzenia: {t['total_reps_count']}")
        else:
            lines.append("  (Brak w pełni opanowanych chwytów)")

        lines.append(f"\n3. W TRAKCIE NAUKI ({len(practicing)}):")
        if practicing:
            for t in practicing:
                lines.append(f"  ~ {t['name']} ({t['difficulty']}) | Mastery: {t['mastery_percentage']}% | Czas: {t['training_minutes']} min | Śr. ocena: {t['avg_score']}/10")

        lines.extend([
            "",
            "4. REJESTR BŁĘDÓW I WYZWAŃ:"
        ])
        if problems:
            for p in problems:
                lines.append(f"  ⚠️ [{p['priority']}] {p['technique_name']} ({p['problem_tag']}): „{p['problem_text']}”")
        else:
            lines.append("  ✓ Brak zarejestrowanych problemów krytycznych.")

        lines.extend([
            "",
            "5. REPERTUAR RUTYN:"
        ])
        if routines:
            for r in routines:
                lines.append(f"  🎭 {r['name']} ({r['difficulty']}) — Efekt: {r['effect']} | Chwyty: {', '.join(r['techniques'])}")

        lines.extend([
            "",
            "--------------------------------------------------",
            "INSTRUKCJA DLA CHATGPT:",
            "Jesteś moim mistrzem i mentorem iluzji karcianej.",
            "1. Odpowiadaj wyłącznie na podstawie mojego rzeczywistego poziomu i opanowanych technik.",
            "2. Nie sugeruj trików wymagających chwytów spoza mojej listy.",
            "3. Zwracaj szczególną uwagę na zniwelowanie napięcia dłoni, kąty widzenia oraz misdirection.",
            "--------------------------------------------------"
        ])
        return "\n".join(lines)

    elif context_type == "session_review":
        s = custom_data or (recent[0] if recent else {})
        dur = round((s.get("duration_seconds", 0)) / 60, 1)
        lines = [
            "--------------------------------------------------",
            "CARD MAGIC COACH — RECENZJA SESJI TRENINGOWEJ",
            f"Data sesji: {s.get('date', now_str)[:16]} | Czas: {dur} min",
            "--------------------------------------------------",
            "",
            f"Ocena ogólna: {s.get('rating', 7)}/10",
            f"- Kontrola i precyzja (Control): {s.get('score_control', 7)}/10",
            f"- Naturalność ruchu (Naturalness): {s.get('score_naturalness', 7)}/10",
            f"- Timing i rytm (Timing): {s.get('score_timing', 7)}/10",
            f"- Pewność siebie (Confidence): {s.get('score_confidence', 7)}/10",
            f"- Prezentacja (Presentation): {s.get('score_presentation', 7)}/10",
            f"Liczba powtórzeń w sesji: {s.get('reps_count', 0)}",
            "",
            f"Co poszło dobrze: {s.get('what_went_well') or 'Poprawny rytm'}",
            f"Najtrudniejszy element: {s.get('hardest_part') or s.get('what_was_problem') or 'Napięcie dłoni'}",
            f"Wnioski do poprawy: {s.get('what_to_improve') or 'Spokojniejsze tempo'}",
            "",
            "PYTANIA DLA CHATGPT:",
            "1. Co powinienem skorygować w pierwszej kolejności, biorąc pod uwagę te oceny?",
            "2. Zaproponuj 10-minutowy zestaw mikro-drills korygujących mój najsłabszy wymiar.",
            "3. Jak sprawić, by ruch wyglądał w 100% naturalnie bez zdradzania napięcia?",
            "--------------------------------------------------"
        ]
        return "\n".join(lines)

    elif context_type == "technique_review":
        t = custom_data or (practicing[0] if practicing else (mastered[0] if mastered else {}))
        lines = [
            "--------------------------------------------------",
            f"CARD MAGIC COACH — ANALIZA CHWYTU: {t.get('name', 'Technika')}",
            "--------------------------------------------------",
            f"Kategoria: {t.get('category')} | Trudność: {t.get('difficulty')}",
            f"Poziom opanowania (Mastery): {t.get('mastery_percentage', 0)}% | Status: {t.get('status')}",
            f"Przećwiczone powtórzenia: {t.get('total_reps_count', 0)} | Czas: {t.get('training_minutes', 0)} min",
            f"Średnia ocena: {t.get('avg_score', 0)}/10",
            f"Własne notatki: {t.get('notes') or 'Brak'}",
            "",
            "PYTANIA DLA CHATGPT:",
            f"1. Jakie są najczęstsze błędy początkujących i zaawansowanych przy technice {t.get('name')}?",
            "2. W jaki sposób zrelaksować dłoń i uniknąć sztywności palców?",
            "3. W jakich 2 klasycznych rutynach mogę najlepiej wykorzystać ten chwyt?",
            "--------------------------------------------------"
        ]
        return "\n".join(lines)

    elif context_type == "training":
        lines = [
            "--------------------------------------------------",
            "CARD MAGIC COACH — KONTEKST TRENINGOWY & SPACED REPETITION",
            f"Data: {now_str}",
            "--------------------------------------------------",
            "",
            f"Poziom: {profile.get('rank_tier', 'Beginner')} | Dzienny cel: {profile.get('preferred_daily_minutes', 20)} min",
            f"Streak: {profile.get('streak', 0)} dni | Łącznie sesji: {profile.get('total_sessions_count', 0)}",
            "",
            "TECHNIKI WYMAGAJĄCE POWTÓRKI (Spaced Repetition):"
        ]
        if practicing:
            for t in practicing[:5]:
                lines.append(f"⚠️ {t['name']} ({t['difficulty']}) — Mastery: {t['mastery_percentage']}% | Ostatni trening: {t.get('last_trained_at', 'Brak')}")
        else:
            lines.append("✓ Wszystkie podstawowe techniki są w dobrej kondycji pamięciowej.")

        if problems:
            lines.extend([
                "",
                "ZAREJESTROWANE PROBLEMY I BLOKADY:"
            ])
            for p in problems[:4]:
                lines.append(f"• [{p['technique_name']} | {p['problem_tag']}]: {p['problem_text']}")

        lines.extend([
            "",
            "ZADANIE DLA CHATGPT:",
            "Przygotuj optymalny plan 20-minutowego treningu dzielący czas na: Rozgrzewkę, Izolację błędu, Automatyzację i Spokojne wyciszenie.",
            "Podaj dokładne wskazówki biomechaniczne (nacisk kciuka, kąt trzymania talii, oddech).",
            "--------------------------------------------------"
        ])
        return "\n".join(lines)

    elif context_type == "trick":
        lines = [
            "--------------------------------------------------",
            "CARD MAGIC COACH — KONTEKST DO NAUKI SZTUCZKI",
            f"Data: {now_str}",
            "--------------------------------------------------",
            f"Poziom iluzjonisty: {profile.get('rank_tier', 'Beginner')} (Level {profile.get('level', 1)})",
            "",
            "CHWYTY W PEŁNI OPANOWANE (Mogę swobodnie łączyć w pokazy):"
        ]
        if mastered:
            for t in mastered:
                lines.append(f"✓ {t['name']} ({t['category']})")
        else:
            lines.append("✓ Mechanics Grip, Overhand Shuffle (Podstawy)")

        lines.extend([
            "",
            "CHWYTY W TRAKCIE NAUKI:"
        ])
        if practicing:
            for t in practicing:
                lines.append(f"~ {t['name']} ({t['mastery_percentage']}%)")

        lines.extend([
            "",
            "ZADANIE DLA CHATGPT:",
            "Zaproponuj mi 2 profesjonalne rutyny karciane, które bazują WYŁĄCZNIE na moich opanowanych chwytach (lub z max 1 nowym, prostym elementem).",
            "Dla każdej rutyny opisz: Efekt dla widza, Metodę krok po kroku, Patter (tekst narracji) oraz moment Misdirection.",
            "--------------------------------------------------"
        ])
        return "\n".join(lines)

    elif context_type == "performance_review":
        lines = [
            "--------------------------------------------------",
            "CARD MAGIC COACH — RECENZJA WYSTĘPU & SCENARIUSZ",
            f"Data: {now_str}",
            "--------------------------------------------------",
            "",
            f"Iluzjonista: {profile.get('name', 'Iluzjonista')} | Poziom: {profile.get('rank_tier', 'Beginner')}",
            "",
            "CHECKLISTA WYSTĘPOWA:",
            "- Patter (spójność opowieści)",
            "- Timing i off-beat (ukrywanie sleightów w naturalnych pauzach)",
            "- Kontakt wzrokowy (kontrola uwagi widza)",
            "- Mowa ciała i opanowanie stresu",
            "",
            "ZADANIE DLA CHATGPT:",
            "Pomóż mi udoskonalić scenariusz pokazu karcianego. Zaproponuj naturalne linie dialogowe (patter), które angażują widza i nie brzmią sztucznie ani banalnie.",
            "--------------------------------------------------"
        ]
        return "\n".join(lines)

    return "--------------------------------------------------\nCARD MAGIC COACH — KONTEKST\n--------------------------------------------------"
