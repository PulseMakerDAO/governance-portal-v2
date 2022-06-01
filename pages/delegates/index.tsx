import { useMemo } from 'react';
import { Heading, Box, Flex, Card, Text, Button } from 'theme-ui';
import { GetStaticProps } from 'next';
import ErrorPage from 'next/error';
import { BigNumber as BigNumberJS } from 'bignumber.js';
import shallow from 'zustand/shallow';
import useSWR, { useSWRConfig } from 'swr';
import useDelegatesFiltersStore, { delegatesSortEnum } from 'modules/delegates/stores/delegatesFiltersStore';
import { isDefaultNetwork } from 'modules/web3/helpers/networks';
import { DelegateStatusEnum } from 'modules/delegates/delegates.constants';
import PrimaryLayout from 'modules/app/components/layout/layouts/Primary';
import SidebarLayout from 'modules/app/components/layout/layouts/Sidebar';
import Stack from 'modules/app/components/layout/layouts/Stack';
import ResourceBox from 'modules/app/components/ResourceBox';
import { DelegateOverviewCard } from 'modules/delegates/components';
import PageLoadingPlaceholder from 'modules/app/components/PageLoadingPlaceholder';
import { HeadComponent } from 'modules/app/components/layout/Head';
import { DelegatesSystemInfo } from 'modules/delegates/components/DelegatesSystemInfo';
import DelegatesFilter from 'modules/delegates/components/filters/DelegatesFilter';
import DelegatesSort from 'modules/delegates/components/filters/DelegatesSort';
import { filterDelegates } from 'modules/delegates/helpers/filterDelegates';
import { useAccount } from 'modules/app/hooks/useAccount';
import { useActiveWeb3React } from 'modules/web3/hooks/useActiveWeb3React';
import { ErrorBoundary } from 'modules/app/components/ErrorBoundary';
import { InternalLink } from 'modules/app/components/InternalLink';
import { DelegatesPageData, fetchDelegatesPageData } from 'modules/delegates/api/fetchDelegatesPageData';
import { SupportedNetworks } from 'modules/web3/constants/networks';
import { SearchBar } from 'modules/app/components/filters/SearchBar';
import { DelegatesTagFilter } from 'modules/delegates/components/filters/DelegatesTagFilter';

