import getDb from "@/lib/database";
import rootLogger from "@/lib/log";
import { NextRequest, NextResponse } from "next/server";
import * as util from '@/lib/server-util';
import fs from 'fs/promises';
import { validateSignInStatus } from "@/lib/server-auth";

const route = '/api/tx/[id]/push'
const logger = rootLogger.child({ route });

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  logger.debug(`POST ${route}`);

  const res = validateSignInStatus(req);
  if (res) {
    return res;
  }

  const { id } = params;
  logger.debug(`POST ${route} id: ${id}`);

  try {
    const db = await getDb();
    const transaction = await db.getTx(id);

    if (!transaction) {
      return NextResponse.json({
        error: 'Transaction not found'
      }, { status: 404 });
    }

    // Check if the transaction has already been pushed
    if (transaction.pushed_at) {
      return NextResponse.json({
        error: 'Transaction has already been pushed'
      }, { status: 400 });
    }

    // Check if the transaction has enough signatures
    if (transaction.signed.length < transaction.multisig_config.config.threshold) {
      return NextResponse.json({
        error: 'Not enough signatures to push the transaction'
      }, { status: 400 });
    }

    // Write the signatures to the original tx.json
    const jsonContent = await fs.readFile(transaction.tx_json_path, 'utf-8');
    const ckbCliTx: TxHelper = JSON.parse(jsonContent);

    const signatures: string[] = [];
    transaction.signed.forEach(sig => {
      signatures.push(sig.signature);
    });
    Object.keys(ckbCliTx.multisig_configs).forEach((lock_args) => {
      if (lock_args === transaction.multisig_config.script.args) {
        ckbCliTx.signatures[lock_args] = signatures;
      }
    });

    await fs.writeFile(transaction.tx_json_path, JSON.stringify(ckbCliTx, null, 2));

    // Push the transaction to the CKB network
    try {
      const { stderr } = util.pushTransactionByCkbCli(transaction.tx_json_path)

      if (stderr === '') {
        // Update the transaction in the database
        transaction.pushed_at = new Date().toISOString();
        await db.updateTx(transaction);

        logger.info(`Transaction pushed: ${transaction.tx_hash}`);
        return NextResponse.json({
          result: 'Transaction pushed successfully',
        }, { status: 200 });
      } else {
        // Update the transaction in the database
        transaction.rejected_at = new Date().toISOString();
        transaction.reject_reason = stderr;
        await db.updateTx(transaction);

        logger.error(`Transaction rejected: ${transaction.tx_hash}, reason: ${stderr}`);
        return NextResponse.json({
          error: stderr,
        }, { status: 400 });
      }
    } catch (error: any) {
      return NextResponse.json({
        error: `Failed to push transaction to CKB network: ${error}`
      }, { status: 500 });
    }

  } catch (error) {
    logger.error('Error pushing transaction:', error);

    return NextResponse.json({
      error: `Failed to push transaction: ${error}`
    }, { status: 500 });
  }
}
