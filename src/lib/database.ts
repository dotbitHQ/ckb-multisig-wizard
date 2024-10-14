import { Low } from 'lowdb';
import { JSONFilePreset } from 'lowdb/node';

import config, { MultisigConfig } from './config'

export enum MultisigType {
  Default = 'system-multisig',
  OmniLock = 'omni-lock-multisig',
  Unknown = 'unknown',
}

export interface DbSignature {
  lock_args: string,
  signature: string,
}

export interface DbTransaction {
  id: string,
  tx_hash: string,
  signed: DbSignature[],
  tx_json_path: string,
  multisig_type: MultisigType,
  multisig_config: MultisigConfig,
  digest: string,
  description: string,
  uploaded_at: string,
  pushed_at: string | null,
  committed_at: string | null,
  rejected_at: string | null,
  reject_reason: string | null,
}

export interface Schema {
  next_tx_id: number,
  tx: DbTransaction[],
}

export class Database {
  private db: Low<Schema>;

  static async init() {
    const defaultData = {
      next_tx_id: 1,
      tx: []
    }

    const db = await JSONFilePreset<Schema>(config().database, defaultData);
    await db.read()
    return new Database(db)
  }

  private constructor(db: Low<Schema>) {
    this.db = db
  }

  async getTx(id: string): Promise<DbTransaction | undefined> {
    await this.db.read()
    return this.db.data.tx.find(transaction => transaction.id === id);
  }

  async getAllTx(): Promise<DbTransaction[]> {
    await this.db.read()
    return this.db.data.tx;
  }

  async replaceInsertTx(tx: DbTransaction): Promise<DbTransaction> {
    const existingTxIndex = this.db.data.tx.findIndex(transaction => transaction.tx_json_path === tx.tx_json_path);
    if (existingTxIndex !== -1) {
      const existingTx = this.db.data.tx[existingTxIndex]
      tx.id = existingTx.id
      this.db.data.tx[existingTxIndex] = tx;
    } else {
      tx.id = `tx-${this.db.data.next_tx_id}`;
      this.db.data.next_tx_id += 1;
      this.db.data.tx.push(tx);
    }
    await this.db.write();
    return tx;
  }

  async updateTx(updatedTx: DbTransaction): Promise<boolean> {
    const index = this.db.data.tx.findIndex(tx => tx.id === updatedTx.id);
    if (index !== -1) {
      this.db.data.tx[index] = updatedTx;
      await this.db.write();
      return true;
    }
    return false;
  }
}

let db: Database;
export default async function getDb() {
  if (!db) {
    db = await Database.init()
  }

  return db
}
