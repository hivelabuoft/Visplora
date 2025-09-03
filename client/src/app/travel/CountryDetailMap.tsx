'use client';

import React, { useEffect, useRef, useState } from 'react';

// Dynamic import for Leaflet to avoid SSR issues
let L: any = null;

const initializeLeaflet = async () => {
  if (typeof window !== 'undefined' && !L) {
    const leaflet = await import('leaflet');
    L = leaflet.default;
    
    // Import CSS separately
    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css';
    document.head.appendChild(style);
    
    // Fix for default markers in Leaflet with React
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
  }
  return L;
};

interface CountryDetailMapProps {
  selectedCountry: string;
  selectedCity?: string;
  onCitySelect: (cityName: string, cityData: any) => void;
}

interface CityData {
  name: string;
  lat: number;
  lng: number;
  population: number;
  visitors: number;
  isCapital?: boolean;
  state?: string;
}

// Hardcoded city data for different countries - limited to 3-5 major cities per country
const COUNTRY_CITIES: Record<string, CityData[]> = {
  'United States': [
    { name: 'New York', lat: 40.7128, lng: -74.0060, population: 8336817, visitors: 65800000, state: 'New York' },
    { name: 'Los Angeles', lat: 34.0522, lng: -118.2437, population: 3898747, visitors: 50000000, state: 'California' },
    { name: 'Chicago', lat: 41.8781, lng: -87.6298, population: 2746388, visitors: 57800000, state: 'Illinois' },
    { name: 'Washington DC', lat: 38.9072, lng: -77.0369, population: 689545, visitors: 25200000, isCapital: true, state: 'District of Columbia' },
    { name: 'San Francisco', lat: 37.7749, lng: -122.4194, population: 873965, visitors: 25800000, state: 'California' }
  ],
  'Japan': [
    { name: 'Tokyo', lat: 35.6762, lng: 139.6503, population: 14094034, visitors: 15200000, isCapital: true },
    { name: 'Osaka', lat: 34.6937, lng: 135.5023, population: 2691185, visitors: 11800000 },
    { name: 'Kyoto', lat: 35.0116, lng: 135.7681, population: 1463723, visitors: 55000000 },
    { name: 'Sapporo', lat: 43.0642, lng: 141.3469, population: 1973395, visitors: 15800000 }
  ],
  'United Kingdom': [
    { name: 'London', lat: 51.5074, lng: -0.1278, population: 9648110, visitors: 21200000, isCapital: true },
    { name: 'Manchester', lat: 53.4808, lng: -2.2426, population: 547858, visitors: 1400000 },
    { name: 'Edinburgh', lat: 55.9533, lng: -3.1883, population: 542599, visitors: 4500000 },
    { name: 'Liverpool', lat: 53.4084, lng: -2.9916, population: 498042, visitors: 61800000 }
  ],
  'France': [
    { name: 'Paris', lat: 48.8566, lng: 2.3522, population: 2102650, visitors: 38000000, isCapital: true },
    { name: 'Lyon', lat: 45.7640, lng: 4.8357, population: 537913, visitors: 6200000 },
    { name: 'Marseille', lat: 43.2965, lng: 5.3698, population: 873076, visitors: 5200000 },
    { name: 'Nice', lat: 43.7102, lng: 7.2620, population: 341032, visitors: 5000000 }
  ],
  'Germany': [
    { name: 'Berlin', lat: 52.5200, lng: 13.4050, population: 3677472, visitors: 14000000, isCapital: true },
    { name: 'Munich', lat: 48.1351, lng: 11.5820, population: 1512491, visitors: 7400000 },
    { name: 'Hamburg', lat: 53.5511, lng: 9.9937, population: 1945532, visitors: 6900000 },
    { name: 'Frankfurt', lat: 50.1109, lng: 8.6821, population: 759224, visitors: 3800000 }
  ],
  'Australia': [
    { name: 'Sydney', lat: -33.8688, lng: 151.2093, population: 5312163, visitors: 16200000 },
    { name: 'Melbourne', lat: -37.8136, lng: 144.9631, population: 5078193, visitors: 10200000 },
    { name: 'Brisbane', lat: -27.4705, lng: 153.0260, population: 2560720, visitors: 9500000 },
    { name: 'Canberra', lat: -35.2809, lng: 149.1300, population: 457030, visitors: 2700000, isCapital: true }
  ]
};

