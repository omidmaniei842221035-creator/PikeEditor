import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Button } from '@/components/ui/button';
import { Layers, Plus, Minus, RotateCcw } from 'lucide-react';

interface Panel {
  id: string;
  type: string;
  title: string;
  datasource: string;
  targets: any[];
  options: any;
  fieldConfig: any;
}

interface MapLibrePanelProps {
  panel: Panel;
}

export function MapLibrePanel({ panel }: MapLibrePanelProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    // Initialize map
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors'
          }
        },
        layers: [
          {
            id: 'osm',
            type: 'raster',
            source: 'osm'
          }
        ]
      },
      center: [46.2738, 38.0962], // Tabriz coordinates
      zoom: 11,
      attributionControl: false
    });

    // Add navigation controls
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    // Add sample POS locations
    map.current.on('load', () => {
      setIsLoaded(true);
      
      if (!map.current) return;

      // Add sample data
      const samplePOSLocations = [
        { id: 1, coords: [46.2738, 38.0962], name: 'شعبه مرکزی', status: 'active', transactions: 120 },
        { id: 2, coords: [46.2845, 38.0845], name: 'شعبه ولیعصر', status: 'active', transactions: 85 },
        { id: 3, coords: [46.2634, 38.1034], name: 'شعبه آزادی', status: 'warning', transactions: 45 },
        { id: 4, coords: [46.2912, 38.0723], name: 'شعبه فردوسی', status: 'offline', transactions: 0 },
      ];

      // Add data source
      map.current.addSource('pos-locations', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: samplePOSLocations.map(pos => ({
            type: 'Feature',
            properties: {
              id: pos.id,
              name: pos.name,
              status: pos.status,
              transactions: pos.transactions
            },
            geometry: {
              type: 'Point',
              coordinates: pos.coords
            }
          }))
        }
      });

      // Add circle layer for heatmap effect
      map.current.addLayer({
        id: 'pos-heatmap',
        type: 'circle',
        source: 'pos-locations',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['get', 'transactions'],
            0, 5,
            150, 25
          ],
          'circle-color': [
            'case',
            ['==', ['get', 'status'], 'active'], '#10b981',
            ['==', ['get', 'status'], 'warning'], '#f59e0b',
            ['==', ['get', 'status'], 'offline'], '#ef4444',
            '#6b7280'
          ],
          'circle-opacity': 0.6,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2
        }
      });

      // Add labels
      map.current.addLayer({
        id: 'pos-labels',
        type: 'symbol',
        source: 'pos-locations',
        layout: {
          'text-field': ['get', 'name'],
          'text-font': ['Open Sans Regular'],
          'text-size': 12,
          'text-anchor': 'top',
          'text-offset': [0, 1.5]
        },
        paint: {
          'text-color': '#374151',
          'text-halo-color': '#ffffff',
          'text-halo-width': 1
        }
      });

      // Add click handlers
      map.current.on('click', 'pos-heatmap', (e) => {
        const feature = e.features?.[0];
        if (feature) {
          const { name, status, transactions } = feature.properties as any;
          
          new maplibregl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(`
              <div class="p-2">
                <h3 class="font-medium">${name}</h3>
                <p class="text-sm text-gray-600">وضعیت: ${
                  status === 'active' ? 'فعال' :
                  status === 'warning' ? 'هشدار' : 
                  status === 'offline' ? 'آفلاین' : 'نامشخص'
                }</p>
                <p class="text-sm text-gray-600">تراکنش‌ها: ${transactions}</p>
              </div>
            `)
            .addTo(map.current!);
        }
      });

      // Change cursor on hover
      map.current.on('mouseenter', 'pos-heatmap', () => {
        if (map.current) {
          map.current.getCanvas().style.cursor = 'pointer';
        }
      });

      map.current.on('mouseleave', 'pos-heatmap', () => {
        if (map.current) {
          map.current.getCanvas().style.cursor = '';
        }
      });
    });

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  const resetView = () => {
    if (map.current) {
      map.current.flyTo({
        center: [46.2738, 38.0962],
        zoom: 11,
        duration: 1000
      });
    }
  };

  return (
    <div className="relative h-full w-full">
      <div ref={mapContainer} className="h-full w-full" />
      
      {isLoaded && (
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          <Button
            size="sm"
            variant="secondary"
            onClick={resetView}
            className="bg-white/90 backdrop-blur-sm"
          >
            <RotateCcw className="w-3 h-3" />
          </Button>
          
          <Button
            size="sm"
            variant="secondary"
            className="bg-white/90 backdrop-blur-sm"
          >
            <Layers className="w-3 h-3" />
          </Button>
        </div>
      )}
      
      <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm rounded px-2 py-1 text-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>فعال</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span>هشدار</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span>آفلاین</span>
          </div>
        </div>
      </div>
    </div>
  );
}