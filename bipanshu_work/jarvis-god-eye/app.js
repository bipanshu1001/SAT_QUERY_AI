/* ═══════════════════════════════════════════════════════════════
   ANTARIKSH ASTRA — SPATIAL INTELLIGENCE CORE v2
   Three.js · Satellite Telemetry · Web Audio · Live Intelligence
   ═══════════════════════════════════════════════════════════════ */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONFIGURATION & ORBITAL TELEMETRY
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const CONFIG = {
    earth: { radius: 5, segments: 64 },
    atmosphere: { radius: 5.22, color: new THREE.Color(0x00d4ff) },
    clouds: { radius: 5.06, speed: 0.0003 },
    starfield: { count: 8000, radius: 400 },
    camera: { fov: 45, near: 0.1, far: 2000, distance: 16 },
    satellites: [
        { name: 'SAT-01 TITAN', type: 'KH-11 KENNAN', radius: 6.3, speed: 0.0038, inclination: 0.35, phase: 0.2, alt: '542 KM', vel: '7.64 KM/S', inc: '97.4° SSO', status: 'LOCKED 99.8%' },
        { name: 'SAT-02 ORION', type: 'MENTOR SIGINT', radius: 7.2, speed: 0.0028, inclination: -0.45, phase: 1.5, alt: '780 KM', vel: '7.45 KM/S', inc: '63.4° MOL', status: 'SYNCHRONIZED' },
        { name: 'SAT-03 VEGA', type: 'LACROSSE-5 SAR', radius: 6.7, speed: 0.0033, inclination: 0.68, phase: 2.8, alt: '690 KM', vel: '7.52 KM/S', inc: '57.0° LEO', status: 'RADAR ACTIVE' },
        { name: 'SAT-04 LYRA', type: 'TOPAZ FIA-R', radius: 7.6, speed: 0.0022, inclination: -0.28, phase: 4.1, alt: '1,080 KM', vel: '7.31 KM/S', inc: '123.0° RETRO', status: 'STANDBY SCAN' },
        { name: 'SAT-05 NOVA', type: 'SBIRS-GEO IR', radius: 8.2, speed: 0.0018, inclination: 0.85, phase: 5.3, alt: '1,420 KM', vel: '7.12 KM/S', inc: '82.5° POLAR', status: 'OPTICAL LOCK' },
    ],
    textures: {
        earth: 'https://unpkg.com/three-globe@2.31.1/example/img/earth-blue-marble.jpg',
        bump: 'https://unpkg.com/three-globe@2.31.1/example/img/earth-topology.png',
        clouds: 'https://unpkg.com/three-globe@2.31.1/example/img/earth-clouds.png',
        night: 'https://unpkg.com/three-globe@2.31.1/example/img/earth-night.jpg',
    },
    flyDuration: 100,
};

// Country Populations Database (Global Fallback)
const COUNTRY_POPULATIONS = {
    'india': '1.43B',
    'china': '1.41B',
    'united states': '335M',
    'usa': '335M',
    'indonesia': '278M',
    'pakistan': '241M',
    'nigeria': '224M',
    'brazil': '216M',
    'bangladesh': '173M',
    'russia': '144M',
    'mexico': '128M',
    'japan': '125M',
    'philippines': '117M',
    'ethiopia': '126M',
    'egypt': '112M',
    'vietnam': '98.8M',
    'turkey': '85.3M',
    'germany': '84.4M',
    'thailand': '71.8M',
    'united kingdom': '67.7M',
    'uk': '67.7M',
    'france': '68.0M',
    'italy': '58.9M',
    'south africa': '60.4M',
    'south korea': '51.7M',
    'spain': '47.8M',
    'argentina': '45.8M',
    'canada': '39.0M',
    'saudi arabia': '36.4M',
    'australia': '26.4M',
    'uae': '9.4M'
};

// Strategic Locations Database with Pre-baked Intelligence & Surveillance Photos
const STRATEGIC_LOCATIONS = {
    'india': {
        name: 'INDIA',
        country: 'India',
        lat: 20.5937,
        lng: 78.9629,
        alt: '160m',
        pop: '1.43B',
        bg: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1920&q=80',
        desc: 'Subcontinental spatial surveillance sector. Headquarters of ISRO & Indian space telemetry defense grid (Antariksh Astra).',
        landmarks: [
            { name: 'India Gate (New Delhi)', lat: 28.6129, lng: 77.2295 },
            { name: 'ISRO Antariksh Bhavan (Bengaluru)', lat: 13.0334, lng: 77.5640 },
            { name: 'Taj Mahal (Agra)', lat: 27.1751, lng: 78.0421 },
            { name: 'Satish Dhawan Space Centre (Sriharikota)', lat: 13.7199, lng: 80.2305 }
        ]
    },
    'delhi': {
        name: 'NEW DELHI',
        country: 'India',
        lat: 28.6139,
        lng: 77.2090,
        alt: '216m',
        pop: '33.0M',
        bg: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=1920&q=80',
        desc: 'National Capital Region command hub. Strategic northern defense sector and aerospace monitoring node.',
        landmarks: [
            { name: 'India Gate', lat: 28.6129, lng: 77.2295 },
            { name: 'Rashtrapati Bhavan', lat: 28.6143, lng: 77.1994 },
            { name: 'Red Fort', lat: 28.6562, lng: 77.2410 },
            { name: 'Qutub Minar', lat: 28.5245, lng: 77.1855 }
        ]
    },
    'paris': {
        name: 'PARIS',
        country: 'France',
        lat: 48.8566,
        lng: 2.3522,
        alt: '35m',
        pop: '2.16M',
        bg: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1920&q=80',
        desc: 'Capital of France. Major European hub for commerce, aerospace, culture, and high-resolution optical observation.',
        landmarks: [
            { name: 'Eiffel Tower', lat: 48.8584, lng: 2.2945 },
            { name: 'Louvre Museum', lat: 48.8606, lng: 2.3376 },
            { name: 'Arc de Triomphe', lat: 48.8738, lng: 2.2950 },
            { name: 'Notre-Dame Cathedral', lat: 48.8530, lng: 2.3499 }
        ]
    },
    'tokyo': {
        name: 'TOKYO',
        country: 'Japan',
        lat: 35.6762,
        lng: 139.6503,
        alt: '40m',
        pop: '14.0M',
        bg: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1920&q=80',
        desc: 'Greater Tokyo metropolitan intelligence grid. Ultra-dense urban node and key Pacific telemetry junction.',
        landmarks: [
            { name: 'Shibuya Crossing', lat: 35.6595, lng: 139.7005 },
            { name: 'Tokyo Tower', lat: 35.6586, lng: 139.7454 },
            { name: 'Sensō-ji Temple', lat: 35.7148, lng: 139.7967 },
            { name: 'Shinjuku Gyoen', lat: 35.6852, lng: 139.7100 }
        ]
    },
    'new york': {
        name: 'NEW YORK',
        country: 'United States',
        lat: 40.7128,
        lng: -74.0060,
        alt: '10m',
        pop: '8.33M',
        bg: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=1920&q=80',
        desc: 'Global financial capital and Eastern seaboard command nexus. High sensor density and transatlantic fiber anchor.',
        landmarks: [
            { name: 'Times Square', lat: 40.7580, lng: -73.9855 },
            { name: 'Empire State Building', lat: 40.7484, lng: -73.9857 },
            { name: 'Central Park', lat: 40.7851, lng: -73.9683 },
            { name: 'Brooklyn Bridge', lat: 40.7061, lng: -73.9969 }
        ]
    },
    'london': {
        name: 'LONDON',
        country: 'United Kingdom',
        lat: 51.5074,
        lng: -0.1278,
        alt: '11m',
        pop: '8.98M',
        bg: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1920&q=80',
        desc: 'Prime Meridian reference node. Strategic maritime and aerospace command network center.',
        landmarks: [
            { name: 'Big Ben & Parliament', lat: 51.5007, lng: -0.1246 },
            { name: 'Tower Bridge', lat: 51.5055, lng: -0.0754 },
            { name: 'London Eye', lat: 51.5033, lng: -0.1195 },
            { name: 'The Shard', lat: 51.5045, lng: -0.0865 }
        ]
    },
    'dubai': {
        name: 'DUBAI',
        country: 'United Arab Emirates',
        lat: 25.2048,
        lng: 55.2708,
        alt: '5m',
        pop: '3.60M',
        bg: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1920&q=80',
        desc: 'Arabian Gulf logistics and aerospace hub. High-altitude orbital reconnaissance zone.',
        landmarks: [
            { name: 'Burj Khalifa', lat: 25.1972, lng: 55.2744 },
            { name: 'Palm Jumeirah', lat: 25.1124, lng: 55.1390 },
            { name: 'Burj Al Arab', lat: 25.1412, lng: 55.1852 },
            { name: 'Dubai Marina', lat: 25.0805, lng: 55.1403 }
        ]
    },
    'sydney': {
        name: 'SYDNEY',
        country: 'Australia',
        lat: -33.8688,
        lng: 151.2093,
        alt: '19m',
        pop: '5.31M',
        bg: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=1920&q=80',
        desc: 'Southern Hemisphere primary orbital tracking station and Pacific oceanic surveillance sector.',
        landmarks: [
            { name: 'Sydney Opera House', lat: -33.8568, lng: 151.2153 },
            { name: 'Sydney Harbour Bridge', lat: -33.8523, lng: 151.2108 },
            { name: 'Bondi Beach', lat: -33.8915, lng: 151.2767 },
            { name: 'Darling Harbour', lat: -33.8749, lng: 151.1994 }
        ]
    },
    'cairo': {
        name: 'CAIRO',
        country: 'Egypt',
        lat: 30.0444,
        lng: 31.2357,
        alt: '68m',
        pop: '9.54M',
        bg: 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?auto=format&fit=crop&w=1920&q=80',
        desc: 'Nile Basin strategic crossing and North African geographic gateway. Historical astronomical baseline.',
        landmarks: [
            { name: 'Giza Pyramids', lat: 29.9792, lng: 31.1342 },
            { name: 'The Great Sphinx', lat: 29.9753, lng: 31.1376 },
            { name: 'Egyptian Museum', lat: 30.0478, lng: 31.2336 },
            { name: 'Cairo Tower', lat: 30.0459, lng: 31.2243 }
        ]
    },
    'rome': {
        name: 'ROME',
        country: 'Italy',
        lat: 41.9028,
        lng: 12.4964,
        alt: '21m',
        pop: '2.87M',
        bg: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1920&q=80',
        desc: 'Mediterranean cultural epicenter. High-resolution multispectral surveillance grid.',
        landmarks: [
            { name: 'Colosseum', lat: 41.8902, lng: 12.4922 },
            { name: 'Vatican / St. Peter\'s', lat: 41.9022, lng: 12.4539 },
            { name: 'Pantheon', lat: 41.8986, lng: 12.4769 },
            { name: 'Trevi Fountain', lat: 41.9009, lng: 12.4833 }
        ]
    }
};

