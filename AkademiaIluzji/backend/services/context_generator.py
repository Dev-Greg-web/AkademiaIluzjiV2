import json
from datetime import datetime

def get_context_data(cursor):
    # Profile
    cursor.execute("SELECT * FROM user_profile WHERE id = 1")
    profile_row = cursor.fetchone()
    profile = dict(profile_row) if profile_row else {
        "name": "Iluzjonista", "level": 1, "xp": 0, "streak": 0,
        "total_training_minutes": 0, "total_sessions_count": 0,
        "primary_goal": "Opanuj Double Lift na poziomie 8/10."
    }

    # Techniques
    cursor.execute("""
        SELECT t.id, t.name, t.category, t.difficulty, t.user_level, t.status, 
               t.training_minutes, t.sessions_count, t.last_trained_at, t.notes
        FROM techniques t
        ORDER BY t.user_level DESC, t.name ASC
    """)
    techniques = [dict(r) for r in cursor.fetchall()]

    mastered = [t for t in techniques if t["user_level"] >= 8]
    in_progress = [t for t in techniques if 1 <= t["user_level"] <= 7]
    not_started = [t for t in techniques if t["user_level"] == 0]

    # Active problems
    cursor.execute("""
        SELECT p.problem_text, t.name as technique_name, t.user_level
        FROM technique_problems p
        JOIN techniques t ON p.technique_id = t.id
        WHERE p.is_resolved = 0
        ORDER BY t.user_level DESC
    """)
    problems = [dict(r) for r in cursor.fetchall()]

    # Last 5 training sessions
    cursor.execute("""
        SELECT s.date, s.duration_seconds, s.reps_count, s.rating, 
               s.what_went_well, s.what_was_problem, s.what_to_improve, s.notes
        FROM training_sessions s
        ORDER BY s.date DESC
        LIMIT 5
    """)
    recent_sessions = [dict(r) for r in cursor.fetchall()]

    # Routines
    cursor.execute("SELECT name, description, effect, difficulty, techniques_json FROM routines")
    routines_raw = cursor.fetchall()
    routines = []
    for r in routines_raw:
        r_dict = dict(r)
        try:
            r_dict["techniques"] = json.loads(r_dict["techniques_json"])
        except Exception:
            r_dict["techniques"] = []
        routines.append(r_dict)

    return {
        "profile": profile,
        "mastered": mastered,
        "in_progress": in_progress,
        "not_started": not_started,
        "problems": problems,
        "recent_sessions": recent_sessions,
        "routines": routines
    }


