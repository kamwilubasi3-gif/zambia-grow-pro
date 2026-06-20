import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";

export type LangCode = "en" | "bem" | "nya" | "toi" | "loz";

export const LANGUAGES: { code: LangCode; name: string; native: string; speechCode: string }[] = [
  { code: "en", name: "English", native: "English", speechCode: "en-ZM" },
  { code: "bem", name: "Bemba", native: "Ichibemba", speechCode: "en-ZM" },
  { code: "nya", name: "Nyanja / Chewa", native: "Chinyanja", speechCode: "ny-MW" },
  { code: "toi", name: "Tonga", native: "Chitonga", speechCode: "en-ZM" },
  { code: "loz", name: "Lozi", native: "Silozi", speechCode: "en-ZM" },
];

// Static UI translations for core labels (AI handles dynamic content)
const DICT: Record<string, Record<LangCode, string>> = {
  home: { en: "Home", bem: "Ku ng'anda", nya: "Kunyumba", toi: "Kuŋanda", loz: "Kwa hae" },
  scanner: { en: "Crop Scanner", bem: "Ukupima ifyakulya", nya: "Sanikiza mbeu", toi: "Lingula zilyo", loz: "Lika lico" },
  predictor: { en: "AI Predictor", bem: "Ukufwailisha kwa AI", nya: "AI Wonekera", toi: "AI Bonisha", loz: "AI Pono" },
  marketplace: { en: "Marketplace", bem: "Pa musika", nya: "Msika", toi: "Musika", loz: "Musika" },
  alerts: { en: "Alerts", bem: "Ukusoka", nya: "Zochenjeza", toi: "Tubusyo", loz: "Litemuso" },
  settings: { en: "Settings", bem: "Ukulinganya", nya: "Maseteni", toi: "Mabambe", loz: "Litaba" },
  welcome: { en: "Welcome, farmer!", bem: "Mwaiseni, mulimi!", nya: "Takulandirani, mlimi!", toi: "Mwabonwa, mulimi!", loz: "Mu amohelwe, mulimi!" },
  tap_to_speak: { en: "Tap to speak", bem: "Cinta uku landa", nya: "Dinani kulankhula", toi: "Donta kuti waambe", loz: "Tobeka ku bulela" },
  listening: { en: "Listening...", bem: "Ndekutika...", nya: "Ndikumvera...", toi: "Ndili kuswiilila...", loz: "Ni teeleza..." },
  contact_buyer: { en: "Contact Buyer", bem: "Lankula kwa kushita", nya: "Lankhulani wogula", toi: "Wambila muulisi", loz: "Bulela ku muleki" },
  draft_email: { en: "Email Draft", bem: "Kalata ya email", nya: "Kalata ya email", toi: "Lugwalo lwa email", loz: "Liñolo la email" },
  draft_sms: { en: "SMS Draft", bem: "Ubukombe bwa SMS", nya: "Uthenga wa SMS", toi: "Mulumbe wa SMS", loz: "Lushango lwa SMS" },
  copy: { en: "Copy", bem: "Kopa", nya: "Koputsani", toi: "Kopa", loz: "Kopa" },
  send: { en: "Send", bem: "Tuma", nya: "Tumizani", toi: "Tuma", loz: "Romela" },
  offline_ready: { en: "App ready offline", bem: "App ili pe nshita yonse", nya: "App ikupezeka popanda intaneti", toi: "App ilibambidwe", loz: "App i lukile" },
};

interface LangCtx {
  lang: LangCode;
  setLang: (l: LangCode) => void;
  t: (key: string) => string;
}

const Ctx = createContext<LangCtx | null>(null);

export const useLang = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useLang must be inside LanguageProvider");
  return c;
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<LangCode>(() => (localStorage.getItem("tf_lang") as LangCode) || "en");

  useEffect(() => {
    localStorage.setItem("tf_lang", lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const t = (key: string) => DICT[key]?.[lang] || DICT[key]?.en || key;

  return <Ctx.Provider value={{ lang, setLang: setLangState, t }}>{children}</Ctx.Provider>;
};
