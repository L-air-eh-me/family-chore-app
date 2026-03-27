import { NextResponse } from "next/server";

import { debugReadTab } from "@/lib/sheets";

function normalizeBoolean(value: unknown) {
  return String(value).trim().toLowerCase() === "true";
}

export async function GET() {
  try {
    const rows = await debugReadTab("Kids");

    return NextResponse.json({
      count: rows.length,
      rows,
      activeRows: rows.filter((row) => normalizeBoolean(row.active)),
      env: {
        hasClientEmail: Boolean(process.env.GOOGLE_CLIENT_EMAIL),
        hasPrivateKey: Boolean(process.env.GOOGLE_PRIVATE_KEY),
        sheetId: process.env.GOOGLE_SHEET_ID ?? null
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
