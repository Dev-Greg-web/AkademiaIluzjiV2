import json
from database import get_db_connection, init_db

MASTER_TECHNIQUES = [
    # --- LEVEL 1 (Fundamenty) ---
    {
        "name": "Mechanics Grip",
        "track": "magic",
        "category": "Grips",
        "difficulty": "Beginner",
        "skill_tree_level": 1,
        "description": "Podstawowy, zrelaksowany chwyt talii w dłoni niedominującej. Baza pod 90% manipulacji karcianych.",
        "notes": "Palec wskazujący spoczywa swobodnie na przedniej krawędzi. Talia spoczywa na kłębie kciuka, bez ściskania.",
        "prerequisites": [],
        "unlocks": ["Double Lift", "Overhand Shuffle", "Key Card"]
    },
    {
        "name": "Overhand Shuffle",
        "track": "magic",
        "category": "False Shuffles",
        "difficulty": "Beginner",
        "skill_tree_level": 1,
        "description": "Klasyczne tasowanie przez zdejmowanie pakietów kciukiem. Podstawa do kontroli góry i dołu talii.",
        "notes": "Płynny, równy rytm. Karty powinny swobodnie opadać w dłoń chwytającą.",
        "prerequisites": ["Mechanics Grip"],
        "unlocks": ["Basic Control", "Double Undercut"]
    },
    {
        "name": "Riffle Shuffle",
        "track": "magic",
        "category": "False Shuffles",
        "difficulty": "Beginner",
        "skill_tree_level": 1,
        "description": "Tasowanie wachlarzowe (na stole lub w dłoniach) z przeplataniem narożników kart.",
        "notes": "Mostek kaskadowy po spleceniu rogów powinien być cichy i naturalny.",
        "prerequisites": ["Mechanics Grip"],
        "unlocks": ["Riffle Force", "Triumph"]
    },
    {
        "name": "Swing Cut",
        "track": "magic",
        "category": "False Cuts",
        "difficulty": "Beginner",
        "skill_tree_level": 1,
        "description": "Przełożenie połowy talii ruchem obrotowym wokół palca wskazującego prawej dłoni.",
        "notes": "Górny pakiet płynnie wpada w zagłębienie lewej dłoni.",
        "prerequisites": ["Mechanics Grip"],
        "unlocks": ["Double Undercut", "Charlier Cut"]
    },
    {
        "name": "Basic Fan",
        "track": "cardistry",
        "category": "Fans",
        "difficulty": "Beginner",
        "skill_tree_level": 1,
        "description": "Rozłożenie talii w równomierny, półkolisty wachlarz za pomocą kciuka.",
        "notes": "Stały, delikatny nacisk kciuka wzdłuż promienia okręgu.",
        "prerequisites": ["Mechanics Grip"],
        "unlocks": ["Giant Fan / Display", "Pressure Fan"]
    },
    {
        "name": "Eye Contact & Posture",
        "track": "performance",
        "category": "Eye Contact",
        "difficulty": "Beginner",
        "skill_tree_level": 1,
        "description": "Utrzymywanie naturalnego kontaktu wzrokowego z widzem i otwarta, pewna postawa ciała.",
        "notes": "Gdy patrzysz w oczy widza, widz nie patrzy na Twoje dłonie. To najprostsze i najpotężniejsze misdirection.",
        "prerequisites": [],
        "unlocks": ["Timing Basics", "Misdirection & Patter"]
    },

    # --- LEVEL 2 (Kluczowe Podstawy Manipulacji) ---
    {
        "name": "Double Lift",
        "track": "magic",
        "category": "Sleights",
        "difficulty": "Intermediate",
        "skill_tree_level": 2,
        "description": "Podniesienie i pokazanie dwóch kart jako pojedynczej. Absolutny filar nowoczesnej iluzji.",
        "notes": "Kluczem jest niewidoczny get-ready (pinky count lub delikatny push-off) i traktowanie 2 kart z lekkością jednej.",
        "prerequisites": ["Mechanics Grip"],
        "unlocks": ["Snap Change", "Ambitious Card", "Top Change"]
    },
    {
        "name": "Double Undercut",
        "track": "magic",
        "category": "Controls",
        "difficulty": "Beginner",
        "skill_tree_level": 2,
        "description": "Niewinna metoda kontroli wybranej karty z pozycji break na sam wierzch lub spód talii.",
        "notes": "Dwa równe cięcia pakietów od spodu muszą wyglądać na niedbałe przełożenie kart.",
        "prerequisites": ["Swing Cut", "Overhand Shuffle"],
        "unlocks": ["Ambitious Card", "Advanced Control"]
    },
    {
        "name": "Key Card Principle",
        "track": "magic",
        "category": "Controls",
        "difficulty": "Beginner",
        "skill_tree_level": 2,
        "description": "Zasada karty kluczowej pozwalająca zidentyfikować nieznaną kartę wybraną przez widza.",
        "notes": "Podgląd karty kluczowej musi być wpleciony w naturalny gest odkładania talii.",
        "prerequisites": ["Mechanics Grip"],
        "unlocks": ["Location Routines", "Triumph"]
    },
    {
        "name": "Basic Control",
        "track": "magic",
        "category": "Controls",
        "difficulty": "Intermediate",
        "skill_tree_level": 2,
        "description": "Kontrola włożonej w środek talii karty na wierzch (np. Overhand In-Jog Control).",
        "notes": "Delikatne wysunięcie karty (in-jog) na grubość milimetra zasłonięte prawą dłonią.",
        "prerequisites": ["Overhand Shuffle"],
        "unlocks": ["Classic Force", "Multiple Shift"]
    },
    {
        "name": "Charlier Cut",
        "track": "cardistry",
        "category": "Cuts",
        "difficulty": "Beginner",
        "skill_tree_level": 2,
        "description": "Klasyczne jednoręczne przełożenie talii kart. Rozwija niezależność i siłę palców.",
        "notes": "Użyj palca wskazującego do wypchnięcia dolnego pakietu ponad górny.",
        "prerequisites": ["Swing Cut"],
        "unlocks": ["Sybil Cut", "Revolution Cut"]
    },
    {
        "name": "Timing Basics",
        "track": "performance",
        "category": "Timing",
        "difficulty": "Beginner",
        "skill_tree_level": 2,
        "description": "Dopasowanie momentu wykonania sekretnego ruchu do naturalnej pauzy w mówieniu lub gestu widza.",
        "notes": "Sekretny ruch wykonuj na 'wydechu' uwagi widza — po tym jak padła puenta lub widz potwierdził wybór.",
        "prerequisites": ["Eye Contact & Posture"],
        "unlocks": ["Misdirection & Patter", "Audience Management"]
    },

    # --- LEVEL 3 (Liczenia, Wymuszenia i Zmyłki) ---
    {
        "name": "Elmsley Count",
        "track": "magic",
        "category": "Counts",
        "difficulty": "Intermediate",
        "skill_tree_level": 3,
        "description": "Liczenie 4 kart jako 4 z ukryciem awersu lub rewersu trzeciej karty.",
        "notes": "Rytm liczenia 1-2-3-4 musi być idealnie metronomiczny. Płynny push-off dwóch kart na liczbie '2'.",
        "prerequisites": ["Mechanics Grip"],
        "unlocks": ["Oil & Water", "Twisting the Aces", "Reset"]
    },
    {
        "name": "Classic Force",
        "track": "magic",
        "category": "Forces",
        "difficulty": "Intermediate",
        "skill_tree_level": 3,
        "description": "Najczystsza psychologiczna forma wymuszenia karty podczas rozsuwania wachlarza w dłoniach.",
        "notes": "Kluczem jest swobodne tempo rozsuwania i wsunięcie docelowej karty wprost pod sięgające palce widza.",
        "prerequisites": ["Basic Control"],
        "unlocks": ["Chicago Opener", "Mentalism Routines"]
    },
    {
        "name": "Riffle Force",
        "track": "magic",
        "category": "Forces",
        "difficulty": "Intermediate",
        "skill_tree_level": 3,
        "description": "Wymuszenie karty poprzez zatrzymanie rifflowania talii w miejscu przygotowanego breaka.",
        "notes": "Zgranie momentu słowa 'Stop' z uniesieniem górnego pakietu tworzy perfekcyjną iluzję wyboru.",
        "prerequisites": ["Riffle Shuffle"],
        "unlocks": ["Chicago Opener", "Card to Pocket"]
    },
    {
        "name": "False Cut Combo",
        "track": "magic",
        "category": "False Cuts",
        "difficulty": "Intermediate",
        "skill_tree_level": 3,
        "description": "Wielopakietowe pozorne przełożenie talii na stole lub w dłoniach zachowujące pełen porządek kart.",
        "notes": "Logika przestrzenna odkładania pakietów musi oszukać oko widza.",
        "prerequisites": ["Swing Cut"],
        "unlocks": ["Triumph", "Full Deck Retention"]
    },
    {
        "name": "Spring & Dribble",
        "track": "cardistry",
        "category": "Flourishes",
        "difficulty": "Intermediate",
        "skill_tree_level": 3,
        "description": "Kaskadowy wyrzut i opadanie kart między dłońmi (sprężyna lub deszcz kart).",
        "notes": "Równomierne zwalnianie kart z kciuka i palców. Buduje autorytet i czucie elastyczności talii.",
        "prerequisites": ["Basic Fan"],
        "unlocks": ["Giant Fan / Display", "Cascade"]
    },
    {
        "name": "Misdirection & Patter",
        "track": "performance",
        "category": "Misdirection",
        "difficulty": "Intermediate",
        "skill_tree_level": 3,
        "description": "Konstruowanie intrygującej narracji i świadome sterowanie uwagą publiczności.",
        "notes": "Duży ruch przykrywa mały ruch. Ważne pytanie zadane widzowi skupia jego wzrok na Twojej twarzy.",
        "prerequisites": ["Timing Basics"],
        "unlocks": ["Audience Management", "Full Stage Act Scripting"]
    },

    # --- LEVEL 4 (Zaawansowane Sleighty i Pierwsze Kompletne Rutyny) ---
    {
        "name": "Snap Change",
        "track": "magic",
        "category": "Changes",
        "difficulty": "Advanced",
        "skill_tree_level": 4,
        "description": "Optyczna, natychmiastowa zmiana karty na inną za pstryknięciem palców (Edward Victor / Roy Walton).",
        "notes": "Schowanie przedniej karty za tylną ruchem palca środkowego. Czystość kątów od przodu.",
        "prerequisites": ["Double Lift"],
        "unlocks": ["Color Change Mastery"]
    },
    {
        "name": "Top Change",
        "track": "magic",
        "category": "Sleights",
        "difficulty": "Advanced",
        "skill_tree_level": 4,
        "description": "Błyskawiczna zamiana trzymanej w dłoni karty na wierzchnią kartę z talii podczas gestu mówienia.",
        "notes": "Wymaga motywacji ruchem ciała i spojrzeniem w oczy widza (psychological misdirection).",
        "prerequisites": ["Double Lift", "Misdirection & Patter"],
        "unlocks": ["Card to Pocket", "Ambitious Card Advanced"]
    },
    {
        "name": "Classic Palm",
        "track": "magic",
        "category": "Palming",
        "difficulty": "Advanced",
        "skill_tree_level": 4,
        "description": "Ukrycie karty w zagłębieniu dłoni przy całkowicie zrelaksowanym, naturalnym ułożeniu palców.",
        "notes": "Dłoń nie może wyglądać na zesztywniałą. Ćwicz trzymanie palmu podczas codziennych czynności.",
        "prerequisites": ["Double Lift"],
        "unlocks": ["Card to Pocket", "Card to Impossible Location"]
    },
    {
        "name": "Giant Fan / Display",
        "track": "cardistry",
        "category": "Displays",
        "difficulty": "Intermediate",
        "skill_tree_level": 4,
        "description": "Efektowny dwuręczny lub dwustronny gigantyczny wachlarz eksponujący wzory rewersów.",
        "notes": "Perfekcyjny stan talii i równomierne naprężenie.",
        "prerequisites": ["Basic Fan", "Spring & Dribble"],
        "unlocks": ["Sybil Cut"]
    },
    {
        "name": "Audience Management",
        "track": "performance",
        "category": "Audience Management",
        "difficulty": "Intermediate",
        "skill_tree_level": 4,
        "description": "Kontrola trudnych widzów (tzw. hecklerów), dobór ochotników i zarządzanie przestrzenią stołu.",
        "notes": "Traktuj widzów jak partnerów w magicznej podróży, nigdy jak przeciwników.",
        "prerequisites": ["Misdirection & Patter"],
        "unlocks": ["Full Stage Act Scripting"]
    },

    # --- LEVEL 5+ (Ekspert & Kompletne Dzieła Karciane) ---
    {
        "name": "Classic Pass",
        "track": "magic",
        "category": "Sleights",
        "difficulty": "Expert",
        "skill_tree_level": 5,
        "description": "Niewidoczna zamiana dolnej i górnej połowy talii pod osłoną dłoni i misdirection.",
        "notes": "Płynny ruch bez napinania mięśni przedramion. Prędkość nie zastąpi czystości kątowej.",
        "prerequisites": ["Basic Control", "Classic Palm"],
        "unlocks": ["Spread Pass", "Herrmann Pass"]
    },
    {
        "name": "Second Deal",
        "track": "magic",
        "category": "Sleights",
        "difficulty": "Expert",
        "skill_tree_level": 5,
        "description": "Wydawanie drugiej karty od góry z zachowaniem perfekcyjnej iluzji wydawania wierzchniej.",
        "notes": "Bezgłośne zsuwanie kciukiem. Rytm wydawania musi być identyczny jak przy zwykłym rozdaniu.",
        "prerequisites": ["Mechanics Grip", "Double Lift"],
        "unlocks": ["Bottom Deal", "Gambling Demos"]
    },
    {
        "name": "Bottom Deal",
        "track": "magic",
        "category": "Sleights",
        "difficulty": "Expert",
        "skill_tree_level": 5,
        "description": "Niewidoczne wysunięcie i rozdanie spodniej karty talii w naturalnym tempie krupiera.",
        "notes": "Chwyt Erdnase'a. Minimalny ruch palców od spodu.",
        "prerequisites": ["Second Deal"],
        "unlocks": ["Gambling Demos"]
    },
    {
        "name": "Multiple Shift",
        "track": "magic",
        "category": "Controls",
        "difficulty": "Advanced",
        "skill_tree_level": 5,
        "description": "Jednoczesna kontrola 4 włożonych w różne miejsca kart (np. 4 Asów) na sam wierzch.",
        "notes": "Boczne wysunięcie (side-jog) i strip-out w jednym, zdecydowanym geście tasowania.",
        "prerequisites": ["Basic Control", "Overhand Shuffle"],
        "unlocks": ["4 Ace Routines"]
    },
    {
        "name": "Sybil Cut (5 Packets)",
        "track": "cardistry",
        "category": "Combos",
        "difficulty": "Advanced",
        "skill_tree_level": 5,
        "description": "Legendarne wielopakietowe przełożenie Cardistry stworzone przez Chrisa Kena.",
        "notes": "Płynna geometria i niezależność obu dłoni.",
        "prerequisites": ["Charlier Cut", "Giant Fan / Display"],
        "unlocks": ["Advanced Flourishes"]
    },
    {
        "name": "Full Stage Act Scripting",
        "track": "performance",
        "category": "Scripting",
        "difficulty": "Advanced",
        "skill_tree_level": 5,
        "description": "Układanie 10-15 minutowego spójnego pokazu z dramaturgią, puentami i resetem rekwizytów.",
        "notes": "Struktura pokazu: Mocne otwarcie -> Eskalacja niemożliwości -> Emocjonalny punkt kulminacyjny.",
        "prerequisites": ["Audience Management", "Misdirection & Patter"],
        "unlocks": ["Master Performance"]
    }
]

