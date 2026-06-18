/**
 * Adhan.js - Simplified version
 * A library for calculating Islamic prayer times
 */

(function(global) {
    'use strict';

    // Calculation Methods
    const CalculationMethod = {
        MuslimWorldLeague: function() {
            return new CalculationParameters(18, 17, false, 0, 0, 0, 0, 0);
        },
        Egyptian: function() {
            return new CalculationParameters(19.5, 17.5, false, 0, 0, 0, 0, 0);
        },
        Karachi: function() {
            return new CalculationParameters(18, 18, false, 0, 0, 0, 0, 0);
        },
        UmmAlQura: function() {
            return new CalculationParameters(18.5, 0, false, 0, 90, 0, 0, 0);
        },
        Dubai: function() {
            return new CalculationParameters(18.2, 18.2, false, 0, 0, 0, 0, 0);
        },
        MoonsightingCommittee: function() {
            return new CalculationParameters(18, 18, false, 0, 0, 0, 0, 0);
        },
        NorthAmerica: function() {
            return new CalculationParameters(15, 15, false, 0, 0, 0, 0, 0);
        },
        Kuwait: function() {
            return new CalculationParameters(18, 17.5, false, 0, 0, 0, 0, 0);
        },
        Qatar: function() {
            return new CalculationParameters(18, 0, false, 0, 90, 0, 0, 0);
        },
        Tehran: function() {
            return new CalculationParameters(17.7, 14, false, 4.5, 0, 0, 0, 0);
        }
    };

    // High Latitude Rule
    const HighLatitudeRule = {
        MiddleOfTheNight: 'middleofthenight',
        SeventhOfTheNight: 'seventhofthenight',
        TwilightAngle: 'twilightangle'
    };

    // Madhab for Asr calculation
    const Madhab = {
        Shafi: 'shafi',
        Hanafi: 'hanafi'
    };

    // Prayer names
    const Prayer = {
        Fajr: 'fajr',
        Sunrise: 'sunrise',
        Dhuhr: 'dhuhr',
        Asr: 'asr',
        Maghrib: 'maghrib',
        Isha: 'isha'
    };

    // Calculation Parameters
    function CalculationParameters(fajrAngle, ishaAngle, ishaInterval, maghribAngle, maghribInterval, dhuhrMinutes, adjustHighLats, adjustHighLatsMethod) {
        this.fajrAngle = fajrAngle;
        this.ishaAngle = ishaAngle;
        this.ishaInterval = ishaInterval;
        this.maghribAngle = maghribAngle;
        this.maghribInterval = maghribInterval;
        this.dhuhrMinutes = dhuhrMinutes || 0;
        this.adjustHighLats = adjustHighLats || false;
        this.adjustHighLatsMethod = adjustHighLatsMethod || HighLatitudeRule.MiddleOfTheNight;
        this.madhab = Madhab.Shafi;
    }

    // Coordinates
    function Coordinates(latitude, longitude) {
        this.latitude = latitude;
        this.longitude = longitude;
    }

    // Date utilities
    function getDayOfYear(date) {
        const start = new Date(date.getFullYear(), 0, 0);
        const diff = date - start;
        const oneDay = 1000 * 60 * 60 * 24;
        return Math.floor(diff / oneDay);
    }

    // Convert degrees to radians
    function degreesToRadians(degrees) {
        return degrees * Math.PI / 180;
    }

    // Convert radians to degrees
    function radiansToDegrees(radians) {
        return radians * 180 / Math.PI;
    }

    // Normalize degrees to 0-360
    function normalizeToScale(degrees, max) {
        return ((degrees % max) + max) % max;
    }

    // Calculate the equation of time
    function equationOfTime(jd) {
        const d = jd - 2451545.0;
        const g = normalizeToScale((357.529 + 0.98560028 * d), 360);
        const q = normalizeToScale((280.459 + 0.98564736 * d), 360);
        const L = normalizeToScale((q + 1.915 * Math.sin(degreesToRadians(g)) + 0.020 * Math.sin(degreesToRadians(2 * g))), 360);
        const e = 23.439 - 0.00000036 * d;
        const RA = radiansToDegrees(Math.atan2(Math.cos(degreesToRadians(e)) * Math.sin(degreesToRadians(L)), Math.cos(degreesToRadians(L)))) / 15;
        return q / 15 - normalizeToScale(RA, 24);
    }

    // Calculate the declination of the sun
    function declination(jd) {
        const d = jd - 2451545.0;
        const g = normalizeToScale((357.529 + 0.98560028 * d), 360);
        const q = normalizeToScale((280.459 + 0.98564736 * d), 360);
        const L = normalizeToScale((q + 1.915 * Math.sin(degreesToRadians(g)) + 0.020 * Math.sin(degreesToRadians(2 * g))), 360);
        const e = 23.439 - 0.00000036 * d;
        return radiansToDegrees(Math.asin(Math.sin(degreesToRadians(e)) * Math.sin(degreesToRadians(L))));
    }

    // Calculate the Julian date
    function julianDate(date) {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        
        if (month <= 2) {
            year -= 1;
            month += 12;
        }
        
        const A = Math.floor(year / 100);
        const B = 2 - A + Math.floor(A / 4);
        
        return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5;
    }

    // Calculate the time at which the sun reaches a specific angle
    function sunAngleTime(date, angle, latitude, longitude, direction, afterTransit) {
        const jd = julianDate(date);
        const decl = declination(jd);
        const eot = equationOfTime(jd);
        const D = Math.abs(latitude - decl);
        
        if (D > 90) {
            return null; // Sun does not reach this angle
        }
        
        let acot = Math.atan(1 / Math.tan(degreesToRadians(angle)));
        if (direction === 'ccw') {
            acot = Math.atan(-1 / Math.tan(degreesToRadians(angle)));
        }
        
        const part1 = Math.sin(acot) * Math.sin(degreesToRadians(latitude)) * Math.sin(degreesToRadians(decl));
        const part2 = Math.sin(acot) * Math.cos(degreesToRadians(latitude)) * Math.cos(degreesToRadians(decl));
        const part3 = Math.cos(acot) * Math.sin(degreesToRadians(latitude)) * Math.cos(degreesToRadians(decl));
        const part4 = Math.cos(acot) * Math.cos(degreesToRadians(latitude)) * Math.sin(degreesToRadians(decl));
        
        const angle1 = radiansToDegrees(Math.acos((part1 - part2) / (part3 - part4)));
        
        let angle2 = 360 - angle1;
        if (afterTransit) {
            angle2 = angle1;
        }
        
        const timeUTC = 12 + angle2 / 15 + eot - longitude / 15;
        return normalizeToScale(timeUTC, 24);
    }

    // Calculate prayer times
    function calculatePrayerTimes(date, coordinates, parameters) {
        const fajrTime = sunAngleTime(date, parameters.fajrAngle, coordinates.latitude, coordinates.longitude, 'ccw', false);
        const sunriseTime = sunAngleTime(date, 0.833, coordinates.latitude, coordinates.longitude, 'ccw', false);
        
        // Dhuhr time
        const jd = julianDate(date);
        const eot = equationOfTime(jd);
        const dhuhrTime = normalizeToScale(12 + eot - coordinates.longitude / 15 + parameters.dhuhrMinutes / 60, 24);
        
        // Asr time
        const declination = declination(jd);
        const asrFactor = parameters.madhab === Madhab.Hanafi ? 2 : 1;
        const asrAngle = radiansToDegrees(Math.atan(1 / (asrFactor + Math.tan(degreesToRadians(Math.abs(coordinates.latitude - declination))))));
        const asrTime = sunAngleTime(date, asrAngle, coordinates.latitude, coordinates.longitude, 'cw', true);
        
        // Maghrib time
        const maghribTime = parameters.maghribAngle > 0 ? 
            sunAngleTime(date, parameters.maghribAngle, coordinates.latitude, coordinates.longitude, 'cw', true) : 
            sunAngleTime(date, 0.833, coordinates.latitude, coordinates.longitude, 'cw', true);
        
        // Isha time
        const ishaTime = parameters.ishaAngle > 0 ? 
            sunAngleTime(date, parameters.ishaAngle, coordinates.latitude, coordinates.longitude, 'cw', true) : 
            normalizeToScale(maghribTime + parameters.ishaInterval / 60, 24);
        
        return {
            fajr: timeToDate(date, fajrTime),
            sunrise: timeToDate(date, sunriseTime),
            dhuhr: timeToDate(date, dhuhrTime),
            asr: timeToDate(date, asrTime),
            maghrib: timeToDate(date, maghribTime),
            isha: timeToDate(date, ishaTime)
        };
    }

    // Convert time in decimal hours to a Date object
    function timeToDate(date, time) {
        if (time === null) {
            return null;
        }
        
        const hours = Math.floor(time);
        const minutes = Math.floor((time - hours) * 60);
        const seconds = Math.floor(((time - hours) * 60 - minutes) * 60);
        
        const result = new Date(date);
        result.setHours(hours, minutes, seconds, 0);
        return result;
    }

    // Calculate Qibla direction
    function calculateQibla(coordinates) {
        const makkah = new Coordinates(21.4225, 39.8262);
        const latitudeRadians = degreesToRadians(coordinates.latitude);
        const longitudeRadians = degreesToRadians(coordinates.longitude);
        const makkahLatitudeRadians = degreesToRadians(makkah.latitude);
        const makkahLongitudeRadians = degreesToRadians(makkah.longitude);
        
        const y = Math.sin(makkahLongitudeRadians - longitudeRadians);
        const x = Math.cos(latitudeRadians) * Math.tan(makkahLatitudeRadians) - 
                 Math.sin(latitudeRadians) * Math.cos(makkahLongitudeRadians - longitudeRadians);
        
        let qibla = radiansToDegrees(Math.atan2(y, x));
        if (qibla < 0) {
            qibla += 360;
        }
        
        return qibla;
    }

    // Public API
    const Adhan = {
        CalculationMethod: CalculationMethod,
        HighLatitudeRule: HighLatitudeRule,
        Madhab: Madhab,
        Prayer: Prayer,
        Coordinates: Coordinates,
        CalculationParameters: CalculationParameters,
        PrayerTimes: {
            calculate: calculatePrayerTimes
        },
        Qibla: {
            calculate: calculateQibla
        }
    };

    // Export to global scope
    global.Adhan = Adhan;

})(typeof window !== 'undefined' ? window : this);