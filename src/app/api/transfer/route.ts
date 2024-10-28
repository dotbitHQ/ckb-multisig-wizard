import path from 'path';
import { mkdir } from 'fs/promises';
import { NextRequest, NextResponse } from "next/server";
import config, { User } from '@/lib/config'
import rootLogger from '@/lib/log'
import getDb, { Database, } from '@/lib/database'
import * as serverUtil from '@/lib/server-util';
import * as util from '@/lib/util';
import { getSignInUser, validateSignInStatus } from '@/lib/server-auth';
import fs from 'fs';

const route = '/api/upload/file'
const logger = rootLogger.child({ route });

const MAX_VALUE = BigInt('1000000000'); // 1_000_000_000
const MAX_FEE = BigInt('10000000000'); // 10_000_000_000

export async function POST (req: NextRequest) {
  logger.debug(`POST ${route}`)
  const res = validateSignInStatus(req);
  if (res) {
    return res;
  }

  let data;
  try {
    data = await req.json();

    logger.info(`Received new transfer request: ${JSON.stringify(data)}`)

    if (!serverUtil.isValidAddress(data.from)) {
      return NextResponse.json({ error: 'Invalid from address' }, { status: 400 });
    }
    if (!serverUtil.isValidAddress(data.to)) {
      return NextResponse.json({ error: 'Invalid to address' }, { status: 400 });
    }
    const value = BigInt(data.value);
    if (value <= 0 || value > MAX_VALUE) {
      return NextResponse.json({ error: `The value must be a number between 0 and ${MAX_VALUE}` }, { status: 400 });
    }
    const fee = BigInt(data.fee);
    if (fee <= 0 || fee > MAX_FEE) {
      return NextResponse.json({ error: `The fee must be a number between 0 and ${MAX_FEE}` }, { status: 400 });
    }
  } catch (error) {
    logger.error(`Parsing request body failed: ${error}`);
    return NextResponse.json({ error: `Parsing request body failed: ${error}` }, { status: 400 });
  }

  let db, dirPath;

  try {
    db = await getDb();
  } catch (error) {
    logger.error(`Loading database failed: ${error}`);
    return NextResponse.json({ error: `Loading database failed: ${error}` }, { status: 500 });
  }

  try {
    const txDir = path.resolve(config().transactionsDir)
    dirPath = path.join(txDir, util.dateToDir());
    await mkdir(dirPath, { recursive: true });
  } catch (error) {
    logger.error(`Creating transaction directory failed: ${error}`);
    return NextResponse.json({ error: `Creating transaction directory failed: ${error}` }, { status: 500 });
  }

  let filePath;
  for (let i = 1; i < 1000; i++) {
    filePath = path.join(dirPath, `tx-${i}.json`);
    if (!fs.existsSync(filePath)) {
      break;
    }
  }
  if (!filePath) {
    return NextResponse.json({ error: 'Too many transactions, please clean database first.' }, { status: 400 });
  }

  const user = getSignInUser();
  try {
    const { from, to, value, fee } = data;

    const { stderr: transferError } = serverUtil.createTransferTx(from, to, value, fee, filePath)
    if (transferError) {
      logger.error(`Creating transfer transaction failed: ${transferError}`);
      return NextResponse.json({ error: `Creating transfer transaction failed: ${transferError}` }, { status: 500 });
    }

    const ckbCliTx = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const txHash = serverUtil.calcTxHash(ckbCliTx);

    logger.info(`Created new transfer transaction: ${txHash} at ${filePath}`)

    const existingTx = await db.getTxByTxHash(txHash)
    if (existingTx) {
      fs.unlinkSync(filePath);
      return NextResponse.json({ error: `Transaction is existed at ${existingTx.tx_json_path.split('/').slice(-2).join('/')}.` }, { status: 400 });
    }

    await writeTxToDb(db, txHash, filePath, user)

    // Return a success response
    return NextResponse.json({
      name: filePath.split('/').slice(-1)[0],
      result: 'Successfully created transaction.',
    }, { status: 201 });
  } catch (error) {
    logger.error(`Parse transaction JSON failed: ${error}`);

    return NextResponse.json({ error: `Parse transaction JSON failed: ${error}` }, { status: 500 });
  }
}

async function writeTxToDb(db: Database, txHash: string, filePath: string, user: User) {
  const ckbCliTx = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const multisigConfig = serverUtil.findMultisigConfigByTx(ckbCliTx)
  if (!multisigConfig) {
    logger.error(`Can not find known multisig config in ${filePath}`)
    throw new Error('Can not find known multisig config in transaction JSON.')
  }

  const { stdout: description, stderr: descriptionError } = serverUtil.calcTxDescription(config().env, filePath)
  if (descriptionError) {
    logger.error(`Failed to calculate transaction description: ${descriptionError}`);
    throw new Error(descriptionError);
  }

  // Convert multisigConfig.script to ckb address
  const address = serverUtil.scriptToAddress(multisigConfig.script, config().env)
  const { stdout: digest, stderr: digestError } = serverUtil.calcTxDigest(address, filePath)
  if (digestError) {
    logger.error(`Failed to calculate transaction digest: ${digestError}`);
    throw new Error(digestError);
  }

  const multisigType = serverUtil.getMultisigScriptTypeByTypeId(multisigConfig.script.code_hash)

  await db.replaceInsertTx({
    id: '',
    tx_hash: txHash,
    signed: [],
    tx_json_path: filePath,
    multisig_type: multisigType,
    multisig_config: multisigConfig,
    digest,
    description,
    uploaded_by: user.name === 'Unknown' ? user.pubKeyHash : user.name,
    uploaded_at: new Date().toISOString(),
    pushed_at: null,
    committed_at: null,
    rejected_at: null,
    reject_reason: null,
  })
}
