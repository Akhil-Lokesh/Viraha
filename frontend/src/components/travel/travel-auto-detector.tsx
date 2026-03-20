'use client';

import { useEffect, useState } from 'react';
import { useTravelStore } from '@/lib/stores/travel-store';
import { useTravelMode } from '@/lib/hooks/use-travel';
import { useLocationDetection, haversineDistance } from '@/lib/hooks/use-location-detection';
import { TravelModePrompt } from './travel-mode-prompt';

const DISTANCE_THRESHOLD_KM = 50;

export function TravelAutoDetector() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [distanceKm, setDistanceKm] = useState(0);

  const mode = useTravelStore((s) => s.mode);
  const hasPrompted = useTravelStore((s) => s.hasPrompted);

  const { data: travelData } = useTravelMode();
  const { lat, lng, requestLocation } = useLocationDetection();

  // Request location on mount
  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  // Compare detected location against home location
  useEffect(() => {
    if (
      lat == null ||
      lng == null ||
      travelData?.homeLat == null ||
      travelData?.homeLng == null
    ) {
      return;
    }

    // Only trigger if user is currently in local mode and hasn't been prompted
    if (mode !== 'local' || hasPrompted) {
      return;
    }

    const distance = haversineDistance(
      lat,
      lng,
      travelData.homeLat,
      travelData.homeLng
    );

    if (distance > DISTANCE_THRESHOLD_KM) {
      setDistanceKm(distance);
      setShowPrompt(true);
    }
  }, [lat, lng, travelData, mode, hasPrompted]);

  // Don't render anything if conditions aren't met
  if (!showPrompt || lat == null || lng == null) {
    return null;
  }

  return (
    <TravelModePrompt
      open={showPrompt}
      onOpenChange={setShowPrompt}
      detectedLat={lat}
      detectedLng={lng}
      distanceKm={distanceKm}
    />
  );
}
