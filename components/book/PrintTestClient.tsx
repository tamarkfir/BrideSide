"use client";

import { useState } from "react";
import CeremonyBooklet from "./CeremonyBooklet";
import type { CeremonyBooklet as BookletType, SessionState } from "@/lib/types";

export default function PrintTestClient({
  initialBooklet,
  initialState
}: {
  initialBooklet: BookletType;
  initialState: SessionState;
}) {
  const [booklet, setBooklet] = useState(initialBooklet);

  return (
    <CeremonyBooklet
      booklet={booklet}
      state={initialState}
      onChange={setBooklet}
      onBack={() => {}}
    />
  );
}
