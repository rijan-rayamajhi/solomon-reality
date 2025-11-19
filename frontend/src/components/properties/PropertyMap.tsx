'use client';

import { useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';

interface PropertyMapProps {
  latitude: number;
  longitude: number;
  address?: string;
  propertyTitle?: string;
}

export function PropertyMap({ latitude, longitude, address, propertyTitle }: PropertyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Create a simple embedded map using Google Maps iframe (free tier)
    // For production, you might want to use Mapbox GL JS or Google Maps JavaScript API
    const mapUrl = `https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}&q=${latitude},${longitude}&zoom=15`;

    // If no API key, use a static map image as fallback
    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      const staticMapUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-s+5B5F97(${longitude},${latitude})/${longitude},${latitude},14,0/800x400?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''}`;
      
      if (process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
        mapRef.current.innerHTML = `
          <img 
            src="${staticMapUrl}" 
            alt="Property location map" 
            class="w-full h-full object-cover rounded-lg"
            style="cursor: pointer;"
            onclick="window.open('https://www.google.com/maps?q=${latitude},${longitude}', '_blank')"
          />
        `;
      } else {
        // Fallback: Link to Google Maps
        mapRef.current.innerHTML = `
          <a 
            href="https://www.google.com/maps?q=${latitude},${longitude}" 
            target="_blank" 
            rel="noopener noreferrer"
            class="w-full h-full flex items-center justify-center bg-surface-muted rounded-lg hover:bg-surface transition-colors"
          >
            <div class="text-center">
              <MapPin class="mx-auto mb-2 text-accent-primary" size={32} />
              <p class="text-text-secondary text-sm">View on Google Maps</p>
            </div>
          </a>
        `;
      }
      return;
    }

    // Use Google Maps embed if API key is available
    mapRef.current.innerHTML = `
      <iframe
        width="100%"
        height="100%"
        style="border:0; border-radius: 12px;"
        loading="lazy"
        allowfullscreen
        referrerpolicy="no-referrer-when-downgrade"
        src="${mapUrl}">
      </iframe>
    `;
  }, [latitude, longitude, address, propertyTitle]);

  return (
    <div className="card-luxury p-0 overflow-hidden">
      <div className="p-6 border-b border-border">
        <h2 className="text-2xl font-display font-bold text-accent-primary flex items-center gap-2">
          <MapPin size={24} />
          Location
        </h2>
        {address && (
          <p className="text-text-secondary mt-2">{address}</p>
        )}
      </div>
      <div ref={mapRef} className="w-full h-[400px] bg-surface-muted rounded-b-lg" />
    </div>
  );
}

