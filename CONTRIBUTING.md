# Contributing to ReqSmith

Vielen Dank für dein Interesse an ReqSmith! 🛠️

## Entwicklungsumgebung einrichten

### Voraussetzungen
- Node.js 18+ (empfohlen: [nvm](https://github.com/nvm-sh/nvm))
- Ein Supabase-Projekt (kostenlos unter [supabase.com](https://supabase.com))

### Setup

```bash
git clone https://github.com/<your-org>/reqsmith.git
cd reqsmith
npm install
cp .env.example .env
# .env mit deinen Supabase-Zugangsdaten ausfüllen
npm run dev
```

### Datenbank-Migrationen

Die SQL-Migrationen liegen unter `supabase/migrations/`. Um die Datenbank-Struktur in deinem eigenen Supabase-Projekt aufzusetzen, führe die Migrationen in chronologischer Reihenfolge aus.

## Code-Style

- **TypeScript** – strikte Typisierung bevorzugt
- **ESLint** – `npm run lint` vor dem Commit ausführen
- **Tailwind CSS** – semantische Design-Tokens verwenden (`text-foreground`, `bg-primary`, etc.), keine direkten Farben
- **Komponenten** – klein, fokussiert, mit Props-Interface

## Pull-Request-Prozess

1. Fork erstellen und Feature-Branch anlegen (`feature/mein-feature`)
2. Änderungen implementieren und Tests sicherstellen
3. PR gegen `main` öffnen mit:
   - Beschreibung der Änderung
   - Screenshots bei UI-Änderungen
   - Verweis auf zugehöriges Issue (falls vorhanden)
4. Code-Review abwarten

## Issues

- **Bug Reports**: Reproduktionsschritte, erwartetes vs. tatsächliches Verhalten
- **Feature Requests**: Use Case beschreiben, warum das Feature hilfreich wäre

## Lizenz

Mit deinem Beitrag stimmst du zu, dass dein Code unter der [MIT-Lizenz](LICENSE) veröffentlicht wird.
