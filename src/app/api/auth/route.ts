import { NextRequest, NextResponse } from 'next/server';
import config from '@/lib/config';
import { cookies } from 'next/headers';
import rootLogger from '@/lib/log';

const route = '/api/auth'
const logger = rootLogger.child({ route });

export async function POST(request: NextRequest) {
  logger.debug(`POST ${route}`);

  const verifyOnly = request.nextUrl.searchParams.get('verify') === 'true';
  const { pubKeyHash } = await request.json();
  const user = config().users.find(user => user.pubKeyHash === pubKeyHash);

  if (!user) {
    logger.warn(`User ${pubKeyHash} not found`);

    return NextResponse.json({ error: 'User not found' }, { status: 401 });
  }

  if (verifyOnly) {
    logger.debug(`User ${pubKeyHash} is verified ...`);
    // Do nothing
  } else {
    logger.info(`User ${pubKeyHash} is trying to sign in ...`);

    cookies().set('pubKeyHash', pubKeyHash, {
      secure: true,
      sameSite: 'strict',
      maxAge: 86400, // 24 hours
      path: '/',
      priority: 'high'
    });
    cookies().set('userName', user.name, {
      secure: true,
      sameSite: 'strict',
      maxAge: 86400, // 24 hours
      path: '/',
      priority: 'high'
    });
  }

  return NextResponse.json({ result: true });
}
