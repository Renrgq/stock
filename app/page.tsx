'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  Flame,
  Info,
  LayoutGrid,
  RefreshCw,
  Search,
  Sparkles,
  Star,
  TrendingUp,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type Stock = {
  code: string;
  name: string;
  price: number;
  change: number;
  turnover: number;
  reason: string;
};

type Sector = {
  id: string;
  name: string;
  change: number;
  amount: number;
  inflow: number;
  up: number;
  flat: number;
  down: number;
  leader: string;
  leaderChange: number;
  score: number;
  trend: number[];
  stocks: Stock[];
};

const createStocks = (
  rows: Array<[string, string, number, number, number, string]>,
): Stock[] =>
  rows.map(([code, name, price, change, turnover, reason]) => ({
    code,
    name,
    price,
    change,
    turnover,
    reason,
  }));

const industrySectors: Sector[] = [
  {
    id: 'precious-metal',
    name: '贵金属',
    change: 5.82,
    amount: 286.4,
    inflow: 42.8,
    up: 14,
    flat: 0,
    down: 2,
    leader: '湖南黄金',
    leaderChange: 10.02,
    score: 96,
    trend: [0.2, 0.6, 0.9, 1.4, 1.2, 2.1, 2.7, 3.4, 3.1, 4.2, 4.8, 5.82],
    stocks: createStocks([
      ['002155', '湖南黄金', 23.84, 10.02, 12.6, '板块高度龙头'],
      ['600988', '赤峰黄金', 20.16, 8.67, 6.8, '趋势中军'],
      ['600547', '山东黄金', 29.72, 6.15, 3.4, '成交额核心'],
      ['601899', '紫金矿业', 18.43, 4.92, 2.1, '大市值锚点'],
    ]),
  },
  {
    id: 'securities',
    name: '证券',
    change: 4.36,
    amount: 638.2,
    inflow: 68.7,
    up: 48,
    flat: 1,
    down: 1,
    leader: '东方财富',
    leaderChange: 8.46,
    score: 92,
    trend: [0.1, 0.3, 0.2, 0.7, 1.3, 1.8, 2.4, 2.2, 3.1, 3.6, 4.1, 4.36],
    stocks: createStocks([
      ['300059', '东方财富', 26.31, 8.46, 9.7, '人气与成交核心'],
      ['601881', '中国银河', 15.88, 7.31, 5.9, '高弹性前排'],
      ['600030', '中信证券', 31.26, 4.12, 2.8, '权重中军'],
      ['601688', '华泰证券', 19.43, 3.76, 3.1, '机构关注'],
    ]),
  },
  {
    id: 'semiconductor',
    name: '半导体',
    change: 3.77,
    amount: 794.5,
    inflow: 75.3,
    up: 144,
    flat: 4,
    down: 28,
    leader: '寒武纪',
    leaderChange: 7.68,
    score: 90,
    trend: [0.1, -0.2, 0.4, 0.8, 1.4, 1.1, 1.9, 2.5, 2.2, 3.0, 3.4, 3.77],
    stocks: createStocks([
      ['688256', '寒武纪', 638.5, 7.68, 4.7, 'AI 芯片核心'],
      ['002371', '北方华创', 426.2, 5.32, 2.6, '设备龙头'],
      ['688981', '中芯国际', 92.18, 4.87, 3.9, '晶圆制造中军'],
      ['688012', '中微公司', 218.6, 3.95, 2.4, '趋势强势'],
    ]),
  },
  {
    id: 'software',
    name: '软件开发',
    change: 2.94,
    amount: 512.9,
    inflow: 36.5,
    up: 168,
    flat: 7,
    down: 56,
    leader: '拓维信息',
    leaderChange: 9.98,
    score: 86,
   
    trend: [-0.1, 0.1, 0.4, 0.3, 0.8, 1.1, 1.5, 1.3, 1.9, 2.4, 2.6, 2.94],
    stocks: createStocks([
      ['002261', '拓维信息', 32.71, 9.98, 14.2, '日内情绪龙头'],
      ['300339', '润和软件', 48.62, 6.33, 8.4, '高辨识度前排'],
      ['688111', '金山办公', 316.8, 3.85, 1.9, '办公软件龙头'],
      ['600536', '中国软件', 52.14, 2.92, 3.6, '信创中军'],
    ]),
  },
  {
    id: 'battery',
    name: '电池',
    change: 2.31,
    amount: 456.8,
    inflow: 28.1,
    up: 76,
    flat: 3,
    down: 31,
    leader: '宁德时代',
    leaderChange: 3.21,
    score: 82,
    trend: [0, 0.2, 0.1, 0.5, 0.7, 0.6, 1.2, 1.4, 1.1, 1.7, 2.0, 2.31],
    stocks: createStocks([
      ['300750', '宁德时代', 286.4, 3.21, 1.8, '板块权重核心'],
      ['300014', '亿纬锂能', 52.76, 4.66, 3.2, '弹性龙头'],
      ['002074', '国轩高科', 25.32, 5.17, 4.6, '资金活跃'],
      ['300073', '当升科技', 47.18, 2.85, 2.2, '材料前排'],
    ]),
  },
  {
    id: 'communication',
    name: '通信设备',
    change: 1.48,
    amount: 378.2,
    inflow: 16.9,
    up: 82,
    flat: 5,
    down: 45,
    leader: '中际旭创',
    leaderChange: 5.43,
    score: 78,
    trend: [-0.2, 0.1, 0.5, 0.3, 0.8, 1.1, 0.9, 1.4, 1.1, 1.3, 1.6, 1.48],
    stocks: createStocks([
      ['300308', '中际旭创', 196.7, 5.43, 4.8, '光模块中军'],
      ['300502', '新易盛', 128.5, 6.17, 6.1, '高弹性龙头'],
      ['300394', '天孚通信', 94.36, 4.28, 3.7, '上游核心'],
      ['000063', '中兴通讯', 42.18, 1.76, 2.9, '权重锚点'],
    ]),
  },
  {
    id: 'coal',
    name: '煤炭开采',
    change: -0.42,
    amount: 118.6,
    inflow: -6.4,
    up: 12,
    flat: 2,
    down: 23,
    leader: '中国神华',
    leaderChange: 0.36,
    score: 54,
    trend: [0.2, 0.1, 0.3, 0, -0.1, -0.3, -0.2, -0.5, -0.3, -0.6, -0.5, -0.42],
    stocks: createStocks([
      ['601088', '中国神华', 42.62, 0.36, 1.1, '行业权重龙头'],
      ['600188', '兖矿能源', 17.54, -0.18, 1.4, '高股息核心'],
      ['601225', '陕西煤业', 24.87, -0.52, 0.8, '机构持仓'],
      ['000983', '山西焦煤', 8.76, -1.01, 1.7, '焦煤弹性'],
    ]),
  },
  {
    id: 'bank',
    name: '银行',
    change: -0.88,
    amount: 206.3,
    inflow: -18.7,
    up: 6,
    flat: 2,
    down: 34,
    leader: '招商银行',
    leaderChange: -0.31,
    score: 42,
    trend: [0.1, -0.1, 0, -0.2, -0.4, -0.3, -0.5, -0.7, -0.5, -0.9, -0.7, -0.88],
    stocks: createStocks([
      ['600036', '招商银行', 42.36, -0.31, 0.9, '股份行龙头'],
      ['601398', '工商银行', 7.12, -0.56, 0.5, '大行权重'],
      ['000001', '平安银行', 12.08, -0.82, 1.2, '交易活跃'],
      ['601288', '农业银行', 5.18, -1.15, 0.4, '高股息权重'],
    ]),
  },
  {
    id: 'liquor',
    name: '白酒',
    change: -1.28,
    amount: 162.7,
    inflow: -24.5,
    up: 5,
    flat: 1,
    down: 32,
    leader: '贵州茅台',
    leaderChange: -0.72,
    score: 35,
    trend: [0.1, -0.2, -0.1, -0.5, -0.4, -0.8, -0.7, -1.0, -0.9, -1.3, -1.1, -1.28],
    stocks: createStocks([
      ['600519', '贵州茅台', 1548.0, -0.72, 0.4, '行业绝对龙头'],
      ['000858', '五粮液', 136.2, -1.16, 0.7, '浓香型中军'],
      ['000568', '泸州老窖', 122.8, -1.82, 0.8, '高端白酒核心'],
      ['600809', '山西汾酒', 186.5, -2.13, 0.9, '清香型龙头'],
    ]),
  },
];