const Delegates = ({ delegates, stats, tags }: DelegatesPageData) => {
  const [showRecognized, showShadow, sort, name, delegateTags, setName, resetFilters] =
    useDelegatesFiltersStore(
      state => [
        state.filters.showRecognized,
        state.filters.showShadow,
        state.sort,
        state.filters.name,
        state.filters.tags,
        state.setName,
        state.resetFilters
      ],
      shallow
    );

  const filteredDelegates = useMemo(() => {
    return filterDelegates(delegates, showShadow, showRecognized, name, delegateTags);
  }, [delegates, showRecognized, showShadow, name, delegateTags]);

  const sortedDelegates = useMemo(() => {
    return filteredDelegates.sort((prev, next) => {
      if (sort === delegatesSortEnum.creationDate) {
        return prev.expirationDate > next.expirationDate ? -1 : 1;
      } else if (sort === delegatesSortEnum.mkrDelegated) {
        return new BigNumberJS(prev.mkrDelegated).gt(new BigNumberJS(next.mkrDelegated)) ? -1 : 1;
      } else if (sort === delegatesSortEnum.random) {
        return delegates.indexOf(prev) > delegates.indexOf(next) ? 1 : -1;
      }

      return 1;
    });
  }, [filteredDelegates, sort]);

  const isOwner = d => d.voteDelegateAddress.toLowerCase() === voteDelegateContractAddress?.toLowerCase();

  const recognizedDelegates = useMemo(() => {
    return sortedDelegates
      .filter(delegate => delegate.status === DelegateStatusEnum.recognized && !delegate.expired)
      .sort(d => (isOwner(d) ? -1 : 0));
  }, [sortedDelegates]);

  const shadowDelegates = useMemo(() => {
    return sortedDelegates
      .filter(delegate => delegate.status === DelegateStatusEnum.shadow && !delegate.expired)
      .sort(d => (isOwner(d) ? -1 : 0));
  }, [sortedDelegates]);

  const expiredDelegates = useMemo(() => {
    return sortedDelegates.filter(delegate => delegate.expired === true);
  }, [sortedDelegates]);

  const { voteDelegateContractAddress } = useAccount();

  return (
    <PrimaryLayout sx={{ maxWidth: [null, null, null, 'page', 'dashboard'] }}>
      <HeadComponent
        title="Delegates"
        description="Vote delegation allows for MKR holders to delegate their voting power to delegates, which increases the effectiveness and efficiency of the governance process."
        image={'https://vote.makerdao.com/seo/delegates.png'}
      />
      <Stack>
        <Flex sx={{ alignItems: 'center', flexDirection: ['column', 'row'] }}>
          <Flex sx={{ justifyContent: ['center', 'flex-start'], alignItems: 'center', flexWrap: 'wrap' }}>
            <SearchBar sx={{ m: 2 }} onChange={setName} value={name} placeholder="Search by name" />
            <DelegatesSort />

            <DelegatesTagFilter tags={tags} delegates={delegates} sx={{ m: 2 }} />
            <DelegatesFilter delegates={delegates} />
          </Flex>
          <Flex sx={{ ml: [0, 3], mt: [2, 0] }}>
            <Button
              variant={'outline'}
              sx={{
                m: 2,
                color: 'textSecondary',
                border: 'none'
              }}
              onClick={resetFilters}
            >
              Reset filters
            </Button>
          </Flex>
        </Flex>

        <SidebarLayout>
          <Box>
            <Stack gap={3}>
              {sortedDelegates && sortedDelegates.length === 0 && <Text>No delegates found</Text>}

              {recognizedDelegates.length > 0 && (
                <Stack gap={3}>
                  <Heading as="h1">Recognized Delegates</Heading>

                  {recognizedDelegates.map(delegate => (
                    <Box key={delegate.id} sx={{ mb: 3 }}>
                      <ErrorBoundary componentName="Delegate Card">
                        <DelegateOverviewCard delegate={delegate} />
                      </ErrorBoundary>
                    </Box>
                  ))}
                </Stack>
              )}

              {shadowDelegates.length > 0 && (
                <Stack gap={3}>
                  <Heading as="h1">Shadow Delegates</Heading>

                  {shadowDelegates.map(delegate => (
                    <Box key={delegate.id} sx={{ mb: 3 }}>
                      <ErrorBoundary componentName="Delegate Card">
                        <DelegateOverviewCard delegate={delegate} />
                      </ErrorBoundary>
                    </Box>
                  ))}
                </Stack>
              )}

              {expiredDelegates.length > 0 && (
                <Stack gap={3}>
                  <Heading as="h1">Expired Delegates</Heading>

                  {expiredDelegates.map(delegate => (
                    <Box key={delegate.id} sx={{ mb: 3 }}>
                      <ErrorBoundary componentName="Delegate Card">
                        <DelegateOverviewCard delegate={delegate} />
                      </ErrorBoundary>
                    </Box>
                  ))}
                </Stack>
              )}
            </Stack>
          </Box>

          <Stack gap={3}>
            <Box>
              <Heading mt={3} mb={2} as="h3" variant="microHeading">
                Delegate Contracts
              </Heading>
              <Card variant="compact">
                <Text as="p" sx={{ mb: 3, color: 'textSecondary' }}>
                  {voteDelegateContractAddress
                    ? 'Looking for delegate contract information?'
                    : 'Interested in creating a delegate contract?'}
                </Text>
                <Box>
                  <InternalLink
                    href={'/account'}
                    title="My account"
                    // TODO: onClick={() => trackButtonClick('viewAccount')}
                  >
                    <Text color="accentBlue">View Account Page</Text>
                  </InternalLink>
                </Box>
              </Card>
            </Box>
            {stats && (
              <ErrorBoundary componentName="Delegates System Info">
                <DelegatesSystemInfo stats={stats} />
              </ErrorBoundary>
            )}
            <ResourceBox type={'delegates'} />
            <ResourceBox type={'general'} />
          </Stack>
        </SidebarLayout>
      </Stack>
    </PrimaryLayout>
  );
};

export default function DelegatesPage({
  delegates: prefetchedDelegates,
  stats: prefetchedStats,
  tags: prefetchedTags
}: DelegatesPageData): JSX.Element {
  const { network } = useActiveWeb3React();

  const fallbackData = isDefaultNetwork(network)
    ? {
        delegates: prefetchedDelegates,
        tags: prefetchedTags
      }
    : null;

  const { cache } = useSWRConfig();
  const cacheKey = `page/delegates/${network}`;
  const { data, error } = useSWR<DelegatesPageData>(
    !network || isDefaultNetwork(network) ? null : cacheKey,
    () => fetchDelegatesPageData(network, true),
    {
      revalidateOnMount: !cache.get(cacheKey),
      ...(fallbackData && { fallbackData })
    }
  );

  if (!isDefaultNetwork(network) && !data && !error) {
    return <PageLoadingPlaceholder />;
  }

  if (error) {
    return <ErrorPage statusCode={500} title="Error fetching data" />;
  }

  const props = {
    delegates: isDefaultNetwork(network) ? prefetchedDelegates : data?.delegates || [],
    stats: isDefaultNetwork(network) ? prefetchedStats : data?.stats || undefined,
    tags: isDefaultNetwork(network) ? prefetchedTags : data?.tags || []
  };

  return (
    <ErrorBoundary componentName="Delegates List">
      <Delegates {...props} />
    </ErrorBoundary>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const { delegates, stats, tags } = await fetchDelegatesPageData(SupportedNetworks.MAINNET);

  return {
    revalidate: 60 * 30, // allow revalidation every 30 minutes
    props: {
      // Shuffle in the backend, this will be changed depending on the sorting order.
      delegates,
      tags,
      stats
    }
  };
};