def generate_gpt_context(cursor, context_type: str = "quick") -> str:
    data = get_context_data(cursor)
    profile = data["profile"]
    mastered = data["mastered"]
    in_progress = data["in_progress"]
    problems = data["problems"]
    recent = data["recent_sessions"]
    routines = data["routines"]

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M")

    if context_type == "quick":
        # Szybki kontekst — zwięzły, esencjonalny
        lines = [
            "==================================================",
            "🃏 AKADEMIA ILUZJI — SZYBKI KONTEKST UŻYTKOWNIKA",
            f"Data wygenerowania: {now_str}",
            "==================================================",
            "",
            "👤 PROFIL:",
            f"- Poziom ogólny: Poziom {profile.get('level', 1)}/10 ({profile.get('xp', 0)} XP, Streak: {profile.get('streak', 0)} dni)",
            f"- Główny cel: {profile.get('primary_goal', 'Rozwój w iluzji karcianej')}",
            f"- Łączny czas treningu: {profile.get('total_training_minutes', 0)} minut ({profile.get('total_sessions_count', 0)} sesji)",
            "",
            "🟢 OPANOWANE TECHNIKI (8-10/10):"
        ]
        if mastered:
            for t in mastered:
                lines.append(f"  • {t['name']} ({t['category']}) — {t['user_level']}/10")
        else:
            lines.append("  (Brak jeszcze w pełni opanowanych technik)")

        lines.extend([
            "",
            "🟡 W TRAKCIE NAUKI (1-7/10):"
        ])
        if in_progress:
            for t in in_progress:
                lines.append(f"  • {t['name']} ({t['category']}, {t['difficulty']}) — {t['user_level']}/10")
        else:
            lines.append("  (Brak technik w toku)")

        if problems:
            lines.extend([
                "",
                "⚠️ GŁÓWNE PROBLEMY I TRUDNOŚCI:"
            ])
            for p in problems[:5]:
                lines.append(f"  • [{p['technique_name']}]: {p['problem_text']}")

        lines.extend([
            "",
            "--------------------------------------------------",
            "🤖 INSTRUKCJA DLA CHATGPT:",
            "Traktuj powyższe dane jako mój aktualny, zwięzły profil iluzjonisty.",
            "1. Dostosuj odpowiedzi ściśle do mojego poziomu zaawansowania.",
            "2. Uwzględnij techniki, które znam i te, z którymi mam trudności.",
            "3. Udzielaj konkretnych, zwięzłych rad technicznych i ćwiczeń.",
            "--------------------------------------------------"
        ])
        return "\n".join(lines)

    elif context_type == "full":
        # Pełny kontekst — wyczerpujący raport
        lines = [
            "==================================================",
            "🃏 AKADEMIA ILUZJI — PEŁNY RAPORT I KONTEKST ILUZJONISTY",
            f"Data wygenerowania: {now_str}",
            "==================================================",
            "",
            "1. PROFIL I STATYSTYKI:",
            f"- Użytkownik: {profile.get('name', 'Iluzjonista')}",
            f"- Poziom postaci: Level {profile.get('level', 1)}/10",
            f"- Doświadczenie: {profile.get('xp', 0)} XP",
            f"- Dni treningu z rzędu (Streak): {profile.get('streak', 0)} dni",
            f"- Łączny czas treningu: {profile.get('total_training_minutes', 0)} min ({profile.get('total_sessions_count', 0)} ukończonych sesji)",
            f"- Aktualny główny cel: {profile.get('primary_goal', 'Brak ustalonego celu')}",
            "",
            "2. STAN OPANOWANIA ARSENAŁU CHWYTÓW:",
            f"A. Opanowane (8-10/10) [{len(mastered)}]:"
        ]
        if mastered:
            for t in mastered:
                lines.append(f"   • {t['name']} | Kategoria: {t['category']} | Poziom: {t['user_level']}/10 | Łącznie: {t['training_minutes']} min")
        else:
            lines.append("   (Brak)")

        lines.append(f"\nB. W trakcie intensywnego treningu (1-7/10) [{len(in_progress)}]:")
        if in_progress:
            for t in in_progress:
                lines.append(f"   • {t['name']} ({t['difficulty']}) | Kategoria: {t['category']} | Poziom: {t['user_level']}/10 | Sesje: {t['sessions_count']} | Czas: {t['training_minutes']} min")
        else:
            lines.append("   (Brak)")

        lines.append(f"\nC. Nie rozpoczęte ({len(data['not_started'])}):")
        unstarted_names = [t['name'] for t in data['not_started'][:10]]
        if unstarted_names:
            lines.append("   • " + ", ".join(unstarted_names) + ("..." if len(data['not_started']) > 10 else ""))

        lines.extend([
            "",
            "3. AKTYWNE PROBLEMY TECHNICZNE:"
        ])
        if problems:
            for p in problems:
                lines.append(f"   • {p['technique_name']} (Poziom {p['user_level']}/10): „{p['problem_text']}”")
        else:
            lines.append("   (Brak zanotowanych krytycznych problemów)")

        lines.extend([
            "",
            "4. MOJE RUTYNY I EFEKTY:"
        ])
        if routines:
            for r in routines:
                tech_list = ", ".join(r['techniques']) if r['techniques'] else "Brak przypisanych"
                lines.append(f"   • {r['name']} ({r['difficulty']}) — Efekt: {r['effect']} | Użyte techniki: [{tech_list}]")
        else:
            lines.append("   (Brak zdefiniowanych rutyn)")

        lines.extend([
            "",
            "5. OSTATNIE SESJE TRENINGOWE:"
        ])
        if recent:
            for s in recent:
                dur = round(s['duration_seconds'] / 60, 1)
                lines.append(f"   • [{s['date'][:10]}] Czas: {dur} min, Powtórzenia: {s['reps_count']}, Ocena: {s['rating']}/10")
                if s.get('what_went_well'):
                    lines.append(f"     + Co poszło dobrze: {s['what_went_well']}")
                if s.get('what_was_problem'):
                    lines.append(f"     - Problem: {s['what_was_problem']}")
                if s.get('what_to_improve'):
                    lines.append(f"     -> Do poprawy: {s['what_to_improve']}")
        else:
            lines.append("   (Brak historii sesji)")

        lines.extend([
            "",
            "--------------------------------------------------",
            "🤖 INSTRUKCJA DLA CHATGPT:",
            "Jesteś moim mentorem i ekspertem iluzji karcianej (sleight of hand / card magic).",
            "1. Powyżej znajduje się kompletny rejestr moich rzeczywistych umiejętności z aplikacji Akademia Iluzji.",
            "2. NIE sugeruj mi sztuczek wymagających zaawansowanych technik, których nie ma na liście opanowanych lub w trakcie.",
            "3. Pomióż mi w rozwiązywaniu konkretnych problemów biomechanicznych wymienionych w punkcie 3.",
            "4. Zwracaj uwagę na timing, misdirection, kąty widzenia (angles) oraz płynność narracji.",
            "--------------------------------------------------"
        ])
        return "\n".join(lines)

    elif context_type == "training":
        # Kontekst treningowy — analiza trudności, układanie planu
        lines = [
            "==================================================",
            "🏋️ AKADEMIA ILUZJI — KONTEKST TRENINGOWY",
            f"Data: {now_str}",
            "==================================================",
            "",
            f"PROFIL: Poziom {profile.get('level', 1)} | Doświadczenie: {profile.get('total_training_minutes', 0)} min treningu",
            f"CEL TRENINGOWY: {profile.get('primary_goal')}",
            "",
            "AKTUALNIE TRENOWANE TECHNIKI I PROBLEMY:"
        ]
        if in_progress:
            for t in in_progress:
                lines.append(f"- {t['name']} (Poziom {t['user_level']}/10, {t['difficulty']}) | Przećwiczone: {t['training_minutes']} min")
        else:
            lines.append("- Brak aktywnych technik w trakcie nauki.")

        lines.extend([
            "",
            "ZAREJESTROWANE WYZWANIA I BŁĘDY DO WYELIMINOWANIA:"
        ])
        if problems:
            for p in problems:
                lines.append(f"• {p['technique_name']}: {p['problem_text']}")
        else:
            lines.append("• Brak wpisanych problemów.")

        lines.extend([
            "",
            "OSTATNIE REFLEKSJE Z SESJI:"
        ])
        if recent:
            for s in recent[:3]:
                lines.append(f"• Sesja ({s['date'][:10]}): Ocena {s['rating']}/10 | Problem: {s.get('what_was_problem') or 'brak'} | Wniosek: {s.get('what_to_improve') or 'brak'}")
        else:
            lines.append("• Brak ostatnich sesji.")

        lines.extend([
            "",
            "--------------------------------------------------",
            "🤖 INSTRUKCJA DLA CHATGPT:",
            "Chcę zoptymalizować swój dzisiejszy trening iluzji.",
            "1. Przeanalizuj moje błędy i zaproponuj 3 mikro-ćwiczenia (drills) korygujące chwyt i pamięć mięśniową.",
            "2. Wskaż, na jakie subtelności nacisku palców i ułożenia dłoni powinienem zwrócić szczególną uwagę.",
            "3. Zaproponuj 30-minutowy rozkład ćwiczeń z dokładnym czasem i celem każdego powtórzenia.",
            "--------------------------------------------------"
        ])
        return "\n".join(lines)

    elif context_type == "trick":
        # Kontekst do nauki nowej sztuczki
        lines = [
            "==================================================",
            "🎭 AKADEMIA ILUZJI — KONTEKST DO NAUKI SZTUCZKI",
            f"Data: {now_str}",
            "==================================================",
            "",
            f"POZIOM ILUZJONISTY: {profile.get('level', 1)}/10",
            "",
            "CHWYTY, KTÓRYMI JUŻ SWOBODNIE WŁADAM (Opanowane 8-10/10):"
        ]
        if mastered:
            for t in mastered:
                lines.append(f"✓ {t['name']} ({t['category']})")
        else:
            lines.append("(Dopiero buduję bazę — znam podstawowe chwyty)")

        lines.extend([
            "",
            "CHWYTY W TOKU NAUKI (Mogę użyć z prostą strukturą):"
        ])
        if in_progress:
            for t in in_progress:
                lines.append(f"~ {t['name']} (Poziom {t['user_level']}/10)")
        else:
            lines.append("(Brak)")

        if routines:
            lines.extend([
                "",
                "ISTNIEJĄCE RUTYNY W REPERTUARZE:"
            ])
            for r in routines:
                lines.append(f"• {r['name']} — {r['description']}")

        lines.extend([
            "",
            "--------------------------------------------------",
            "🤖 INSTRUKCJA DLA CHATGPT:",
            "Chcę nauczyć się nowej, efektownej sztuczki karcianej.",
            "1. Zaproponuj mi 2-3 profesjonalne rutyny karciane, które bazują GŁÓWNIE na moich opanowanych chwytach (lub maksymalnie z 1 nowym prostym elementem).",
            "2. Opisz dla każdej sztuczki:",
            "   - Efekt dla widza (co widzi publiczność)",
            "   - Wymagane sleighty z mojej listy",
            "   - Krok po kroku metodę i strukturę manipulacji",
            "   - Patter (sugestia ciekawej prezentacji / historii)",
            "   - Zasady misdirection (gdzie patrzy widz w kluczowym momencie)",
            "--------------------------------------------------"
        ])
        return "\n".join(lines)

    return "Nieznany typ kontekstu."
