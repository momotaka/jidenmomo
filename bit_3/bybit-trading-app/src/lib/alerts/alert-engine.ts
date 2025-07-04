import { prisma } from '@/lib/database';
import { BybitClient } from '@/lib/bybit-client';
import { TechnicalIndicators } from '@/lib/indicators';
import { AdvancedRiskManager } from '@/lib/risk/advanced-risk-manager';

export interface AlertCondition {
  field: string; // 監視する値（price, rsi, volume等）
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'between' | 'crossover' | 'crossunder';
  value: number | number[]; // 比較値
  value2?: number; // betweenの場合の上限値
  timeframe?: string; // テクニカル指標用の時間枠
  params?: any; // 追加パラメータ
}

export interface AlertAction {
  type: 'browser' | 'email' | 'webhook' | 'telegram' | 'discord';
  config?: {
    url?: string;
    email?: string;
    chatId?: string;
    webhookUrl?: string;
  };
}

export interface AlertRuleConfig {
  name: string;
  description?: string;
  symbol?: string;
  type: 'price' | 'technical' | 'risk' | 'trade' | 'custom';
  conditions: AlertCondition[];
  logic: 'AND' | 'OR'; // 複数条件の場合のロジック
  actions: AlertAction[];
  enabled: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  cooldown: number;
}

export class AlertEngine {
  private client: BybitClient;
  private riskManager: AdvancedRiskManager;
  private checkInterval: NodeJS.Timer | null = null;
  private lastAlertTime: Map<string, Date> = new Map();
  private previousValues: Map<string, any> = new Map();

  constructor() {
    this.client = new BybitClient();
    this.riskManager = new AdvancedRiskManager({
      maxPositionSize: 0.1,
      maxTotalExposure: 3,
      maxConcentration: 0.5,
      maxDailyLoss: 0.05,
      maxWeeklyLoss: 0.1,
      maxMonthlyLoss: 0.2,
      maxDrawdown: 0.3,
      varLimit95: 0.02,
      varLimit99: 0.03,
      maxCorrelation: 0.8,
      minSharpeRatio: 0.5,
      maxLeverage: 10,
      alertThresholds: {
        drawdown: 0.1,
        varBreach: 0.9,
        marginLevel: 0.8,
      },
    });
  }