const conceptSectors: Sector[] = [
  { ...industrySectors[5], id: 'cpo', name: 'CPO 概念', change: 6.76, inflow: 58.2, score: 98 },
  { ...industrySectors[3], id: 'robot', name: '人形机器人', change: 5.44, inflow: 47.6, score: 94 },
  { ...industrySectors[0], id: 'gold', name: '黄金概念', change: 5.12, inflow: 39.4, score: 91 },
  { ...industrySectors[5], id: 'low-altitude', name: '低空经济', change: 3.25, inflow: 31.8, score: 87 },
  { ...industrySectors[2], id: 'ai-compute', name: 'AI 算力', change: 2.88, inflow: 44.1, score: 89 },
  { ...industrySectors[4], id: 'solid-battery', name: '固态电池', change: 2.44, inflow: 22.7, score: 81 },
  { ...industrySectors[7], id: 'high-dividend', name: '高股息', change: -0.72, inflow: -12.6, score: 47 },
  { ...industrySectors[8], id: 'consumer', name: '大消费', change: -1.31, inflow: -28.2, score: 33 },
];

const marketLine = [
  0.05, 0.12, 0.08, 0.22, 0.38, 0.31, 0.56, 0.72, 0.61, 0.88, 0.94, 1.12,
  1.06, 1.24, 1.18, 1.36, 1.42, 1.31, 1.48, 1.56, 1.67, 1.59, 1.72, 1.86,
];

