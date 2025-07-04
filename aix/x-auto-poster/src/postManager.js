import inquirer from 'inquirer';
import chalk from 'chalk';
import { CharacterBasedGenerator } from './characterBasedGenerator.js';
import { TwitterClient } from './twitter.js';
import winston from 'winston';

export class PostManager {
  constructor(config) {
    this.generator = new CharacterBasedGenerator(config);
    this.twitterClient = new TwitterClient(config);
    this.isDryRun = config.isDryRun || false;
    
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [
        new winston.transports.File({ filename: 'logs/post-manager.log' }),
        new winston.transports.Console({ format: winston.format.simple() })
      ]
    });
  }

  async generateWithPreview(context = {}) {
    let approved = false;
    let tweet = null;
    
    while (!approved) {
      // ツイート生成
      tweet = await this.generator.generateTweet(context);
      
      // プレビュー表示
      console.log('\n' + chalk.blue('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
      console.log(chalk.yellow('📝 生成されたツイート:'));
      console.log(chalk.white(tweet));
      console.log(chalk.gray(`文字数: ${tweet.length}/280`));
      console.log(chalk.blue('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
      
      // 承認確認
      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'このツイートをどうしますか？',
          choices: [
            { name: '✅ 投稿する', value: 'approve' },
            { name: '🔄 再生成する', value: 'regenerate' },
            { name: '✏️  編集する', value: 'edit' },
            { name: '❌ キャンセル', value: 'cancel' }
          ]
        }
      ]);
      
      switch (action) {
        case 'approve':
          approved = true;
          break;
          
        case 'regenerate':
          console.log(chalk.yellow('🔄 再生成中...'));
          continue;
          
        case 'edit':
          const { editedTweet } = await inquirer.prompt([
            {
              type: 'editor',
              name: 'editedTweet',
              message: 'ツイートを編集してください:',
              default: tweet
            }
          ]);
          tweet = editedTweet.trim();
          
          if (tweet.length > 280) {
            console.log(chalk.red(`⚠️  文字数が超過しています: ${tweet.length}/280`));
            const { truncate } = await inquirer.prompt([
              {
                type: 'confirm',
                name: 'truncate',
                message: '280文字に切り詰めますか？',
                default: true
              }
            ]);
            
            if (truncate) {
              tweet = tweet.substring(0, 277) + '...';
            } else {
              continue;
            }
          }
          approved = true;
          break;
          
        case 'cancel':
          return null;
      }
    }
    
    return tweet;
  }

  async testPost() {
    console.log(chalk.cyan('\n🧪 テスト投稿モード\n'));
    
    // テスト用のコンテキスト選択
    const { testType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'testType',
        message: 'テストする投稿タイプを選択:',
        choices: [
          { name: '通常のツイート', value: 'normal' },
          { name: 'ニュースに反応', value: 'news' },
          { name: 'スレッド投稿', value: 'thread' },
          { name: '特定トピック', value: 'topic' }
        ]
      }
    ]);
    
    let context = {};
    
    switch (testType) {
      case 'news':
        const { newsTitle } = await inquirer.prompt([
          {
            type: 'input',
            name: 'newsTitle',
            message: 'テスト用のニュースタイトルを入力:',
            default: 'AIが人間の創造性を超える日が来るか？研究者の見解'
          }
        ]);
        context.news = newsTitle;
        break;
        
      case 'topic':
        const { topic } = await inquirer.prompt([
          {
            type: 'input',
            name: 'topic',
            message: 'トピックを入力:',
            default: 'プログラミング'
          }
        ]);
        context.topic = topic;
        break;
        
      case 'thread':
        return this.testThread();
    }
    
    // ツイート生成とプレビュー
    const tweet = await this.generateWithPreview(context);
    
    if (!tweet) {
      console.log(chalk.yellow('キャンセルされました'));
      return;
    }
    
    // テスト投稿確認
    const { doTestPost } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'doTestPost',
        message: '実際にテスト投稿しますか？（本番環境に投稿されます）',
        default: false
      }
    ]);
    
    if (doTestPost) {
      try {
        if (this.isDryRun) {
          console.log(chalk.green('✅ [DRY RUN] テスト投稿完了（実際には投稿されていません）'));
        } else {
          const result = await this.twitterClient.postTweet(tweet);
          console.log(chalk.green(`✅ テスト投稿完了！ ID: ${result.id}`));
          console.log(chalk.blue(`URL: https://twitter.com/i/web/status/${result.id}`));
        }
      } catch (error) {
        console.log(chalk.red('❌ 投稿エラー:', error.message));
      }
    }
  }

  async testThread() {
    const { topic, length } = await inquirer.prompt([
      {
        type: 'input',
        name: 'topic',
        message: 'スレッドのトピック:',
        default: 'プログラミング初心者へのアドバイス'
      },
      {
        type: 'number',
        name: 'length',
        message: 'ツイート数:',
        default: 3,
        validate: (value) => value >= 2 && value <= 10
      }
    ]);
    
    console.log(chalk.yellow('\n🔄 スレッド生成中...'));
    const tweets = await this.generator.generateThread(topic, length);
    
    // スレッドプレビュー
    console.log('\n' + chalk.blue('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.yellow('🧵 生成されたスレッド:'));
    tweets.forEach((tweet, index) => {
      console.log(chalk.cyan(`\n[${index + 1}/${tweets.length}]`));
      console.log(chalk.white(tweet));
      console.log(chalk.gray(`文字数: ${tweet.length}/280`));
    });
    console.log(chalk.blue('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    
    const { approve } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'approve',
        message: 'このスレッドを投稿しますか？',
        default: false
      }
    ]);
    
    if (approve && !this.isDryRun) {
      try {
        const results = await this.twitterClient.postThread(tweets);
        console.log(chalk.green('✅ スレッド投稿完了！'));
        results.forEach((result, index) => {
          console.log(chalk.blue(`[${index + 1}] https://twitter.com/i/web/status/${result.id}`));
        });
      } catch (error) {
        console.log(chalk.red('❌ スレッド投稿エラー:', error.message));
      }
    }
  }

  async previewNextScheduledTweets(count = 5) {
    console.log(chalk.cyan(`\n📅 次の${count}件の予定投稿プレビュー\n`));
    
    const previews = [];
    for (let i = 0; i < count; i++) {
      const tweet = await this.generator.generateTweet();
      previews.push({
        index: i + 1,
        content: tweet,
        length: tweet.length
      });
    }
    
    previews.forEach(preview => {
      console.log(chalk.yellow(`[${preview.index}]`));
      console.log(chalk.white(preview.content));
      console.log(chalk.gray(`文字数: ${preview.length}/280\n`));
    });
    
    return previews;
  }

  async manualPost() {
    console.log(chalk.cyan('\n✍️  手動投稿モード\n'));
    
    const tweet = await this.generateWithPreview();
    
    if (!tweet) {
      console.log(chalk.yellow('キャンセルされました'));
      return;
    }
    
    try {
      if (this.isDryRun) {
        console.log(chalk.green('✅ [DRY RUN] 投稿完了（実際には投稿されていません）'));
      } else {
        const result = await this.twitterClient.postTweet(tweet);
        console.log(chalk.green('✅ 投稿完了！'));
        console.log(chalk.blue(`URL: https://twitter.com/i/web/status/${result.id}`));
      }
    } catch (error) {
      console.log(chalk.red('❌ 投稿エラー:', error.message));
      this.logger.error('Manual post failed:', error);
    }
  }
}