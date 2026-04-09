"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function PostActionButton({
  endpoint,
  label,
  variant = "default",
}: {
  endpoint: string;
  label: string;
  variant?: "default" | "secondary" | "outline" | "danger";
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    await fetch(endpoint, { method: "POST" });
    router.refresh();
    setLoading(false);
  }

  return (
    <Button variant={variant} onClick={handleClick} disabled={loading}>
      {loading ? "Procesando..." : label}
    </Button>
  );
}
