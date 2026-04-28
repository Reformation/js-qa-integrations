const COLOR_LENGTH = 3;   // Fixed length for Color (3 chars)
const SIZE_LENGTH = 3;    // Fixed length for Size (3 chars)
const MASTER_ID_MIN_CHARS = 7; // Assumed minimum length for Master ID (7 chars)

const VARIANT_LENGTH = COLOR_LENGTH + SIZE_LENGTH;
const FULL_SKU_LENGTH = MASTER_ID_MIN_CHARS + VARIANT_LENGTH; // 7 + 6 = 13

function extractSizeFromSku(skuString) {
    if (!skuString || typeof skuString !== 'string' || skuString.length < (MASTER_ID_MIN_CHARS + VARIANT_LENGTH)) {
        return null;
    }
    return skuString.slice(-SIZE_LENGTH);
}

function extractColorFromSku(skuString) {
    if (!skuString || typeof skuString !== 'string' || skuString.length < (MASTER_ID_MIN_CHARS + VARIANT_LENGTH)) {
        return null;
    }
    return skuString.slice(-VARIANT_LENGTH, -SIZE_LENGTH);
}

function extractMasterProductIdFromSku(skuString) {
    if (!skuString || typeof skuString !== 'string' || skuString.length < FULL_SKU_LENGTH) {
        return null;
    }
    return skuString.slice(0, -VARIANT_LENGTH);
}

module.exports = {
    extractSizeFromSku,
    extractColorFromSku,
    extractMasterProductIdFromSku
};
