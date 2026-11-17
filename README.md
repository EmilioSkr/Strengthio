# Gym Tracker (React + Vite, PWA)

Offline-fähige Fitness-App für das iPhone. Alle Daten bleiben lokal auf dem Gerät (IndexedDB).

## Deployment mit GitHub Pages (nur Browser nötig)
1. Auf github.com ein kostenloses Konto anlegen und ein **öffentliches** Repository erstellen (z. B. `gym`).
2. Dieses ZIP entpacken. Im Repository: **Add file → Upload files** und den **Inhalt** des Ordners hineinziehen
   (inkl. des Ordners `.github`), dann **Commit changes**.
   - Prüfen, dass `.github/workflows/deploy.yml` im Repository sichtbar ist. Falls nicht:
     **Add file → Create new file**, als Name `.github/workflows/deploy.yml` eingeben und den Inhalt der Datei einfügen.
3. **Settings → Pages → Build and deployment → Source: "GitHub Actions"** auswählen.
4. Tab **Actions**: Der Lauf "Deploy to GitHub Pages" baut die App (ca. 1–2 Min.). Falls er vor Schritt 3 fehlschlug:
   Lauf öffnen → **Re-run all jobs**.
5. Fertig: `https://DEIN-NAME.github.io/gym/` – im **Safari** auf dem iPhone öffnen →
   Teilen → **Zum Home-Bildschirm**. Einmal mit Internet starten, danach läuft sie offline.

Updates: geänderte Dateien ins Repository hochladen – der Workflow deployt automatisch neu.

## Import / Export
Pläne-Tab → „⇅ Import/Export“ (oder im Plan „⇅ Exportieren“).
- Export: Gym-Tracker-JSON (verlustfrei) oder Strong-CSV (z. B. für Hevy); auch der Trainingsverlauf als Strong-CSV.
- Import: Gym-Tracker-JSON, Strong-CSV, Hevy-CSV und einfache CSV-Dateien (Workout, Exercise, Reps, Weight).
  Aus Verlaufs-Exporten wird pro Workout-Name das neueste Training als Plan übernommen, optional samt Verlauf.

## Lokal entwickeln (optional, Node.js 20+)
```
npm install
npm run dev
```
