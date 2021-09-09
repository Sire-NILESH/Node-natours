/* eslint-disable */
// when using obj of external src scripts like mapbox, stripe, never define or use them outside as top level code like below. Always usme them iside some function scope using them 
//const abc =  mapboxgl.accessToken = 'pk.eyJ1IjoiZHdyYWl0aDAiLCJhIjoiY2tzZWlnMDBqMTB6ZzJ2b2RwaWZzZzhvYSJ9.qXBUqSbPnsd2kFg8_EKrbQ';

export const displayMap = locations => {
      mapboxgl.accessToken = 'pk.eyJ1IjoiZHdyYWl0aDAiLCJhIjoiY2tzZWlnMDBqMTB6ZzJ2b2RwaWZzZzhvYSJ9.qXBUqSbPnsd2kFg8_EKrbQ';

   var map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/dwraith0/cksej264e4k4z17nz0cffw8sr',
      scrollZoom: false,
      // center: [lng,lat],
      // zoom: 10,
      // interactive: false,
   });

   const bounds = new mapboxgl.LngLatBounds();

   locations.forEach(loc => {
      //create marker
      const el = document.createElement('div');
      el.className = 'marker';

      //add marker
      new mapboxgl.Marker({
         element: el,
         anchor: 'bottom',
      })
         .setLngLat(loc.coordinates)
         .addTo(map);

      // Add popup message on each marker
      new mapboxgl.Popup({
         offset: 30
      })
         .setLngLat(loc.coordinates)
         .setHTML(`<p>Day ${loc.day}: ${loc.description}`)
         .addTo(map);

      // Extend map bounds to include current locations.
      bounds.extend(loc.coordinates);
   });


   map.fitBounds(bounds, {
      padding: {
         top: 200,
         bottom: 150,
         left: 100,
         right: 100
      }
   });
};

