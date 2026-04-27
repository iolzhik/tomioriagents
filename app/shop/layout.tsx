import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TOMIORI — Высокое ювелирное искусство | Интернет-магазин",
  description: "Премиальные ювелирные украшения от бренда Tomiori. Кольца, серьги, колье и другие изделия высочайшего качества. Доставка по Астане.",
  keywords: "ювелирные украшения, Астана, кольца, серьги, Tomiori, бриллианты, золото",
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
