import React, { createContext, useContext, useState } from "react";

export type Lang = "en" | "hi" | "mr";

const T = {
  en: {
    liveMap:         "Live Map",
    leaderboard:     "Leaderboard",
    myReports:       "My Reports",
    howItWorks:      "How It Works",
    waterCalc:       "Water Calculator",
    municipality:    "Municipality",
    reportALeak:     "Report a Leak",
    earnEcoPoints:   "Earn Eco Points for every report",
    systemLive:      "System Live",
    totalReported:   "Total Reported",
    resolvedWeek:    "Resolved This Week",
    litresSaved:     "Litres Saved",
    cityHealth:      "City Health",
    submitReport:    "Submit Report",
    pinLocation:     "Pin Location",
    leakDetails:     "Leak Details",
    realTimePins:    "Real-time pins",
    civicChampions:  "Civic champions",
    yourSubmissions: "Your submissions",
    threeStepGuide:  "3-step guide",
    waterWaste:      "Water waste tool",
    commandCenter:   "Command center",
    communityVerified: "Community Verified",
    upvote:          "Upvote",
    upvoted:         "Upvoted ✓",
    shareWhatsApp:   "Share on WhatsApp",
    viewDetails:     "View Details",
    profile:         "My Profile",
    ecoPoints:       "Eco Points",
    reportsSubmitted: "Reports Submitted",
    reportsResolved:  "Reports Resolved",
    reportsVerified:  "Community Verified",
    memberSince:     "Member Since",
    setYourName:     "Set your name",
    setNameDesc:     "Enter the name you use when submitting reports to see your profile.",
    save:            "Save",
    rank:            "Leaderboard Rank",
    myActivity:      "My Activity",
    noReportsYet:    "No reports submitted yet",
    closePanel:      "Close",
    nearbyAlert:     "Nearby Leak Alert",
    nearbyAlertDesc: "A leak was reported near your location",
  },
  hi: {
    liveMap:         "लाइव मैप",
    leaderboard:     "लीडरबोर्ड",
    myReports:       "मेरी रिपोर्ट",
    howItWorks:      "यह कैसे काम करता है",
    waterCalc:       "जल कैलकुलेटर",
    municipality:    "नगरपालिका",
    reportALeak:     "रिसाव रिपोर्ट करें",
    earnEcoPoints:   "हर रिपोर्ट पर इको पॉइंट्स कमाएं",
    systemLive:      "सिस्टम लाइव",
    totalReported:   "कुल रिपोर्ट",
    resolvedWeek:    "इस सप्ताह हल हुए",
    litresSaved:     "लीटर बचाए",
    cityHealth:      "शहर स्वास्थ्य",
    submitReport:    "रिपोर्ट जमा करें",
    pinLocation:     "स्थान पिन करें",
    leakDetails:     "रिसाव विवरण",
    realTimePins:    "रियल-टाइम पिन",
    civicChampions:  "नागरिक चैंपियन",
    yourSubmissions: "आपकी रिपोर्ट",
    threeStepGuide:  "3-चरण गाइड",
    waterWaste:      "जल अपव्यय टूल",
    commandCenter:   "कमांड सेंटर",
    communityVerified: "समुदाय सत्यापित",
    upvote:          "अपवोट",
    upvoted:         "अपवोट किया ✓",
    shareWhatsApp:   "व्हाट्सऐप पर साझा करें",
    viewDetails:     "विवरण देखें",
    profile:         "मेरी प्रोफ़ाइल",
    ecoPoints:       "इको पॉइंट्स",
    reportsSubmitted: "रिपोर्ट जमा की",
    reportsResolved:  "रिपोर्ट हल हुई",
    reportsVerified:  "समुदाय सत्यापित",
    memberSince:     "सदस्यता से",
    setYourName:     "अपना नाम दर्ज करें",
    setNameDesc:     "रिपोर्ट में उपयोग किया गया नाम दर्ज करें।",
    save:            "सहेजें",
    rank:            "लीडरबोर्ड रैंक",
    myActivity:      "मेरी गतिविधि",
    noReportsYet:    "अभी तक कोई रिपोर्ट नहीं",
    closePanel:      "बंद करें",
    nearbyAlert:     "पास में रिसाव!",
    nearbyAlertDesc: "आपके पास एक रिसाव रिपोर्ट किया गया",
  },
  mr: {
    liveMap:         "थेट नकाशा",
    leaderboard:     "लीडरबोर्ड",
    myReports:       "माझे अहवाल",
    howItWorks:      "हे कसे कार्य करते",
    waterCalc:       "पाणी कॅल्क्युलेटर",
    municipality:    "महानगरपालिका",
    reportALeak:     "गळती नोंदवा",
    earnEcoPoints:   "प्रत्येक अहवालासाठी इको पॉइंट्स मिळवा",
    systemLive:      "सिस्टम लाइव्ह",
    totalReported:   "एकूण अहवाल",
    resolvedWeek:    "या आठवड्यात निराकरण",
    litresSaved:     "लिटर वाचवले",
    cityHealth:      "शहर आरोग्य",
    submitReport:    "अहवाल सादर करा",
    pinLocation:     "स्थान पिन करा",
    leakDetails:     "गळतीचे तपशील",
    realTimePins:    "रिअल-टाइम पिन",
    civicChampions:  "नागरी चॅम्पियन",
    yourSubmissions: "तुमचे अहवाल",
    threeStepGuide:  "३-चरण मार्गदर्शक",
    waterWaste:      "पाणी अपव्यय साधन",
    commandCenter:   "कमांड सेंटर",
    communityVerified: "समुदाय सत्यापित",
    upvote:          "अपव्होट",
    upvoted:         "अपव्होट केले ✓",
    shareWhatsApp:   "WhatsApp वर शेअर करा",
    viewDetails:     "तपशील पहा",
    profile:         "माझी प्रोफाइल",
    ecoPoints:       "इको पॉइंट्स",
    reportsSubmitted: "सादर केलेले अहवाल",
    reportsResolved:  "निराकरण झालेले अहवाल",
    reportsVerified:  "समुदाय सत्यापित",
    memberSince:     "सदस्यत्व पासून",
    setYourName:     "तुमचे नाव सेट करा",
    setNameDesc:     "अहवाल सादर करताना वापरलेले नाव टाका.",
    save:            "जतन करा",
    rank:            "लीडरबोर्ड क्रमांक",
    myActivity:      "माझी क्रियाकलाप",
    noReportsYet:    "अद्याप कोणतेही अहवाल नाहीत",
    closePanel:      "बंद करा",
    nearbyAlert:     "जवळची गळती!",
    nearbyAlertDesc: "तुमच्या जवळ गळती नोंदवली गेली",
  },
} as const;

type TranslationKey = keyof typeof T.en;

interface LanguageContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  setLang: () => {},
  t: (k) => T.en[k],
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    return (localStorage.getItem("aquaalert_lang") as Lang) ?? "en";
  });

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("aquaalert_lang", l);
  };

  const t = (key: TranslationKey): string => T[lang][key] as string;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
