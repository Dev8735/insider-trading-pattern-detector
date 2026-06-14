export interface CandleDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  isAnomaly?: boolean;
}

export interface AnomalySignal {
  id: string;
  date: string;
  type: 'insider_buying' | 'insider_selling' | 'unusual_volume' | 'price_spike';
  confidence: number;
  description: string;
}

export interface FlaggedStock {
  symbol: string;
  name: string;
  sector: string;
  currentPrice: number;
  anomalyScore: number;
  riskLevel: 'critical' | 'high' | 'medium' | 'low' | 'none';
  lastAnomalyDate: string;
  anomalyCount: number;
}

export interface InsiderDisclosure {
  id: string;
  name: string;
  relationship: string;
  type: 'buy' | 'sell';
  quantity: number;
  price: number;
  date: string;
  value: number;
}

export interface StockDetail {
  symbol: string;
  name: string;
  sector: string;
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
  anomalyScore: number;
  riskLevel: 'critical' | 'high' | 'medium' | 'low' | 'none';
  description: string;
  signals: AnomalySignal[];
  disclosures: InsiderDisclosure[];
}

// Mock candlestick data for RELIANCE.NS
export const mockCandleData: CandleDataPoint[] = [
  { date: '2024-01-01', open: 2850, high: 2900, low: 2840, close: 2890, volume: 2100000 },
  { date: '2024-01-02', open: 2890, high: 2920, low: 2880, close: 2905, volume: 2200000 },
  { date: '2024-01-03', open: 2905, high: 2950, low: 2900, close: 2940, volume: 2400000, isAnomaly: true },
  { date: '2024-01-04', open: 2940, high: 2960, low: 2920, close: 2930, volume: 2300000 },
  { date: '2024-01-05', open: 2930, high: 2980, low: 2920, close: 2970, volume: 2500000 },
  { date: '2024-01-08', open: 2970, high: 3000, low: 2960, close: 2995, volume: 2600000, isAnomaly: true },
  { date: '2024-01-09', open: 2995, high: 3010, low: 2980, close: 3005, volume: 2400000 },
  { date: '2024-01-10', open: 3005, high: 3030, low: 2995, close: 3020, volume: 2700000 },
  { date: '2024-01-11', open: 3020, high: 3050, low: 3010, close: 3040, volume: 2800000 },
  { date: '2024-01-12', open: 3040, high: 3080, low: 3030, close: 3060, volume: 2900000, isAnomaly: true },
  { date: '2024-01-15', open: 3060, high: 3100, low: 3050, close: 3085, volume: 3000000 },
  { date: '2024-01-16', open: 3085, high: 3110, low: 3070, close: 3095, volume: 2800000 },
  { date: '2024-01-17', open: 3095, high: 3120, low: 3080, close: 3105, volume: 2900000 },
  { date: '2024-01-18', open: 3105, high: 3140, low: 3095, close: 3125, volume: 3100000 },
  { date: '2024-01-19', open: 3125, high: 3155, low: 3115, close: 3140, volume: 3200000 },
  { date: '2024-01-22', open: 3140, high: 3170, low: 3130, close: 3155, volume: 3000000, isAnomaly: true },
  { date: '2024-01-23', open: 3155, high: 3180, low: 3140, close: 3165, volume: 2900000 },
  { date: '2024-01-24', open: 3165, high: 3190, low: 3150, close: 3175, volume: 3100000 },
  { date: '2024-01-25', open: 3175, high: 3210, low: 3165, close: 3195, volume: 3300000 },
  { date: '2024-01-26', open: 3195, high: 3220, low: 3180, close: 3205, volume: 3000000 },
];

