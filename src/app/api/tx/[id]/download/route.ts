import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import rootLogger from '@/lib/log';
import getDb from '@/lib/database';
import { getSignInUser, validateSignInStatus } from '@/lib/server-auth';

const route = '/api/tx/[id]/download';
const logger = rootLogger.child({ route });

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  logger.debug(`GET ${route}`);
  const res = validateSignInStatus(req);
  if (res) {
    return res;
  }

  const db = await getDb();
  const txId = params.id;

  try {
    const transaction = await db.getTx(txId);
    if (!transaction) {
      logger.error(`Transaction not found: ${txId}`);
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    const fileContent = await fs.readFile(transaction.tx_json_path, 'utf-8');
    const fileName = path.basename(transaction.tx_json_path);

    logger.info(`Downloading transaction file: ${fileName}`);

    return new NextResponse(fileContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    logger.error(`Error downloading transaction: ${error}`);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
