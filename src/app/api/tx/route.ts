import getDb from "@/lib/database";
import rootLogger from "@/lib/log";
import { NextRequest, NextResponse } from "next/server";
import { validateSignInStatus } from "@/lib/server-auth";

const route = '/api/tx'
const logger = rootLogger.child({ route });

export async function GET(req: NextRequest) {
  const res = validateSignInStatus(req);
  if (res) {
    return res;
  }

  logger.debug(`GET ${route}`)

  const db = await getDb();

  try {
    const transactions = await db.getAllTx();

    return NextResponse.json({
      result: transactions
    }, { status: 200 });

  } catch (error) {
    logger.error('Error fetching transactions:', error);

    // Return an error response
    return NextResponse.json({
      error: 'Failed to fetch transactions'
    }, { status: 500 });
  }
}
