import { prisma } from '@/lib/database';
import { Position, Trade } from '@/types/trading';

export interface RiskMetrics {
  // ポートフォリオレベルのリスク
  totalExposure: number;
  netExposure: number;
  grossExposure: number;
  leverage: number;
  marginUsage: number;
  
  // VaR (Value at Risk)
  var95: number; // 95%信頼区間でのVaR
  var99: number; // 99%信頼区間でのVaR
  cvar95: number; // 条件付きVaR（期待ショートフォール）
  
  // ストレステスト結果
  stressTestResults: StressTestResult[];
  
  // 相関リスク
  correlationRisk: number;
  concentrationRisk: number;
  
  // リアルタイムメトリクス
  currentDrawdown: number;
  drawdownDuration: number;
  sharpeRatio: number;
  calmarRatio: number;
  
  // リスクリミット
  riskLimitUtilization: RiskLimitStatus[];
}

export interface StressTestResult {
  scenario: string;
  impact: number;
  probability: number;
  description: string;
}

export interface RiskLimitStatus {
  limit: string;
  current: number;
  maximum: number;
  utilization: number;
  status: 'safe' | 'warning' | 'critical';
}

export interface RiskConfig {
  // ポジションリミット
  maxPositionSize: number; // 単一ポジションの最大サイズ（残高の％）
  maxTotalExposure: number; // 総エクスポージャーの最大値（残高の倍数）
  maxConcentration: number; // 単一銘柄への最大集中度
  
  // 損失リミット
  maxDailyLoss: number; // 1日の最大損失（残高の％）
  maxWeeklyLoss: number; // 1週間の最大損失
  maxMonthlyLoss: number; // 1ヶ月の最大損失
  maxDrawdown: number; // 最大ドローダウン
  
  // VaRリミット
  varLimit95: number; // 95% VaRリミット
  varLimit99: number; // 99% VaRリミット
  
  // その他のリミット
  maxCorrelation: number; // ポジション間の最大相関
  minSharpeRatio: number; // 最小シャープレシオ
  maxLeverage: number; // 最大レバレッジ
  
  // アラート設定
  alertThresholds: {
    drawdown: number;
    varBreach: number;
    marginLevel: number;
  };
}

export class AdvancedRiskManager {
  private config: RiskConfig;
  private historicalReturns: number[] = [];
  private positions: Map<string, Position> = new Map();
  
  constructor(config: RiskConfig) {
    this.config = config;
  }

  async analyzeRisk(balance: number): Promise<RiskMetrics> {
    // 現在のポジションを取得
    await this.loadPositions();
    
    // ポートフォリオメトリクスの計算
    const portfolioMetrics = this.calculatePortfolioMetrics(balance);
    
    // VaRの計算
    const varMetrics = await this.calculateVaR(balance);
    
    // ストレステストの実行
    const stressTestResults = this.runStressTests(balance);
    
    // 相関リスクの計算
    const correlationRisk = await this.calculateCorrelationRisk();
    
    // リスクリミットのチェック
    const riskLimitStatus = this.checkRiskLimits(balance, portfolioMetrics, varMetrics);
    
    // リアルタイムメトリクスの計算
    const realtimeMetrics = await this.calculateRealtimeMetrics(balance);
    
    return {
      ...portfolioMetrics,
      ...varMetrics,
      stressTestResults,
      correlationRisk,
      concentrationRisk: this.calculateConcentrationRisk(),
      ...realtimeMetrics,
      riskLimitUtilization: riskLimitStatus,
    };
  }

  private async loadPositions(): Promise<void> {
    const positions = await prisma.position.findMany({
      where: { closeTime: null }, // 未決済ポジションのみ
    });
    
    this.positions.clear();
    positions.forEach(p => this.positions.set(p.symbol, p as any));
  }

  private calculatePortfolioMetrics(balance: number): {
    totalExposure: number;
    netExposure: number;
    grossExposure: number;
    leverage: number;
    marginUsage: number;
  } {
    let longExposure = 0;
    let shortExposure = 0;
    let totalMargin = 0;
    
    this.positions.forEach(position => {
      const exposure = position.size * (position.currentPrice || position.entryPrice);
      
      if (position.side === 'long') {
        longExposure += exposure;
      } else {
        shortExposure += exposure;
      }
      
      totalMargin += position.margin;
    });
    
    const grossExposure = longExposure + shortExposure;
    const netExposure = Math.abs(longExposure - shortExposure);
    const leverage = balance > 0 ? grossExposure / balance : 0;
    const marginUsage = balance > 0 ? totalMargin / balance : 0;
    
    return {
      totalExposure: grossExposure,
      netExposure,
      grossExposure,
      leverage,
      marginUsage,
    };
  }