ACHIEVEMENTS_DATA = [
    {"code": "FIRST_TRICK", "title": "Pierwszy Trik", "description": "Ukończ swoją pierwszą rutynę karcianą", "icon": "🥉", "category": "routines", "xp_reward": 50, "required_count": 1},
    {"code": "FIRST_TRAINING", "title": "Pierwszy Krok", "description": "Ukończ pierwszą sesję treningową w studiu", "icon": "🎯", "category": "training", "xp_reward": 30, "required_count": 1},
    {"code": "TECHNIQUES_10", "title": "Adept Warsztatu", "description": "Rozpocznij naukę co najmniej 10 technik", "icon": "🥈", "category": "mastery", "xp_reward": 100, "required_count": 10},
    {"code": "TECHNIQUES_25", "title": "Erudyta Kart", "description": "Rozpocznij naukę 25 technik z biblioteki", "icon": "🥇", "category": "mastery", "xp_reward": 250, "required_count": 25},
    {"code": "STREAK_7", "title": "Tydzień Ognia", "description": "Utrzymaj 7-dniowy ciągły streak treningowy", "icon": "🔥", "category": "streak", "xp_reward": 150, "required_count": 7},
    {"code": "STREAK_30", "title": "Mistrzowska Dyscyplina", "description": "Trenuj przez 30 dni bez ani jednego dnia przerwy", "icon": "💎", "category": "streak", "xp_reward": 500, "required_count": 30},
    {"code": "SESSIONS_100", "title": "Stulecie Treningów", "description": "Ukończ 100 sesji treningowych w aplikacji", "icon": "🏆", "category": "training", "xp_reward": 400, "required_count": 100},
    {"code": "MINUTES_1000", "title": "Tysiąc Minut Skupienia", "description": "Spędź ponad 1000 minut z talią w dłoniach", "icon": "⏳", "category": "training", "xp_reward": 600, "required_count": 1000},
    {"code": "MASTER_10", "title": "Dziesięciu Mistrzów", "description": "Osiągnij status Master (80%+) w 10 technikach", "icon": "👑", "category": "mastery", "xp_reward": 500, "required_count": 10},
    {"code": "MASTER_CONTROLS", "title": "Król Kontroli", "description": "Opanuj techniki Double Undercut, Basic Control i Multiple Shift", "icon": "🃏", "category": "mastery", "xp_reward": 200, "required_count": 3},
    {"code": "MASTER_FORCES", "title": "Władca Wyborów", "description": "Opanuj Classic Force i Riffle Force na poziomie Master", "icon": "✨", "category": "mastery", "xp_reward": 200, "required_count": 2},
    {"code": "FIRST_CARDISTRY", "title": "Zwinne Palce", "description": "Opanuj pierwszą technikę ze ścieżki Cardistry", "icon": "♠️", "category": "cardistry", "xp_reward": 50, "required_count": 1},
    {"code": "FIRST_PERFORMANCE", "title": "Światła Rampy", "description": "Zarejestruj swój pierwszy występ na żywo w trybie Performance", "icon": "🎭", "category": "performance", "xp_reward": 100, "required_count": 1},
    {"code": "REPS_1000", "title": "Pamięć Mięśniowa", "description": "Wykonaj łącznie 1000 powtórzeń w trakcie sesji treningowych", "icon": "💪", "category": "training", "xp_reward": 300, "required_count": 1000},
    {"code": "QUIZ_MASTER", "title": "Wiedza Iluzjonisty", "description": "Ukończ quiz z wynikiem 100% poprawnych odpowiedzi", "icon": "🧠", "category": "quizzes", "xp_reward": 75, "required_count": 1}
]

