// Core and optional features for Smart Bike SPLA
export const FEATURE_MODEL = {
	core: [
		'hasGPS',
		'hasMobileApp',
		'smartLock'
	],
	optional: [
		'hasSpeedSensor',
		'hasAntiTheft',
		'hasSolarPanel',
		'hasPhoneCharging'
	],
};

// Simple constraints placeholder for future use
export const FEATURE_CONSTRAINTS = [
	// Example: Pro implies Plus features
	// { if: 'hasSolarPanel', then: ['hasAntiTheft', 'hasSpeedSensor'] }
];


