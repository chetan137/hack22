export const translations = {
  en: {
    dashboard: 'Overview',
    logActivity: 'Log Activity',
    billAnalyzer: 'Bill Analyzer',
    aiCoach: 'AI Coach',
    goals: 'Goals',
    community: 'Community',
    digitalTwin: 'Digital Twin',
    profile: 'Profile',
    settings: 'Settings',
    signOut: 'Sign Out',
    appearance: 'Appearance',
    language: 'Language & Region',
    notifications: 'Notifications',
    security: 'Security',
    accountActions: 'Account Actions'
  },
  hi: {
    dashboard: 'अवलोकन (Overview)',
    logActivity: 'गतिविधि दर्ज करें (Log Activity)',
    billAnalyzer: 'बिल विश्लेषक (Bill Analyzer)',
    aiCoach: 'एआई कोच (AI Coach)',
    goals: 'लक्ष्य (Goals)',
    community: 'समुदाय (Community)',
    digitalTwin: 'डिजिटल ट्विन (Digital Twin)',
    profile: 'प्रोफ़ाइल (Profile)',
    settings: 'सेटिंग्स (Settings)',
    signOut: 'लॉग आउट (Sign Out)',
    appearance: 'दिखावट (Appearance)',
    language: 'भाषा और क्षेत्र (Language & Region)',
    notifications: 'सूचनाएं (Notifications)',
    security: 'सुरक्षा (Security)',
    accountActions: 'खाता कार्रवाई (Account Actions)'
  },
  es: {
    dashboard: 'Resumen',
    logActivity: 'Registrar Actividad',
    billAnalyzer: 'Analizador de Facturas',
    aiCoach: 'Entrenador de IA',
    goals: 'Metas',
    community: 'Comunidad',
    digitalTwin: 'Gemelo Digital',
    profile: 'Perfil',
    settings: 'Configuraciones',
    signOut: 'Cerrar Sesión',
    appearance: 'Apariencia',
    language: 'Idioma y Región',
    notifications: 'Notificaciones',
    security: 'Seguridad',
    accountActions: 'Acciones de la Cuenta'
  },
  fr: {
    dashboard: 'Aperçu',
    logActivity: 'Enregistrer une Activité',
    billAnalyzer: 'Analyseur de Factures',
    aiCoach: 'Coach IA',
    goals: 'Objectifs',
    community: 'Communauté',
    digitalTwin: 'Jumeau Numérique',
    profile: 'Profil',
    settings: 'Paramètres',
    signOut: 'Se Déconnecter',
    appearance: 'Apparence',
    language: 'Langue et Région',
    notifications: 'Notifications',
    security: 'Sécurité',
    accountActions: 'Actions du Compte'
  },
  de: {
    dashboard: 'Überblick',
    logActivity: 'Aktivität Protokollieren',
    billAnalyzer: 'Rechnungsanalysator',
    aiCoach: 'KI-Trainer',
    goals: 'Ziele',
    community: 'Gemeinschaft',
    digitalTwin: 'Digitaler Zwilling',
    profile: 'Profil',
    settings: 'Einstellungen',
    signOut: 'Abmelden',
    appearance: 'Erscheinungsbild',
    language: 'Sprache & Region',
    notifications: 'Benachrichtigungen',
    security: 'Sicherheit',
    accountActions: 'Kontoaktionen'
  }
};

export type LanguageCode = keyof typeof translations;
export type TranslationKey = keyof typeof translations['en'];

export function t(lang: string, key: TranslationKey): string {
  if (translations[lang as LanguageCode]) {
    return translations[lang as LanguageCode][key] || translations['en'][key];
  }
  return translations['en'][key];
}
