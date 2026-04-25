import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { Navigate } from "react-router-dom";
import { Home } from "lucide-react";
import { OnboardingTour } from "@/components/OnboardingTour";
import { useChat } from "@/features/chat/hooks/useChat";
import { useUsage } from "@/features/chat/hooks/useUsage";
import { useSavedPrompts } from "@/features/chat/hooks/useSavedPrompts";
import { useIndexSessionDocument } from "@/features/sessions/hooks/useIndexSessionDocument";
import { ChatPanel } from "@/features/chat/components/ChatPanel";
import { DocumentEditor } from "@/features/editor/components/DocumentEditor";
import { SessionSidebar } from "@/features/sessions/components/SessionSidebar";
import { Dashboard } from "@/features/dashboard/components/Dashboard";
import { MainLayout } from "@/components/layout/MainLayout";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { useSessions } from "@/features/sessions/hooks/useSessions";
import { useCustomTemplates } from "@/features/templates/hooks/useCustomTemplates";
import { useGlossary } from "@/features/glossary/hooks/useGlossary";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useToast } from "@/hooks/use-toast";
import { useKeyboardShortcuts, type ShortcutAction } from "@/hooks/useKeyboardShortcuts";
import { KeyboardShortcutsOverlay } from "@/components/KeyboardShortcutsOverlay";
import type { Template, ChatMode } from "@/types/chat";
import { templates } from "@/features/templates/templateData";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePersonaSettings } from "@/features/chat/hooks/usePersonaSettings";
import { useAchievements } from "@/features/gamification/hooks/useAchievements";


