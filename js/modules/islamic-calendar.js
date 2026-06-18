/**
 * Islamic Calendar
 * Calculates and displays Islamic (Hijri) dates
 */
export class IslamicCalendar {
    /**
     * Constructor
     */
    constructor() {
        this.islamicMonths = [
            'Muharram',
            'Safar',
            'Rabi al-Awwal',
            'Rabi al-Thani',
            'Jumada al-Awwal',
            'Jumada al-Thani',
            'Rajab',
            'Sha\'ban',
            'Ramadan',
            'Shawwal',
            'Dhu al-Qi\'dah',
            'Dhu al-Hijjah'
        ];
        
        this.moonPhases = [
            { name: 'New Moon', icon: '🌑' },
            { name: 'Waxing Crescent', icon: '🌒' },
            { name: 'First Quarter', icon: '🌓' },
            { name: 'Waxing Gibbous', icon: '🌔' },
            { name: 'Full Moon', icon: '🌕' },
            { name: 'Waning Gibbous', icon: '🌖' },
            { name: 'Last Quarter', icon: '🌗' },
            { name: 'Waning Crescent', icon: '🌘' }
        ];
    }
    
    /**
     * Get Islamic date
     * @param {Date} date - Gregorian date (default: current date)
     * @returns {Object} Islamic date object
     */
    getIslamicDate(date = new Date()) {
        // Calculate Islamic date
        const islamicDate = this.calculateIslamicDate(date);
        
        return {
            day: islamicDate.day,
            month: islamicDate.month,
            monthName: this.islamicMonths[islamicDate.month - 1],
            year: islamicDate.year
        };
    }
    
    /**
     * Calculate Islamic date from Gregorian date
     * @param {Date} date - Gregorian date
     * @returns {Object} Islamic date object
     */
    calculateIslamicDate(date) {
        // Implementation based on the Kuwaiti algorithm
        const jd = this.gregorianToJulianDay(date);
        return this.julianDayToIslamic(jd);
    }
    
    /**
     * Convert Gregorian date to Julian day
     * @param {Date} date - Gregorian date
     * @returns {number} Julian day
     */
    gregorianToJulianDay(date) {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        
        let a = Math.floor((14 - month) / 12);
        let y = year + 4800 - a;
        let m = month + 12 * a - 3;
        
        let jd = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
        
        return jd;
    }
    
    /**
     * Convert Julian day to Islamic date
     * @param {number} jd - Julian day
     * @returns {Object} Islamic date object
     */
    julianDayToIslamic(jd) {
        // Adjust for Islamic calendar start
        jd = Math.floor(jd) + 0.5;
        const epoch = 1948439.5; // Islamic calendar epoch (July 16, 622 CE)
        
        let year = Math.floor((30 * (jd - epoch) + 10646) / 10631);
        let month = Math.min(12, Math.ceil((jd - (29 + this.islamicToJulianDay(year, 1, 1))) / 29.5) + 1);
        let day = (jd - this.islamicToJulianDay(year, month, 1)) + 1;
        
        return { year, month, day };
    }
    
    /**
     * Convert Islamic date to Julian day
     * @param {number} year - Islamic year
     * @param {number} month - Islamic month
     * @param {number} day - Islamic day
     * @returns {number} Julian day
     */
    islamicToJulianDay(year, month, day) {
        const epoch = 1948439.5; // Islamic calendar epoch
        
        // Adjust for Islamic calendar
        const monthPart = Math.ceil(29.5 * (month - 1));
        const yearPart = (year - 1) * 354 + Math.floor((3 + 11 * year) / 30);
        
        return epoch + yearPart + monthPart + day - 1;
    }
    
    /**
     * Get Gregorian date string
     * @param {Date} date - Gregorian date (default: current date)
     * @returns {string} Formatted Gregorian date string
     */
    getGregorianDateString(date = new Date()) {
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        
        return date.toLocaleDateString(undefined, options);
    }
    
    /**
     * Get moon phase
     * @param {Date} date - Gregorian date (default: current date)
     * @returns {Object} Moon phase object
     */
    getMoonPhase(date = new Date()) {
        // Calculate moon phase (0-7)
        const phase = this.calculateMoonPhase(date);
        
        return this.moonPhases[phase];
    }
    
    /**
     * Calculate moon phase
     * @param {Date} date - Gregorian date
     * @returns {number} Moon phase index (0-7)
     */
    calculateMoonPhase(date) {
        // Calculate days since new moon on Jan 6, 2000
        const epoch = new Date(2000, 0, 6, 18, 14, 0);
        const diff = date - epoch;
        const days = diff / (1000 * 60 * 60 * 24);
        const lunarCycle = 29.53; // Length of lunar cycle in days
        
        // Calculate current phase (0 to 7)
        const phase = Math.round(((days % lunarCycle) / lunarCycle) * 8) % 8;
        
        return phase;
    }
    
    /**
     * Get days in Islamic month
     * @param {number} year - Islamic year
     * @param {number} month - Islamic month
     * @returns {number} Number of days in month
     */
    getDaysInIslamicMonth(year, month) {
        // Calculate Julian day for first day of month
        const jd1 = this.islamicToJulianDay(year, month, 1);
        
        // Calculate Julian day for first day of next month
        const jd2 = month === 12 
            ? this.islamicToJulianDay(year + 1, 1, 1) 
            : this.islamicToJulianDay(year, month + 1, 1);
        
        // Return difference
        return jd2 - jd1;
    }
    
    /**
     * Check if date is a special Islamic date
     * @param {Object} islamicDate - Islamic date object
     * @returns {Object|null} Special date info or null
     */
    checkSpecialDate(islamicDate) {
        const { day, month } = islamicDate;
        
        // Define special dates
        const specialDates = [
            { day: 1, month: 1, name: 'Islamic New Year' },
            { day: 10, month: 1, name: 'Day of Ashura' },
            { day: 12, month: 3, name: 'Mawlid al-Nabi' },
            { day: 27, month: 7, name: 'Laylat al-Miraj' },
            { day: 15, month: 8, name: 'Laylat al-Bara\'at' },
            { day: 1, month: 9, name: 'First day of Ramadan' },
            { day: 27, month: 9, name: 'Laylat al-Qadr' },
            { day: 1, month: 10, name: 'Eid al-Fitr' },
            { day: 8, month: 12, name: 'Day of Arafah' },
            { day: 10, month: 12, name: 'Eid al-Adha' }
        ];
        
        // Find matching special date
        const specialDate = specialDates.find(d => d.day === day && d.month === month);
        
        return specialDate || null;
    }
    
    /**
     * Format Islamic date
     * @param {Object} islamicDate - Islamic date object
     * @returns {string} Formatted Islamic date string
     */
    formatIslamicDate(islamicDate) {
        return `${islamicDate.day} ${islamicDate.monthName} ${islamicDate.year} AH`;
    }
} 