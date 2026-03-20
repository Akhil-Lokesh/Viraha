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
import { VirahaMomentWidget } from './viraha-moment-widget';
import { JourneyPreviewWidget } from './journey-preview-widget';
import { PlacesMissYouWidget } from './places-miss-you-widget';
import { WantToGoWidget } from './want-to-go-widget';
import { TimeCapsuleWidget } from './time-capsule-widget';
import { SeasonalReflectionWidget } from './seasonal-reflection-widget';
import { TravelStyleWidget } from './travel-style-widget';
import { KindredTravelersWidget } from './kindred-travelers-widget';

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
  viraha_moment: VirahaMomentWidget,
  journey_preview: JourneyPreviewWidget,
  places_miss_you: PlacesMissYouWidget,
  want_to_go: WantToGoWidget,
  time_capsule: TimeCapsuleWidget,
  seasonal_reflection: SeasonalReflectionWidget,
  travel_style: TravelStyleWidget,
  kindred_travelers: KindredTravelersWidget,
};
