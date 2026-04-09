import { Prisma } from "@prisma/client";

export function decimal(value: number | string) {
  return new Prisma.Decimal(value);
}

export function decimalToNumber(value: Prisma.Decimal | number | string | null | undefined) {
  return Number(value ?? 0);
}

export function sumNumbers(values: Array<number | string>) {
  return values.reduce<number>((acc, current) => acc + Number(current), 0);
}
