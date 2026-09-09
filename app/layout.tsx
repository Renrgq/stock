import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '盘面雷达｜A 股板块洞察',
  description: '直观查看 A 股每日板块涨跌、资金动向与板块龙头股。',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
