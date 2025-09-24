import type { StickFigurePose, Limb, SavedPose, JointName } from './types';

export const INITIAL_POSE: StickFigurePose = {
  head: { x: 250, y: 80 },
  neck: { x: 250, y: 120 },
  waist: { x: 250, y: 180 },
  pelvis: { x: 250, y: 240 },
  leftShoulder: { x: 210, y: 130 },
  rightShoulder: { x: 290, y: 130 },
  leftElbow: { x: 180, y: 190 },
  rightElbow: { x: 320, y: 190 },
  leftHand: { x: 150, y: 250 },
  rightHand: { x: 350, y: 250 },
  leftHip: { x: 225, y: 240 },
  rightHip: { x: 275, y: 240 },
  leftKnee: { x: 215, y: 320 },
  rightKnee: { x: 285, y: 320 },
  leftAnkle: { x: 205, y: 400 },
  rightAnkle: { x: 295, y: 400 },
};

export const LIMBS: Limb[] = [
  // Torso
  ['neck', 'waist'],
  ['waist', 'pelvis'],
  ['neck', 'leftShoulder'],
  ['neck', 'rightShoulder'],
  ['pelvis', 'leftHip'],
  ['pelvis', 'rightHip'],
  // Left Arm
  ['leftShoulder', 'leftElbow'],
  ['leftElbow', 'leftHand'],
  // Right Arm
  ['rightShoulder', 'rightElbow'],
  ['rightElbow', 'rightHand'],
  // Left Leg
  ['leftHip', 'leftKnee'],
  ['leftKnee', 'leftAnkle'],
  // Right Leg
  ['rightHip', 'rightKnee'],
  ['rightKnee', 'rightAnkle'],
];

export const DEFAULT_POSES: SavedPose[] = [
  {
    id: 'default-standing',
    isDefault: true,
    pose: {
      head: { x: 0, y: -160 },
      neck: { x: 0, y: -120 },
      waist: { x: 0, y: -60 },
      pelvis: { x: 0, y: 0 },
      leftShoulder: { x: -40, y: -110 },
      rightShoulder: { x: 40, y: -110 },
      leftElbow: { x: -70, y: -50 },
      rightElbow: { x: 70, y: -50 },
      leftHand: { x: -100, y: 10 },
      rightHand: { x: 100, y: 10 },
      leftHip: { x: -25, y: 0 },
      rightHip: { x: 25, y: 0 },
      leftKnee: { x: -35, y: 80 },
      rightKnee: { x: 35, y: 80 },
      leftAnkle: { x: -45, y: 160 },
      rightAnkle: { x: 45, y: 160 },
    },
  },
  {
    id: 'default-wave',
    isDefault: true,
    // This pose is normalized relative to the pelvis
    pose: {
      head: { x: 0, y: -160 },
      neck: { x: 0, y: -120 },
      waist: { x: 0, y: -60 },
      pelvis: { x: 0, y: 0 },
      leftShoulder: { x: -40, y: -110 },
      rightShoulder: { x: 40, y: -110 },
      leftElbow: { x: -70, y: -50 },
      rightElbow: { x: 90, y: -90 },
      leftHand: { x: -100, y: 10 },
      rightHand: { x: 120, y: -160 },
      leftHip: { x: -25, y: 0 },
      rightHip: { x: 25, y: 0 },
      leftKnee: { x: -35, y: 80 },
      rightKnee: { x: 35, y: 80 },
      leftAnkle: { x: -45, y: 160 },
      rightAnkle: { x: 45, y: 160 },
    },
  },
];

export const STICK_FIGURE_COLORS = [
  '#0891b2', // cyan-600
  '#be185d', // pink-700
  '#16a34a', // green-600
  '#c026d3', // fuchsia-600
  '#d97706', // amber-600
];

// --- I18n ---

export type Language = 'en' | 'zh-CN' | 'zh-TW';

