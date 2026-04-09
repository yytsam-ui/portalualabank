/* @vitest-environment jsdom */
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { DomainError } from "@/lib/errors";
import { ApTabs } from "@/components/ap/ap-tabs";
import { formatStatusLabel, isPreviewableMimeType } from "@/lib/utils";
import { AppShell } from "@/components/layout/app-shell";
import { InvoiceForm } from "@/components/invoices/invoice-form";
import { filterApMonitorRows, type ApMonitorRow } from "@/features/invoices/monitor.service";
import { queueNotification } from "@/features/notifications/notifications.service";
import { createPurchaseOrderSchema } from "@/features/purchase-orders/schemas";
import { assertCanCreateSupplier } from "@/features/suppliers/supplier-access";
import {
  assertCanApOperateInvoice,
  buildInvoiceListWhere,
} from "@/features/invoices/invoice-access";
import {
  assertCanApprovePurchaseOrder,
  assertCanCreatePurchaseOrder,
  buildPurchaseOrderListWhere,
} from "@/features/purchase-orders/purchase-order-access";
import { assertInvoiceIsNotDuplicate, assertInvoiceWithinPoBalance } from "@/features/invoices/invoice-rules";
import { computePurchaseOrderConsumption, validatePoTransition } from "@/features/purchase-orders/purchase-orders.service";
import { validateInvoiceTransition } from "@/features/invoices/invoices.service";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe("segregacion de roles", () => {
  const procurement = { id: "u-proc", role: "PROCUREMENT" as const, area: "OPERATIONS" };
  const requester = { id: "u-area", role: "REQUESTER_AREA" as const, area: "OPERATIONS" };
  const ap = { id: "u-ap", role: "AP" as const, area: "FINANCE" };

  it("Compras puede crear proveedor", () => {
    expect(() => assertCanCreateSupplier(procurement)).not.toThrow();
  });

  it("Area no puede crear proveedor", () => {
    expect(() => assertCanCreateSupplier(requester)).toThrowError(DomainError);
  });

  it("Compras puede crear OC", () => {
    expect(() => assertCanCreatePurchaseOrder(procurement)).not.toThrow();
    expect(() => assertCanApprovePurchaseOrder(procurement)).not.toThrow();
  });

  it("Area no puede crear OC", () => {
    expect(() => assertCanCreatePurchaseOrder(requester)).toThrowError(DomainError);
  });

  it("Area solo ve OCs de su area", () => {
    expect(buildPurchaseOrderListWhere(requester)).toEqual({
      deletedAt: null,
      area: "OPERATIONS",
    });
  });

  it("AP no ve facturas no derivadas en la lista operativa", () => {
    expect(buildInvoiceListWhere(ap)).toEqual({
      deletedAt: null,
      status: { in: ["DERIVED_TO_AP", "RETURNED_BY_AP", "ACCOUNTED"] },
    });
  });

  it("AP ve facturas derivadas", () => {
    expect(() => assertCanApOperateInvoice(ap)).not.toThrow();
  });

  it("AP no puede contabilizar si no fue derivada", () => {
    expect(() => validateInvoiceTransition("PENDING_AREA_APPROVAL", "ACCOUNTED")).toThrowError(/Transicion invalida/i);
  });

  it("Backend bloquea accesos manuales indebidos", () => {
    expect(() => assertCanApOperateInvoice(requester)).toThrowError(/Solo AP/i);
  });

  it("Contabilizar actualiza saldo correctamente", () => {
    const result = computePurchaseOrderConsumption({
      remainingAmount: 1000,
      consumedAmount: 250,
      invoiceAmount: 400,
    });

    expect(result.consumedAmount).toBe(650);
    expect(result.remainingAmount).toBe(600);
  });

  it("una OC parcialmente consumida puede seguir contabilizando sin cambiar de estado", () => {
    const result = computePurchaseOrderConsumption({
      remainingAmount: 800,
      consumedAmount: 200,
      invoiceAmount: 150,
    });

    expect(result.consumedAmount).toBe(350);
    expect(result.remainingAmount).toBe(650);
    expect(result.nextStatus).toBe("PARTIALLY_CONSUMED");
    expect(() => validatePoTransition("PARTIALLY_CONSUMED", "PARTIALLY_CONSUMED")).not.toThrow();
  });
});

