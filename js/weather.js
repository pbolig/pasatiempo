/**
 * js/weather.js
 * Contiene la lógica para obtener y mostrar datos meteorológicos.
 */

// ==========================================
// CONFIGURACIÓN DE LEAFLET
// ==========================================
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

let map;
let weatherLayer;

// ==========================================
// FUNCIONES AUXILIARES DE CLIMA
// ==========================================

function getWeatherIcon(code) {
    const icons = {
        0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
        45: '🌫️', 48: '🌫️',
        51: '🌦️', 53: '🌦️', 55: '🌧️',
        61: '🌧️', 63: '🌧️', 65: '🌧️',
        71: '🌨️', 73: '🌨️', 75: '🌨️',
        80: '🌦️', 81: '🌧️', 82: '⛈️',
        95: '⛈️', 96: '⛈️', 99: '⛈️'
    };
    return icons[code] || '🌤️';
}

function getWeatherDescription(code) {
    const descriptions = {
        0: 'Despejado', 1: 'Mayormente despejado', 2: 'Parcialmente nublado', 3: 'Nublado',
        45: 'Niebla', 48: 'Niebla con escarcha',
        51: 'Llovizna ligera', 53: 'Llovizna moderada', 55: 'Llovizna intensa',
        61: 'Lluvia ligera', 63: 'Lluvia moderada', 65: 'Lluvia intensa',
        71: 'Nevada ligera', 73: 'Nevada moderada', 75: 'Nevada intensa',
        80: 'Chubascos ligeros', 81: 'Chubascos moderados', 82: 'Chubascos intensos',
        95: 'Tormenta', 96: 'Tormenta con granizo ligero', 99: 'Tormenta con granizo'
    };
    return descriptions[code] || 'Desconocido';
}

function getWindDirection(degrees) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
}

function kmhToKnots(kmh) {
    return (kmh * 0.539957).toFixed(1);
}

// ==========================================
// FUNCIONES PRINCIPALES DE CLIMA
// ==========================================

function quickSearch(city) {
    document.getElementById('cityInput').value = city;
    searchWeather();
}

async function searchWeather() {
    const city = document.getElementById('cityInput').value.trim();
    if (!city) {
        alert('Por favor ingresa una ciudad');
        return;
    }

    const content = document.getElementById('content');
    content.innerHTML = '<div class="loading">⏳ Cargando datos meteorológicos...</div>';
    document.getElementById('newsContent').innerHTML = ''; // Limpiar noticias mientras carga el clima

    try {
        const geoData = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=es&format=json`);
        const geoJson = await geoData.json();

        if (!geoJson.results || geoJson.results.length === 0) {
            throw new Error('Ciudad no encontrada');
        }

        const location = geoJson.results[0];
        const lat = location.latitude;
        const lon = location.longitude;

        // URL de clima corregida para incluir past_hours=24
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,precipitation_probability,precipitation,weather_code,wind_speed_10m,wind_direction_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,rain_sum,wind_speed_10m_max,wind_direction_10m_dominant&timezone=America/Argentina/Buenos_Aires&forecast_days=10&past_hours=24`;

        const weatherData = await fetch(weatherUrl);
        const weatherJson = await weatherData.json();

        displayWeather(location, weatherJson);
        
        // Llamar a loadNews, que está en news.js (asumiendo que es global)
        loadNews(city, location.country); 
    } catch (error) {
        content.innerHTML = `<div class="error">❌ Error: ${error.message}</div>`;
        document.getElementById('newsContent').innerHTML = '';
    }
}

