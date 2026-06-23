"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Notebook from "@/components/notebook/Notebook";

export default function SessionPage() {
  const router = useRouter();
  const [names, setNames] = useState<{ a: string; b: string } | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("brideside:names");
    if (!stored) {
      router.replace("/");
      return;
    }
    setNames(JSON.parse(stored));
  }, [router]);

  if (!names) return null;

  return <Notebook nameA={names.a} nameB={names.b} />;
}
