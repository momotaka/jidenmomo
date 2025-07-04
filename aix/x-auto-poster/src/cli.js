#!/usr/bin/env node
import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import dotenv from 'dotenv';
import { PostManager } from './postManager.js';
import { NewsFetcher } from './newsFetcher.js';
import { CharacterBasedGenerator } from './characterBasedGenerator.js';
import fs from 'fs/promises';
import path from 'path';

dotenv.config();

const program = new Command();

async function loadConfig() {
  const config = {
    apiKey: process.env.TWITTER_API_KEY,
    apiSecret: process.env.TWITTER_API_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessTokenSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
    openaiApiKey: process.env.OPENAI_API_KEY,
    isDryRun: process.env.DRY_RUN === 'true'
  };

  // 必須項目チェック
  const required = ['apiKey', 'apiSecret', 'accessToken', 'accessTokenSecret', 'openaiApiKey'];
  const missing = required.filter(key => !config[key]);
  
  if (missing.length > 0) {
    console.log(chalk.red('❌ 環境変数が設定されていません:'));
    missing.forEach(key => console.log(chalk.yellow(`  - ${key}`)));
    console.log(chalk.cyan('\n.envファイルを作成し、必要な認証情報を設定してください。'));
    process.exit(1);
  }
  
  return config;
}

async function checkCharacterProfile() {
  const profilePath = path.join(process.cwd(), 'data', 'character_profile.json');
  try {
    await fs.access(profilePath);
    return true;
  } catch {
    return false;
  }
}

program
  .name('x-auto-poster')
  .description('AI-powered X (Twitter) auto posting bot')
  .version('1.0.0');

program
  .command('test')
  .description('テスト投稿機能')
  .action(async () => {
    if (!await checkCharacterProfile()) {
      console.log(chalk.red('❌ キャラクタープロファイルが見つかりません'));
      console.log(chalk.yellow('先に npm run setup を実行してください'));
      return;
    }
    
    const config = await loadConfig();
    const manager = new PostManager(config);
    await manager.testPost();
  });

program
  .command('post')
  .description('手動で投稿（プレビュー付き）')
  .action(async () => {
    if (!await checkCharacterProfile()) {
      console.log(chalk.red('❌ キャラクタープロファイルが見つかりません'));
      console.log(chalk.yellow('先に npm run setup を実行してください'));
      return;
    }
    
    const config = await loadConfig();
    const manager = new PostManager(config);
    await manager.manualPost();
  });

program
  .command('preview')
  .description('次の投稿をプレビュー')
  .option('-n, --number <count>', '表示する投稿数', '5')
  .action(async (options) => {
    if (!await checkCharacterProfile()) {
      console.log(chalk.red('❌ キャラクタープロファイルが見つかりません'));
      console.log(chalk.yellow('先に npm run setup を実行してください'));
      return;
    }
    
    const config = await loadConfig();
    const manager = new PostManager(config);
    await manager.previewNextScheduledTweets(parseInt(options.number));
  });

program
  .command('news')
  .description('最新ニュースを取得')
  .action(async () => {
    const fetcher = new NewsFetcher();
    
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: '取得方法を選択:',
        choices: [
          { name: 'カテゴリで取得', value: 'category' },
          { name: 'キーワードで検索', value: 'keyword' },
          { name: 'トレンドを表示', value: 'trends' },
          { name: 'キャラクターの興味に基づいて取得', value: 'interests' }
        ]
      }
    ]);
    
    switch (action) {
      case 'category':
        await fetchByCategory(fetcher);
        break;
      case 'keyword':
        await fetchByKeyword(fetcher);
        break;
      case 'trends':
        await showTrends(fetcher);
        break;
      case 'interests':
        await fetchByInterests(fetcher);
        break;
    }
  });

async function fetchByCategory(fetcher) {
  const { category } = await inquirer.prompt([
    {
      type: 'list',
      name: 'category',
      message: 'カテゴリを選択:',
      choices: [
        { name: 'テクノロジー', value: 'technology' },
        { name: '一般ニュース', value: 'general' },
        { name: 'エンタメ', value: 'entertainment' },
        { name: 'ビジネス', value: 'business' },
        { name: 'ゲーム', value: 'gaming' }
      ]
    }
  ]);
  
  console.log(chalk.yellow('\n📰 ニュースを取得中...'));
  const news = await fetcher.fetchNewsByCategory(category, 10);
  
  displayNews(news);
  
  await askToGenerateTweet(news);
}

