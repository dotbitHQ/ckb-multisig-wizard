import getDb from "@/lib/database";
import rootLogger from "@/lib/log";
import { NextRequest, NextResponse } from "next/server";

const route = '/api/tx'
const logger = rootLogger.child({ route });

export async function GET(_: NextRequest) {
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
