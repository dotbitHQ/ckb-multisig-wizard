import path from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { NextApiRequest, NextApiResponse } from "next";
import { NextResponse } from "next/server";
import config from '@/lib/config'
import rootLogger from '@/lib/log'
import getDb from '@/lib/database'
import * as util from '@/lib/util';

const route = '/api/upload/tx'
const logger = rootLogger.child({ route });

export async function GET(req: NextApiRequest, res: NextApiResponse) {
    logger.debug(`GET ${route}`)

    return NextResponse.json({
        response_from: route
    })
}

export async function POST(req: Request) {
    logger.debug(`POST ${route}`)

    const db = await getDb();
    const txDir = path.resolve(config().transactionsDir)

    try {
        // Check if the request contains a file
        if (!req.body) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        // Get the files from the request
        const formData = await req.formData();
        const files = formData.getAll('files') as File[];

        if (files.length <= 0) {
            return NextResponse.json({ error: "No file found in the request" }, { status: 400 });
        }

        // Calculate the directory path for the transaction JSON file
        const timestamp = new Date().toISOString().slice(0, 10);
        const dirPath = path.join(txDir, timestamp);
        await mkdir(dirPath, { recursive: true });

        const result = []

        // Process each file
        for (const file of files) {
            const filePath = path.join(dirPath, file.name);
            const fileBuffer = Buffer.from(await file.arrayBuffer());
            await writeFile(filePath, fileBuffer);

            logger.info(`New transaction json file uploaded to ${filePath}`)

            // Read json from file, try to find known multisig config in it.
            const ckb_cli_tx = JSON.parse(fileBuffer.toString())
            const multisigConfig = util.findMultisigConfigByTx(ckb_cli_tx)

            if (multisigConfig) {
                logger.info(`Found known multisig config in ${filePath}`)

                const tx_hash = util.calcTxHash(ckb_cli_tx)

                await db.replaceInsertTx({
                    id: '',
                    tx_hash,
                    signed: [],
                    threshold: 1,
                    tx_json_path: filePath,
                    uploaded_at: new Date().toISOString(),
                    pushed_at: null,
                })

                result.push({
                    name: file.name,
                    result: 'success',
                })
            } else {
                logger.info(`Can not find known multisig config in ${filePath}`)

                result.push({
                    name: file.name,
                    result: 'Can not find multisig config or the multisig config is unknown.',
                })
            }
        }

        // Return a success response
        return NextResponse.json({ result }, { status: 201 });
    } catch (error) {
        logger.error(`Failed to upload file: ${error}`);

        return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
    }
}
