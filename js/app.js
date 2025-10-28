/**
 * js/app.js
 * Controlador principal de la aplicación.
 * Maneja la inicialización y los event listeners.
 * Depende de loadConfig (de js/config.js) y searchWeather (de js/weather.js).
 */

// (NUEVA FUNCIÓN - añádela en app.js)
function loadCurrentDate() {
    try {
        const dateElement = document.getElementById('current-date');
        const today = new Date();
        
        // Opciones para un formato "lindo" en español
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        
        let formattedDate = today.toLocaleDateString('es-AR', options);
        
        // Poner la primera letra en mayúscula
        formattedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
        
        dateElement.textContent = formattedDate;
    } catch (e) {
        console.error("Error al cargar la fecha", e);
    }
}

async function initializeApp() {
    // 1. Cargar la configuración (Función de js/config.js)
    await loadConfig(); 
    
    // 2. Iniciar la búsqueda del clima y las noticias con el valor por defecto
    searchWeather(); 

    // 3. Cargar la fecha actual
    loadCurrentDate();
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