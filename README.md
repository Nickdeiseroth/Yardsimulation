# Yard-Simulation

Simulationsmodell für LKW-Bewegungen (Wechselbrücken & Sattelauflieger) auf dem
Yard, als Web-App mit Live-Visualisierung. Ziel ist ein **Baukasten**: die
Simulationslogik besteht aus austauschbaren Modulen, aus denen sich
unterschiedliche Simulationsmodi zusammensetzen lassen, ohne Engine oder
Visualisierung anzufassen. Dieses Repo enthält den **Standardaufbau** als
Fundament dafür.

## Starten

```bash
npm install
npm run dev
```

Danach im Browser öffnen (Standard: `http://localhost:5173`). Steuerung
rechts: Modus wählen, Start/Pause/Schritt, Geschwindigkeit, Reset.

## Architektur

```
src/
  domain/           Fachliches Datenmodell (Zone, Slot, Truck, CargoUnit)
    types.ts
    yardLayout.ts    Konkreter Yard-Aufbau (Zonen + Stellplätze), aus dem Lageplan abgeleitet
  simulation/
    engine.ts         Generische Tick-Engine, kennt keine Yard-Fachlogik
    state.ts           Simulationszustand (Trucks, Ladeeinheiten, Belegung, Events, ...)
    rng.ts              Seedbarer Zufallsgenerator (reproduzierbare Läufe)
    util.ts             Hilfsfunktionen (freien/besetzten Slot finden)
    modules/           Die Bausteine ("Baukasten") - je ein Aspekt des Yard-Verhaltens
      arrival.ts          Ankunft neuer LKW am Gate
      assignment.ts       Zuweisung freier Laderampen
      movement.ts         Fahrzeiten/Ankunft am Ziel
      dwellDeparture.ts   Be-/Entladen, Rückladung, Abfahrt
      shunting.ts         Rangierdienst (Ladeeinheit Rampe -> LEWB/SA)
      cleanup.ts          Ausgefahrene LKW aus dem aktiven Bestand entfernen
    modes/
      standardMode.ts     Komponiert die Standard-Modul-Kombination
  store/
    simulationStore.ts  Zustand-Store: hält Engine-Instanz, Play/Pause/Speed, Modus-Registry
  visualization/       React/SVG-Darstellung des Yards (liest nur aus Snapshot + yardLayout)
```

### Baukasten-Prinzip

Ein Simulationsmodus ist nichts weiter als eine geordnete Liste von
`SimulationModule`s (`simulation/modules/types.ts`). Die Engine ruft pro Tick
jedes Modul einmal auf; jedes Modul liest/schreibt den gemeinsamen
`SimulationState`. `modes/standardMode.ts` zeigt die Baseline-Komposition:

```
Ankunft -> Rampenzuweisung -> Bewegung -> Verweildauer/Abfahrt -> Rangierdienst -> Aufräumen
```

**Neuen Modus bauen** heißt: eine neue Datei in `simulation/modes/`, die eine
eigene Modul-Liste zusammenstellt - z.B. bestehende Module mit anderer
Konfiguration (höhere Ankunftsrate, längere Standzeiten) kombiniert, oder neue
Module ergänzt (siehe Ideen unten). Danach den Modus in
`store/simulationStore.ts` → `availableModes` registrieren, schon erscheint er
im Dropdown der UI.

Ideen für weitere Bausteine/Modi (noch nicht implementiert):

- **BreakdownModule**: markiert Ladeeinheiten zufällig als defekt -> Weg über
  die `DEF`-Zone (Werkstatt-Zulieferung).
- **ShuntingTruckModule**: ersetzt die aktuell abstrakte
  Rangierdienst-Simulation durch echte Rangier-Zugmaschinen mit eigener
  Kapazität/Fahrzeit (nutzt `PPRD`).
- **PeakSeasonArrivalModule**: zeitabhängige Ankunftsrate (Tagesgang,
  Wochenmuster) statt konstanter Poisson-Rate.
- **GateCapacityModule**: begrenzte Anzahl gleichzeitiger Einfahrten,
  Rückstau simulieren.

### Datenmodell des Yards

`domain/yardLayout.ts` ist die einzige Quelle für Zonen und Stellplätze.
Slot-IDs/-Bereiche wurden aus dem bereitgestellten Lageplan abgeleitet:

- **LEWB** (251–226 / 151–126): Leerwechselbrücken-Stellfläche
- **ANG** (225–201 / 125–101): Anhänger-/Wechselbrücken-Stellfläche
- **Laderampen** der Halle: Nordseite 095–054, Südseite 001–041, Ostseite 053–042
- **UMW** (301–304) / **UMO** (305–308): Umsetz-/Pufferflächen
- **WKST** (995, 996, 997, 998, 999): Werkstatt
- **PPRD** "Rang.D." (152–155/252–255): Rangierdienst
- **DEF** "Def. WB" (156–160/256–260): defekte Wechselbrücken
- **SA** "Abstellfläche Sattel" (161–175/261–275): Sattelauflieger-Stellfläche
- **PP**: Pkw-Parkplätze (kein LKW-Verkehr, nur zur Vollständigkeit dargestellt)

**Wichtiger Hinweis:** Viele Slots sind im Plan an beiden Enden beschriftet
(z.B. oben `251`, unten `151`, exakt um 100 versetzt). Das wurde hier als
*ein* Slot mit `id` + `altId` modelliert - falls es sich tatsächlich um zwei
getrennte Rückwärts-Stellplätze handelt, lässt sich das in `yardLayout.ts`
leicht auf zwei separate Slots umstellen. Die PP-Zone (Pkw) war im Plan nur
teilweise lesbar und wurde mit Platzhalter-IDs generiert. Zonenbezeichnungen,
-grenzen und Nummernbereiche bitte bei Bedarf direkt in `yardLayout.ts`
korrigieren - das ist die einzige Datei, die Simulation und Visualisierung
gemeinsam als Grundlage nutzen.

### Standard-Kreislauf

1. LKW kommt beladen (Wechselbrücke oder Sattelauflieger) am Gate an.
2. Wird einer freien Laderampe zugewiesen, fährt hin.
3. Be-/entlädt (Verweildauer), entkoppelt die Ladeeinheit an der Rampe.
4. Koppelt - falls verfügbar - eine leere Ladeeinheit passenden Typs aus
   LEWB (Wechselbrücke) bzw. SA (Sattelauflieger), sonst fährt er solo (Bobtail) ab.
5. Fährt zum Gate und verlässt den Yard.
6. Parallel: der Rangierdienst bringt an der Rampe zurückgelassene
   Ladeeinheiten in ihre Lagerzone (LEWB/SA) und gibt die Rampe frei.

## Tech-Stack

TypeScript, React 19, Vite, Zustand (State-Management). Reines Client-Side-Setup,
kein Backend nötig für den Standardmodus.
