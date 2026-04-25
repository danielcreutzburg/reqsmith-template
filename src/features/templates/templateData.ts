import type { Template } from "@/types/chat";

export const templates: Template[] = [
  {
    id: "modern-prd",
    name: "Modernes PRD",
    description: "Professionelles Product Requirements Document mit SMART-Zielen, Stakeholder-Analyse und ISO 25010 Qualitätsanforderungen",
    systemPromptAddition: `DOKUMENTTYP: Product Requirements Document (PRD) – Professionelle Struktur mit 10 Abschnitten, ID-Schema für Anforderungen und messbaren Qualitätsszenarien.`,
  },
  {
    id: "agile-user-story",
    name: "Agile User Story",
    description: "3C-Modell (Card, Conversation, Confirmation) mit INVEST-Prüfung, MoSCoW-Priorisierung und Definition of Ready",
    systemPromptAddition: `DOKUMENTTYP: Agile User Story – 3C-Modell mit INVEST-Kriterien, Given-When-Then Akzeptanzkriterien und Splitting-Vorschlägen.`,
  },
  {
    id: "competitive-analysis",
    name: "Wettbewerbsanalyse",
    description: "Strukturierte Analyse der Wettbewerbslandschaft mit Feature-Vergleich, SWOT und strategischen Empfehlungen",
    systemPromptAddition: `DOKUMENTTYP: Wettbewerbsanalyse`,
  },
  {
    id: "product-roadmap",
    name: "Product Roadmap",
    description: "Strategische Roadmap mit Zeitachsen, Meilensteinen, Priorisierung und Abhängigkeiten",
    systemPromptAddition: `DOKUMENTTYP: Product Roadmap`,
  },
  {
    id: "press-release",
    name: "Press Release (Working Backwards)",
    description: "Amazon-Style: Vom Kundennutzen rückwärts arbeiten mit FAQ und Kundenreaktion",
    systemPromptAddition: `DOKUMENTTYP: Press Release (Working Backwards)`,
  },
  {
    id: "one-pager",
    name: "1-Pager",
    description: "Kompakte Zusammenfassung einer Produktidee auf einer Seite für schnelle Stakeholder-Entscheidungen",
    systemPromptAddition: `DOKUMENTTYP: 1-Pager`,
  },
  {
    id: "go-to-market",
    name: "Go-to-Market Strategy",
    description: "Markteinführungsstrategie mit Zielgruppe, Positionierung, Kanälen und Erfolgsmetriken",
    systemPromptAddition: `DOKUMENTTYP: Go-to-Market Strategy`,
  },
  {
    id: "technical-spec",
    name: "Technical Spec",
    description: "Technische Spezifikation mit Architektur, Datenmodell, API-Design und Implementierungsplan",
    systemPromptAddition: `DOKUMENTTYP: Technical Specification`,
  },
  {
    id: "launch-plan",
    name: "Launch Plan",
    description: "Strukturierter Produktlaunch mit Timeline, Checklisten, Rollback-Plan und Erfolgskriterien",
    systemPromptAddition: `DOKUMENTTYP: Launch Plan`,
  },
  {
    id: "okr-template",
    name: "OKR Template",
    description: "Objectives & Key Results mit messbaren Zielen, Initiativen und Fortschrittsverfolgung",
    systemPromptAddition: `DOKUMENTTYP: OKR Template`,
  },
  {
    id: "stakeholder-map",
    name: "Stakeholder Map",
    description: "Stakeholder-Analyse mit Einfluss-/Interessenmatrix, Kommunikationsplan und Engagement-Strategie",
    systemPromptAddition: `DOKUMENTTYP: Stakeholder Map`,
  },
  {
    id: "feature-spec",
    name: "Feature Spezifikation",
    description: "Detaillierte technische Feature-Beschreibung mit Business Rules, API-Design und Test Cases",
    systemPromptAddition: `DOKUMENTTYP: Feature Spezifikation`,
  },
];
