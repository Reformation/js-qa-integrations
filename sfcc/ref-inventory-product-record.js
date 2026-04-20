function RefInventoryProductRecord(json) {
    this.json = json;
    if (json.allocation) {
        if (json.allocation.amount || json.allocation.amount == 0) {
            this.allocation = json.allocation.amount;
        }
        if (json.allocation.reset_date) {
            this.reset_date = json.allocation.reset_date;
        }
    } else {
        this.allocation = 0;
    }
    if (json.product_id) {
        this.product_id = json.product_id.toUpperCase();
    }

    if (json.exists) {
        this.exists = true;
    } else {
        this.exists = false;
    }

    if (json.ats || json.ats == 0) {
        this.ats = json.ats;
    }

    if (json.creation_date) {
        this.creation_date = json.creation_date;
    }

    if (json.inventory_list_id) {
        this.inventory_list_id = json.inventory_list_id;
    }

    if (json['perpetual_flag'] && ( json['perpetual_flag'] == true || json['perpetual_flag'] == 'true' )) {
        this.perpetual_flag = true;
    } else {
        this.perpetual_flag = false;
    }

    if (json['c_perpetualForStoreInventory'] && ( json['c_perpetualForStoreInventory'] == true || json['c_perpetualForStoreInventory'] == 'true' )) {
        this.c_perpetualForStoreInventory = true;
    } else {
        this.c_perpetualForStoreInventory = false;
    }

    this['inventory_turnover'] = setInventoryValues(json['inventory_turnover']);
    this['c_damaged'] = setInventoryValues(json['c_damaged']);
    this['c_floor'] = setInventoryValues(json['c_floor']);
    this['c_missing'] = setInventoryValues(json['c_missing']);
    this['c_reserve'] = setInventoryValues(json['c_reserve']);
    this['c_return'] = setInventoryValues(json['c_return']);
    this['c_refOnOrder'] = setInventoryValues(json['c_refOnOrder']);
    this['c_refTurnover'] = setInventoryValues(json['c_refTurnover']);
    this['onOrder'] = setInventoryValues(json['quantity_on_order']);
    this['quantity_on_hand'] = setInventoryValues(json['quantity_on_hand']);
    this['pre_order_back_order_allocation'] = setInventoryValues(json['pre_order_back_order_allocation']);

    if (json['pre_order_back_order_handling']) {
        this['pre_order_back_order_handling'] = json['pre_order_back_order_handling'];
    } else {
        this['pre_order_back_order_handling'] = null;
    }
    this.in_stock_date = json.in_stock_date;

    this.calculatedATS = calculateATS(this);
    this.customTotals = calculateCustomTotals(this);
}

function setInventoryValues(element) {
    if (!element) {
        return 0;
    } else {
        return element;
    }
}

function calculateATS(productData) {
    let customATS = 0;

    if (productData.allocation) {
        customATS = productData.allocation;
    }

    if (productData.pre_order_back_order_allocation) {
        customATS += productData.pre_order_back_order_allocation;
    }

    if (productData.inventory_turnover) {
        customATS -= productData.inventory_turnover;
    }

    if (productData.onOrder) {
        customATS -= productData.onOrder;
    }

    if (productData.c_damaged) {
        customATS -= productData.c_damaged;
    }

    if (productData.c_floor) {
        customATS -= productData.c_floor;
    }

    if (productData.c_missing) {
        customATS -= productData.c_missing;
    }

    if (productData.c_reserve) {
        customATS -= productData.c_reserve;
    }

    if (productData.c_return) {
        customATS -= productData.c_return;
    }

    if (productData.c_refOnOrder) {
        customATS -= productData.c_refOnOrder;
    }

    if (productData.c_refTurnover) {
        customATS -= productData.c_refTurnover;
    }

    if (customATS < 0) {
        customATS = 0;
    }

    return customATS;
}


function calculateCustomTotals(productData) {
    let totals = 0;

    if (productData.c_damaged) {
        totals += productData.c_damaged;
    }

    if (productData.c_floor) {
        totals += productData.c_floor;
    }

    if (productData.c_missing) {
        totals += productData.c_missing;
    }

    if (productData.c_reserve) {
        totals += productData.c_reserve;
    }
    if (productData.c_return) {
        totals += productData.c_return;
    }

    if (productData.c_refOnOrder) {
        totals += productData.c_refOnOrder;
    }

    if (productData.c_refTurnover) {
        totals += productData.c_refTurnover;
    }

    return totals;
}

module.exports = RefInventoryProductRecord;
