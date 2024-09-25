import { MultisigConfig } from "@/lib/config";
import config from "@/lib/config";
import { rawTransactionToHash } from '@nervosnetwork/ckb-sdk-utils';
import { ckbRpc } from './ckb'

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

    console.log('multisigConfigs:', multisigConfigs)

    for (let [key, _] of Object.entries(ckb_cli_tx.multisig_configs)) {
        key = `${multisigCodeHash}-${key}`

        console.log('key:', key)
        console.log('multisigConfigs[key]:', multisigConfigs[key])

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