const formatSigned = (value: number, suffix = '%') =>
  `${value >= 0 ? '+' : ''}${value.toFixed(2)}${suffix}`;

function Sparkline({ values, positive = true }: { values: number[]; positive?: boolean }) {
  const width = 128;
  const height = 42;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - 4 - ((value - min) / range) * (height - 8);
      return `${x},${y}`;
    })
    .join(' ');
  const color = positive ? '#ff5364' : '#25c690';
  const lastY = points.split(' ').at(-1)?.split(',')[1] ?? height / 2;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="sparkline" role="img" aria-label="日内走势">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={width} cy={lastY} r="3" fill={color} />
    </svg>
  );
}

function MarketChart() {
  const width = 760;
  const height = 168;
  const min = Math.min(...marketLine) - 0.12;
  const max = Math.max(...marketLine) + 0.12;
  const points = marketLine
    .map((value, index) => `${(index / (marketLine.length - 1)) * width},${height - ((value - min) / (max - min)) * height}`)
    .join(' ');
  const pathPoints = points.split(' ').map((point) => `L ${point}`).join(' ');
  const area = `M 0 ${height} ${pathPoints} L ${width} ${height} Z`;

  return (
    <div className="market-chart" aria-label="上证指数日内走势">
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img">
        <defs>
          <linearGradient id="marketArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ff5364" stopOpacity="0.28" />
            <stop offset="1" stopColor="#ff5364" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((ratio) => (
          <line key={ratio} x1="0" y1={height * ratio} x2={width} y2={height * ratio} stroke="#202937" strokeDasharray="4 8" />
        ))}
        <path d={area} fill="url(#marketArea)" />
        <polyline points={points} fill="none" stroke="#ff5a68" strokeWidth="3" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="chart-times"><span>09:30</span><span>10:30</span><span>11:30/13:00</span><span>14:00</span><span>15:00</span></div>
    </div>
  );
}

