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
            network: 'Network',
            forceProxy: 'Force proxy (use local /live only)',
            audio: 'Audio Settings',
            voice: 'Voice Style',
            inputGain: 'Input Gain',
            outputGain: 'Output Gain',
            systemInstruction: 'System Instruction',
            systemInstructionPlaceholder: 'Write voice-optimized prompt (English recommended)',
            systemInstructionHelper: 'Keep it concise; define tone, pacing, brevity, turn-taking.',
            promptPreset: 'Prompt Preset',
            customPrompt: 'Custom',
            promptPresetLanguageTutor: 'Language Tutor',
            promptPresetTechInterviewer: 'Technical Interviewer',
            promptPresetEmpatheticListener: 'Empathetic Listener',
            promptPresetConciseAssistant: 'Concise Voice Assistant',
            promptPresetPirateCaptain: 'Roleplay - Pirate Captain',
            promptPresetSimultaneousInterpreter: 'Simultaneous Interpreter',
            promptPresetDungeonMaster: 'Dungeon Master',
            promptPresetBackendArchitect: 'Senior Backend Architect',
            promptPresetSousChef: 'Sous-Chef',
            promptPresetSocraticTutor: 'Socratic Tutor',
            promptPresetMeditationGuide: 'Meditation Guide',
            useGlobalConstraints: 'Enable global voice constraints'
          },
          historyPage: {
            deleteSelected: 'Delete Selected',
            deleteAll: 'Delete All',
            selectAll: 'Select All',
            empty: 'No history yet.',
            confirmDeleteSelected: 'Delete selected history items?',
            confirmDeleteAll: 'Delete all history items?',
            confirmDeleteOne: 'Delete this history item?',
            renameTitle: 'Rename Conversation',
            renameLabel: 'Title',
            renamePlaceholder: 'Enter a short title',
            renameHelper: 'Max 100 characters'
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
            network: '网络设置',
            forceProxy: '强制走代理（仅使用本机 /live）',
            audio: '音频设置',
            voice: '声音风格',
            inputGain: '输入增益',
            outputGain: '输出增益',
            systemInstruction: '系统提示（System Instruction）',
            systemInstructionPlaceholder: '编写适配语音的提示（建议英文）',
            systemInstructionHelper: '强调口语化、简练；定义语气、语速、长度与轮次。',
            promptPreset: '提示预设',
            customPrompt: '自定义',
            promptPresetLanguageTutor: '英语口语陪练',
            promptPresetTechInterviewer: '技术面试官',
            promptPresetEmpatheticListener: '情感陪伴',
            promptPresetConciseAssistant: '高效语音助手',
            promptPresetPirateCaptain: '海盗船长角色扮演',
            promptPresetSimultaneousInterpreter: '中英同声传译',
            promptPresetDungeonMaster: 'TRPG 地下城主',
            promptPresetBackendArchitect: '资深后端架构师',
            promptPresetSousChef: '厨房烹饪助手',
            promptPresetSocraticTutor: '苏格拉底式导师',
            promptPresetMeditationGuide: '冥想引导者',
            useGlobalConstraints: '启用语音对话全局约束'
          },
          historyPage: {
            deleteSelected: '删除所选',
            deleteAll: '全部删除',
            selectAll: '全选',
            empty: '暂无历史记录',
            confirmDeleteSelected: '确认删除所选历史记录？',
            confirmDeleteAll: '确认删除全部历史记录？',
            confirmDeleteOne: '确认删除该历史记录？',
            renameTitle: '重命名对话',
            renameLabel: '标题',
            renamePlaceholder: '请输入简短标题',
            renameHelper: '最长 100 个字符'
          }
        },
      },
    },
  });

export default i18n;