describe("reglas criticas del flujo", () => {
  it("no permite factura duplicada", () => {
    expect(() => assertInvoiceIsNotDuplicate(true)).toThrowError(DomainError);
  });

  it("no permite asignar factura que exceda saldo OC", () => {
    expect(() => assertInvoiceWithinPoBalance(1200, 1000)).toThrowError(/saldo disponible/i);
  });

  it("no se puede crear una OC sin cuenta contable y CECO", () => {
    expect(() =>
      createPurchaseOrderSchema.parse({
        supplierId: "sup-1",
        area: "OPERATIONS",
        accountCode: "",
        costCenter: "",
        currency: "ARS",
        items: [{ description: "Servicio", quantity: 1, unitPrice: 100 }],
      }),
    ).toThrow();
  });

  it("transicion invalida de estado falla", () => {
    expect(() => validatePoTransition("DRAFT", "PARTIALLY_CONSUMED")).toThrowError(/Transicion invalida/i);
    expect(() => validateInvoiceTransition("ACCOUNTED", "DERIVED_TO_AP")).toThrowError(/Transicion invalida/i);
  });

  it("permite el circuito monitor AP hacia area y vuelta a AP", () => {
    expect(() => validateInvoiceTransition("DRAFT", "PENDING_AREA_APPROVAL")).not.toThrow();
    expect(() => validateInvoiceTransition("PENDING_AREA_APPROVAL", "DERIVED_TO_AP")).not.toThrow();
  });
});