ROUTINES_DATA = [
    {
        "name": "Ambitious Card (Karta Ambitna)",
        "description": "Najsłynniejszy klasyk iluzji karcianej: wybrana i podpisana karta widza nieustannie wędruje na samą górę talii.",
        "effect": "Widz podpisuje wybraną kartę. Karta jest wielokrotnie wsuwana w środek talii, lecz po każdym geście pojawia się na wierzchu.",
        "effect_type": "ambitious",
        "difficulty": "Intermediate",
        "patter": "„Karty są jak ludzie — niektóre mają wielkie ambicje. Spójrz na tę wybraną przez Ciebie kartę... Niezależnie jak głęboko ją ukryjemy, zawsze wraca na sam szczyt.”",
        "misdirection_tips": "Po pierwszym uniesieniu karty pozwól widzowi nacieszyć się efektem. Gdy widz patrzy na kartę na stole, wykonaj przygotowanie get-ready pod kolejny etap.",
        "reset_instructions": "Brak konieczności resetu — rutyna natychmiast gotowa do powtórzenia z dowolną pożyczoną talią.",
        "techniques": ["Double Lift", "Double Undercut", "Basic Control", "Top Change"]
    },
    {
        "name": "Triumph (Tryumf Daj Vernona)",
        "description": "Genialny efekt, w którym karty potasowane awersami do rewersów natychmiast prostują się, z wyjątkiem karty widza.",
        "effect": "Talia zostaje bezczelnie potasowana w bałagan (awersy w rewersy). Po pstryknięciu palcami wszystkie karty wracają do jednej strony, a jedynie wybrana karta widza leży odkryta.",
        "effect_type": "location",
        "difficulty": "Intermediate",
        "patter": "„Czasami w życiu panuje absolutny chaos. Część spraw idzie w lewo, część w prawo... Lecz prawdziwy iluzjonista potrafi uporządkować wszechświat jednym gestem.”",
        "misdirection_tips": "Podczas pokazywania 'bałaganu' w talii wyeksponuj naturalne krawędzie przed wykonaniem zmyłki z odwróceniem pakietu.",
        "reset_instructions": "Wystarczy odwrócić wybraną kartę z powrotem do talii. Pełna talia zachowuje jednolitą orientację.",
        "techniques": ["Riffle Shuffle", "Key Card Principle", "False Cut Combo"]
    },
    {
        "name": "Oil & Water (Oliwa i Woda)",
        "description": "Cztery czarne i cztery czerwone karty ułożone naprzemiennie w tajemniczy sposób same rozdzielają się kolorami.",
        "effect": "Czarne i czerwone karty są przeplatane jedna po drugiej: czarna, czerwona, czarna, czerwona... Bez żadnego podejrzanego ruchu wszystkie czarne lądują razem, a czerwone osobno.",
        "effect_type": "separation",
        "difficulty": "Intermediate",
        "patter": "„Wszyscy wiemy z lekcji fizyki, że oliwa i woda nigdy się nie połączą. Dokładnie to samo dzieje się z kartami o przeciwnych kolorach...”",
        "misdirection_tips": "Utrzymuj powolny, hipnotyzujący rytm liczenia kart. Widz musi być przekonany o czystości każdego układania.",
        "reset_instructions": "Ruchy resetują się samoczynnie w trakcie prezentacji kolejnych faz.",
        "techniques": ["Elmsley Count", "Double Lift"]
    },
    {
        "name": "Chicago Opener (Red Hot Mama)",
        "description": "Jedna z najbardziej dynamicznych rutyn otwierających: karta widza zmienia kolor rewersu na czerwony, a potem zmienia tożsamość na drugą wybraną kartę.",
        "effect": "Wybrana karta z niebieskiej talii okazuje się mieć czerwony rewers. Gdy drugi widz wybiera nową kartę, czerwona karta okazuje się być właśnie tą drugą kartą!",
        "effect_type": "color_change",
        "difficulty": "Intermediate",
        "patter": "„Czy wiesz, że karty mają temperaturę? Spójrz — jedna z nich rozgrzała się tak mocno pod wpływem Twojego dotyku, że zmieniła kolor na płomienną czerwień.”",
        "misdirection_tips": "Wyeksponuj czerwoną kartę na stole. Cała uwaga widowni jest przykuta do niej, co daje 100% swobody przy drugim wymuszeniu.",
        "reset_instructions": "Wymaga 1 karty o odmiennym rewersie (tzw. odd-backed card) przygotowanej na spodzie talii.",
        "techniques": ["Classic Force", "Riffle Force", "Double Lift"]
    },
    {
        "name": "Two Card Monte (Oszustwo Trzech Kart Mini)",
        "description": "Błyskawiczna transpozycja dwóch kart trzymanych w dłoni widza. Niewytłumaczalny klasyk z bliska.",
        "effect": "Widz trzyma w zaciśniętej dłoni As Pik, a iluzjonista trzyma Damę Kier. W mgnieniu oka karty zamieniają się miejscami w dłoni widza!",
        "effect_type": "transposition",
        "difficulty": "Intermediate",
        "patter": "„To stara gra z nowojorskich ulic. Zasada jest prosta: śledź Asa. Gdzie jest As? W Twojej dłoni? Zobaczmy...”",
        "misdirection_tips": "Poproś widza o mocne ściśnięcie karty obiema dłońmi — to angażuje jego fizyczne skupienie i odwraca uwagę od wymiany w Twojej dłoni.",
        "reset_instructions": "Gotowe natychmiast.",
        "techniques": ["Double Lift", "Top Change"]
    }
]