  private async calculateVaR(balance: number): Promise<{
    var95: number;
    var99: number;
    cvar95: number;
  }> {
    // 過去のリターンデータを取得
    await this.loadHistoricalReturns();
    
    if (this.historicalReturns.length < 100) {
      return { var95: 0, var99: 0, cvar95: 0 };
    }
    
    // ポートフォリオのリターンを計算
    const portfolioReturns = this.calculatePortfolioReturns();
    
    // リターンをソート（昇順）
    const sortedReturns = [...portfolioReturns].sort((a, b) => a - b);
    
    // VaRの計算（パーセンタイル法）
    const index95 = Math.floor(sortedReturns.length * 0.05);
    const index99 = Math.floor(sortedReturns.length * 0.01);
    
    const var95 = Math.abs(sortedReturns[index95]) * balance;
    const var99 = Math.abs(sortedReturns[index99]) * balance;
    
    // CVaR（期待ショートフォール）の計算
    const tailReturns = sortedReturns.slice(0, index95);
    const avgTailLoss = tailReturns.reduce((sum, r) => sum + r, 0) / tailReturns.length;
    const cvar95 = Math.abs(avgTailLoss) * balance;
    
    return { var95, var99, cvar95 };
  }

  private async loadHistoricalReturns(): Promise<void> {
    // 過去30日間の日次リターンを計算
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const balanceHistory = await prisma.balance.findMany({
      where: {
        coin: 'USDT',
        timestamp: { gte: thirtyDaysAgo },
      },
      orderBy: { timestamp: 'asc' },
    });
    
    this.historicalReturns = [];
    for (let i = 1; i < balanceHistory.length; i++) {
      const dailyReturn = (balanceHistory[i].total - balanceHistory[i-1].total) / balanceHistory[i-1].total;
      this.historicalReturns.push(dailyReturn);
    }
  }

  private calculatePortfolioReturns(): number[] {
    // モンテカルロシミュレーションでポートフォリオリターンを生成
    const simulations = 10000;
    const portfolioReturns: number[] = [];
    
    for (let i = 0; i < simulations; i++) {
      let portfolioReturn = 0;
      
      this.positions.forEach(position => {
        // 各ポジションのランダムリターンを生成（正規分布）
        const randomReturn = this.generateRandomReturn();
        const positionWeight = position.size / this.getTotalPortfolioValue();
        portfolioReturn += randomReturn * positionWeight;
      });
      
      portfolioReturns.push(portfolioReturn);
    }
    
    return portfolioReturns;
  }

  private generateRandomReturn(): number {
    // Box-Muller変換で正規分布のランダム値を生成
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    
    // 過去のリターンから平均と標準偏差を計算
    const mean = this.historicalReturns.reduce((sum, r) => sum + r, 0) / this.historicalReturns.length;
    const variance = this.historicalReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / this.historicalReturns.length;
    const stdDev = Math.sqrt(variance);
    
    return mean + stdDev * z0;
  }

  private getTotalPortfolioValue(): number {
    let total = 0;
    this.positions.forEach(position => {
      total += position.size;
    });
    return total;
  }

  private runStressTests(balance: number): StressTestResult[] {
    const results: StressTestResult[] = [];
    
    // シナリオ1: 市場暴落（-20%）
    results.push(this.stressTestScenario(
      'Market Crash',
      -0.20,
      0.05,
      'Sudden 20% market decline across all positions'
    ));
    
    // シナリオ2: フラッシュクラッシュ（-10%、高頻度）
    results.push(this.stressTestScenario(
      'Flash Crash',
      -0.10,
      0.15,
      '10% rapid price drop within minutes'
    ));
    
    // シナリオ3: 流動性危機
    results.push({
      scenario: 'Liquidity Crisis',
      impact: this.calculateLiquidityCrisisImpact(balance),
      probability: 0.03,
      description: 'Severe liquidity shortage causing wide spreads',
    });
    
    // シナリオ4: 相関崩壊
    results.push({
      scenario: 'Correlation Breakdown',
      impact: this.calculateCorrelationBreakdownImpact(balance),
      probability: 0.10,
      description: 'Historical correlations fail, causing unexpected losses',
    });
    
    // シナリオ5: ブラックスワン
    results.push(this.stressTestScenario(
      'Black Swan Event',
      -0.50,
      0.001,
      'Extreme 50% market decline (tail risk event)'
    ));
    
    return results;
  }

