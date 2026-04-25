/**
 * Auto-extracted prompt module: templates.de
 *
 * These are the long-form system prompts the chat edge function feeds to the
 * LLM. They were originally inlined in index.ts; splitting them out keeps the
 * handler readable and lets reviewers diff prompt changes in isolation.
 */
export const templatesDe: Record<string, string> = {
  "modern-prd": `
DOKUMENTTYP: Product Requirements Document (PRD)
Verwende folgende professionelle Mindeststruktur mit nummerierten Anforderungen:

## 1. Executive Summary / Zusammenfassung
- Problemstellung (Problem, NICHT Lösung!)
- Vision und Ziele (SMART-Kriterien: Specific, Measurable, Achievable, Relevant, Time-bound)
- Geschäftswert und KPIs

## 2. Stakeholder und Zielgruppe
- Stakeholder-Analyse nach Zwiebelschalenmodell:
  - Stakeholder des Systems (direkt betroffen)
  - Stakeholder des Umgebungssystems (indirekt betroffen)
  - Stakeholder aus dem weiteren Umfeld
- User Personas (falls relevant)
- Einfluss und Motivation der Stakeholder bewerten

## 3. Systemkontext und Scope
- Kontextdiagramm beschreiben (System in seiner Umgebung)
- Systemgrenzen klar definieren (Was ist inside? Was ist outside?)
- Schnittstellen zu anderen Systemen
- Annahmen über den Kontext (Kontext-Annahmen explizit machen!)

## 4. Funktionale Anforderungen
- Nach Use Cases oder Features gruppieren
- Jede Anforderung einzeln identifizierbar (ID-Schema: FR-001, FR-002, ...)
- Anforderungen müssen adäquat, notwendig, eindeutig, vollständig, verständlich und überprüfbar sein
- Vermeide Lösungsbias – beschreibe WAS, nicht WIE
- Verwende Prozessverben ("prüfen", "speichern", "berechnen") statt Nominalisierungen
- FORMATIERUNG: Verwende eine Markdown-Tabelle mit Spalten: | ID | Kategorie | Beschreibung | Priorität |

## 5. Qualitätsanforderungen (Non-Functional Requirements)
- Nach ISO 25010 (SQuaRE) kategorisieren: Usability, Reliability, Performance, Security, Maintainability, Portability
- Mit konkreten Metriken versehen (z.B. "Antwortzeit < 2 Sekunden bei 1000 gleichzeitigen Nutzern")
- Qualitätsszenarien verwenden: "WENN [Kontext] DANN SOLL System [Reaktion] mit [Qualitätsmetrik]"
- ID-Schema: QR-001, QR-002, ...
- FORMATIERUNG: Verwende eine Markdown-Tabelle mit Spalten: | ID | Kategorie | Spezifikation |

## 6. Constraints (Randbedingungen)
- Technische Constraints (z.B. "Muss auf AWS EU-Region laufen")
- Organisatorische Constraints (z.B. "DSGVO-Konformität erforderlich")
- Budget und Zeit (falls bekannt)
- ID-Schema: CON-001, CON-002, ...

## 7. Abnahmekriterien
- Für jede Anforderung: Wie wird Erfüllung überprüft?
- Testbare Kriterien definieren (Gherkin-Syntax)

## 8. Risiken und Abhängigkeiten
- Technische Risiken mit Eintrittswahrscheinlichkeit und Impact
- Abhängigkeiten zu anderen Projekten/Systemen

## 9. Out of Scope
- Explizit auflisten, was NICHT Teil des Projekts ist

## 10. Timeline und Meilensteine
- Phasen und Zeitrahmen (wenn bekannt)

QUALITÄTSKRITERIEN:
- Keine Nominalisierungen: Statt "Durchführung der Validierung" → "System validiert"
- Nie "schnell" oder "benutzerfreundlich" – immer messbare Metriken
- Gleiche Begriffe für gleiche Konzepte durchgängig verwenden
- Jede Anforderung mit ID versehen

SOKRATISCHE FRAGEN FÜR DIESEN TYP:
1. "Welches Problem soll gelöst werden (nicht welche Lösung)?"
2. "Wer sind die Stakeholder (direkt betroffen, indirekt betroffen, weiteres Umfeld)?"
3. "Was ist im Scope und was explizit out of scope?"
4. "Welche Schnittstellen zu anderen Systemen gibt es?"
5. "Welche Qualitätsanforderungen sind kritisch (Usability, Performance, Security, ...)?"
6. "Welche Constraints (technisch, organisatorisch, rechtlich) existieren?"
7. "Wie wird der Erfolg gemessen (KPIs, Business Goals)?"
8. "Gibt es K.o.-Kriterien (Must-haves vs. Nice-to-haves)?"
`,

  "agile-user-story": `
DOKUMENTTYP: Agile User Story
Verwende das 3C-Modell (Card, Conversation, Confirmation):

**Card:** Kurze Beschreibung im Format "Als [Rolle] möchte ich [Funktionalität], damit [Nutzen/Ziel]"
**Conversation:** Erinnerung, dass Details im Gespräch geklärt werden
**Confirmation:** Akzeptanzkriterien als Validierungsbasis

TEMPLATE:
## Titel: [Prägnanter Titel]

**Als** [Rolle/Persona]
**möchte ich** [Funktionalität/Ziel]
**damit** [Geschäftswert/Nutzen]

### Akzeptanzkriterien (Given-When-Then):
1. GIVEN [Kontext/Vorbedingung]
   WHEN [Aktion]
   THEN [Erwartetes Ergebnis]
2. ...

### Weitere Details:
- **Wireframe/Mockup:** [Link oder Beschreibung]
- **Technische Notizen:** [Randbedingungen]
- **Abhängigkeiten:** [Story-IDs]
- **Priorität:** [MoSCoW: Must-have / Should-have / Could-have / Won't-have]

INVEST-KRITERIEN PRÜFEN:
- **I**ndependent: Unabhängig von anderen Stories
- **N**egotiable: Verhandelbar, nicht in Stein gemeißelt
- **V**aluable: Liefert Wert für Benutzer oder Geschäft
- **E**stimable: Aufwandsschätzung möglich
- **S**mall: Klein genug für einen Sprint
- **T**estable: Akzeptanzkriterien sind testbar

Falls eine Story NICHT INVEST-konform ist, gib Hinweise und Splitting-Vorschläge:
- Nach Workflow-Schritten splitten
- Nach Business Rules splitten
- Nach CRUD-Operationen splitten
- Nach Daten-Variationen splitten
- Nach Akzeptanzkriterien splitten

QUALITÄTSKRITERIEN:
- Das "damit" ist NICHT optional – es zeigt den Business Value
- "Als Benutzer" ist zu allgemein → Konkrete Rolle oder Persona verwenden
- Jedes Akzeptanzkriterium muss binär überprüfbar sein (erfüllt/nicht erfüllt)
- Eine Story = Ein Sprint (oder weniger)
- Fokus auf WAS, nicht WIE

SOKRATISCHE FRAGEN FÜR DIESEN TYP:
1. "Welche Rolle/Persona führt diese Aktion aus?"
2. "Was ist der konkrete Geschäftswert (das 'damit')?"
3. "Wie wird geprüft, dass die Story erfolgreich umgesetzt ist (Akzeptanzkriterien)?"
4. "Gibt es Abhängigkeiten zu anderen Stories?"
5. "Ist die Story klein genug für einen Sprint?"
6. "Wie wird der Aufwand geschätzt (Story Points)?"
`,

  "feature-spec": `
DOKUMENTTYP: Feature Spezifikation
Detaillierte technische Beschreibung eines Features mit professioneller Struktur:

## 1. Feature Overview
- Feature-Name und ID
- Kurzbeschreibung (1-2 Sätze)
- Geschäftswert und Priorität

## 2. User Stories oder Use Cases
- Primäre User Journeys
- Alternative Flows (Happy Path, Error Cases)

## 3. Funktionale Anforderungen
- Detaillierte Beschreibung der Funktionalität
- Input/Output-Spezifikation
- Business Rules (Geschäftsregeln)
- Validierungsregeln
- Jede Anforderung mit ID (FR-001, ...)

## 4. UI/UX-Spezifikation
- Wireframes oder Mockups (falls vorhanden)
- Interaktionsflüsse
- Accessibility-Anforderungen

## 5. Datenmodell
- Entitäten und Attribute
- Beziehungen zwischen Entitäten
- Datenvalidierung und -typen

## 6. Qualitätsanforderungen
- Performance-Anforderungen (messbar!)
- Security-Anforderungen (Authentifizierung, Autorisierung)
- Usability-Anforderungen

## 7. Schnittstellen
- API-Endpunkte (Methode, URL, Request/Response-Formate)
- Integration mit anderen Systemen
- Datenformate (JSON, XML, etc.)

## 8. Fehlerbehandlung
- Error-Szenarien
- Fehlermeldungen für Benutzer
- Logging und Monitoring

## 9. Akzeptanzkriterien und Test Cases
- Functional Test Cases (Given-When-Then)
- Edge Cases
- Performance Test Criteria

## 10. Offene Punkte und Risiken
- Ungelöste Fragen
- Technische Risiken
- Abhängigkeiten

QUALITÄTSKRITERIEN:
- Ausreichend detailliert für Entwickler UND Tester
- API-Signaturen, Datentypen, Formate exakt spezifizieren
- Alle Flows (Happy Path, Error Cases, Edge Cases) abdecken
- Jede Anforderung zurückverfolgbar zu Business Goal oder User Story
- Für jede Anforderung ist klar, wie sie getestet wird

SOKRATISCHE FRAGEN FÜR DIESEN TYP:
1. "Welche User Journeys soll das Feature unterstützen?"
2. "Welche Daten werden benötigt (Entitäten, Attribute, Typen)?"
3. "Welche Business Rules gelten (Validierungen, Berechnungen)?"
4. "Welche Schnittstellen zu anderen Systemen existieren?"
5. "Welche Error-Szenarien müssen behandelt werden?"
6. "Wie sehen Mockups/Wireframes aus (falls UI-relevant)?"
7. "Welche Performance-Anforderungen gibt es (Antwortzeit, Durchsatz)?"
8. "Welche Security-Anforderungen sind relevant (Auth, Encryption, etc.)?"
`,

  "lastenheft-light": `
DOKUMENTTYP: Lastenheft (an IEEE 830 / ISO 29148 angelehnt)
Verwende formelle Sprache, vollständige Sätze und Sie-Anrede:

## 1. Einführung
- Zweck des Dokuments
- Scope (Umfang)
- Definitionen, Akronyme, Abkürzungen (Glossar)
- Referenzen auf andere Dokumente
- Übersicht über das Dokument

## 2. Allgemeine Beschreibung
- Produktperspektive (Systemkontext nach Zwiebelschalenmodell)
- Produktfunktionen (Überblick)
- Benutzercharakteristiken (Personas, Rollen)
- Constraints (Randbedingungen)
- Annahmen und Abhängigkeiten

## 3. Spezifische Anforderungen
### 3.1 Funktionale Anforderungen
- Gruppiert nach Features oder Use Cases
- Jede Anforderung mit ID (FA-001, FA-002, ...)
- Beschreibung, Input, Output, Verhalten
- Priorität: Muss / Soll / Kann

### 3.2 Qualitätsanforderungen
- Performance (Antwortzeit, Durchsatz, Ressourcennutzung)
- Sicherheit (Authentifizierung, Autorisierung, Verschlüsselung)
- Zuverlässigkeit (MTBF, MTTR, Verfügbarkeit)
- Usability (Lernzeit, Effizienz, Fehlertoleranz)
- Wartbarkeit (Testbarkeit, Modifizierbarkeit)
- Portabilität (Plattformen, Browser, Geräte)

### 3.3 Schnittstellen
- Benutzer-Schnittstellen (UI-Beschreibung, Screen Flows)
- Software-Schnittstellen (APIs, Protokolle)
- Kommunikations-Schnittstellen

### 3.4 Daten-Anforderungen
- Datenmodell (Entitäten, Beziehungen)
- Datenformate
- Datenmigration (falls relevant)

## 4. Anhänge
- Glossar (falls nicht in Einführung)
- Analyse-Modelle
- Änderungshistorie

QUALITÄTSKRITERIEN:
- Vollständigkeit: Alle relevanten Anforderungen erfasst
- Konsistenz: Keine widersprüchlichen Anforderungen
- Eindeutigkeit: Jede Anforderung hat nur eine Interpretation
- Verständlichkeit: Auch für technisch weniger versierte Stakeholder lesbar
- Überprüfbarkeit: Jede Anforderung kann getestet werden
- Verfolgbarkeit: Jede Anforderung mit eindeutiger ID
- Keine Lösungsbeschreibung: WAS, nicht WIE (Lösung ist im Pflichtenheft)

SOKRATISCHE FRAGEN FÜR DIESEN TYP:
1. "Wer ist der Auftraggeber/Kunde?"
2. "Was ist der Scope (Umfang) des Systems?"
3. "Welche Stakeholder sind betroffen (Zwiebelschalenmodell)?"
4. "Welche funktionalen Anforderungen gibt es (gruppiert nach Features)?"
5. "Welche Qualitätsanforderungen sind kritisch (Performance, Security, Usability)?"
6. "Welche Schnittstellen zu anderen Systemen existieren?"
7. "Welche Constraints (Randbedingungen) müssen beachtet werden?"
8. "Welche Annahmen über die Umgebung werden getroffen?"
9. "Gibt es rechtliche oder Compliance-Anforderungen?"
10. "Wie wird der Erfolg gemessen (Abnahmekriterien)?"
`,

  "sdd-spec": `
DOKUMENTTYP: Specification-Driven Development (SDD)
Die Spezifikation muss als "Single Source of Truth" für Test-Driven Development dienen. Sie muss so detailliert sein, dass ein Entwickler oder KI-Coding-Tool sie direkt umsetzen kann:

## 1. Feature Overview
- Feature-Name und ID
- Business Value
- Priorität

## 2. Behavior Specification (BDD-Style)
- Format: Given-When-Then (Gherkin-Style)
- Konkrete Szenarien für Happy Path, Error Cases, Edge Cases
- Beispiel:
  GIVEN ein angemeldeter Benutzer mit Rolle "Admin"
  WHEN er die Benutzerliste aufruft
  THEN sieht er alle Benutzer mit Name, E-Mail und Rolle

## 3. Acceptance Criteria (Formal)
- Für jedes Szenario: Präzise Definition von Input, Output, State Changes
- Erwartetes Verhalten bei Edge Cases

## 4. Data Specifications
- Datenmodell mit exakten Typen
- Validierungsregeln (z.B. "E-Mail muss RFC 5322 konform sein")
- Beispiel-Daten für Tests

## 5. API Contract (falls relevant)
- Endpoints (URL, HTTP-Methode)
- Request-Format (JSON-Schema)
- Response-Format (JSON-Schema)
- Error-Codes und Error-Messages
- Beispiel-Requests und -Responses

## 6. State Transitions
- State Machine Diagramm (falls zustandsbasiert)
- Transitions: Event → Action → New State

## 7. Non-Functional Requirements (Measurable)
- Performance: "API-Response < 200ms für 95% der Requests"
- Security: "Passwörter müssen mit bcrypt gehashed werden (cost factor 12)"
- Availability: "99.9% Uptime (SLA)"

## 8. Test Strategy
- Unit Test Coverage: "Min. 80% Code Coverage"
- Integration Test Scenarios
- E2E Test Scenarios

QUALITÄTSKRITERIEN:
- Executable Specifications: Szenarien direkt in automatisierte Tests überführbar
- Präzision: Keine Interpretationsspielräume (exakte Datentypen, Formate)
- Vollständigkeit: Alle Szenarien (Happy Path, Error Cases, Edge Cases) abgedeckt
- Beispiel-basiert: Konkrete Beispiele statt abstrakte Beschreibungen
- Living Documentation: Spezifikation bleibt synchron mit Code

SOKRATISCHE FRAGEN FÜR DIESEN TYP:
1. "Welche Szenarien soll das Feature abdecken (Happy Path, Error Cases, Edge Cases)?"
2. "Welche Datentypen und Validierungen sind erforderlich?"
3. "Welche API-Endpunkte werden benötigt (Methode, URL, Request/Response)?"
4. "Welche State Transitions gibt es (bei zustandsbasierten Systemen)?"
5. "Welche messbaren Qualitätsanforderungen gelten (Performance, Security)?"
6. "Wie sehen Beispiel-Daten für Tests aus?"
7. "Welche Test-Strategie wird verfolgt (Unit, Integration, E2E)?"
8. "Welche Error-Codes und Error-Messages sollen verwendet werden?"
`,
  "competitive-analysis": `
DOKUMENTTYP: Wettbewerbsanalyse
Erstelle eine strukturierte Wettbewerbsanalyse mit folgender Struktur:

## 1. Marktübersicht
- Marktgröße und Wachstum
- Marktsegmente und Trends

## 2. Wettbewerber-Übersicht
- Direkte Wettbewerber (gleiche Zielgruppe, gleiches Problem)
- Indirekte Wettbewerber (alternatives Lösungsangebot)
- Potenzielle Wettbewerber (Markteintritt möglich)

## 3. Feature-Vergleichsmatrix
FORMATIERUNG: Markdown-Tabelle mit Spalten: | Feature | Eigenes Produkt | Wettbewerber A | Wettbewerber B | ...
Bewertung: ✅ Vorhanden | ⚠️ Teilweise | ❌ Fehlt

## 4. SWOT-Analyse
| | Positiv | Negativ |
|---|---|---|
| Intern | Stärken | Schwächen |
| Extern | Chancen | Risiken |

## 5. Positionierung & Differenzierung
- USP (Unique Selling Proposition)
- Wertversprechen vs. Wettbewerb
- Preispositionierung

## 6. Strategische Empfehlungen
- Kurzfristige Maßnahmen (0-3 Monate)
- Mittelfristige Strategie (3-12 Monate)
- Langfristige Vision

SOKRATISCHE FRAGEN:
1. "Welches Produkt oder welche Idee soll analysiert werden?"
2. "Wer sind die Hauptwettbewerber?"
3. "Was ist das Kernproblem, das gelöst wird?"
4. "Welche Zielgruppe wird adressiert?"
5. "Was ist der aktuelle Stand des eigenen Produkts?"
`,

  "product-roadmap": `
DOKUMENTTYP: Product Roadmap
Erstelle eine strategische Product Roadmap:

## 1. Produktvision & Strategie
- Langfristige Vision (2-3 Jahre)
- Strategische Ziele (SMART)
- Strategische Säulen/Themes

## 2. Now (Aktuell – 0-3 Monate)
| Initiative | Ziel | Status | Owner |
|---|---|---|---|
| ... | ... | ... | ... |

## 3. Next (Geplant – 3-6 Monate)
| Initiative | Ziel | Abhängigkeiten | Priorität |
|---|---|---|---|
| ... | ... | ... | ... |

## 4. Later (Zukunft – 6-12 Monate)
| Initiative | Hypothese | Validierungsbedarf |
|---|---|---|
| ... | ... | ... |

## 5. Priorisierungs-Framework
- RICE Score oder WSJF für jede Initiative
- MoSCoW-Kategorisierung

## 6. Meilensteine & Releases
- Timeline mit Key Dates
- Release-Ziele und Erfolgskriterien

## 7. Risiken & Abhängigkeiten
- Technische Abhängigkeiten
- Ressourcen-Engpässe
- Markt-Risiken

SOKRATISCHE FRAGEN:
1. "Was ist die Produktvision?"
2. "Welche strategischen Ziele verfolgen Sie?"
3. "Was sind die wichtigsten Initiativen/Features?"
4. "Welche Abhängigkeiten zwischen Features gibt es?"
5. "Welche Ressourcen stehen zur Verfügung?"
`,

  "press-release": `
DOKUMENTTYP: Press Release (Working Backwards – Amazon-Methode)
Schreibe vom Kundennutzen rückwärts:

## Überschrift
[Aufmerksamkeitsstarke Headline, max. 1 Zeile]

## Subheadline
[Wer ist die Zielgruppe und was ist der Kern-Benefit?]

## Einleitung (Paragraph 1)
- Zusammenfassung: Was, Für wen, Warum jetzt?
- Ort, Datum (fiktiv in der Zukunft)

## Problem
- Welches Problem haben Kunden heute?
- Warum ist die aktuelle Situation unbefriedigend?
- Konkrete Beispiele für den Pain

## Lösung
- Wie löst das Produkt das Problem?
- Was ist das Kundenerlebnis?
- Kernfeatures (max. 3-5)

## Kundenzitat (fiktiv)
"[Begeistertes Zitat eines fiktiven Kunden]"
– [Name, Rolle, Unternehmen]

## Wie es funktioniert
- Schritt 1: ...
- Schritt 2: ...
- Schritt 3: ...

## Leadership-Zitat
"[Strategische Vision]"
– [Name, Titel]

## Call to Action
- Wie können Kunden starten?
- Verfügbarkeit, Pricing (falls relevant)

## FAQ (Intern)
- Häufige interne Fragen und Antworten

SOKRATISCHE FRAGEN:
1. "Was ist die Produktidee in einem Satz?"
2. "Wer ist der ideale Kunde?"
3. "Welches Problem wird gelöst?"
4. "Warum ist jetzt der richtige Zeitpunkt?"
5. "Was unterscheidet die Lösung von Alternativen?"
`,

  "one-pager": `
DOKUMENTTYP: 1-Pager (Executive Summary)
Kompakte Zusammenfassung auf einer Seite:

## Produktname
[Name und ggf. Tagline]

## Problem
[2-3 Sätze: Welches Problem wird gelöst?]

## Lösung
[2-3 Sätze: Wie wird das Problem gelöst?]

## Zielgruppe
[Wer sind die primären Nutzer/Kunden?]

## Marktgröße
[TAM/SAM/SOM oder qualitative Einschätzung]

## Wettbewerb & Differenzierung
[Was macht die Lösung einzigartig?]

## Geschäftsmodell
[Wie wird Geld verdient?]

## Key Metrics / KPIs
| Metrik | Zielwert | Zeitrahmen |
|---|---|---|
| ... | ... | ... |

## Nächste Schritte
[Top 3 Prioritäten]

## Ask / Bedarf
[Was wird benötigt? Budget, Team, Ressourcen]

SOKRATISCHE FRAGEN:
1. "Was ist die Kernidee in einem Satz?"
2. "Welches Problem lösen Sie?"
3. "Wer bezahlt dafür und warum?"
4. "Was ist die größte Unbekannte/das größte Risiko?"
`,

  "go-to-market": `
DOKUMENTTYP: Go-to-Market Strategy
Markteinführungsstrategie:

## 1. Produktübersicht
- Produkt/Feature-Beschreibung
- Value Proposition
- Unique Selling Points

## 2. Zielmarkt & Segmentierung
- Ideales Kundenprofil (ICP)
- Marktsegmente nach Priorität
- Buyer Personas

## 3. Positionierung & Messaging
- Positionierungs-Statement
- Key Messages pro Segment
- Elevator Pitch

## 4. Preismodell
- Preisstrategie (Penetration, Skimming, Value-based)
- Preispunkte und Packaging
- Vergleich zum Wettbewerb

## 5. Vertriebskanäle
- Direct Sales
- Self-Service / PLG
- Partner / Reseller
- Marketplace

## 6. Marketing-Plan
| Kanal | Maßnahme | Timeline | Budget | KPI |
|---|---|---|---|---|
| ... | ... | ... | ... | ... |

## 7. Launch-Timeline
- Pre-Launch (T-30 bis T-7)
- Launch Day
- Post-Launch (T+1 bis T+30)

## 8. Erfolgsmessung
- North Star Metric
- Leading Indicators
- Lagging Indicators

SOKRATISCHE FRAGEN:
1. "Was wird gelauncht (neues Produkt, Feature, Markt)?"
2. "Wer ist der ideale Erstkunde?"
3. "Wie sieht der Kaufprozess des Kunden aus?"
4. "Welche Kanäle nutzt die Zielgruppe?"
5. "Was ist das Budget?"
`,

  "technical-spec": `
DOKUMENTTYP: Technische Spezifikation

## 1. Überblick
- Projektname und Kontext
- Problemstellung
- Vorgeschlagene Lösung (High-Level)

## 2. Architektur
- Systemarchitektur-Diagramm (textuell beschrieben)
- Komponenten und deren Verantwortlichkeiten
- Technologie-Stack

## 3. Datenmodell
- Entitäten und Beziehungen
- Datenbankschema (Tabellen, Spalten, Typen)
- Indizes und Constraints

## 4. API-Design
| Endpoint | Methode | Beschreibung | Auth |
|---|---|---|---|
| ... | ... | ... | ... |

Für jeden Endpoint: Request/Response-Schema

## 5. Sicherheit
- Authentifizierung & Autorisierung
- Datenschutz (DSGVO)
- Input-Validierung
- Rate Limiting

## 6. Performance
- SLAs und Latenz-Ziele
- Caching-Strategie
- Skalierungsansatz

## 7. Implementierungsplan
- Phasen mit Meilensteinen
- Aufwandsschätzung
- Technische Risiken und Mitigationen

## 8. Testplan
- Unit Tests
- Integration Tests
- Load Tests
- Test-Daten

SOKRATISCHE FRAGEN:
1. "Was soll technisch umgesetzt werden?"
2. "Welcher Tech-Stack wird verwendet?"
3. "Welche bestehenden Systeme müssen integriert werden?"
4. "Welche Performance-Anforderungen gibt es?"
5. "Welche Sicherheitsanforderungen bestehen?"
`,

  "launch-plan": `
DOKUMENTTYP: Launch Plan

## 1. Launch-Übersicht
- Produkt/Feature
- Launch-Datum
- Launch-Typ (Soft Launch, Hard Launch, Beta)
- Erfolgskriterien

## 2. Pre-Launch Checkliste
| Aufgabe | Owner | Deadline | Status |
|---|---|---|---|
| Feature-Freeze | Engineering | T-14 | ⬜ |
| QA Sign-off | QA | T-7 | ⬜ |
| Dokumentation fertig | Tech Writing | T-5 | ⬜ |
| Marketing-Material | Marketing | T-5 | ⬜ |
| Support-Training | CS | T-3 | ⬜ |
| Staging-Test | Engineering | T-2 | ⬜ |
| Go/No-Go Meeting | All | T-1 | ⬜ |

## 3. Launch-Day Plan
- Stündlicher Ablauf
- Verantwortlichkeiten
- Kommunikationskanäle
- Monitoring-Dashboard

## 4. Rollback-Plan
- Rollback-Trigger (Wann wird zurückgerollt?)
- Rollback-Prozess
- Kommunikation bei Rollback

## 5. Post-Launch Monitoring
| Metrik | Erwartung | Alarm-Schwelle |
|---|---|---|
| Error Rate | < 1% | > 5% |
| Latenz P95 | < 500ms | > 2s |
| ... | ... | ... |

## 6. Post-Launch Review
- T+1 Tag: Quick Review
- T+7 Tage: Erste Metriken
- T+30 Tage: Comprehensive Review

SOKRATISCHE FRAGEN:
1. "Was wird gelauncht?"
2. "Wann ist der geplante Launch-Termin?"
3. "Welche Teams sind beteiligt?"
4. "Was sind die kritischsten Risiken?"
5. "Was sind die Go/No-Go-Kriterien?"
`,

  "okr-template": `
DOKUMENTTYP: OKR (Objectives & Key Results)

## Zeitraum: [Q1/Q2/Q3/Q4 YYYY]

### Objective 1: [Ambitioniertes, qualitatives Ziel]
| # | Key Result | Metrik | Start | Ziel | Aktuell |
|---|---|---|---|---|---|
| KR1 | ... | ... | ... | ... | ... |
| KR2 | ... | ... | ... | ... | ... |
| KR3 | ... | ... | ... | ... | ... |

**Initiativen:**
- Initiative 1: ...
- Initiative 2: ...

### Objective 2: [Weiteres Ziel]
| # | Key Result | Metrik | Start | Ziel | Aktuell |
|---|---|---|---|---|---|
| KR1 | ... | ... | ... | ... | ... |
| KR2 | ... | ... | ... | ... | ... |
| KR3 | ... | ... | ... | ... | ... |

### Objective 3: [Weiteres Ziel]
...

## Alignment
- Wie tragen diese OKRs zur Unternehmensstrategie bei?
- Abhängigkeiten zu anderen Teams

## Retrospektive (am Ende des Zeitraums)
| OKR | Score (0-1.0) | Erkenntnisse |
|---|---|---|
| O1-KR1 | ... | ... |

REGELN FÜR GUTE OKRs:
- Objectives: Qualitativ, inspirierend, ambitioniert (70% Zielerreichung = gut)
- Key Results: Quantitativ, messbar, zeitgebunden
- Max. 3-5 Objectives pro Quartal
- Max. 3-5 Key Results pro Objective
- Keine Aktivitäten als Key Results (Output ≠ Outcome)

SOKRATISCHE FRAGEN:
1. "Welcher Zeitraum?"
2. "Was sind die übergeordneten Unternehmensziele?"
3. "Was sind die wichtigsten Herausforderungen?"
4. "Welche Metriken werden aktuell schon getrackt?"
5. "Was wäre ein ambitioniertes aber erreichbares Ziel?"
`,

  "stakeholder-map": `
DOKUMENTTYP: Stakeholder Map & Analyse

## 1. Stakeholder-Identifikation
### Zwiebelschalenmodell:
- **Kern (direkt betroffen):** Nutzer, Auftraggeber, Projektteam
- **Umgebungssystem:** Angrenzende Abteilungen, Partner
- **Weiteres Umfeld:** Regulatoren, Markt, Gesellschaft

## 2. Stakeholder-Matrix (Einfluss × Interesse)

| Stakeholder | Rolle | Einfluss (1-5) | Interesse (1-5) | Strategie |
|---|---|---|---|---|
| ... | ... | ... | ... | Eng einbinden / Zufriedenstellen / Informieren / Beobachten |

## 3. Stakeholder-Profile
Für jeden Key-Stakeholder:
- **Name/Rolle:**
- **Ziele & Erwartungen:**
- **Bedenken & Risiken:**
- **Einfluss auf das Projekt:**
- **Bevorzugte Kommunikation:**

## 4. Kommunikationsplan
| Stakeholder(-Gruppe) | Frequenz | Format | Inhalt | Verantwortlich |
|---|---|---|---|---|
| ... | Wöchentlich | Meeting | Statusupdate | PM |

## 5. Engagement-Strategie
- **Manage Closely** (hoher Einfluss, hohes Interesse): ...
- **Keep Satisfied** (hoher Einfluss, geringes Interesse): ...
- **Keep Informed** (geringer Einfluss, hohes Interesse): ...
- **Monitor** (geringer Einfluss, geringes Interesse): ...

## 6. Konflikte & Risiken
- Potenzielle Interessenkonflikte
- Risiken durch Stakeholder-Widerstand
- Mitigationsstrategien

SOKRATISCHE FRAGEN:
1. "Um welches Projekt/Produkt geht es?"
2. "Wer sind die offensichtlichen Stakeholder?"
3. "Wer könnte indirekt betroffen sein?"
4. "Gibt es bekannte Konflikte oder Widerstände?"
5. "Wie wird aktuell mit Stakeholdern kommuniziert?"
`,
};
