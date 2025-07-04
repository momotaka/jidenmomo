import { TwitterApi } from 'twitter-api-v2';
import winston from 'winston';

export class TwitterClient {
  constructor(config) {
    this.client = new TwitterApi({
      appKey: config.apiKey,
      appSecret: config.apiSecret,
      accessToken: config.accessToken,
      accessSecret: config.accessTokenSecret,
    });
    
    this.v2Client = this.client.v2;
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [
        new winston.transports.File({ filename: 'logs/twitter.log' }),
        new winston.transports.Console({
          format: winston.format.simple()
        })
      ]
    });
  }

  async verifyCredentials() {
    try {
      const me = await this.v2Client.me();
      this.logger.info(`Authenticated as @${me.data.username}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to verify credentials:', error);
      return false;
    }
  }

  async postTweet(text) {
    try {
      const tweet = await this.v2Client.tweet(text);
      this.logger.info(`Posted tweet: ${tweet.data.id}`);
      return tweet.data;
    } catch (error) {
      this.logger.error('Failed to post tweet:', error);
      throw error;
    }
  }

  async postThread(tweets) {
    try {
      let lastTweetId = null;
      const postedTweets = [];

      for (const tweetText of tweets) {
        const options = lastTweetId ? { reply: { in_reply_to_tweet_id: lastTweetId } } : {};
        const tweet = await this.v2Client.tweet(tweetText, options);
        postedTweets.push(tweet.data);
        lastTweetId = tweet.data.id;
        this.logger.info(`Posted tweet in thread: ${tweet.data.id}`);
      }

      return postedTweets;
    } catch (error) {
      this.logger.error('Failed to post thread:', error);
      throw error;
    }
  }
}