#!/usr/bin/env node
import { CharacterSetup } from './src/characterSetup.js';

async function main() {
  try {
    const setup = new CharacterSetup();
    const profile = await setup.runSetup();
    
    console.log('生成されたプロファイル:');
    console.log(JSON.stringify(profile, null, 2));
    
    console.log('\n次のステップ:');
    console.log('1. .envファイルを作成し、API認証情報を設定してください');
    console.log('2. npm start でボットを起動できます');
  } catch (error) {
    console.error('セットアップ中にエラーが発生しました:', error);
    process.exit(1);
  }
}

main();