  async start(intervalMs = 5000) {
    console.log('Alert engine started');
    await this.checkAlerts();
    
    this.checkInterval = setInterval(async () => {
      await this.checkAlerts();
    }, intervalMs);
  }

  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    console.log('Alert engine stopped');
  }

  private async checkAlerts() {
    try {
      // 有効なアラートルールを取得
      const rules = await prisma.alertRule.findMany({
        where: { enabled: true },
      });

      for (const rule of rules) {
        await this.evaluateRule(rule as any);
      }
    } catch (error) {
      console.error('Error checking alerts:', error);
    }
  }

  private async evaluateRule(rule: AlertRuleConfig & { id: string }) {
    try {
      // クールダウンチェック
      if (!this.checkCooldown(rule.id, rule.cooldown)) {
        return;
      }

      const symbols = rule.symbol ? [rule.symbol] : ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'];
      
      for (const symbol of symbols) {
        const conditionsMet = await this.evaluateConditions(
          symbol,
          rule.conditions,
          rule.logic
        );

        if (conditionsMet) {
          await this.triggerAlert(rule, symbol);
        }
      }
    } catch (error) {
      console.error(`Error evaluating rule ${rule.name}:`, error);
    }
  }

  private async evaluateConditions(
    symbol: string,
    conditions: AlertCondition[],
    logic: 'AND' | 'OR'
  ): Promise<boolean> {
    const results = await Promise.all(
      conditions.map(condition => this.evaluateCondition(symbol, condition))
    );

    return logic === 'AND' 
      ? results.every(r => r)
      : results.some(r => r);
  }

  private async evaluateCondition(
    symbol: string,
    condition: AlertCondition
  ): Promise<boolean> {
    const value = await this.getFieldValue(symbol, condition.field, condition.timeframe, condition.params);
    
    if (value === null || value === undefined) return false;

    // クロスオーバー/クロスアンダーのチェック
    if (condition.operator === 'crossover' || condition.operator === 'crossunder') {
      return this.checkCrossover(symbol, condition.field, value, condition.value as number, condition.operator);
    }

    // 通常の比較
    switch (condition.operator) {
      case 'gt': return value > condition.value;
      case 'lt': return value < condition.value;
      case 'eq': return Math.abs(value - (condition.value as number)) < 0.0001;
      case 'gte': return value >= condition.value;
      case 'lte': return value <= condition.value;
      case 'between': 
        return value >= condition.value && value <= (condition.value2 || 0);
      default:
        return false;
    }
  }

  private async getFieldValue(
    symbol: string,
    field: string,
    timeframe?: string,
    params?: any
  ): Promise<number | null> {
    try {
      // 価格関連
      if (field === 'price' || field === 'last') {
        const ticker = await this.client.getTicker(symbol);
        return ticker.last;
      }
      
      if (field === 'bid') {
        const ticker = await this.client.getTicker(symbol);
        return ticker.bid;
      }
      
      if (field === 'ask') {
        const ticker = await this.client.getTicker(symbol);
        return ticker.ask;
      }
      
      if (field === 'volume') {
        const ticker = await this.client.getTicker(symbol);
        return ticker.volume24h;
      }
      
      if (field === 'change24h') {
        const ticker = await this.client.getTicker(symbol);
        return ticker.change24h;
      }

      // テクニカル指標
      if (field.startsWith('rsi')) {
        const candles = await this.getCandles(symbol, timeframe || '5m');
        const closes = candles.map(c => c.close);
        const rsi = TechnicalIndicators.rsi(closes, params?.period || 14);
        return rsi[rsi.length - 1];
      }
      
      if (field.startsWith('sma')) {
        const candles = await this.getCandles(symbol, timeframe || '5m');
        const closes = candles.map(c => c.close);
        const sma = TechnicalIndicators.sma(closes, params?.period || 20);
        return sma[sma.length - 1];
      }
      
      if (field.startsWith('ema')) {
        const candles = await this.getCandles(symbol, timeframe || '5m');
        const closes = candles.map(c => c.close);
        const ema = TechnicalIndicators.ema(closes, params?.period || 20);
        return ema[ema.length - 1];
      }

      // ポジション関連
      if (field === 'position_size') {
        const positions = await this.client.getPositions();
        const position = positions.find(p => p.symbol === symbol);
        return position?.size || 0;
      }
      
      if (field === 'position_pnl') {
        const positions = await this.client.getPositions();
        const position = positions.find(p => p.symbol === symbol);
        return position?.pnl || 0;
      }

      // リスク指標
      if (field === 'var95') {
        const balance = await this.getBalance();
        const riskMetrics = await this.riskManager.analyzeRisk(balance);
        return riskMetrics.var95;
      }
      
      if (field === 'drawdown') {
        const balance = await this.getBalance();
        const riskMetrics = await this.riskManager.analyzeRisk(balance);
        return riskMetrics.currentDrawdown;
      }
      
      if (field === 'leverage') {
        const balance = await this.getBalance();
        const riskMetrics = await this.riskManager.analyzeRisk(balance);
        return riskMetrics.leverage;
      }

      return null;
    } catch (error) {
      console.error(`Error getting field value ${field}:`, error);
      return null;
    }
  }

  private async getCandles(symbol: string, timeframe: string, limit = 100) {
    return await this.client.getOHLCV(symbol, timeframe, limit);
  }

  private async getBalance(): Promise<number> {
    const balances = await this.client.getBalance();
    const usdtBalance = balances.find(b => b.coin === 'USDT');
    return usdtBalance?.total || 0;
  }

  private checkCrossover(
    symbol: string,
    field: string,
    currentValue: number,
    threshold: number,
    type: 'crossover' | 'crossunder'
  ): boolean {
    const key = `${symbol}_${field}`;
    const previousValue = this.previousValues.get(key);
    
    // 前回の値を保存
    this.previousValues.set(key, currentValue);
    
    if (previousValue === undefined) return false;
    
    if (type === 'crossover') {
      return previousValue <= threshold && currentValue > threshold;
    } else {
      return previousValue >= threshold && currentValue < threshold;
    }
  }

  private checkCooldown(ruleId: string, cooldownSeconds: number): boolean {
    const lastAlert = this.lastAlertTime.get(ruleId);
    if (!lastAlert) return true;
    
    const now = new Date();
    const timeSinceLastAlert = (now.getTime() - lastAlert.getTime()) / 1000;
    
    return timeSinceLastAlert >= cooldownSeconds;
  }

  private async triggerAlert(rule: AlertRuleConfig & { id: string }, symbol: string) {
    // クールダウン時間を記録
    this.lastAlertTime.set(rule.id, new Date());
    
    // アラートの詳細を生成
    const alertData = await this.generateAlertData(rule, symbol);
    
    // データベースに保存
    const alert = await prisma.alert.create({
      data: {
        ruleId: rule.id,
        symbol,
        type: rule.type,
        severity: this.getSeverity(rule.priority),
        title: alertData.title,
        message: alertData.message,
        data: alertData.data,
      },
    });
    
    // 各アクションを実行
    for (const action of rule.actions) {
      await this.executeAction(action, alert, alertData);
    }
  }

  private async generateAlertData(rule: AlertRuleConfig, symbol: string) {
    const ticker = await this.client.getTicker(symbol);
    
    const title = `${rule.priority.toUpperCase()}: ${rule.name}`;
    const message = `Alert triggered for ${symbol}\n` +
                   `Price: $${ticker.last.toFixed(2)}\n` +
                   `${rule.description || ''}`;
    
    const data = {
      rule: rule.name,
      symbol,
      price: ticker.last,
      timestamp: new Date().toISOString(),
      conditions: rule.conditions,
    };
    
    return { title, message, data };
  }

  private getSeverity(priority: string): string {
    switch (priority) {
      case 'low': return 'info';
      case 'medium': return 'warning';
      case 'high': return 'error';
      case 'critical': return 'critical';
      default: return 'info';
    }
  }

  private async executeAction(
    action: AlertAction,
    alert: any,
    alertData: { title: string; message: string; data: any }
  ) {
    try {
      switch (action.type) {
        case 'browser':
          // ブラウザ通知（WebSocketで送信）
          this.sendBrowserNotification(alertData);
          break;
          
        case 'webhook':
          if (action.config?.webhookUrl) {
            await this.sendWebhook(action.config.webhookUrl, alertData);
          }
          break;
          
        case 'email':
          // メール送信（実装は省略）
          console.log('Email alert:', alertData);
          break;
          
        case 'telegram':
          // Telegram通知（実装は省略）
          console.log('Telegram alert:', alertData);
          break;
          
        case 'discord':
          // Discord通知（実装は省略）
          console.log('Discord alert:', alertData);
          break;
      }
    } catch (error) {
      console.error(`Error executing action ${action.type}:`, error);
    }
  }

  private sendBrowserNotification(alertData: any) {
    // WebSocketサーバーに通知を送信
    // この実装はserver.jsで処理
    console.log('Browser notification:', alertData);
  }

  private async sendWebhook(url: string, data: any) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Webhook error:', error);
    }
  }

  // プリセットアラートルールの作成
  static getPresetRules(): AlertRuleConfig[] {
    return [
      {
        name: 'Price Alert - Above',
        description: 'Notify when price goes above target',
        type: 'price',
        conditions: [{
          field: 'price',
          operator: 'gt',
          value: 50000, // デフォルト値
        }],
        logic: 'AND',
        actions: [{ type: 'browser' }],
        enabled: false,
        priority: 'medium',
        cooldown: 300,
      },
      {
        name: 'RSI Oversold',
        description: 'Alert when RSI drops below 30',
        type: 'technical',
        conditions: [{
          field: 'rsi',
          operator: 'lt',
          value: 30,
          timeframe: '15m',
          params: { period: 14 },
        }],
        logic: 'AND',
        actions: [{ type: 'browser' }],
        enabled: false,
        priority: 'high',
        cooldown: 900,
      },
      {
        name: 'High Volume Spike',
        description: 'Alert on unusual volume activity',
        type: 'price',
        conditions: [{
          field: 'volume',
          operator: 'gt',
          value: 1000000,
        }],
        logic: 'AND',
        actions: [{ type: 'browser' }],
        enabled: false,
        priority: 'medium',
        cooldown: 600,
      },
      {
        name: 'Risk Limit Warning',
        description: 'Alert when approaching risk limits',
        type: 'risk',
        conditions: [{
          field: 'leverage',
          operator: 'gt',
          value: 8,
        }],
        logic: 'AND',
        actions: [{ type: 'browser' }],
        enabled: false,
        priority: 'critical',
        cooldown: 60,
      },
      {
        name: 'Large Drawdown Alert',
        description: 'Alert on significant drawdown',
        type: 'risk',
        conditions: [{
          field: 'drawdown',
          operator: 'gt',
          value: 0.1, // 10%
        }],
        logic: 'AND',
        actions: [{ type: 'browser' }],
        enabled: false,
        priority: 'critical',
        cooldown: 300,
      },
    ];
  }
}