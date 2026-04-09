import { assertCondition } from "@/lib/errors";

export function assertCommentRequired(decision: "REJECTED" | "RETURNED" | "APPROVED", comment?: string) {
  if (decision === "REJECTED" || decision === "RETURNED") {
    assertCondition(comment && comment.trim().length > 0, "El comentario es obligatorio para rechazar o devolver.", "COMMENT_REQUIRED");
  }
}
