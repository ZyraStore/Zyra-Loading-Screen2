/**
 * Pantalla de Carga Premium de FiveM - Zyra Store
 * Script Principal (app.js)
 * 
 * Implementa configuración dinámica, tema monocromático,
 * reproducción de video/audio por URL, autodetectar framework,
 * sociales 100% configurables e interfaz de carga súper limpia (solo "Cargando").
 */

document.addEventListener('DOMContentLoaded', () => {
    // ==========================================================================
    // 🛡️ CONFIGURACIÓN POR DEFECTO (FALLBACK EN CASO DE ERROR)
    // ==========================================================================
    const defaultConfig = {
        language: "es", 
        serverName: "ZYRA STORE",
        serverSubtitle: "PANTALLA DE CARGA PREMIUM",
        logoUrl: "",
        videoUrl: "",
        audioUrl: "https://assets.mixkit.co/music/preview/mixkit-retro-futurism-150.mp3",
        trackTitle: "Midnight Ride (Synthwave)",
        trackArtist: "Zyra Sound Design",
        audioVolume: 0.15,
        socialLinksTitle: "Enlaces Oficiales",
        particleSpeed: 0.95,
        particleCount: 95,
        particleLinkDistance: 115,
        slides: [
            {
                title: "Normas del Servidor",
                icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
                items: ["Respeta a todos los miembros de la comunidad.", "Valora tu vida por encima de todo.", "Mantén el rol de entorno activo."]
            }
        ],
        socials: [
            { name: "Discord", url: "https://discord.gg/zyrastore", icon: "discord" }
        ]
    };

    // Combinar configuración cargada (config.js) con la por defecto
    const activeConfig = window.ZyraConfig ? { ...defaultConfig, ...window.ZyraConfig } : defaultConfig;

    // Resolver Diccionario de Idiomas
    const selectedLang = (activeConfig.language || 'es').toLowerCase();
    const locales = window.ZyraLocales || {};
    const locale = locales[selectedLang] || locales['es'] || {
        socialHeader: "Enlaces Oficiales",
        statusPrefix: "Estado:",
        systemPrefix: "Sistema:",
        frameworkSearching: "Buscando Framework...",
        defaultLoading: "Cargando...",
        connecting: "Sincronizando con el servidor...",
        ready: "¡Conexión establecida!",
        clickToPlay: "Clic en pantalla para activar música",
        demoLoading: "Iniciando modo de demostración..."
    };

    // Referencias del DOM
    const logoContainer = document.getElementById('logo-container');
    const subtitleEl = document.getElementById('server-subtitle');
    const videoBg = document.getElementById('bg-video');
    const audio = document.getElementById('bg-audio');
    
    const playPauseBtn = document.getElementById('play-pause-btn');
    const playIcon = document.getElementById('play-icon');
    const pauseIcon = document.getElementById('pause-icon');
    const volumeSlider = document.getElementById('volume-slider');
    const visualizer = document.getElementById('visualizer');
    const musicCardWrapper = document.getElementById('music-card-wrapper');
    const trackTitleEl = document.getElementById('track-title');
    const trackArtistEl = document.getElementById('track-artist');
    
    const sliderWrapper = document.getElementById('slider-wrapper');
    const sliderDotsContainer = document.getElementById('slider-dots');
    const socialsContainer = document.getElementById('social-links-grid');
    
    const progressBar = document.getElementById('progress-bar');
    const progressVal = document.getElementById('progress-val');
    const logText = document.getElementById('log-text');
    const frameworkBadge = document.getElementById('framework-badge');
    const canvas = document.getElementById('particles-canvas');

    // Elementos de Idioma
    const socialHeaderEl = document.getElementById('social-header');
    const logPrefixEl = document.getElementById('log-prefix');
    const frameworkLabelEl = document.getElementById('framework-label');

    // Botones de control de volumen
    const volumeUpBtn = document.getElementById('volume-up-btn');
    const volumeDownBtn = document.getElementById('volume-down-btn');
    const volumeMuteBtn = document.getElementById('volume-mute-btn');
    let preMuteVolume = activeConfig.audioVolume;
    let isMuted = false;

    let currentSlide = 0;
    let isPlaying = false;
    let hasInteracted = false;
    let isFiveM = false;
    let detectedFramework = null;

    // ==========================================================================
    // 🌐 TRADUCIR ELEMENTOS DE LA INTERFAZ
    // ==========================================================================
    if (socialHeaderEl) socialHeaderEl.innerText = activeConfig.socialLinksTitle || locale.socialHeader;
    if (logPrefixEl) logPrefixEl.innerText = locale.statusPrefix;
    if (frameworkLabelEl) frameworkLabelEl.innerText = locale.systemPrefix;
    if (frameworkBadge) frameworkBadge.innerText = locale.frameworkSearching;
    if (logText) logText.innerText = locale.defaultLoading; // Fijo "Cargando..." por defecto

    // Traducir el indicador central de música
    const musicTipEl = document.getElementById('music-tip-text');
    if (musicTipEl) musicTipEl.innerText = locale.musicTip;

    // ==========================================================================
    // ⚙️ RENDERIZAR CONFIGURACIÓN DINÁMICA
    // ==========================================================================

    // 1. Logo o Texto de Servidor
    if (activeConfig.logoUrl && activeConfig.logoUrl.trim() !== "") {
        logoContainer.innerHTML = `<img src="${activeConfig.logoUrl}" alt="${activeConfig.serverName}" class="logo-img">`;
    } else {
        logoContainer.innerHTML = `<h1 class="server-title">${activeConfig.serverName}</h1>`;
    }

    // Subtítulo
    subtitleEl.innerText = activeConfig.serverSubtitle;

    // APLICAR INTERRUPTORES DE MÓDULOS (Toggles para Tebex)
    const mainContentEl = document.getElementById('main-content');
    const infoSliderPanel = document.getElementById('info-slider-panel');
    const statusPanel = document.getElementById('status-panel');

    const showSlider = activeConfig.enableInfoSlider;
    const showSocials = activeConfig.enableSocials;

    if (!showSlider && infoSliderPanel) {
        infoSliderPanel.style.display = 'none';
    }
    if (!showSocials && statusPanel) {
        statusPanel.style.display = 'none';
    }

    if (mainContentEl) {
        if (!showSlider && !showSocials) {
            mainContentEl.classList.add('hidden-all');
        } else if (showSlider && !showSocials) {
            mainContentEl.classList.add('slider-only');
        } else if (!showSlider && showSocials) {
            mainContentEl.classList.add('socials-only');
        }
    }

    // 2. Video de Fondo o Partículas Canvas
    if (activeConfig.videoUrl && activeConfig.videoUrl.trim() !== "") {
        // Detener canvas y ocultarlo
        canvas.style.display = 'none';
        
        // Configurar y reproducir video
        videoBg.src = activeConfig.videoUrl;
        videoBg.classList.remove('hidden');
        videoBg.muted = true; 
        videoBg.play().catch(err => {
            console.log("Error al reproducir video de fondo:", err);
        });
    } else {
        // Usar canvas de partículas
        videoBg.style.display = 'none';
        initParticlesSystem();
    }

    // 3. Audio / Música
    if (activeConfig.audioUrl && activeConfig.audioUrl.trim() !== "") {
        audio.src = activeConfig.audioUrl;
        audio.volume = activeConfig.audioVolume;
        volumeSlider.value = activeConfig.audioVolume;
        trackTitleEl.innerText = activeConfig.trackTitle;
        trackArtistEl.innerText = activeConfig.trackArtist;
    } else {
        // Ocultar reproductor si no hay audio
        musicCardWrapper.style.display = 'none';
    }

    // Map de SVGs para redes sociales populares
    const iconSvgs = {
        discord: `<svg class="icon" viewBox="0 0 127.14 96.36" fill="currentColor"><path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.2,77.2,0,0,0-3.3,6.83A96.67,96.67,0,0,0,53.22,6.83,77.2,77.2,0,0,0,49.88,0,105.15,105.15,0,0,0,19.44,8.07C3.66,31.58-1.86,54.65,1,77.53A105.73,105.73,0,0,0,32,96.36a77.7,77.7,0,0,0,6.63-10.85,69.43,69.43,0,0,1-10.4-5c.87-.64,1.71-1.32,2.51-2a75.52,75.52,0,0,0,72.76,0c.8.71,1.64,1.39,2.51,2a69.43,69.43,0,0,1-10.4,5,77.7,77.7,0,0,0,6.63,10.85,105.73,105.73,0,0,0,31.06-18.83C129.5,49.25,123.63,26.47,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53S36.18,40.36,42.45,40.36,53.83,46,53.83,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.24,60,73.24,53S78.41,40.36,84.69,40.36,96.07,46,96.07,53,91,65.69,84.69,65.69Z"/></svg>`,
        youtube: `<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.517 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.871.508 9.388.508 9.388.508s7.517 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`,
        website: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
        twitter: `<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
        x: `<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
        instagram: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>`,
        tiktok: `<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.74-3.94-1.74-.22-.2-.43-.43-.63-.67-.07 2.62-.03 5.24-.04 7.86-.02 1.64-.42 3.32-1.39 4.65-1.29 1.83-3.48 2.87-5.7 2.92-2.18-.01-4.38-.99-5.6-2.8-1.57-2.28-1.45-5.61.42-7.74 1.4-1.62 3.61-2.45 5.73-2.15v4.14c-1.07-.15-2.23.23-2.85 1.16-.83 1.2-.42 2.99.88 3.63 1.2.62 2.84-.08 3.12-1.47.07-2.61.03-5.23.04-7.85l.02-9.43z"/></svg>`,
        fallback: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`
    };

    // 4. Redes Sociales Dinámicas desde config.js
    let socialsHtml = "";
    if (activeConfig.socials && activeConfig.socials.length > 0) {
        activeConfig.socials.forEach(social => {
            const iconName = (social.icon || 'fallback').toLowerCase();
            const svgContent = iconSvgs[iconName] || iconSvgs['fallback'];
            
            socialsHtml += `
                <a href="${social.url}" target="_blank" class="social-btn ${iconName}">
                    ${svgContent}
                    <span>${social.name}</span>
                </a>`;
        });
    }
    socialsContainer.innerHTML = socialsHtml;

    // 5. Cargar Diapositivas (Slides) + Novedades (News) de forma unificada
    let slidesList = [];
    
    // Añadir slides de configuración estándar
    if (activeConfig.slides && activeConfig.slides.length > 0) {
        slidesList = [...activeConfig.slides];
    }
    
    // Si están activadas las novedades, inyectar como una slide especial
    if (activeConfig.enableServerNews && activeConfig.serverNewsItems && activeConfig.serverNewsItems.length > 0) {
        slidesList.push({
            title: activeConfig.serverNewsTitle || "Novedades",
            icon: activeConfig.serverNewsIcon || `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1m2 4v10a2 2 0 0 1-2 2h-1"/><path d="M12 7H7v4h5V7zm5 0h-2v1m2 3h-2v1m4-7h-2M7 15h10M7 18h10"/></svg>`,
            items: activeConfig.serverNewsItems
        });
    }

    let slidesHtml = "";
    let dotsHtml = "";
    if (slidesList.length > 0) {
        slidesList.forEach((slide, idx) => {
            const isActive = idx === 0 ? "active" : "";
            
            // Construir lista de items
            let itemsHtml = "<ul>";
            slide.items.forEach(item => {
                itemsHtml += `<li>${item}</li>`;
            });
            itemsHtml += "</ul>";

            slidesHtml += `
                <div class="slide ${isActive}" data-slide="${idx + 1}">
                    <div class="slide-header">
                        <span class="slide-icon">${slide.icon || ""}</span>
                        <h3>${slide.title}</h3>
                    </div>
                    <div class="slide-content">${itemsHtml}</div>
                </div>`;
                
            dotsHtml += `<span class="dot ${isActive}" data-slide="${idx + 1}"></span>`;
        });
        
        sliderWrapper.innerHTML = slidesHtml;
        sliderDotsContainer.innerHTML = dotsHtml;
        
        // Habilitar Lógica del Slider
        initSlider();
    }

    // ==========================================================================
    // 🔍 AUTODETECCIÓN DE FRAMEWORKS EN TIEMPO REAL
    // ==========================================================================
    function checkFrameworkFromLog(logLine) {
        if (detectedFramework || !logLine) return;

        const line = logLine.toLowerCase();
        
        if (line.includes('loading resource es_extended') || line.includes('starting resource es_extended')) {
            updateFrameworkBadge("ESX");
        } 
        else if (line.includes('loading resource qb-core') || line.includes('starting resource qb-core')) {
            updateFrameworkBadge("QB-Core");
        } 
        else if (line.includes('loading resource qbx_core') || line.includes('starting resource qbx_core')) {
            updateFrameworkBadge("Qbox");
        }
    }

    function updateFrameworkBadge(fwName) {
        detectedFramework = fwName;
        if (frameworkBadge) {
            frameworkBadge.innerText = fwName;
            frameworkBadge.classList.add('detected');
        }
    }

    // ==========================================================================
    // 🎧 FIVEM EVENT LISTENERS
    // ==========================================================================
    window.addEventListener('message', (event) => {
        const data = event.data;
        isFiveM = true;

        if (data.type === 'loadProgress') {
            const percentage = Math.round(data.loadFraction * 100);
            updateLoadingProgress(percentage);
        } 
        else if (data.type === 'onLogLine') {
            // Escanear para autodetección de Framework
            checkFrameworkFromLog(data.message);
            
            // MANTENER LOG LIMPIO: 
            // Ya no cambiamos logText.innerText con el log técnico de FiveM,
            // se queda fijo en "Cargando..." (en el idioma correspondiente)
        }
        else if (data.type === 'initAad') {
            logText.innerText = locale.defaultLoading;
        }
    });

    function updateLoadingProgress(percentage) {
        const val = Math.min(Math.max(percentage, 0), 100);
        if (progressBar) {
            progressBar.style.width = `${val}%`;
        }
        progressVal.innerText = val;
        
        if (val >= 100) {
            logText.innerText = locale.ready; // Muestra "¡Conexión establecida!" o traducción al llegar a 100
            fadeOutAudio();
        } else {
            // Asegurar que durante la carga el texto sea el de "Cargando..." de la traducción activa
            logText.innerText = locale.defaultLoading;
        }
    }

    function fadeOutAudio() {
        const fadeInterval = setInterval(() => {
            if (audio.volume > 0.01) {
                audio.volume -= 0.01;
            } else {
                audio.pause();
                clearInterval(fadeInterval);
            }
        }, 100);
    }

    // Intentar reproducción automática instantánea al cargar
    if (activeConfig.audioUrl) {
        audio.play().then(() => {
            console.log("Autoplay exitoso.");
            isPlaying = true;
            hasInteracted = true;
            playIcon.classList.add('hidden');
            pauseIcon.classList.remove('hidden');
            visualizer.classList.add('playing');
        }).catch(err => {
            console.log("Autoplay bloqueado. Esperando clic del usuario.");
        });
    }

    function togglePlay() {
        if (!activeConfig.audioUrl) return;

        if (isPlaying) {
            audio.pause();
            playIcon.classList.remove('hidden');
            pauseIcon.classList.add('hidden');
            visualizer.classList.remove('playing');
            isPlaying = false;
        } else {
            audio.play().then(() => {
                playIcon.classList.add('hidden');
                pauseIcon.classList.remove('hidden');
                visualizer.classList.add('playing');
                isPlaying = true;
                hasInteracted = true;
            }).catch(err => {
                console.log("Error al reproducir audio:", err);
            });
        }
    }

    // Cambiar volumen y sincronizar slider
    function setVolume(vol) {
        const clampVol = Math.min(Math.max(vol, 0), 1);
        audio.volume = clampVol;
        volumeSlider.value = clampVol;
        
        // Controlar visualizer
        if (clampVol === 0 && isPlaying) {
            visualizer.classList.remove('playing');
        } else if (clampVol > 0 && isPlaying) {
            visualizer.classList.add('playing');
        }

        // Si subimos volumen manualmente, desmutear
        if (clampVol > 0 && isMuted) {
            isMuted = false;
        }
    }

    // Alternar silencio (mute)
    function toggleMute() {
        if (isMuted) {
            setVolume(preMuteVolume <= 0 ? 0.15 : preMuteVolume);
            isMuted = false;
        } else {
            preMuteVolume = audio.volume;
            setVolume(0);
            isMuted = true;
        }
    }

    // Listeners del reproductor
    playPauseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePlay();
    });

    volumeSlider.addEventListener('input', (e) => {
        setVolume(parseFloat(e.target.value));
    });

    if (volumeUpBtn) {
        volumeUpBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            setVolume(audio.volume + 0.05);
        });
    }

    if (volumeDownBtn) {
        volumeDownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            setVolume(audio.volume - 0.05);
        });
    }

    if (volumeMuteBtn) {
        volumeMuteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleMute();
        });
    }

    // Iniciar con el primer click en cualquier parte
    window.addEventListener('click', () => {
        if (!hasInteracted) {
            hasInteracted = true;
            if (!isPlaying) {
                togglePlay();
            }
        }
    });

    // Soporte para atajos de teclado (Hotkeys)
    window.addEventListener('keydown', (e) => {
        if (!activeConfig.audioUrl) return;

        if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
            e.preventDefault(); // Evitar scroll
            setVolume(audio.volume + 0.05);
        } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
            e.preventDefault();
            setVolume(audio.volume - 0.05);
        } else if (e.key.toLowerCase() === 'm') {
            toggleMute();
        } else if (e.key === ' ' || e.key.toLowerCase() === 'p') {
            // Tecla espacio o P para pausar/reproducir
            e.preventDefault();
            togglePlay();
        }
    });

    // ==========================================================================
    // 📑 INTERFAZ DEL SLIDER
    // ==========================================================================
    function initSlider() {
        const slidesEl = document.querySelectorAll('.slide');
        const dotsEl = document.querySelectorAll('.dot');
        const intervalTime = 6000;

        function showSlide(index) {
            slidesEl.forEach(s => s.classList.remove('active'));
            dotsEl.forEach(d => d.classList.remove('active'));
            
            slidesEl[index].classList.add('active');
            dotsEl[index].classList.add('active');
            currentSlide = index;
        }

        function nextSlide() {
            let next = (currentSlide + 1) % slidesEl.length;
            showSlide(next);
        }

        let timer = setInterval(nextSlide, intervalTime);

        dotsEl.forEach((dot, index) => {
            dot.addEventListener('click', (e) => {
                e.stopPropagation();
                clearInterval(timer);
                showSlide(index);
                timer = setInterval(nextSlide, intervalTime);
            });
        });
    }

    // ==========================================================================
    // 🪐 SISTEMA DE PARTÍCULAS MONOCROMÁTICO (PLATA / GRIS / BLANCO)
    // ==========================================================================
    function initParticlesSystem() {
        const ctx = canvas.getContext('2d');
        let particlesArray = [];
        const count = activeConfig.particleCount;
        const speed = activeConfig.particleSpeed;
        const maxDist = activeConfig.particleLinkDistance;

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        window.addEventListener('resize', resize);
        resize();

        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                // Efecto de profundidad paralaje (las más pequeñas están más lejos y flotan más lento)
                this.size = Math.random() * 1.8 + 0.5;
                this.speedScale = this.size / 1.8;
                this.speedY = (Math.random() * 0.25 + 0.15) * speed * this.speedScale;
                this.speedX = (Math.random() - 0.5) * 0.15 * speed * this.speedScale;
                
                const colors = ['rgba(255, 255, 255, ', 'rgba(220, 220, 220, ', 'rgba(180, 180, 180, '];
                this.colorBase = colors[Math.floor(Math.random() * colors.length)];
                this.alpha = (Math.random() * 0.35 + 0.1) * this.speedScale;
                
                // Oscilación de balanceo lateral
                this.swayAngle = Math.random() * Math.PI * 2;
                this.swaySpeed = Math.random() * 0.01 + 0.005;
            }

            update() {
                this.swayAngle += this.swaySpeed;
                this.x += this.speedX + Math.sin(this.swayAngle) * 0.12;
                this.y += this.speedY;

                // Envoltura de bordes elegante tipo cascada
                if (this.y > canvas.height) {
                    this.y = 0;
                    this.x = Math.random() * canvas.width;
                }
                if (this.x > canvas.width) {
                    this.x = 0;
                } else if (this.x < 0) {
                    this.x = canvas.width;
                }
            }

            draw() {
                ctx.fillStyle = `${this.colorBase}${this.alpha})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.closePath();
                ctx.fill();
            }
        }

        function init() {
            particlesArray = [];
            for (let i = 0; i < count; i++) {
                particlesArray.push(new Particle());
            }
        }

        function connect() {
            for (let a = 0; a < particlesArray.length; a++) {
                for (let b = a; b < particlesArray.length; b++) {
                    let dx = particlesArray[a].x - particlesArray[b].x;
                    let dy = particlesArray[a].y - particlesArray[b].y;
                    let dist = Math.sqrt(dx*dx + dy*dy);

                    if (dist < maxDist) {
                        let opacity = (1 - (dist / maxDist)) * 0.08;
                        ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
                        ctx.lineWidth = 0.6;
                        ctx.beginPath();
                        ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                        ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                        ctx.stroke();
                    }
                }
            }
        }

        function animate() {
            if (activeConfig.videoUrl && activeConfig.videoUrl.trim() !== "") return;
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particlesArray.forEach(p => {
                p.update();
                p.draw();
            });
            connect();
            requestAnimationFrame(animate);
        }

        init();
        animate();

        window.addEventListener('resize', () => {
            init();
        });
    }

    // ==========================================================================
    // ⌨️ GESTIÓN DE EVENTOS DE TECLADO INTERACTIVO
    // ==========================================================================


    // ==========================================================================
    // 🧪 SIMULADOR DE CARGA Y AUTODETECCIÓN (DESARROLLO LOCAL)
    // ==========================================================================
    setTimeout(() => {
        if (!isFiveM) {
            console.log("Iniciando Simulación...");
            runDemoSimulation();
        }
    }, 1500);

    function runDemoSimulation() {
        let currentProgress = 0;

        // Logs ficticios para forzar la detección del framework en segundo plano
        const mockLogs = [
            { text: "loading resource es_extended...", action: () => checkFrameworkFromLog("loading resource es_extended...") },
            { text: "loading resource qb-core...", action: () => checkFrameworkFromLog("loading resource qb-core...") }
        ];

        let logIndex = 0;
        
        // Simular eventos de detección en segundo plano
        const logTimer = setInterval(() => {
            if (currentProgress < 100) {
                const item = mockLogs[logIndex % mockLogs.length];
                if (item.action) item.action();
                logIndex++;
            }
        }, 2500);

        // Progreso simulado (el texto logText se mantiene fijo en "Cargando...")
        const progressTimer = setInterval(() => {
            if (currentProgress < 100) {
                const increment = Math.floor(Math.random() * 4) + 1;
                currentProgress = Math.min(currentProgress + increment, 100);
                updateLoadingProgress(currentProgress);
            } else {
                clearInterval(progressTimer);
                clearInterval(logTimer);
            }
        }, 300);
    }
});
