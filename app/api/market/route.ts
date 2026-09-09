import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const EASTMONEY_HOSTS = [
  'https://push2.eastmoney.com',
  'https://push2delay.eastmoney.com',
];

const EASTMONEY_HEADERS = {
  Accept: 'application/json,text/plain,*/*',
  Referer: 'https://quote.eastmoney.com/',
  'User-Agent': 'Mozilla/5.0 (compatible; PanmianRadar/1.0)',
};

type EastmoneyEnvelope<T> = {
  data?: T | null;
};

type EastmoneyList = {
  total?: number;
  diff?: Array<Record<string, unknown>>;
};

type CachedPayload = {
  payload: Record<string, unknown>;
  storedAt: number;
};

const responseCache = new Map<string, CachedPayload>();
const FRESH_CACHE_MS = 30_000;

const numberValue = (value: unknown, fallback = 0) => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const textValue = (value: unknown, fallback = '—') =>
  typeof value === 'string' && value.trim() ? value.trim() : fallback;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

async function requestJson<T>(url: string, timeoutMs = 6500) {
  const response = await fetch(url, {
    headers: EASTMONEY_HEADERS,
    cache: 'no-store',
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) throw new Error(`upstream_${response.status}`);
  const payload = (await response.json()) as EastmoneyEnvelope<T>;
  if (!payload.data) throw new Error('upstream_empty');
  return payload.data;
}

async function fetchEastmoney<T>(path: string, preferredHost?: string) {
  const hosts = preferredHost
    ? [preferredHost, ...EASTMONEY_HOSTS.filter((host) => host !== preferredHost)]
    : EASTMONEY_HOSTS;
  let lastError: unknown;

  for (const host of hosts) {
    try {
      return { data: await requestJson<T>(`${host}${path}`), host };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error('upstream_unavailable');
}

function makeSector(row: Record<string, unknown>) {
  const change = numberValue(row.f3);
  const up = numberValue(row.f104);
  const down = numberValue(row.f105);
  const flat = Math.max(0, numberValue(row.f106));
  const breadthTotal = up + flat + down;
  const breadthScore = breadthTotal ? ((up - down) / breadthTotal) * 18 : 0;
  const flow = numberValue(row.f62) / 100_000_000;
  const flowScore = clamp(flow / 8, -10, 10);

  return {
    id: textValue(row.f12, ''),
    name: textValue(row.f14),
    change,
    amount: numberValue(row.f6) / 100_000_000,
    inflow: flow,
    up,
    flat,
    down,
    leader: textValue(row.f128),
    leaderCode: textValue(row.f140, ''),
    leaderChange: numberValue(row.f136),
    score: Math.round(clamp(50 + change * 6 + breadthScore + flowScore, 0, 100)),
    trend: [0, change],
    stocks: [],
    timestamp: numberValue(row.f124),
  };
}

async function fetchSectorPage(
  type: 'industry' | 'concept',
  page: number,
  preferredHost?: string,
) {
  const boardType = type === 'industry' ? 2 : 3;
  const fields = [
    'f12', 'f14', 'f2', 'f3', 'f4', 'f6', 'f8', 'f10', 'f20', 'f62',
    'f104', 'f105', 'f106', 'f124', 'f128', 'f136', 'f140',
  ].join(',');
  const params = new URLSearchParams({
    pn: String(page),
    pz: '100',
    po: '1',
    np: '1',
    fltt: '2',
    invt: '2',
    fid: 'f3',
    fs: `m:90+t:${boardType}`,
    fields,
  });
  return fetchEastmoney<EastmoneyList>(`/api/qt/clist/get?${params}`, preferredHost);
}

async function fetchAllSectors(type: 'industry' | 'concept') {
  const first = await fetchSectorPage(type, 1);
  const total = numberValue(first.data.total);
  const pageCount = Math.min(8, Math.max(1, Math.ceil(total / 100)));
  const rest = await Promise.all(
    Array.from({ length: pageCount - 1 }, (_, index) =>
      fetchSectorPage(type, index + 2, first.host),
    ),
  );
  const rows = [first, ...rest].flatMap((page) => page.data.diff ?? []);
  const sectors = rows
    .map(makeSector)
    .filter((sector) => sector.id && sector.name !== '—');

  return { sectors, host: first.host, reportedTotal: total };
}

async function fetchIndex(secid: string, preferredHost?: string) {
  const params = new URLSearchParams({
    secid,
    fltt: '2',
    invt: '2',
    fields: 'f43,f57,f58,f169,f170,f47,f48,f60,f86',
  });
  const result = await fetchEastmoney<Record<string, unknown>>(
    `/api/qt/stock/get?${params}`,
    preferredHost,
  );
  const row = result.data;
  return {
    code: textValue(row.f57, secid),
    name: textValue(row.f58),
    price: numberValue(row.f43),
    change: numberValue(row.f169),
    changePercent: numberValue(row.f170),
    previousClose: numberValue(row.f60),
    amount: numberValue(row.f48),
    timestamp: numberValue(row.f86),
  };
}

async function fetchMarket(type: 'industry' | 'concept') {
  const { sectors, host, reportedTotal } = await fetchAllSectors(type);
  if (!sectors.length) throw new Error('sector_data_empty');

  const indexResults = await Promise.allSettled([
    fetchIndex('1.000001', host),
    fetchIndex('0.399001', host),
    fetchIndex('0.399006', host),
  ]);
  const indices = indexResults
    .filter((result): result is PromiseFulfilledResult<Awaited<ReturnType<typeof fetchIndex>>> => result.status === 'fulfilled')
    .map((result) => result.value);

  const sectorUp = sectors.filter((sector) => sector.change > 0).length;
  const sectorFlat = sectors.filter((sector) => sector.change === 0).length;
  const sectorDown = sectors.filter((sector) => sector.change < 0).length;
  const avgIndexChange = indices.length
    ? indices.reduce((sum, index) => sum + index.changePercent, 0) / indices.length
    : 0;
  const breadth = sectors.length ? (sectorUp - sectorDown) / sectors.length : 0;
  const sentimentScore = Math.round(clamp(50 + avgIndexChange * 10 + breadth * 30, 0, 100));
  const sentimentLabel = sentimentScore >= 70
    ? '强势'
    : sentimentScore >= 55
      ? '偏强'
      : sentimentScore >= 45
        ? '均衡'
        : sentimentScore >= 30
          ? '偏弱'
          : '弱势';
  const latestTimestamp = Math.max(
    ...sectors.map((sector) => sector.timestamp),
    ...indices.map((index) => index.timestamp),
  );

  return {
    mode: 'live',
    source: '东方财富公开行情',
    possibleDelay: true,
    updatedAt: latestTimestamp > 0 ? latestTimestamp * 1000 : Date.now(),
    marketType: type,
    summary: {
      indices,
      turnover: indices.slice(0, 2).reduce((sum, index) => sum + index.amount, 0),
      sectorUp,
      sectorFlat,
      sectorDown,
      sectorTotal: reportedTotal || sectors.length,
      sentimentScore,
      sentimentLabel,
    },
    sectors,
  };
}

async function fetchBoardStocks(board: string) {
  const fields = 'f12,f14,f2,f3,f4,f5,f6,f8,f10,f20,f62';
  const params = new URLSearchParams({
    pn: '1',
    pz: '8',
    po: '1',
    np: '1',
    fltt: '2',
    invt: '2',
    fid: 'f3',
    fs: `b:${board}`,
    fields,
  });
  const result = await fetchEastmoney<EastmoneyList>(`/api/qt/clist/get?${params}`);
  const stocks = (result.data.diff ?? []).map((row, index) => ({
    code: textValue(row.f12, ''),
    name: textValue(row.f14),
    price: numberValue(row.f2),
    change: numberValue(row.f3),
    turnover: numberValue(row.f8),
    amount: numberValue(row.f6) / 100_000_000,
    inflow: numberValue(row.f62) / 100_000_000,
    reason: index === 0 ? '板块涨幅领跑' : index < 3 ? '板块涨幅前排' : '强势成分股',
  }));

  return {
    mode: 'live',
    source: '东方财富公开行情',
    possibleDelay: true,
    board,
    stocks,
  };
}

export async function GET(request: NextRequest) {
  const board = request.nextUrl.searchParams.get('board');
  const typeParam = request.nextUrl.searchParams.get('type');
  const forceRefresh = numberValue(request.nextUrl.searchParams.get('refresh')) > 0;
  const marketType = typeParam === 'concept' ? 'concept' : 'industry';
  const cacheKey = board ? `board:${board}` : `market:${marketType}`;
  const cached = responseCache.get(cacheKey);

  if (board && !/^BK\d{4}$/i.test(board)) {
    return NextResponse.json({ error: '无效的板块代码' }, { status: 400 });
  }

  if (!forceRefresh && cached && Date.now() - cached.storedAt < FRESH_CACHE_MS) {
    return NextResponse.json(cached.payload, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
        'X-Data-Source': 'Eastmoney-Public-Quote',
        'X-Data-Cache': 'memory',
      },
    });
  }

  try {
    const payload = board
      ? await fetchBoardStocks(board)
      : await fetchMarket(marketType);

    responseCache.set(cacheKey, {
      payload: payload as unknown as Record<string, unknown>,
      storedAt: Date.now(),
    });

    return NextResponse.json(payload, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
        'X-Data-Source': 'Eastmoney-Public-Quote',
        'X-Data-Cache': 'fresh',
      },
    });
  } catch {
    if (cached) {
      return NextResponse.json(
        { ...cached.payload, mode: 'stale', cachedAt: cached.storedAt },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=300',
            'X-Data-Source': 'Eastmoney-Public-Quote',
            'X-Data-Cache': 'stale',
          },
        },
      );
    }

    return NextResponse.json(
      {
        error: '公开行情接口暂时不可用，请稍后重试',
        source: '东方财富公开行情',
      },
      {
        status: 502,
        headers: { 'Cache-Control': 'no-store' },
      },
    );
  }
}
