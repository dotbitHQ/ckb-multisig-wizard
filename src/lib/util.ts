import { systemScripts } from '@nervosnetwork/ckb-sdk-utils';
import { scriptToAddress as ckbScriptToAddress } from '@nervosnetwork/ckb-sdk-utils'
import { formatInTimeZone } from 'date-fns-tz';
import { ReadonlyURLSearchParams } from 'next/navigation';

export function dateToDir(date: string): string {
  const txDate = new Date(date);
  const dir = formatInTimeZone(txDate, 'UTC', 'yyyy-MM-dd');
  return dir;
}

export function lockArgsToAddress(lockArgs: string, env: string = 'mainnet'): string {
  const script = {
    codeHash: systemScripts.SECP256K1_BLAKE160.codeHash,
    hashType: 'type' as CKBComponents.ScriptHashType,
    args: lockArgs,
  }
  const address = ckbScriptToAddress(script, env === 'mainnet' ? true : false)

  return address
}

export function isObjectEqual(obj1: any, obj2: any) {
  if (obj1 === obj2) return true;
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object' || obj1 == null || obj2 == null) return false;
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  if (keys1.length !== keys2.length) return false;
  for (const key of keys1) {
    if (!keys2.includes(key) || !isObjectEqual(obj1[key], obj2[key])) return false;
  }
  return true;
}

export function setSearchParams(searchParams: ReadonlyURLSearchParams, key: string, value: string) {
  const params = new URLSearchParams(searchParams.toString())
  params.set(key, value)

  return params.toString()
}

export function delSearchParams(searchParams: ReadonlyURLSearchParams, key: string) {
  const params = new URLSearchParams(searchParams.toString())
  params.delete(key)

  return params.toString()
}