QUIZZES_DATA = [
    {
        "title": "Podstawy Biomechaniki i Chwytów",
        "category": "techniques",
        "difficulty": "Beginner",
        "description": "Sprawdź swoją wiedzę na temat ułożenia dłoni, nacisku palców i poprawnego chwytu Mechanics Grip.",
        "questions": [
            {
                "question_text": "Gdzie w klasycznym Mechanics Grip powinien spoczywać palec wskazujący dłoni trzymającej talię?",
                "question_type": "single_choice",
                "options": ["Z boku talii obok pozostałych palców", "Swobodnie na przedniej, krótkiej krawędzi talii", "Pod spodem talii podtrzymując ją", "Zaciśnięty mocno na wierzchu"],
                "correct_answer": "Swobodnie na przedniej, krótkiej krawędzi talii",
                "explanation": "Palec wskazujący na przedniej krawędzi stabilizuje talię, wyrównuje karty i maskuje ewentualny break od przodu."
            },
            {
                "question_text": "Czym charakteryzuje się prawidłowo wykonany Double Lift?",
                "question_type": "single_choice",
                "options": ["Karty są ściskane tak mocno, by nie było widać szpary", "Dwie karty są traktowane z naturalną lekkością pojedynczej karty", "Obrót następuje z maksymalną prędkością", "Użyciem specjalnego kleju do kart"],
                "correct_answer": "Dwie karty są traktowane z naturalną lekkością pojedynczej karty",
                "explanation": "Zbytnie ściskanie i pośpiech zdradzają, że w dłoni znajdują się 2 karty. Naturalność i swoboda to klucz."
            },
            {
                "question_text": "Czy w technice Elmsley Count liczy się 4 karty i ukrywa dokładnie 3. kartę w pakiecie?",
                "question_type": "true_false",
                "options": ["Prawda", "Fałsz"],
                "correct_answer": "Prawda",
                "explanation": "Elmsley Count pozwala policzyć 4 karty jako 4, przy jednoczesnym ukryciu trzeciej karty (zarówno jej awersu, jak i rewersu)."
            }
        ]
    },
    {
        "title": "Psychologia i Zasady Misdirection",
        "category": "performance",
        "difficulty": "Intermediate",
        "description": "Zrozumienie jak działa uwaga ludzkiego mózgu, kąty widzenia i dramaturgia iluzji.",
        "questions": [
            {
                "question_text": "Co oznacza w iluzji reguła: 'Duży ruch przykrywa mały ruch'?",
                "question_type": "single_choice",
                "options": ["Należy machać rękami, aby rozproszyć widza", "Sekretny mały ruch dłoni wykonuje się podczas jednoczesnego większego, naturalnego ruchu całego ciała/ramienia", "Trzeba głośno mówić podczas manipulacji", "Należy używać tylko dużych kart formatu jumbo"],
                "correct_answer": "Sekretny mały ruch dłoni wykonuje się podczas jednoczesnego większego, naturalnego ruchu całego ciała/ramienia",
                "explanation": "Oko i uwaga widza automatycznie podążają za większym, uzasadnionym ruchem (np. odłożeniem rekwizytu lub gestem wskazania), ignorując drobny ruch palców."
            },
            {
                "question_text": "Kiedy następuje najlepszy moment na wykonanie niewidocznego sleightu (np. Top Change lub Pass)?",
                "question_type": "single_choice",
                "options": ["W absolutnej ciszy, gdy widz uważnie patrzy na Twoje dłonie", "Gdy widz się śmieje, po puencie lub gdy zadajesz mu bezpośrednie pytanie patrząc mu w oczy", "Gdy szybko zasłonisz talię drugą ręką", "Na samym początku przed rozpoczęciem rozmowy"],
                "correct_answer": "Gdy widz się śmieje, po puencie lub gdy zadajesz mu bezpośrednie pytanie patrząc mu w oczy",
                "explanation": "To tzw. 'Off-Beat' — moment rozluźnienia uwagi krytycznej widza, kiedy uwaga mózgu przenosi się z analizy dłoni na kontakt społeczny."
            },
            {
                "question_text": "Czy Classic Force wymaga zmuszenia widza słowami do wzięcia konkretnej karty?",
                "question_type": "true_false",
                "options": ["Prawda", "Fałsz"],
                "correct_answer": "Fałsz",
                "explanation": "Classic Force opiera się na idealnym wyczuciu czasu i podsunięciu karty pod palce widza, podczas gdy widz ma 100% subiektywne poczucie całkowitej swobody wyboru."
            }
        ]
    }
]

