'use client';

import { useState } from 'react';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import type { Language } from '@/lib/i18n';

export default function PrivacyPage() {
  const [lang, setLang] = useState<Language>('en');

  const content = {
    title: { en: 'Privacy Policy', zh: '隐私政策' },
    lastUpdated: { en: 'Last updated: May 2026', zh: '最后更新：2026年5月' },
    intro: {
      en: 'Cultural Compass ("the Game") is designed to help Chinese adoptees reconnect with their cultural heritage through interactive storytelling. Your privacy is important to us.',
      zh: '文化指南（"本游戏"）旨在通过互动故事帮助华裔被收养者重新连接他们的文化根源。我们重视您的隐私。',
    },
    sections: [
      {
        title: { en: '1. What Data We Collect', zh: '1. 我们收集哪些数据' },
        body: {
          en: 'The Game stores game progress locally in your browser (localStorage), including: completed scenarios, collected wisdom cards, learning stage progress, and language preference. If you use the guided or practice modes, your conversation messages are sent to the DeepSeek AI API for response generation. These messages are processed in transit and are not permanently stored by us.',
          zh: '本游戏在您的浏览器本地（localStorage）存储游戏进度，包括：已完成的场景、收集的智慧卡片、学习阶段进度和语言偏好。如果您使用引导或练习模式，您的对话消息会发送到DeepSeek AI API以生成回复。这些消息在传输过程中被处理，我们不会永久存储。',
        },
      },
      {
        title: { en: '2. How We Use Your Data', zh: '2. 我们如何使用您的数据' },
        body: {
          en: 'Local progress data is used solely to maintain your game state across sessions on the same device. Conversation content sent to the DeepSeek API is used exclusively for generating NPC responses and cultural feedback within the game. We do not use your data for training AI models, marketing, or any purpose beyond gameplay.',
          zh: '本地进度数据仅用于在同一设备上的不同会话之间维护您的游戏状态。发送到DeepSeek API的对话内容仅用于在游戏中生成NPC回应和文化反馈。我们不会将您的数据用于AI模型训练、营销或游戏之外的任何目的。',
        },
      },
      {
        title: { en: '3. Data Sharing', zh: '3. 数据共享' },
        body: {
          en: 'Conversation messages are transmitted to DeepSeek (API provider) for AI response generation. DeepSeek\'s privacy policy governs how they handle data in transit. We do not share your game progress, conversation content, or any personal data with third parties for advertising, analytics, or any other commercial purpose.',
          zh: '对话消息被传输到DeepSeek（API服务提供商）以生成AI回复。DeepSeek的隐私政策规定了他们如何处理传输中的数据。我们不会将您的游戏进度、对话内容或任何个人数据分享给第三方用于广告、分析或任何其他商业目的。',
        },
      },
      {
        title: { en: '4. Cookies & Local Storage', zh: '4. Cookie与本地存储' },
        body: {
          en: 'The Game uses localStorage (a browser feature) to persist your game progress. This is essential for the game to function and does not track you across websites. We do not use advertising cookies, analytics cookies, or any third-party tracking technologies.',
          zh: '本游戏使用localStorage（浏览器功能）来保存您的游戏进度。这对游戏正常运行是必需的，不会跨网站追踪您。我们不使用广告Cookie、分析Cookie或任何第三方追踪技术。',
        },
      },
      {
        title: { en: '5. Children\'s Privacy', zh: '5. 儿童隐私' },
        body: {
          en: 'The Game is designed for Chinese adoptees of all ages. We do not knowingly collect personal information from children under 13. All game data is stored locally on the device and conversation content with the AI is ephemeral — it is not retained after the API call completes.',
          zh: '本游戏面向所有年龄段的华裔被收养者。我们不会故意收集13岁以下儿童的个人信息。所有游戏数据都存储在设备本地，与AI的对话内容是临时的——在API调用完成后不会被保留。',
        },
      },
      {
        title: { en: '6. Your Rights & Choices', zh: '6. 您的权利与选择' },
        body: {
          en: 'You can clear your game data at any time by clearing your browser\'s localStorage for this site. Since we do not maintain server-side accounts or databases of user data, there is no account deletion process needed. Your conversational data with the AI is ephemeral and not retained by us.',
          zh: '您可以随时通过清除浏览器中本网站的localStorage来清除游戏数据。由于我们不维护服务器端账户或用户数据数据库，因此无需账户删除流程。您与AI的对话数据是临时的，不会被我们保留。',
        },
      },
      {
        title: { en: '7. Contact', zh: '7. 联系方式' },
        body: {
          en: 'If you have questions about this privacy policy or how your data is handled, please reach out through the project\'s GitHub repository or contact the developer directly.',
          zh: '如果您对本隐私政策或数据处理方式有疑问，请通过项目的GitHub仓库联系或直接联系开发者。',
        },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-stone-100">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-stone-900">{content.title[lang]}</h1>
          <LanguageToggle lang={lang} onToggle={setLang} />
        </div>
        <p className="text-sm text-stone-400 mb-8">{content.lastUpdated[lang]}</p>
        <p className="text-stone-600 mb-8 leading-relaxed">{content.intro[lang]}</p>
        {content.sections.map((section, i) => (
          <div key={i} className="mb-8">
            <h2 className="text-lg font-semibold text-stone-800 mb-3">{section.title[lang]}</h2>
            <p className="text-stone-600 leading-relaxed">{section.body[lang]}</p>
          </div>
        ))}
        <div className="mt-12 pt-8 border-t border-stone-200">
          <a href="/" className="text-sm text-amber-600 hover:text-amber-700 transition-colors">
            {lang === 'en' ? '← Back to Cultural Compass' : '← 返回文化指南'}
          </a>
        </div>
      </div>
    </div>
  );
}
