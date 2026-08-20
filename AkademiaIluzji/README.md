# 🃏 Akademia Iluzji — Osobisty System Treningu Magii Karcianej

**Akademia Iluzji** to kompletna, nowoczesna aplikacja webowa zaprojektowana do nauki, monitorowania i codziennego treningu sztuki iluzji karcianej (*sleight of hand*).

System działa w 100% lokalnie (**offline-first**), bez konieczności połączenia z chmurą, bez zewnętrznych API AI i bez subskrypcji. Zawiera unikalny moduł **GPT Context**, który inteligentnie podsumowuje Twój profil i pozwala skopiować gotowy, wysokiej jakości prompt bezpośrednio do ChatGPT.

---

## 🚀 Szybkie Uruchomienie (Windows)

### Opcja 1: Uruchomienie 1-klikiem (Zalecane)
Kliknij dwukrotnie w plik:
```cmd
start_app.bat
```
Automatycznie uruchomi backend Flask (port 5000) oraz frontend Vite (port 5173).

---

### Opcja 2: Uruchomienie manualne w dwóch terminalach

#### Terminal 1 — Backend (Python Flask + SQLite):
```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python app.py
```
Backend uruchomi się pod adresem: `http://127.0.0.1:5000`

#### Terminal 2 — Frontend (React + Vite + Tailwind CSS):
```powershell
cd frontend
npm install
npm run dev
```
Frontend uruchomi się pod adresem: `http://localhost:5173`

---

## 🛠️ Architektura i Struktura Projektu

```text
AkademiaIluzji/
├── backend/
│   ├── database/
│   │   └── akademia.db             # Plik bazy SQLite
│   ├── routes/
│   │   ├── api_profile.py          # Profil, cele, ranga, streak
│   │   ├── api_techniques.py       # Baza chwytów, poziomy 0-10, rejestr problemów
│   │   ├── api_training.py         # Stoper, zapisywanie sesji, generator treningu
│   │   ├── api_routines.py         # Tworzenie i edycja rutyn
│   │   ├── api_progress.py         # Analityka, wykres 30 dni, kategorie
│   │   ├── api_context.py          # Generator promptów dla ChatGPT
│   │   ├── api_notes.py            # Notatki i teoria
│   │   └── api_settings.py         # Eksport/Import JSON, reset bazy
│   ├── services/
│   │   ├── xp_system.py            # Poziomy 1-10, XP, kalkulator streaku
│   │   ├── training_engine.py      # Algorytm doboru sesji 15/30/45/60 min
│   │   └── context_generator.py    # 4 tryby kondensacji danych dla ChatGPT
│   ├── app.py                      # Główny plik Flask (CORS, Blueprints)
│   ├── database.py                 # Inicjalizacja SQLite i schemat tabel
│   ├── seed.py                     # Domyślny zestaw 23 technik karcianych
│   └── test_backend.py             # Automatyczne testy integracyjne
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.jsx         # Nawigacja, ranga, pasek XP, wskaźnik Streak
│   │   │   ├── LevelBadge.jsx      # Wizualna odznaka poziomu (0-10)
│   │   │   ├── TechniqueModal.jsx  # Szczegóły techniki, suwak poziomu, problemy
│   │   │   ├── TrainingGeneratorModal.jsx # Generator planu 15-60 min
│   │   │   ├── TrainingCompletionModal.jsx # Podsumowanie sesji, ocena 1-10, XP
│   │   │   ├── RoutineModal.jsx    # Kreator sekwencji rutyny i patteru
│   │   │   ├── NoteModal.jsx       # Edytor notatek
│   │   │   └── Toast.jsx           # Globalne powiadomienia i nagrody XP
│   │   ├── context/
│   │   │   └── AppContext.jsx      # Globalny stan profilu, treningu i konfetti
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx       # Pulpit główny, „DZISIAJ ĆWICZYSZ”, statystyki
│   │   │   ├── TechniquesPage.jsx  # Baza chwytów, filtry, wyszukiwarka
│   │   │   ├── RoutinesPage.jsx    # Lista i trening rutyn
│   │   │   ├── TrainingPage.jsx    # Aktywny stoper, licznik powtórzeń, historia
│   │   │   ├── ProgressPage.jsx    # Wykres 30 dni, słabe punkty, kategorie
│   │   │   ├── GptContextPage.jsx  # Flagowy generator promptów do schowka
│   │   │   ├── NotesPage.jsx       # Baza wiedzy i notatki
│   │   │   └── SettingsPage.jsx    # Profil, backup JSON, reset bazy
│   │   ├── services/
│   │   │   └── api.js              # Klient HTTP do backendu
│   │   ├── App.jsx                 # Główny router i layout
│   │   ├── index.css               # Tailwind CSS 4, motyw Dark & Card Red
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js              # Konfiguracja Vite + proxy API
│
├── start_app.bat                   # 1-klikowy launcher Windows
├── start_backend.bat               # Launcher backendu
└── start_frontend.bat              # Launcher frontendu
```

