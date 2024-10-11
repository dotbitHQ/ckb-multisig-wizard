import config, { User } from '@/lib/config'
import { cookies } from 'next/headers'

export function isUserExist (pubKeyHash: string): boolean {
  return config().users.some(user => user.pubKeyHash === pubKeyHash)
}

export function getCurrentUser(): User | null {
  const pubKeyHash = cookies().get('pubKeyHash')?.value
  if (!pubKeyHash) {
    return null
  }

  const user = config().users.find(user => user.pubKeyHash === pubKeyHash)
  return user ? user : null
}
