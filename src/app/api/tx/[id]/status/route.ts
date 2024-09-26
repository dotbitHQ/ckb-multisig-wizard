import getDb from "@/lib/database";
import rootLogger from "@/lib/log";
import { NextRequest, NextResponse } from "next/server";
import * as util from '@/lib/util';

const route = '/api/tx/[id]/status'
const logger = rootLogger.child({ route });

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const { id } = params;
    logger.debug(`GET ${route} id: ${id}`);

    try {
        const db = await getDb();
        const transaction = await db.getTx(id);

        if (!transaction) {
            return NextResponse.json({
                error: 'Transaction not found'
            }, { status: 404 });
        }

        const status = await util.getTransactionStatus(transaction.tx_hash);

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
