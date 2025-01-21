import config from 'config'

console.log(`NEXT_PUBLIC_ENV is ${process.env.NEXT_PUBLIC_ENV}, so loading config for ${process.env.NEXT_PUBLIC_ENV} env. `)

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverRuntimeConfig: {
    ckbNodeRpc: config.ckbNodeRpc,
    larkApiKey: config.larkApiKey,

    database: config.database,
    transactionsDir: config.transactionsDir,

    ckbCliBin: config.ckbCliBin,
    toolboxCliBin: config.toolboxCliBin,

    loglevel: config.loglevel,
    env: config.env,

    multisigScript: config.multisigScript,
    users: config.users,
    multisigConfigs: config.multisigConfigs,
  },
  publicRuntimeConfig: {
    env: config.env,

    users: config.users,
  },
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
};

export default nextConfig;