  private stressTestScenario(
    scenario: string,
    marketMove: number,
    probability: number,
    description: string
  ): StressTestResult {
    let totalImpact = 0;
    
    this.positions.forEach(position => {
      const positionValue = position.size;
      const loss = positionValue * marketMove;
      totalImpact += Math.abs(loss);
    });
    
    return {
      scenario,
      impact: totalImpact,
      probability,
      description,
    };
  }

  private calculateLiquidityCrisisImpact(balance: number): number {
    // 流動性危機では大きなポジションほど影響を受ける
    let totalImpact = 0;
    
    this.positions.forEach(position => {
      const positionSize = position.size;
      const sizeRatio = positionSize / balance;
      
      // 大きなポジションほどスリッページが大きい
      const slippageMultiplier = 1 + Math.pow(sizeRatio, 2);
      const impact = positionSize * 0.05 * slippageMultiplier; // 基本5%のインパクト
      
      totalImpact += impact;
    });
    
    return totalImpact;
  }

  private calculateCorrelationBreakdownImpact(balance: number): number {
    // 通常は負の相関を持つポジションが同時に損失を出すシナリオ
    const numPositions = this.positions.size;
    
    if (numPositions < 2) return 0;
    
    // ポジション数が多いほど相関崩壊の影響が大きい
    const correlationPenalty = Math.log(numPositions + 1) * 0.1;
    let totalValue = 0;
    
    this.positions.forEach(position => {
      totalValue += position.size;
    });
    
    return totalValue * correlationPenalty;
  }

  private async calculateCorrelationRisk(): Promise<number> {
    // 各銘柄ペアの相関を計算
    const symbols = Array.from(this.positions.keys());
    
    if (symbols.length < 2) return 0;
    
    let totalCorrelation = 0;
    let pairCount = 0;
    
    for (let i = 0; i < symbols.length; i++) {
      for (let j = i + 1; j < symbols.length; j++) {
        const correlation = await this.calculatePairCorrelation(symbols[i], symbols[j]);
        totalCorrelation += Math.abs(correlation);
        pairCount++;
      }
    }
    
    return pairCount > 0 ? totalCorrelation / pairCount : 0;
  }

  private async calculatePairCorrelation(symbol1: string, symbol2: string): Promise<number> {
    // 簡略化のため、固定値を返す（実際は価格データから計算）
    // TODO: 実際の相関計算を実装
    return 0.3;
  }

  private calculateConcentrationRisk(): number {
    const totalValue = this.getTotalPortfolioValue();
    
    if (totalValue === 0) return 0;
    
    // ハーフィンダール・ハーシュマン指数（HHI）で集中度を測定
    let hhi = 0;
    
    this.positions.forEach(position => {
      const weight = position.size / totalValue;
      hhi += weight * weight;
    });
    
    return hhi;
  }

  private checkRiskLimits(
    balance: number,
    portfolioMetrics: any,
    varMetrics: any
  ): RiskLimitStatus[] {
    const limits: RiskLimitStatus[] = [];
    
    // レバレッジリミット
    limits.push({
      limit: 'Leverage',
      current: portfolioMetrics.leverage,
      maximum: this.config.maxLeverage,
      utilization: portfolioMetrics.leverage / this.config.maxLeverage,
      status: this.getRiskStatus(portfolioMetrics.leverage / this.config.maxLeverage),
    });
    
    // VaRリミット
    limits.push({
      limit: 'VaR 95%',
      current: varMetrics.var95,
      maximum: balance * this.config.varLimit95,
      utilization: varMetrics.var95 / (balance * this.config.varLimit95),
      status: this.getRiskStatus(varMetrics.var95 / (balance * this.config.varLimit95)),
    });
    
    // エクスポージャーリミット
    limits.push({
      limit: 'Total Exposure',
      current: portfolioMetrics.totalExposure,
      maximum: balance * this.config.maxTotalExposure,
      utilization: portfolioMetrics.totalExposure / (balance * this.config.maxTotalExposure),
      status: this.getRiskStatus(portfolioMetrics.totalExposure / (balance * this.config.maxTotalExposure)),
    });
    
    // 集中リスクリミット
    const concentrationRisk = this.calculateConcentrationRisk();
    limits.push({
      limit: 'Concentration',
      current: concentrationRisk,
      maximum: this.config.maxConcentration,
      utilization: concentrationRisk / this.config.maxConcentration,
      status: this.getRiskStatus(concentrationRisk / this.config.maxConcentration),
    });
    
    return limits;
  }

