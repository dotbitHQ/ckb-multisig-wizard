import getConfig from 'next/config'

export interface MultisigScript {
  name: string,
  typeId: string,
}

export interface User {
  name: string,
  pubKeyHash: string,
}

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

  multisigScript: MultisigScript[]
  users: User[]
  multisigConfigs: MultisigConfig[]
}

export default function config(): Config {
  console.log(`NODE_CONFIG_ENV is ${process.env.NODE_CONFIG_ENV}, so loading config for ${process.env.NODE_CONFIG_ENV} env. `)

  const { serverRuntimeConfig } = getConfig()
  return serverRuntimeConfig
}
