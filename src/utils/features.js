import BASIC from '../product-config/basic';
import PLUS from '../product-config/plus';
import PRO from '../product-config/pro';

// Central helpers to resolve product line features per bike model
export function buildModelFeatureIndex(models) {
	const index = {};
	(models || []).forEach(m => { index[m.id] = m; });
	return index;
}

export function hasFeature(modelIndex, modelId, featureKey) {
	const m = modelIndex[modelId];
	if (!m) return false;
	return !!m[featureKey];
}

export function getModelBadges(modelIndex, modelId) {
	const m = modelIndex[modelId];
	if (!m) return [];
	const badges = [];
	if (m.hasGPS && CURRENT_PRODUCT.features.hasGPS) badges.push('GPS');
	if (m.hasSpeedSensor && CURRENT_PRODUCT.features.hasSpeedSensor) badges.push('Speed');
	if (m.hasAntiTheft && CURRENT_PRODUCT.features.hasAntiTheft) badges.push('Anti-Theft');
	if (m.hasSolarPanel && CURRENT_PRODUCT.features.hasSolarPanel) badges.push('Solar');
	if (m.hasPhoneCharging && CURRENT_PRODUCT.features.hasPhoneCharging) badges.push('Phone Charging');
	if (m.hasMobileApp && CURRENT_PRODUCT.features.hasMobileApp) badges.push('Mobile App');
	return badges;
}

// Product-line configuration loader
const PRODUCT_MAP = { basic: BASIC, plus: PLUS, pro: PRO };

export function getCurrentProductConfig() {
	// Try read from localStorage or default to 'pro' (full features for demo)
	const key = (window?.localStorage?.getItem('sbe_product') || 'pro').toLowerCase();
	return PRODUCT_MAP[key] || PRO;
}

export const CURRENT_PRODUCT = getCurrentProductConfig();

export function productHas(featureKey) {
	return !!CURRENT_PRODUCT.features[featureKey];
}

export function hasFeatureEnabled(modelIndex, modelId, featureKey) {
	return hasFeature(modelIndex, modelId, featureKey) && productHas(featureKey);
}