  private getRiskStatus(utilization: number): 'safe' | 'warning' | 'critical' {
    if (utilization < 0.7) return 'safe';
    if (utilization < 0.9) return 'warning';
    return 'critical';
  }

  private async calculateRealtimeMetrics(balance: number): Promise<{
    currentDrawdown: number;
    drawdownDuration: number;
    sharpeRatio: number;
    calmarRatio: number;
  }> {
    // 最高値からのドローダウンを計算
    const equity = balance; // 簡略化
    const peak = await this.getPeakEquity();
    const currentDrawdown = peak > 0 ? (peak - equity) / peak : 0;
    
    // ドローダウン期間（日数）
    const drawdownDuration = await this.getDrawdownDuration();
    
    // シャープレシオ
    const returns = this.historicalReturns;
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const stdDev = Math.sqrt(
      returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
    );
    const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0;
    
    // カルマーレシオ
    const annualReturn = avgReturn * 252;
    const maxDrawdown = await this.getMaxDrawdown();
    const calmarRatio = maxDrawdown > 0 ? annualReturn / maxDrawdown : 0;
    
    return {
      currentDrawdown,
      drawdownDuration,
      sharpeRatio,
      calmarRatio,
    };
  }

  private async getPeakEquity(): Promise<number> {
    // 実装を簡略化
    return 10000;
  }

  private async getDrawdownDuration(): Promise<number> {
    // 実装を簡略化
    return 5;
  }

  private async getMaxDrawdown(): Promise<number> {
    // 実装を簡略化
    return 0.15;
  }

  // ポジションサイジングの最適化
  async optimizePositionSize(
    signal: any,
    balance: number,
    currentPrice: number
  ): Promise<number> {
    const riskMetrics = await this.analyzeRisk(balance);
    
    // Kelly基準をベースに、現在のリスク状況で調整
    let baseSizeRatio = 0.02; // 基本2%
    
    // VaR制約
    if (riskMetrics.var95 > balance * this.config.varLimit95 * 0.8) {
      baseSizeRatio *= 0.5; // VaRが限界に近い場合はサイズを半減
    }
    
    // レバレッジ制約
    if (riskMetrics.leverage > this.config.maxLeverage * 0.8) {
      baseSizeRatio *= 0.7;
    }
    
    // 相関リスク調整
    if (riskMetrics.correlationRisk > this.config.maxCorrelation) {
      baseSizeRatio *= (1 - riskMetrics.correlationRisk);
    }
    
    // シグナル強度による調整
    baseSizeRatio *= signal.strength;
    
    return Math.max(balance * baseSizeRatio, 0);
  }

  // リスクアラートのチェック
  checkRiskAlerts(metrics: RiskMetrics): string[] {
    const alerts: string[] = [];
    
    if (metrics.currentDrawdown > this.config.alertThresholds.drawdown) {
      alerts.push(`High drawdown alert: ${(metrics.currentDrawdown * 100).toFixed(2)}%`);
    }
    
    if (metrics.var95 > metrics.riskLimitUtilization.find(l => l.limit === 'VaR 95%')?.maximum! * this.config.alertThresholds.varBreach) {
      alerts.push(`VaR breach alert: 95% VaR at ${metrics.var95.toFixed(2)}`);
    }
    
    if (metrics.marginUsage > this.config.alertThresholds.marginLevel) {
      alerts.push(`High margin usage: ${(metrics.marginUsage * 100).toFixed(2)}%`);
    }
    
    metrics.riskLimitUtilization.forEach(limit => {
      if (limit.status === 'critical') {
        alerts.push(`Critical risk limit: ${limit.limit} at ${(limit.utilization * 100).toFixed(2)}%`);
      }
    });
    
    return alerts;
  }
}