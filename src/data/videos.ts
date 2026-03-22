export type { Video } from './videos-legacy';
import { videosLegacy } from './videos-legacy';
import { videos2021 } from './videos-2021';
import { videos2022 } from './videos-2022';
import { videos2023 } from './videos-2023';
import { videos2024 } from './videos-2024';
import { videos2025 } from './videos-2025';
import { videos2026 } from './videos-2026';

// @ts-ignore TS2590: array too large for union inference
export const videos = [
  ...videosLegacy,
  ...videos2021,
  ...videos2022,
  ...videos2023,
  ...videos2024,
  ...videos2025,
  ...videos2026,
];
