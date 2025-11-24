export class QiblaView {
    constructor(dependencies) {
        this.state = dependencies.state;
        this.eventBus = dependencies.eventBus;
        this.engine = dependencies.engine;
        this.pluginManager = dependencies.pluginManager;
        this.cleanupCompass = null;
    }

    get translations() {
        return this.pluginManager.get('translations').engine;
    }

    render(container) {
        const trans = this.translations.getAll();
        const rtl = this.translations.isRTL();

        container.innerHTML = `
            <div class="qibla-container" style="min-height: 100vh; background: var(--bg-color); position: relative; overflow: hidden;">
                <!-- Pattern de fond subtil -->
                <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; opacity: 0.02; background-image: repeating-linear-gradient(45deg, var(--primary-color) 0, var(--primary-color) 1px, transparent 0, transparent 50%); background-size: 10px 10px; pointer-events: none;"></div>
                
                <div class="max-w-md mx-auto h-full flex flex-col" style="padding: 1.5rem 1rem; min-height: 100vh;">
                    <!-- Header -->
                    <div class="flex items-center justify-between mb-8" dir="${rtl ? 'rtl' : 'ltr'}" style="position: relative; z-index: 10;">
                        <button data-action="go-back" class="btn btn-secondary" style="display: flex; align-items: center; gap: 0.5rem; font-weight: 500;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="${rtl ? 'M9 18l6-6-6-6' : 'M15 18l-6-6 6-6'}"/>
                            </svg>
                            <span>${trans.back || 'Retour'}</span>
                        </button>
                        <h1 class="text-xl font-bold" style="color: var(--heading-color); letter-spacing: -0.02em;">🕋 ${trans.qiblaDirection || 'Qibla'}</h1>
                        <div style="width: 80px;"></div>
                    </div>

                    <!-- Compass Section -->
                    <div class="flex-1 flex flex-col items-center justify-center" style="gap: 2rem; animation: fadeIn 0.3s ease-in;">
                        
                        <!-- Compass Container avec effet 3D -->
                        <div style="position: relative; width: 320px; height: 320px; perspective: 1000px;">
                            
                            <!-- Anneau externe décoratif -->
                            <div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background: linear-gradient(135deg, var(--primary-light) 0%, transparent 50%); opacity: 0.2;"></div>
                            
                            <!-- Cercle de fond avec gradient -->
                            <div style="position: absolute; inset: 10px; border-radius: 50%; background: linear-gradient(135deg, var(--card-bg) 0%, var(--primary-light) 100%); box-shadow: var(--shadow-lg), inset 0 2px 8px rgba(0,0,0,0.05);"></div>
                            
                            <!-- Compass Dial (cadran qui tourne) -->
                            <div id="compass-dial" 
                                 style="
                                    position: absolute;
                                    inset: 20px;
                                    border-radius: 50%;
                                    background: var(--card-bg);
                                    border: 3px solid var(--primary-color);
                                    box-shadow: 0 4px 12px rgba(0,0,0,0.1), inset 0 1px 3px rgba(255,255,255,0.3);
                                    transition: transform 0.3s ease-out;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                ">
                                <!-- Points cardinaux -->
                                <div style="position: absolute; top: 15px; left: 50%; transform: translateX(-50%); font-weight: 700; font-size: 1.25rem; color: var(--primary-color);">N</div>
                                <div style="position: absolute; bottom: 15px; left: 50%; transform: translateX(-50%); font-weight: 600; font-size: 1rem; color: var(--text-muted);">S</div>
                                <div style="position: absolute; right: 15px; top: 50%; transform: translateY(-50%); font-weight: 600; font-size: 1rem; color: var(--text-muted);">E</div>
                                <div style="position: absolute; left: 15px; top: 50%; transform: translateY(-50%); font-weight: 600; font-size: 1rem; color: var(--text-muted);">W</div>
                                
                                <!-- Graduations (petites marques) -->
                                ${this.renderCompassMarks()}
                                
                                <!-- Centre point -->
                                <div style="width: 16px; height: 16px; border-radius: 50%; background: var(--primary-color); box-shadow: 0 2px 6px rgba(0,0,0,0.2); z-index: 20;"></div>
                            </div>

                            <!-- Flèche Qibla (rotation indépendante) -->
                            <div id="qibla-arrow" 
                                 style="
                                    position: absolute;
                                    inset: 20px;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
                                    pointer-events: none;
                                ">
                                <div style="position: relative; width: 100%; height: 100%;">
                                    <!-- Kaaba Icon -->
                                    <div style="position: absolute; top: 25px; left: 50%; transform: translateX(-50%); font-size: 3rem; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2)); z-index: 15;">
                                        🕋
                                    </div>
                                    
                                    <!-- Flèche principale -->
                                    <div style="position: absolute; top: 50%; left: 50%; width: 0; height: 0; border-left: 12px solid transparent; border-right: 12px solid transparent; border-bottom: 80px solid var(--primary-color); transform: translate(-50%, -100%); filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2)); opacity: 0.5; z-index: 10;"></div>
                                    
                                    <!-- Label "Qibla" -->
                                    <div style="position: absolute; top: 80px; left: 50%; transform: translateX(-50%); font-size: 0.75rem; font-weight: 700; color: var(--primary-color); text-transform: uppercase; letter-spacing: 0.1em; background: var(--card-bg); padding: 0.25rem 0.75rem; border-radius: 12px; box-shadow: var(--shadow-sm); z-index: 15;">
                                        QIBLA
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Status Message -->
                        <div id="status-message" class="card" style="width: 100%; max-width: 380px; padding: 1rem; text-align: center; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                            <div class="loading-spinner" style="width: 20px; height: 20px; border: 3px solid var(--border-color); border-top-color: var(--primary-color); border-radius: 50%; animation: spin 1s linear infinite;"></div>
                            <span style="color: var(--text-muted); font-size: 0.875rem;">${trans.detectingLocation || 'Détection de votre position...'}</span>
                        </div>

                        <!-- Info Cards Grid -->
                        <div style="width: 100%; max-width: 380px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem;">
                            <!-- Angle Card -->
                            <div class="card" style="padding: 1rem; text-align: center; border-top: 3px solid var(--primary-color);">
                                <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 0.5rem;">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" stroke-width="2">
                                        <circle cx="12" cy="12" r="10"/>
                                        <polyline points="12 6 12 12 16 14"/>
                                    </svg>
                                </div>
                                <p style="font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 0.25rem; font-weight: 600;">${trans.qiblaAngle || 'Angle'}</p>
                                <p id="qibla-angle-val" style="font-size: 1.5rem; font-weight: 700; color: var(--primary-color); font-family: 'Courier New', monospace;">--°</p>
                            </div>
                            
                            <!-- Distance Card -->
                            <div class="card" style="padding: 1rem; text-align: center; border-top: 3px solid var(--accent-color);">
                                <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 0.5rem;">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" stroke-width="2">
                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                        <circle cx="12" cy="10" r="3"/>
                                    </svg>
                                </div>
                                <p style="font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 0.25rem; font-weight: 600;">${trans.distance || 'Distance'}</p>
                                <p id="qibla-distance-val" style="font-size: 1.25rem; font-weight: 700; color: var(--accent-color); font-family: 'Courier New', monospace;">--</p>
                            </div>
                            
                            <!-- Precision Card -->
                            <div class="card" style="padding: 1rem; text-align: center; border-top: 3px solid #10b981;">
                                <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 0.5rem;">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2">
                                        <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/>
                                        <circle cx="12" cy="10" r="3"/>
                                    </svg>
                                </div>
                                <p style="font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 0.25rem; font-weight: 600;">${trans.accuracy || 'Précision'}</p>
                                <p id="gps-accuracy-val" style="font-size: 1.25rem; font-weight: 700; color: #10b981; font-family: 'Courier New', monospace;">--</p>
                            </div>
                        </div>

                        <!-- Calibration Warning -->
                        <div id="calibration-msg" class="card hidden" style="width: 100%; max-width: 380px; padding: 1rem; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-left: 4px solid #f59e0b;">
                            <div style="display: flex; align-items: center; gap: 0.75rem;">
                                <div style="font-size: 2rem; flex-shrink: 0;">⚠️</div>
                                <div>
                                    <p style="font-weight: 700; color: #92400e; margin-bottom: 0.25rem; font-size: 0.875rem;">Calibration nécessaire</p>
                                    <p style="color: #92400e; font-size: 0.75rem; line-height: 1.4;">${trans.calibrateDevice || 'Bougez votre appareil en forme de 8 pour calibrer la boussole'}</p>
                                </div>
                            </div>
                        </div>

                        <!-- Permission Button -->
                        <button id="btn-request-permission" class="hidden btn" style="width: 100%; max-width: 380px; background: var(--primary-color); color: white; display: flex; align-items: center; justify-content: center; gap: 0.5rem; font-weight: 600; font-size: 1rem;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                            Autoriser la boussole
                        </button>

                        <!-- Info Card -->
                        <div class="card" style="width: 100%; max-width: 380px; padding: 1rem; background: var(--primary-light); border-left: 4px solid var(--primary-color);">
                            <div style="display: flex; align-items: start; gap: 0.75rem;">
                                <div style="font-size: 1.5rem; flex-shrink: 0;">💡</div>
                                <div>
                                    <p style="font-weight: 700; color: var(--primary-color); margin-bottom: 0.25rem; font-size: 0.875rem;">Conseil</p>
                                    <p style="color: var(--text-color); font-size: 0.75rem; line-height: 1.4;">Tenez votre téléphone à plat et tournez-vous jusqu'à ce que la Kaaba soit alignée avec le Nord (N).</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.attachEventListeners(container);
        this.initQibla();
    }

    renderCompassMarks() {
        let marks = '';
        for (let i = 0; i < 36; i++) {
            const angle = i * 10;
            const isMain = i % 9 === 0; // Every 90 degrees
            const isMajor = i % 3 === 0; // Every 30 degrees
            const length = isMain ? 0 : (isMajor ? 8 : 4);
            const width = isMajor ? 2 : 1;
            const opacity = isMajor ? 0.4 : 0.2;
            
            if (length > 0) {
                marks += `
                    <div style="
                        position: absolute;
                        top: ${length}px;
                        left: 50%;
                        width: ${width}px;
                        height: ${length}px;
                        background: var(--text-muted);
                        opacity: ${opacity};
                        transform: translateX(-50%) rotate(${angle}deg);
                        transform-origin: center ${140 - length}px;
                    "></div>
                `;
            }
        }
        return marks;
    }

    attachEventListeners(container) {
        container.addEventListener('click', (e) => {
            const target = e.target.closest('[data-action]');
            if (!target) return;

            if (target.dataset.action === 'go-back') {
                this.stopCompass();
                this.state.set('currentView', 'muslim-tools');
                this.eventBus.emit('view:change', 'muslim-tools');
            }
        });

        const btnPermission = container.querySelector('#btn-request-permission');
        if (btnPermission) {
            btnPermission.addEventListener('click', async () => {
                const granted = await this.engine.requestCompassPermission();
                if (granted) {
                    btnPermission.classList.add('hidden');
                    this.startCompass();
                }
            });
        }
    }

    async initQibla() {
        try {
            const statusMsg = document.getElementById('status-message');
            const location = await this.engine.getUserLocation();
            const angle = this.engine.calculateQiblaDirection(location.lat, location.lon);
            const distance = this.engine.calculateDistance(location.lat, location.lon);

            this.updateUI(angle, distance, location.accuracy);
            
            // Hide status message
            if (statusMsg) {
                statusMsg.style.display = 'none';
            }

            // Check permission for iOS 13+
            if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
                document.getElementById('btn-request-permission').classList.remove('hidden');
            } else {
                this.startCompass();
            }

        } catch (error) {
            console.error('Qibla Error:', error);
            const statusMsg = document.getElementById('status-message');
            if (statusMsg) {
                statusMsg.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span style="font-size: 1.5rem;">⚠️</span>
                        <span style="color: var(--text-color); font-size: 0.875rem; font-weight: 600;">${this.translations.getAll().locationError || 'Erreur de localisation'}</span>
                    </div>
                `;
            }
            document.getElementById('qibla-angle-val').textContent = '--°';
        }
    }

    updateUI(qiblaAngle, distance, accuracy) {
        document.getElementById('qibla-angle-val').textContent = Math.round(qiblaAngle) + '°';
        document.getElementById('qibla-distance-val').textContent = distance.toLocaleString() + ' km';
        document.getElementById('gps-accuracy-val').textContent = Math.round(accuracy) + ' m';

        // Store qibla angle for compass rotation logic
        this.qiblaAngle = qiblaAngle;
    }

    startCompass() {
        // Show calibration message initially
        const calibMsg = document.getElementById('calibration-msg');
        if (calibMsg) {
            calibMsg.classList.remove('hidden');
            setTimeout(() => {
                calibMsg.classList.add('hidden');
            }, 5000);
        }

        this.cleanupCompass = this.engine.startCompass((heading) => {
            const dial = document.getElementById('compass-dial');
            const arrow = document.getElementById('qibla-arrow');

            if (dial && arrow && this.qiblaAngle !== undefined) {
                // Rotate dial to show North at top
                dial.style.transform = `rotate(${-heading}deg)`;
                
                // Rotate arrow to point to Qibla
                arrow.style.transform = `rotate(${-heading + this.qiblaAngle}deg)`;
            }
        });
    }

    stopCompass() {
        if (this.cleanupCompass) {
            this.cleanupCompass();
            this.cleanupCompass = null;
        }
    }
}
