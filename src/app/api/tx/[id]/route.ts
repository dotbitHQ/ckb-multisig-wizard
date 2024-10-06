import getDb from "@/lib/database";
import rootLogger from "@/lib/log";
import { NextRequest, NextResponse } from "next/server";

const route = '/api/tx/[id]'
const logger = rootLogger.child({ route });

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const { id } = params;
    logger.debug(`GET ${route} id: ${id}`);

    try {
        const db = await getDb();
        const tx = await db.getTx(id);
        if (!tx) {
            return NextResponse.json({
                error: 'Transaction not found'
            }, { status: 404 });
        }

        return NextResponse.json({ result: tx }, { status: 200 });
    } catch (error) {
        logger.error('Error getting transaction:', error);
        return NextResponse.json({
            error: 'Failed to get transaction'
        }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    const { id } = params;
    logger.debug(`PUT ${route} id: ${id}`);

    try {
        const db = await getDb();
        const updatedTx = await req.json();

        // Ensure the ID in the URL matches the ID in the request body
        if (updatedTx.id !== id) {
            return NextResponse.json({
                error: 'Transaction ID in the URL does not match the ID in the request body'
            }, { status: 400 });
        }

        const success = await db.updateTx(updatedTx);

        if (success) {
            return NextResponse.json({
                result: 'Transaction updated successfully'
            }, { status: 200 });
        } else {
            return NextResponse.json({
                error: 'Transaction not found'
            }, { status: 404 });
        }

    } catch (error) {
        logger.error('Error updating transaction:', error);

        return NextResponse.json({
            error: 'Failed to update transaction'
        }, { status: 500 });
    }
}
