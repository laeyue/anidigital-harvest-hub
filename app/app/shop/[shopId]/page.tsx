"use client";

import Shop from "@/pages/app/Shop";

export default function ShopPage({
  params,
}: {
  params: { shopId: string };
}) {
  return <Shop shopId={params.shopId} />;
}

