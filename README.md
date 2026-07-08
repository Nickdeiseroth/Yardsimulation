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
    state.ts           Simulationszustand (Trucks, Ladeeinheiten, Belegung, Counters, SpawnQueue, Events, ...)
    rng.ts              Seedbarer Zufallsgenerator (reproduzierbare Läufe)
    util.ts             Hilfsfunktionen (freien/besetzten Slot finden)
    modules/           Die Bausteine ("Baukasten") - je ein Aspekt des Yard-Verhaltens
      arrival.ts          Ankunft neuer LKW am Gate (Poisson, Standardmodus)
      assignment.ts       Zuweisung freier Laderampen (Standardmodus)
      movement.ts         Fahrzeiten/Ankunft am Ziel (modusübergreifend wiederverwendet)
      dwellDeparture.ts   Be-/Entladen, Rückladung, Abfahrt (Standardmodus)
      shunting.ts         Rangierdienst (Ladeeinheit Rampe -> LEWB/SA, modusübergreifend wiederverwendet)
      cleanup.ts          Ausgefahrene LKW aus dem aktiven Bestand entfernen (modusübergreifend wiederverwendet)
    modes/
      standardMode.ts     Komponiert die Standard-Modul-Kombination
      scenario1/           Szenario 1: feste Stückzahlen je Brückenart, Physisch-/System-Zählung
        types.ts             Verkehrstypen (sgut/nv/leer-ein/leer-aus), Konfig-Typ, Labels
        setup.ts             onInit: platziert "Leere Brücke Ausgang" vorab, baut Ankunfts-Warteliste
        scriptedArrival.ts   Löst verskriptete (statt zufällige) Ankünfte aus der Warteliste aus
        assignment.ts        Routing je Verkehrstyp (Tor / direkt LEWB / Abholung bei LEWB)
        dwellDeparture.ts    System+1 am Tor, Kopplung/Entkopplung, Rückfahrt
        departureCounter.ts  Physisch-1, sobald eine abgeholte Ladeeinheit den Hof verlässt
        index.ts             Komponiert die Szenario-1-Modul-Kombination
  store/
    simulationStore.ts  Zustand-Store: Engine-Instanz, Play/Pause/Speed, Modus-Registry inkl.
                          Konfigurationsfeldern (Maske) und Zähler-Definitionen je Modus
  visualization/       React/SVG-Darstellung des Yards (liest nur aus Snapshot + yardLayout)
    roadNetwork.ts       Statische Straßen-Geometrie (Ringstraße + Gate) und Routenberechnung
    truckPosition.ts     Leitet aus Truck-Status/Movement die aktuelle Position+Blickrichtung ab
    TruckMarker.tsx       LKW-Symbol (Position/Rotation/Farbe je nach Ladung)
    YardMap.tsx            Setzt Zonen, Halle, Straßen, Slots und LKW-Marker zum SVG zusammen
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

### Konfigurationsmasken & Zähler je Modus

`SimulationModeDefinition` (`store/simulationStore.ts`) kann optional
`configFields` (Zahlenfelder, die als Maske im UI erscheinen -
`visualization/ScenarioConfigPanel.tsx`) und `counterDefinitions` (benannte
Kennzahlen, die als Kacheln angezeigt werden - `visualization/CounterPanel.tsx`)
deklarieren. Beides ist generisch: ein neuer Modus muss nur die Felder/Zähler
benennen, die UI baut sich daraus automatisch auf. `build(config)` erhält die
aktuellen Maskenwerte und baut damit die Modul-Liste; "Szenario anwenden"
bzw. "Reset" bauen die Module neu auf und rufen `onInit` erneut auf.

Module lesen/schreiben Zähler direkt über `state.counters['schlüssel']` und
verskriptete (statt zufällige) Ankünfte über `state.spawnQueue` (FIFO aus
frei wählbaren Tags) - beides generische, wiederverwendbare Bausteine im
State, keine Szenario-1-Spezialfelder.

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

### Szenario 1: Brückenzähler

Zweiter Modus, wählbar im Dropdown. Anders als der Standardbetrieb (zufällige,
endlose Ankünfte) fährt Szenario 1 eine **feste, konfigurierbare Stückzahl**
je Verkehrstyp ab und führt zwei Zähler, **Physisch** (physisch auf dem Hof
vorhanden) und **System** (am Tor erfasst):

