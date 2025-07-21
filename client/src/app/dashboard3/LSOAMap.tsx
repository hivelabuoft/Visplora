'use client';

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { parseCSV } from '../../utils/londonDataLoader';

// Fix for default markers in Leaflet with React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LSOAMapProps {
  selectedBorough: string;
  onLSOASelect: (lsoaCode: string, lsoaName: string) => void;
  selectedLSOA?: string;
}

interface LSOAFeature {
  type: 'Feature';
  properties: {
    lsoa21cd: string;
    lsoa21nm: string;
    msoa21cd: string;
    msoa21nm: string;
    lad22cd: string;
    lad22nm: string;
  };
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
}

interface LSOAGeoJSON {
  type: 'FeatureCollection';
  name: string;
  crs: any;
  features: LSOAFeature[];
}

const LSOAMap: React.FC<LSOAMapProps> = ({ selectedBorough, onLSOASelect, selectedLSOA }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersRef = useRef<L.GeoJSON | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    if (selectedLSOA) {
        onLSOASelect('', '');
    }

    // Clean up existing map if it exists
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Initialize map
    const map = L.map(mapRef.current, {
      center: [51.5074, -0.1278], // London center
      zoom: 14, // Start with a wider view
      zoomControl: false,
      closePopupOnClick: true,
      attributionControl: true,
      dragging: true,
      touchZoom: false,
      scrollWheelZoom: true,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
    });

    // Prevent map events from propagating to parent elements
    map.on('mousedown', (e: any) => {
      if (e.originalEvent) {
        e.originalEvent.stopPropagation();
      }
    });
    
    map.on('touchstart', (e: any) => {
      if (e.originalEvent) {
        e.originalEvent.stopPropagation();
      }
    });
    
    map.on('wheel', (e: any) => {
      if (e.originalEvent) {
        e.originalEvent.stopPropagation();
      }
    });

    mapInstanceRef.current = map;

    // Add a simple tile layer (you can customize this)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 30,
    }).addTo(map);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [selectedBorough]); // Re-initialize map when borough changes

  useEffect(() => {
    const loadLSOAData = async () => {
      if (!mapInstanceRef.current) return;

      setError(null);

      try {
        // Clear existing layers
        if (layersRef.current) {
          mapInstanceRef.current.removeLayer(layersRef.current);
          layersRef.current = null;
        }

        // Load LSOA data for the selected borough
        const response = await fetch(`/data/lsoa-london/${selectedBorough}.json`);
        if (!response.ok) {
          throw new Error(`Failed to load LSOA data for ${selectedBorough}`);
        }
        const geoJSONData: LSOAGeoJSON = await response.json();

        // --- Load and process population data ---
        const popResponse = await fetch('/dataset/london/lsoa/land-area-population-density-lsoa11.csv');
        if (!popResponse.ok) throw new Error('Failed to load LSOA population CSV');
        const popCSV = await popResponse.text();
        const { data: popRows } = parseCSV(popCSV);
        // Map: LSOA code -> estimated 2023 population
        const popMap: Record<string, number> = {};
        let minPop = Infinity, maxPop = -Infinity;
        for (const row of popRows) {
          const code = row['LSOA11 Code'];
          let pop2014 = row['Mid-2014 population'].replace(/,/g, '');
          let pop2023 = Math.round(parseInt(pop2014, 10) * 1.05);
          popMap[code] = pop2023;
          if (!isNaN(pop2023)) {
            minPop = Math.min(minPop, pop2023);
            maxPop = Math.max(maxPop, pop2023);
          }
        }
        // --- Compute min/max for this borough only ---
        // Get all LSOA codes in the current borough
        const boroughLSOACodes = geoJSONData.features.map(f => f.properties.lsoa21cd);
        // Get populations for these codes (filter out N/A)
        const boroughPops = boroughLSOACodes
          .map(code => popMap[code])
          .filter(pop => typeof pop === 'number' && !isNaN(pop));
        let boroughMinPop = Math.min(...boroughPops);
        let boroughMaxPop = Math.max(...boroughPops);
        // If all values are N/A, fallback to global min/max
        if (!isFinite(boroughMinPop) || !isFinite(boroughMaxPop)) {
          boroughMinPop = minPop;
          boroughMaxPop = maxPop;
        }
        // Color scale: interpolate between #a599e9 (light) and #120c2b (dark)
        function getPurpleShade(pop: number) {
          if (isNaN(pop)) return '#bbb'; // White for N/A
          if (boroughMinPop === boroughMaxPop) return '#a599e9';
          const t = (pop - boroughMinPop) / (boroughMaxPop - boroughMinPop);
          const lerp = (a: number, b: number) => Math.round(a + (b - a) * t);
          const r = lerp(165, 18);
          const g = lerp(153, 12);
          const b = lerp(233, 43);
          return `rgb(${r},${g},${b})`;
        }
        // --- End borough-specific min/max ---

        // Create GeoJSON layer with custom styling
        const geoJSONLayer = L.geoJSON(geoJSONData, {
          style: (feature) => {
            const lsoaCode = feature?.properties?.lsoa21cd;
            const pop = popMap[lsoaCode] ?? NaN;
            const isSelected = selectedLSOA === lsoaCode;
            const hasAnySelection = selectedLSOA !== '';
            return {
              fillColor: isSelected ? '#8B5CF6' : getPurpleShade(pop),
              weight: isSelected ? 2 : 0.5,
              opacity: isSelected ? 1 : (hasAnySelection ? 0.2 : 0.6),
              color: isSelected ? '#ffffff' : '#ffffff',
              fillOpacity: isNaN(pop) ? 0.4 : (isSelected ? 1 : (hasAnySelection ? 0.1 : 0.7)),
            };
          },
          onEachFeature: (feature, layer) => {
            const lsoaCode = feature.properties.lsoa21cd;
            const lsoaName = feature.properties.lsoa21nm;
            const pop = popMap[lsoaCode];
            // Add hover effects
            layer.on({
              mouseover: (e) => {
                const layer = e.target;
                const isSelected = selectedLSOA === lsoaCode;
                const hasAnySelection = selectedLSOA !== '';
                if (!isSelected) {
                  layer.setStyle({
                    fillColor: hasAnySelection ? '#52525b' : '#A855F7',
                    weight: 1.5,
                    opacity: hasAnySelection ? 0.4 : 1,
                    color: '#ffffff',
                    fillOpacity: hasAnySelection ? 0.3 : 0.8,
                  });
                  layer.bringToFront();
                }
              },
              mouseout: (e) => {
                const layer = e.target;
                const isSelected = selectedLSOA === lsoaCode;
                const hasAnySelection = selectedLSOA !== '';
                layer.setStyle({
                  fillColor: isSelected ? '#8B5CF6' : getPurpleShade(pop),
                  weight: isSelected ? 2 : 0.5,
                  opacity: isSelected ? 1 : (hasAnySelection ? 0.2 : 0.6),
                  color: '#ffffff',
                  fillOpacity: isSelected ? 0.8 : (hasAnySelection ? 0.1 : 0.8),
                });
              },
              click: () => {
                if (selectedLSOA === lsoaCode) {
                  onLSOASelect('', '');
                } else {
                  onLSOASelect(lsoaCode, lsoaName);
                }
              },
            });
            // Add tooltip with population
            layer.bindTooltip(
              `<div class='flex flex-col gap-0 items-center'><span class='mb-1'>${lsoaName}</span><strong>${pop ? pop.toLocaleString() : 'N/A'}</strong>Total Population</div>`,
              {
                permanent: false,
                direction: 'top',
                className: 'lsoa-tooltip',
                offset: [0, -10],
              }
            );
          },
        });

        layersRef.current = geoJSONLayer;
        mapInstanceRef.current.addLayer(geoJSONLayer);

        // Fit map to the LSOA boundaries
        if (geoJSONData.features.length > 0) {
          mapInstanceRef.current.fitBounds(geoJSONLayer.getBounds(), {
            padding: [5, 5],
            maxZoom: 15,
          });
        }

      } catch (err) {
        console.error('Error loading LSOA data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load LSOA data');
      }
    };

    // Only load LSOA data if map is initialized and borough is selected
    if (mapInstanceRef.current && selectedBorough) {
      loadLSOAData();
    }
  }, [selectedBorough, selectedLSOA, onLSOASelect]);

  return (
    <div className="relative w-full h-full">
      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
          <div className="text-center text-white">
            <div className="mb-2">📍</div>
            <div>LSOA data for {selectedBorough}</div>
            <div className="text-xs mt-1">Run conversion script to load data</div>
            <div className="text-xs mt-2 opacity-75">
              /public/data/lsoa-london/convert_shapefiles_to_geojson.py
            </div>
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

      {/* Custom CSS for tooltips */}
      <style jsx global>{`
        .lsoa-tooltip {
          background: rgba(0, 0, 0, 0.8);
          border: none;
          border-radius: 4px;
          color: white;
          font-size: 12px;
          padding: 4px 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
        
        .leaflet-tooltip-top:before {
          border-top-color: rgba(0, 0, 0, 0.8);
        }
      `}</style>
    </div>
  );
};

export default LSOAMap; 