export const mockFlaggedStocks: FlaggedStock[] = [
  {
    symbol: 'RELIANCE.NS',
    name: 'Reliance Industries',
    sector: 'Energy',
    currentPrice: 3205,
    anomalyScore: 78,
    riskLevel: 'high',
    lastAnomalyDate: '2024-01-22',
    anomalyCount: 4,
  },
  {
    symbol: 'TCS.NS',
    name: 'Tata Consultancy Services',
    sector: 'IT',
    currentPrice: 3850,
    anomalyScore: 65,
    riskLevel: 'medium',
    lastAnomalyDate: '2024-01-20',
    anomalyCount: 3,
  },
  {
    symbol: 'HDFC.NS',
    name: 'Housing Development Finance',
    sector: 'Finance',
    currentPrice: 2650,
    anomalyScore: 85,
    riskLevel: 'critical',
    lastAnomalyDate: '2024-01-23',
    anomalyCount: 5,
  },
  {
    symbol: 'INFY.NS',
    name: 'Infosys',
    sector: 'IT',
    currentPrice: 2180,
    anomalyScore: 45,
    riskLevel: 'low',
    lastAnomalyDate: '2024-01-18',
    anomalyCount: 2,
  },
  {
    symbol: 'HCLTECH.NS',
    name: 'HCL Technologies',
    sector: 'IT',
    currentPrice: 1625,
    anomalyScore: 72,
    riskLevel: 'high',
    lastAnomalyDate: '2024-01-21',
    anomalyCount: 4,
  },
  {
    symbol: 'WIPRO.NS',
    name: 'Wipro',
    sector: 'IT',
    currentPrice: 440,
    anomalyScore: 55,
    riskLevel: 'medium',
    lastAnomalyDate: '2024-01-19',
    anomalyCount: 3,
  },
];

export const mockAnomalySignals: AnomalySignal[] = [
  {
    id: '1',
    date: '2024-01-03',
    type: 'insider_buying',
    confidence: 0.92,
    description: 'Significant insider buying detected during off-peak hours',
  },
  {
    id: '2',
    date: '2024-01-08',
    type: 'unusual_volume',
    confidence: 0.88,
    description: 'Volume spike 150% above 30-day average',
  },
  {
    id: '3',
    date: '2024-01-12',
    type: 'price_spike',
    confidence: 0.85,
    description: 'Price increased 3.5% in single trading session',
  },
  {
    id: '4',
    date: '2024-01-22',
    type: 'insider_selling',
    confidence: 0.90,
    description: 'Multiple insider sell orders placed simultaneously',
  },
];

export const mockInsiderDisclosures: InsiderDisclosure[] = [
  {
    id: '1',
    name: 'Mukesh Ambani',
    relationship: 'Chairman & MD',
    type: 'buy',
    quantity: 50000,
    price: 3150,
    date: '2024-01-15',
    value: 157500000,
  },
  {
    id: '2',
    name: 'Nita Ambani',
    relationship: 'Director',
    type: 'buy',
    quantity: 25000,
    price: 3160,
    date: '2024-01-16',
    value: 79000000,
  },
  {
    id: '3',
    name: 'Seshagiri Rao',
    relationship: 'Executive Director',
    type: 'sell',
    quantity: 100000,
    price: 3180,
    date: '2024-01-20',
    value: 318000000,
  },
  {
    id: '4',
    name: 'Anil Ambani',
    relationship: 'Related Party',
    type: 'sell',
    quantity: 75000,
    price: 3190,
    date: '2024-01-22',
    value: 239250000,
  },
];

export function getStockDetail(symbol: string): StockDetail {
  const stock = mockFlaggedStocks.find((s) => s.symbol === symbol);
  if (!stock) {
    return {
      symbol: 'UNKNOWN',
      name: 'Unknown Stock',
      sector: 'Unknown',
      currentPrice: 0,
      priceChange: 0,
      priceChangePercent: 0,
      anomalyScore: 0,
      riskLevel: 'none',
      description: 'Stock not found',
      signals: [],
      disclosures: [],
    };
  }

  return {
    symbol: stock.symbol,
    name: stock.name,
    sector: stock.sector,
    currentPrice: stock.currentPrice,
    priceChange: stock.currentPrice * 0.02,
    priceChangePercent: 2.1,
    anomalyScore: stock.anomalyScore,
    riskLevel: stock.riskLevel,
    description: `${stock.name} is showing multiple insider trading pattern anomalies. Recent trading activity suggests unusual market movements aligned with insider disclosures.`,
    signals: mockAnomalySignals,
    disclosures: mockInsiderDisclosures,
  };
}

export const dashboardStats = {
  totalStocksMonitored: 1250,
  flaggedStocks: mockFlaggedStocks.length,
  criticalAlerts: mockFlaggedStocks.filter((s) => s.riskLevel === 'critical').length,
  anomaliesDetected: 124,
};
