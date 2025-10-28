/**
 * js/news.js
 * Contiene la lógica para obtener, categorizar y mostrar noticias.
 * Depende de CONFIG (de js/config.js).
 */

// ==========================================
// FUNCIONES AUXILIARES DE NOTICIAS
// ==========================================

function normalizeTitle(title) {
    if (!title) return '';
    let cleanedTitle = title.toLowerCase().trim();

    // 1. Eliminar prefijos de fuentes comunes
    cleanedTitle = cleanedTitle.replace(/^(la naci[óo]n|clar[íi]n|infobae|p[áa]gina 12|rosario3|la capital|el cronista|ambito|ol[éé]|tyc sports|espn)[\s\-\|:]+/i, '');

    // 2. Eliminar puntuación excesiva al inicio/fin
    cleanedTitle = cleanedTitle.replace(/^[«»"“'‘\s]+|[«»"”'’\s]+$/g, '');
    
    // 3. Limitar y asegurar una longitud mínima
    return cleanedTitle.substring(0, 70);
}

function categorizeArticle(title, description) {
    const text = (title + ' ' + (description || '')).toLowerCase();
    
    // Categorización basada en palabras clave extendidas
    if (text.match(/policial|crimen|seguridad|robo|detenci[oó]n|delito|justicia|polic[ií]a|fiscal|asesinato|disparo|c[aá]rcel|investigaci[oó]n|tribunal|fuga|tr[áa]fico|estafa/)) return 'Policiales';
    if (text.match(/econom[ií]a|d[oó]lar|inflaci[oó]n|peso|banco|mercado|finanza|bolsa|bcra|pbi|tarjeta|cr[éé]dito|deuda|impuesto|exportaci[oó]n|importaci[oó]n|comercio/)) return 'Economía';
    if (text.match(/pol[ií]tica|gobierno|congreso|diputado|senador|elecci[oó]n|presidente|decreto|ley|sesi[oó]n|ministro|c[aá]mara|juez|oposici[oó]n|oficialismo|votaci[oó]n/)) return 'Política';
    
    if (text.match(/cine|pel[ií]cula|estreno|film|actor|actriz|director|hollywood|oscar|festival de cine/)) return 'Cine';
    if (text.match(/espect[aá]culo|televisi[oó]n|tv|programa|famoso|celebridad|show|far[aá]ndula|artista|serie|netflix|prime|hbo/)) return 'Espectáculos';
    if (text.match(/evento|festival|feria|exposici[oó]n|concierto|recital|presentaci[oó]n|muestra|agenda/)) return 'Eventos';
    
    if (text.match(/educaci[oó]n|universidad|escuela|estudiante|docente|maestro|profesor|examen|clase|matr[ií]cula|t[íi]tulo/)) return 'Educación';
    if (text.match(/deporte|f[uú]tbol|racing|newells|boca|river|messi|mundial|copa|gol|tenis|rugby|basquet|club|gimnasia|liga/)) return 'Deportes';
    if (text.match(/arte|cultura|m[uú]sica|teatro|museo|galer[ií]a|pintura|danza|libro|escritor/)) return 'Arte y Cultura';
    if (text.match(/r[ií]o|paran[aá]|pesca|inundaci[oó]n|bajante|ambiente|ecolog[ií]a|naturaleza|calentamiento|sequ[ií]a|contaminaci[oó]n/)) return 'Río y Ambiente';
    if (text.match(/negocio|empresa|comercio|emprendimiento|trabajo|industria|pyme|inversi[oó]n|empleo|mercadotecnia/)) return 'Negocios';
    
    if (text.match(/tecnolog[ií]a|digital|internet|app|software|ia|inteligencia artificial|celular|smartphone|gadget|ciberseguridad/)) return 'Tecnología';
    if (text.match(/salud|hospital|medicina|vacuna|enfermedad|covid|m[éé]dico|terapia|farmacia|alimentos|diet[aá]/)) return 'Salud';
    
    return 'General';
}

function filterByLocation(articles, city) {
    const cityLower = city.toLowerCase();
    const province = getProvince(city);
    
    return articles.map(article => {
        const text = (article.title + ' ' + (article.description || '')).toLowerCase();
        let score = 0;
        
        if (text.includes(cityLower)) score += 10;
        if (province && text.includes(province.toLowerCase())) score += 5;
        if (text.match(/santa fe|rosario|paran[aá]|c[óo]rdoba|mendoza|buenos aires/)) score += 3;
        if (text.match(/argentina|nacional/)) score += 1;
        
        return { ...article, relevanceScore: score };
    }).filter(a => a.relevanceScore > 0).sort((a, b) => b.relevanceScore - a.relevanceScore);
}

function getProvince(city) {
    const provinces = {
        'rosario': 'Santa Fe', 'santa fe': 'Santa Fe',
        'buenos aires': 'Buenos Aires', 'córdoba': 'Córdoba', 'cordoba': 'Córdoba',
        'mendoza': 'Mendoza', 'paraná': 'Entre Ríos', 'parana': 'Entre Ríos',
        'la plata': 'Buenos Aires', 'mar del plata': 'Buenos Aires'
    };
    return provinces[city.toLowerCase()] || '';
}

// ==========================================
// FUNCIONES PRINCIPALES DE NOTICIAS
// ==========================================

async function loadNews(city, country) {
    const newsContent = document.getElementById('newsContent');
    
    // CONFIG debería ser globalmente accesible aquí
    if (!CONFIG) {
        console.log('🔄 CONFIG no encontrado. Intentando recargar...');
        CONFIG = await loadConfig(); 
    }

    if (CONFIG?.settings?.showLoadingProgress) {
        newsContent.innerHTML = '<div class="loading">📰 Cargando noticias de múltiples fuentes...</div>';
    }

    try {
        const allArticles = [];
        const loadingStats = {
            total: 0,
            success: 0,
            failed: 0,
            sources: []
        };

        console.log('📡 Iniciando carga de noticias...');

        await loadRSSFeeds(allArticles, loadingStats);
        await loadExternalAPIs(city, allArticles, loadingStats); // Aún solo GNews y NewsAPI

        console.log(`📊 Estadísticas finales:
            - Total de fuentes intentadas: ${loadingStats.total}
            - Exitosas: ${loadingStats.success}
            - Fallidas: ${loadingStats.failed}
            - Artículos totales: ${allArticles.length}
            - Fuentes exitosas: ${loadingStats.sources.join(', ')}
        `);

        if (allArticles.length > 0) {
            displayNews(allArticles, city);
        } else {
            throw new Error('No se pudieron cargar noticias de ninguna fuente');
        }
    } catch (error) {
        console.error('❌ Error en loadNews:', error);
        newsContent.innerHTML = `
            <div class="news-container">
                <div class="news-header">
                    <span style="font-size: 2em;">📰</span>
                    <h2 class="news-title">Últimas Noticias</h2>
                </div>
                <p style="text-align: center; color: #666; padding: 40px;">
                    No se pudieron cargar las noticias en este momento.<br>
                    <small>Error: ${error.message}</small><br>
                    <small>Verifica la consola para más detalles.</small>
                </p>
            </div>
        `;
    }
}

async function loadRSSFeeds(articlesArray, stats) {
    const allFeeds = [];
    
    if (!CONFIG?.rssFeeds) return;
    
    Object.entries(CONFIG.rssFeeds).forEach(([category, feeds]) => {
        feeds.forEach(feed => {
            if (feed.enabled) {
                allFeeds.push(feed);
            }
        });
    });

    stats.total += allFeeds.length;

    const promises = allFeeds.map(feed => loadSingleRSSFeed(feed, articlesArray, stats));
    await Promise.allSettled(promises);
}

async function loadSingleRSSFeed(feed, articlesArray, stats) {
    try {
        const apiKey = CONFIG.apis.rss2json.apiKey;
        const apiKeyParam = apiKey ? `&api_key=${apiKey}` : '';
        const rssUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}${apiKeyParam}`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.settings.requestTimeout || 8000);
        
        const response = await fetch(rssUrl, { 
            signal: controller.signal,
            headers: { 'Accept': 'application/json' }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.status === 'ok' && data.items && data.items.length > 0) {
            data.items.forEach(item => {
                item.sourceName = feed.name;
                articlesArray.push(item);
            });
            stats.success++;
            stats.sources.push(feed.name);
            console.log(`✅ ${feed.name}: ${data.items.length} artículos cargados`);
        } else {
            stats.failed++;
            console.log(`⚠️ ${feed.name}: Sin artículos válidos (status: ${data.status})`);
        }
    } catch (err) {
        stats.failed++;
        console.log(`❌ ${feed.name}: ${err.message}`);
    }
}

async function loadExternalAPIs(city, articlesArray, stats) {
    const apis = [
        {
            name: 'GNews',
            enabled: CONFIG.apis.gnews.enabled && CONFIG.apis.gnews.apiKey,
            load: () => loadGNewsAPI(city, articlesArray, stats)
        },
        {
            name: 'NewsAPI',
            enabled: CONFIG.apis.newsapi.enabled && CONFIG.apis.newsapi.apiKey,
            load: () => loadNewsAPI(city, articlesArray, stats)
        }
    ];

    const enabledAPIs = apis.filter(api => api.enabled);
    
    if (enabledAPIs.length > 0) {
        stats.total += enabledAPIs.length;
        const promises = enabledAPIs.map(api => api.load());
        await Promise.allSettled(promises);
    }
}

async function loadGNewsAPI(city, articlesArray, stats) {
    try {
        const apiKey = CONFIG.apis.gnews.apiKey;
        const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(city + ' OR Argentina')}&lang=es&country=ar&max=10&apikey=${apiKey}`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        
        if (data.articles) {
            data.articles.forEach(a => {
                articlesArray.push({
                    title: a.title,
                    description: a.description,
                    link: a.url,
                    pubDate: a.publishedAt,
                    thumbnail: a.image,
                    sourceName: a.source.name
                });
            });
            stats.success++;
            stats.sources.push('GNews');
            console.log(`✅ GNews: ${data.articles.length} artículos`);
        }
    } catch (err) {
        stats.failed++;
        console.log(`❌ GNews: ${err.message}`);
    }
}

async function loadNewsAPI(city, articlesArray, stats) {
    try {
        const apiKey = CONFIG.apis.newsapi.apiKey;
        const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(city + ' OR Argentina')}&language=es&sortBy=publishedAt&pageSize=20&apiKey=${apiKey}`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        
        if (data.articles) {
            data.articles.forEach(a => {
                articlesArray.push({
                    title: a.title,
                    description: a.description,
                    link: a.url,
                    pubDate: a.publishedAt,
                    thumbnail: a.urlToImage,
                    sourceName: a.source.name
                });
            });
            stats.success++;
            stats.sources.push('NewsAPI');
            console.log(`✅ NewsAPI: ${data.articles.length} artículos`);
        }
    } catch (err) {
        stats.failed++;
        console.log(`❌ NewsAPI: ${err.message}`);
    }
}


function displayNews(articles, city) {
    const newsContent = document.getElementById('newsContent');
    const maxPerCategory = CONFIG.settings.maxArticlesPerCategory || 12;
    
    console.log(`📊 Procesando ${articles.length} artículos...`);
    
    const relevantArticles = filterByLocation(articles, city);
    console.log(`📍 Artículos relevantes para ${city}: ${relevantArticles.length}`);
    
    const categorizedNews = {};
    
    relevantArticles.forEach(article => {
        const category = categorizeArticle(article.title, article.description);
        if (!categorizedNews[category]) categorizedNews[category] = [];
        categorizedNews[category].push(article);
    });

    console.log(`📑 Categorías encontradas:`, Object.keys(categorizedNews).map(cat => `${cat} (${categorizedNews[cat].length})`).join(', '));

    // 💡 APLICACIÓN DE LA DESDUPLICACIÓN INTELIGENTE
    Object.keys(categorizedNews).forEach(category => {
        const seen = new Set();
        categorizedNews[category] = categorizedNews[category].filter(article => {
            const key = normalizeTitle(article.title); 
            
            // Descartar si el título es muy corto o ya visto.
            if (!key || key.length < 10 || seen.has(key)) return false; 
            
            seen.add(key);
            return true;
        });
    });

    let html = `
        <div class="news-container">
            <div class="news-header">
                <span style="font-size: 2em;">📰</span>
                <div>
                    <h2 class="news-title">Últimas Noticias</h2>
                    <p style="color: #666; margin: 5px 0 0 0;">
                        <strong>${city}</strong> ${getProvince(city) ? '• ' + getProvince(city) : ''} • Argentina
                        <br><small>${relevantArticles.length} noticias de ${Object.keys(categorizedNews).length} categorías</small>
                    </p>
                </div>
            </div>
    `;

    const categoryOrder = ['Río y Ambiente', 'Cine', 'Espectáculos', 'Eventos', 'Deportes', 'Policiales', 'Economía', 'Política', 'Educación', 'Negocios', 'Arte y Cultura', 'Tecnología', 'Salud', 'General'];
    const icons = {
        'Cine': '🎬', 'Espectáculos': '🎭', 'Eventos': '🎪', 
        'Economía': '💰', 'Policiales': '🚔', 'Educación': '📚', 
        'Deportes': '⚽', 'Arte y Cultura': '🎨', 'Río y Ambiente': '🌊', 
        'Negocios': '🏢', 'Política': '🏛️', 'Tecnología': '💻', 
        'Salud': '🏥', 'General': '📄'
    };

    let hasNews = false;

    categoryOrder.forEach(category => {
        if (categorizedNews[category]?.length > 0) {
            hasNews = true;
            html += `
                <div class="category-section">
                    <div class="category-header">${icons[category]} ${category} (${categorizedNews[category].length})</div>
                    <div class="news-grid">`;
            
            categorizedNews[category].slice(0, maxPerCategory).forEach(article => {
                const title = article.title || 'Sin título';
                const desc = (article.description || '').replace(/<[^>]*>/g, '').substring(0, 180);
                const url = article.link || '#';
                const img = article.thumbnail || article.enclosure?.link || '';
                const source = article.sourceName || 'Desconocido';
                
                let date = 'Reciente';
                try {
                    const d = new Date(article.pubDate);
                    if (!isNaN(d.getTime())) {
                        date = d.toLocaleDateString('es-AR', {
                            day: 'numeric', 
                            month: 'short', 
                            hour: '2-digit', 
                            minute: '2-digit'
                        });
                    }
                } catch(e) {}

                html += `
                    <div class="news-card" onclick="window.open('${url}', '_blank')" title="Leer en ${source}">
                        ${img ? `<img src="${img}" class="news-image" onerror="this.style.display='none'" alt="${title}">` : '<div class="news-image"></div>'}
                        <div class="news-content">
                            <h3 class="news-card-title">${title}</h3>
                            <p class="news-description">${desc}${desc.length >= 180 ? '...' : ''}</p>
                            <div class="news-footer">
                                <span class="news-source">📰 ${source}</span>
                                <span>📅 ${date}</span>
                            </div>
                        </div>
                    </div>`;
            });
            
            html += '</div></div>';
        }
    });

    if (!hasNews) {
        html += '<p style="text-align:center;padding:40px;color:#666;">No se encontraron noticias para esta ubicación.</p>';
    }

    html += '</div>';
    newsContent.innerHTML = html;
    console.log('✅ Noticias mostradas correctamente');
}