def seed_database():
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. User Profile
    cursor.execute("SELECT COUNT(*) FROM user_profile")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
            INSERT INTO user_profile (
                id, name, rank_tier, level, xp, streak, best_streak, 
                total_training_minutes, total_sessions_count,
                magic_xp, cardistry_xp, performance_xp,
                magic_level, cardistry_level, performance_level,
                preferred_daily_minutes, focus_track, primary_goal, onboarding_completed, sound_enabled, theme
            )
            VALUES (
                1, 'Adept Iluzji', 'Beginner', 1, 0, 0, 0,
                0, 0,
                0, 0, 0,
                1, 1, 1,
                20, 'all', 'Opanuj Double Lift na poziomie Master (80%+)', 1, 1, 'dark'
            )
        """)

    # 2. Master Techniques
    for t in MASTER_TECHNIQUES:
        cursor.execute("SELECT id FROM techniques WHERE name = ?", (t["name"],))
        existing = cursor.fetchone()
        prereqs_json = json.dumps(t.get("prerequisites", []))
        unlocks_json = json.dumps(t.get("unlocks", []))
        
        default_reqs = {
            "lesson_completed": False,
            "reps_50": False,
            "reps_100": False,
            "used_in_routine": False,
            "score_8": False,
            "test_passed": False
        }
        
        initial_status = "Unlocked" if t.get("skill_tree_level", 1) == 1 else "Locked"

        if not existing:
            cursor.execute("""
                INSERT INTO techniques (
                    name, track, category, difficulty, user_level, mastery_percentage, 
                    status, description, notes, prerequisites_json, unlocks_json, 
                    skill_tree_level, training_minutes, sessions_count, total_reps_count, 
                    best_score, avg_score, master_requirements_json
                )
                VALUES (?, ?, ?, ?, 0, 0, ?, ?, ?, ?, ?, ?, 0, 0, 0, 0, 0, ?)
            """, (
                t["name"], t.get("track", "magic"), t["category"], t["difficulty"],
                initial_status, t["description"], t.get("notes", ""),
                prereqs_json, unlocks_json, t.get("skill_tree_level", 1),
                json.dumps(default_reqs)
            ))
        else:
            # Update metadata if needed while preserving training stats
            cursor.execute("""
                UPDATE techniques
                SET track = COALESCE(?, track),
                    skill_tree_level = COALESCE(?, skill_tree_level),
                    prerequisites_json = COALESCE(?, prerequisites_json),
                    unlocks_json = COALESCE(?, unlocks_json),
                    description = COALESCE(?, description)
                WHERE name = ?
            """, (
                t.get("track", "magic"), t.get("skill_tree_level", 1),
                prereqs_json, unlocks_json, t["description"], t["name"]
            ))

    # 3. Achievements
    for a in ACHIEVEMENTS_DATA:
        cursor.execute("SELECT id FROM achievements WHERE code = ?", (a["code"],))
        row = cursor.fetchone()
        if not row:
            cursor.execute("""
                INSERT INTO achievements (code, title, description, icon, category, xp_reward, required_count)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (a["code"], a["title"], a["description"], a["icon"], a["category"], a["xp_reward"], a["required_count"]))
            ach_id = cursor.lastrowid
            cursor.execute("""
                INSERT INTO user_achievements (achievement_id, unlocked, current_progress)
                VALUES (?, 0, 0)
            """, (ach_id,))
        else:
            ach_id = row[0]
            cursor.execute("SELECT id FROM user_achievements WHERE achievement_id = ?", (ach_id,))
            if not cursor.fetchone():
                cursor.execute("""
                    INSERT INTO user_achievements (achievement_id, unlocked, current_progress)
                    VALUES (?, 0, 0)
                """, (ach_id,))

    # 4. Classical Routines
    for r in ROUTINES_DATA:
        cursor.execute("SELECT id FROM routines WHERE name = ?", (r["name"],))
        if not cursor.fetchone():
            cursor.execute("""
                INSERT INTO routines (
                    name, description, effect, effect_type, difficulty, patter, 
                    misdirection_tips, reset_instructions, notes, techniques_json
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                r["name"], r["description"], r["effect"], r.get("effect_type", "ambitious"),
                r["difficulty"], r["patter"], r["misdirection_tips"], r["reset_instructions"],
                "", json.dumps(r["techniques"])
            ))

    # 5. Quizzes & Questions
    for q in QUIZZES_DATA:
        cursor.execute("SELECT id FROM quizzes WHERE title = ?", (q["title"],))
        q_row = cursor.fetchone()
        if not q_row:
            cursor.execute("""
                INSERT INTO quizzes (title, category, difficulty, description, xp_reward)
                VALUES (?, ?, ?, ?, 20)
            """, (q["title"], q["category"], q["difficulty"], q["description"]))
            quiz_id = cursor.lastrowid

            for item in q["questions"]:
                cursor.execute("""
                    INSERT INTO quiz_questions (quiz_id, question_text, question_type, options_json, correct_answer, explanation)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    quiz_id, item["question_text"], item["question_type"],
                    json.dumps(item["options"]), item["correct_answer"], item["explanation"]
                ))

    # 6. Default Goals
    cursor.execute("SELECT COUNT(*) FROM goals")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
            INSERT INTO goals (title, description, target_metric, current_value, target_value, priority, status)
            VALUES 
            ('Opanuj Double Lift (100 powtórzeń)', 'Zbuduj solidną pamięć mięśniową bez napinania dłoni', 'reps', 0, 100, 'High', 'active'),
            ('7 Dni Ciągłego Treningu', 'Wyrób codzienny nawyk sięgania po talię na minimum 15 minut', 'streak', 0, 7, 'Medium', 'active'),
            ('Przygotuj pierwszą rutynę: Ambitious Card', 'Przećwicz sekwencję chwytów wraz ze skryptem patteru', 'routine', 0, 1, 'High', 'active')
        """)

    # 7. Default Theory Note
    cursor.execute("SELECT COUNT(*) FROM notes")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
            INSERT INTO notes (title, content, category)
            VALUES (?, ?, ?)
        """, (
            "Złote Zasady Card Magic Coach",
            "1. Płynność > Szybkość: Powolne, perfekcyjne powtórzenia bez pośpiechu tworzą niewidzialność chwytu.\n2. Naturalność: Twoje dłonie nie mogą zdradzać napięcia mięśniowego.\n3. Psychologia: Prawdziwa magia dzieje się w wyobraźni i percepcji widza, nie w palcach.",
            "Teoria"
        ))

    conn.commit()
    conn.close()
    print("CARD MAGIC COACH database seeded successfully!")

if __name__ == "__main__":
    seed_database()
