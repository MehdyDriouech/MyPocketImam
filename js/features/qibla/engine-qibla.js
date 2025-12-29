export class QiblaEngine {
  constructor(dependencies) {
    this.state = dependencies.state;
    this.eventBus = dependencies.eventBus;
    this.kaabaCoords = { lat: 21.4225, lon: 39.8262 };
  }

  init() {
    // Initialisation si nécessaire
  }

  async getUserLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          reject(error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }

  calculateQiblaDirection(lat, lon) {
    const lat1 = lat * Math.PI / 180;
    const lon1 = lon * Math.PI / 180;
    const lat2 = this.kaabaCoords.lat * Math.PI / 180;
    const lon2 = this.kaabaCoords.lon * Math.PI / 180;

    const deltaLon = lon2 - lon1;

    const y = Math.sin(deltaLon);
    const x = Math.cos(lat1) * Math.tan(lat2) - Math.sin(lat1) * Math.cos(deltaLon);

    let angle = Math.atan2(y, x) * 180 / Math.PI;
    angle = (angle + 360) % 360;

    return angle;
  }

  calculateDistance(lat1, lon1) {
    const R = 6371; // Rayon de la Terre en km
    const lat2 = this.kaabaCoords.lat;
    const lon2 = this.kaabaCoords.lon;
    
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    return distance.toFixed(2);
  }

  startCompass(callback) {
    if (window.DeviceOrientationEvent) {
      const handler = (event) => {
        let compass = event.alpha;
        
        // iOS specific handling for webkitCompassHeading
        if (event.webkitCompassHeading) {
          compass = event.webkitCompassHeading;
        }
        
        // Android/Standard handling
        // alpha is 0 at North, increasing counter-clockwise usually
        // But we need 0 at North, increasing clockwise for standard compass logic
        // Actually alpha is 0 when device top points North.
        
        if (compass !== null) {
            callback(compass);
        }
      };

      window.addEventListener('deviceorientation', handler, true);
      
      // Return cleanup function
      return () => window.removeEventListener('deviceorientation', handler, true);
    } else {
      console.warn('DeviceOrientation not supported');
      return () => {};
    }
  }
  
  async requestCompassPermission() {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        try {
            const response = await DeviceOrientationEvent.requestPermission();
            return response === 'granted';
        } catch (e) {
            console.error(e);
            return false;
        }
    }
    return true;
  }
}
