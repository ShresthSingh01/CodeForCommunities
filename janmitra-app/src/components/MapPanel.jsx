import React, { useEffect, useState, useRef } from 'react';
import { Wrapper } from '@googlemaps/react-wrapper';

function GoogleMapInner({ clusters, selectedCluster, hoveredCluster, onSelectCluster, onSelectWard, geoData }) {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (mapRef.current && !map) {
      const newMap = new window.google.maps.Map(mapRef.current, {
        center: { lat: 28.610, lng: 77.210 },
        zoom: 14,
        disableDefaultUI: true,
        styles: [
          { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
          { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
          { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
          { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] }
        ]
      });
      setMap(newMap);
    }
  }, [mapRef, map]);

  // Handle GeoJSON data
  useEffect(() => {
    if (map && geoData) {
      map.data.addGeoJson(geoData);
      map.data.setStyle({
        fillColor: '#1e293b',
        fillOpacity: 0.4,
        strokeWeight: 1,
        strokeColor: '#475569'
      });
      map.data.addListener('click', (event) => {
        const ward = event.feature.getProperty('ward');
        if (onSelectWard && ward) onSelectWard(ward);
      });
    }
  }, [map, geoData, onSelectWard]);

  // Manage Markers
  useEffect(() => {
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    const getPinColor = (cluster) => {
      const isCritical = cluster.urgency === 'critical' || cluster.issue_type === 'water' || cluster.issue_type === 'health';
      if (isCritical) return '#ef4444'; // bg-urgent-red
      if (cluster.priority_score > 0.4) return '#f97316'; // bg-warning-orange
      return '#3b82f6'; // bg-need-blue
    };

    const getPinPosition = (cluster) => {
      if (cluster.location?.lat && cluster.location?.lng) {
        return { lat: cluster.location.lat, lng: cluster.location.lng };
      }
      
      // Fallback coordinates based on the synthetic GeoJSON we created
      if (cluster.ward === 'Ward 3' || cluster.id?.includes('W3')) {
        if (cluster.issue_type === 'road') return { lat: 28.612, lng: 77.212 };
        if (cluster.issue_type === 'education') return { lat: 28.614, lng: 77.214 };
        return { lat: 28.611, lng: 77.213 };
      }
      if (cluster.ward === 'Ward 7' || cluster.id?.includes('W7')) {
        if (cluster.issue_type === 'water') return { lat: 28.616, lng: 77.216 };
        return { lat: 28.618, lng: 77.218 };
      }
      if (cluster.issue_type === 'health') return { lat: 28.602, lng: 77.202 };
      if (cluster.issue_type === 'water') return { lat: 28.604, lng: 77.204 };
      return { lat: 28.603, lng: 77.201 };
    };

    let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
    let hasPoints = false;

    clusters.forEach(cluster => {
      const position = getPinPosition(cluster);
      const isSelected = selectedCluster?.id === cluster.id;
      const isHovered = hoveredCluster?.id === cluster.id;
      const color = getPinColor(cluster);

      minLat = Math.min(minLat, position.lat);
      maxLat = Math.max(maxLat, position.lat);
      minLng = Math.min(minLng, position.lng);
      maxLng = Math.max(maxLng, position.lng);
      hasPoints = true;

      // Create an SVG icon
      const size = isSelected || isHovered ? 20 : 12;
      const svgMarker = {
        path: window.google.maps.SymbolPath.CIRCLE,
        fillColor: color,
        fillOpacity: 0.9,
        strokeWeight: isSelected ? 3 : 1,
        strokeColor: '#0f172a',
        scale: size / 2, // scale is radius
      };

      const marker = new window.google.maps.Marker({
        position,
        map,
        icon: svgMarker,
        title: `${cluster.ward} - ${cluster.issue_type}`,
      });

      marker.addListener('click', () => {
        if (onSelectCluster) onSelectCluster(cluster);
      });

      markersRef.current.push(marker);
    });

    if (hasPoints && clusters.length > 0) {
      if (minLat === maxLat && minLng === maxLng) {
        map.panTo({ lat: minLat, lng: minLng });
      } else {
        const bounds = new window.google.maps.LatLngBounds(
          { lat: minLat - 0.01, lng: minLng - 0.01 },
          { lat: maxLat + 0.01, lng: maxLng + 0.01 }
        );
        map.fitBounds(bounds);
      }
    }
  }, [map, clusters, selectedCluster, hoveredCluster, onSelectCluster]);

  return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />;
}

export default function MapPanel({ clusters, selectedCluster, hoveredCluster, onSelectCluster, onSelectWard }) {
  const [geoData, setGeoData] = useState(null);
  
  // Geocode missing coordinates using our new backend endpoint
  useEffect(() => {
    const geocodeMissing = async () => {
      for (const cluster of clusters) {
        if (!cluster.location?.lat || !cluster.location?.lng) {
          try {
            const res = await fetch(`/api/geocode-ward?ward=${encodeURIComponent(cluster.ward)}`);
            const data = await res.json();
            if (data.lat && data.lng) {
              if (!cluster.location) cluster.location = {};
              cluster.location.lat = data.lat;
              cluster.location.lng = data.lng;
            }
          } catch (err) {
            console.error('Failed to geocode', cluster.ward, err);
          }
        }
      }
    };
    if (clusters.length > 0) {
      geocodeMissing();
    }
  }, [clusters]);

  useEffect(() => {
    fetch('/wards.geojson')
      .then((res) => res.json())
      .then((data) => setGeoData(data))
      .catch((err) => console.error("Failed to load wards GeoJSON", err));
  }, []);

  const apiKey = import.meta.env.VITE_MAPS_API_KEY || import.meta.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey || apiKey.includes('YOUR_')) {
    return (
      <div className="relative w-full h-full min-h-[300px] bg-slate-950 overflow-hidden flex flex-col items-center justify-center p-6 text-center text-slate-400">
        <svg className="w-16 h-16 mb-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="font-semibold text-lg mb-2">// MOCK: Google Maps Placeholder</p>
        <p className="text-sm max-w-sm">Provide VITE_MAPS_API_KEY in .env to enable the interactive map.</p>
        <div className="mt-6 w-full max-w-md text-left bg-slate-900 p-4 rounded-lg border border-slate-800">
          <h4 className="text-xs uppercase text-slate-500 mb-2">Ward Data Summary</h4>
          <ul className="text-sm space-y-1">
            {clusters.map(c => (
              <li key={c.id} className="flex justify-between border-b border-slate-800/50 pb-1">
                <span>{c.ward}</span>
                <span className={c.urgency === 'critical' ? 'text-red-400' : 'text-blue-400'}>
                  {c.issue_type}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[300px] bg-slate-950 overflow-hidden flex flex-col z-0">
      <Wrapper apiKey={apiKey} libraries={["places"]}>
        <GoogleMapInner 
          clusters={clusters} 
          selectedCluster={selectedCluster} 
          hoveredCluster={hoveredCluster}
          onSelectCluster={onSelectCluster}
          onSelectWard={onSelectWard}
          geoData={geoData}
        />
      </Wrapper>
    </div>
  );
}
