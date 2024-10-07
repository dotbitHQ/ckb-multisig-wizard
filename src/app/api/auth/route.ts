import { NextRequest, NextResponse } from 'next/server';
import config from '@/lib/config';
import { cookies } from 'next/headers';
import rootLogger from '@/lib/log';

const route = '/api/auth';
const logger = rootLogger.child({ route: '/api/auth' });

export async function POST(request: NextRequest) {
  logger.debug(`POST ${route}`)

  const verifyOnly = request.nextUrl.searchParams.get('verify') === 'true';
  const { pubKeyHash } = await request.json();
  const users = config().users.map(user => user.pubKeyHash);


  if (!users.includes(pubKeyHash)) {
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
  }

  return NextResponse.json({ result: true });
}
