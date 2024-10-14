import getDb from "@/lib/database";
import rootLogger from "@/lib/log";
import { NextRequest, NextResponse } from "next/server";
import * as util from '@/lib/server-util';
import { validateSignInStatus } from "@/lib/server-auth";

const route = '/api/tx/[id]/status'
const logger = rootLogger.child({ route });

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  logger.debug(`GET ${route} id: ${id}`);

  const res = validateSignInStatus(req);
  if (res) {
    return res;
  }

  try {
    const db = await getDb();
    const transaction = await db.getTx(id);

    if (!transaction) {
      return NextResponse.json({
        error: 'Transaction not found'
      }, { status: 404 });
    }

    const { status, committed_at } = await util.getTransactionStatus(transaction.tx_hash);

    if (status === 'committed') {
      transaction.committed_at = committed_at!.toISOString();
      await db.updateTx(transaction);
    } else if (status === 'rejected') {
      transaction.rejected_at = new Date().toISOString();
      await db.updateTx(transaction);
    }

    return NextResponse.json({
      status: status
    }, { status: 200 });
  } catch (error) {
    logger.error('Error fetching transaction status:', error);

    return NextResponse.json({
      error: `Failed to fetch transaction status: ${error}`
    }, { status: 500 });
  }
}
