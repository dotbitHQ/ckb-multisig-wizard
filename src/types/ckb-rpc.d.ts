/**
 * @see https://github.com/nervosnetwork/ckb/blob/develop/util/jsonrpc-types/src/blockchain.rs
 */

/* eslint-disable camelcase */

declare namespace RPC {
  export type ProposalShortId = CKBComponents.ProposalShortId
  export type Number = CKBComponents.Number
  export type UInt32 = CKBComponents.UInt32
  export type Count = CKBComponents.Count
  export type DAO = CKBComponents.DAO
  export type Hash = CKBComponents.Hash
  export type Hash256 = CKBComponents.Hash256
  export type Version = CKBComponents.Version
  export type Capacity = CKBComponents.Capacity
  export type Witness = CKBComponents.Witness
  export type Bytes = CKBComponents.Bytes
  export type Index = CKBComponents.Index
  export type Since = CKBComponents.Since
  export type Timestamp = CKBComponents.Timestamp
  export type BlockNumber = CKBComponents.BlockNumber
  export type EpochInHeader = string
  export type Difficulty = CKBComponents.Difficulty
  export type Cycles = CKBComponents.Cycles
  export type Size = CKBComponents.Size
  export type RationalU256 = CKBComponents.RationalU256
  export type ProposalWindow = CKBComponents.ProposalWindow
  export type EpochNumberWithFraction = CKBComponents.EpochNumberWithFraction
  export type JsonBytes = CKBComponents.JsonBytes

  enum TransactionStatus {
    Pending = 'pending',
    Proposed = 'proposed',
    Committed = 'committed',
  }

  export type ScriptHashType = CKBComponents.ScriptHashType

  export type DepType = 'code' | 'dep_group'

  export interface Script {
    args: Bytes
    code_hash: Hash256
    hash_type: ScriptHashType
  }

  export interface OutPoint {
    tx_hash: Hash256
    index: Index
  }

  export interface CellInput {
    previous_output: OutPoint | null
    since: Since
  }

  export interface CellOutput {
    capacity: Capacity
    lock: Script
    type?: Script | null
  }

  export type Cell = CellOutput

  export interface LiveCell {
    data?: {
      content: Hash
      hash: Hash256
    }
    output: CellOutput
  }

  export interface CellDep {
    out_point: OutPoint | null
    dep_type: DepType
  }

  export interface CellIncludingOutPoint {
    block_hash: Hash256
    capacity: Capacity
    lock: Script
    out_point: OutPoint | null
    cellbase: boolean
    output_data_len: string
  }

  export interface RawTransaction {
    version: Version
    cell_deps: CellDep[]
    header_deps: Hash256[]
    inputs: CellInput[]
    outputs: CellOutput[]
    witnesses: Witness[]
    outputs_data: Bytes[]
  }

  export interface Transaction extends RawTransaction {
    hash: Hash256
  }
}
/* eslint-enable camelcase */
