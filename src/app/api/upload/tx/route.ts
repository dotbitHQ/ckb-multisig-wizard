import path from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { NextRequest, NextResponse } from "next/server";
import config, { MultisigConfig } from '@/lib/config'
import rootLogger from '@/lib/log'
import getDb, { Database, } from '@/lib/database'
import * as util from '@/lib/server-util';
import { formatInTimeZone } from 'date-fns-tz';
import { validateSignInStatus } from '@/lib/server-auth';
import fs from 'fs';

const route = '/api/upload/file'
const logger = rootLogger.child({ route });

export async function POST (req: NextRequest) {
  logger.debug(`POST ${route}`)
  const res = validateSignInStatus(req);
  if (res) {
    return res;
  }

  const db = await getDb();
  const txDir = path.resolve(config().transactionsDir)

  try {
    const contentType = req.headers.get('content-type');
    let files: File[] = [];
    let jsonContent: string | null = null;

    if (contentType?.includes('multipart/form-data')) {
      const formData = await req.formData();
      files = formData.getAll('files') as File[];
    } else if (contentType?.includes('application/json')) {
      const body = await req.json();
      jsonContent = body.jsonContent;
    }

    if (files.length === 0 && !jsonContent) {
      return NextResponse.json({ error: "No file or JSON content found in the request" }, { status: 400 });
    }

    const date = formatInTimeZone(new Date(), 'UTC', 'yyyy-MM-dd');
    const dirPath = path.join(txDir, date);
    await mkdir(dirPath, { recursive: true });

    const result = []

    if (jsonContent) {
      // Process JSON content
      const ckb_cli_tx = JSON.parse(jsonContent);

      let writeToDb = true
      if (!util.validateTxFormat(ckb_cli_tx)) {
        result.push({
          name: 'Transaction JSON',
          result: 'Invalid transaction data, only ckb-cli format is supported.',
        })
        writeToDb = false
      }

      const tx_hash = util.calcTxHash(ckb_cli_tx)
      const existingTx = await db.getTxByTxHash(tx_hash)
      if (existingTx) {
        result.push({
          name: 'Transaction JSON',
          result: `Transaction already uploaded to ${existingTx.tx_json_path.split('/').slice(-2).join('/')}.`,
        })
        writeToDb = false
      }

      if (writeToDb) {
        const fileName = `${tx_hash}.json`;
        const filePath = path.join(dirPath, fileName);

        await writeFile(filePath, jsonContent);

        logger.info(`New transaction JSON content uploaded to ${filePath}`)

        const multisigConfig = util.findMultisigConfigByTx(ckb_cli_tx)

        if (multisigConfig) {
          logger.info(`Found known multisig config in ${filePath}`)

          await writeTxToDb(db, ckb_cli_tx, filePath, multisigConfig)

          result.push({
            name: tx_hash,
            result: 'success',
          })
        } else {
          logger.info(`Can not find known multisig config in ${filePath}`)

          result.push({
            name: fileName,
            result: 'Can not find multisig config or the multisig config is unknown.',
          })
        }
      }
    } else {
      // Process files
      for (const file of files) {
        const fileBuffer = Buffer.from(await file.arrayBuffer());
        const ckb_cli_tx = JSON.parse(fileBuffer.toString());

        const tx_hash = util.calcTxHash(ckb_cli_tx)
        const existingTx = await db.getTxByTxHash(tx_hash)
        if (existingTx) {
          result.push({
            name: file.name,
            result: `Transaction already uploaded to ${existingTx.tx_json_path.split('/').slice(-2).join('/')}.`,
          })
          continue
        }

        const filePath = path.join(dirPath, file.name);

        if (!util.validateTxFormat(ckb_cli_tx)) {
          result.push({
            name: file.name,
            result: 'Invalid transaction data, only ckb-cli format is supported.',
          })
          continue;
        }

        await writeFile(filePath, fileBuffer);

        logger.info(`New transaction json file uploaded to ${filePath}`)

        // Read json from file, try to find known multisig config in it.
        const multisigConfig = util.findMultisigConfigByTx(ckb_cli_tx)

        if (multisigConfig) {
          logger.info(`Found known multisig config in ${filePath}`)

          await writeTxToDb(db, ckb_cli_tx, filePath, multisigConfig)

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
    }

    // Return a success response
    return NextResponse.json({ result }, { status: 201 });
  } catch (error) {
    logger.error(`${error}`);

    return NextResponse.json({ error:`${error}` }, { status: 500 });
  }
}

async function writeTxToDb(db: Database, ckb_cli_tx: TxHelper, filePath: string, multisigConfig: MultisigConfig) {
  const tx_hash = util.calcTxHash(ckb_cli_tx)
  // Convert multisigConfig.script to ckb address
  const address = util.scriptToAddress(multisigConfig.script, config().env)

  const { stdout: description, stderr: descriptionError } = util.calcTxDescription(process.env.NEXT_PUBLIC_ENV!, filePath)
  if (descriptionError) {
    logger.error(`Failed to calculate transaction description: ${descriptionError}`);
    throw new Error(descriptionError);
  }

  const { stdout: digest, stderr: digestError } = util.calcTxDigest(address, filePath)
  if (digestError) {
    logger.error(`Failed to calculate transaction digest: ${digestError}`);
    throw new Error(digestError);
  }

  const multisigType = util.getMultisigScriptTypeByTypeId(multisigConfig.script.code_hash)

  await db.replaceInsertTx({
    id: '',
    tx_hash,
    signed: [],
    tx_json_path: filePath,
    multisig_type: multisigType,
    multisig_config: multisigConfig,
    digest,
    description,
    uploaded_at: new Date().toISOString(),
    pushed_at: null,
    committed_at: null,
    rejected_at: null,
    reject_reason: null,
  })
}