async function fetchByKeyword(fetcher) {
  const { keyword } = await inquirer.prompt([
    {
      type: 'input',
      name: 'keyword',
      message: '検索キーワード:',
      validate: input => input.length > 0
    }
  ]);
  
  console.log(chalk.yellow('\n🔍 検索中...'));
  const news = await fetcher.fetchNewsByKeyword(keyword, null, 10);
  
  if (news.length === 0) {
    console.log(chalk.red('該当するニュースが見つかりませんでした'));
    return;
  }
  
  displayNews(news);
  
  await askToGenerateTweet(news);
}

async function showTrends(fetcher) {
  console.log(chalk.yellow('\n📈 トレンドを取得中...'));
  const trends = await fetcher.fetchTrendingTopics();
  
  console.log(chalk.cyan('\n🔥 トレンドキーワード:\n'));
  trends.forEach((trend, index) => {
    console.log(chalk.white(`${index + 1}. ${trend.keyword} (${trend.count}回)`));
  });
}

async function fetchByInterests(fetcher) {
  if (!await checkCharacterProfile()) {
    console.log(chalk.red('❌ キャラクタープロファイルが見つかりません'));
    return;
  }
  
  const profilePath = path.join(process.cwd(), 'data', 'character_profile.json');
  const profile = JSON.parse(await fs.readFile(profilePath, 'utf8'));
  const interests = profile.character.interests.topics;
  
  console.log(chalk.yellow('\n🎯 興味に基づいてニュースを取得中...'));
  console.log(chalk.gray(`興味: ${interests.join(', ')}`));
  
  const news = await fetcher.getRelevantNews(interests, 10);
  
  displayNews(news);
  
  await askToGenerateTweet(news);
}

function displayNews(news) {
  console.log(chalk.cyan('\n📰 最新ニュース:\n'));
  
  news.forEach((item, index) => {
    console.log(chalk.yellow(`[${index + 1}] ${item.title}`));
    console.log(chalk.gray(`   ${item.source} - ${new Date(item.pubDate).toLocaleString('ja-JP')}`));
    if (item.summary) {
      console.log(chalk.white(`   ${item.summary.substring(0, 100)}...`));
    }
    console.log(chalk.blue(`   ${item.link}\n`));
  });
}

async function askToGenerateTweet(news) {
  if (!await checkCharacterProfile()) {
    return;
  }
  
  const { generateTweet } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'generateTweet',
      message: 'このニュースについてツイートを生成しますか？',
      default: false
    }
  ]);
  
  if (!generateTweet) return;
  
  const { newsIndex } = await inquirer.prompt([
    {
      type: 'number',
      name: 'newsIndex',
      message: 'ニュース番号を選択 (1-' + news.length + '):',
      validate: input => input >= 1 && input <= news.length
    }
  ]);
  
  const selectedNews = news[newsIndex - 1];
  const config = await loadConfig();
  const generator = new CharacterBasedGenerator(config);
  
  console.log(chalk.yellow('\n🤖 ツイート生成中...'));
  const tweet = await generator.generateContextualTweet(selectedNews.title);
  
  console.log('\n' + chalk.blue('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(chalk.yellow('📝 生成されたツイート:'));
  console.log(chalk.white(tweet));
  console.log(chalk.gray(`文字数: ${tweet.length}/280`));
  console.log(chalk.blue('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
}

program
  .command('interactive')
  .description('インタラクティブモード')
  .action(async () => {
    console.log(chalk.cyan('\n🤖 X Auto Poster - インタラクティブモード\n'));
    
    while (true) {
      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: '何をしますか？',
          choices: [
            { name: '📝 手動投稿', value: 'post' },
            { name: '🧪 テスト投稿', value: 'test' },
            { name: '👀 次の投稿をプレビュー', value: 'preview' },
            { name: '📰 ニュースを取得', value: 'news' },
            { name: '❌ 終了', value: 'exit' }
          ]
        }
      ]);
      
      if (action === 'exit') break;
      
      try {
        await program.parseAsync([process.argv[0], process.argv[1], action]);
      } catch (error) {
        console.error(chalk.red('エラー:'), error.message);
      }
      
      console.log('\n');
    }
    
    console.log(chalk.green('👋 またね！'));
  });

program.parse();