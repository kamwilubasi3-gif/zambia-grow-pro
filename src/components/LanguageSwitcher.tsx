import { useState } from "react";
import { useLang, LANGUAGES, LangCode } from "@/context/LanguageContext";
import { Check, Globe } from "lucide-react";

const LanguageSwitcher = () => {
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const current = LANGUAGES.find((l) => l.code === lang);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 h-9 px-3 rounded-full border border-border bg-card text-sm font-medium"
        aria-label="Change language"
      >
        <span className="text-base leading-none">🇿🇲</span>
        <Globe className="w-4 h-4 text-primary" />
        <span className="hidden sm:inline">{current?.native}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-56 z-50 rounded-xl border border-border bg-card shadow-lg overflow-hidden">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => { setLang(l.code as LangCode); setOpen(false); }}
                className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left hover:bg-muted"
              >
                <span>
                  <span className="block text-sm font-medium text-foreground">{l.native}</span>
                  <span className="block text-[11px] text-muted-foreground">{l.name}</span>
                </span>
                {lang === l.code && <Check className="w-4 h-4 text-primary" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSwitcher;
