import React, { useEffect, useRef, useState, useContext } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, Navigation, AlertTriangle, Clock, Fuel, Flame, Info, CheckCircle } from 'lucide-react';
import { AppContext } from '../context/AppContext';

const InteractiveMap = ({ type = 'all' }) => {
  const { stations, getStationDistance, getStationWaitTime } = useContext(AppContext);
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStation, setSelectedStation] = useState(null);
  const [trafficActive, setTrafficActive] = useState(false);

  const userLocation = { lat: 6.9271, lng: 79.8612, name: 'Current User Location' };

  // Filter stations by page context type (all, fuel, lpg)
  const filteredStations = stations.filter(s => type === 'all' || s.type === type);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize map centering Colombo
    const map = L.map(mapContainerRef.current, {
      center: [userLocation.lat, userLocation.lng],
      zoom: 13,
      layers: [
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        })
      ]
    });

    mapInstanceRef.current = map;

    // Custom marker icon functions (to bypass default Leaflet image path resolution issues in bundlers)
    const createCustomIcon = (color, symbolHtml) => {
      return L.divIcon({
        className: 'custom-leaflet-icon',
        html: `<div style="background-color: ${color}; width: 36px; height: 36px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; justify-content: center; align-items: center; color: #ffffff">${symbolHtml}</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36]
      });
    };

    const fuelIcon = createCustomIcon('#06b6d4', '⛽');
    const lpgIcon = createCustomIcon('#f97316', '🔥');
    const userIcon = createCustomIcon('#3b82f6', '📍');

    // Add User Location Marker
    L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
      .addTo(map)
      .bindPopup(`<strong style="color: #3b82f6">📍 Current User Location</strong><br/><span style="font-size: 0.75rem; color: #64748b">GPS Coordinates Verified</span>`);

    // Add Station Markers
    const currentMarkers = [];
    filteredStations.forEach(station => {
      const icon = station.type === 'fuel' ? fuelIcon : lpgIcon;
      const marker = L.marker([station.lat, station.lng], { icon })
        .addTo(map);

      // Create Popup Content with Navigate, View Details and Reserve buttons
      const popupDiv = document.createElement('div');
      popupDiv.style.fontFamily = "'Outfit', sans-serif";
      popupDiv.style.minWidth = '220px';
      popupDiv.style.color = '#1e293b';

      popupDiv.innerHTML = `
        <strong style="font-size: 1rem; display: block; margin-bottom: 2px; color: #0f172a">${station.name}</strong>
        <div style="display: flex; align-items: center; gap: 4px; flex-wrap: wrap; margin-bottom: 4px;">
          <span style="font-size: 0.7rem; font-weight: 700; color: ${station.type === 'fuel' ? '#06b6d4' : '#f97316'}; text-transform: uppercase;">
            ${station.type === 'fuel' ? '⛽ Petrol Pump' : '🔥 LPG Distributor'}
          </span>
          <span style="font-size: 0.65rem; padding: 1px 5px; border-radius: 4px; background: ${station.openNow ? 'rgba(22, 163, 74, 0.1)' : 'rgba(220, 38, 38, 0.1)'}; color: ${station.openNow ? '#16a34a' : '#dc2626'}; font-weight: bold;">
            ${station.openNow ? 'Open Now' : 'Closed'}
          </span>
          ${station.isEmergency ? '<span style="font-size: 0.65rem; padding: 1px 5px; border-radius: 4px; background: rgba(239, 68, 68, 0.1); color: #ef4444; font-weight: bold;">⚠️ Emergency Priority</span>' : ''}
        </div>
        <div style="font-size: 0.75rem; color: #64748b; margin-top: 4px; line-height: 1.3">${station.address}</div>
        
        <div style="margin-top: 8px; font-size: 0.8rem; border-top: 1px solid #e2e8f0; padding-top: 8px; display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
          <div>Wait: <strong>${getStationWaitTime(station)}</strong></div>
          <div>Dist: <strong>${getStationDistance(station)}</strong></div>
          <div>Queue: <strong>${station.queueLength} units</strong></div>
          <div>Stock: <strong>${station.stock} ${station.type === 'fuel' ? 'L' : 'Qty'}</strong></div>
          <div style="grid-column: span 2; color: ${station.status === 'In Stock' ? '#16a34a' : station.status === 'Low Stock' ? '#ca8a04' : '#dc2626'}">
            <strong>Status: ${station.status}</strong>
          </div>
        </div>
        
        <div style="margin-top: 10px; display: flex; flex-direction: column; gap: 4px;">
          <a href="https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}" target="_blank" class="popup-btn popup-btn-primary" style="display: flex; align-items: center; justify-content: center; gap: 4px; text-decoration: none;">
            🚗 Navigate GPS
          </a>
          <button id="view-details-${station.id}" class="popup-btn popup-btn-secondary">
            ℹ️ View Diagnostics
          </button>
          <button id="reserve-btn-${station.id}" class="popup-btn popup-btn-secondary" style="border-color: #10b981; color: #10b981;">
            📅 Reserve Refill Slot
          </button>
        </div>
      `;

      // Append custom CSS rules dynamically inside the map context
      const styleNode = document.createElement('style');
      styleNode.innerHTML = `
        .popup-btn {
          width: 100%;
          padding: 6px;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 600;
          text-align: center;
          cursor: pointer;
          font-family: inherit;
          box-sizing: border-box;
          transition: all 0.2s ease;
        }
        .popup-btn-primary {
          background: linear-gradient(135deg, #2563eb, #06b6d4);
          color: white !important;
          border: none;
        }
        .popup-btn-primary:hover {
          opacity: 0.9;
        }
        .popup-btn-secondary {
          background: white;
          border: 1px solid #cbd5e1;
          color: #475569;
        }
        .popup-btn-secondary:hover {
          background: #f8fafc;
        }
      `;
      popupDiv.appendChild(styleNode);

      marker.bindPopup(popupDiv);

      marker.on('popupopen', () => {
        // Wire up buttons click handlers
        const viewBtn = document.getElementById(`view-details-${station.id}`);
        if (viewBtn) {
          viewBtn.onclick = () => {
            setSelectedStation(station);
            drawMockRoute(userLocation.lat, userLocation.lng, station.lat, station.lng);
          };
        }
        const resBtn = document.getElementById(`reserve-btn-${station.id}`);
        if (resBtn) {
          resBtn.onclick = () => {
            alert(`Reservation slot secured at ${station.name}! A temporary token has been generated. Please arrive within 45 minutes.`);
          };
        }
      });

      marker.on('click', () => {
        setSelectedStation(station);
        drawMockRoute(userLocation.lat, userLocation.lng, station.lat, station.lng);
      });

      currentMarkers.push({ id: station.id, marker });
    });

    markersRef.current = currentMarkers;

    let polylineRoute = null;

    // Helper to draw simulated routing
    function drawMockRoute(startLat, startLng, endLat, endLng) {
      if (polylineRoute) {
        map.removeLayer(polylineRoute);
      }
      const latlngs = [
        [startLat, startLng],
        [startLat + (endLat - startLat) * 0.4, startLng + (endLng - startLng) * 0.1], // mock curvy road
        [startLat + (endLat - startLat) * 0.7, startLng + (endLng - startLng) * 0.8],
        [endLat, endLng]
      ];
      polylineRoute = L.polyline(latlngs, { color: '#06b6d4', weight: 4, dashArray: '8, 8', opacity: 0.85 }).addTo(map);
    }

    let trafficLines = [];
    if (trafficActive) {
      const line1 = L.polyline([
        [6.9150, 79.8650],
        [6.9220, 79.8510]
      ], { color: '#ef4444', weight: 6, opacity: 0.65 }).addTo(map);
      const line2 = L.polyline([
        [6.9271, 79.8612],
        [6.9290, 79.8780]
      ], { color: '#f59e0b', weight: 6, opacity: 0.65 }).addTo(map);
      const line3 = L.polyline([
        [6.9380, 79.8580],
        [6.9050, 79.8820]
      ], { color: '#10b981', weight: 6, opacity: 0.65 }).addTo(map);
      trafficLines.push(line1, line2, line3);
    }

    return () => {
      trafficLines.forEach(l => map.removeLayer(l));
      map.remove();
    };
  }, [type, trafficActive, stations]);

  // Handle Station search & click
  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    const query = searchQuery.toLowerCase();
    const station = filteredStations.find(
      s => s.name.toLowerCase().includes(query) ||
           s.area.toLowerCase().includes(query) ||
           s.city.toLowerCase().includes(query) ||
           s.district.toLowerCase().includes(query)
    );

    if (station && mapInstanceRef.current) {
      setSelectedStation(station);
      mapInstanceRef.current.setView([station.lat, station.lng], 15);
      
      const found = markersRef.current.find(m => m.id === station.id);
      if (found) {
        found.marker.openPopup();
      }
      // draw route
      if (mapInstanceRef.current) {
        const latlngs = [
          [userLocation.lat, userLocation.lng],
          [userLocation.lat + (station.lat - userLocation.lat) * 0.4, userLocation.lng + (station.lng - userLocation.lng) * 0.1],
          [userLocation.lat + (station.lat - userLocation.lat) * 0.7, userLocation.lng + (station.lng - userLocation.lng) * 0.8],
          [station.lat, station.lng]
        ];
        L.polyline(latlngs, { color: '#06b6d4', weight: 4, dashArray: '8, 8', opacity: 0.85 }).addTo(mapInstanceRef.current);
      }
    } else {
      alert(`No stations found matching "${searchQuery}" in our system database.`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
      {/* Top Search Controls */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem', width: '100%', maxWidth: '750px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
          <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input 
            type="text" 
            className="form-input" 
            style={{ paddingLeft: '2.5rem' }} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, area, city, or district..."
          />
        </div>
        <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', background: 'linear-gradient(135deg, #2563eb, #06b6d4)' }}>
          Search
        </button>
        <button 
          type="button" 
          onClick={() => setTrafficActive(!trafficActive)} 
          className="btn" 
          style={{ 
            padding: '0.75rem 1.5rem', 
            background: trafficActive ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.05)', 
            color: trafficActive ? '#f87171' : '#ffffff',
            border: '1px solid',
            borderColor: trafficActive ? 'rgba(239, 68, 68, 0.3)' : 'transparent',
            borderRadius: '12px'
          }}
        >
          🚦 Traffic Overlay {trafficActive ? 'ON' : 'OFF'}
        </button>
      </form>

      {/* Main Map Box */}
      <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '1.5rem', minHeight: '450px' }} className="grid-mobile">
        <div 
          ref={mapContainerRef} 
          style={{ 
            borderRadius: '16px', 
            border: '1px solid var(--glass-border)',
            zIndex: 1,
            height: '450px',
            overflow: 'hidden'
          }} 
        />
        
        {/* Info panel of selected marker */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--glass-bg)', textAlign: 'left', border: '1px solid var(--glass-border)', borderRadius: '16px' }}>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 800, borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Info size={16} style={{ color: '#06b6d4' }} /> Diagnostics Node
          </h4>

          {selectedStation ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Station Name</span>
                <div style={{ fontWeight: 'bold', fontSize: '1.05rem', color: 'var(--text-primary)' }}>{selectedStation.name}</div>
              </div>

              <div>
                <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Address Location</span>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{selectedStation.address}</div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                <div>
                  <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Distance</span>
                  <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{selectedStation.distance}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Queue wait</span>
                  <div style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Clock size={12} style={{ color: '#ec4899' }} /> {selectedStation.waitingTime}
                  </div>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Stock Status</span>
                <div>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 'bold', 
                    padding: '2px 8px', 
                    borderRadius: '20px', 
                    background: selectedStation.status === 'In Stock' ? 'rgba(16, 185, 129, 0.1)' : selectedStation.status === 'Low Stock' ? 'rgba(249, 115, 22, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: selectedStation.status === 'In Stock' ? '#34d399' : selectedStation.status === 'Low Stock' ? '#fb923c' : '#f87171',
                    display: 'inline-block'
                  }}>
                    {selectedStation.status}
                  </span>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Available Options</span>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{selectedStation.available}</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                <a 
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedStation.lat},${selectedStation.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-primary"
                  style={{ 
                    width: '100%', 
                    padding: '0.6rem', 
                    fontSize: '0.8rem', 
                    background: 'linear-gradient(135deg, #2563eb, #06b6d4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    textDecoration: 'none'
                  }}
                >
                  <Navigation size={12} /> Google Maps GPS
                </a>
                <button 
                  onClick={() => alert(`Refill quota slot secured at ${selectedStation.name}. Please arrive within 45 mins.`)}
                  className="btn btn-secondary"
                  style={{ width: '100%', padding: '0.6rem', fontSize: '0.8rem' }}
                >
                  Reserve Slot Now
                </button>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem', padding: '3rem 0' }}>
              Click any station marker on the map to display diagnostics details, reserve slots, or trigger directions.
            </div>
          )}
        </div>
      </div>
      
      {styleNodeMarkup()}
    </div>
  );
};

// Helper for inline css rule inclusion
function styleNodeMarkup() {
  return (
    <style>{`
      .custom-leaflet-icon {
        display: flex;
        justify-content: center;
        align-items: center;
      }
      .leaflet-popup-content-wrapper {
        background: var(--glass-bg) !important;
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid var(--glass-border);
        box-shadow: var(--glass-shadow) !important;
        border-radius: 16px;
      }
      .leaflet-popup-tip {
        background: var(--glass-bg) !important;
        border: 1px solid var(--glass-border);
      }
    `}</style>
  );
}

export default InteractiveMap;
