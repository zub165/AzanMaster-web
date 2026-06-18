/**
 * Prayer Time Calculator
 * Calculates prayer times based on location and settings
 */
export class PrayerTimeCalculator {
    /**
     * Constructor
     * @param {Object} coordinates - Latitude and longitude
     * @param {boolean} isDST - Whether DST is active
     */
    constructor(coordinates, isDST = false) {
        this.coordinates = coordinates;
        this.isDST = isDST;
        this.calculationMethod = 'MuslimWorldLeague';
        this.madhab = 'Shafi';
        this.prayerTimes = {};
        this.nextPrayer = null;
        this.useAPI = true; // Default to using API
        this.apiCache = {}; // Cache API responses
        this.apiLastFetch = null; // Last API fetch time
        
        // Initialize
        this.initializeCalculationParams();
    }
    
    /**
     * Initialize calculation parameters
     */
    initializeCalculationParams() {
        // Set default values for calculation parameters
        this.calculationParams = {
            method: this.calculationMethod,
            madhab: this.madhab,
            highLatitudeRule: 'AngleBased',
            adjustments: {
                fajr: 0,
                sunrise: 0,
                dhuhr: 0,
                asr: 0,
                maghrib: 0,
                isha: 0
            }
        };
    }
    
    /**
     * Set calculation method
     * @param {string} method - Calculation method name
     */
    setCalculationMethod(method) {
        this.calculationMethod = method;
        this.calculationParams.method = method;
        // Clear cache when settings change
        this.clearCache();
    }
    
    /**
     * Set madhab for Asr calculation
     * @param {string} madhab - Madhab name (Shafi or Hanafi)
     */
    setMadhab(madhab) {
        this.madhab = madhab;
        this.calculationParams.madhab = madhab;
        // Clear cache when settings change
        this.clearCache();
    }
    
    /**
     * Set DST status
     * @param {boolean} isDST - Whether DST is active
     */
    setDST(isDST) {
        this.isDST = isDST;
        // Clear cache when settings change
        this.clearCache();
    }
    
    /**
     * Set whether to use API
     * @param {boolean} useAPI - Whether to use API
     */
    setUseAPI(useAPI) {
        this.useAPI = useAPI;
    }

    /**
     * Update coordinates used for all prayer calculations
     * @param {Object} coordinates - Latitude and longitude
     */
    setCoordinates(coordinates) {
        if (!coordinates || typeof coordinates.latitude !== 'number' || typeof coordinates.longitude !== 'number') {
            return;
        }

        this.coordinates = {
            latitude: coordinates.latitude,
            longitude: coordinates.longitude
        };
        this.clearCache();
    }
    
    /**
     * Clear API cache
     */
    clearCache() {
        this.apiCache = {};
        this.apiLastFetch = null;
    }
    
    /**
     * Calculate prayer times for current day
     * @returns {Object} Prayer times object
     */
    async calculatePrayerTimes() {
        try {
            let prayerTimes;
            
            // Try to use API if enabled
            if (this.useAPI) {
                try {
                    prayerTimes = await this.fetchPrayerTimesFromAPI();
                    
                    // If API call was successful, use those times
                    if (prayerTimes && Object.keys(prayerTimes).length > 0) {
                        this.prayerTimes = prayerTimes;
                        this.determineNextPrayer();
                        return this.prayerTimes;
                    }
                } catch (apiError) {
                    console.warn('API prayer time calculation failed, falling back to local calculation:', apiError);
                    // Fall back to local calculation
                }
            }
            
            // Local calculation (fallback)
            return this.calculatePrayerTimesLocally();
        } catch (error) {
            console.error('Error calculating prayer times:', error);
            return {};
        }
    }
    
