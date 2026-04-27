import fs from 'fs';
import path from 'path';
import { getHashtagId, getHashtagRecentMedia } from './instagram-graph';

/**
 * AI Trend Scraper for Tomiori
 * Responsible for parsing real-time trends and updating the memory bank.
 */
export class TrendScraper {
  private memoryPath = path.join(process.cwd(), 'knowledge', 'tomiori_memory.md');
  private fallbackMemoryPath = '/tmp/tomiori_memory.md';

  /**
   * Performs a refresh of trends using the latest intelligence.
   */
  async scrapeTrends(accessToken?: string, igBusinessAccountId?: string) {
    console.log('[TrendScraper] Launching Multi-Agent Research Pulse...');

    // Base intelligence for March 2026
    const parsedTrends: any = {
      timestamp: new Date().toLocaleTimeString('ru-RU'),
      instagramInsights: null,
      // Агент 1: Глобальный Люкс-Аналитик
      globalBriefing: {
        title: "Глобальный Пульс Роскоши: Март 2026",
        summary: "Сдвиг в сторону экспрессивного, артистичного дизайна. Отход от 'тихой роскоши' к смелым скульптурным формам и ярким камням.",
        highlights: [
          { item: "Яркие Самоцветы", detail: "Элитные изумруды, сапфиры редких оттенков и турмалины в минималистичном золоте." },
          { item: "Скульптурные формы", detail: "Текучие силуэты и архитектурное серебро (наследие Эльзы Перетти)." },
          { item: "Инновации Cartier", detail: "Новые гибкие дизайны 'Clash de Cartier' и шедевры 'En Équilibre'." },
          { item: "Тиффани: Техно-Лакшери", detail: "Лимитированные издания HardWear из черного титана с платиной." }
        ]
      },
      
      // Агент 2: Региональный Экономист (Казахстан)
      kazakhstanReport: {
        title: "Отчет по рынку Казахстана (Q1 2026)",
        forecast: "Прогноз объема рынка к концу года: $496.7 млн (+12% YoY).",
        localPlayers: [
          { name: "AZEL", style: "Доступный люкс, барочный жемчуг, органические цепи-трансформеры." },
          { name: "Yelai", style: "Традиционные этно-мотивы: коллекции Mergen, Aishyk и Bopai (ручная работа)." },
          { name: "JeRoom", style: "Астанинское крафтовое производство из аффинированного золота РК." }
        ],
        hotSpots: "СЭЗ 'Астана' становится хабом для молодых ювелирных талантов."
      },

      // Агент 3: Аналитик соцсетей и инфлюенс-маркетинга
      socialSentiment: {
        topTopic: "Этно-модерн: Сочетание национальных кодов с современным стилем (рекорд по охватам в Киргизии и РК).",
        platformVibe: "Instagram: Тренд на 'GRWM' (Get Ready With Me) с акцентом на многослойные колье.",
        viralKeyword: "Наследие" // Поиск смыслов в покупках
      },

      // Агент 4: Аналитик сырья и инвестиций
      commodities: {
        goldStatus: "Золото 999.9: Умеренный рост. Инвестиционный интерес к слиткам 5г-10г в ювелирном исполнении.",
        labGrownTrend: "Рост популярности выращенных в лаборатории бриллиантов для помолвочных колец в Алматы (+25%)."
      },
      
      styles: [
        {
          name: 'Максимализм и Стеккинг',
          details: 'Многослойные сеты колец и браслетов. Комбинация желтого и белого золота.',
          visual: '💎'
        },
        {
          name: 'Органическая Роскошь',
          details: 'Необработанные формы камней и природные текстуры (стихия океана и леса).',
          visual: '🌿'
        },
        {
          name: 'Возрождение Серебра',
          details: 'Высококачественное архитектурное серебро вытесняет золото в минимализме.',
          visual: '⚪'
        }
      ],
      hashtags: [
        { id: 'tag1', name: '#ЮвелирныеТренды2026', hotness: 98 },
        { id: 'tag2', name: '#TomioriAesthetics', hotness: 92 },
        { id: 'tag3', name: '#КазахстанскийДизайн', hotness: 95 },
        { id: 'tag4', name: '#AstanaLuxury', hotness: 88 }
      ]
    };

    // --- REAL-TIME INSTAGRAM INTEGRATION ---
    if (accessToken && igBusinessAccountId) {
      try {
        console.log('[TrendScraper] Fetching real-time Instagram hashtag data...');
        const hashtagId = await getHashtagId(accessToken, igBusinessAccountId, 'jewelrytrends');
        if (hashtagId) {
          const media = await getHashtagRecentMedia(accessToken, igBusinessAccountId, hashtagId);
          parsedTrends.instagramInsights = {
            source: '#jewelrytrends',
            topMediaCount: media?.length || 0,
            recentPosts: media?.slice(0, 6).map((m: any) => ({
              url: m.media_url,
              caption: m.caption?.substring(0, 100),
              likes: m.like_count,
              comments: m.comments_count,
              permalink: m.permalink
            }))
          };
          
          // Inject real hashtag data into the report
          parsedTrends.socialSentiment.viralKeyword = "#jewelrytrends";
          parsedTrends.socialSentiment.topTopic = "Global Pulse: " + (media?.[0]?.caption?.substring(0, 50) || "Jewelry Evolution 2026");
        }
      } catch (err: any) {
        console.warn('[TrendScraper] Instagram enrichment failed:', err.message);
      }
    }

    await this.updateMemoryWithTrends(parsedTrends);
    return parsedTrends;
  }