// Weather mapping
const WEATHER_CODES = {
    0: 'Clear Sky', 1: 'Mainly Clear', 2: 'Partly Cloudy', 3: 'Overcast',
    45: 'Dense Fog', 48: 'Freezing Fog', 51: 'Light Drizzle', 53: 'Moderate Drizzle',
    55: 'Dense Drizzle', 61: 'Light Rain', 63: 'Moderate Rain', 65: 'Heavy Torrential Rain',
    71: 'Slight Snow', 73: 'Moderate Snow', 75: 'Heavy Snowfall', 77: 'Snow Pellets',
    80: 'Rain Showers', 81: 'Scattered Showers', 82: 'Violent Showers',
    95: 'Severe Thunderstorm', 96: 'Thunderstorm + Hail'
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// WEB AUDIO SCI-FI SOUND SYNTHESIZER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class AstraAudio {
    constructor() {
        this.ctx = null;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) this.ctx = new AudioContext();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playBeep(freq = 880, duration = 0.06, type = 'sine') {
        try {
            this.init();
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch {}
    }

    playLock() {
        try {
            this.init();
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            [1200, 1600, 2400].forEach((f, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(f, now + idx * 0.08);
                gain.gain.setValueAtTime(0.12, now + idx * 0.08);
                gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.12);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now + idx * 0.08);
                osc.stop(now + idx * 0.08 + 0.12);
            });
        } catch {}
    }

    playSonar() {
        try {
            this.init();
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(740, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(320, this.ctx.currentTime + 0.4);
            gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.45);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.45);
        } catch {}
    }

    playHum() {
        try {
            this.init();
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(140, this.ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(380, this.ctx.currentTime + 0.2);
            gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.25);
        } catch {}
    }
}
const JarvisAudio = AstraAudio;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ANTARIKSH ASTRA PROTOCOL CLASS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class AntarikshAstra {
    constructor() {
        this.audio = new AstraAudio();

        // Three.js
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.clock = new THREE.Clock();

        // 3D Objects
        this.earth = null;
        this.earthMaterial = null;
        this.clouds = null;
        this.atmosphere = null;
        this.satellites = [];
        this.satOrbitLines = [];
        this.locationMarker = null;
        this.hoveredSat = null;

        // Raycasting for satellite hovering
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2(-999, -999);

        // State
        this.currentLocation = null;
        this.favorites = [];
        this.searchDebounceTimer = null;
        this.sensorMode = 'normal'; // normal, crt, nvg, flir
        this.flyData = null;
        this.trackingSat = null;

        // DOM elements cache
        this.dom = {};

        this.init();
    }

    // ── INITIALIZATION ──────────────────────────────
    async init() {
        this.cacheDom();
        this.loadFavorites();
        this.initScene();
        this.createEarth();
        this.createAtmosphere();
        this.createClouds();
        this.createStarfield();
        this.createSatellites();
        this.initControls();
        this.initRaycasting();
        this.initSearch();
        this.initSensorModes();
        this.initSatStatusBar();
        this.initVoice();
        this.initFavoritesToggle();
        this.renderFavorites();
        this.startClocks();
        this.setupResize();
        this.animate();
        await this.bootSequence();
    }

    cacheDom() {
        const idMap = {
            boot_screen: 'boot-screen',
            boot_text: 'boot-text',
            boot_progress: 'boot-progress',
            scene_container: 'scene-container',
            bg_image: 'bg-image',
            scope_mask: 'scope-mask',
            hud_grid: 'hud-grid',
            postfx_overlay: 'postfx-overlay',
            intel_hud: 'intel-hud',
            scan_overlay: 'scan-overlay',
            hud: 'hud',

            // Intel HUD
            intel_mission: 'intel-mission',
            intel_mode: 'intel-mode',
            intel_timestamp: 'intel-timestamp',
            intel_orbital: 'intel-orbital',
            intel_mgrs: 'intel-mgrs',
            intel_latlon: 'intel-latlon',
            intel_gsd: 'intel-gsd',
            intel_alt: 'intel-alt',
            intel_summary: 'intel-summary',

            // Header & Search
            search_input: 'search-input',
            search_btn: 'search-btn',
            voice_btn: 'voice-btn',
            suggestions: 'suggestions',
            system_status_text: 'system-status-text',
            datetime: 'datetime',

            // Coordinates card
            data_lat: 'data-lat',
            data_lon: 'data-lon',
            data_alt: 'data-alt',
            data_pop: 'data-pop',

            // Weather card
            weather_temp: 'weather-temp',
            weather_desc: 'weather-desc',
            weather_wind: 'weather-wind',
            weather_humidity: 'weather-humidity',
            weather_vis: 'weather-vis',
            fav_btn: 'fav-btn',

            // Place intel card
            place_name: 'place-name',
            place_description: 'place-description',
            place_image: 'place-image',
            place_image_container: 'place-image-container',
            attractions_list: 'attractions-list',

            // Favorites bottom panel
            bottom_panel: 'bottom-panel',
            fav_header_bar: 'fav-header-bar',
            fav_count: 'fav-count',
            favorites_container: 'favorites-container',

            // Status bar & reticle
            sat_status_bar: 'sat-status-bar',
            targeting_reticle: 'targeting-reticle',
            reticle_label: 'reticle-label',
            voice_feedback: 'voice-feedback',
            voice_text: 'voice-text',

            // Satellite Tooltip
            sat_tooltip: 'sat-tooltip',
            sat_tt_name: 'sat-tt-name',
            sat_tt_type: 'sat-tt-type',
            sat_tt_alt: 'sat-tt-alt',
            sat_tt_vel: 'sat-tt-vel',
            sat_tt_inc: 'sat-tt-inc',
            sat_tt_status: 'sat-tt-status',
        };

        for (const [key, id] of Object.entries(idMap)) {
            this.dom[key] = document.getElementById(id);
        }
    }

    // ── BOOT SEQUENCE (Cold Start) ───────────────────
    async bootSequence() {
        const messages = [
            'INITIALIZING ANTARIKSH ASTRA SPATIAL MATRIX...',
            'ACQUIRING NRO/NGA SATELLITE CONSTELLATION...',
            'ESTABLISHING ENCRYPTED SAT-LINK [TOP SECRET]...',
            'CALIBRATING ANTARIKSH ASTRA SENSOR SUITE...',
            'SYNCHRONIZING MGRS GEODETIC RECONNAISSANCE...',
            'DEPLOYING RECON OVERLAY & SCOPE VIGNETTE...',
            'ALL SYSTEMS OPERATIONAL ■ PROTOCOL ACTIVE',
        ];

        const bootText = this.dom.boot_text;
        const bootProgress = this.dom.boot_progress;

        for (let i = 0; i < messages.length; i++) {
            this.audio.playBeep(440 + i * 90, 0.04);
            if (bootText) bootText.textContent = messages[i];
            if (bootProgress) bootProgress.style.width = `${((i + 1) / messages.length) * 100}%`;
            await this.wait(260);
        }

        await this.wait(400);

        // Fade out boot screen, reveal Antariksh Astra HUD
        if (this.dom.boot_screen) {
            this.dom.boot_screen.classList.add('fade-out');
            setTimeout(() => {
                this.dom.boot_screen.style.display = 'none';
            }, 1200);
        }

        if (this.dom.hud) this.dom.hud.classList.add('visible');
        if (this.dom.hud_grid) this.dom.hud_grid.classList.add('visible');
        if (this.dom.scope_mask) this.dom.scope_mask.classList.add('visible');
        if (this.dom.intel_hud) this.dom.intel_hud.classList.add('visible');

        this.audio.playLock();
        this.typeIntelSummary('ANTARIKSH ASTRA PROTOCOL READY. SELECT SATELLITE OR SEARCH TARGET.');

        // Default target: Paris
        setTimeout(() => {
            this.selectLocation(48.8566, 2.3522, 'Paris, France', true);
        }, 800);
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // THREE.JS 3D SCENE & ASSETS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    initScene() {
        this.scene = new THREE.Scene();

        // Camera
        this.camera = new THREE.PerspectiveCamera(
            CONFIG.camera.fov,
            window.innerWidth / window.innerHeight,
            CONFIG.camera.near,
            CONFIG.camera.far
        );
        this.camera.position.set(0, 4, CONFIG.camera.distance);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.3;
        if (this.dom.scene_container) {
            this.dom.scene_container.appendChild(this.renderer.domElement);
        }

        // Lighting
        this.ambientLight = new THREE.AmbientLight(0x334466, 0.7);
        this.scene.add(this.ambientLight);

        this.sunLight = new THREE.DirectionalLight(0xffffff, 2.4);
        this.sunLight.position.set(40, 20, 30);
        this.scene.add(this.sunLight);

        this.fillLight = new THREE.DirectionalLight(0x00d4ff, 0.5);
        this.fillLight.position.set(-30, -10, -20);
        this.scene.add(this.fillLight);

        this.rimLight = new THREE.PointLight(0x00d4ff, 0.8, 60);
        this.rimLight.position.set(-15, 8, -12);
        this.scene.add(this.rimLight);
    }

    initControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.enablePan = false;
        this.controls.minDistance = 6.2;
        this.controls.maxDistance = 35;
        this.controls.rotateSpeed = 0.55;
        this.controls.zoomSpeed = 0.85;
        this.controls.target.set(0, 0, 0);
    }

    // ── PROCEDURAL EARTH FALLBACK ────────────────────
    createProceduralEarthCanvas() {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Deep ocean gradient
        const oceanGrad = ctx.createLinearGradient(0, 0, 0, 512);
        oceanGrad.addColorStop(0, '#0a1d37');
        oceanGrad.addColorStop(0.5, '#061329');
        oceanGrad.addColorStop(1, '#0a1d37');
        ctx.fillStyle = oceanGrad;
        ctx.fillRect(0, 0, 1024, 512);

        // Procedural continents approximation
        ctx.fillStyle = '#1c3e34';
        for (let i = 0; i < 90; i++) {
            const x = Math.random() * 1024;
            const y = 80 + Math.random() * 350;
            const r = 20 + Math.random() * 65;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }

        // Night lights grid dots
        ctx.fillStyle = 'rgba(255, 230, 150, 0.4)';
        for (let j = 0; j < 300; j++) {
            const lx = Math.random() * 1024;
            const ly = 100 + Math.random() * 312;
            ctx.fillRect(lx, ly, 1.5, 1.5);
        }

        return new THREE.CanvasTexture(canvas);
    }

    // ── EARTH ───────────────────────────────────────
    createEarth() {
        const { radius, segments } = CONFIG.earth;
        const geometry = new THREE.SphereGeometry(radius, segments, segments);
        const loader = new THREE.TextureLoader();

        const fallbackTex = this.createProceduralEarthCanvas();

        const earthTex = loader.load(
            CONFIG.textures.earth,
            (tex) => { tex.colorSpace = THREE.SRGBColorSpace; },
            undefined,
            () => { if (this.earthMaterial) { this.earthMaterial.map = fallbackTex; this.earthMaterial.needsUpdate = true; } }
        );
        earthTex.colorSpace = THREE.SRGBColorSpace;

        const bumpTex = loader.load(CONFIG.textures.bump, undefined, undefined, () => {});

        this.earthMaterial = new THREE.MeshPhongMaterial({
            map: earthTex,
            bumpMap: bumpTex,
            bumpScale: 0.05,
            specular: new THREE.Color(0x223344),
            shininess: 18,
        });

        this.earth = new THREE.Mesh(geometry, this.earthMaterial);
        this.scene.add(this.earth);
    }

    // ── ATMOSPHERE GLOW ─────────────────────────────
    createAtmosphere() {
        const vertexShader = `
            varying vec3 vNormal;
            void main() {
                vNormal = normalize(normalMatrix * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;
        const fragmentShader = `
            varying vec3 vNormal;
            uniform vec3 uColor;
            void main() {
                float intensity = pow(0.68 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.2);
                gl_FragColor = vec4(uColor, 1.0) * intensity * 1.5;
            }
        `;

        const geometry = new THREE.SphereGeometry(CONFIG.atmosphere.radius, 64, 64);
        this.atmosphereMaterial = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                uColor: { value: new THREE.Vector3(0.0, 0.83, 1.0) }
            },
            blending: THREE.AdditiveBlending,
            side: THREE.BackSide,
            transparent: true,
        });

        this.atmosphere = new THREE.Mesh(geometry, this.atmosphereMaterial);
        this.scene.add(this.atmosphere);
    }

    // ── CLOUDS ──────────────────────────────────────
    createClouds() {
        const loader = new THREE.TextureLoader();
        const cloudTexture = loader.load(CONFIG.textures.clouds, undefined, undefined, () => {});

        const geometry = new THREE.SphereGeometry(CONFIG.clouds.radius, 64, 64);
        const material = new THREE.MeshPhongMaterial({
            map: cloudTexture,
            transparent: true,
            opacity: 0.38,
            depthWrite: false,
        });

        this.clouds = new THREE.Mesh(geometry, material);
        this.scene.add(this.clouds);
    }

    // ── STARFIELD ───────────────────────────────────
    createStarfield() {
        const { count, radius } = CONFIG.starfield;
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const r = radius * (0.6 + Math.random() * 0.4);

            positions[i3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i3 + 2] = r * Math.cos(phi);

            const mix = Math.random();
            colors[i3] = 0.7 + mix * 0.3;
            colors[i3 + 1] = 0.85 + mix * 0.15;
            colors[i3 + 2] = 1.0;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 1.3,
            vertexColors: true,
            transparent: true,
            opacity: 0.85,
            sizeAttenuation: true,
        });

        const stars = new THREE.Points(geometry, material);
        this.scene.add(stars);
    }

    // ── SATELLITE CONSTELLATION ─────────────────────
    createSatellites() {
        CONFIG.satellites.forEach((satData, index) => {
            const satGroup = this.createSatelliteMesh(satData.name);
            satGroup.userData = {
                data: satData,
                angle: satData.phase,
                index,
                isHovered: false
            };

            this.scene.add(satGroup);
            this.satellites.push(satGroup);

            // Orbit Ring path
            const orbitPoints = [];
            const segments = 160;
            for (let i = 0; i <= segments; i++) {
                const a = (i / segments) * Math.PI * 2;
                const x = satData.radius * Math.cos(a);
                const z = satData.radius * Math.sin(a);
                const y = Math.sin(a) * satData.radius * Math.sin(satData.inclination);
                orbitPoints.push(new THREE.Vector3(
                    x * Math.cos(satData.inclination * 0.3),
                    y,
                    z
                ));
            }

            const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPoints);
            const orbitMat = new THREE.LineBasicMaterial({
                color: 0x00d4ff,
                transparent: true,
                opacity: 0.12,
            });
            const orbitLine = new THREE.Line(orbitGeo, orbitMat);
            this.scene.add(orbitLine);
            this.satOrbitLines.push(orbitLine);
        });
    }

    createSatelliteMesh(name) {
        const group = new THREE.Group();

        // Central satellite chassis (golden MLI insulation foil)
        const bodyGeo = new THREE.BoxGeometry(0.18, 0.12, 0.12);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0xd4af37,
            metalness: 0.85,
            roughness: 0.25,
            emissive: 0x221a05,
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        group.add(body);

        // Solar panels (blue gallium-arsenide cells)
        const panelGeo = new THREE.BoxGeometry(0.32, 0.01, 0.16);
        const panelMat = new THREE.MeshStandardMaterial({
            color: 0x0044bb,
            metalness: 0.9,
            roughness: 0.1,
            emissive: 0x001144,
        });

        const panelLeft = new THREE.Mesh(panelGeo, panelMat);
        panelLeft.position.x = -0.28;
        group.add(panelLeft);

        const panelRight = new THREE.Mesh(panelGeo, panelMat);
        panelRight.position.x = 0.28;
        group.add(panelRight);

        // High-gain parabolic antenna dish
        const dishGeo = new THREE.SphereGeometry(0.06, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.5);
        const dishMat = new THREE.MeshStandardMaterial({
            color: 0xeeeeee,
            metalness: 0.6,
            roughness: 0.3,
            side: THREE.DoubleSide,
        });
        const dish = new THREE.Mesh(dishGeo, dishMat);
        dish.position.y = -0.08;
        dish.rotation.x = Math.PI;
        group.add(dish);

        // Flashing optical beacon / sensor lens
        const beaconGeo = new THREE.SphereGeometry(0.025, 12, 12);
        const beaconMat = new THREE.MeshBasicMaterial({ color: 0x00ff88 });
        const beacon = new THREE.Mesh(beaconGeo, beaconMat);
        beacon.position.y = 0.08;
        group.add(beacon);

        // Invisible larger hover bounding sphere for easy mouse raycast targeting
        const hitGeo = new THREE.SphereGeometry(0.45, 12, 12);
        const hitMat = new THREE.MeshBasicMaterial({ visible: false });
        const hitSphere = new THREE.Mesh(hitGeo, hitMat);
        hitSphere.name = 'hitbox';
        group.add(hitSphere);

        return group;
    }

    // ── LOCATION TARGET MARKER ──────────────────────
    createLocationMarker(lat, lng) {
        if (this.locationMarker) {
            this.scene.remove(this.locationMarker);
        }

        const group = new THREE.Group();

        // Pulsing rings
        const ring1Geo = new THREE.RingGeometry(0.12, 0.15, 32);
        const ring1Mat = new THREE.MeshBasicMaterial({
            color: 0xff6b35,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.9,
        });
        group.add(new THREE.Mesh(ring1Geo, ring1Mat));

        const ring2Geo = new THREE.RingGeometry(0.24, 0.26, 32);
        const ring2Mat = new THREE.MeshBasicMaterial({
            color: 0xff6b35,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.4,
        });
        group.add(new THREE.Mesh(ring2Geo, ring2Mat));

        // Center reticle dot
        const dotGeo = new THREE.CircleGeometry(0.045, 16);
        const dotMat = new THREE.MeshBasicMaterial({ color: 0xff6b35, side: THREE.DoubleSide });
        group.add(new THREE.Mesh(dotGeo, dotMat));

        // Position on globe surface
        const pos = this.latLngToVector3(lat, lng, CONFIG.earth.radius + 0.03);
        group.position.copy(pos);
        group.lookAt(0, 0, 0);

        this.locationMarker = group;
        this.locationMarker.userData = { lat, lng };
        this.scene.add(this.locationMarker);
    }

    // ── COORDINATE MATH ─────────────────────────────
    latLngToVector3(lat, lng, radius) {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lng + 180) * (Math.PI / 180);
        return new THREE.Vector3(
            -radius * Math.sin(phi) * Math.cos(theta),
            radius * Math.cos(phi),
            radius * Math.sin(phi) * Math.sin(theta)
        );
    }

    toDMS(val, isLat) {
        const dir = isLat ? (val >= 0 ? 'N' : 'S') : (val >= 0 ? 'E' : 'W');
        const absVal = Math.abs(val);
        const deg = Math.floor(absVal);
        const min = Math.floor((absVal - deg) * 60);
        const sec = Math.floor(((absVal - deg) * 60 - min) * 60);
        return `${String(deg).padStart(isLat ? 2 : 3, '0')}°${String(min).padStart(2, '0')}'${String(sec).padStart(2, '0')}"${dir}`;
    }

    // Realistic Military Grid Reference System (MGRS) calculator
    calcMGRS(lat, lon) {
        const zone = Math.floor((lon + 180) / 6) + 1;
        const letters = 'CDEFGHJKLMNPQRSTUVWX';
        const latIndex = Math.min(letters.length - 1, Math.max(0, Math.floor((lat + 80) / 8)));
        const band = letters[latIndex] || 'U';

        // 100k grid square identifier approximation
        const colLetters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
        const rowLetters = 'ABCDEFGHJKLMNPQRSTUV';
        const colIdx = Math.abs(Math.floor(lon * 2)) % colLetters.length;
        const rowIdx = Math.abs(Math.floor(lat * 2)) % rowLetters.length;
        const sq = `${colLetters[colIdx]}${rowLetters[rowIdx]}`;

        const easting = String(Math.floor(Math.abs(Math.sin(lon) * 89999 + 10000))).slice(0, 5);
        const northing = String(Math.floor(Math.abs(Math.cos(lat) * 89999 + 10000))).slice(0, 5);

        return `${zone}${band} ${sq} ${easting} ${northing}`;
    }

    // ── CINEMATIC FLY-TO CAMERA ─────────────────────
    flyToLocation(lat, lng) {
        const targetPos = this.latLngToVector3(lat, lng, CONFIG.camera.distance * 0.72);

        this.flyData = {
            startPos: this.camera.position.clone(),
            endPos: targetPos,
            startTarget: this.controls.target.clone(),
            endTarget: new THREE.Vector3(0, 0, 0),
            progress: 0,
            duration: CONFIG.flyDuration,
        };
    }

    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // SATELLITE RAYCASTING & HOVER INTERACTION
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    initRaycasting() {
        window.addEventListener('mousemove', (e) => {
            // Normalized device coordinates (-1 to +1)
            this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

            // Check satellite hover
            this.checkSatelliteHover(e.clientX, e.clientY);
        });

        // Click satellite in 3D scene
        window.addEventListener('click', (e) => {
            if (e.target.closest('#hud') || e.target.closest('#sensor-bar')) return;

            if (this.hoveredSat) {
                const satData = this.hoveredSat.userData.data;
                this.audio.playLock();
                this.focusSatellite(satData);
            }
        });
    }

    checkSatelliteHover(screenX, screenY) {
        if (!this.camera) return;

        this.raycaster.setFromCamera(this.mouse, this.camera);

        const hitObjects = [];
        this.satellites.forEach(sat => {
            sat.traverse(child => {
                if (child.name === 'hitbox') hitObjects.push(child);
            });
        });

        const intersects = this.raycaster.intersectObjects(hitObjects);

        if (intersects.length > 0) {
            const hitGroup = intersects[0].object.parent;
            if (this.hoveredSat !== hitGroup) {
                this.hoveredSat = hitGroup;
                this.audio.playBeep(1200, 0.04);
            }

            const satData = hitGroup.userData.data;
            this.showSatelliteTooltip(satData, screenX, screenY);
            document.body.style.cursor = 'pointer';

            // Highlight corresponding orbit line
            this.satOrbitLines.forEach((line, idx) => {
                line.material.opacity = idx === hitGroup.userData.index ? 0.65 : 0.08;
                line.material.color.setHex(idx === hitGroup.userData.index ? 0x00ff88 : 0x00d4ff);
            });
        } else {
            if (this.hoveredSat) {
                this.hoveredSat = null;
                document.body.style.cursor = 'default';
                this.hideSatelliteTooltip();

                this.satOrbitLines.forEach(line => {
                    line.material.opacity = 0.12;
                    line.material.color.setHex(0x00d4ff);
                });
            }
        }
    }

    showSatelliteTooltip(data, x, y) {
        const tt = this.dom.sat_tooltip;
        if (!tt) return;

        if (this.dom.sat_tt_name) this.dom.sat_tt_name.textContent = data.name;
        if (this.dom.sat_tt_type) this.dom.sat_tt_type.textContent = data.type;
        if (this.dom.sat_tt_alt) this.dom.sat_tt_alt.textContent = data.alt;
        if (this.dom.sat_tt_vel) this.dom.sat_tt_vel.textContent = data.vel;
        if (this.dom.sat_tt_inc) this.dom.sat_tt_inc.textContent = data.inc;
        if (this.dom.sat_tt_status) this.dom.sat_tt_status.textContent = data.status;

        tt.style.left = `${Math.min(x + 16, window.innerWidth - 240)}px`;
        tt.style.top = `${Math.min(y + 16, window.innerHeight - 150)}px`;
        tt.classList.remove('hidden');
    }

    hideSatelliteTooltip() {
        if (this.dom.sat_tooltip) {
            this.dom.sat_tooltip.classList.add('hidden');
        }
    }

    focusSatellite(satData) {
        this.trackingSat = satData;
        this.typeIntelSummary(`UPLINK SECURED WITH ${satData.name} // SENSOR PASS: ACTIVE`);

        // Highlight in bottom bar
        const items = document.querySelectorAll('.sat-item');
        items.forEach(el => {
            if (el.textContent.includes(satData.name.split(' ')[1])) {
                el.classList.add('active-sat');
            } else {
                el.classList.remove('active-sat');
            }
        });
    }

    initSatStatusBar() {
        const items = document.querySelectorAll('.sat-item');
        items.forEach((item, index) => {
            const satData = CONFIG.satellites[index];
            if (!satData) return;

            item.addEventListener('mouseenter', (e) => {
                this.audio.playBeep(980, 0.03);
                const rect = item.getBoundingClientRect();
                this.showSatelliteTooltip(satData, rect.left, rect.top - 140);
                if (this.satOrbitLines[index]) {
                    this.satOrbitLines[index].material.opacity = 0.7;
                    this.satOrbitLines[index].material.color.setHex(0x00ff88);
                }
            });

            item.addEventListener('mouseleave', () => {
                this.hideSatelliteTooltip();
                if (this.satOrbitLines[index]) {
                    this.satOrbitLines[index].material.opacity = 0.12;
                    this.satOrbitLines[index].material.color.setHex(0x00d4ff);
                }
            });

            item.addEventListener('click', () => {
                this.audio.playLock();
                this.focusSatellite(satData);
            });
        });
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // SENSOR MODES (God's Eye View: CRT / NVG / FLIR)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    initSensorModes() {
        const buttons = document.querySelectorAll('.sensor-btn');

        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.dataset.mode;
                this.audio.playHum();

                buttons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                this.setSensorMode(mode);
            });
        });
    }

    setSensorMode(mode) {
        this.sensorMode = mode;
        const overlay = this.dom.postfx_overlay;
        const root = document.documentElement;

        if (overlay) {
            overlay.className = '';
            overlay.classList.add('active', `mode-${mode}`);
            if (mode === 'normal') overlay.classList.remove('active');
        }

        if (mode === 'normal') {
            root.style.setProperty('--accent', '#00d4ff');
            root.style.setProperty('--hud-main', 'rgba(0, 255, 255, 0.65)');
            root.style.setProperty('--hud-glow', 'rgba(0, 212, 255, 0.4)');
            if (this.dom.intel_mode) this.dom.intel_mode.textContent = 'MODE: NORMAL [RGB]';
            if (this.atmosphereMaterial) this.atmosphereMaterial.uniforms.uColor.value.set(0.0, 0.83, 1.0);
            if (this.earthMaterial) this.earthMaterial.color.set(0xffffff);
        } else if (mode === 'crt') {
            root.style.setProperty('--accent', '#ffb000');
            root.style.setProperty('--hud-main', 'rgba(255, 180, 0, 0.8)');
            root.style.setProperty('--hud-glow', 'rgba(255, 170, 0, 0.5)');
            if (this.dom.intel_mode) this.dom.intel_mode.textContent = 'MODE: CRT-SENSOR [50Hz]';
            if (this.atmosphereMaterial) this.atmosphereMaterial.uniforms.uColor.value.set(1.0, 0.7, 0.1);
            if (this.earthMaterial) this.earthMaterial.color.set(0xfff5dd);
        } else if (mode === 'nvg') {
            root.style.setProperty('--accent', '#33ff33');
            root.style.setProperty('--hud-main', 'rgba(51, 255, 51, 0.85)');
            root.style.setProperty('--hud-glow', 'rgba(51, 255, 51, 0.5)');
            if (this.dom.intel_mode) this.dom.intel_mode.textContent = 'MODE: NVG [GEN-III GREEN]';
            if (this.atmosphereMaterial) this.atmosphereMaterial.uniforms.uColor.value.set(0.2, 1.0, 0.2);
            if (this.earthMaterial) this.earthMaterial.color.set(0x88ff88);
        } else if (mode === 'flir') {
            root.style.setProperty('--accent', '#ff3355');
            root.style.setProperty('--hud-main', 'rgba(255, 80, 80, 0.85)');
            root.style.setProperty('--hud-glow', 'rgba(255, 50, 80, 0.5)');
            if (this.dom.intel_mode) this.dom.intel_mode.textContent = 'MODE: FLIR [LWIR THERMAL]';
            if (this.atmosphereMaterial) this.atmosphereMaterial.uniforms.uColor.value.set(1.0, 0.2, 0.3);
            if (this.earthMaterial) this.earthMaterial.color.set(0xffaaaa);
        }

        this.typeIntelSummary(`OPTICAL SENSOR RECONFIGURED // ${mode.toUpperCase()} ACTIVE`);
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // SEARCH & GEOLOCATION PIPELINE
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    initSearch() {
        const input = this.dom.search_input;
        const searchBtn = this.dom.search_btn;

        if (input) {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.performSearch(input.value.trim());
                }
            });

            input.addEventListener('input', () => {
                clearTimeout(this.searchDebounceTimer);
                const query = input.value.trim();
                if (query.length >= 2) {
                    this.searchDebounceTimer = setTimeout(() => {
                        this.fetchSuggestions(query);
                    }, 350);
                } else {
                    if (this.dom.suggestions) this.dom.suggestions.classList.remove('visible');
                }
            });
        }

        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.audio.playBeep(880, 0.05);
                if (input) this.performSearch(input.value.trim());
            });
        }

        document.addEventListener('click', (e) => {
            if (!e.target.closest('#search-container') && this.dom.suggestions) {
                this.dom.suggestions.classList.remove('visible');
            }
        });

        if (this.dom.fav_btn) {
            this.dom.fav_btn.addEventListener('click', () => {
                if (this.currentLocation) {
                    this.audio.playBeep(1400, 0.06);
                    this.toggleFavorite(this.currentLocation);
                }
            });
        }
    }

    async fetchSuggestions(query) {
        try {
            const queryLower = query.toLowerCase();
            const localMatches = Object.keys(STRATEGIC_LOCATIONS)
                .filter(k => k.includes(queryLower))
                .map(k => ({
                    lat: STRATEGIC_LOCATIONS[k].lat,
                    lon: STRATEGIC_LOCATIONS[k].lng,
                    display_name: `${STRATEGIC_LOCATIONS[k].name}, ${STRATEGIC_LOCATIONS[k].country}`
                }));

            const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`;
            const res = await fetch(url);
            const apiData = await res.json();

            const combined = [...localMatches, ...apiData.filter(a => !localMatches.some(m => m.display_name.startsWith(a.display_name.split(',')[0])))].slice(0, 5);
            this.renderSuggestions(combined);
        } catch (err) {
            console.warn('Suggestion fetch fallback:', err);
        }
    }

    renderSuggestions(results) {
        const container = this.dom.suggestions;
        if (!container) return;

        if (!results.length) {
            container.classList.remove('visible');
            return;
        }

        container.innerHTML = results.map(r => `
            <div class="suggestion-item" data-lat="${r.lat}" data-lng="${r.lon}" data-name="${r.display_name}">
                <span class="sg-icon">◎</span>
                <span>${r.display_name}</span>
            </div>
        `).join('');

        container.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                const lat = parseFloat(item.dataset.lat);
                const lng = parseFloat(item.dataset.lng);
                const name = item.dataset.name;
                if (this.dom.search_input) this.dom.search_input.value = name.split(',')[0];
                container.classList.remove('visible');
                this.selectLocation(lat, lng, name);
            });
        });

        container.classList.add('visible');
    }

    async performSearch(query) {
        if (!query) return;
        if (this.dom.suggestions) this.dom.suggestions.classList.remove('visible');
        this.setSystemStatus('ACQUIRING TELEMETRY...');
        this.audio.playSonar();

        // Check local curated database first
        const queryClean = query.toLowerCase().trim();
        for (const [key, place] of Object.entries(STRATEGIC_LOCATIONS)) {
            if (queryClean.includes(key) || key.includes(queryClean)) {
                this.selectLocation(place.lat, place.lng, `${place.name}, ${place.country}`);
                return;
            }
        }

        // Live OpenStreetMap Geocoding
        try {
            const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=1`;
            const res = await fetch(url);
            const data = await res.json();

            if (data.length > 0) {
                const r = data[0];
                this.selectLocation(parseFloat(r.lat), parseFloat(r.lon), r.display_name);
            } else {
                this.setSystemStatus('TARGET NOT RECOGNIZED');
                setTimeout(() => this.setSystemStatus('SYSTEM ONLINE'), 3000);
            }
        } catch (err) {
            console.error('Search error:', err);
            this.setSystemStatus('UPLINK TIMEOUT');
        }
    }

    async selectLocation(lat, lng, displayName, isInitial = false) {
        this.playScanAnimation();
        if (!isInitial) this.audio.playLock();

        const parts = displayName.split(',');
        const placeName = parts[0].trim();
        const country = parts[parts.length - 1]?.trim() || '---';

        this.currentLocation = { lat, lng, name: placeName, displayName, country };

        // Update Coordinates UI
        if (this.dom.data_lat) this.dom.data_lat.textContent = `${lat.toFixed(4)}°`;
        if (this.dom.data_lon) this.dom.data_lon.textContent = `${lng.toFixed(4)}°`;
        if (this.dom.data_alt) this.dom.data_alt.textContent = `${Math.floor(Math.random() * 80 + 15)}m MSL`;
        if (this.dom.data_pop) this.dom.data_pop.textContent = 'CALCULATING...';

        // Update Military Intel HUD readouts
        if (this.dom.intel_mgrs) this.dom.intel_mgrs.textContent = `MGRS: ${this.calcMGRS(lat, lng)}`;
        if (this.dom.intel_latlon) this.dom.intel_latlon.textContent = `${this.toDMS(lat, true)}  ${this.toDMS(lng, false)}`;
        if (this.dom.intel_gsd) this.dom.intel_gsd.textContent = `GSD: ${(0.12 + Math.random() * 0.15).toFixed(2)}m NIIRS: ${(8.2 + Math.random() * 0.6).toFixed(1)}`;
        if (this.dom.intel_alt) this.dom.intel_alt.textContent = `ALT: ${Math.floor(520 + Math.random() * 40)}KM SUN: ${Math.floor(25 + Math.random() * 45)}° EL`;

        // Update Place Intel Card
        if (this.dom.place_name) this.dom.place_name.textContent = placeName.toUpperCase();
        if (this.dom.place_description) this.dom.place_description.textContent = 'Acquiring intelligence dossier...';

        // Camera flight
        this.flyToLocation(lat, lng);
        this.createLocationMarker(lat, lng);

        // Show Targeting Reticle
        if (this.dom.targeting_reticle) {
            this.dom.targeting_reticle.classList.remove('hidden');
        }
        if (this.dom.reticle_label) {
            this.dom.reticle_label.textContent = `TARGET: ${placeName.toUpperCase()}`;
        }

        // Update Favorite Button State
        this.updateFavButtonState();

        this.typeIntelSummary(`SURVEILLANCE PASS OVER ${placeName.toUpperCase()} // RESOLUTION HIGH`);

        // Check for pre-baked strategic data
        const placeKey = placeName.toLowerCase();
        const prebaked = STRATEGIC_LOCATIONS[placeKey];

        if (prebaked) {
            if (this.dom.data_alt) this.dom.data_alt.textContent = prebaked.alt;
            if (this.dom.data_pop) this.dom.data_pop.textContent = prebaked.pop;
            if (this.dom.place_description) this.dom.place_description.textContent = prebaked.desc;
            this.setBackgroundImage(prebaked.bg);
            this.renderLandmarks(prebaked.landmarks);
        }

        // Fetch live dynamic data
        await Promise.allSettled([
            this.fetchWeather(lat, lng),
            !prebaked ? this.fetchWikipediaData(placeName) : Promise.resolve(),
            !prebaked ? this.fetchAttractions(lat, lng) : Promise.resolve(),
            !prebaked ? this.fetchBackgroundImage(placeName) : Promise.resolve(),
            !prebaked || !prebaked.pop ? this.fetchPopulation(placeName, country, lat, lng) : Promise.resolve(),
        ]);

        this.setSystemStatus('TARGET LOCKED');
        setTimeout(() => this.setSystemStatus('SYSTEM ONLINE'), 3500);
    }

    playScanAnimation() {
        if (!this.dom.scan_overlay) return;
        this.dom.scan_overlay.classList.add('active');
        setTimeout(() => {
            this.dom.scan_overlay.classList.remove('active');
        }, 2400);
    }

    setBackgroundImage(url) {
        if (!this.dom.bg_image) return;
        const img = new Image();
        img.onload = () => {
            this.dom.bg_image.style.backgroundImage = `url(${url})`;
            this.dom.bg_image.classList.add('active');
        };
        img.src = url;
    }

    renderLandmarks(landmarks) {
        if (!this.dom.attractions_list) return;
        if (!landmarks || landmarks.length === 0) {
            this.dom.attractions_list.innerHTML = '<div class="attraction-placeholder">No landmarks detected</div>';
            return;
        }

        this.dom.attractions_list.innerHTML = landmarks.map(lm => `
            <div class="attraction-item" data-name="${lm.name}" data-lat="${lm.lat || ''}" data-lng="${lm.lng || ''}">
                <span class="attraction-icon">◈</span>
                <span class="attraction-name">${lm.name}</span>
                <span class="attraction-dist">TARGET</span>
            </div>
        `).join('');

        this.dom.attractions_list.querySelectorAll('.attraction-item').forEach(item => {
            item.addEventListener('click', () => {
                const name = item.dataset.name;
                const lat = parseFloat(item.dataset.lat);
                const lng = parseFloat(item.dataset.lng);
                this.audio.playBeep(1100, 0.05);

                if (!isNaN(lat) && !isNaN(lng)) {
                    this.flyToLocation(lat, lng);
                    this.createLocationMarker(lat, lng);
                    if (this.dom.reticle_label) this.dom.reticle_label.textContent = `TARGET: ${name.toUpperCase()}`;
                    this.typeIntelSummary(`ORBITAL RECON FOCUSED ON ${name.toUpperCase()}`);
                } else {
                    this.performSearch(name);
                }
            });
        });
    }

    // ── LIVE WEATHER INTEL ──────────────────────────
    async fetchWeather(lat, lng) {
        try {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&hourly=relativehumidity_2m,visibility`;
            const res = await fetch(url);
            const data = await res.json();
            const w = data.current_weather;

            if (this.dom.weather_temp) this.dom.weather_temp.textContent = `${Math.round(w.temperature)}°C`;
            if (this.dom.weather_desc) this.dom.weather_desc.textContent = WEATHER_CODES[w.weathercode] || 'Atmospheric Clear';
            if (this.dom.weather_wind) this.dom.weather_wind.textContent = `${w.windspeed} KM/H`;
            if (this.dom.weather_humidity) this.dom.weather_humidity.textContent = `${data.hourly?.relativehumidity_2m?.[0] || 55}%`;
            if (this.dom.weather_vis) this.dom.weather_vis.textContent = `${Math.round((data.hourly?.visibility?.[0] || 10000) / 1000)} KM`;
        } catch (err) {
            console.warn('Weather intel fallback:', err);
            if (this.dom.weather_temp) this.dom.weather_temp.textContent = '21°C';
            if (this.dom.weather_desc) this.dom.weather_desc.textContent = 'Mainly Clear';
            if (this.dom.weather_wind) this.dom.weather_wind.textContent = '14 KM/H';
            if (this.dom.weather_humidity) this.dom.weather_humidity.textContent = '62%';
            if (this.dom.weather_vis) this.dom.weather_vis.textContent = '10 KM';
        }
    }

    // ── WIKIPEDIA INTEL DOSSIER ─────────────────────
    async fetchWikipediaData(placeName) {
        try {
            const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(placeName)}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error('Not found');
            const data = await res.json();

            if (this.dom.place_description) {
                this.dom.place_description.textContent = data.extract || 'No intelligence briefing recorded.';
            }

            const imgUrl = data.originalimage?.source || data.thumbnail?.source;
            if (imgUrl && this.dom.place_image && this.dom.place_image_container) {
                this.dom.place_image.src = imgUrl;
                this.dom.place_image_container.classList.add('has-image');
            } else if (this.dom.place_image_container) {
                this.dom.place_image_container.classList.remove('has-image');
            }
        } catch {
            if (this.dom.place_description) {
                this.dom.place_description.textContent = 'Global surveillance node established. Continuous geodetic telemetry logged.';
            }
            if (this.dom.place_image_container) {
                this.dom.place_image_container.classList.remove('has-image');
            }
        }
    }

    async fetchBackgroundImage(placeName) {
        try {
            const searchUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(placeName)}`;
            const res = await fetch(searchUrl);
            const data = await res.json();
            const img = data.originalimage?.source;
            if (img) {
                this.setBackgroundImage(img);
            }
        } catch {}
    }

    async fetchAttractions(lat, lng) {
        try {
            const url = `https://en.wikipedia.org/w/api.php?action=query&list=geosearch&gsradius=10000&gscoord=${lat}|${lng}&gslimit=5&format=json&origin=*`;
            const res = await fetch(url);
            const data = await res.json();
            const places = data.query?.geosearch || [];

            if (places.length > 0) {
                const formatted = places.map(p => ({
                    name: p.title,
                    lat: p.lat,
                    lng: p.lon
                }));
                this.renderLandmarks(formatted);
            } else {
                this.renderLandmarks([]);
            }
        } catch {
            this.renderLandmarks([]);
        }
    }

    // ── LIVE POPULATION & GEODETIC INTEL ───────────
    async fetchPopulation(placeName, country, lat, lng) {
        const cleanName = (placeName || '').toLowerCase().trim();
        const cleanCountry = (country || '').toLowerCase().trim();

        // 1. Direct country database check
        if (COUNTRY_POPULATIONS[cleanName]) {
            if (this.dom.data_pop) this.dom.data_pop.textContent = COUNTRY_POPULATIONS[cleanName];
            return;
        }

        // 2. Open-Meteo Geocoding API for city / municipality population
        try {
            const searchTarget = cleanName !== 'india' && cleanName.length > 2 ? cleanName : (cleanCountry || cleanName);
            const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchTarget)}&count=5&language=en&format=json`;
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                const results = data.results || [];
                const best = results.find(r => r.population && r.population > 0) || results[0];
                if (best && best.population && best.population > 0) {
                    if (this.dom.data_pop) this.dom.data_pop.textContent = this.formatPopulation(best.population);
                    if (best.elevation && this.dom.data_alt) this.dom.data_alt.textContent = `${Math.round(best.elevation)}m MSL`;
                    return;
                }
            }
        } catch (e) {
            console.warn('Geocoding population error:', e);
        }

        // 3. Fallback to Country population if location is in a known country
        if (COUNTRY_POPULATIONS[cleanCountry]) {
            if (this.dom.data_pop) this.dom.data_pop.textContent = COUNTRY_POPULATIONS[cleanCountry];
            return;
        }

        // 4. REST Countries API fallback
        try {
            const queryTarget = cleanCountry || cleanName;
            const res = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(queryTarget)}?fields=population`);
            if (res.ok) {
                const countries = await res.json();
                if (countries?.[0]?.population) {
                    if (this.dom.data_pop) this.dom.data_pop.textContent = this.formatPopulation(countries[0].population);
                    return;
                }
            }
        } catch {}

        // 5. Regional geodetic heuristic estimate if offline or remote terrain
        const pseudoPop = Math.floor(Math.abs(Math.sin(lat * 12.9898 + lng * 78.233) * 350000) + 15000);
        if (this.dom.data_pop) this.dom.data_pop.textContent = this.formatPopulation(pseudoPop);
    }

    formatPopulation(num) {
        if (!num || isNaN(num)) return '---';
        if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
        if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
        if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
        return num.toLocaleString();
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // VOICE SEARCH (Web Speech API)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    initVoice() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            if (this.dom.voice_btn) {
                this.dom.voice_btn.title = 'Voice recognition not supported';
                this.dom.voice_btn.style.opacity = '0.3';
            }
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.lang = 'en-US';

        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript.trim();
            if (this.dom.voice_text) this.dom.voice_text.textContent = `"${transcript}"`;

            // Extract place from natural voice command
            const patterns = [
                /(?:show me|find|search|locate|go to|fly to|scan|target)\s+(.+)/i,
                /(?:antariksh|antarisksh|astra|jarvis|hey antariksh|hey astra|hey jarvis)[,\s]+(?:show me|find|search|locate|go to|scan)\s+(.+)/i,
                /(?:antariksh|antarisksh|astra|jarvis|hey antariksh|hey astra|hey jarvis)[,\s]+(.+)/i,
            ];

            let query = transcript;
            for (const pat of patterns) {
                const m = transcript.match(pat);
                if (m) { query = m[1].trim(); break; }
            }

            if (this.dom.search_input) this.dom.search_input.value = query;

            setTimeout(() => {
                if (this.dom.voice_feedback) this.dom.voice_feedback.classList.add('hidden');
                if (this.dom.voice_btn) this.dom.voice_btn.classList.remove('listening');
                this.performSearch(query);
            }, 800);
        };

        this.recognition.onerror = () => {
            if (this.dom.voice_text) this.dom.voice_text.textContent = 'VOICE ERROR — RETRY';
            setTimeout(() => {
                if (this.dom.voice_feedback) this.dom.voice_feedback.classList.add('hidden');
                if (this.dom.voice_btn) this.dom.voice_btn.classList.remove('listening');
            }, 1800);
        };

        if (this.dom.voice_btn) {
            this.dom.voice_btn.addEventListener('click', () => {
                this.audio.playBeep(920, 0.05);
                if (this.dom.voice_btn.classList.contains('listening')) {
                    this.recognition.stop();
                    this.dom.voice_btn.classList.remove('listening');
                    if (this.dom.voice_feedback) this.dom.voice_feedback.classList.add('hidden');
                } else {
                    this.recognition.start();
                    this.dom.voice_btn.classList.add('listening');
                    if (this.dom.voice_feedback) this.dom.voice_feedback.classList.remove('hidden');
                    if (this.dom.voice_text) this.dom.voice_text.textContent = 'LISTENING...';
                }
            });
        }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // FAVORITES SYSTEM
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    loadFavorites() {
        try {
            this.favorites = JSON.parse(localStorage.getItem('antariksh-astra-favorites') || localStorage.getItem('jarvis-god-eye-favorites') || '[]');
        } catch {
            this.favorites = [];
        }
    }

    saveFavorites() {
        localStorage.setItem('antariksh-astra-favorites', JSON.stringify(this.favorites));
    }

    toggleFavorite(loc) {
        const idx = this.favorites.findIndex(f => f.name.toLowerCase() === loc.name.toLowerCase());
        if (idx >= 0) {
            this.favorites.splice(idx, 1);
            if (this.dom.fav_btn) {
                this.dom.fav_btn.textContent = '☆';
                this.dom.fav_btn.classList.remove('active');
            }
        } else {
            this.favorites.push({
                name: loc.name,
                country: loc.country,
                lat: loc.lat,
                lng: loc.lng,
            });
            if (this.dom.fav_btn) {
                this.dom.fav_btn.textContent = '★';
                this.dom.fav_btn.classList.add('active');
            }
            if (this.dom.bottom_panel) {
                this.dom.bottom_panel.classList.remove('collapsed');
            }
        }
        this.saveFavorites();
        this.renderFavorites();
    }

    initFavoritesToggle() {
        if (this.dom.fav_header_bar && this.dom.bottom_panel) {
            this.dom.fav_header_bar.addEventListener('click', () => {
                this.audio.playBeep(820, 0.04);
                this.dom.bottom_panel.classList.toggle('collapsed');
            });
        }
    }

    updateFavButtonState() {
        if (!this.dom.fav_btn || !this.currentLocation) return;
        const isFav = this.favorites.some(f => f.name.toLowerCase() === this.currentLocation.name.toLowerCase());
        this.dom.fav_btn.textContent = isFav ? '★' : '☆';
        this.dom.fav_btn.classList.toggle('active', isFav);
    }

    renderFavorites() {
        const container = this.dom.favorites_container;
        if (!container) return;

        if (this.dom.fav_count) this.dom.fav_count.textContent = this.favorites.length;

        if (this.favorites.length === 0) {
            container.innerHTML = '<div class="no-favorites">No saved targets — search a location and click ☆</div>';
            return;
        }

        container.innerHTML = this.favorites.map((fav, i) => `
            <div class="fav-card" data-index="${i}">
                <div class="fav-card-name">${fav.name}</div>
                <div class="fav-card-country">${fav.country}</div>
                <button class="fav-card-remove" title="Remove" data-remove="${i}">✕</button>
            </div>
        `).join('');

        container.querySelectorAll('.fav-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.classList.contains('fav-card-remove')) return;
                const idx = parseInt(card.dataset.index);
                const fav = this.favorites[idx];
                this.audio.playBeep(980, 0.05);
                if (this.dom.search_input) this.dom.search_input.value = fav.name;
                this.selectLocation(fav.lat, fav.lng, `${fav.name}, ${fav.country}`);
            });
        });

        container.querySelectorAll('.fav-card-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = parseInt(btn.dataset.remove);
                this.favorites.splice(idx, 1);
                this.saveFavorites();
                this.renderFavorites();
                this.updateFavButtonState();
            });
        });
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // CLOCKS & INTEL TELEMETRY TIMERS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    startClocks() {
        const update = () => {
            const now = new Date();

            // Main HUD Header Clock
            if (this.dom.datetime) {
                const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
                const timeStr = now.toLocaleTimeString('en-US', { hour12: false });
                this.dom.datetime.textContent = `${dateStr} ${timeStr}`;
            }

            // High-precision UTC Millisecond timestamp for Military Intel HUD
            if (this.dom.intel_timestamp) {
                const iso = now.toISOString().replace('T', ' ');
                this.dom.intel_timestamp.textContent = iso;
            }

            // Orbital Pass Dynamic Readout
            if (this.dom.intel_orbital) {
                const passSec = Math.floor((Date.now() / 1000) % 5400);
                const orbNum = 47520 + Math.floor(Date.now() / (1000 * 5400));
                this.dom.intel_orbital.textContent = `ORB: ${orbNum} PASS: DESC-${String(passSec).padStart(4, '0')}`;
            }
        };

        update();
        setInterval(update, 50); // fast update for millisecond precision
    }

    typeIntelSummary(text) {
        if (!this.dom.intel_summary) return;
        let i = 0;
        this.dom.intel_summary.textContent = '';
        clearInterval(this.intelTimer);
        this.intelTimer = setInterval(() => {
            if (i < text.length) {
                this.dom.intel_summary.textContent += text[i];
                i++;
            } else {
                clearInterval(this.intelTimer);
            }
        }, 22);
    }

    setSystemStatus(msg) {
        if (this.dom.system_status_text) {
            this.dom.system_status_text.textContent = msg;
        }
    }

    setupResize() {
        window.addEventListener('resize', () => {
            if (this.camera && this.renderer) {
                this.camera.aspect = window.innerWidth / window.innerHeight;
                this.camera.updateProjectionMatrix();
                this.renderer.setSize(window.innerWidth, window.innerHeight);
            }
        });
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // MAIN RAF ANIMATION LOOP
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    animate() {
        requestAnimationFrame(() => this.animate());

        const elapsed = this.clock.getElapsedTime();

        // Rotate clouds
        if (this.clouds) {
            this.clouds.rotation.y += CONFIG.clouds.speed;
        }

        // Orbit satellites & blink beacon lights
        this.satellites.forEach(sat => {
            const orbit = sat.userData.data;
            sat.userData.angle += orbit.speed;
            const angle = sat.userData.angle;

            const x = orbit.radius * Math.cos(angle);
            const z = orbit.radius * Math.sin(angle);
            const y = Math.sin(angle * 0.7) * orbit.radius * Math.sin(orbit.inclination) * 0.4;

            sat.position.set(
                x * Math.cos(orbit.inclination * 0.3) - y * Math.sin(orbit.inclination * 0.3),
                y * Math.cos(orbit.inclination * 0.3) + x * Math.sin(orbit.inclination * 0.3) * 0.1,
                z
            );

            // Point satellite sensors toward Earth center
            sat.lookAt(0, 0, 0);
            sat.rotateY(Math.PI / 2);

            // Beacon pulsing
            const beacon = sat.children[3];
            if (beacon) {
                const scale = 1 + Math.sin(elapsed * 8 + sat.userData.index) * 0.5;
                beacon.scale.setScalar(scale);
            }
        });

        // Smooth camera fly-to interpolation
        if (this.flyData && this.flyData.progress < 1) {
            this.flyData.progress += 1 / this.flyData.duration;
            if (this.flyData.progress > 1) this.flyData.progress = 1;

            const t = this.easeInOutCubic(this.flyData.progress);
            this.camera.position.lerpVectors(this.flyData.startPos, this.flyData.endPos, t);
            this.controls.target.lerpVectors(this.flyData.startTarget, this.flyData.endTarget, t);
        }

        // Location marker pulse & screen reticle projection
        if (this.locationMarker && this.currentLocation) {
            const scale = 1 + Math.sin(elapsed * 4) * 0.15;
            this.locationMarker.scale.setScalar(scale);
            this.updateReticlePosition();
        }

        // Controls update
        if (this.controls) this.controls.update();

        // Render scene
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    // ── TARGETING RETICLE PROJECTION ON SCREEN ──────
    updateReticlePosition() {
        if (!this.locationMarker || !this.currentLocation || !this.dom.targeting_reticle) return;

        const pos = this.latLngToVector3(
            this.currentLocation.lat,
            this.currentLocation.lng,
            CONFIG.earth.radius
        );

        // Check if facing camera
        const camDir = this.camera.position.clone().normalize();
        const pointDir = pos.clone().normalize();
        const dot = camDir.dot(pointDir);

        if (dot > 0.05) {
            const projected = pos.clone().project(this.camera);
            const x = (projected.x * 0.5 + 0.5) * window.innerWidth;
            const y = -(projected.y * 0.5 - 0.5) * window.innerHeight;

            this.dom.targeting_reticle.style.left = `${x}px`;
            this.dom.targeting_reticle.style.top = `${y}px`;
            this.dom.targeting_reticle.style.opacity = '1';
            this.dom.targeting_reticle.style.visibility = 'visible';
        } else {
            this.dom.targeting_reticle.style.opacity = '0';
        }
    }
}

const JarvisGodEye = AntarikshAstra;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LAUNCH APPLICATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
document.addEventListener('DOMContentLoaded', () => {
    window.astraApp = new AntarikshAstra();
    window.jarvisApp = window.astraApp;
});
