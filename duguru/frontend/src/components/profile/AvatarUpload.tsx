import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "../ui/Toast";
import { Button } from "../ui/Button";
import { api } from "../../services/api";
import { useAuthStore } from "../../stores/authStore";

interface Props {
  currentAvatarUrl?: string | null | undefined;
}

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function AvatarUpload({ currentAvatarUrl }: Props) {
  const { t } = useTranslation("profile");
  const { toast } = useToast();
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);

  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const avatarSrc = preview ?? currentAvatarUrl ?? null;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!ALLOWED_TYPES.includes(selected.type)) {
      toast(t("avatar.invalidType"), "error");
      return;
    }
    if (selected.size > MAX_SIZE_BYTES) {
      toast(t("avatar.tooLarge"), "error");
      return;
    }

    setFile(selected);
    const objectUrl = URL.createObjectURL(selected);
    setPreview(objectUrl);
  }

  async function handleUpload() {
    if (!file) return;

    const formData = new FormData();
    formData.append("avatar", file);

    setLoading(true);
    try {
      const res = await api.post<{ avatarUrl: string }>("/profile/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (user) {
        setUser({ ...user, avatarUrl: res.data.avatarUrl });
      }
      toast(t("avatar.saved"), "success");
      setFile(null);
      setPreview(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("avatar.saveError");
      toast(message, "error");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Avatar preview */}
      <button
        type="button"
        className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-[var(--color-border)] bg-[var(--color-tertiary)] focus-visible:outline-2 focus-visible:outline-[var(--color-button)]"
        onClick={() => { inputRef.current?.click(); }}
        aria-label={t("avatar.change")}
      >
        {avatarSrc ? (
          <img
            src={avatarSrc}
            alt={t("avatar.current")}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-4xl" aria-hidden="true">
            👤
          </span>
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity hover:opacity-100">
          <span className="text-white text-sm font-medium">{t("avatar.change")}</span>
        </span>
      </button>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(",")}
        onChange={handleFileChange}
        className="sr-only"
        aria-label={t("avatar.fileInput")}
      />

      <p className="text-xs text-[var(--color-paragraph)] text-center">
        {t("avatar.hint")}
      </p>

      {/* Upload button — only shown when a file is selected */}
      {file && (
        <Button
          type="button"
          variant="secondary"
          loading={loading}
          onClick={() => { void handleUpload(); }}
        >
          {t("avatar.save")}
        </Button>
      )}
    </div>
  );
}
