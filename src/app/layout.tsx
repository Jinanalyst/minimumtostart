import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "minimumtostart — 아이디어를 출시 가능한 MVP로",
  description: "아이디어 정리, MVP 전략, 랜딩페이지, 리드 수집과 이메일 마케팅을 하나의 캔버스에서.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