    /**
     * Calculate prayer times locally using Adhan.js
     * @returns {Object} Prayer times object
     */
    calculatePrayerTimesLocally() {
        try {
            const date = new Date();
            const coordinates = new adhan.Coordinates(this.coordinates.latitude, this.coordinates.longitude);
            
            // Create calculation parameters based on selected method
            const params = this.getCalculationParameters();
            
            // Calculate prayer times
            const prayerTimes = new adhan.PrayerTimes(coordinates, date, params);
            
            // Apply DST adjustment if needed
            if (this.isDST) {
                this.applyDSTAdjustment(prayerTimes);
            }
            
            // Calculate additional prayer times
            const additionalTimes = this.calculateAdditionalTimes(prayerTimes);
            
            // Combine all prayer times
            this.prayerTimes = {
                tahajjud: additionalTimes.tahajjud,
                suhoor: additionalTimes.suhoor,
                fajr: prayerTimes.fajr,
                ishraq: additionalTimes.ishraq,
                dhuhr: prayerTimes.dhuhr,
                asr: prayerTimes.asr,
                maghrib: prayerTimes.maghrib,
                isha: prayerTimes.isha
            };
            
            // Determine next prayer
            this.determineNextPrayer();
            
            return this.prayerTimes;
        } catch (error) {
            console.error('Error calculating prayer times locally:', error);
            return {};
        }
    }
    
