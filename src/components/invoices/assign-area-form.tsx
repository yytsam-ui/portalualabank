"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { ApiFormError } from "@/components/shared/api-form-error";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

export function AssignAreaForm({
  endpoint,
  areas,
  defaultArea = "",
}: {
  endpoint: string;
  areas: string[];
  defaultArea?: string;
}) {
  const router = useRouter();
  const [areaAssigned, setAreaAssigned] = useState(defaultArea);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ areaAssigned }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "No se pudo derivar la factura al area.");
      setLoading(false);
      return;
    }

    router.refresh();
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <Select value={areaAssigned} onChange={(event) => setAreaAssigned(event.target.value)}>
        <option value="">Seleccionar</option>
        {areas.map((area) => (
          <option key={area} value={area}>
            {area}
          </option>
        ))}
      </Select>
      <ApiFormError error={error} />
      <Button onClick={handleSubmit} disabled={!areaAssigned || loading}>
        {loading ? "Derivando..." : "Derivar al area"}
      </Button>
    </div>
  );
}
