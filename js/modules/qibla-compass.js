/**
 * Qibla Compass
 * Calculates and displays Qibla direction
 */
export class QiblaCompass {
    /**
     * Constructor
     * @param {Object} coordinates - Latitude and longitude
     */
    constructor(coordinates) {
        this.coordinates = coordinates;
        this.qiblaDirection = 0;
        this.compassSupported = false;
        
        // Kaaba coordinates
        this.kaabaCoordinates = {
            latitude: 21.4225,
            longitude: 39.8262
        };
        
        // Initialize
        this.initialize();
    }
    
    /**
     * Initialize the Qibla compass
     */
    initialize() {
        // Calculate initial Qibla direction
        this.qiblaDirection = this.calculateQiblaDirection();
        
        // Check if device orientation is supported
        this.checkCompassSupport();
        
        // Initialize compass display
        this.initializeCompassDisplay();
    }
    
    /**
     * Check if compass is supported on this device
     */
    checkCompassSupport() {
        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', (event) => {
                // Check if we have the data we need
                if (event.alpha !== null) {
                    this.compassSupported = true;
                    this.handleDeviceOrientation(event);
                }
            }, { once: true });
            
            // Request permission for iOS devices
            if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                document.querySelector('.qibla-compass').addEventListener('click', () => {
                    DeviceOrientationEvent.requestPermission()
                        .then(permissionState => {
                            if (permissionState === 'granted') {
                                window.addEventListener('deviceorientation', (event) => {
                                    this.handleDeviceOrientation(event);
                                });
                            }
                        })
                        .catch(console.error);
                });
            }
        }
    }
    
    /**
     * Initialize compass display
     */
    initializeCompassDisplay() {
        const compassInfo = document.querySelector('.compass-info');
        
        if (this.compassSupported) {
            compassInfo.textContent = 'Point your device to find Qibla direction';
        } else {
            compassInfo.textContent = `Qibla Direction: ${Math.round(this.qiblaDirection)}° from North`;
        }
        
        // Set initial arrow direction
        const compassArrow = document.querySelector('.compass-arrow');
        compassArrow.style.transform = `translate(-50%, -100%) rotate(${this.qiblaDirection}deg)`;
        
        // Add compass markers
        this.addCompassMarkers();
    }
    
    /**
     * Add compass markers (N, E, S, W)
     */
    addCompassMarkers() {
        const compassBg = document.querySelector('.qibla-compass-bg');
        if (!compassBg) return;

        // Prevent duplicate marker buildup during repeated coordinate updates.
        compassBg.querySelectorAll('.compass-marker, .kaaba-marker').forEach(node => node.remove());
        
        // Create markers
        const markers = [
            { direction: 'N', angle: 0 },
            { direction: 'E', angle: 90 },
            { direction: 'S', angle: 180 },
            { direction: 'W', angle: 270 }
        ];
        
        markers.forEach(marker => {
            const markerElement = document.createElement('div');
            markerElement.className = 'compass-marker';
            markerElement.textContent = marker.direction;
            markerElement.style.position = 'absolute';
            markerElement.style.top = '50%';
            markerElement.style.left = '50%';
            markerElement.style.transform = `rotate(${marker.angle}deg) translate(0, -90px) rotate(-${marker.angle}deg)`;
            markerElement.style.fontWeight = 'bold';
            
            compassBg.appendChild(markerElement);
        });
        
        // Add Kaaba marker
        const kaabaMarker = document.createElement('div');
        kaabaMarker.className = 'kaaba-marker';
        kaabaMarker.innerHTML = '🕋';
        kaabaMarker.style.position = 'absolute';
        kaabaMarker.style.top = '50%';
        kaabaMarker.style.left = '50%';
        kaabaMarker.style.transform = `rotate(${this.qiblaDirection}deg) translate(0, -90px) rotate(-${this.qiblaDirection}deg)`;
        kaabaMarker.style.fontSize = '20px';
        
        compassBg.appendChild(kaabaMarker);
    }
    
    /**
     * Calculate Qibla direction
     * @returns {number} Qibla direction in degrees
     */
    calculateQiblaDirection() {
        try {
            // Convert coordinates to radians
            const lat1 = this.toRadians(this.coordinates.latitude);
            const lon1 = this.toRadians(this.coordinates.longitude);
            const lat2 = this.toRadians(this.kaabaCoordinates.latitude);
            const lon2 = this.toRadians(this.kaabaCoordinates.longitude);
            
            // Calculate Qibla direction
            const y = Math.sin(lon2 - lon1);
            const x = Math.cos(lat1) * Math.tan(lat2) - Math.sin(lat1) * Math.cos(lon2 - lon1);
            let qibla = Math.atan2(y, x);
            
            // Convert to degrees
            qibla = this.toDegrees(qibla);
            
            // Normalize to 0-360
            qibla = (qibla + 360) % 360;
            
            return qibla;
        } catch (error) {
            console.error('Error calculating Qibla direction:', error);
            return 0;
        }
    }
    
    /**
     * Handle device orientation event
     * @param {DeviceOrientationEvent} event - Device orientation event
     */
    handleDeviceOrientation(event) {
        if (!event.alpha) return;
        
        // Get device heading (alpha) in degrees
        let heading = event.alpha;
        
        // Adjust for iOS devices
        if (window.orientation) {
            switch (window.orientation) {
                case 0:
                    heading += 0;
                    break;
                case 90:
                    heading += 90;
                    break;
                case -90:
                    heading += -90;
                    break;
                case 180:
                    heading += 180;
                    break;
            }
        }
        
        // Normalize heading to 0-360
        heading = (heading + 360) % 360;
        
        // Calculate compass rotation (opposite of heading)
        const compassRotation = 360 - heading;
        
        // Calculate arrow rotation (Qibla direction relative to device heading)
        const arrowRotation = (this.qiblaDirection + compassRotation) % 360;
        
        // Update compass arrow
        const compassArrow = document.querySelector('.compass-arrow');
        compassArrow.style.transform = `translate(-50%, -100%) rotate(${arrowRotation}deg)`;
        
        // Update compass info
        const compassInfo = document.querySelector('.compass-info');
        const degreesToQibla = Math.round((360 + this.qiblaDirection - heading) % 360);
        compassInfo.textContent = `Qibla is ${degreesToQibla}° ${this.getDirectionName(degreesToQibla)}`;
    }
    
    /**
     * Get direction name based on degrees
     * @param {number} degrees - Degrees
     * @returns {string} Direction name
     */
    getDirectionName(degrees) {
        if (degrees >= 337.5 || degrees < 22.5) return 'North';
        if (degrees >= 22.5 && degrees < 67.5) return 'Northeast';
        if (degrees >= 67.5 && degrees < 112.5) return 'East';
        if (degrees >= 112.5 && degrees < 157.5) return 'Southeast';
        if (degrees >= 157.5 && degrees < 202.5) return 'South';
        if (degrees >= 202.5 && degrees < 247.5) return 'Southwest';
        if (degrees >= 247.5 && degrees < 292.5) return 'West';
        if (degrees >= 292.5 && degrees < 337.5) return 'Northwest';
        return '';
    }
    
    /**
     * Convert degrees to radians
     * @param {number} degrees - Degrees
     * @returns {number} Radians
     */
    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }
    
    /**
     * Convert radians to degrees
     * @param {number} radians - Radians
     * @returns {number} Degrees
     */
    toDegrees(radians) {
        return radians * (180 / Math.PI);
    }
    
    /**
     * Update coordinates
     * @param {Object} coordinates - New latitude and longitude
     */
    updateCoordinates(coordinates) {
        this.coordinates = coordinates;
        this.qiblaDirection = this.calculateQiblaDirection();
        
        // Update compass display
        this.initializeCompassDisplay();
    }
} 