const translations: Record<string, Record<Language, string>> = {
  // App.tsx
  'app.title': {
    en: 'Sketch Stick Figure Editor',
    'zh-CN': '火柴人草图编辑器',
    'zh-TW': '火柴人草圖編輯器',
  },
  'app.description': {
    en: 'Create, pose, and arrange multiple stick figures.',
    'zh-CN': '创建、摆姿势和排列多个火柴人。',
    'zh-TW': '創建、擺姿勢和排列多個火柴人。',
  },
  'figures.title': {
    en: 'FIGURES',
    'zh-CN': '火柴人',
    'zh-TW': '火柴人',
  },
  'figures.add': {
    en: 'Add',
    'zh-CN': '添加',
    'zh-TW': '新增',
  },
  'figures.delete.tooltip': {
    en: 'Delete Selected Figure',
    'zh-CN': '删除所选火柴人',
    'zh-TW': '刪除所選火柴人',
  },
  'actions.title': {
    en: 'Action Control',
    'zh-CN': '动作控制',
    'zh-TW': '動作控制',
  },
  'actions.save': {
    en: 'Save',
    'zh-CN': '保存',
    'zh-TW': '儲存',
  },
  'actions.save.tooltip': {
    en: 'Save Pose',
    'zh-CN': '保存姿势',
    'zh-TW': '儲存姿勢',
  },
  'actions.library': {
    en: 'Library',
    'zh-CN': '库',
    'zh-TW': '庫',
  },
  'actions.library.tooltip': {
    en: 'Open Library',
    'zh-CN': '打开库',
    'zh-TW': '打開庫',
  },
  'actions.flip': {
    en: 'Flip',
    'zh-CN': '翻转',
    'zh-TW': '翻轉',
  },
  'actions.flip.tooltip': {
    en: 'Flip Horizontal',
    'zh-CN': '水平翻转',
    'zh-TW': '水平翻轉',
  },
  'aspectRatio.title': {
    en: 'Aspect Ratio',
    'zh-CN': '宽高比',
    'zh-TW': '長寬比',
  },
  'aspectRatio.screen': {
    en: 'Screen',
    'zh-CN': '屏幕',
    'zh-TW': '螢幕',
  },
  'zoom.title': {
    en: 'Zoom',
    'zh-CN': '缩放',
    'zh-TW': '縮放',
  },
  'zoom.in.tooltip': {
    en: 'Zoom In',
    'zh-CN': '放大',
    'zh-TW': '放大',
  },
  'zoom.out.tooltip': {
    en: 'Zoom Out',
    'zh-CN': '缩小',
    'zh-TW': '縮小',
  },
  'zoom.reset.tooltip': {
    en: 'Reset Zoom',
    'zh-CN': '重置缩放',
    'zh-TW': '重設縮放',
  },
  'notification.poseSaved': {
    en: 'Pose Saved!',
    'zh-CN': '姿势已保存！',
    'zh-TW': '姿勢已儲存！',
  },
  // PoseLibraryPanel.tsx
  'library.title': {
    en: 'Pose Library',
    'zh-CN': '姿势库',
    'zh-TW': '姿勢庫',
  },
  'library.close.tooltip': {
    en: 'Close pose library',
    'zh-CN': '关闭姿势库',
    'zh-TW': '關閉姿勢庫',
  },
  'library.empty': {
    en: 'No poses saved yet. Go create some!',
    'zh-CN': '尚未保存任何姿势。去创建一些吧！',
    'zh-TW': '尚未儲存任何姿勢。去創建一些吧！',
  },
  'library.apply.tooltip': {
    en: 'Apply this pose',
    'zh-CN': '应用此姿势',
    'zh-TW': '套用此姿勢',
  },
  'library.default': {
    en: 'Default',
    'zh-CN': '默认',
    'zh-TW': '預設',
  },
  'library.delete.tooltip': {
    en: 'Delete pose',
    'zh-CN': '删除姿势',
    'zh-TW': '刪除姿勢',
  },
  'language.change.tooltip': {
    en: 'Change language',
    'zh-CN': '切换语言',
    'zh-TW': '切換語言',
  },
  'theme.toggle.tooltip': {
    en: 'Toggle theme',
    'zh-CN': '切换主题',
    'zh-TW': '切換主題',
  },
};

// Function to get the browser's preferred language
const getInitialLanguage = (): Language => {
    if (typeof window === 'undefined') return 'en';
    const lang = navigator.language.toLowerCase();
    if (lang.startsWith('zh-cn')) return 'zh-CN';
    if (lang.startsWith('zh-tw') || lang.startsWith('zh-hk')) return 'zh-TW';
    if (lang.startsWith('zh')) return 'zh-CN';
    return 'en';
};

// Persist language choice
let currentLanguage: Language = (() => {
    try {
        const storedLang = localStorage.getItem('stickFigureLanguage');
        if (storedLang === 'en' || storedLang === 'zh-CN' || storedLang === 'zh-TW') {
            return storedLang;
        }
    } catch (e) {
        // ignore
    }
    return getInitialLanguage();
})();


export const setLanguage = (lang: Language) => {
  currentLanguage = lang;
  try {
    localStorage.setItem('stickFigureLanguage', lang);
  } catch (e) {
    // ignore
  }
};

export const getLanguage = (): Language => currentLanguage;

export const t = (key: string): string => {
  const translationsForKey = translations[key];
  if (!translationsForKey) {
    console.warn(`Translation key "${key}" not found.`);
    return key;
  }
  return translationsForKey[currentLanguage] || translationsForKey['en'];
};

export const LANGUAGES: { code: Language; name: string }[] = [
    { code: 'en', name: 'English' },
    { code: 'zh-CN', name: '简体中文' },
    { code: 'zh-TW', name: '繁體中文' },
];