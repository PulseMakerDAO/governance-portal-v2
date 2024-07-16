/*

SPDX-FileCopyrightText: © 2023 Dai Foundation <www.daifoundation.org>

SPDX-License-Identifier: AGPL-3.0-or-later

*/

import { SupportedNetworks } from 'modules/web3/constants/networks';
import { formatValue } from 'lib/string';
import { DelegateContractInformation } from '../types';
import { gqlRequest } from 'modules/gql/gqlRequest';
import { allDelegates } from 'modules/gql/queries/subgraph/allDelegates';
import { networkNameToChainId } from 'modules/web3/helpers/chain';
import { BigNumber } from 'ethers';

export async function fetchChainDelegates(
  network: SupportedNetworks
): Promise<DelegateContractInformation[]> {
  const chainId = networkNameToChainId(network);
  const data = await gqlRequest({ 
    chainId,
    useSubgraph: true,
    query: allDelegates
  });

  return data.delegates.map(d => {
    return {
      blockTimestamp: d.blockTimestamp,
      address: d.ownerAddress,
      voteDelegateAddress: d.id,
      mkrDelegated: formatValue(BigNumber.from(d.totalDelegated), 'wad', 18, false),
      version: d.version,
      lastVoteDate: Number(d.voter.lastVotedTimestamp)
    }
  });
}