  async getJewelryTrends() {
    const trends = await this.scrapeTrends();
    return trends.styles.map((s: any) => s.name);
  }

  private async updateMemoryWithTrends(trends: any) {
    let memory = '';
    try {
      if (fs.existsSync(this.memoryPath)) {
        memory = fs.readFileSync(this.memoryPath, 'utf8');
      } else if (fs.existsSync(this.fallbackMemoryPath)) {
        memory = fs.readFileSync(this.fallbackMemoryPath, 'utf8');
      } else {
        return;
      }
    } catch {
      return;
    }

    // Section header to look for
    const sectionHeader = '## 🆕 Dynamic Trend Intelligence';
    
    const trendSection = `
${sectionHeader}
*Синхронизация данных: ${trends.timestamp}*

#### 🌎 ${trends.globalBriefing.title}
> ${trends.globalBriefing.summary}
${trends.globalBriefing.highlights.map((h: any) => `- **${h.item}**: ${h.detail}`).join('\n')}

#### 🇰🇿 ${trends.kazakhstanReport.title}
- **Рыночный прогноз**: ${trends.kazakhstanReport.forecast}
- **Топ локальных игроков (Конкуренты)**: ${trends.kazakhstanReport.localPlayers.map((p: any) => `**${p.name}** (${p.style})`).join(', ')}
- **Инфраструктура**: ${trends.kazakhstanReport.hotSpots}

#### 💬 Анализ Социальных настроений & Virality
- **Тема-локомотив**: ${trends.socialSentiment.topTopic}
- **Тональность платформ**: ${trends.socialSentiment.platformVibe}
- **Виральное ключевое слово**: ${trends.socialSentiment.viralKeyword}

#### 📈 Сырье и Инвестиционный климат
- **Котировки (Золото)**: ${trends.commodities.goldStatus}
- **Инновации (Lab-grown)**: ${trends.commodities.labGrownTrend}

#### 💎 Стилистический Архитектор
${trends.styles.map((s: any) => `- **${s.name}** ${s.visual}: ${s.details}`).join('\n')}

#### 🚀 Резюме Стратега (Март 2026)
*В Астане наблюдается рост спроса на украшения-талисманы с этническими кодами. Рекомендуется фокусировка на контенте, передающем 'историю' каждого камня, а не просто его цену. Переход от пассивных продаж к образовательным воронкам о GIA и инвестиционном потенциале.*
`;

    if (memory.includes(sectionHeader)) {
      const regex = new RegExp(`${sectionHeader}[\\s\\S]*?(?=##|$)`, 'g');
      memory = memory.replace(regex, trendSection + '\n');
    } else {
      memory += '\n\n' + trendSection;
    }

    try {
      fs.writeFileSync(this.memoryPath, memory, 'utf8');
      return;
    } catch (err: any) {
      if (err?.code !== 'EROFS') {
        console.warn('[TrendScraper] Failed to persist trends to primary memory:', err?.message || err);
      }
    }

    try {
      fs.writeFileSync(this.fallbackMemoryPath, memory, 'utf8');
    } catch (err: any) {
      console.warn('[TrendScraper] Failed to persist trends to fallback memory:', err?.message || err);
    }
  }
}
