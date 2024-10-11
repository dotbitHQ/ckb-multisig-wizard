import 'server-only'

import config, { User } from '@/lib/config'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

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

export function signIn (pubKeyHash: string): void {
  cookies().set('pubKeyHash', pubKeyHash)
}

export function signOut (): void {
  cookies().delete('pubKeyHash')
}

export function validateSignInStatus (_request: NextRequest): NextResponse | null {
  const pubKeyHash = cookies().get('pubKeyHash')?.value;

  if (!pubKeyHash) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = getCurrentUser()
  if (!user) {
    cookies().delete('pubKeyHash');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return null
}