const Index = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(templates[0]);
  const [chatMode, setChatMode] = useState<ChatMode>("direct");
  const isMobile = useIsMobile();
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const { asTemplates: customTpls, createTemplate } = useCustomTemplates();
  const savedPrompts = useSavedPrompts();
  const usage = useUsage();
  const glossary = useGlossary();
  const personaSettings = usePersonaSettings();
  const achievements = useAchievements();
  const {
    sessions,
    activeSessionId,
    setActiveSessionId,
    createSession,
    deleteSession,
    updateSessionDocument,
    updateSessionTitle,
    duplicateSession,
  } = useSessions();

  const {
    docStore,
    proposals,
    versions,
    saveVersion,
    handleDocumentReplace,
    handleChatPatchOperations,
    handleAcceptChange,
    handleAcceptWithEdit,
    handleRejectChange,
    handleAcceptAll,
    handleRejectAll,
    handleConflict,
    handleDocumentEdit,
    handleRestoreVersion,
  } = useIndexSessionDocument({ activeSessionId, updateSessionDocument });

  const { messages, isLoading, phase, sendMessage, resetChat } = useChat({
    selectedTemplate,
    sessionId: activeSessionId,
    mode: chatMode,
    glossaryContext: glossary.glossaryContext,
    currentDocument: docStore.markdown,
    onDocumentReplace: handleDocumentReplace,
    onPatchOperations: handleChatPatchOperations,
    onTitleUpdate: updateSessionTitle,
    onUsageRefetch: () => { usage.refetch(); achievements.checkBadges(); },
    
    persona: personaSettings.persona,
    verbosity: personaSettings.verbosity,
  });

  useAutoSave({
    sessionId: activeSessionId,
    content: docStore.markdown,
    onConflict: handleConflict,
  });

  const handleSendWithTracking = useCallback(
    (message: string, fileContext?: string) => {
      savedPrompts.trackPrompt(message);
      return sendMessage(message, fileContext);
    },
    [sendMessage, savedPrompts.trackPrompt]
  );

  // Save version whenever document changes significantly (debounced on streaming end)
  const prevDocRef = useRef("");
  useEffect(() => {
    if (!isLoading && docStore.markdown && docStore.markdown !== prevDocRef.current && docStore.markdown.length > 50) {
      saveVersion(docStore.markdown);
      prevDocRef.current = docStore.markdown;
    }
  }, [isLoading, docStore.markdown, saveVersion]);

  const handleSectionEdit = useCallback(
    (sectionTitle: string) => {
      const prompt = t("doc.section.editPrompt", { section: sectionTitle });
      sendMessage(prompt);
    },
    [sendMessage, t]
  );

  const handleDocumentImport = useCallback(
    (content: string) => {
      docStore.loadFromMarkdown(content);
      if (activeSessionId) updateSessionDocument(activeSessionId, content);
      saveVersion(content);
      const prompt = t("import.improvePrompt" as any);
      sendMessage(prompt);
    },
    [docStore, activeSessionId, updateSessionDocument, saveVersion, sendMessage, t]
  );

  const handleDuplicate = useCallback(async (sessionId: string) => {
    const result = await duplicateSession(sessionId);
    if (result) {
      toast({ title: t("session.duplicated") });
    }
  }, [duplicateSession, toast, t]);

  const handleSaveAsTemplate = useCallback(async (sessionId: string) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (!session || !session.document) return;

    try {
      await createTemplate(
        session.title,
        `Erstellt aus: ${session.title}`,
        `Verwende dieses Dokument als Vorlage und Struktur:\n\n${session.document.slice(0, 2000)}`
      );
      toast({ title: t("session.savedAsTemplate") });
    } catch {
      toast({ title: "Fehler", variant: "destructive" });
    }
  }, [sessions, createTemplate, toast, t]);

  // --- Keyboard Shortcuts (must be before early returns) ---
  const shortcuts = useMemo<ShortcutAction[]>(() => [
    {
      key: "n", ctrl: true,
      label: "Neue Session", labelEn: "New Session",
      category: "Navigation",
      action: () => {
        resetChat();
        docStore.reset();
        proposals.clear();
        createSession(selectedTemplate?.id ?? null, t("session.defaultTitle"));
      },
    },
    {
      key: "s", ctrl: true,
      label: "Dokument speichern", labelEn: "Save Document",
      category: "Editor",
      action: () => {
        if (activeSessionId && docStore.markdown) {
          updateSessionDocument(activeSessionId, docStore.markdown);
          saveVersion(docStore.markdown);
          toast({ title: "Gespeichert ✓" });
        }
      },
    },
    {
      key: "d", ctrl: true,
      label: "Dashboard", labelEn: "Dashboard",
      category: "Navigation",
      action: () => setActiveSessionId(null),
    },
    {
      key: "k", ctrl: true,
      label: "Suche", labelEn: "Search",
      category: "Navigation",
      action: () => {}, // Already handled by SearchBar
    },
  ], [activeSessionId, docStore.markdown, updateSessionDocument, saveVersion, toast, t, resetChat, docStore, proposals, createSession, selectedTemplate, setActiveSessionId]);

  const { showOverlay, setShowOverlay } = useKeyboardShortcuts(shortcuts);

  if (authLoading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const handleNewSession = async () => {
    resetChat();
    docStore.reset();
    proposals.clear();
    await createSession(selectedTemplate?.id ?? null, t("session.defaultTitle"));
  };

  const handleSelectSession = (sessionId: string) => {
    proposals.clear();
    setActiveSessionId(sessionId);
    const session = sessions.find((s) => s.id === sessionId);
    if (session?.template_id) {
      const allTemplates = [...templates, ...customTpls];
      const tpl = allTemplates.find((t) => t.id === session.template_id);
      if (tpl) setSelectedTemplate(tpl);
    }
  };

  const handleReset = async () => {
    resetChat();
    docStore.reset();
    proposals.clear();
    await createSession(selectedTemplate?.id ?? null, t("session.defaultTitle"));
  };

  const handleSelectTemplate = (template: Template) => {
    setSelectedTemplate(template);
    if (messages.length > 0) {
      handleReset();
    }
  };

  const showDashboard = !activeSessionId;
  const templateLocked = messages.length > 0;

  const promptHistoryProps = {
    frequentPrompts: savedPrompts.frequent,
    favoritePrompts: savedPrompts.favorites,
    onToggleFavorite: savedPrompts.toggleFavorite,
    onDeletePrompt: savedPrompts.deletePrompt,
    persona: personaSettings.persona,
    verbosity: personaSettings.verbosity,
    onPersonaChange: personaSettings.updatePersona,
    onVerbosityChange: personaSettings.updateVerbosity,
  };

  // Diff review props passed to DocumentEditor
  const diffReviewProps = {
    proposedChanges: proposals.proposedChanges,
    onAcceptChange: handleAcceptChange,
    onAcceptWithEdit: handleAcceptWithEdit,
    onRejectChange: handleRejectChange,
    onAcceptAll: handleAcceptAll,
    onRejectAll: handleRejectAll,
  };

  const mainContent = showDashboard ? (
    <Dashboard
      sessions={sessions}
      usageRemaining={usage.remaining}
      usageMax={usage.maxMessages}
      onSelectSession={handleSelectSession}
      onNewSession={handleNewSession}
      onImport={() => { handleNewSession(); }}
      achievements={achievements}
    />
  ) : isMobile ? (
    <Tabs defaultValue="chat" className="flex flex-col h-full">
      <div className="flex items-center mx-4 mt-2 gap-2">
        <Button variant="ghost" size="icon" className="shrink-0" onClick={() => setActiveSessionId(null)} aria-label="Zurück zum Dashboard">
          <Home className="w-4 h-4" />
        </Button>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="chat">{t("tabs.chat")}</TabsTrigger>
          <TabsTrigger value="document">{t("tabs.document")}</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="chat" className="flex-1 overflow-hidden m-0">
        <ChatPanel
          messages={messages}
          isLoading={isLoading}
          phase={phase}
          selectedTemplate={selectedTemplate}
          onSendMessage={handleSendWithTracking}
          onSelectTemplate={handleSelectTemplate}
          onReset={handleReset}
          templateLocked={templateLocked}
          chatMode={chatMode}
          onChatModeChange={setChatMode}
          {...promptHistoryProps}
        />
      </TabsContent>
      <TabsContent value="document" className="flex-1 overflow-hidden m-0">
        <DocumentEditor
          document={docStore.markdown}
          sections={docStore.sections}
          selectedTemplate={selectedTemplate}
          onReset={handleReset}
          onDocumentEdit={handleDocumentEdit}
          versions={versions}
          onRestoreVersion={handleRestoreVersion}
          onSectionEdit={handleSectionEdit}
          onDocumentImport={handleDocumentImport}
          glossaryTerms={glossary.terms}
          onGlossaryAdd={glossary.addTerm}
          onGlossaryUpdate={glossary.updateTerm}
          onGlossaryDelete={glossary.deleteTerm}
          sessionId={activeSessionId}
          {...diffReviewProps}
        />
      </TabsContent>
    </Tabs>
  ) : (
    <ResizablePanelGroup direction="horizontal" className="h-full">
      <ResizablePanel defaultSize={45} minSize={30}>
        <ChatPanel
          messages={messages}
          isLoading={isLoading}
          phase={phase}
          selectedTemplate={selectedTemplate}
          onSendMessage={handleSendWithTracking}
          onSelectTemplate={handleSelectTemplate}
          onReset={handleReset}
          templateLocked={templateLocked}
          chatMode={chatMode}
          onChatModeChange={setChatMode}
          {...promptHistoryProps}
        />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={55} minSize={30}>
        <DocumentEditor
          document={docStore.markdown}
          sections={docStore.sections}
          selectedTemplate={selectedTemplate}
          onReset={handleReset}
          onDocumentEdit={handleDocumentEdit}
          versions={versions}
          onRestoreVersion={handleRestoreVersion}
          onSectionEdit={handleSectionEdit}
          onDocumentImport={handleDocumentImport}
          
          glossaryTerms={glossary.terms}
          onGlossaryAdd={glossary.addTerm}
          onGlossaryUpdate={glossary.updateTerm}
          onGlossaryDelete={glossary.deleteTerm}
          sessionId={activeSessionId}
          {...diffReviewProps}
        />
      </ResizablePanel>
    </ResizablePanelGroup>
  );

  return (
    <MainLayout>
      <OnboardingTour />
      <KeyboardShortcutsOverlay
        open={showOverlay}
        onOpenChange={setShowOverlay}
        shortcuts={shortcuts}
      />
      <div className="flex h-full">
        {!isMobile && !showDashboard && (
          <SessionSidebar
            sessions={sessions}
            activeSessionId={activeSessionId}
            onSelect={handleSelectSession}
            onNew={handleNewSession}
            onDelete={deleteSession}
            onBackToDashboard={() => setActiveSessionId(null)}
            onDuplicate={handleDuplicate}
            onSaveAsTemplate={handleSaveAsTemplate}
          />
        )}
        <main id="main-content" className="flex-1 overflow-hidden" role="main">{mainContent}</main>
      </div>
    </MainLayout>
  );
};

export default Index;
