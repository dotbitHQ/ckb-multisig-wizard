import { NextRequest, NextResponse } from "next/server";
import getDb from '@/lib/database'
import rootLogger from '@/lib/log'
import { validateSignInStatus } from "@/lib/server-auth";

const route = '/api/tx/[id]/sign'
const logger = rootLogger.child({ route });

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  logger.debug(`POST ${route} id: ${id}`);

  const res = validateSignInStatus(req);
  if (res) {
    return res;
  }

  try {
    const db = await getDb();
    const { lock_args, signature } = await req.json();

    // Fetch the current transaction
    const tx = await db.getTx(id);
    if (!tx) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Check if the signature already exists
    const existingSignatureIndex = tx.signed.findIndex(sig => sig.lock_args === lock_args);
    if (existingSignatureIndex !== -1) {
      tx.signed[existingSignatureIndex].signature = signature;
    } else {
      tx.signed.push({ lock_args, signature });
    }

    const success = await db.updateTx(tx);

    if (success) {
      return NextResponse.json({
        result: 'Signature submitted successfully',
        transaction: tx
      }, { status: 200 });
    } else {
      return NextResponse.json({
        error: 'Failed to update transaction'
      }, { status: 500 });
    }

  } catch (error) {
    logger.error('Error submitting signature:', error);
    return NextResponse.json({ error: 'Failed to submit signature' }, { status: 500 });
  }
}
