import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import * as R from 'ramda';

import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';

import { camelcaseString } from './utils';
import { getDailyBreakdownData, getDailyBreakdownMeta } from './selectors';

import {
  fetchBreakdown,
  fetchBreakdownMeta,
  clearBreakdownData,
} from './actions';

import { LevelsTabs } from './constants';
import { ActionLevels } from '../constants';

import PrimaryBar from './PrimaryBar';
import Table from './Table';

const getActiveNames = (items: Level[]): Level[] => {
  const getFilteredItems = R.filter<Omit<Level, 'children'>>(
    R.prop('isChecked'),
  );
  const getChildrenFilteredItems = R.map((filter: Level) => ({
    ...filter,
    children: getFilteredItems(filter.children),
  }));

  const selectedItems = getFilteredItems(items);
  const childrens = getChildrenFilteredItems(selectedItems);

  return childrens;
};

const getItemsNames = (items: Metric[]) => {
  type GetSelectedItemsNames = (arg: Metric[]) => Array<string | number>;
  type GetItemsNames = (arg: Metric[]) => Array<string | number>;

  const getItemsNames: GetItemsNames = R.pluck<'name'>('name');
  const getSelectedItemsNames: GetSelectedItemsNames = R.pipe(
    R.filter<Metric>(R.prop('isChecked')),
    getItemsNames,
  );

  const selectedItemsNames = getSelectedItemsNames(items);

  return !selectedItemsNames.length ? getItemsNames(items) : selectedItemsNames;
};

const getInitialPlatforms: (x0: unknown) => Level[] = R.pipe(
  R.toPairs,
  R.map(([id, platforms]: [string, string[]]) => ({
    id,
    name: id,
    isChecked: true,
    children: platforms.map(platform => ({
      id: platform,
      name: camelcaseString(platform),
      isChecked: true,
    })),
  })),
);

const getInitialTiles: (x0: unknown) => Level[] = R.pipe(
  R.toPairs,
  R.map(([id, tiles]: [string, R.Dictionary<string>]) => ({
    id,
    name: id,
    isChecked: true,
    children: R.toPairs(tiles).map(([tileId, tileName]) => ({
      id: tileId,
      name: tileName,
      isChecked: true,
    })),
  })),
);

const DailyBreakdown = () => {
  const params = useParams<RouteParams>();
  const dispatch = useDispatch();

  const [metrics, setMetrics] = useState<Metric[]>(null);
  const [channels, setChannels] = useState<{
    platforms: Level[];
    tiles: Level[];
  }>(null);
  const [activeLevel, setActiveLevel] = useState(LevelsTabs.PLATFORMS);

  const meta = useSelector(getDailyBreakdownMeta);
  const data = useSelector(getDailyBreakdownData);

  useEffect(() => {
    dispatch(fetchBreakdownMeta(params.id));
  }, [dispatch, params.id]);

  useEffect(() => {
    const metaCondition =
      meta?.metrics && meta?.tiles && meta?.platforms && meta?.defaultMetrics;

    if (data && metaCondition && !channels && !metrics) {
      setMetrics(
        // No issue with proper meta type from selector
        // @ts-ignore
        R.keys(meta.metrics).map(metric => ({
          name: metric,
          isChecked: !!meta.defaultMetrics.find(R.equals(metric)),
        })),
      );
      setChannels({
        platforms: getInitialPlatforms(meta.platforms),
        tiles: getInitialTiles(meta.tiles),
      });
    }
  }, [data, meta, channels, metrics]);

  useEffect(() => {
    dispatch(
      fetchBreakdown({
        id: params.id,
        level: ActionLevels[activeLevel],
      }),
    );

    return () => {
      dispatch(clearBreakdownData());
    };
  }, [params.id, activeLevel, dispatch]);

  if (!metrics || !channels || !data || !meta.metrics || !meta.tiles) {
    return null;
  }

  return (
    <Root>
      <SectionHeader>Section</SectionHeader>
      <SectionBody>
        <PrimaryBar
          channels={channels}
          onChannelsChange={setChannels}
          metrics={metrics}
          metricsNames={meta.metrics}
          onMetricsChange={setMetrics}
          activeLevel={activeLevel}
          onActiveLevelChange={setActiveLevel}
        />
        <Table
          data={data}
          activeLevel={activeLevel}
          selectedChannels={getActiveNames(channels[activeLevel])}
          selectedMetrics={getItemsNames(metrics)}
        />
      </SectionBody>
    </Root>
  );
};

export default DailyBreakdown;

interface RouteParams {
  id: string;
}

export type Metric = {
  name: string | number;
  isChecked: boolean;
};

export type Level = {
  id: string;
  name: string;
  isChecked: boolean;
  children: Omit<Level, 'children'>[];
};

const Root = styled.div`
  width: 100%;
`;

const SectionHeader = styled.div`
  font-size: 1.625rem;
  font-weight: 900;
  color: ${props => props.theme.primary[1]};
  margin: 30px 0;
`;

const SectionBody = styled.div`
  width: 100%;
  height: 100%;
  padding-bottom: 5px;
  background-color: ${({ theme }) => theme.secondary[3]};
  margin-top: 30px;
  border-radius: 5px;
  box-shadow: 0 0 6px 0 rgba(0, 0, 0, 0.16);
  position: relative;
`;
