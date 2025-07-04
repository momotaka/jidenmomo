import OpenAI from 'openai';
import winston from 'winston';

export class ContentGenerator {
  constructor(config) {
    this.openai = new OpenAI({
      apiKey: config.openaiApiKey,
    });
    
    this.personality = config.personality || 'A friendly and knowledgeable assistant';
    this.maxLength = config.maxTweetLength || 280;
    
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [
        new winston.transports.File({ filename: 'logs/content.log' }),
        new winston.transports.Console({
          format: winston.format.simple()
        })
      ]
    });
    
    this.topics = [
      'technology trends',
      'productivity tips',
      'interesting facts',
      'motivational thoughts',
      'science discoveries',
      'programming insights',
      'AI developments',
      'future predictions',
      'learning advice',
      'creative ideas'
    ];
  }

  async generateTweet() {
    try {
      const topic = this.topics[Math.floor(Math.random() * this.topics.length)];
      
      const prompt = `You are ${this.personality}. Generate a single engaging tweet about ${topic}. 
      The tweet must be under ${this.maxLength} characters, be self-contained, and engaging. 
      Do not use hashtags unless they're part of natural speech. 
      Make it conversational and authentic.`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: this.personality },
          { role: 'user', content: prompt }
        ],
        max_tokens: 100,
        temperature: 0.8,
      });

      const tweet = completion.choices[0].message.content.trim();
      
      if (tweet.length > this.maxLength) {
        return this.truncateTweet(tweet);
      }
      
      this.logger.info(`Generated tweet: ${tweet}`);
      return tweet;
    } catch (error) {
      this.logger.error('Failed to generate tweet:', error);
      throw error;
    }
  }

  async generateThread(topic, length = 3) {
    try {
      const prompt = `You are ${this.personality}. Create a Twitter thread with ${length} tweets about "${topic}".
      Each tweet must be under ${this.maxLength} characters.
      Number each tweet as 1/${length}, 2/${length}, etc.
      Make it informative and engaging.`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: this.personality },
          { role: 'user', content: prompt }
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      const response = completion.choices[0].message.content.trim();
      const tweets = response.split('\n').filter(t => t.trim().length > 0);
      
      this.logger.info(`Generated thread with ${tweets.length} tweets`);
      return tweets.map(t => this.truncateTweet(t));
    } catch (error) {
      this.logger.error('Failed to generate thread:', error);
      throw error;
    }
  }

  truncateTweet(text) {
    if (text.length <= this.maxLength) return text;
    return text.substring(0, this.maxLength - 3) + '...';
  }

  async generateVariation(originalTweet) {
    try {
      const prompt = `Rewrite this tweet in a different way while keeping the same meaning: "${originalTweet}"
      Make it under ${this.maxLength} characters and maintain the same tone.`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'user', content: prompt }
        ],
        max_tokens: 100,
        temperature: 0.9,
      });

      return this.truncateTweet(completion.choices[0].message.content.trim());
    } catch (error) {
      this.logger.error('Failed to generate variation:', error);
      throw error;
    }
  }
}