import CKBRPC from '@nervosnetwork/ckb-sdk-rpc'
import config from '@/lib/config'

export const ckbRpc = new CKBRPC(config().ckbNodeRpc)