    /**
     * Fetch prayer times from API
     * @returns {Promise<Object>} Prayer times object
     */
    async fetchPrayerTimesFromAPI() {
        try {
            const date = new Date();
            const dateStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
            
            // Check cache first
            const cacheKey = `${dateStr}_${this.coordinates.latitude}_${this.coordinates.longitude}_${this.calculationMethod}_${this.madhab}`;
            
            if (this.apiCache[cacheKey]) {
                console.log('Using cached prayer times');
                return this.apiCache[cacheKey];
            }
            
            // If we've fetched within the last 5 minutes, don't fetch again
            if (this.apiLastFetch && (Date.now() - this.apiLastFetch) < 300000) {
                console.log('API fetch throttled, using local calculation');
                return null;
            }
            
            // Update last fetch time
            this.apiLastFetch = Date.now();
            
            // Prepare API URL
            // Using the Al Adhan API (https://aladhan.com/prayer-times-api)
            const apiUrl = new URL('https://api.aladhan.com/v1/timings');
            apiUrl.searchParams.append('latitude', this.coordinates.latitude);
            apiUrl.searchParams.append('longitude', this.coordinates.longitude);
            apiUrl.searchParams.append('method', this.getAPIMethodCode());
            apiUrl.searchParams.append('school', this.madhab === 'Hanafi' ? '1' : '0');
            apiUrl.searchParams.append('date', dateStr);
            
            console.log('Fetching prayer times from API:', apiUrl.toString());
            
            // Fetch from API
            const response = await fetch(apiUrl.toString());
            
            if (!response.ok) {
                throw new Error(`API returned status ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.data || !data.data.timings) {
                throw new Error('Invalid API response format');
            }
            
            // Convert API response to our format
            const apiTimes = data.data.timings;
            const now = new Date();
            
            // Parse times from API
            const parsedTimes = {
                fajr: this.parseAPITime(apiTimes.Fajr, now),
                sunrise: this.parseAPITime(apiTimes.Sunrise, now),
                dhuhr: this.parseAPITime(apiTimes.Dhuhr, now),
                asr: this.parseAPITime(apiTimes.Asr, now),
                maghrib: this.parseAPITime(apiTimes.Maghrib, now),
                isha: this.parseAPITime(apiTimes.Isha, now)
            };
            
            // Calculate additional times
            const additionalTimes = this.calculateAdditionalTimesFromAPI(parsedTimes);
            
            // Combine all prayer times
            const prayerTimes = {
                tahajjud: additionalTimes.tahajjud,
                suhoor: additionalTimes.suhoor,
                fajr: parsedTimes.fajr,
                ishraq: additionalTimes.ishraq,
                dhuhr: parsedTimes.dhuhr,
                asr: parsedTimes.asr,
                maghrib: parsedTimes.maghrib,
                isha: parsedTimes.isha
            };
            
            // Cache the result
            this.apiCache[cacheKey] = prayerTimes;
            
            return prayerTimes;
        } catch (error) {
            console.error('Error fetching prayer times from API:', error);
            return null;
        }
    }
    
    /**
     * Parse time string from API
     * @param {string} timeStr - Time string (HH:MM format)
     * @param {Date} date - Date to use
     * @returns {Date} Parsed date
     */
    parseAPITime(timeStr, date) {
        try {
            if (!timeStr) {
                return null;
            }

            // API can return strings like "05:28" or "05:28 (EDT)".
            const match = String(timeStr).match(/(\d{1,2}):(\d{2})/);
            if (!match) {
                return null;
            }

            const hours = Number(match[1]);
            const minutes = Number(match[2]);
            const result = new Date(date);
            result.setHours(hours, minutes, 0, 0);
            return result;
        } catch (error) {
            console.error('Error parsing API time:', error);
            return null;
        }
    }
    
    /**
     * Calculate additional prayer times from API times
     * @param {Object} apiTimes - API prayer times
     * @returns {Object} Additional prayer times
     */
    calculateAdditionalTimesFromAPI(apiTimes) {
        const additionalTimes = {};
        
        // Calculate Tahajjud time (middle of the night between Isha and Fajr)
        const ishaDate = new Date(apiTimes.isha);
        const fajrDate = new Date(apiTimes.fajr);
        
        // If Fajr is on the next day, add 24 hours
        if (fajrDate < ishaDate) {
            fajrDate.setDate(fajrDate.getDate() + 1);
        }
        
        const middleOfNight = new Date((ishaDate.getTime() + fajrDate.getTime()) / 2);
        additionalTimes.tahajjud = middleOfNight;
        
        // Calculate Suhoor time (20 minutes before Fajr)
        const suhoorTime = new Date(apiTimes.fajr);
        suhoorTime.setMinutes(suhoorTime.getMinutes() - 20);
        additionalTimes.suhoor = suhoorTime;
        
        // Calculate Ishraq time (20 minutes after sunrise).
        // Use API sunrise directly when available.
        const sunriseBase = apiTimes.sunrise
            ? new Date(apiTimes.sunrise)
            : new Date((apiTimes.fajr.getTime() + apiTimes.dhuhr.getTime()) / 2);
        const ishraqTime = new Date(sunriseBase);
        ishraqTime.setMinutes(ishraqTime.getMinutes() + 20);
        additionalTimes.ishraq = ishraqTime;
        
        return additionalTimes;
    }
    
    /**
     * Get API method code
     * @returns {number} API method code
     */
    getAPIMethodCode() {
        // Map our method names to API method codes
        const methodMap = {
            'MuslimWorldLeague': 3,
            'Egyptian': 5,
            'Karachi': 1,
            'UmmAlQura': 4,
            'Dubai': 8,
            'MoonsightingCommittee': 15,
            'NorthAmerica': 2,
            'Kuwait': 9,
            'Qatar': 10,
            'Tehran': 7
        };
        
        return methodMap[this.calculationMethod] || 3; // Default to Muslim World League
    }
    
    /**
     * Get calculation parameters based on selected method
     * @returns {adhan.CalculationParameters} Calculation parameters
     */
    getCalculationParameters() {
        let params;
        
        // Set calculation method
        switch (this.calculationMethod) {
            case 'MuslimWorldLeague':
                params = adhan.CalculationMethod.MuslimWorldLeague();
                break;
            case 'Egyptian':
                params = adhan.CalculationMethod.Egyptian();
                break;
            case 'Karachi':
                params = adhan.CalculationMethod.Karachi();
                break;
            case 'UmmAlQura':
                params = adhan.CalculationMethod.UmmAlQura();
                break;
            case 'Dubai':
                params = adhan.CalculationMethod.Dubai();
                break;
            case 'MoonsightingCommittee':
                params = adhan.CalculationMethod.MoonsightingCommittee();
                break;
            case 'NorthAmerica':
                params = adhan.CalculationMethod.NorthAmerica();
                break;
            case 'Kuwait':
                params = adhan.CalculationMethod.Kuwait();
                break;
            case 'Qatar':
                params = adhan.CalculationMethod.Qatar();
                break;
            case 'Tehran':
                params = adhan.CalculationMethod.Tehran();
                break;
            default:
                params = adhan.CalculationMethod.MuslimWorldLeague();
        }
        
        // Set madhab
        params.madhab = this.madhab === 'Hanafi' ? adhan.Madhab.Hanafi : adhan.Madhab.Shafi;
        
        // Set high latitude rule
        params.highLatitudeRule = adhan.HighLatitudeRule.AngleBased;
        
        // Apply any custom adjustments
        for (const prayer in this.calculationParams.adjustments) {
            if (this.calculationParams.adjustments[prayer] !== 0) {
                params.adjustments[prayer] = this.calculationParams.adjustments[prayer];
            }
        }
        
        return params;
    }
    
    /**
     * Apply DST adjustment to prayer times
     * @param {adhan.PrayerTimes} prayerTimes - Prayer times object
     */
    applyDSTAdjustment(prayerTimes) {
        // No need to manually adjust as the Date object handles DST automatically
        // This method is kept for potential custom DST handling in the future
    }
    
    /**
     * Calculate additional prayer times not provided by Adhan.js
     * @param {adhan.PrayerTimes} prayerTimes - Prayer times object
     * @returns {Object} Additional prayer times
     */
    calculateAdditionalTimes(prayerTimes) {
        const additionalTimes = {};
        
        // Calculate Tahajjud time (middle of the night between Isha and Fajr)
        const ishaDate = new Date(prayerTimes.isha);
        const fajrDate = new Date(prayerTimes.fajr);
        
        // If Fajr is on the next day, add 24 hours
        if (fajrDate < ishaDate) {
            fajrDate.setDate(fajrDate.getDate() + 1);
        }
        
        const middleOfNight = new Date((ishaDate.getTime() + fajrDate.getTime()) / 2);
        additionalTimes.tahajjud = middleOfNight;
        
        // Calculate Suhoor time (20 minutes before Fajr)
        const suhoorTime = new Date(prayerTimes.fajr);
        suhoorTime.setMinutes(suhoorTime.getMinutes() - 20);
        additionalTimes.suhoor = suhoorTime;
        
        // Calculate Ishraq time (20 minutes after sunrise)
        const sunriseTime = new Date(prayerTimes.sunrise);
        const ishraqTime = new Date(sunriseTime);
        ishraqTime.setMinutes(ishraqTime.getMinutes() + 20);
        additionalTimes.ishraq = ishraqTime;
        
        return additionalTimes;
    }
    
    /**
     * Determine the next prayer time
     */
    determineNextPrayer() {
        const now = new Date();
        let nextPrayer = null;
        let minDiff = Infinity;
        
        // Check each prayer time
        for (const prayer in this.prayerTimes) {
            const prayerTime = this.prayerTimes[prayer];
            if (!prayerTime) continue; // Skip if prayer time is null
            
            const diff = prayerTime - now;
            
            // If prayer time is in the future and closer than current next prayer
            if (diff > 0 && diff < minDiff) {
                minDiff = diff;
                nextPrayer = prayer;
            }
        }
        
        this.nextPrayer = nextPrayer;
    }
    
    /**
     * Check if a prayer is the next prayer
     * @param {string} prayer - Prayer name
     * @returns {boolean} Whether this is the next prayer
     */
    isNextPrayer(prayer) {
        return prayer === this.nextPrayer;
    }
    
    /**
     * Get countdown to a prayer
     * @param {string} prayer - Prayer name
     * @returns {string} Countdown string
     */
    getCountdown(prayer) {
        const now = new Date();
        const prayerTime = this.prayerTimes[prayer];
        
        if (!prayerTime) {
            return '';
        }
        
        // Calculate time difference
        let diff = prayerTime - now;
        
        // If prayer time has passed, show "Passed today"
        if (diff < 0) {
            return 'Passed today';
        }
        
        // Convert to hours, minutes, seconds
        const hours = Math.floor(diff / (1000 * 60 * 60));
        diff -= hours * (1000 * 60 * 60);
        const minutes = Math.floor(diff / (1000 * 60));
        diff -= minutes * (1000 * 60);
        const seconds = Math.floor(diff / 1000);
        
        // Format countdown string
        let countdown = '';
        if (hours > 0) {
            countdown += `${hours}h `;
        }
        countdown += `${minutes}m ${seconds}s`;
        
        return countdown;
    }
} 