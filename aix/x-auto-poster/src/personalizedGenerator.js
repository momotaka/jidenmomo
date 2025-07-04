import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';
import winston from 'winston';

export class PersonalizedGenerator {
  constructor(config) {
    this.openai = new OpenAI({
      apiKey: config.openaiApiKey,
    });
    
    this.profilePath = path.join(process.cwd(), 'data', 'personality_profile.json');
    this.contextPath = path.join(process.cwd(), 'data', 'context.json');
    this.maxLength = config.maxTweetLength || 280;
    
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [
        new winston.transports.File({ filename: 'logs/generator.log' }),
        new winston.transports.Console({ format: winston.format.simple() })
      ]
    });
  }

  async loadPersonality() {
    try {
      const data = await fs.readFile(this.profilePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      this.logger.error('Failed to load personality profile');
      throw new Error('Personality profile not found. Please run learning first.');
    }
  }

  async generatePersonalizedTweet(context = {}) {
    const profile = await this.loadPersonality();
    
    // 時間帯に基づいたトピック選択
    const hour = new Date().getHours();
    const activeHours = profile.raw_analysis.temporalPatterns.hourlyDistribution;
    const isActiveTime = activeHours[hour] > (activeHours.reduce((a, b) => a + b) / 24);
    
    // よく使う絵文字を取得
    const topEmojis = Object.entries(profile.raw_analysis.writingStyle.emojiUsage)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([emoji]) => emoji);
    
    // プロンプト構築
    const prompt = this.buildPersonalizedPrompt(profile, {
      isActiveTime,
      topEmojis,
      currentContext: context
    });

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { 
            role: 'system', 
            content: `You are creating tweets that perfectly mimic this person's style. 
            Personality traits: ${JSON.stringify(profile.personality_traits)}
            Writing patterns: ${JSON.stringify(profile.writing_patterns)}`
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 100
      });

      const tweet = completion.choices[0].message.content.trim();
      
      // 文字数調整
      if (tweet.length > this.maxLength) {
        return this.adjustLength(tweet, profile);
      }
      
      this.logger.info(`Generated personalized tweet: ${tweet}`);
      return tweet;
    } catch (error) {
      this.logger.error('Failed to generate personalized tweet:', error);
      throw error;
    }
  }

  buildPersonalizedPrompt(profile, options) {
    const { isActiveTime, topEmojis, currentContext } = options;
    
    let prompt = `Generate a tweet that sounds exactly like this person would write.
    
    Style characteristics:
    - Average tweet length: ${profile.raw_analysis.writingStyle.averageLength} characters
    - Frequently used emojis: ${topEmojis.join(' ')}
    - Formality level: ${profile.personality_traits.formality}
    - Humor level: ${profile.personality_traits.humor}
    
    Common topics: ${Object.keys(profile.raw_analysis.topics.categories).slice(0, 5).join(', ')}
    `;
    
    if (currentContext.news) {
      prompt += `\nCurrent news context: ${currentContext.news}`;
    }
    
    if (currentContext.trend) {
      prompt += `\nCurrent trending topic: ${currentContext.trend}`;
    }
    
    prompt += `\n\nThe tweet must be under ${this.maxLength} characters and sound natural.`;
    
    return prompt;
  }

  adjustLength(tweet, profile) {
    // プロファイルに基づいた省略方法
    if (profile.personality_traits.formality < 0.5) {
      // カジュアルな省略
      tweet = tweet.replace(/している/g, 'してる');
      tweet = tweet.replace(/ている/g, 'てる');
      tweet = tweet.replace(/のです/g, 'の');
    }
    
    if (tweet.length > this.maxLength) {
      return tweet.substring(0, this.maxLength - 3) + '...';
    }
    
    return tweet;
  }

  async generateContextualTweet(newsItems = []) {
    const profile = await this.loadPersonality();
    
    // ユーザーが興味を持ちそうなニュースを選択
    const relevantNews = this.filterRelevantNews(newsItems, profile);
    
    if (relevantNews.length === 0) {
      return this.generatePersonalizedTweet();
    }
    
    const context = {
      news: relevantNews[0].title,
      trend: relevantNews[0].category
    };
    
    return this.generatePersonalizedTweet(context);
  }

  filterRelevantNews(newsItems, profile) {
    const userTopics = Object.keys(profile.raw_analysis.topics.categories);
    
    return newsItems.filter(news => {
      return userTopics.some(topic => 
        news.title.toLowerCase().includes(topic.toLowerCase()) ||
        news.category?.toLowerCase().includes(topic.toLowerCase())
      );
    });
  }

  async generateReplyStyle(inReplyTo) {
    const profile = await this.loadPersonality();
    
    const prompt = `Based on this tweet: "${inReplyTo}"
    Generate a reply in this person's style.
    Interaction style: ${JSON.stringify(profile.interaction_style)}
    Keep it under ${this.maxLength} characters.`;
    
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: `Personality: ${JSON.stringify(profile.personality_traits)}` },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 100
      });
      
      return completion.choices[0].message.content.trim();
    } catch (error) {
      this.logger.error('Failed to generate reply:', error);
      throw error;
    }
  }
}