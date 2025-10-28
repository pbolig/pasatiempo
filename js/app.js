/**
 * js/app.js
 * Controlador principal de la aplicación.
 * Maneja la inicialización y los event listeners.
 * Depende de loadConfig (de js/config.js) y searchWeather (de js/weather.js).
 */

async function initializeApp() {
    // 1. Cargar la configuración (Función de js/config.js)
    await loadConfig(); 
    
    // 2. Iniciar la búsqueda del clima y las noticias con el valor por defecto
    searchWeather(); 
}

// ==========================================
// INICIALIZACIÓN Y EVENTOS
// ==========================================

window.onload = initializeApp;

document.getElementById('cityInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchWeather(); // Función de js/weather.js
    }
});