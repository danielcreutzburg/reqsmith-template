import { useRef, useState } from "react";
import { Image, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n/LanguageContext";

export interface ChatAttachment {
  url: string;
  name: string;
  type: string; // 'image' | 'pdf' | 'file'
}

interface ChatAttachmentButtonProps {
  onAttach: (attachment: ChatAttachment) => void;
  attachment: ChatAttachment | null;
  onClear: () => void;
}

export function ChatAttachmentButton({ onAttach, attachment, onClear }: ChatAttachmentButtonProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { t } = useLanguage();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error(t("attachment.tooLarge"));
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

      const { error } = await supabase.storage
        .from("chat-attachments")
        .upload(path, file);

      if (error) throw error;

      // Bucket is private — generate a signed URL (valid 1 hour)
      const { data: urlData, error: signErr } = await supabase.storage
        .from("chat-attachments")
        .createSignedUrl(path, 60 * 60);

      if (signErr || !urlData?.signedUrl) throw signErr ?? new Error("sign failed");

      const type = file.type.startsWith("image/") ? "image"
        : file.type === "application/pdf" ? "pdf"
        : "file";

      onAttach({ url: urlData.signedUrl, name: file.name, type });
      toast.success(t("attachment.uploaded"));
    } catch {
      toast.error(t("attachment.error"));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex items-center gap-1">
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.pdf,.doc,.docx,.txt,.md"
        className="hidden"
        onChange={handleFile}
      />
      {attachment ? (
        <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={onClear}>
          <Image className="w-3.5 h-3.5" />
          {attachment.name.length > 12 ? attachment.name.slice(0, 12) + "…" : attachment.name}
          <X className="w-3 h-3" />
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          title={t("attachment.add")}
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Image className="w-4 h-4" />}
        </Button>
      )}
    </div>
  );
}
