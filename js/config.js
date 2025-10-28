/**
 * js/config.js
 * Maneja la carga de la configuración de la aplicación.
 */

let CONFIG = null;

async function loadConfig() {
    try {
        const response = await fetch('config.json');
        if (!response.ok) {
            console.warn('⚠️ No se pudo cargar config.json, usando configuración por defecto');
            CONFIG = getDefaultConfig();
            return CONFIG;
        }
        const config = await response.json();
        console.log('✅ Configuración cargada:', config);
        CONFIG = config; // Asignar a la variable global CONFIG
        return CONFIG;
    } catch (error) {
        console.warn('⚠️ Error al cargar config.json:', error.message);
        CONFIG = getDefaultConfig();
        return CONFIG;
    }
}

/*********************************************
** RSS2JSON: https://rss2json.com/
** TheNewsAPI: https://www.thenewsapi.com/
*********************************************/

function getDefaultConfig() {
    return {
        apis: {
            rss2json: { apiKey: "iifmk9vizxycrsate4axv9qrvlkwog07muxftbxt", enabled: true },
            thenewsapi: { apiKey: "B7XkrhGGUtPj0q5PDOtlA3dgQmD9l8sOak1Y2oGy", enabled: true },
            gdelt: {
                baseUrl: "https://api.gdeltproject.org/api/v2/doc/doc",
                enabled: true,
                params: {
                    query: "lang:spa",
                    mode: "ArtList",
                    format: "json",
                    sort: "datedesc"
                }
            },
            mediastack_free: { baseUrl: "https://mediastack.free.beeceptor.com/", enabled: true },
            gnews: { apiKey: "", enabled: false },
            newsapi: { apiKey: "", enabled: false },
            mediastack: { apiKey: "", enabled: false },
            currentsapi: { apiKey: "", enabled: false }
        },
        rssFeeds: {
            nacionales: [
                { url: "https://www.lanacion.com.ar/arc/outboundfeeds/rss/", name: "La Nación", enabled: true },
                { url: "https://www.clarin.com/rss/lo-ultimo/", name: "Clarín", enabled: true },
                { url: "https://www.infobae.com/argentina/rss.xml", "name": "Infobae Argentina", "enabled": true },
                { url: "https://www.pagina12.com.ar/rss/portada", name: "Página 12", enabled: true },
                { url: "https://www.telam.com.ar/rss2/ultimasnoticias.xml", "name": "Télam", "enabled": true }
            ],
            rosario: [
                { url: "https://www.rosario3.com/rss/", name: "Rosario3", enabled: true },
                { url: "https://www.lacapital.com.ar/rss/", name: "La Capital", enabled: true }
            ],
            economia: [
                { url: "https://www.cronista.com/rss/", name: "El Cronista", enabled: true },
                { url: "https://www.ambito.com/rss/economia.xml", name: "Ámbito Economía", enabled: true }
            ],
            deportes: [
                { url: "https://www.ole.com.ar/rss/", name: "Olé", enabled: true },
                { url: "https://www.tycsports.com/rss/", name: "TyC Sports", enabled: true }
            ],
            espectaculos: [
                { url: "https://www.clarin.com/rss/espectaculos/", name: "Clarín Espectáculos", enabled: true }
            ],
            tecnologia: [
                { url: "https://www.infobae.com/feeds/rss/tecno.xml", name: "Infobae Tecno", enabled: true },
                { url: "https://www.xataka.com/tag/feeds/rss2.xml", name: "Xataka", enabled: true },
                { url: "https://hipertextual.com/feed", name: "Hipertextual", enabled: true },
                { url: "https://www.genbeta.com/feed", name: "Genbeta", enabled: true }
            ],
            internacionales: [
                { url: "https://elpais.com/rss/elpais/portada.xml", name: "El País (España)", enabled: true },
                { url: "https://www.elmundo.es/elmundo/rss/portada.xml", name: "El Mundo", enabled: true },
                { url: "https://cnnespanol.cnn.com/feed/", name: "CNN en Español", enabled: true },
                { url: "https://www.bbc.com/mundo/ultimas_noticias/index.xml", name: "BBC Mundo", enabled: true },
                { url: "https://feeds.elconfidencial.com/mundo.xml", name: "El Confidencial", enabled: true }
            ],
            latinoamerica: [
                { url: "https://rpp.pe/rss", name: "RPP (Perú)", enabled: true },
                { url: "https://www.eluniversal.com.mx/rss", name: "El Universal (México)", enabled: true },
                { url: "https://www.latercera.com/rss/", name: "La Tercera (Chile)", enabled: true },
                { url: "https://www.eltiempo.com/rss.xml", name: "El Tiempo (Colombia)", enabled: true }
            ],
        },
        settings: {
            maxArticlesPerCategory: 12,
            requestTimeout: 8000,
            retryFailedRequests: false,
            showLoadingProgress: true
        }
    };
}