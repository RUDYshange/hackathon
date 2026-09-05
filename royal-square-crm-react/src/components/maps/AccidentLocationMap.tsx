import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin, Navigation, Search, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export interface PinnedLocation {
  address: string;
  street: string;
  suburb: string;
  city: string;
  postalCode?: string;
  lat: number;
  lng: number;
  nearestCrossStreet?: string;
}

interface AccidentLocationMapProps {
  value?: PinnedLocation | null;
  onChange: (loc: PinnedLocation) => void;
  apiKey?: string;
}

declare global {
  interface Window {
    google?: any;
    initGoogleMapCallback?: () => void;
  }
}

export const AccidentLocationMap: React.FC<AccidentLocationMapProps> = ({
  value,
  onChange,
  apiKey
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerInstanceRef = useRef<any>(null);
  const geocoderRef = useRef<any>(null);

  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);

  const effectiveKey =
    apiKey ||
    (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY ||
    'AIzaSyBNLs4TKXP78I_8Gwl38Fx_Fvf30tSAvvo';

  // Default coordinates: Sandton / Johannesburg, South Africa
  const defaultPos = { lat: -26.1076, lng: 28.0567 };

  // Reverse geocode a lat/lng coordinate into structured address
  const reverseGeocode = useCallback(
    (lat: number, lng: number) => {
      if (!geocoderRef.current || !window.google?.maps) {
        onChange({
          address: `Accident Site (${lat.toFixed(5)}, ${lng.toFixed(5)})`,
          street: 'Accident Scene',
          suburb: 'Unknown Suburb',
          city: 'Johannesburg',
          lat,
          lng
        });
        return;
      }

      geocoderRef.current.geocode(
        { location: { lat, lng } },
        (results: any[], status: string) => {
          if (status === 'OK' && results?.[0]) {
            const result = results[0];
            let street = '';
            let suburb = '';
            let city = '';
            let postalCode = '';
            let crossStreet = '';

            result.address_components?.forEach((comp: any) => {
              const types = comp.types || [];
              if (types.includes('route')) street = comp.long_name;
              if (types.includes('sublocality') || types.includes('neighborhood')) suburb = comp.long_name;
              if (types.includes('locality')) city = comp.long_name;
              if (types.includes('postal_code')) postalCode = comp.long_name;
              if (types.includes('intersection')) crossStreet = comp.long_name;
            });

            onChange({
              address: result.formatted_address,
              street: street || result.formatted_address.split(',')[0],
              suburb: suburb || city,
              city: city || 'South Africa',
              postalCode,
              lat,
              lng,
              nearestCrossStreet: crossStreet || undefined
            });
          } else {
            onChange({
              address: `Pinned Location (${lat.toFixed(5)}, ${lng.toFixed(5)})`,
              street: 'Accident Site',
              suburb: 'Area',
              city: 'South Africa',
              lat,
              lng
            });
          }
        }
      );
    },
    [onChange]
  );

  // Update marker position on map
  const setPin = useCallback(
    (lat: number, lng: number, updateAddress = true) => {
      if (!mapInstanceRef.current || !window.google?.maps) return;

      const pos = new window.google.maps.LatLng(lat, lng);
      mapInstanceRef.current.panTo(pos);

      if (markerInstanceRef.current) {
        markerInstanceRef.current.setPosition(pos);
      } else {
        markerInstanceRef.current = new window.google.maps.Marker({
          position: pos,
          map: mapInstanceRef.current,
          draggable: true,
          animation: window.google.maps.Animation.DROP,
          title: 'Accident Location'
        });

        markerInstanceRef.current.addListener('dragend', (evt: any) => {
          const newLat = evt.latLng.lat();
          const newLng = evt.latLng.lng();
          reverseGeocode(newLat, newLng);
        });
      }

      if (updateAddress) {
        reverseGeocode(lat, lng);
      }
    },
    [reverseGeocode]
  );

  // Initialize Google Maps instance
  const initMap = useCallback(() => {
    if (!mapContainerRef.current || !window.google?.maps) return;

    try {
      const initialCenter = value?.lat && value?.lng
        ? { lat: value.lat, lng: value.lng }
        : defaultPos;

      const map = new window.google.maps.Map(mapContainerRef.current, {
        center: initialCenter,
        zoom: value ? 16 : 14,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: [
          { elementType: 'geometry', stylers: [{ color: '#1a1f2c' }] },
          { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1f2c' }] },
          { elementType: 'labels.text.fill', stylers: [{ color: '#9ca3af' }] },
          {
            featureType: 'road',
            elementType: 'geometry',
            stylers: [{ color: '#2d3748' }]
          },
          {
            featureType: 'road',
            elementType: 'geometry.stroke',
            stylers: [{ color: '#212a38' }]
          },
          {
            featureType: 'road.highway',
            elementType: 'geometry',
            stylers: [{ color: '#d97706' }, { lightness: -20 }]
          },
          {
            featureType: 'water',
            elementType: 'geometry',
            stylers: [{ color: '#0e1726' }]
          }
        ]
      });

      geocoderRef.current = new window.google.maps.Geocoder();
      mapInstanceRef.current = map;

      // Click anywhere on the map to pin
      map.addListener('click', (e: any) => {
        const clickedLat = e.latLng.lat();
        const clickedLng = e.latLng.lng();
        setPin(clickedLat, clickedLng, true);
      });

      // If already has a value, place pin
      if (value?.lat && value?.lng) {
        setPin(value.lat, value.lng, false);
      }

      setIsLoaded(true);
    } catch (err: any) {
      console.error('[AccidentLocationMap] Initialization failed:', err);
      setLoadError('Failed to initialize map canvas');
    }
  }, [value, setPin]);

  // Load Google Maps SDK script
  useEffect(() => {
    if (window.google?.maps) {
      initMap();
      return;
    }

    const scriptId = 'google-maps-sdk-script';
    const existingScript = document.getElementById(scriptId);

    if (existingScript) {
      existingScript.addEventListener('load', initMap);
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${effectiveKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      initMap();
    };
    script.onerror = () => {
      setLoadError('Unable to load Google Maps SDK. Please verify internet connectivity or API key permissions.');
    };

    document.head.appendChild(script);

    return () => {
      // Keep script cached for performance
    };
  }, [effectiveKey, initMap]);

  // Handle Geolocation Pin
  const handlePinCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setPin(lat, lng, true);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setZoom(17);
        }
        setIsLocating(false);
      },
      (err) => {
        console.warn('[AccidentMap] Geolocation failed:', err);
        setIsLocating(false);
        // Fallback to Sandton city center
        setPin(defaultPos.lat, defaultPos.lng, true);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Search Address / Cross Streets
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !geocoderRef.current) return;

    setIsSearching(true);
    geocoderRef.current.geocode(
      {
        address: `${searchQuery}, South Africa`,
        componentRestrictions: { country: 'za' }
      },
      (results: any[], status: string) => {
        setIsSearching(false);
        if (status === 'OK' && results?.[0]?.geometry?.location) {
          const loc = results[0].geometry.location;
          setPin(loc.lat(), loc.lng(), true);
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setZoom(16);
          }
        } else {
          alert(`Address "${searchQuery}" could not be found. Please try adding a suburb or street name.`);
        }
      }
    );
  };

  return (
    <div className="accident-map-wrapper">
      {/* Map Controls & Search Bar */}
      <div className="map-toolbar-row">
        <form onSubmit={handleSearch} className="map-search-form">
          <Search size={14} className="text-muted" />
          <input
            type="text"
            className="map-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search accident address, intersection (e.g. Rivonia Rd & Sandton Dr)..."
          />
          <button
            type="submit"
            className="btn btn-secondary btn-xs"
            disabled={isSearching || !searchQuery.trim()}
          >
            {isSearching ? <Loader2 size={12} className="spin-icon" /> : 'Search'}
          </button>
        </form>

        <button
          type="button"
          className="btn btn-secondary btn-sm flex items-center gap-1.5"
          onClick={handlePinCurrentLocation}
          disabled={isLocating}
          title="Pin exact GPS coordinates from your device"
        >
          {isLocating ? (
            <Loader2 size={13} className="spin-icon" />
          ) : (
            <Navigation size={13} className="text-royal" />
          )}
          <span>{isLocating ? 'Locating...' : 'Pin My Location'}</span>
        </button>
      </div>

      {/* Map Canvas Container */}
      <div className="map-canvas-container">
        <div ref={mapContainerRef} className="google-map-element" />

        {!isLoaded && !loadError && (
          <div className="map-loading-overlay">
            <Loader2 size={24} className="spin-icon text-gold" />
            <p className="text-xs text-muted mt-2">Connecting to Google Maps Engine...</p>
          </div>
        )}

        {loadError && (
          <div className="map-error-overlay">
            <AlertCircle size={24} className="text-danger mb-2" />
            <p className="text-sm font-medium text-danger">{loadError}</p>
            <p className="text-xs text-muted mt-1">
              You can manually enter the address and street details below.
            </p>
          </div>
        )}
      </div>

      {/* Pinned Location Feedback Strip */}
      <div className="pinned-location-badge">
        <div className="flex items-center gap-2">
          <MapPin
            size={16}
            className={value?.lat ? 'text-gold fill-gold/20' : 'text-muted'}
          />
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-gold">
              {value?.lat ? 'Pinned Accident Location' : 'No Pin Placed Yet'}
            </span>
            <p className="pinned-address-text">
              {value?.address || 'Click anywhere on the map or use "Pin My Location" above to set the exact accident scene.'}
            </p>
          </div>
        </div>

        {value?.lat && (
          <div className="pinned-coords-tag">
            <CheckCircle2 size={13} className="text-success" />
            <span>
              {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