describe("ux visible en espanol", () => {
  it("separa monitor y carga de facturas en navegacion distinta", () => {
    render(<ApTabs currentPath="/ap/monitor-de-facturas" />);

    expect(screen.getByText("Monitor de facturas")).toBeInTheDocument();
    expect(screen.getByText("Cargar factura")).toBeInTheDocument();
    expect(screen.getByText("Bandeja AP")).toBeInTheDocument();
  });

  it("muestra menu principal en espanol para AP", () => {
    render(
      <AppShell user={{ name: "AP Demo", email: "ap@demo.com", role: "AP", area: "FINANCE" }}>
        <div>Contenido</div>
      </AppShell>,
    );

    expect(screen.getByText("Inicio")).toBeInTheDocument();
    expect(screen.getByText("Monitor de facturas")).toBeInTheDocument();
    expect(screen.getByText("Cargar factura")).toBeInTheDocument();
    expect(screen.getByText("Bandeja AP")).toBeInTheDocument();
    expect(screen.getByText("Cerrar sesion")).toBeInTheDocument();
  });

  it("el area no ve campos contables al cargar y enviar factura", () => {
    render(
      <InvoiceForm
        purchaseOrders={[
          {
            id: "po-1",
            number: "PO-000001",
            supplierName: "Proveedor Demo",
            accountCode: "610100",
            costCenter: "OPS-001",
            remainingAmount: 1000,
          },
        ]}
      />,
    );

    expect(screen.getByText("Numero de factura")).toBeInTheDocument();
    expect(screen.getByText("Aprobar y enviar a AP")).toBeInTheDocument();
    expect(screen.queryByText("Subtotal")).not.toBeInTheDocument();
    expect(screen.queryByText("Impuestos")).not.toBeInTheDocument();
  });

  it("las etiquetas criticas de estado quedan en espanol", () => {
    expect(formatStatusLabel("DERIVED_TO_AP")).toBe("En revision AP");
    expect(formatStatusLabel("ACCOUNTED")).toBe("Contabilizada");
  });

  it("los adjuntos PDF e imagen se consideran previsualizables", () => {
    expect(isPreviewableMimeType("application/pdf")).toBe(true);
    expect(isPreviewableMimeType("image/png")).toBe(true);
    expect(isPreviewableMimeType("application/vnd.ms-excel")).toBe(false);
  });

  it("expone filas de monitor con filtros multiples", () => {
    const rows: ApMonitorRow[] = [
      {
        id: "inv-1",
        internalId: "inv-1",
        invoiceNumber: "FAC-1",
        supplierName: "Proveedor Uno",
        supplierTaxId: "307001",
        invoiceType: "A",
        invoiceDate: new Date("2026-04-01"),
        receivedDate: new Date("2026-04-02"),
        currency: "ARS",
        subtotal: "100",
        taxes: "21",
        total: "121",
        areaAssigned: "OPERATIONS",
        areaOrigin: "OPERATIONS",
        purchaseOrderNumber: "PO-1",
        accountCode: "610100",
        costCenter: "OPS-001",
        status: "PENDING_AREA_APPROVAL",
        statusLabel: "Pendiente del area",
        sourceType: "AP_MONITOR",
        sourceLabel: "Monitor AP",
        createdByName: "AP Demo",
        derivedByName: "AP Demo",
        approvedByName: "-",
        accountedByName: "-",
        createdAt: new Date("2026-04-02"),
        updatedAt: new Date("2026-04-02"),
        derivedAt: new Date("2026-04-02"),
        sentToApAt: null,
        accountedAt: null,
        hasAttachment: true,
        notes: "Observacion",
        returnReason: "-",
      },
      {
        id: "inv-2",
        internalId: "inv-2",
        invoiceNumber: "FAC-2",
        supplierName: "Proveedor Dos",
        supplierTaxId: "307002",
        invoiceType: "B",
        invoiceDate: new Date("2026-04-05"),
        receivedDate: new Date("2026-04-06"),
        currency: "USD",
        subtotal: "200",
        taxes: "42",
        total: "242",
        areaAssigned: "LEGAL",
        areaOrigin: "-",
        purchaseOrderNumber: "-",
        accountCode: "-",
        costCenter: "-",
        status: "DRAFT",
        statusLabel: "Pendiente de derivacion",
        sourceType: "AP_MONITOR",
        sourceLabel: "Monitor AP",
        createdByName: "AP Demo",
        derivedByName: "-",
        approvedByName: "-",
        accountedByName: "-",
        createdAt: new Date("2026-04-06"),
        updatedAt: new Date("2026-04-06"),
        derivedAt: null,
        sentToApAt: null,
        accountedAt: null,
        hasAttachment: false,
        notes: "-",
        returnReason: "-",
      },
    ];

    const filtered = filterApMonitorRows(rows, {
      q: "Proveedor Uno",
      status: "PENDING_AREA_APPROVAL",
      area: "OPERATIONS",
      currency: "ARS",
      hasAttachment: "si",
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.invoiceNumber).toBe("FAC-1");
  });

  it("genera notificaciones en modo mock sin envio real", async () => {
    const tx = {
      notificationOutbox: {
        create: vi.fn(async ({ data }) => ({ id: "n-1", ...data })),
      },
      auditLog: {
        create: vi.fn(async ({ data }) => data),
      },
    } as unknown as Parameters<typeof queueNotification>[0];

    const rows = await queueNotification(tx, {
      eventKey: "invoice.sent-to-ap",
      entityType: "INVOICE",
      entityId: "inv-1",
      createdById: "user-1",
      subject: "Factura enviada a AP",
      template: "factura-enviada-ap",
      recipients: [{ email: "ap@demo.com", name: "AP Demo" }],
      comment: "Notificacion de prueba",
    });

    expect(rows).toHaveLength(1);
    expect(tx.notificationOutbox.create).toHaveBeenCalledTimes(1);
    expect(tx.auditLog.create).toHaveBeenCalledTimes(1);
  });
});
