/**
 * Location Manager
 * Handles user location detection and management
 */
export class LocationManager {
    /**
     * Constructor
     * @param {Object} defaultCoordinates - Default coordinates to use if location is unavailable
     */
    constructor(defaultCoordinates) {
        this.defaultCoordinates = defaultCoordinates;
        this.currentCoordinates = defaultCoordinates;
        this.locationName = null;
        this.locationError = null;
        this.isLocationAvailable = false;
    }
    
    /**
     * Get current position
     * @returns {Promise<Object>} Coordinates object
     */
    async getCurrentPosition() {
        try {
            // Check if geolocation is available
            if (!navigator.geolocation) {
                throw new Error('Geolocation is not supported by your browser');
            }
            
            // Get current position
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0
                });
            });
            
            // Update coordinates
            this.currentCoordinates = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            };
            
            // Try to get location name
            await this.getLocationName();
            
            this.isLocationAvailable = true;
            this.locationError = null;
            
            return this.currentCoordinates;
        } catch (error) {
            console.error('Error getting location:', error);
            
            this.locationError = error.message;
            this.isLocationAvailable = false;
            
            // Use default coordinates
            return this.defaultCoordinates;
        }
    }
    
    /**
     * Refresh location
     * @returns {Promise<Object>} Updated coordinates
     */
    async refreshLocation() {
        return this.getCurrentPosition();
    }
    
    /**
     * Get location name from coordinates using reverse geocoding
     * @returns {Promise<string>} Location name
     */
    async getLocationName() {
        try {
            const { latitude, longitude } = this.currentCoordinates;
            
            // Use Nominatim for reverse geocoding (OpenStreetMap)
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`);
            
            if (!response.ok) {
                throw new Error('Failed to get location name');
            }
            
            const data = await response.json();
            
            // Extract location name
            if (data.address) {
                const city = data.address.city || data.address.town || data.address.village || data.address.hamlet;
                const state = data.address.state || data.address.county;
                const country = data.address.country;
                
                let locationParts = [];
                if (city) locationParts.push(city);
                if (state) locationParts.push(state);
                if (country) locationParts.push(country);
                
                this.locationName = locationParts.join(', ');
            } else {
                this.locationName = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            }
            
            return this.locationName;
        } catch (error) {
            console.error('Error getting location name:', error);
            this.locationName = `${this.currentCoordinates.latitude.toFixed(4)}, ${this.currentCoordinates.longitude.toFixed(4)}`;
            return this.locationName;
        }
    }
    
    /**
     * Get current location
     * @returns {Object} Location object with coordinates and name
     */
    getCurrentLocation() {
        return {
            ...this.currentCoordinates,
            locationName: this.locationName,
            isAvailable: this.isLocationAvailable,
            error: this.locationError
        };
    }
    
    /**
     * Check if location is available
     * @returns {boolean} Whether location is available
     */
    isAvailable() {
        return this.isLocationAvailable;
    }
    
    /**
     * Get location error
     * @returns {string|null} Location error message
     */
    getError() {
        return this.locationError;
    }
} 