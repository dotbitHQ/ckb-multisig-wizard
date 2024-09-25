interface TxHelper {
    transaction: RPC.RawTransaction; // Assuming TransactionView is defined elsewhere
    multisig_configs: Record<string, MultisigConfig>; // H160 can be represented as a string
    signatures: Map<string, Set<string>>; // Bytes can be represented as a string
}

interface MultisigConfig {
    sighash_addresses: string[]; // H160 can be represented as a string
    require_first_n: number; // u8 can be represented as a number
    threshold: number; // u8 can be represented as a number
}
