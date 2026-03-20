import type { ComponentType } from 'react';
import type { WidgetType, WidgetGridSize } from '@/lib/types/dashboard';

import { StatsCountriesWidget } from './stats-countries-widget';
import { StatsCitiesWidget } from './stats-cities-widget';
import { OnThisDayWidget } from './on-this-day-widget';
import { AlbumPreviewWidget } from './album-preview-widget';
import { QuoteWidget } from './quote-widget';
import { JournalHighlightWidget } from './journal-highlight-widget';
import { TimelineWidget } from './timeline-widget';
import { ContinentProgressWidget } from './continent-progress-widget';
import { AlbumCarouselWidget } from './album-carousel-widget';
import { PhotoMosaicWidget } from './photo-mosaic-widget';
import { MiniMapWidget } from './mini-map-widget';

export const WIDGET_COMPONENTS: Record<WidgetType, ComponentType<{ size: WidgetGridSize; color?: string; albumId?: string }>> = {
  stats_countries: StatsCountriesWidget,
  stats_cities: StatsCitiesWidget,
  on_this_day: OnThisDayWidget,
  album_preview: AlbumPreviewWidget,
  quote: QuoteWidget,
  journal_highlight: JournalHighlightWidget,
  timeline: TimelineWidget,
  continent_progress: ContinentProgressWidget,
  album_carousel: AlbumCarouselWidget,
  photo_mosaic: PhotoMosaicWidget,
  mini_map: MiniMapWidget,
};
