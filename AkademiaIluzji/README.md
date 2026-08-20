# 🃏 CARD MAGIC COACH — Akademia Iluzji 2.0

**CARD MAGIC COACH** to kompletny, prywatny system do nauki, monitorowania i codziennego treningu sztuki iluzji karcianej (*sleight of hand*), Cardistry i prezentacji scenicznej (*Performance*).

Aplikacja działa w 100% lokalnie (**offline-first**), bez konieczności połączenia z chmurą, bez zewnętrznych API AI (zero OpenAI/Gemini/Anthropic keys) i bez subskrypcji. Wszystkie rekomendacje, poziomy, spaced repetition i quizy są oparte na **logice deterministycznej**.

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

## 🌟 Główne Moduły CARD MAGIC COACH

### 1. 🏠 Dashboard („Co mam dzisiaj ćwiczyć?”)
- **Cześć, [imię] 👋** — Twój trening na dziś jest gotowy.
- **Paski 3 Ścieżek Rozwoju**: *Magic Lvl*, *Cardistry Lvl*, *Performance Lvl*.
- **DZISIEJSZY TRENING**: Dostosowany deterministycznie plan (5, 10, 15, 20, 30, 45, 60 min) z podziałem na fazy, celem powtórzeń i czasem.
- **TWÓJ NASTĘPNY KROK**: Wyróżniona, pojedyncza najważniejsza akcja z jasnym uzasadnieniem (np. *„Przećwicz Double Lift przez 10 minut: Wyeliminuj napięcie kciuka”*).
- **Wymagające Powtórki (Spaced Repetition)**: Wykrywa techniki tracące świeżość w pamięci mięśniowej.
- **Szybki generator promptów dla ChatGPT**: Kopiowanie kontekstu profilu 1-klikiem.

### 2. 🃏 Trzy Główne Ścieżki
- **🃏 MAGIC**: Grips, Controls, Forces, Counts, Changes, False Cuts, False Shuffles, Palming, Sleights, Theory.
- **♠️ CARDISTRY**: Cuts, Fans, Spreads, Packets, Flourishes, Combos, Displays, Advanced Moves.
- **🎭 PERFORMANCE**: Timing, Misdirection, Patter, Audience Management, Eye Contact, Body Language, Confidence, Presentation, Pacing, Scripting.

### 3. 🗺️ Interaktywny Skill Tree
- Drzewo umiejętności od **Level 1** do **Level 5+**.
- Statusy: *Locked* 🔒, *Unlocked* 🔓, *Started* 🟡, *Practicing* 🔵, *Mastered* 🟢, *Mastered+* ⭐.
- Dynamiczne odblokowywanie chwytów po spełnieniu wymagań wstępnych (*prerequisites*).

### 4. 🎯 Distraction-Free Studio Treningowe
- Duży stoper na żywo (Start, Pauza, Wznowienie, Reset, +1 Min).
- Licznik powtórzeń `[ - ] [ + ]` z celem i komunikatem `✅ TARGET COMPLETE`.
- Wskazówka i fokus do bieżącego ćwiczenia oraz podgląd kolejnego etapu.
- **Wielowymiarowa samoocena**:
  - Ocena ogólna (1–10).
  - Wymiary: *Control*, *Naturalness*, *Timing*, *Confidence*, *Presentation* (1–10).
  - Szybkie tagi błędów: `[Tension]`, `[Timing]`, `[Grip]`, `[Naturalness]`, `[Angles]`, `[Consistency]`, `[Confidence]`.
  - Generowanie promptu recenzji sesji do ChatGPT.

### 5. 🧠 Quizy Wiedzy i Biomechaniki
- Pytania jedno/wielokrotnego wyboru oraz prawda/fałsz.
- Sprawdzanie zasad biomechaniki, kątów, ułożenia palców i psychologii misdirection.
- Wyjaśnienia merytoryczne i nagrody XP (+20 XP, +35 XP za 100%).

### 6. 🏆 System Osiągnięć (15 Odznak)
- Osiągnięcia w kategoriach: Trening, Mistrzostwo, Streak, Cardistry, Performance, Quizy.
- Śledzenie postępu powtórzeń, minut, ukończonych rutyn i streaku.

### 7. 🎪 Deterministyczny Generator Rutyn & Master Routines
- Analizuje znane chwyty i grupuje klasyczne rutyny (*Ambitious Card*, *Triumph*, *Oil & Water*, *Chicago Opener*, *Two Card Monte*) na:
  - **100% Gotowe do pokazu**
  - **Brakuje tylko 1 chwytu** (wskazuje dokładnie jaki sleight należy wyćwiczyć)
  - **W dalszym planie rozwoju**

### 8. 🎭 Warsztat Performance & Rejestr Występów
- 8 Filarów Prezentacji Scenicznej.
- Formularz rejestracji pokazów na żywo z checklistą sceniczną (Patter, Timing, Misdirection, Kontakt wzrokowy, Mowa ciała, Pewność siebie, Puenta, Reset).

### 9. 🤖 Generator Promptów dla ChatGPT
- 5 dedykowanych trybów:
  1. ⚡ **Szybki kontekst** — zwięzły profil do codziennych pytań.
  2. 📜 **Pełny raport Coacha** — kompletny arsenał chwytów, rutyny i biomechanika.
  3. 🏋️ **Kontekst treningowy** — Spaced Repetition, analiza błędów i propozycje mikro-drills.
  4. 🎭 **Dobór nowej sztuczki** — dopasowanie nowych rutyn pod opanowany zestaw chwytów.
  5. 🎬 **Recenzja występu & Patter** — doskonalenie narracji i misdirection.
- Przycisk **„📋 KOPIUJ KONTEKST”** oraz eksport do pliku `.txt`.

---

## 🧪 Testy Automatyczne

Backend posiada pełen zestaw testów jednostkowych i integracyjnych:
```powershell
cd backend
.\venv\Scripts\python test_backend.py
```
Wszystkie 11 testów weryfikuje poprawność schematu SQLite, poziomy XP 1–20, Spaced Repetition, generator rutyn, quizy, osiągnięcia, kontekst ChatGPT oraz serwowanie SPA.
