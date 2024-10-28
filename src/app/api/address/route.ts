import { NextRequest, NextResponse } from 'next/server';
import config from '@/lib/config';
import { validateSignInStatus } from '@/lib/server-auth';
import rootLogger from '@/lib/log';
import * as util from '@/lib/util';

const route = '/api/address'
const logger = rootLogger.child({ route });

export async function GET(req: NextRequest) {
  logger.debug(`GET ${route}`);
  const res = validateSignInStatus(req);
  if (res) {
    return res;
  }

  const addresses = config().multisigConfigs.map(item => {
    return util.scriptToAddress(item.script, config().env)
  });

  return NextResponse.json({ result: addresses });
}
