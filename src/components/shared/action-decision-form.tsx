"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { ApiFormError } from "@/components/shared/api-form-error";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function ActionDecisionForm({
  endpoint,
  approveLabel,
  rejectLabel,
  approveOnly = false,
  returnMode = false,
}: {
  endpoint: string;
  approveLabel: string;
  rejectLabel?: string;
  approveOnly?: boolean;
  returnMode?: boolean;
}) {
  const router = useRouter();
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  async function submit(decision: "APPROVED" | "REJECTED" | "RETURNED") {
    setLoadingAction(decision);
    setError(null);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, comment }),
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "No se pudo completar la accion.");
      setLoadingAction(null);
      return;
    }

    router.refresh();
    setComment("");
    setLoadingAction(null);
  }

  return (
    <div className="space-y-4">
      <Textarea
        placeholder={returnMode ? "Motivo de devolucion" : "Comentario para rechazo o contexto adicional"}
        value={comment}
        onChange={(event) => setComment(event.target.value)}
      />
      <ApiFormError error={error} />
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => submit(returnMode ? "RETURNED" : "APPROVED")} disabled={!!loadingAction}>
          {loadingAction === (returnMode ? "RETURNED" : "APPROVED") ? "Procesando..." : approveLabel}
        </Button>
        {!approveOnly && rejectLabel ? (
          <Button variant={returnMode ? "danger" : "outline"} onClick={() => submit(returnMode ? "RETURNED" : "REJECTED")} disabled={!!loadingAction}>
            {loadingAction === (returnMode ? "RETURNED" : "REJECTED") ? "Procesando..." : rejectLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
