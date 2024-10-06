import { NextResponse } from 'next/server';
import config from '@/lib/config';

export async function GET() {
  let users = config().users;
  if (!users) {
    users = []
  }
  return NextResponse.json(users);
}
