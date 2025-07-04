import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';
import winston from 'winston';

export class CharacterBasedGenerator {
  constructor(config) {
    this.openai = new OpenAI({
      apiKey: config.openaiApiKey,
    });
    
    this.profilePath = path.join(process.cwd(), 'data', 'character_profile.json');
    this.historyPath = path.join(process.cwd(), 'data', 'tweet_history.json');
    this.maxLength = 280;
    
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [
        new winston.transports.File({ filename: 'logs/generator.log' }),
        new winston.transports.Console({ format: winston.format.simple() })
      ]
    });
  }

  async loadProfile() {
    try {
      const data = await fs.readFile(this.profilePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      throw new Error('キャラクタープロファイルが見つかりません。先にセットアップを実行してください。');
    }
  }

  async generateTweet(context = {}) {
    const profile = await this.loadProfile();
    const { character, systemPrompt, generationConfig } = profile;
    
    // 投稿タイプを選択
    const postType = this.selectPostType(character.postingPatterns.postTypes);
    
    // トピックを選択
    const topic = this.selectTopic(character.interests.topics, generationConfig.topicWeights);
    
    // 時間帯を考慮
    const timeContext = this.getTimeContext(character.postingPatterns.timePreference);
    
    // プロンプト構築
    const prompt = this.buildPrompt(postType, topic, timeContext, context, character);
    
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: generationConfig.temperature,
        max_tokens: 100
      });
      
      let tweet = completion.choices[0].message.content.trim();
      
      // 文字数調整
      if (tweet.length > this.maxLength) {
        tweet = await this.adjustTweetLength(tweet, character);
      }
      
      // 履歴に保存
      await this.saveTweetToHistory(tweet, postType, topic);
      
      this.logger.info(`Generated tweet: ${tweet}`);
      return tweet;
    } catch (error) {
      this.logger.error('Failed to generate tweet:', error);
      throw error;
    }
  }

  selectPostType(postTypes) {
    return postTypes[Math.floor(Math.random() * postTypes.length)];
  }

  selectTopic(topics, weights) {
    // 重み付きランダム選択
    const weightedTopics = [];
    topics.forEach(topic => {
      const weight = weights[topic] || 1.0;
      for (let i = 0; i < weight * 10; i++) {
        weightedTopics.push(topic);
      }
    });
    
    return weightedTopics[Math.floor(Math.random() * weightedTopics.length)];
  }

  getTimeContext(timePreference) {
    const hour = new Date().getHours();
    const contexts = {
      morning: '朝',
      afternoon: '昼',
      evening: '夜',
      night: '深夜'
    };
    
    if (hour >= 6 && hour < 12) return contexts.morning;
    if (hour >= 12 && hour < 18) return contexts.afternoon;
    if (hour >= 18 && hour < 24) return contexts.evening;
    return contexts.night;
  }

  buildPrompt(postType, topic, timeContext, context, character) {
    let prompt = `「${topic}」について、「${postType}」スタイルでツイートを作成してください。\n`;
    prompt += `時間帯: ${timeContext}\n`;
    
    // 特別ルールの適用
    if (character.advanced.specialRules) {
      prompt += `特別ルール: ${character.advanced.specialRules}\n`;
    }
    
    // 避ける言葉
    if (character.advanced.avoidWords) {
      prompt += `使わない言葉: ${character.advanced.avoidWords}\n`;
    }
    
    // コンテキスト情報
    if (context.news) {
      prompt += `関連ニュース: ${context.news}\n`;
    }
    
    if (context.trend) {
      prompt += `トレンド: ${context.trend}\n`;
    }
    
    prompt += `\n文字数は${this.maxLength}文字以内で、キャラクターの個性を活かして自然な投稿を作成してください。`;
    
    return prompt;
  }

  async adjustTweetLength(tweet, character) {
    const prompt = `このツイートを${this.maxLength}文字以内に短縮してください。キャラクターの個性は保ったまま、自然に短くしてください：\n${tweet}`;
    
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: character.systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 100
      });
      
      return completion.choices[0].message.content.trim();
    } catch (error) {
      // フォールバック
      return tweet.substring(0, this.maxLength - 3) + '...';
    }
  }

  async generateThread(topic, length = 3) {
    const profile = await this.loadProfile();
    const { character, systemPrompt } = profile;
    
    const prompt = `「${topic}」について、${length}つの連続ツイート（スレッド）を作成してください。
    各ツイートは${this.maxLength}文字以内で、1/${length}、2/${length}のように番号を付けてください。
    キャラクターの個性を保ちながら、情報を段階的に展開してください。`;
    
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 500
      });
      
      const response = completion.choices[0].message.content.trim();
      const tweets = response.split('\n').filter(t => t.trim().length > 0);
      
      return tweets;
    } catch (error) {
      this.logger.error('Failed to generate thread:', error);
      throw error;
    }
  }

  async generateContextualTweet(newsItem) {
    const profile = await this.loadProfile();
    const { character } = profile;
    
    // キャラクターが興味を持ちそうか判定
    const isInteresting = character.interests.topics.some(topic => 
      newsItem.toLowerCase().includes(topic.toLowerCase())
    );
    
    if (!isInteresting && character.interests.newsReaction !== 'active') {
      // 興味がない場合は通常のツイートを生成
      return this.generateTweet();
    }
    
    const reactionStyle = character.interests.newsReaction;
    const context = {
      news: newsItem,
      reactionStyle: reactionStyle
    };
    
    return this.generateTweet(context);
  }

  async saveTweetToHistory(tweet, postType, topic) {
    try {
      let history = [];
      try {
        const data = await fs.readFile(this.historyPath, 'utf8');
        history = JSON.parse(data);
      } catch (error) {
        // ファイルが存在しない場合は空の配列
      }
      
      history.push({
        tweet,
        postType,
        topic,
        timestamp: new Date().toISOString()
      });
      
      // 最新100件のみ保持
      if (history.length > 100) {
        history = history.slice(-100);
      }
      
      await fs.mkdir(path.dirname(this.historyPath), { recursive: true });
      await fs.writeFile(this.historyPath, JSON.stringify(history, null, 2));
    } catch (error) {
      this.logger.error('Failed to save tweet history:', error);
    }
  }
}