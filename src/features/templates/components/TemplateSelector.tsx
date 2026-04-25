import { useState } from "react";
import { FileText, BookOpen, Code, ClipboardList, Plus, Pencil, Trash2, Star, ChevronDown, Map, Newspaper, FileSpreadsheet, Rocket, Target, Users, Settings2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Template } from "@/types/chat";
import { templates } from "../templateData";
import { useLanguage } from "@/i18n/LanguageContext";
import { useCustomTemplates, type CustomTemplateRow } from "../hooks/useCustomTemplates";
import { CustomTemplateDialog } from "./CustomTemplateDialog";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  "modern-prd": FileText,
  "agile-user-story": BookOpen,
  "competitive-analysis": Target,
  "product-roadmap": Map,
  "press-release": Newspaper,
  "one-pager": FileSpreadsheet,
  "go-to-market": Rocket,
  "technical-spec": Code,
  "launch-plan": Rocket,
  "okr-template": Target,
  "stakeholder-map": Users,
  "feature-spec": Settings2,
};

interface TemplateSelectorProps {
  selectedTemplate: Template | null;
  onSelectTemplate: (template: Template) => void;
  onReset: () => void;
  locked?: boolean;
}

export function TemplateSelector({
  selectedTemplate,
  onSelectTemplate,
  onReset,
  locked = false,
}: TemplateSelectorProps) {
  const { t } = useLanguage();
  const { customTemplates, asTemplates, createTemplate, updateTemplate, deleteTemplate } = useCustomTemplates();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CustomTemplateRow | null>(null);
  const [open, setOpen] = useState(false);

  const handleSave = async (name: string, description: string, systemPromptAddition: string) => {
    if (editingTemplate) {
      await updateTemplate(editingTemplate.id, name, description, systemPromptAddition);
    } else {
      await createTemplate(name, description, systemPromptAddition);
    }
    setEditingTemplate(null);
  };

  const handleEdit = (row: CustomTemplateRow) => {
    setEditingTemplate(row);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    setDialogOpen(true);
  };

  const handleSelect = (template: Template) => {
    onSelectTemplate(template);
    setOpen(false);
  };

  const selectedName = selectedTemplate
    ? (selectedTemplate.id.startsWith("custom-")
      ? selectedTemplate.name
      : t(`template.${selectedTemplate.id}.name` as any))
    : null;

  const SelectedIcon = selectedTemplate ? (iconMap[selectedTemplate.id] || FileText) : FileText;

  return (
    <>
      <div data-tour="template-selector">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={locked}
              className={cn(
                "h-9 gap-2 text-sm font-medium justify-between min-w-[200px]",
                selectedTemplate && "border-primary/30 bg-primary/5"
              )}
            >
              <span className="flex items-center gap-2 truncate">
                <SelectedIcon className="w-4 h-4 shrink-0" />
                <span className="truncate">
                  {selectedName || t("template.selectPlaceholder" as any)}
                </span>
              </span>
              <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-80 p-0" sideOffset={4}>
            <ScrollArea className="h-[400px]">
              <div className="p-1.5">
                <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t("template.builtIn" as any)}
                </p>
                {templates.map((template) => {
                  const Icon = iconMap[template.id] || FileText;
                  const isSelected = selectedTemplate?.id === template.id;
                  const name = t(`template.${template.id}.name` as any);
                  const desc = t(`template.${template.id}.description` as any);

                  return (
                    <button
                      key={template.id}
                      onClick={() => handleSelect(template)}
                      className={cn(
                        "w-full flex items-start gap-3 rounded-md px-2 py-2 text-left transition-colors",
                        "hover:bg-accent hover:text-accent-foreground",
                        isSelected && "bg-primary/10 text-primary"
                      )}
                    >
                      <Icon className="w-4 h-4 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">{name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 shrink-0 text-primary" />}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Custom templates */}
              {(
                <div className="p-1.5 pt-0">
                  <Separator className="mb-1.5" />
                  <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Star className="w-3 h-3" />
                    {t("template.custom")}
                  </p>
                  {asTemplates.map((tpl) => {
                    const row = customTemplates.find((r) => `custom-${r.id}` === tpl.id)!;
                    const isSelected = selectedTemplate?.id === tpl.id;

                    return (
                      <div
                        key={tpl.id}
                        className={cn(
                          "flex items-center gap-2 rounded-md px-2 py-2 transition-colors",
                          "hover:bg-accent hover:text-accent-foreground",
                          isSelected && "bg-primary/10 text-primary"
                        )}
                      >
                        <button
                          className="flex-1 text-left min-w-0"
                          onClick={() => handleSelect(tpl)}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">{tpl.name}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 shrink-0 text-primary" />}
                          </div>
                          {tpl.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{tpl.description}</p>
                          )}
                        </button>
                        <div className="flex items-center gap-0.5 shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => { e.stopPropagation(); handleEdit(row); }}
                          >
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-destructive"
                            onClick={(e) => { e.stopPropagation(); deleteTemplate(row.id); }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  <button
                    onClick={handleCreate}
                    className="w-full flex items-center gap-2 rounded-md px-2 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {t("customTemplate.create")}
                  </button>
                </div>
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </div>

      <CustomTemplateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSave}
        editingTemplate={editingTemplate}
      />
    </>
  );
}
