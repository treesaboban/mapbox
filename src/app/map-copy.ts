import { Component, ElementRef, OnInit } from '@angular/core';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import * as d3 from 'd3';
import { Feature, Geometry } from 'geojson';
// import turf from '@turf/turf';
@Component({
  selector: 'app-map-common',
  standalone: true,
  imports: [],
  templateUrl: './map-common.component.html',
  styleUrl: './map-common.component.css'
})
export class MapCommonComponent implements OnInit{
  map:mapboxgl.Map | undefined;
  draw:any;
  mapLoaded = false;
  data=[
    {"lattitude":37.7749,"longitude":-122.4194},
    {"lattitude":37.7749,"longitude":-122.3994},
    {"lattitude":37.7549,"longitude":-122.4194},
  ]


constructor(private el: ElementRef){
  this.draw = new MapboxDraw({
    displayControlsDefault: true,
    // Select which mapbox-gl-draw control buttons to add to the map.
    controls: {
        polygon: true,
        trash: true
    },
    // Set mapbox-gl-draw to draw by default.
    // The user does not have to click the polygon control button first.
    defaultMode: 'draw_polygon'
});
}

  ngOnInit(): void {
    // this.createLineChart();
    mapboxgl.accessToken = 'pk.eyJ1IjoidHJlYXNhYm9iYW4iLCJhIjoiY2x5em56dXA5Mmo0ZzJrcHU2ejd3azkzeiJ9._tFcEoRrGm2ou7FeyTsh-g';
this.map = new mapboxgl.Map({
	container: 'map', // container ID
  style: 'mapbox://styles/mapbox/satellite-v9',
	// style: 'mapbox://styles/mapbox/streets-v12', // style URL mapbox://styles/mapbox/light-v11
  center: [-68.137343, 45.137451], // starting position [lng, lat]
	zoom: 9, // starting zoom
});
this.map.on('load', () => {
  this.mapLoaded = true;
  this.fetchGpsEndpoints();
});

// this.map.addControl(this.draw);
// this.map.on(this.draw.create, this.updateArea);
// this.map.on(this.draw.delete, this.updateArea);
// this.map.on(this.draw.update, this.updateArea);
 }
// private createLineChart(): void {
//   const width = 250;
//   const height = 250;
//   // create an svg container
//   const svg = d3.select('#map').append('svg').attr('width',width)
//   .attr('height',height)
//   .style('position','absolute')
//   .style('z-index','1000');
//  // draw a horizontal line
//  svg.append('line')
//  .attr('x1',0)
//  .attr('y1',height/2)
//  .attr('x2',width)
//  .attr('y2',height/2)
//  .attr('stroke','yellow')
//  .attr('stroke-width',2);
//   // draw a vertical line
//   svg.append('line')
//   .attr('x1',width/2)
//   .attr('y1',0)
//   .attr('x2',width/2)
//   .attr('y2',height)
//   .attr('stroke','yellow')
//   .attr('stroke-width',2);
//    // draw a vertical line
//    svg.append('line')
//    .attr('x1',width/3)
//    .attr('y1',0)
//    .attr('x2',width/3)
//    .attr('y2',height)
//    .attr('stroke','yellow')
//    .attr('stroke-width',2);
//     // draw a vertical line
//     svg.append('line')
//     .attr('x1',width/5)
//     .attr('y1',0)
//     .attr('x2',width/5)
//     .attr('y2',height)
//     .attr('stroke','yellow')
//     .attr('stroke-width',2);
//     // draw a horizontal line
//  svg.append('line')
//  .attr('x1',0)
//  .attr('y1',height/4)
//  .attr('x2',width)
//  .attr('y2',height/4)
//  .attr('stroke','yellow')
//  .attr('stroke-width',2);
// }


// updateArea(e: { type: string; }) {
//   const data = this.draw.getAll();
//   const answer = document.getElementById('calculated-area') as HTMLElement;
//   if (data.features.length > 0) {
//     console.log(data);
    
//       // const area = turf.area(data);
//       // Restrict the area to 2 decimal points.
//       // const rounded_area = Math.round(area * 100) / 100;
//       // answer.innerHTML = `<p><strong>${rounded_area}</strong></p><p>square meters</p>`;
//   } else {
//       answer.innerHTML = '';
//       if (e.type !== 'draw.delete')
//           alert('Click the map to draw a polygon.');
//   }
// }
// }
fetchGpsEndpoints() {
  // Replace with your API endpoint
  if(this.data){
    console.log(this.data);
    const coordinates = this.data;
    const fourthCord=this.calculateFourthCord(coordinates);
    coordinates.push(fourthCord);
    this.plotPolygon(coordinates);
   this.plotGpsPoints(coordinates);
  }
  else{
    console.log('error in fetching data');
    
  }
}

calculateFourthCord(coords:{ lattitude:number,longitude:number}[]) {
  const x1 = coords[0].longitude;
  const y1 = coords[0].lattitude;
  const x2 = coords[1].longitude;
  const y2 = coords[1].lattitude;
  const x3 = coords[2].longitude;
  const y3 = coords[2].lattitude;
  const x4 = x1 + (x3-x2);
  const y4 = y1 + (y3-y2);
  return {lattitude:y4,longitude:x4};
}

plotPolygon(coordinates:{ lattitude:number,longitude:number}[]) {
if(!this.mapLoaded) {
  console.log('map is not loaded');
  return;
}
const polyCord = coordinates.map(c=>[c.longitude,c.lattitude]);
polyCord.push([coordinates[0].longitude,coordinates[0].lattitude]);
const geojson:Feature<Geometry>={
  'type': 'Feature',
    'geometry': {
      'type': 'Polygon',
      'coordinates': [polyCord]
    },
    properties:{}
}
this.map!.addSource('polygon', {
  'type': 'geojson',
  'data': geojson
});
// add polygon fill layer
this.map!.addLayer({
  'id': 'polygon-layer',
  'type': 'fill',
  'source': 'polygon',
  'layout': {},
  'paint': {
    'fill-color': '#c3e8fa',
    'fill-opacity': 0.5
  }
});
// add border line
this.map!.addLayer({
  'id': 'polygon-border',
  'type': 'line',
  'source': 'polygon',
  'layout': {},
  'paint': {
    'line-color': '#20a6e8',
    'line-width': 2
  }
});

}
// }

plotGpsPoints(coordinates:{ lattitude:number,longitude:number}[]) {
  coordinates.forEach( coord => {
    const marker = new mapboxgl.Marker()
      // .setLngLat([coord.longitude,coord.lattitude])
      // .addTo(this.map!);
      this.map?.flyTo({center:[coord.longitude,coord.lattitude],zoom:5})
  });
}
}
///------------------leaflet
// ngOnInit() {
//   this.initMap();
// }

// private initMap(): void {
//   const map = L.map('map').setView([51.505, -0.09], 13);

//   L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//     maxZoom: 19,
//   }).addTo(map);

//   // Create an SVG overlay
//   const svg = d3.select('#map').append('svg')
//     .style('position', 'absolute')
//     .style('top', '0')
//     .style('left', '0')
//     .style('pointer-events', 'none'); // Allow map interaction

//   // Example: Add a circle to the SVG
//   svg.append('circle')
//     .attr('cx', 100)
//     .attr('cy', 100)
//     .attr('r', 10)
//     .style('fill', 'red')
//     .style('pointer-events', 'all'); // Enable interaction with the circle
// }