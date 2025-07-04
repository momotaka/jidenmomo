import { TwitterApi } from 'twitter-api-v2';
import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';
import winston from 'winston';

export class PersonalityLearner {
  constructor(config) {
    this.twitterClient = new TwitterApi({
      appKey: config.apiKey,
      appSecret: config.apiSecret,
      accessToken: config.accessToken,
      accessSecret: config.accessTokenSecret,
    }).v2;
    
    this.openai = new OpenAI({
      apiKey: config.openaiApiKey,
    });
    
    this.profilePath = path.join(process.cwd(), 'data', 'personality_profile.json');
    this.tweetsPath = path.join(process.cwd(), 'data', 'analyzed_tweets.json');
    
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [
        new winston.transports.File({ filename: 'logs/personality.log' }),
        new winston.transports.Console({ format: winston.format.simple() })
      ]
    });
  }

  async collectUserTweets(username, count = 100) {
    try {
      const user = await this.twitterClient.userByUsername(username);
      const tweets = await this.twitterClient.userTimeline(user.data.id, {
        max_results: Math.min(count, 100),
        exclude: ['retweets', 'replies'],
        'tweet.fields': ['created_at', 'public_metrics', 'context_annotations']
      });
      
      this.logger.info(`Collected ${tweets.data.length} tweets from @${username}`);
      return tweets.data;
    } catch (error) {
      this.logger.error('Failed to collect tweets:', error);
      throw error;
    }
  }

  async analyzeTweets(tweets) {
    const analysis = {
      writingStyle: {
        sentenceEndings: {},
        emojiUsage: {},
        punctuation: {},
        averageLength: 0,
        vocabulary: new Set()
      },
      topics: {
        categories: {},
        keywords: {},
        hashtags: {}
      },
      temporalPatterns: {
        hourlyDistribution: new Array(24).fill(0),
        dailyAverage: 0
      },
      engagement: {
        averageLikes: 0,
        averageRetweets: 0
      }
    };

    for (const tweet of tweets) {
      // 文体分析
      this.analyzeWritingStyle(tweet.text, analysis.writingStyle);
      
      // トピック分析
      this.analyzeTopics(tweet, analysis.topics);
      
      // 時間パターン分析
      if (tweet.created_at) {
        const hour = new Date(tweet.created_at).getHours();
        analysis.temporalPatterns.hourlyDistribution[hour]++;
      }
      
      // エンゲージメント分析
      if (tweet.public_metrics) {
        analysis.engagement.averageLikes += tweet.public_metrics.like_count;
        analysis.engagement.averageRetweets += tweet.public_metrics.retweet_count;
      }
    }

    // 平均値計算
    analysis.writingStyle.averageLength /= tweets.length;
    analysis.engagement.averageLikes /= tweets.length;
    analysis.engagement.averageRetweets /= tweets.length;

    return analysis;
  }

  analyzeWritingStyle(text, styleData) {
    // 文末表現の抽出
    const endings = text.match(/[。！？\n]|$/g);
    const lastChars = text.slice(-10);
    
    // 絵文字の抽出
    const emojis = text.match(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]/gu) || [];
    emojis.forEach(emoji => {
      styleData.emojiUsage[emoji] = (styleData.emojiUsage[emoji] || 0) + 1;
    });
    
    // 文の長さ
    styleData.averageLength += text.length;
    
    // 語彙の収集
    const words = text.split(/\s+/);
    words.forEach(word => styleData.vocabulary.add(word));
  }

  analyzeTopics(tweet, topicsData) {
    // ハッシュタグの抽出
    const hashtags = tweet.text.match(/#\w+/g) || [];
    hashtags.forEach(tag => {
      topicsData.hashtags[tag] = (topicsData.hashtags[tag] || 0) + 1;
    });
    
    // コンテキストアノテーションがある場合
    if (tweet.context_annotations) {
      tweet.context_annotations.forEach(annotation => {
        const category = annotation.domain.name;
        topicsData.categories[category] = (topicsData.categories[category] || 0) + 1;
      });
    }
  }

  async generatePersonalityProfile(analysis) {
    const prompt = `Based on this Twitter usage analysis, create a personality profile:
    ${JSON.stringify(analysis, null, 2)}
    
    Generate a JSON profile with:
    1. personality_traits (humor, formality, enthusiasm as 0-1 scores)
    2. writing_patterns (common phrases, sentence structures)
    3. content_preferences (topics to tweet about)
    4. interaction_style (how to respond to others)`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      });

      const profile = JSON.parse(completion.choices[0].message.content);
      
      // 分析データと統合
      profile.raw_analysis = analysis;
      profile.created_at = new Date().toISOString();
      
      await this.saveProfile(profile);
      return profile;
    } catch (error) {
      this.logger.error('Failed to generate personality profile:', error);
      throw error;
    }
  }

  async saveProfile(profile) {
    await fs.mkdir(path.dirname(this.profilePath), { recursive: true });
    await fs.writeFile(this.profilePath, JSON.stringify(profile, null, 2));
    this.logger.info('Personality profile saved');
  }

  async loadProfile() {
    try {
      const data = await fs.readFile(this.profilePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      this.logger.warn('No existing profile found');
      return null;
    }
  }

  async learnFromUser(username) {
    this.logger.info(`Starting personality learning for @${username}`);
    
    // ツイート収集
    const tweets = await this.collectUserTweets(username, 200);
    
    // 分析
    const analysis = await this.analyzeTweets(tweets);
    
    // プロファイル生成
    const profile = await this.generatePersonalityProfile(analysis);
    
    this.logger.info('Personality learning completed');
    return profile;
  }
}