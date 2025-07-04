import axios from 'axios';
import Parser from 'rss-parser';
import winston from 'winston';

export class NewsFetcher {
  constructor(config = {}) {
    this.parser = new Parser();
    this.sources = config.sources || this.getDefaultSources();
    
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [
        new winston.transports.File({ filename: 'logs/news.log' }),
        new winston.transports.Console({ format: winston.format.simple() })
      ]
    });
  }

  getDefaultSources() {
    return {
      technology: [
        { name: 'TechCrunch Japan', url: 'https://jp.techcrunch.com/feed/' },
        { name: 'ITmedia', url: 'https://rss.itmedia.co.jp/rss/2.0/news_bursts.xml' },
        { name: 'GIGAZINE', url: 'https://gigazine.net/news/rss_2.0/' }
      ],
      general: [
        { name: 'NHK主要', url: 'https://www3.nhk.or.jp/rss/news/cat0.xml' },
        { name: 'Yahoo!ニュース', url: 'https://news.yahoo.co.jp/rss/topics/top-picks.xml' }
      ],
      entertainment: [
        { name: 'ナタリー', url: 'https://natalie.mu/feed/news' },
        { name: 'ORICON NEWS', url: 'https://www.oricon.co.jp/rss/news.xml' }
      ],
      business: [
        { name: '日経電子版', url: 'https://www.nikkei.com/rss/news.rdf' },
        { name: 'NewsPicks', url: 'https://newspicks.com/feed' }
      ],
      gaming: [
        { name: 'ファミ通', url: 'https://www.famitsu.com/rss/fcom_all.xml' },
        { name: '4Gamer', url: 'https://www.4gamer.net/rss/index.xml' }
      ]
    };
  }

  async fetchNewsByCategory(category, limit = 10) {
    const sources = this.sources[category];
    if (!sources) {
      throw new Error(`カテゴリ '${category}' が見つかりません`);
    }

    const allNews = [];
    
    for (const source of sources) {
      try {
        const feed = await this.parser.parseURL(source.url);
        const items = feed.items.slice(0, Math.ceil(limit / sources.length)).map(item => ({
          title: item.title,
          link: item.link,
          pubDate: item.pubDate,
          summary: item.contentSnippet || item.summary || '',
          source: source.name,
          category: category
        }));
        
        allNews.push(...items);
      } catch (error) {
        this.logger.error(`Failed to fetch from ${source.name}:`, error.message);
      }
    }

    // 日付順にソート
    allNews.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    
    return allNews.slice(0, limit);
  }

  async fetchNewsByKeyword(keyword, categories = null, limit = 10) {
    const targetCategories = categories || Object.keys(this.sources);
    const allNews = [];

    for (const category of targetCategories) {
      const news = await this.fetchNewsByCategory(category, limit * 2);
      const filtered = news.filter(item => 
        item.title.toLowerCase().includes(keyword.toLowerCase()) ||
        item.summary.toLowerCase().includes(keyword.toLowerCase())
      );
      allNews.push(...filtered);
    }

    // 重複を削除
    const uniqueNews = Array.from(new Map(
      allNews.map(item => [item.link, item])
    ).values());

    // 日付順にソート
    uniqueNews.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

    return uniqueNews.slice(0, limit);
  }

  async fetchTrendingTopics() {
    try {
      // Google Trends APIの代替として、複数のニュースソースから頻出キーワードを抽出
      const recentNews = await this.fetchMultipleCategories(['technology', 'general', 'entertainment'], 20);
      
      const keywords = {};
      
      recentNews.forEach(news => {
        // タイトルからキーワード抽出（簡易版）
        const words = news.title.split(/[、。\s]+/)
          .filter(word => word.length > 2) // 2文字以上
          .filter(word => !this.isCommonWord(word));
        
        words.forEach(word => {
          keywords[word] = (keywords[word] || 0) + 1;
        });
      });

      // 頻出順にソート
      const trending = Object.entries(keywords)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([keyword, count]) => ({ keyword, count }));

      return trending;
    } catch (error) {
      this.logger.error('Failed to fetch trending topics:', error);
      return [];
    }
  }

  async fetchMultipleCategories(categories, limitPerCategory = 5) {
    const allNews = [];
    
    for (const category of categories) {
      const news = await this.fetchNewsByCategory(category, limitPerCategory);
      allNews.push(...news);
    }
    
    return allNews;
  }

  isCommonWord(word) {
    const commonWords = [
      'こと', 'もの', 'ため', 'よう', 'さん', 'ほど',
      'など', 'ない', 'ある', 'する', 'れる', 'いる',
      'なる', 'できる', 'について', 'により', 'において'
    ];
    return commonWords.includes(word);
  }

  async getRelevantNews(interests, limit = 5) {
    const relevantNews = [];
    
    // 興味に基づいてカテゴリを選択
    const categoryMap = {
      'テクノロジー': 'technology',
      'AI・機械学習': 'technology',
      'ゲーム': 'gaming',
      'ビジネス': 'business',
      'エンタメ': 'entertainment'
    };
    
    const categories = new Set();
    interests.forEach(interest => {
      const category = categoryMap[interest];
      if (category) categories.add(category);
    });
    
    if (categories.size === 0) {
      categories.add('general');
    }
    
    // 各カテゴリからニュースを取得
    for (const category of categories) {
      const news = await this.fetchNewsByCategory(category, Math.ceil(limit / categories.size));
      relevantNews.push(...news);
    }
    
    // 興味のキーワードでフィルタリング
    const filtered = relevantNews.filter(news => {
      return interests.some(interest => 
        news.title.includes(interest) || 
        news.summary.includes(interest)
      );
    });
    
    return filtered.length > 0 ? filtered.slice(0, limit) : relevantNews.slice(0, limit);
  }

  formatNewsForTweet(newsItem) {
    // ニュースをツイート用に整形
    const maxTitleLength = 100;
    let title = newsItem.title;
    
    if (title.length > maxTitleLength) {
      title = title.substring(0, maxTitleLength - 3) + '...';
    }
    
    return {
      title: title,
      link: newsItem.link,
      source: newsItem.source,
      category: newsItem.category
    };
  }
}