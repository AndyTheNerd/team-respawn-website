import type { Season } from './types';

export const seasonData: Season[] = [
  { id: '85230310c1ab4da6a177e2a3da97ca2d', name: 'Season 15', startDate: '2020-08-13T20:00:00Z' },
  { id: '538599d7a7a748dd81938b07fb9c4b22', name: 'Season 14', startDate: '2019-12-16T08:00:00Z' },
  { id: 'c2b5a642ab834b19a41ebc9a44e3d927', name: 'Season 13', startDate: '2019-05-30T07:00:00Z' },
  { id: 'a8e15e80db5c4af3a93eae5a59e99013', name: 'Season 12', startDate: '2018-12-13T18:00:00Z' },
  { id: '97a86d91d78c428c89d56e99b233c4a0', name: 'Season 11', startDate: '2018-07-18T07:00:00Z' },
  { id: '5bd33de155b34c26a3e4e8c417cb6ae4', name: 'Season 10', startDate: '2018-04-02T07:00:00Z' },
  { id: 'a3e3fb3cf22348dab5ea7c6ecf53f3f9', name: 'Season 9', startDate: '2018-01-16T20:00:00Z' },
  { id: '5f3b5e3b43db4de5a3bc2bfe84ca3e2d', name: 'Season 8', startDate: '2017-11-02T18:00:00Z' },
  { id: 'acd8bebe7ad14068b13b76ead82e7eda', name: 'Season 7', startDate: '2017-09-25T18:00:00Z' },
  { id: '9e1b2ba789b64bf28c0503e2e8abf5bb', name: 'Season 6', startDate: '2017-08-17T16:30:00Z' },
  { id: '7d7cfd0fa64f4b86b6b5f93e0e37e552', name: 'Season 5', startDate: '2017-07-25T17:15:00Z' },
  { id: 'dce28e7c7d5c41c6848edc92f2b4b5c4', name: 'Season 4', startDate: '2017-06-28T17:10:00Z' },
];

export function getSeasonName(seasonId: string): string {
  return seasonData.find(s => s.id === seasonId)?.name || 'Unknown Season';
}
