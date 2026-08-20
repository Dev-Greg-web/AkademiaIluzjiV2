import json
from database import get_db_connection, init_db

DEFAULT_TECHNIQUES = [
    # Beginner
    {
        "name": "Mechanics Grip",
        "category": "Fundamenty",
        "difficulty": "Beginner",
        "description": "Podstawowy chwyt talii w lewej ręce (dla praworęcznych). Baza pod niemal wszystkie sleighty i kontrole.",
        "notes": "Pamiętaj o rozluźnieniu palca wskazującego na przedniej krawędzi talii. Talia nie może być ściskana zbyt mocno."
    },
    {
        "name": "Overhand Shuffle",
        "category": "Fundamenty",
        "difficulty": "Beginner",
        "description": "Klasyczne tasowanie przez przekładanie małych pakietów kart. Podstawa do licznych kontroli i podglądów.",
        "notes": "Ćwicz płynne ściąganie kart kciukiem bez zacinania rytmu."
    },
    {
        "name": "Hindu Shuffle",
        "category": "Fundamenty",
        "difficulty": "Beginner",
        "description": "Wschodnie tasowanie przez zdejmowanie wierzchnich pakietów do prawej dłoni. Bardzo naturalne i wszechstronne.",
        "notes": "Ruch powinien wynikać z płynnego chwytania pakietu palcami prawej dłoni."
    },
    {
        "name": "Riffle Shuffle",
        "category": "Fundamenty",
        "difficulty": "Beginner",
        "description": "Tasowanie wachlarzowe na stole lub w dłoniach z przeplataniem rogów kart.",
        "notes": "Delikatny łuk mostka przy łączeniu kart gwarantuje cichą i elegancką pracę."
    },
    {
        "name": "Swing Cut",
        "category": "Fundamenty",
        "difficulty": "Beginner",
        "description": "Przełożenie połowy talii ruchem obrotowym wokół palca wskazującego do drugiej dłoni.",
        "notes": "Górny pakiet powinien płynnie wpaść w zagłębienie dłoni odbierającej."
    },
    {
        "name": "Charlier Cut",
        "category": "Cardistry",
        "difficulty": "Beginner",
        "description": "Klasyczne, jednoręczne przełożenie talii. Efektowne i rozwijające niezależność palców.",
        "notes": "Używaj kciuka do zwolnienia dolnego pakietu i palca wskazującego do wypchnięcia go ku górze."
    },
    {
        "name": "Basic Fan",
        "category": "Flourishes",
        "difficulty": "Beginner",
        "description": "Równomierne rozłożenie talii w półokrągły wachlarz przy użyciu kciuka i palców.",
        "notes": "Presja kciuka musi być stała wzdłuż promienia obrotu."
    },

    # Intermediate
    {
        "name": "Double Lift",
        "category": "Sleights",
        "difficulty": "Intermediate",
        "description": "Podniesienie dwóch kart jako jednej. Absolutny fundament współczesnej magii karcianej.",
        "notes": "Kluczem jest niewidoczny get-ready (pinky count lub push-off) i traktowanie dwóch kart z naturalną lekkością pojedynczej karty."
    },
    {
        "name": "Double Undercut",
        "category": "Controls",
        "difficulty": "Intermediate",
        "description": "Szybka, niewinna metoda kontroli wybranej karty z pozycji break na sam spód lub wierzch talii.",
        "notes": "Dwa równe cięcia z dołu do góry powinny wyglądać jak zwykłe, niefrasobliwe tasowanie."
    },
    {
        "name": "Key Card",
        "category": "Controls",
        "difficulty": "Intermediate",
        "description": "Zasada karty kluczowej (np. dolnej karty talii) pozwalająca na zlokalizowanie nieznanej karty widza.",
        "notes": "Podgląd karty kluczowej musi być wpleciony w naturalny gest lub pauzę."
    },
    {
        "name": "Riffle Force",
        "category": "Forces",
        "difficulty": "Intermediate",
        "description": "Wymuszenie karty poprzez zatrzymanie rifflowania krawędzi talii w miejscu przygotowanego breaka.",
        "notes": "Timing słowa 'Stop' i podniesienia górnego pakietu decyduje o pełnej iluzji swobody wyboru."
    },
    {
        "name": "Classic Force",
        "category": "Forces",
        "difficulty": "Intermediate",
        "description": "Najczystsza i najbardziej magiczna forma wymuszenia karty podczas rozkładania wachlarza w dłoniach.",
        "notes": "Kluczowa jest psychologia, tempo rozkładania i podsunięcie właściwej karty dokładnie pod palce widza."
    },
    {
        "name": "Elmsley Count",
        "category": "Counts",
        "difficulty": "Intermediate",
        "description": "Liczenie 4 kart jako 4, przy jednoczesnym ukryciu awersu/rewersu 3. karty w pakiecie.",
        "notes": "Rytm liczenia 1-2-3-4 musi być idealnie równy, zwłaszcza przy podwójnym pchnięciu na liczbie 2."
    },
    {
        "name": "False Cut",
        "category": "False Cuts",
        "difficulty": "Intermediate",
        "description": "Pozorne przekładanie pakietów kart, które po zakończeniu pozostawia całą talię w nienaruszonym porządku.",
        "notes": "Kolejność odkładania pakietów musi zachować spójną logikę przestrzenną."
    },
    {
        "name": "False Shuffle",
        "category": "False Shuffles",
        "difficulty": "Intermediate",
        "description": "Pozorne tasowanie zachowujące pełną kolejność kart (full deck retention) lub kontrolujące górny/dolny blok.",
        "notes": "Nie przyspieszaj — naturalność to jedyna tarcza ochronna iluzjonisty."
    },
    {
        "name": "Card Control",
        "category": "Controls",
        "difficulty": "Intermediate",
        "description": "Kontrola włożonej w środek talii karty na dowolną pozycję (wierzch, spód, druga od góry).",
        "notes": "Utrzymuj właściwy kąt zasłaniania breaka przed wzrokiem widzów."
    },

    # Advanced
    {
        "name": "Pass",
        "category": "Sleights",
        "difficulty": "Advanced",
        "description": "Klasyczny Classic Pass / Herrmann Pass — sekretna zamiana dolnej i górnej połowy talii pod osłoną dłoni.",
        "notes": "Niewidoczność zależy od płynności, braku napięcia w dłoniach i odwrócenia uwagi (misdirection) wzrokiem."
    },
    {
        "name": "Classic Palm",
        "category": "Sleights",
        "difficulty": "Advanced",
        "description": "Ukrycie karty w zagłębieniu dłoni przy zachowaniu swobodnego i zrelaksowanego ułożenia palców.",
        "notes": "Dłoń trzymająca palm nie może wyglądać na zaciśniętą ani nieruchomą."
    },
    {
        "name": "Top Change",
        "category": "Sleights",
        "difficulty": "Advanced",
        "description": "Błyskawiczna zamiana trzymanej w prawej dłoni karty na wierzchnią kartę z talii podczas gestu mówienia.",
        "notes": "Wymaga zgrania z ruchem ciała i spojrzeniem w oczy widza (motywacja ruchu)."
    },
    {
        "name": "Second Deal",
        "category": "Sleights",
        "difficulty": "Advanced",
        "description": "Rozdawanie drugiej karty od góry z zachowaniem perfekcyjnej iluzji rozdawania wierzchniej.",
        "notes": "Ćwicz bezgłośne ściąganie i minimalny ruch kciuka lewej ręki."
    },
    {
        "name": "Bottom Deal",
        "category": "Sleights",
        "difficulty": "Advanced",
        "description": "Wysuwanie i rozdawanie spodniej karty talii w rytmie normalnego rozdania.",
        "notes": "Chwyt talii (np. Erdnase grip) musi być stabilny, a ruch palców od spodu niewidoczny z góry."
    },
    {
        "name": "Multiple Shift",
        "category": "Controls",
        "difficulty": "Advanced",
        "description": "Jednoczesna kontrola kilku (np. 4 Asów) włożonych w różne miejsca talii kart na wierzch.",
        "notes": "Wypychanie kart pod kątem (side-jog / strip-out) musi odbywać się jednym, zdecydowanym ruchem."
    },
    {
        "name": "Advanced Card Control",
        "category": "Controls",
        "difficulty": "Advanced",
        "description": "Zaawansowane techniki kontroli (Side Steal, Diagonal Palm Shift, Tilt, Spread Pass).",
        "notes": "Skup się na czystości kątów (angle-proofing) i eliminacji zbędnych mikro-ruchów dłoni."
    }
]

