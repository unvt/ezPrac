//modify for new small conversion 0423
const geojsonArea = require('@mapbox/geojson-area')

const preProcess = (f) => {
  f.tippecanoe = {
    layer: 'other',
    minzoom: 5,
    maxzoom: 5
  }
  // you can add any other proprocess.
  return f
}

const postProcess = (f) => {
if(f!==null){
  delete f.properties['_database']
  delete f.properties['_table']
}
  return f
}




const lut = {
  yourViewOrTableName: f => {
    f.tippecanoe = {
      layer: 'LayerName',
      minzoom: 0,
      maxzoom: 5
    }
    return f
  },
  sample_attribution_edit: f => {
    f.tippecanoe = {
      layer: 'landcover',
      minzoom: 3,
      maxzoom: 5
    }
    delete f.properties['id']
    delete f.properties['objectid']
    delete f.properties['objectid_1']
    if (f.properties.gridcode == 20 || f.properties.gridcode == 30 || f.properties.gridcode == 80){
    return f
    } else {
    return null
    }
  },
  custom_planet_land_a_l08: f => {
    f.tippecanoe = {
      layer: 'landmass',
      minzoom: 0,
      maxzoom: 5
    }
    delete f.properties['objectid']
    delete f.properties['fid_1']
    return f
  },
  custom_planet_ocean_l08: f => {
    f.tippecanoe = {
      layer: 'ocean',
      minzoom: 0,
      maxzoom: 5
    }
    delete f.properties['objectid']
    delete f.properties['fid_1']
    return f
  },
  rivers_lakecentrelines: f => {
    f.tippecanoe = {
      layer: 'water',
      maxzoom: 5
    }
  if (f.properties.scalerank == 1 || f.properties.scalerank == 2 || f.properties.scalerank == 3 || f.properties.scalerank == 4) {
    f.tippecanoe.minzoom = 3
  } else if (f.properties.scalerank == 5 || f.properties.scalerank == 6 || f.properties.scalerank == 7 ) {
    f.tippecanoe.minzoom = 4
  } else {
    f.tippecanoe.minzoom = 5
  }
    delete f.properties['objectid']
    delete f.properties['strokeweig']
    delete f.properties['dissolve']
    delete f.properties['note']
    return f
  },
  unhq_cm02_phyp_anno_l04: f => {
    f.tippecanoe = {
      layer: 'lab_water',
      minzoom: 3,
      maxzoom: 3
    }
  //Ocean minz 1, Bay minz 2, Sea minz3
  if (f.properties.annotationclassid == 0 || f.properties.annotationclassid == 1) {
    f.tippecanoe.minzoom = 0
  } else if (f.properties.annotationclassid == 3) {
    f.tippecanoe.minzoom = 1
  } else if (f.properties.annotationclassid == 2 || f.properties.annotationclassid == 4 || f.properties.annotationclassid == 5) {
    f.tippecanoe.minzoom = 2
  } else {
    f.tippecanoe.minzoom = 5
  } 
    delete f.properties['zorder']
    delete f.properties['element']
    delete f.properties['bold']
    delete f.properties['bold_resolved']
    delete f.properties['italic']
    delete f.properties['italic_resolved']
    delete f.properties['underline']
    delete f.properties['underline_resolved']
    delete f.properties['verticalalignment']
    delete f.properties['horizontalalignment']
    delete f.properties['verticalalignment_resolved']
    delete f.properties['horizontalalignment_resolved']
    delete f.properties['xoffset']
    delete f.properties['yoffset']
    delete f.properties['angle']
    delete f.properties['fontleading']
    delete f.properties['wordspacing']
    delete f.properties['characterwidth']
    delete f.properties['characterspacing']
    delete f.properties['flipangle']
    delete f.properties['orid_fid']
    delete f.properties['override']
  if (f.properties.status == 1) {
    return null
  } else {
    return f
  }
  },
  unhq_cm02_phyp_anno_l06: f => {
    f.tippecanoe = {
      layer: 'lab_water',
      minzoom: 4,
      maxzoom: 5
    }
   if (f.properties.annotationclassid == 6) {
    f.tippecanoe.minzoom = 5
  }
    delete f.properties['zorder']
    delete f.properties['element']
    delete f.properties['bold']
    delete f.properties['bold_resolved']
    delete f.properties['italic']
    delete f.properties['italic_resolved']
    delete f.properties['underline']
    delete f.properties['underline_resolved']
    delete f.properties['verticalalignment']
    delete f.properties['horizontalalignment']
    delete f.properties['verticalalignment_resolved']
    delete f.properties['horizontalalignment_resolved']
    delete f.properties['xoffset']
    delete f.properties['yoffset']
    delete f.properties['angle']
    delete f.properties['fontleading']
    delete f.properties['wordspacing']
    delete f.properties['characterwidth']
    delete f.properties['characterspacing']
    delete f.properties['flipangle']
    delete f.properties['orid_fid']
    delete f.properties['override']
  if (f.properties.status == 1) {
    return null
  } else {
    return f
  }
  },
  unhq_phyp: f => {
    f.tippecanoe = {
      layer: 'phyp_label',
      minzoom: 5,
      maxzoom: 5
    }
   if (f.properties.type_code == 4 && !/Sea|Ocean|Gulf/.test(f.properties.name) ){
     return f
   } else {
     return null
   }
  },
  unhq_wbya10: f => {
    f.tippecanoe = {
      layer: 'wbya10',
      minzoom: 2,
      maxzoom: 5
    }
    delete f.properties['objectid']
    delete f.properties['fid_1']
    return f
  },
  unhq_dral10: f => {
    f.tippecanoe = {
      layer: 'dral10',
      minzoom: 2,
      maxzoom: 5
    }
    delete f.properties['objectid']
    delete f.properties['fid_1']
    return f
  },
  unhq_popp: f => {
    f.tippecanoe = {
      layer: 'un_popp',
      minzoom: 3,
      maxzoom: 5
    }
   if (f.properties.cartolb === 'Alofi' ||f.properties.cartolb === 'Avarua' ||f.properties.cartolb === 'Sri Jayewardenepura Kotte' ) {
     return null
    } else if (f.properties.poptyp_code == 1 || f.properties.poptyp_code == 2) {
     return f
    } else if (f.properties.poptyp_code == 3 && f.properties.scl_id_code == 10) {
     return f
    } else {
     return null
    } 
  } 
}
module.exports = (f) => {
  return postProcess(lut[f.properties._table](preProcess(f)))
}

