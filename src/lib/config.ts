import getConfig from 'next/config'

export interface MultisigConfig {
  script: {
    code_hash: string,
    hash_type: 'type',
    args: string,
  },
  config: {
    sighash_addresses: string[],
    require_first_n: number,
    threshold: number,
  }
}

export interface Config {
  ckbNodeRpc: string,
  larkApiKey: string,

  database: string,
  transactionsDir: string,

  ckbCliBin: string,
  toolboxCliBin: string,

  env: string,
  loglevel: string,

  multisigConfigs: MultisigConfig[]
}

export default function config(): Config {
  const { serverRuntimeConfig, _ } = getConfig()
  return serverRuntimeConfig
}
