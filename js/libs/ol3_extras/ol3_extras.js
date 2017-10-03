/**
 *  (c) richard@nautoguide.com
 *
 */

/**
 *
 * Override the existing ol3 bbox as its too twitchy.
 *
 * We need to provide a buffer zone based on the resolution
 *
 * TODO: this is a hack for now, we need to add constructor & options for the buffer zone
 *
 * @param extent
 * @param resolution
 * @returns {*[]}
 */

ol.loadingstrategy.bbox = function (extent, resolution) {
    var buffer = 500 * resolution;
    extent[0] -= buffer;
    extent[1] -= buffer;
    extent[2] += buffer;
    extent[3] += buffer;
    return [extent];
};

ol.loadingstrategy.bbox_27700 = function (extent, resolution) {
    var buffer = 500 * resolution;
    extent[0] -= buffer;
    extent[1] -= buffer;
    extent[2] += buffer;
    extent[3] += buffer;
    return [extent];
};

ol.loadingstrategy.bbox_3857 = function (extent, resolution) {
    var buffer = 10 * resolution;
    extent[0] -= buffer;
    extent[1] -= buffer;
    extent[2] += buffer;
    extent[3] += buffer;
    console.log(extent);
    return [extent];
};


/**
 *  Ol3 doesn't have a getLayer by name function as its assumed you
 *  will have object pointers. As we are dynamic we need layers by name
 *  so this is the ol3 version. For this to work you should have add a 'name' value
 *  to your layer
 *
 *  Note that with new grouping we must detect groups and look in there too.
 *
 *
 */

ol.Map.prototype.getLayer = function (name) {
    var self = this;
    var groups = self.getLayers().getArray();
    for (var g = 0; g < groups.length; g++) {
        if (groups[g] instanceof ol.layer.Group) {
            var layers = groups[g].getLayers().getArray();
            for (var i = 0; i < layers.length; i++) {
                if (layers[i].get('name') == name) {
                    return layers[i];
                }
            }
        } else {
            if (name == groups[g].get('name')) {
                return groups[g];
            }
        }
    }
    console.log('I failed to find layer: ' + name);
    return null;
}

/**
 * getLayerGroupByName
 *
 * Get a layer group(s) by name and return as an array of all layers spanning the
 * groups
 *
 * @param name
 * @returns {Array}
 */
ol.Map.prototype.getLayerGroupByName = function (name) {
    var self = this;
    var names = name.split(",");
    var groups = self.getLayers().getArray();
    var ret_groups = [];
    for (var g = 0; g < groups.length; g++) {
        if (groups[g] instanceof ol.layer.Group && names.indexOf(groups[g].get('name')) > -1) {
            var layers = groups[g].getLayers().getArray();
            for (var i = 0; i < layers.length; i++)
                ret_groups.push(layers[i]);
        }
    }
    return ret_groups;
}

/**
 *
 * Simple  getGeometryCenter
 *
 * @param geometry
 * @returns {*[]}
 */
ol.Map.prototype.getGeometryCenter = function (geometry) {
    var extent = geometry.getExtent();
    var x = extent[0] + (extent[2] - extent[0]) / 2;
    var y = extent[1] + (extent[3] - extent[1]) / 2;
    return [x, y];
}

/**
 *
 * Simple  getFeatureById
 *
 * @param feature_id, bindgroup
 * @returns {*[]}
 */
ol.Map.prototype.getFeatureById = function (feature_id, bindgroup) {
    var self = this;
    /**
     * Search for layer groups first. If that fails we fall over the individual layer name lookups
     * @type {Array}
     */
    var layers = self.getLayerGroupByName(bindgroup);
    if(layers.length==0)
        layers[0]=self.getLayer(bindgroup);
    for (var l = 0; l < layers.length; l++) {
        if (layers[l].type == 'wfs') {
            var source = layers[l].getSource();
            var features = source.getFeatures();
            for (var f = 0; f < features.length; f++) {
                if (features[f].attributes.feature_id == feature_id)
                    return features[f];
            }
        }
    }
    return false;

}

/**
 *
 * Useful functions not really appropriate for inclusion in the map object
 *
 */

/**
 * Clean an extent/resoultion array (IE convert any strings to floats)
 * @param extent
 * @returns {*[]}
 */
cleanArray = function (extent) {
    for (var i = 0; i < extent.length; i++)
        extent[i] = parseFloat(extent[i]);
}

/**
 *  Easing functions
 *
 *  This have been mostly taken direct from the Ol3 examples or from various web sources.
 *
 *  Esentially a collection of
 */

/**
 * Easing function for elastic animation
 *
 * // from https://github.com/DmitryBaranovskiy/raphael

 * @param t
 * @returns {number}
 */
function easing_elastic(t) {
    return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1;
}


/**
 *
 * Easing function for a boucne effect
 *
 * from https://github.com/DmitryBaranovskiy/raphael
 *
 * @param t
 * @returns {*}
 */
function bounce(t) {
    var s = 7.5625, p = 2.75, l;
    if (t < (1 / p)) {
        l = s * t * t;
    } else {
        if (t < (2 / p)) {
            t -= (1.5 / p);
            l = s * t * t + 0.75;
        } else {
            if (t < (2.5 / p)) {
                t -= (2.25 / p);
                l = s * t * t + 0.9375;
            } else {
                t -= (2.625 / p);
                l = s * t * t + 0.984375;
            }
        }
    }
    return l;
}
