import { NextRequest, NextResponse } from 'next/server';
import config from '@/lib/config';
import { validateSignInStatus } from '@/lib/server-auth';
import rootLogger from '@/lib/log';

const route = '/api/user'
const logger = rootLogger.child({ route });

export async function GET(req: NextRequest) {
  logger.debug(`GET ${route}`);
  const res = validateSignInStatus(req);
  if (res) {
    return res;
  }

  let users = config().users;
  if (!users) {
    users = []
  }
  return NextResponse.json(users);
}
