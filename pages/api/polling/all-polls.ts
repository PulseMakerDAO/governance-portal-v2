import invariant from 'tiny-invariant';
import { NextApiRequest, NextApiResponse } from 'next';

import { parsePollsMetadata } from 'modules/polls/api/parsePollMetadata';
import getMaker, { isSupportedNetwork } from 'lib/maker';
import { DEFAULT_NETWORK } from 'lib/constants';
import withApiHandler from 'lib/api/withApiHandler';

export default withApiHandler(async (req: NextApiRequest, res: NextApiResponse) => {
  const network = (req.query.network as string) || DEFAULT_NETWORK;
  invariant(isSupportedNetwork(network), `unsupported network ${network}`);

  const maker = await getMaker(network);
  const pollList = await maker.service('govPolling').getAllWhitelistedPolls();
  const polls = await parsePollsMetadata(pollList);

  res.setHeader('Cache-Control', 's-maxage=15, stale-while-revalidate');
  res.status(200).json(polls);
});