function displayWeather(location, data) {
    // 💡 CORRECCIÓN DEL ERROR: Verificar si los datos esenciales están presentes.
    if (!data.current || !data.daily || !data.daily.time || data.daily.time.length === 0) {
        document.getElementById('content').innerHTML = `
            <div class="error">
                ❌ Error: Datos de clima incompletos para esta ciudad. No se pudo obtener la información actual.
            </div>`;
        initMap(location.latitude, location.longitude, location.name);
        return;
    }

    const current = data.current;
    const daily = data.daily;
    const hourly = data.hourly;

    const windKnots = kmhToKnots(current.wind_speed_10m);
    const windDir = getWindDirection(current.wind_direction_10m);

    // Obtener las próximas 24 horas (desde la hora actual, eliminando las horas pasadas por past_hours=24)
    const todayHours = [];
    const currentTime = new Date(current.time);
    
    // El índice 0 es la hora más reciente devuelta (puede ser de hace 24h). 
    // Buscamos la primera hora que es igual o posterior a la actual.
    for (let i = 0; i < hourly.time.length; i++) {
        const hourTime = new Date(hourly.time[i]);
        if (hourTime >= currentTime && todayHours.length < 24) {
            todayHours.push({
                time: hourly.time[i],
                temp: hourly.temperature_2m[i] || 0,
                rain: hourly.precipitation[i] || 0,
                rainProb: hourly.precipitation_probability[i] || 0,
                weatherCode: hourly.weather_code[i] || 0,
                windSpeed: hourly.wind_speed_10m[i] || 0,
                windDirection: hourly.wind_direction_10m[i] || 0
            });
        }
    }
    
    // Si la API devuelve los datos ordenados, otra opción es simplemente tomar el primer índice 
    // después de la hora actual. Lo mantendremos así para seguridad.

    let html = `
        <div class="current-weather">
            <h2>📍 ${location.name}, ${location.admin1 || location.country}</h2>
            <div class="current-main">
                <div>
                    <div class="current-temp">${Math.round(current.temperature_2m)}°C</div>
                    <div style="font-size: 1.5em; color: #555; margin: 10px 0;">
                        Max: ${Math.round(daily.temperature_2m_max[0])}° / Min: ${Math.round(daily.temperature_2m_min[0])}°
                    </div>
                    <div style="font-size: 1.2em; color: #666;">
                        ${getWeatherIcon(current.weather_code)} ${getWeatherDescription(current.weather_code)}
                    </div>
                    <div style="color: #888; margin-top: 10px;">
                        Sensación térmica: ${Math.round(current.apparent_temperature)}°C
                    </div>
                </div>
            </div>
            <div class="current-details">
                <div class="detail-card">
                    <div class="detail-label">💧 Humedad</div>
                    <div class="detail-value">${current.relative_humidity_2m}%</div>
                </div>
                <div class="detail-card">
                    <div class="detail-label">🌧️ Precipitación</div>
                    <div class="detail-value">${current.precipitation} mm</div>
                </div>
                <div class="detail-card">
                    <div class="detail-label">💨 Viento</div>
                    <div class="detail-value">${windKnots} kn</div>
                    <div style="font-size: 14px; color: #666; margin-top: 5px;">
                        <svg class="wind-direction" viewBox="0 0 100 100" style="transform: rotate(${(current.wind_direction_10m + 180) % 360}deg)">
                            <polygon points="50,10 30,90 50,70 70,90" fill="#667eea"/>
                        </svg>
                        <div>${windDir} (${Math.round(current.wind_direction_10m)}°)</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="hourly-forecast">
            <h2 class="hourly-title">🕐 Pronóstico por hora - Próximas ${todayHours.length} horas</h2>
            <div class="hourly-scroll">
                <div class="hourly-grid">
    `;

    if (todayHours.length > 0) {
        todayHours.forEach(hour => {
            const hourDate = new Date(hour.time);
            const hourStr = hourDate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
            const icon = getWeatherIcon(hour.weatherCode);
            const temp = Math.round(hour.temp);
            const rainProb = Math.round(hour.rainProb);
            const rain = hour.rain;
            const windKnotsHourly = kmhToKnots(hour.windSpeed);
            const windDirHourly = getWindDirection(hour.windDirection);

            html += `
                <div class="hourly-card">
                    <div class="hourly-time">${hourStr}</div>
                    <div class="hourly-icon">${icon}</div>
                    <div class="hourly-temp">${temp}°C</div>
                    <div class="hourly-rain">💧 ${rainProb}%</div>
                    <div class="hourly-rain">🌧️ ${rain.toFixed(1)} mm</div>
                    <div class="hourly-rain">
                        <svg class="hourly-wind-arrow" viewBox="0 0 100 100" style="transform: rotate(${(hour.windDirection + 180) % 360}deg)">
                            <polygon points="50,10 30,90 50,70 70,90" fill="white"/>
                        </svg>
                        ${windKnotsHourly} kn ${windDirHourly}
                    </div>
                </div>
            `;
        });
    } else {
        html += '<p style="text-align:center;">No hay datos horarios disponibles</p>';
    }

    html += `
                </div>
            </div>
        </div>

        <div id="map"></div>

        <div class="forecast-container">
            <h2 class="forecast-title">📅 Pronóstico 10 días</h2>
            <div class="forecast-grid">
    `;

    for (let i = 0; i < daily.time.length; i++) {
        const date = new Date(daily.time[i]);
        const dayName = date.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });
        const maxTemp = Math.round(daily.temperature_2m_max[i]);
        const minTemp = Math.round(daily.temperature_2m_min[i]);
        const icon = getWeatherIcon(daily.weather_code[i]);
        const windMaxKnots = kmhToKnots(daily.wind_speed_10m_max[i]);
        const windDirDaily = getWindDirection(daily.wind_direction_10m_dominant[i]);

        html += `
            <div class="forecast-card">
                <div class="forecast-date">${dayName}</div>
                <div class="forecast-icon">${icon}</div>
                <div class="forecast-temp">${maxTemp}° / ${minTemp}°</div>
                <div class="forecast-detail">🌧️ ${daily.precipitation_sum[i]} mm</div>
                <div class="forecast-detail">
                    <svg class="forecast-wind-arrow" viewBox="0 0 100 100" style="transform: rotate(${(daily.wind_direction_10m_dominant[i] + 180) % 360}deg)">
                        <polygon points="50,10 30,90 50,70 70,90" fill="white"/>
                    </svg>
                    ${windMaxKnots} kn ${windDirDaily}
                </div>
            </div>
        `;
    }

    html += `
            </div>
        </div>
    `;

    document.getElementById('content').innerHTML = html;

    initMap(location.latitude, location.longitude, location.name);
}

function initMap(lat, lon, cityName) {
    if (map) {
        map.remove();
    }

    map = L.map('map').setView([lat, lon], 10);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    const rainViewerUrl = 'https://tilecache.rainviewer.com/v2/radar/{time}/256/{z}/{x}/{y}/2/1_1.png';
    
    fetch('https://api.rainviewer.com/public/weather-maps.json')
        .then(response => response.json())
        .then(data => {
            if (data.radar && data.radar.past.length > 0) {
                const latestTime = data.radar.past[data.radar.past.length - 1].time;
                const radarUrl = rainViewerUrl.replace('{time}', latestTime);
                
                if (weatherLayer) {
                    map.removeLayer(weatherLayer);
                }
                
                weatherLayer = L.tileLayer(radarUrl, {
                    opacity: 0.6,
                    attribution: '© RainViewer'
                }).addTo(map);
            }
        })
        .catch(err => console.log('Radar no disponible:', err));

    L.marker([lat, lon]).addTo(map)
        .bindPopup(`<b>${cityName}</b>`)
        .openPopup();
}