// Country boundary coordinates for highlighting
const COUNTRY_BOUNDARIES: Record<string, number[][]> = {
  'United States': [
    [49.3457, -66.9346], [24.7433, -66.9346], [24.7433, -179.1506], [49.3457, -179.1506], [71.5388, -156.7854]
  ],
  'Japan': [
    [45.5571, 145.8174], [24.2172, 145.8174], [24.2172, 122.9336], [45.5571, 122.9336]
  ],
  'United Kingdom': [
    [60.8549, 1.7678], [49.8620, 1.7678], [49.8620, -8.6493], [60.8549, -8.6493]
  ],
  'France': [
    [51.0890, 9.5625], [41.3337, 9.5625], [41.3337, -5.1406], [51.0890, -5.1406]
  ],
  'Germany': [
    [55.0574, 15.0418], [47.2701, 15.0418], [47.2701, 5.8662], [55.0574, 5.8662]
  ],
  'Australia': [
    [-10.6882, 153.6389], [-43.6345, 153.6389], [-43.6345, 113.3385], [-10.6882, 113.3385]
  ]
};

const CountryDetailMap: React.FC<CountryDetailMapProps> = ({ 
  selectedCountry, 
  selectedCity, 
  onCitySelect 
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeMap = async () => {
      if (!mapRef.current) return;

      // Initialize Leaflet first
      const leaflet = await initializeLeaflet();
      if (!leaflet) return;

      // Clean up existing map if it exists
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Clear existing markers
      markersRef.current = [];

      // Get country center and zoom level
      let center: [number, number] = [39.8283, -98.5795]; // Default: US center
      let zoom = 1;

      if (selectedCountry === 'United States') {
        center = [39.8283, -98.5795];
        zoom = 3;
      } else if (selectedCountry === 'Japan') {
        center = [36.2048, 138.2529];
        zoom = 6;
      } else if (selectedCountry === 'United Kingdom') {
        center = [54.3781, -3.4360];
        zoom = 6;
      } else if (selectedCountry === 'France') {
        center = [46.2276, 2.2137];
        zoom = 6;
      } else if (selectedCountry === 'Germany') {
        center = [51.1657, 10.4515];
        zoom = 6;
      } else if (selectedCountry === 'Australia') {
        center = [-25.2744, 133.7751];
        zoom = 5;
      }

      // Initialize map
      const map = leaflet.map(mapRef.current, {
        center: center,
        zoom: zoom,
        zoomControl: false,
        closePopupOnClick: true,
        attributionControl: false,
        dragging: true,
        touchZoom: false,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        boxZoom: false,
        keyboard: false,
      });

      // Prevent map events from propagating to parent elements
      map.on('mousedown', (e: any) => {
        if (e.originalEvent) {
          e.originalEvent.stopPropagation();
        }
      });

      mapInstanceRef.current = map;

      // Add tile layer
      leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
      }).addTo(map);
    };

    initializeMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [selectedCountry]);

  useEffect(() => {
    const addCityMarkers = async () => {
      if (!mapInstanceRef.current || !selectedCountry) return;

      const leaflet = await initializeLeaflet();
      if (!leaflet) return;

      setError(null);

      try {
        // Clear existing markers
        markersRef.current.forEach(marker => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.removeLayer(marker);
          }
        });
        markersRef.current = [];

        const cities = COUNTRY_CITIES[selectedCountry] || [];
        
        if (cities.length === 0) {
          setError(`No city data available for ${selectedCountry}`);
          return;
        }

        // Add markers for each city
        cities.forEach((city) => {
          // Double-check map instance is still valid
          if (!mapInstanceRef.current) return;
          
          const isSelected = selectedCity === city.name;
          const isCapital = city.isCapital;
          
          // Create custom icon based on selection and capital status
          const icon = leaflet.divIcon({
            className: 'custom-city-marker',
            html: `
              <div class="city-marker ${isSelected ? 'selected' : ''} ${isCapital ? 'capital' : ''}" data-city-name="${city.name}">
                <div class="marker-dot"></div>
              </div>
            `,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          });

          const marker = leaflet.marker([city.lat, city.lng], { icon })
            .addTo(mapInstanceRef.current);

          // Add click handler
          marker.on('click', () => {
            onCitySelect(city.name, city);
          });

          // Add popup with city information
          const popupContent = `
            <div class="city-popup">
              <h3>${city.name} ${isCapital ? '👑' : ''}</h3>
              <p><strong>Population:</strong> ${city.population.toLocaleString()}</p>
              <p><strong>Annual Visitors:</strong> ${city.visitors.toLocaleString()}</p>
              ${city.state ? `<p><strong>State:</strong> ${city.state}</p>` : ''}
            </div>
          `;

          marker.bindPopup(popupContent, {
            offset: [0, -20],
            className: 'city-popup-wrapper'
          });

          markersRef.current.push(marker);
        });

      } catch (err) {
        console.error('Error adding city markers:', err);
        setError(err instanceof Error ? err.message : 'Failed to load city data');
      }
    };

    if (mapInstanceRef.current && selectedCountry) {
      addCityMarkers();
    }
  }, [selectedCountry, selectedCity, onCitySelect]);

  return (
    <div className="relative w-full h-full">
      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
          <div className="text-center text-white">
            <div className="mb-2">🗺️</div>
            <div className="text-sm">{error}</div>
          </div>
        </div>
      )}

      {/* Map container */}
      <div 
        ref={mapRef} 
        className="w-full h-full rounded-lg"
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
      />

      {/* Custom CSS for markers and popups */}
      <style jsx global>{`
        .custom-city-marker {
          background: transparent;
          border: none;
          position: relative;
        }
        
        .city-marker {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .city-marker:hover {
          transform: scale(1.2);
          z-index: 1000;
        }
        
        .marker-dot {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #3B82F6;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          transition: all 0.2s ease;
        }
        
        .city-marker.selected .marker-dot {
          background: #EF4444;
          width: 18px;
          height: 18px;
          border: 4px solid white;
          box-shadow: 0 3px 12px rgba(239, 68, 68, 0.4);
        }
        
        .city-marker.capital .marker-dot {
          background: #F59E0B;
          border: 4px solid white;
          box-shadow: 0 3px 12px rgba(245, 158, 11, 0.4);
        }
        
        .city-marker.capital.selected .marker-dot {
          background: #DC2626;
          border: 4px solid white;
          box-shadow: 0 3px 12px rgba(220, 38, 38, 0.5);
        }
        
        /* Hover label that appears only on hover */
        .city-marker::after {
          content: attr(data-city-name);
          position: absolute;
          top: -35px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.9);
          color: white;
          padding: 6px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          opacity: 0;
          visibility: hidden;
          transition: all 0.2s ease;
          pointer-events: none;
          z-index: 1001;
        }
        
        .city-marker:hover::after {
          opacity: 1;
          visibility: visible;
          transform: translateX(-50%) translateY(-5px);
        }
        
        /* Arrow for hover label */
        .city-marker::before {
          content: '';
          position: absolute;
          top: -15px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 6px solid rgba(0, 0, 0, 0.9);
          opacity: 0;
          visibility: hidden;
          transition: all 0.2s ease;
          z-index: 1001;
        }
        
        .city-marker:hover::before {
          opacity: 1;
          visibility: visible;
          transform: translateX(-50%) translateY(-5px);
        }
        
        .city-popup {
          font-family: 'Inter', sans-serif;
        }
        
        .city-popup h3 {
          margin: 0 0 8px 0;
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
        }
        
        .city-popup p {
          margin: 4px 0;
          font-size: 12px;
          color: #4b5563;
        }
        
        .city-popup-wrapper .leaflet-popup-content-wrapper {
          border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </div>
  );
};

export default CountryDetailMap;