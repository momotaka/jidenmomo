import inquirer from 'inquirer';
import fs from 'fs/promises';
import path from 'path';
import winston from 'winston';

export class CharacterSetup {
  constructor() {
    this.profilePath = path.join(process.cwd(), 'data', 'character_profile.json');
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [
        new winston.transports.File({ filename: 'logs/setup.log' }),
        new winston.transports.Console({ format: winston.format.simple() })
      ]
    });
  }

  async runSetup() {
    console.log('\n🤖 X自動投稿ボット - キャラクター設定\n');
    
    const character = {};
    
    // 基本設定
    character.basic = await this.askBasicQuestions();
    
    // 性格設定
    character.personality = await this.askPersonalityQuestions();
    
    // 文体設定
    character.writingStyle = await this.askWritingStyleQuestions();
    
    // 興味・関心設定
    character.interests = await this.askInterestQuestions();
    
    // 投稿パターン設定
    character.postingPatterns = await this.askPostingPatternQuestions();
    
    // 詳細設定
    character.advanced = await this.askAdvancedQuestions();
    
    // プロファイル生成
    const profile = this.generateProfile(character);
    
    // 保存
    await this.saveProfile(profile);
    
    console.log('\n✅ キャラクター設定が完了しました！\n');
    return profile;
  }

  async askBasicQuestions() {
    return inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'キャラクターの名前（ニックネーム）:',
        default: 'AI Assistant'
      },
      {
        type: 'input',
        name: 'age',
        message: '年齢設定（例: 25、20代後半）:',
        default: '不明'
      },
      {
        type: 'list',
        name: 'gender',
        message: '性別設定:',
        choices: ['男性的', '女性的', '中性的', '設定しない']
      },
      {
        type: 'input',
        name: 'role',
        message: '役割・職業設定（例: エンジニア、クリエイター、学生）:',
        default: 'なし'
      }
    ]);
  }

  async askPersonalityQuestions() {
    return inquirer.prompt([
      {
        type: 'list',
        name: 'tone',
        message: '基本的な口調:',
        choices: [
          { name: 'フレンドリー（親しみやすい）', value: 'friendly' },
          { name: 'カジュアル（くだけた感じ）', value: 'casual' },
          { name: '丁寧（です・ます調）', value: 'polite' },
          { name: 'クール（冷静沈着）', value: 'cool' },
          { name: 'エネルギッシュ（元気いっぱい）', value: 'energetic' }
        ]
      },
      {
        type: 'checkbox',
        name: 'traits',
        message: '性格特性（複数選択可）:',
        choices: [
          '優しい', '面白い', '知的', '素直', 'ツンデレ',
          'のんびり', '真面目', 'ミステリアス', '天然', 'オタク'
        ]
      },
      {
        type: 'list',
        name: 'humor',
        message: 'ユーモアのレベル:',
        choices: [
          { name: '真面目（ほとんどジョークを言わない）', value: 0.1 },
          { name: '控えめ（たまに軽いジョーク）', value: 0.3 },
          { name: '普通（適度にユーモアあり）', value: 0.5 },
          { name: '多め（よくジョークを言う）', value: 0.7 },
          { name: 'お笑い芸人（常にボケる）', value: 0.9 }
        ]
      }
    ]);
  }

  async askWritingStyleQuestions() {
    return inquirer.prompt([
      {
        type: 'checkbox',
        name: 'sentenceEndings',
        message: '文末表現（複数選択可）:',
        choices: [
          'だよ', 'だね', 'かな', 'よね', 'です', 'ます',
          'である', 'のだ', 'なのだ', 'わ', 'ぞ', 'ぜ'
        ]
      },
      {
        type: 'checkbox',
        name: 'emojis',
        message: 'よく使う絵文字（複数選択可）:',
        choices: [
          '😊', '😂', '🤔', '💡', '✨', '🎉', '💪', '👍',
          '🙏', '💦', '🔥', '⭐', '📝', '🚀', '💻', 'なし'
        ]
      },
      {
        type: 'input',
        name: 'catchphrases',
        message: '口癖やよく使うフレーズ（カンマ区切り）:',
        default: ''
      },
      {
        type: 'list',
        name: 'lengthPreference',
        message: 'ツイートの長さの好み:',
        choices: [
          { name: '短め（50文字以下）', value: 'short' },
          { name: '普通（50-150文字）', value: 'medium' },
          { name: '長め（150文字以上）', value: 'long' },
          { name: 'バラバラ', value: 'varied' }
        ]
      }
    ]);
  }

  async askInterestQuestions() {
    return inquirer.prompt([
      {
        type: 'checkbox',
        name: 'topics',
        message: '興味のあるトピック（複数選択可）:',
        choices: [
          'テクノロジー', 'AI・機械学習', 'プログラミング', 'ゲーム',
          'アニメ・マンガ', '音楽', '映画', 'スポーツ', '料理',
          '旅行', 'ファッション', 'ビジネス', '投資', '健康',
          '読書', 'アート', '写真', 'ペット', '環境問題'
        ]
      },
      {
        type: 'input',
        name: 'customTopics',
        message: 'その他の興味（カンマ区切り）:',
        default: ''
      },
      {
        type: 'list',
        name: 'newsReaction',
        message: 'ニュースやトレンドへの反応:',
        choices: [
          { name: '積極的に反応する', value: 'active' },
          { name: '興味のあるものだけ', value: 'selective' },
          { name: 'あまり反応しない', value: 'passive' },
          { name: '独自の視点で切り込む', value: 'analytical' }
        ]
      }
    ]);
  }

  async askPostingPatternQuestions() {
    return inquirer.prompt([
      {
        type: 'checkbox',
        name: 'postTypes',
        message: '投稿タイプ（複数選択可）:',
        choices: [
          '日常のつぶやき',
          '豆知識・雑学',
          '質問・問いかけ',
          'ジョーク・ネタ',
          '励まし・応援',
          '考察・分析',
          '実況・レポート',
          'お知らせ・告知'
        ]
      },
      {
        type: 'list',
        name: 'threadFrequency',
        message: 'スレッド（連続ツイート）の頻度:',
        choices: [
          { name: 'よく使う（週に数回）', value: 'often' },
          { name: 'たまに使う（月に数回）', value: 'sometimes' },
          { name: 'めったに使わない', value: 'rare' },
          { name: '使わない', value: 'never' }
        ]
      },
      {
        type: 'list',
        name: 'timePreference',
        message: '活動時間帯の好み:',
        choices: [
          { name: '朝型（6-12時）', value: 'morning' },
          { name: '昼型（12-18時）', value: 'afternoon' },
          { name: '夜型（18-24時）', value: 'evening' },
          { name: '深夜型（0-6時）', value: 'night' },
          { name: '24時間ランダム', value: 'random' }
        ]
      }
    ]);
  }

  async askAdvancedQuestions() {
    return inquirer.prompt([
      {
        type: 'confirm',
        name: 'useHashtags',
        message: 'ハッシュタグを使いますか？',
        default: false
      },
      {
        type: 'confirm',
        name: 'replyToOthers',
        message: '他のユーザーに返信しますか？',
        default: false
      },
      {
        type: 'input',
        name: 'specialRules',
        message: '特別なルール（例: 金曜日は必ず「華金」を使う）:',
        default: ''
      },
      {
        type: 'input',
        name: 'avoidWords',
        message: '使わない言葉（カンマ区切り）:',
        default: ''
      }
    ]);
  }

  generateProfile(character) {
    const profile = {
      version: '2.0',
      createdAt: new Date().toISOString(),
      character: character,
      
      // AIプロンプト用の統合設定
      systemPrompt: this.buildSystemPrompt(character),
      
      // 投稿生成用の設定
      generationConfig: {
        temperature: this.calculateTemperature(character),
        maxLength: this.calculateMaxLength(character),
        topicWeights: this.calculateTopicWeights(character),
        timePreferences: this.calculateTimePreferences(character)
      }
    };
    
    return profile;
  }

  buildSystemPrompt(character) {
    const { basic, personality, writingStyle, interests } = character;
    
    let prompt = `あなたは「${basic.name}」という名前のキャラクターです。\n`;
    
    if (basic.age !== '不明') prompt += `年齢は${basic.age}。`;
    if (basic.role !== 'なし') prompt += `${basic.role}として活動しています。`;
    
    prompt += `\n\n性格：${personality.traits.join('、')}な性格で、${this.getToneDescription(personality.tone)}口調で話します。`;
    
    if (writingStyle.sentenceEndings.length > 0) {
      prompt += `\n文末は主に「${writingStyle.sentenceEndings.join('」「')}」を使います。`;
    }
    
    if (writingStyle.catchphrases) {
      prompt += `\n口癖：${writingStyle.catchphrases}`;
    }
    
    if (writingStyle.emojis.length > 0 && !writingStyle.emojis.includes('なし')) {
      prompt += `\n絵文字は${writingStyle.emojis.join('')}をよく使います。`;
    }
    
    prompt += `\n\n興味のあるトピック：${interests.topics.join('、')}`;
    
    return prompt;
  }

  getToneDescription(tone) {
    const descriptions = {
      friendly: 'フレンドリーで親しみやすい',
      casual: 'カジュアルでくだけた',
      polite: '丁寧で礼儀正しい',
      cool: 'クールで冷静な',
      energetic: 'エネルギッシュで元気な'
    };
    return descriptions[tone] || tone;
  }

  calculateTemperature(character) {
    // 性格に基づいて創造性パラメータを計算
    const humorLevel = character.personality.humor;
    const isCreative = character.personality.traits.includes('面白い') || 
                      character.personality.traits.includes('天然');
    
    return isCreative ? 0.8 + (humorLevel * 0.2) : 0.6 + (humorLevel * 0.2);
  }

  calculateMaxLength(character) {
    const lengthMap = {
      short: 80,
      medium: 140,
      long: 220,
      varied: 180
    };
    return lengthMap[character.writingStyle.lengthPreference] || 140;
  }

  calculateTopicWeights(character) {
    const weights = {};
    character.interests.topics.forEach(topic => {
      weights[topic] = 1.0;
    });
    
    if (character.interests.customTopics) {
      character.interests.customTopics.split(',').forEach(topic => {
        weights[topic.trim()] = 1.0;
      });
    }
    
    return weights;
  }

  calculateTimePreferences(character) {
    const timeMap = {
      morning: { start: 6, end: 12 },
      afternoon: { start: 12, end: 18 },
      evening: { start: 18, end: 24 },
      night: { start: 0, end: 6 },
      random: { start: 0, end: 24 }
    };
    
    return timeMap[character.postingPatterns.timePreference] || timeMap.random;
  }

  async saveProfile(profile) {
    await fs.mkdir(path.dirname(this.profilePath), { recursive: true });
    await fs.writeFile(this.profilePath, JSON.stringify(profile, null, 2));
    this.logger.info('Character profile saved');
  }

  async loadProfile() {
    try {
      const data = await fs.readFile(this.profilePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }
}