export default function Home() {
  const [marketType, setMarketType] = useState<'industry' | 'concept'>('industry');
  const [sortBy, setSortBy] = useState<'change' | 'inflow' | 'amount'>('change');
  const [selectedId, setSelectedId] = useState('precious-metal');
  const [query, setQuery] = useState('');
  const [watchlist, setWatchlist] = useState<string[]>(['600519']);
  const [refreshed, setRefreshed] = useState(false);

  useEffect(() => {
    type WebTool = {
      name: string;
      title: string;
      description: string;
      inputSchema: Record<string, unknown>;
      annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
      execute: (input: unknown) => Record<string, unknown>;
    };
    type ModelContext = {
      registerTool: (tool: WebTool, options: { signal: AbortSignal }) => void | Promise<void>;
    };
    const context = (document as Document & { modelContext?: ModelContext }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const register = (tool: WebTool) => {
      try {
        void Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(() => undefined);
      } catch {
        // Browsers without a complete WebMCP implementation keep the visible UI unaffected.
      }
    };

    register({
      name: 'configure_market_view',
      title: '设置板块视图',
      description: '切换行业或概念板块，并按涨跌幅、主力净流入或成交额排序。',
      inputSchema: {
        type: 'object',
        properties: {
          marketType: { type: 'string', enum: ['industry', 'concept'] },
          sortBy: { type: 'string', enum: ['change', 'inflow', 'amount'] },
        },
        required: ['marketType', 'sortBy'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input) {
        const value = input as { marketType?: string; sortBy?: string };
        if (!['industry', 'concept'].includes(value.marketType ?? '') || !['change', 'inflow', 'amount'].includes(value.sortBy ?? '')) {
          throw new Error('marketType 或 sortBy 无效');
        }
        const nextType = value.marketType as 'industry' | 'concept';
        setMarketType(nextType);
        setSortBy(value.sortBy as 'change' | 'inflow' | 'amount');
        setSelectedId(nextType === 'industry' ? industrySectors[0].id : conceptSectors[0].id);
        return { marketType: nextType, sortBy: value.sortBy };
      },
    });

    register({
      name: 'select_sector',
      title: '查看板块龙头',
      description: '选择一个板块，并在页面右侧显示其龙头股和统计信息。',
      inputSchema: {
        type: 'object',
        properties: { sectorId: { type: 'string' } },
        required: ['sectorId'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input) {
        const sectorId = (input as { sectorId?: string }).sectorId;
        const inIndustry = industrySectors.some((sector) => sector.id === sectorId);
        const inConcept = conceptSectors.some((sector) => sector.id === sectorId);
        if (!sectorId || (!inIndustry && !inConcept)) throw new Error('未找到该板块');
        setMarketType(inIndustry ? 'industry' : 'concept');
        setSelectedId(sectorId);
        return { sectorId, marketType: inIndustry ? 'industry' : 'concept' };
      },
    });

    register({
      name: 'set_stock_watch',
      title: '设置股票关注状态',
      description: '关注或取消关注当前看板中的一只股票。',
      inputSchema: {
        type: 'object',
        properties: { code: { type: 'string' }, watched: { type: 'boolean' } },
        required: ['code', 'watched'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input) {
        const value = input as { code?: string; watched?: boolean };
        const exists = [...industrySectors, ...conceptSectors].some((sector) => sector.stocks.some((stock) => stock.code === value.code));
        if (!value.code || !exists || typeof value.watched !== 'boolean') throw new Error('股票代码或关注状态无效');
        setWatchlist((items) => value.watched ? [...new Set([...items, value.code as string])] : items.filter((code) => code !== value.code));
        return { code: value.code, watched: value.watched };
      },
    });

    return () => lifecycle.abort();
  }, []);

  const source = marketType === 'industry' ? industrySectors : conceptSectors;
  const visibleSectors = useMemo(() => {
    const filtered = source.filter((sector) => sector.name.toLowerCase().includes(query.trim().toLowerCase()));
    return [...filtered].sort((a, b) => b[sortBy] - a[sortBy]);
  }, [query, sortBy, source]);
  const selected = source.find((sector) => sector.id === selectedId) ?? source[0];

  const changeMarketType = (value: string) => {
    const next = value as 'industry' | 'concept';
    setMarketType(next);
    setSelectedId(next === 'industry' ? industrySectors[0].id : conceptSectors[0].id);
  };

  const toggleWatch = (code: string) => {
    setWatchlist((items) =>
      items.includes(code) ? items.filter((item) => item !== code) : [...items, code],
    );
  };

  const refresh = () => {
    setRefreshed(true);
    window.setTimeout(() => setRefreshed(false), 900);
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark"><BarChart3 size={20} aria-hidden="true" /></div>
          <div><strong>盘面雷达</strong><span>A 股板块洞察</span></div>
        </div>
        <nav className="main-nav" aria-label="主导航">
          <button className="nav-item active" type="button"><LayoutGrid size={16} />市场全景</button>
          <button className="nav-item" type="button"><Flame size={16} />板块热度</button>
          <button className="nav-item" type="button"><Star size={16} />我的关注</button>
        </nav>
        <div className="top-actions">
          <span className="status-pill"><span className="status-dot" />演示数据</span>
          <button className={`icon-button ${refreshed ? 'spinning' : ''}`} type="button" onClick={refresh} aria-label="刷新数据"><RefreshCw size={17} /></button>
        </div>
      </header>

      <div className="page-wrap">
        <section className="page-heading">
          <div>
            <div className="eyebrow"><CalendarDays size={14} />2025 年 02 月 21 日 · 收盘</div>
            <h1>今日市场全景</h1>
          </div>
          <div className="demo-note"><Info size={15} /><span>当前为产品演示数据，行情接口可在下一步接入</span></div>
        </section>

        <section className="metric-grid" aria-label="市场概览">
          <article className="metric-card featured">
            <div className="metric-label"><span>上证指数</span><span className="market-tag">沪</span></div>
            <div className="metric-main"><strong>3,394.76</strong><span className="up"><ArrowUpRight size={16} /> +1.86%</span></div>
            <div className="metric-foot">较昨收 +62.07</div>
          </article>
          <article className="metric-card">
            <div className="metric-label"><span>两市成交额</span><CircleDollarSign size={17} /></div>
            <div className="metric-main"><strong>1.82<span>万亿</span></strong></div>
            <div className="metric-foot"><span className="up">+2,436 亿</span> 较上一交易日</div>
          </article>
          <article className="metric-card">
            <div className="metric-label"><span>涨跌家数</span><Activity size={17} /></div>
            <div className="metric-main breadth-numbers"><strong className="up">3,218</strong><span>/</span><strong className="down">1,852</strong></div>
            <div className="breadth-bar"><span style={{ width: '61.4%' }} /><i style={{ width: '3.3%' }} /><em style={{ width: '35.3%' }} /></div>
            <div className="metric-foot spread"><span>上涨</span><span>平盘 173</span><span>下跌</span></div>
          </article>
          <article className="metric-card">
            <div className="metric-label"><span>赚钱效应</span><Sparkles size={17} /></div>
            <div className="metric-main"><strong>偏强</strong><span className="score">78</span></div>
            <div className="metric-foot"><span className="up">84 涨停</span><span className="divider" /><span className="down">12 跌停</span></div>
          </article>
        </section>

        <section className="content-grid">
          <article className="panel sector-panel">
            <div className="panel-head">
              <div><p className="section-kicker">SECTOR PULSE</p><h2>板块表现排行</h2></div>
              <Tabs value={marketType} onValueChange={changeMarketType}>
                <TabsList className="market-tabs">
                  <TabsTrigger value="industry">行业板块</TabsTrigger>
                  <TabsTrigger value="concept">概念板块</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="toolbar">
              <div className="sort-group" role="group" aria-label="板块排序">
                <button className={sortBy === 'change' ? 'active' : ''} type="button" onClick={() => setSortBy('change')}>涨跌幅</button>
                <button className={sortBy === 'inflow' ? 'active' : ''} type="button" onClick={() => setSortBy('inflow')}>主力净流入</button>
                <button className={sortBy === 'amount' ? 'active' : ''} type="button" onClick={() => setSortBy('amount')}>成交额</button>
              </div>
              <label className="search-box">
                <Search size={15} aria-hidden="true" />
                <span className="sr-only">搜索板块</span>
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索板块" />
              </label>
            </div>

            <div className="sector-list" role="list">
              {visibleSectors.map((sector, index) => {
                const isSelected = sector.id === selected.id;
                const total = sector.up + sector.flat + sector.down;
                return (
                  <button key={sector.id} type="button" className={`sector-row ${isSelected ? 'selected' : ''}`} onClick={() => setSelectedId(sector.id)} role="listitem">
                    <span className={`rank ${index < 3 ? 'hot' : ''}`}>{String(index + 1).padStart(2, '0')}</span>
                    <span className="sector-name"><strong>{sector.name}</strong><small>{sector.up} 涨 · {sector.down} 跌</small></span>
                    <span className="mini-breadth" aria-label={`上涨 ${sector.up} 家，下跌 ${sector.down} 家`}><i style={{ width: `${(sector.up / total) * 100}%` }} /><em style={{ width: `${(sector.down / total) * 100}%` }} /></span>
                    <Sparkline values={sector.trend} positive={sector.change >= 0} />
                    <span className="flow"><strong className={sector.inflow >= 0 ? 'up' : 'down'}>{formatSigned(sector.inflow, '亿')}</strong><small>主力净流入</small></span>
                    <span className="leader"><strong>{sector.leader}</strong><small className={sector.leaderChange >= 0 ? 'up' : 'down'}>{formatSigned(sector.leaderChange)}</small></span>
                    <span className={`change-badge ${sector.change >= 0 ? 'positive' : 'negative'}`}>{formatSigned(sector.change)}</span>
                    <ChevronRight className="row-chevron" size={16} />
                  </button>
                );
              })}
              {visibleSectors.length === 0 && <div className="empty-state">没有找到匹配的板块</div>}
            </div>
          </article>

          <aside className="panel leader-panel">
            <div className="leader-hero">
              <div className="leader-title-row">
                <div><p className="section-kicker">LEADING SECTOR</p><h2>{selected.name}</h2></div>
                <div className={`hero-change ${selected.change >= 0 ? 'up' : 'down'}`}>{formatSigned(selected.change)}</div>
              </div>
              <div className="strength-row"><span>板块强度</span><div className="strength-track"><span style={{ width: `${selected.score}%` }} /></div><strong>{selected.score}</strong></div>
              <div className="sector-stats">
                <div><span>成交额</span><strong>{selected.amount.toFixed(1)} 亿</strong></div>
                <div><span>主力净流入</span><strong className={selected.inflow >= 0 ? 'up' : 'down'}>{formatSigned(selected.inflow, ' 亿')}</strong></div>
                <div><span>上涨占比</span><strong>{Math.round((selected.up / (selected.up + selected.flat + selected.down)) * 100)}%</strong></div>
              </div>
            </div>

            <div className="leaders-head"><div><TrendingUp size={17} /><h3>板块龙头股</h3></div><span>按综合强度</span></div>
            <Table className="leader-table">
              <TableHeader><TableRow><TableHead>股票</TableHead><TableHead className="text-right">现价</TableHead><TableHead className="text-right">涨跌幅</TableHead><TableHead className="watch-head"><span className="sr-only">关注</span></TableHead></TableRow></TableHeader>
              <TableBody>
                {selected.stocks.map((stock, index) => (
                  <TableRow key={stock.code}>
                    <TableCell><div className="stock-cell"><span className={index === 0 ? 'stock-rank first' : 'stock-rank'}>{index + 1}</span><div><strong>{stock.name}</strong><small>{stock.code} · {stock.reason}</small></div></div></TableCell>
                    <TableCell className="text-right stock-price">{stock.price.toFixed(2)}</TableCell>
                    <TableCell className={`text-right stock-change ${stock.change >= 0 ? 'up' : 'down'}`}>{formatSigned(stock.change)}</TableCell>
                    <TableCell><button className={`watch-button ${watchlist.includes(stock.code) ? 'watched' : ''}`} type="button" aria-label={`${watchlist.includes(stock.code) ? '取消关注' : '关注'}${stock.name}`} onClick={() => toggleWatch(stock.code)}><Star size={15} fill={watchlist.includes(stock.code) ? 'currentColor' : 'none'} /></button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="leader-tip"><Flame size={15} /><span>龙头综合成交活跃度、涨幅、板块地位计算</span></div>
          </aside>
        </section>

        <section className="bottom-grid">
          <article className="panel index-panel">
            <div className="panel-head compact"><div><p className="section-kicker">MARKET TREND</p><h2>大盘分时</h2></div><div className="index-legend"><span><i className="legend-dot red" />上证指数</span><strong className="up">+1.86%</strong></div></div>
            <MarketChart />
          </article>
          <article className="panel distribution-panel">
            <div className="panel-head compact"><div><p className="section-kicker">DISTRIBUTION</p><h2>个股涨跌分布</h2></div><span className="total-count">共 5,243 只</span></div>
            <div className="distribution-bars">
              {[
                ['涨超 7%', 342, 'strong-up'], ['涨 3%–7%', 816, 'mid-up'], ['涨 0–3%', 2060, 'light-up'],
                ['平盘', 173, 'flat'], ['跌 0–3%', 1288, 'light-down'], ['跌 3%–7%', 469, 'mid-down'], ['跌超 7%', 95, 'strong-down'],
              ].map(([label, count, tone]) => (
                <div className="distribution-item" key={String(label)}><span>{label}</span><div className="distribution-track"><i className={String(tone)} style={{ width: `${Math.max(8, (Number(count) / 2060) * 100)}%` }} /></div><strong>{count}</strong></div>
              ))}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