| Verkehrstyp | Ablauf | Physisch | System |
|---|---|---|---|
| Sgut-Brücke | fährt rein -> wird an ein Tor gestellt -> danach an LEWB verbracht | +1 bei Einfahrt | +1 beim Erreichen des Tors |
| NV-Brücke | identisch zu Sgut-Brücke | +1 bei Einfahrt | +1 beim Erreichen des Tors |
| Leere Brücke Eingang | fährt rein -> direkt bei LEWB abgestellt, kein Tor | +1 bei Einfahrt | unverändert |
| Leere Brücke Ausgang | steht bereits bei LEWB -> wird abgeholt -> fährt direkt ab | +1/System +1 sobald sie steht, **-1** bei Ausfahrt | +1 sobald sie steht, danach unverändert |

Die Konfigurationsmaske (Anzahl je Brückenart) setzt die Stückzahl für einen
Szenariolauf; "Leere Brücke Ausgang" wird bei Szenariostart sofort bei LEWB
platziert (inkl. sofortiger Zählung), die übrigen Fahrzeuge treffen verskriptet
im festen Takt am Gate ein (`scriptedArrival.ts`). Sgut/NV nutzen dieselbe
Laderampen-Zone (`dock`) wie der Standardbetrieb und denselben
Rangierdienst-Baustein (`shunting.ts`) für die Verbringung zur LEWB-Zone -
nur Ankunft, Zuweisung und Verweildauer/Abfahrt sind eigene Bausteine, weil
hier je Verkehrstyp unterschiedliche Ziel-Zonen und Zählregeln gelten.

### Fahrtwege

LKW fahren nicht auf direktem Weg (Luftlinie) zu ihrem Ziel, sondern entlang
eines einfachen Straßennetzes (`visualization/roadNetwork.ts`): einer
rechteckigen Ringstraße in den Gassen zwischen den Stellplatzblöcken, plus
einem Gate-Stichweg unten links. Jede Zone bindet über einen kurzen Stich an
die nächstliegende Kante der Ringstraße an; die Route von/zum Gate nimmt
jeweils den kürzeren Weg um den Ring (im bzw. gegen den Uhrzeigersinn).

Damit das funktioniert, hält der Simulationsstate pro laufender Fahrt nicht
nur die Restzeit, sondern auch die Gesamtdauer (`state.movements[truckId] =
{ remaining, total }`) sowie Ausgangs- und Zielort (`truck.currentSlotId` /
`truck.targetSlotId`, bleibt während der Fahrt gesetzt). Aus Fortschritt
(`1 - remaining/total`) und der berechneten Route interpoliert
`visualization/truckPosition.ts` Bildschirmposition und Blickrichtung; die
`TruckMarker`-Komponente animiert das per CSS-Transition zwischen zwei
Simulations-Ticks weich statt sprunghaft.

Für einen realistischeren Look durchläuft jede Route vor der Interpolation
`roadNetwork.ts` → `preparePath()`:

- **Fahrspur-Versatz** (`offsetRoute`): jede Route wird um wenige Pixel nach
  rechts der jeweiligen lokalen Fahrtrichtung verschoben - Hin- und Rückfahrt
  liegen dadurch nicht exakt deckungsgleich übereinander, wie zwei
  Fahrspuren einer echten Straße.
- **Kurvenglättung** (`roundedRoute`): scharfe 90°-Knicke an den
  Ring-/Zufahrtsecken werden durch kleine, abgetastete Bézierkurven ersetzt,
  radius-begrenzt auf die halbe angrenzende Segmentlänge (kein Verzerren
  kurzer Stichwege in die Stellplätze).
- **Sanftes Anfahren/Abbremsen** (`easeInOutCubic`): der Fortschritt entlang
  der Route ist nicht linear zur Zeit, sondern beschleunigt/bremst am
  Fahrtanfang/-ende ab statt mit konstanter Geschwindigkeit zu fahren.

Das ist bewusst kein echtes Pathfinding (keine Kollisionsvermeidung,
kein Gegenverkehr) - reicht aber, um Bewegungen nachvollziehbar entlang
plausibler Wege statt geradlinig durch die Halle zu zeigen. Ein künftiges
`ShuntingTruckModule` (siehe oben) könnte dieselbe Routing-Geometrie für
echte Rangier-Fahrzeuge wiederverwenden.

## Tech-Stack

TypeScript, React 19, Vite, Zustand (State-Management). Reines Client-Side-Setup,
kein Backend nötig für den Standardmodus.
