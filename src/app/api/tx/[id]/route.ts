import { NextRequest, NextResponse } from "next/server";
import getDb from '@/lib/database'
import rootLogger from '@/lib/log'
import { validateSignInStatus } from '@/lib/server-auth';
import * as util from '@/lib/server-util';

const route = '/api/tx/[id]'
const logger = rootLogger.child({ route });

export async function GET (req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  logger.debug(`GET ${route} id: ${id}`);

  const res = validateSignInStatus(req);
  if (res) {
    return res;
  }

  try {
    const db = await getDb();
    const tx = await db.getTx(id);

    if (tx) {
      const { status, committed_at } = await util.getTransactionStatus(tx.tx_hash);
      if (status === 'committed' && tx.committed_at === null) {
        tx.committed_at = committed_at!.toISOString();
        await db.updateTx(tx);
      } else if (status === 'rejected' && tx.rejected_at === null) {
        tx.rejected_at = new Date().toISOString();
        await db.updateTx(tx);
      }

      return NextResponse.json({ result: tx });
    } else {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }
  } catch (error) {
    logger.error('Error fetching transaction:', error);
    return NextResponse.json({ error: 'Failed to fetch transaction' }, { status: 500 });
  }
}
