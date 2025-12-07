import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'zh-CN',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    resources: {
      'en-US': {
        translation: {
          common: {
            dialog: 'Dialog',
            history: 'History',
            settings: 'Settings',
            start: 'Start',
            stop: 'Stop',
            clear: 'Clear',
            save: 'Save',
            cancel: 'Cancel',
            delete: 'Delete',
          },
          home: {
            welcome: 'Tap microphone to start conversation',
            listening: 'Listening...',
            speaking: 'Gemini is speaking...',
          },
          settings: {
            apiKey: 'API Key',
            apiKeyPlaceholder: 'Enter your Gemini API Key',
            theme: 'Theme',
            language: 'Language',
            audio: 'Audio Settings',
            voice: 'Voice Style',
            inputGain: 'Input Gain',
            outputGain: 'Output Gain',
          },
          historyPage: {
            deleteSelected: 'Delete Selected',
            deleteAll: 'Delete All',
            selectAll: 'Select All',
            empty: 'No history yet.',
            confirmDeleteSelected: 'Delete selected history items?',
            confirmDeleteAll: 'Delete all history items?',
            confirmDeleteOne: 'Delete this history item?'
          }
        },
      },
      'zh-CN': {
        translation: {
          common: {
            dialog: '对话',
            history: '历史',
            settings: '设置',
            start: '开始',
            stop: '停止',
            clear: '清空',
            save: '保存',
            cancel: '取消',
            delete: '删除',
          },
          home: {
            welcome: '点击麦克风开始对话',
            listening: '正在聆听...',
            speaking: 'Gemini 正在说话...',
          },
          settings: {
            apiKey: 'API 密钥',
            apiKeyPlaceholder: '请输入 Gemini API 密钥',
            theme: '主题',
            language: '语言',
            audio: '音频设置',
            voice: '声音风格',
            inputGain: '输入增益',
            outputGain: '输出增益',
          },
          historyPage: {
            deleteSelected: '删除所选',
            deleteAll: '全部删除',
            selectAll: '全选',
            empty: '暂无历史记录',
            confirmDeleteSelected: '确认删除所选历史记录？',
            confirmDeleteAll: '确认删除全部历史记录？',
            confirmDeleteOne: '确认删除该历史记录？'
          }
        },
      },
    },
  });

export default i18n;
