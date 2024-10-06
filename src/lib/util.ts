import { systemScripts } from '@nervosnetwork/ckb-sdk-utils';
import { scriptToAddress as ckbScriptToAddress } from '@nervosnetwork/ckb-sdk-utils'

export function lockArgsToAddress(lockArgs: string, env: string = 'mainnet'): string {
    const script = {
        codeHash: systemScripts.SECP256K1_BLAKE160.codeHash,
        hashType: 'type' as CKBComponents.ScriptHashType,
        args: lockArgs,
    }
    const address = ckbScriptToAddress(script, env === 'mainnet' ? true : false)

    return address
}
