import { MultisigConfig } from "@/lib/config";
import config from "@/lib/config";
import { rawTransactionToHash, systemScripts } from '@nervosnetwork/ckb-sdk-utils';
import { scriptToAddress as ckbScriptToAddress } from '@nervosnetwork/ckb-sdk-utils'
import { ckbRpc } from './ckb'
import { execSync } from "child_process";
import rootLogger from '@/lib/log'

const logger = rootLogger.child({ route: 'util' });

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

export function calcTxDescription(env: string, tx_file_path: string): string {
    const bin = config().toolboxCliBin;

    const cmd = `${bin} sandbox ${env === 'mainnet' ? '' : '-t'} -p ${tx_file_path}`;
    logger.debug(`Execute command: ${cmd}`)
    const result = execSync(cmd, { cwd: process.cwd() });

    return result.toString();
}

export function calcTxDigest(address: string, tx_file_path: string): string {
    const bin = config().toolboxCliBin;

    const cmd = `${bin} tx get-digest --format ckb-cli -a ${address} -t ${tx_file_path}`;
    logger.debug(`Execute command: ${cmd}`)
    const result = execSync(cmd, { cwd: process.cwd() });

    return result.toString();
}

export function scriptToAddress(script: RPC.Script, env: string = 'mainnet'): string {
    const resultScript = ckbRpc.resultFormatter.toScript(script)
    const address = ckbScriptToAddress(resultScript, env === 'mainnet' ? true : false)

    return address
}

export function pushTransactionByCkbCli(tx_file_path: string): string {
    const bin = config().ckbCliBin;

    const cmd = `${bin} tx send --skip-check --local-only --tx-file ${tx_file_path}`;
    logger.debug(`Execute command: ${cmd}`)
    const result = execSync(cmd, { cwd: process.cwd() });

    return result.toString();
}

export async function getTransactionStatus(tx_hash: string): Promise<CKBComponents.TransactionStatus | string> {
    const result = await ckbRpc.getTransaction(tx_hash)
    return result.txStatus.status
}
