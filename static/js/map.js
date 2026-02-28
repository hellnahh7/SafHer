// --- map.js ---
// Handles Leaflet Map Initialization and Operations

let safherMap;
let routePolylines = [];
let emergencyMarkers = [];
let destinationMarker;

// Custom Icons
const destIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const policeIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
});

const hospitalIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
});

// Initialize the map centered on Kochi
function initMap() {
    safherMap = L.map('map').setView([9.9312, 76.2673], 12); // Kochi center

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(safherMap);
}

// Draw route from arbitrary center to destination
function drawRoute(destCoords, colorHex) {
    // Clear previous
    if (destinationMarker) safherMap.removeLayer(destinationMarker);
    routePolylines.forEach(p => safherMap.removeLayer(p));
    routePolylines = [];

    // Kochi Base Center (assumed user start)
    const baseCoords = [9.9312, 76.2673];

    // Marker
    destinationMarker = L.marker(destCoords, {icon: destIcon}).addTo(safherMap)
        .bindPopup("<b>Destination</b>").openPopup();

    // Line
    const polyline = L.polyline([baseCoords, destCoords], {
        color: colorHex,
        weight: 5,
        opacity: 0.8,
        dashArray: '10, 10',
        lineCap: 'round'
    }).addTo(safherMap);

    routePolylines.push(polyline);
    
    // Fit bounds
    safherMap.fitBounds(polyline.getBounds(), {padding: [50, 50]});
}

// Plot emergency locations onto the map
function loadEmergencyMarkers(locations) {
    locations.forEach(loc => {
        let icon = loc.type === 'police' ? policeIcon : hospitalIcon;
        let emoji = loc.type === 'police' ? '👮' : '🏥';
        
        let marker = L.marker(loc.coordinates, {icon: icon}).addTo(safherMap)
            .bindPopup(`<b>${emoji} ${loc.name}</b><br>Safe Zone`);
            
        emergencyMarkers.push(marker);
    });
}
