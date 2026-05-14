import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const storage = {
  getItem: async (name: string) => {
    try {
      if (Platform.OS === 'web') return typeof window !== 'undefined' ? localStorage.getItem(name) : null;
      return await SecureStore.getItemAsync(name);
    } catch { return null; }
  },
  setItem: async (name: string, value: string) => {
    if (Platform.OS === 'web') { if (typeof window !== 'undefined') localStorage.setItem(name, value); return; }
    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name: string) => {
    if (Platform.OS === 'web') { if (typeof window !== 'undefined') localStorage.removeItem(name); return; }
    await SecureStore.deleteItemAsync(name);
  },
};

export type Lang = 'fr' | 'ar' | 'darija';

export const LANGUAGES: { code: Lang; label: string; flag: string }[] = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'ar', label: 'العربية', flag: '🇲🇦' },
  { code: 'darija', label: 'الدارجة', flag: '🇲🇦' },
];

type Translations = Record<string, string>;

const T: Record<Lang, Translations> = {
  fr: {
    // Nav
    home: 'Accueil', new: 'Nouveau', assistant: 'Assistant', profile: 'Profil',
    // Greetings
    greeting_night: 'Bonne nuit', greeting_morning: 'Bonjour',
    greeting_afternoon: 'Bon après-midi', greeting_evening: 'Bonsoir',
    // Dashboard
    ready: 'Prêt à accompagner un patient ?',
    total: 'Total', pending: 'En cours', validated: 'Validés',
    new_consultation: 'Nouvelle consultation',
    new_consultation_sub: 'Photo + symptômes → analyse IA',
    history: 'Historique', my_consultations: 'Mes consultations',
    no_consultations: 'Aucune consultation',
    no_consultations_sub: 'Lancez votre première consultation en utilisant le bouton ci-dessus.',
    loading: 'Chargement...',
    // Login
    login_tagline: 'Plateforme de dépistage dermatologique',
    login_welcome: 'Bienvenue', login_subtitle: 'Connectez-vous pour continuer',
    login_username: 'Identifiant', login_username_ph: 'ex: relais1',
    login_password: 'Mot de passe', login_submit: 'Se connecter',
    login_select_language: 'Langue',
    // Help
    help_title: "Guide d'utilisation",
    help_step1_title: '1. Prendre une photo',
    help_step1_desc: "Photographiez clairement la zone cutanée. Bonne lumière indispensable.",
    help_step2_title: '2. Décrire les symptômes',
    help_step2_desc: 'Indiquez symptômes, zone du corps et durée.',
    help_step3_title: '3. Envoyer pour analyse',
    help_step3_desc: "L'IA analyse et un médecin valide sous 24h.",
    help_step4_title: '4. Recevoir le résultat',
    help_step4_desc: 'Diagnostic avec niveau de risque et recommandations.',
    help_assistant_title: '💬 Assistant IA',
    help_assistant_desc: "Utilisez l'onglet Assistant pour poser des questions.",
    close: 'Fermer',
    // Assistant
    assistant_title: 'Assistant AMANE', assistant_subtitle: 'Questions sur la santé cutanée',
    assistant_placeholder: 'Posez votre question...',
    assistant_welcome: "Bonjour ! Je suis l'assistant AMANE. Je peux vous aider à comprendre les maladies de peau et comment utiliser l'application. Comment puis-je vous aider ?",
    assistant_send: 'Envoyer', assistant_thinking: 'En train de réfléchir...',
    assistant_error: "Désolé, une erreur s'est produite. Réessayez.",
    // Profile
    account: 'Compte', identifier: 'Identifiant', region: 'Région',
    user_id: 'ID utilisateur', logout: 'Se déconnecter',
    language: 'Langue', change_language: 'Changer la langue',
    // New consultation
    new_step_of: 'sur 4',
    new_photo_title: 'Photographier la lésion',
    new_photo_desc: "Une image nette et bien éclairée aide l'IA à mieux analyser.",
    new_tip_title: 'Pour une bonne photo',
    new_tip_body: "• Cadrez la lésion au centre\n• Lumière naturelle si possible\n• Distance ~15 cm\n• Pas de flou",
    new_camera: 'Caméra', new_gallery: 'Galerie', new_captured: 'Capturée',
    new_center: 'Centrez la lésion',
    new_patient_title: 'Le patient',
    new_patient_desc: 'Informations anonymisées (aucun nom collecté).',
    new_age_label: "Tranche d'âge", new_years: 'ans',
    new_gender_label: 'Genre', new_gender_m: 'Homme', new_gender_f: 'Femme', new_gender_other: 'Autre',
    new_region_label: 'Région',
    new_symptoms_title: 'Les symptômes',
    new_symptoms_desc: "Décrivez ce qu'observe le patient.",
    new_body_area_label: 'Zone du corps',
    new_duration_label: 'Durée des symptômes',
    new_desc_label: 'Description (au moins 5 caractères)',
    new_desc_ph: 'ex: Tâche brune qui change de forme, démangeaisons...',
    new_confirm_title: 'Tout est bon ?',
    new_confirm_desc: 'Vérifiez puis envoyez la consultation pour analyse.',
    new_continue: 'Continuer', new_send: 'Envoyer pour analyse',
    new_age_recap: 'Âge', new_gender_recap: 'Genre', new_region_recap: 'Région',
    new_area_recap: 'Zone', new_duration_recap: 'Durée', new_symptoms_recap: 'Symptômes',
    new_analyzing: "L'IA analyse votre cas",
    new_analyzing_sub: "Quelques secondes... génération de la heatmap d'explicabilité.",
    new_step_image: "Validation de l'image",
    new_step_resnet: 'Analyse ResNet18', new_step_heatmap: 'Génération heatmap',
    new_step_gemini: 'Second avis Gemini',
    new_confirm_title2: 'Envoyez votre consultation',
    permission_denied: 'Permission refusée',
    camera_permission: "Activez l'accès à la caméra dans vos paramètres.",
    gallery_permission: "Activez l'accès aux photos dans vos paramètres.",
    error: 'Erreur', send_fail: "Échec de l'envoi de la consultation.",
  },
  ar: {
    home: 'الرئيسية', new: 'جديد', assistant: 'المساعد', profile: 'الملف',
    greeting_night: 'تصبح على خير', greeting_morning: 'صباح الخير',
    greeting_afternoon: 'مساء الخير', greeting_evening: 'مساء الخير',
    ready: 'هل أنت مستعد لمساعدة مريض؟',
    total: 'المجموع', pending: 'قيد الانتظار', validated: 'مُصادق عليها',
    new_consultation: 'استشارة جديدة',
    new_consultation_sub: 'صورة + أعراض ← تحليل الذكاء الاصطناعي',
    history: 'السجل', my_consultations: 'استشاراتي',
    no_consultations: 'لا توجد استشارات',
    no_consultations_sub: 'ابدأ استشارتك الأولى باستخدام الزر أعلاه.',
    loading: 'جار التحميل...',
    login_tagline: 'منصة الفحص الجلدي',
    login_welcome: 'مرحباً', login_subtitle: 'سجل الدخول للمتابعة',
    login_username: 'اسم المستخدم', login_username_ph: 'مثال: relais1',
    login_password: 'كلمة المرور', login_submit: 'تسجيل الدخول',
    login_select_language: 'اللغة',
    help_title: 'دليل الاستخدام',
    help_step1_title: '١. التقاط صورة',
    help_step1_desc: 'التقط صورة واضحة للمنطقة المصابة في ضوء جيد.',
    help_step2_title: '٢. وصف الأعراض',
    help_step2_desc: 'اذكر أعراضك ومنطقة الجسم ومدة ظهور المشكلة.',
    help_step3_title: '٣. إرسال للتحليل',
    help_step3_desc: 'يحلل الذكاء الاصطناعي صورتك ويؤكد الطبيب خلال 24 ساعة.',
    help_step4_title: '٤. استلام النتيجة',
    help_step4_desc: 'ستتلقى تشخيصاً مع مستوى الخطورة والتوصيات.',
    help_assistant_title: '💬 المساعد الذكي',
    help_assistant_desc: 'استخدم تبويب المساعد لطرح أسئلة حول صحة بشرتك.',
    close: 'إغلاق',
    assistant_title: 'مساعد أمان', assistant_subtitle: 'أسئلة حول صحة البشرة',
    assistant_placeholder: 'اكتب سؤالك...',
    assistant_welcome: 'مرحباً! أنا مساعد أمان. يمكنني مساعدتك في فهم أمراض الجلد وكيفية استخدام التطبيق. كيف يمكنني مساعدتك؟',
    assistant_send: 'إرسال', assistant_thinking: 'جار التفكير...',
    assistant_error: 'عذراً، حدث خطأ. حاول مرة أخرى.',
    account: 'الحساب', identifier: 'اسم المستخدم', region: 'المنطقة',
    user_id: 'معرف المستخدم', logout: 'تسجيل الخروج',
    language: 'اللغة', change_language: 'تغيير اللغة',
    new_step_of: 'من 4',
    new_photo_title: 'التقط الصورة',
    new_photo_desc: 'صورة واضحة تساعد الذكاء الاصطناعي على التحليل الأفضل.',
    new_tip_title: 'لصورة جيدة',
    new_tip_body: "• ضع الآفة في المركز\n• ضوء طبيعي إن أمكن\n• مسافة ~15 سم\n• بدون ضبابية",
    new_camera: 'الكاميرا', new_gallery: 'المعرض', new_captured: 'تم التقاطها',
    new_center: 'ضع الآفة في المركز',
    new_patient_title: 'بيانات المريض',
    new_patient_desc: 'معلومات مجهولة الهوية (لا يُجمع أي اسم).',
    new_age_label: 'الفئة العمرية', new_years: 'سنة',
    new_gender_label: 'الجنس', new_gender_m: 'ذكر', new_gender_f: 'أنثى', new_gender_other: 'آخر',
    new_region_label: 'المنطقة',
    new_symptoms_title: 'الأعراض',
    new_symptoms_desc: 'صف ما يلاحظه المريض.',
    new_body_area_label: 'منطقة الجسم',
    new_duration_label: 'مدة الأعراض',
    new_desc_label: 'الوصف (5 أحرف على الأقل)',
    new_desc_ph: 'مثال: بقعة بنية تتغير شكلها، حكة خفيفة...',
    new_confirm_title: 'هل كل شيء صحيح؟',
    new_confirm_desc: 'تحقق ثم أرسل الاستشارة للتحليل.',
    new_continue: 'متابعة', new_send: 'إرسال للتحليل',
    new_age_recap: 'العمر', new_gender_recap: 'الجنس', new_region_recap: 'المنطقة',
    new_area_recap: 'المنطقة', new_duration_recap: 'المدة', new_symptoms_recap: 'الأعراض',
    new_analyzing: 'يحلل الذكاء الاصطناعي حالتك',
    new_analyzing_sub: 'بضع ثوانٍ... جاري إنشاء خريطة الحرارة.',
    new_step_image: 'التحقق من الصورة',
    new_step_resnet: 'تحليل نموذج ResNet18', new_step_heatmap: 'إنشاء خريطة الحرارة',
    new_step_gemini: 'رأي ثانٍ من Gemini',
    new_confirm_title2: 'أرسل استشارتك',
    permission_denied: 'تم رفض الإذن',
    camera_permission: 'فعّل الوصول إلى الكاميرا في إعداداتك.',
    gallery_permission: 'فعّل الوصول إلى الصور في إعداداتك.',
    error: 'خطأ', send_fail: 'فشل إرسال الاستشارة.',
  },
  darija: {
    home: 'الصفحة', new: 'جديد', assistant: 'المساعد', profile: 'البروفيل',
    greeting_night: 'تصبح على خير', greeting_morning: 'صباح النور',
    greeting_afternoon: 'مسا النور', greeting_evening: 'مسا النور',
    ready: 'واش مستعد تعاون مريض؟',
    total: 'الكل', pending: 'فالانتظار', validated: 'مصادق عليها',
    new_consultation: 'استشارة جديدة',
    new_consultation_sub: 'صورة + أعراض ← تحليل ديال الذكاء الاصطناعي',
    history: 'السجل', my_consultations: 'استشاراتي',
    no_consultations: 'ماكاينش استشارات',
    no_consultations_sub: 'بدا الاستشارة ليولا باستخدام الزر لفوق.',
    loading: 'كيحمل...',
    login_tagline: 'منصة الكشف الجلدي',
    login_welcome: 'مرحبا', login_subtitle: 'دخل باش تكمل',
    login_username: 'اسم المستخدم', login_username_ph: 'مثلا: relais1',
    login_password: 'كلمة السر', login_submit: 'دخول',
    login_select_language: 'اللغة',
    help_title: 'كيفاش تستعمل',
    help_step1_title: '١. دير صورة', help_step1_desc: 'دير صورة واضحة للمنطقة المريضة مع ضوء مزيان.',
    help_step2_title: '٢. وصف الأعراض', help_step2_desc: 'قل الأعراض ديالك والمنطقة ومنين بدات المشكلة.',
    help_step3_title: '٣. سيفط للتحليل', help_step3_desc: 'الذكاء الاصطناعي كيحلل والطبيب كيأكد خلال 24 ساعة.',
    help_step4_title: '٤. استقبل النتيجة', help_step4_desc: 'غادي تستقبل تشخيص مع مستوى الخطر والنصائح.',
    help_assistant_title: '💬 المساعد الذكي',
    help_assistant_desc: 'استعمل تاب المساعد باش تسول على صحة البشرة.',
    close: 'سد',
    assistant_title: 'مساعد أمان', assistant_subtitle: 'سول على صحة البشرة ديالك',
    assistant_placeholder: 'كتب سؤالك...',
    assistant_welcome: 'مرحبا! أنا مساعد أمان. نقدر نعاونك تفهم أمراض الجلد وكيفاش تستعمل التطبيق. كيفاش نقدر نعاونك؟',
    assistant_send: 'سيفط', assistant_thinking: 'كيفكر...',
    assistant_error: 'سامحني، كاين مشكل. عاود حاول.',
    account: 'الحساب', identifier: 'اسم المستخدم', region: 'المنطقة',
    user_id: 'ID ديال المستخدم', logout: 'خرج',
    language: 'اللغة', change_language: 'بدل اللغة',
    new_step_of: 'من 4',
    new_photo_title: 'دير صورة',
    new_photo_desc: 'صورة واضحة كتعاون الذكاء الاصطناعي بزاف.',
    new_tip_title: 'باش تجيب صورة مزيانة',
    new_tip_body: "• حط المنطقة فالوسط\n• ضوء طبيعي إيلا إمكن\n• المسافة ~15 سم\n• بلا ضبابية",
    new_camera: 'الكاميرا', new_gallery: 'الغالري', new_captured: 'مصورة',
    new_center: 'حط المنطقة فالوسط',
    new_patient_title: 'المريض',
    new_patient_desc: 'معلومات مجهولة الهوية (ماكاينش اسم).',
    new_age_label: 'الفئة العمرية', new_years: 'سنة',
    new_gender_label: 'الجنس', new_gender_m: 'ذكر', new_gender_f: 'أنثى', new_gender_other: 'آخر',
    new_region_label: 'المنطقة',
    new_symptoms_title: 'الأعراض',
    new_symptoms_desc: 'صف اللي كيشوف المريض.',
    new_body_area_label: 'منطقة الجسم',
    new_duration_label: 'مدة الأعراض',
    new_desc_label: 'الوصف (5 حروف على الأقل)',
    new_desc_ph: 'مثلا: بقعة كاتبدل شكلها، حكة خفيفة...',
    new_confirm_title: 'واش كل شي مزيان؟',
    new_confirm_desc: 'راجع وسيفط الاستشارة للتحليل.',
    new_continue: 'كمل', new_send: 'سيفط للتحليل',
    new_age_recap: 'العمر', new_gender_recap: 'الجنس', new_region_recap: 'المنطقة',
    new_area_recap: 'المنطقة', new_duration_recap: 'المدة', new_symptoms_recap: 'الأعراض',
    new_analyzing: 'الذكاء الاصطناعي كيحلل حالتك',
    new_analyzing_sub: 'شي ثواني... كيدير خريطة الحرارة.',
    new_step_image: 'التحقق من الصورة',
    new_step_resnet: 'تحليل ResNet18', new_step_heatmap: 'خريطة الحرارة',
    new_step_gemini: 'رأي تاني من Gemini',
    new_confirm_title2: 'سيفط الاستشارة',
    permission_denied: 'الإذن مرفوض',
    camera_permission: 'فعّل الوصول للكاميرا فالإعدادات.',
    gallery_permission: 'فعّل الوصول للصور فالإعدادات.',
    error: 'خطأ', send_fail: 'فشل إرسال الاستشارة.',
  },
};

interface I18nState {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

export const useI18n = create<I18nState>()(
  persist(
    (set) => ({
      lang: 'fr',
      setLang: (lang) => set({ lang }),
    }),
    {
      name: 'amane-lang',
      storage: createJSONStorage(() => storage),
      partialize: (state) => ({ lang: state.lang }),
    }
  )
);

// Reactive hook — re-renders when lang changes
export function useT() {
  const lang = useI18n((s) => s.lang);
  return (key: string): string =>
    (T[lang] as Translations)[key] ?? (T.fr as Translations)[key] ?? key;
}

export function getGreeting(lang: Lang): string {
  const h = new Date().getHours();
  const t = (k: string) => (T[lang] as Translations)[k] ?? (T.fr as Translations)[k] ?? k;
  if (h < 6) return t('greeting_night');
  if (h < 12) return t('greeting_morning');
  if (h < 18) return t('greeting_afternoon');
  return t('greeting_evening');
}