def seed_database():
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Profile
    cursor.execute("SELECT COUNT(*) FROM user_profile")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
            INSERT INTO user_profile (id, name, level, xp, streak, total_training_minutes, total_sessions_count, primary_goal)
            VALUES (1, 'Adept Iluzji', 1, 0, 0, 0, 0, 'Opanuj Double Lift na poziomie 8/10.')
        """)

    # 2. Techniques
    for t in DEFAULT_TECHNIQUES:
        cursor.execute("SELECT id FROM techniques WHERE name = ?", (t["name"],))
        if not cursor.fetchone():
            cursor.execute("""
                INSERT INTO techniques (name, category, difficulty, user_level, status, description, notes, training_minutes, sessions_count)
                VALUES (?, ?, ?, 0, 'Nie rozpoczęto', ?, ?, 0, 0)
            """, (t["name"], t["category"], t["difficulty"], t["description"], t["notes"]))

    # 3. Default Routine
    cursor.execute("SELECT COUNT(*) FROM routines")
    if cursor.fetchone()[0] == 0:
        sample_techniques = ["Riffle Shuffle", "Riffle Force", "Double Lift"]
        cursor.execute("""
            INSERT INTO routines (name, description, effect, difficulty, patter, notes, techniques_json)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            "Moja pierwsza rutyna — Ambitious Card Mini",
            "Klasyczny, 3-etapowy efekt, w którym wybrana i podpisana karta widza nieustannie wędruje na samą górę talii.",
            "Widz wybiera kartę, karta zostaje wsunięta w środek talii, a po pstryknięciu palcami pojawia się na wierzchu.",
            "Intermediate",
            "„Karty mają swoje własne ambicje. Spójrz na tę wybraną przez Ciebie kartę... Nawet jeśli ukryjemy ją głęboko pośród innych, zawsze znajdzie drogę na sam szczyt.”",
            "Kluczem jest pewność siebie przy Double Lift i naturalna praca z widzem bez pośpiechu.",
            json.dumps(sample_techniques)
        ))

    # 4. Default Note
    cursor.execute("SELECT COUNT(*) FROM notes")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
            INSERT INTO notes (title, content, category)
            VALUES (?, ?, ?)
        """, (
            "Złote Zasady Treningu Iluzji",
            "1. Nigdy nie ćwicz w pośpiechu — powolne, perfekcyjne powtórzenia budują pamięć mięśniową.\n2. Patrz w lustro lub nagrywaj się kamerą, ale nie skupiaj się tylko na dłoniach — obserwuj swoją postawę i wzrok.\n3. Prawdziwa iluzja dzieje się w umyśle widza, nie w twoich palcach.",
            "Teoria"
        ))

    conn.commit()
    conn.close()
    print("Database seeded successfully!")

if __name__ == "__main__":
    seed_database()