---

## 🌟 Główne Funkcje

### 1. 🏠 Dashboard („Dzisiaj ćwiczysz”)
- Wyraźna sekcja natychmiastowego startu z wyliczonym optymalnym ćwiczeniem na dany dzień.
- 4 karty KPI: Aktualny poziom (Level 1–10), Punkty Doświadczenia (XP), Płonący Streak (🔥 dni z rzędu), Łączny czas treningu.
- Szybki skrót do Generatora treningu (15, 30, 45, 60 min).
- Rejestr ostatnio trenowanych chwytów i aktualny cel.

### 2. 🃏 Baza Technik (23 domyślne chwyty + własne)
- Domyślny seed podzielony na:
  - **Beginner**: *Mechanics Grip, Overhand Shuffle, Hindu Shuffle, Riffle Shuffle, Swing Cut, Charlier Cut, Basic Fan*.
  - **Intermediate**: *Double Lift, Double Undercut, Key Card, Riffle Force, Classic Force, Elmsley Count, False Cut, False Shuffle, Card Control*.
  - **Advanced**: *Pass, Classic Palm, Top Change, Second Deal, Bottom Deal, Multiple Shift, Advanced Card Control*.
- Filtrowanie po 10 kategoriach (*Fundamenty, Controls, Forces, False Cuts, False Shuffles, Counts, Sleights, Cardistry, Flourishes, Performance*).
- Zmiana poziomu opanowania w skali **0/10 → 10/10** (odblokowuje XP i nagrody za mistrzostwo).
- Rejestr indywidualnych problemów technicznych (np. „karty rozjeżdżają się przy obrocie”).

### 3. 🏋️ Centrum Treningowe (Stoper & Rejestrator)
- Interaktywny stoper z opcją pauzy, wznawiania i resetu.
- Licznik powtórzeń z szybkimi przyciskami `+1`, `+5`, `+10`.
- Formularz podsumowania sesji (ocena 1–10, co poszło dobrze, co było problemem, wnioski do poprawy).
- Automatyczne naliczanie XP, aktualizacja streaku i historii sesji z animacją konfetti.

### 4. 🧠 GPT Context (Kluczowa Funkcja Offline AI)
- Aplikacja **nie łączy się z zewnętrznymi serwerami AI**.
- Dostępne 4 dedykowane tryby promptów:
  1. ⚡ **Szybki kontekst** — zwięzły profil do szybkich pytań.
  2. 📜 **Pełny kontekst** — kompleksowy raport ze statystykami, technikami i rutynami.
  3. 🏋️ **Kontekst treningowy** — biomechanika, analiza ostatnich błędów i propozycje ćwiczeń (drills).
  4. 🎭 **Kontekst do nauki sztuczki** — dopasowanie nowych rutyn pod opanowany zestaw chwytów.
- Przycisk **„📋 KOPIUJ DO CHATGPT”** z natychmiastowym potwierdzeniem.
- Przycisk **„💾 EKSPORTUJ .TXT”** do zapisu pliku tekstowego.

### 5. 🎭 Rutyny i Patter
- Tworzenie sekwencji chwytów w spójną całość.
- Edycja efektu dla widza, skryptu narracji (patter) i poziomu trudności.
- Wbudowana szablonowa „Moja pierwsza rutyna — Ambitious Card Mini”.

### 6. 📊 Postęp i Analityka
- Wykres aktywności treningowej z ostatnich 30 dni.
- Najczęściej trenowane techniki vs. techniki wymagające największej uwagi.
- Procentowy wskaźnik opanowania poszczególnych kategorii.

### 7. ⚙️ Ustawienia i Pełny Backup JSON
- Eksport całej bazy danych (profile, techniki, sesje, rutyny, notatki) do pliku `.json`.
- Import i przywracanie stanu bazy z pliku `.json`.
- Opcja bezpiecznego resetu bazy do stanu początkowego.

---

## 🧪 Testy Automatyczne

Backend posiada pełen zestaw testów jednostkowych i integracyjnych:
```powershell
cd backend
.\venv\Scripts\python test_backend.py
```
Wszystkie 9 testów weryfikuje poprawność inicjalizacji SQLite, poziomy XP, stoper, algorytm generatora, eksport kontekstu GPT oraz import/eksport JSON.

---

## 🔮 Sugerowane Następne Kroki Rozwoju

1. **Wideo / Nagrania wideo**: Dodanie możliwości podpięcia kamery internetowej bezpośrednio w zakładce Treningu (do auto-nagrywania powtórzeń i analizy kątów w zwolnionym tempie).
2. **Karty / Talia Wirtualna**: Generator losowych kart z talii do ćwiczenia podglądów, kontroli i wymuszeń na czas.
3. **Dźwiękowy metronom**: Opcjonalny rytmizator powtórzeń (np. do ćwiczenia równego rytmu w Elmsley Count lub tasowaniu).
