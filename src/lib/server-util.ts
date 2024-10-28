import 'server-only'

import { MultisigConfig } from "@/lib/config";
import config from "@/lib/config";
import { rawTransactionToHash } from '@nervosnetwork/ckb-sdk-utils';
import { scriptToAddress as ckbScriptToAddress, addressToScript } from '@nervosnetwork/ckb-sdk-utils'
import { ckbRpc } from './ckb'
import { execSync } from "child_process";
import rootLogger from '@/lib/log'
import { MultisigType } from "./database";
import { ExecSyncOptionsWithStringEncoding } from 'child_process';

const logger = rootLogger.child({ route: 'util' });

function executeCommand(cmd: string): { stdout: string; stderr: string } {
  try {
    const options: ExecSyncOptionsWithStringEncoding = {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    };
    const stdout = execSync(cmd, options);

    if (!stdout || stdout.toString().length === 0) {
      logger.warn(`Empty stdout of command: ${cmd}`);
    }

    return { stdout: stdout.toString(), stderr: '' };
  } catch (error) {
    if (error instanceof Error && 'stderr' in error) {
      return {
        stdout: '',
        stderr: (error as any).stderr.toString()
      };
    }
    throw error;
  }
}

export function validateTxFormat(ckb_cli_tx: TxHelper): boolean {
  return !!ckb_cli_tx.multisig_configs && !!ckb_cli_tx.transaction
}

export function findMultisigConfigByTx(ckb_cli_tx: TxHelper): MultisigConfig | null {
  const multisigConfigs: Record<string, MultisigConfig> = {}

  // TODO Support more multisig lock
  let multisigCodeHash = ''

  config().multisigConfigs.forEach(multisigConfig => {
    const key = `${multisigConfig.script.code_hash}-${multisigConfig.script.args}`
    multisigConfigs[key] = multisigConfig

    if (multisigCodeHash === '') {
      multisigCodeHash = multisigConfig.script.code_hash
    }
  })

  for (let [key,] of Object.entries(ckb_cli_tx.multisig_configs)) {
    key = `${multisigCodeHash}-${key}`

    if (multisigConfigs[key]) {
      return multisigConfigs[key];
    }
  }

  return null
}

export function calcTxHash(ckb_cli_tx: TxHelper): string {
  const tx = ckbRpc.resultFormatter.toTransaction(ckb_cli_tx.transaction);
  const txHash = rawTransactionToHash(tx);

  return txHash;
}

export function calcTxDescription(env: string, tx_file_path: string): { stdout: string; stderr: string } {
  const bin = config().toolboxCliBin;
  const cmd = `${bin} sandbox ${env === 'mainnet' ? '' : '-t'} -p ${tx_file_path}`;
  logger.debug(`Execute command: ${cmd}`);
  return executeCommand(cmd);
}

export function calcTxDigest(address: string, tx_file_path: string): { stdout: string; stderr: string } {
  const bin = config().toolboxCliBin;
  const cmd = `${bin} tx get-digest --format ckb-cli -a ${address} -t ${tx_file_path}`;
  logger.debug(`Execute command: ${cmd}`);
  return executeCommand(cmd);
}

export function createTransferTx(from: string, to: string, value: number, fee: number, tx_file_path: string): { stdout: string; stderr: string } {
  const bin = config().toolboxCliBin;
  const cmd = `${bin} push transfer --format ckb-cli --from ${from} --to ${to} -v ${value} -f ${fee} -F ${tx_file_path} .`;
  logger.debug(`Execute command: ${cmd}`);

  return executeCommand(cmd);
}

export function isValidAddress(address: string): boolean {
  try {
    addressToScript(address)
    return true
  } catch (error) {
    return false
  }
}

export function scriptToAddress(script: RPC.Script, env: string = 'mainnet'): string {
  const resultScript = ckbRpc.resultFormatter.toScript(script)
  const address = ckbScriptToAddress(resultScript, env === 'mainnet' ? true : false)

  return address
}

export function pushTransactionByCkbCli(tx_file_path: string): { stdout: string; stderr: string } {
  const bin = config().ckbCliBin;
  const cmd = `${bin} tx send --skip-check --local-only --tx-file ${tx_file_path}`;
  logger.debug(`Execute command: ${cmd}`);
  return executeCommand(cmd);
}

export async function getTransactionStatus(tx_hash: string): Promise<{ status: CKBComponents.TransactionStatus | string, committed_at: Date | null }> {
  const result = await ckbRpc.getTransaction(tx_hash)
  if (result.txStatus.status === 'committed') {
    const block = await ckbRpc.getBlock(result.txStatus.blockHash)
    const timestamp = parseInt(block.header.timestamp, 16);
    return {
      status: result.txStatus.status,
      committed_at: new Date(timestamp)
    }
  } else {
    return {
      status: result.txStatus.status,
      committed_at: null
    }
  }
}

export function getMultisigScriptTypeByTypeId(typeId: string): MultisigType {
  const multisigScript = config().multisigScript.find(script => script.typeId === typeId)

  if (!multisigScript) {
    return MultisigType.Unknown
  }

  return multisigScript.name as MultisigType
}
