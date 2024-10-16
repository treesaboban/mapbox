import { Component, ElementRef, OnInit } from '@angular/core';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import * as d3 from 'd3';
import { Feature, GeoJsonProperties, Geometry, Polygon } from 'geojson';
import { PlotData } from '../services/PlotData';
import * as turf from '@turf/turf';

@Component({
  selector: 'app-map-common',
  standalone: true,
  imports: [],
  templateUrl: './map-common.component.html',
  styleUrl: './map-common.component.css',
})
export class MapCommonComponent implements OnInit {
  map: mapboxgl.Map | undefined;
  draw: any;
  mapLoaded = false;
  data =[] as any;
  minRows = 3;
  maxRows = 10;
  plotdata = PlotData;
  constructor(private el: ElementRef) {
    this.draw = new MapboxDraw({
      displayControlsDefault: true,
      controls: {
        polygon: true,
        trash: true,
      },
      defaultMode: 'draw_polygon',
    });
  }

  ngOnInit(): void {
    mapboxgl.accessToken =
      'pk.eyJ1IjoidHJlYXNhYm9iYW4iLCJhIjoiY2x5em56dXA5Mmo0ZzJrcHU2ejd3azkzeiJ9._tFcEoRrGm2ou7FeyTsh-g';
    this.map = new mapboxgl.Map({
      container: 'map', // container ID
      style: 'mapbox://styles/mapbox/satellite-v9',
      center: [-68.137343, 45.137451], // starting position [lng, lat]
      zoom: 15, // starting zoom
    });
    this.map.on('load', () => {
      this.mapLoaded = true;
      this.fetchGpsEndpoints();
    });   
    this.plotdata[0].plantedCorners.abc.forEach(i=>{  
      this.data.push(i);
    })
  }

  fetchGpsEndpoints() {
    // Replace with your API endpoint
    if (this.data) {
      const coordinates = this.data;
      const fourthCord = this.calculateFourthCord(coordinates);
      coordinates.push(fourthCord);
      this.plotPolygon(coordinates);
      this.plotGpsPoints(coordinates);
      // this.plotRectangles(coordinates);
    } else {
      console.log('error in fetching data');
    }
  }
  
  calculateFourthCord(coords: number[][]) {
    const x1 = coords[0][0];
    const y1 = coords[0][1];
    const x2 = coords[1][0];
    const y2 = coords[1][1];
    const x3 = coords[2][0];
    const y3 = coords[2][1];

    // Calculate the fourth coordinate for a rectangle
    const x4 = x1 + (x3 - x2);
    const y4 = y1 + (y3 - y2);
    return [x4, y4];
}


plotPolygon(coordinates: number[][]) {
  if (!this.mapLoaded) {
      console.log('map is not loaded');
      return;
  }

  // Ensure the polygon is closed by adding the first coordinate at the end
  const closedCoordinates = [...coordinates, coordinates[0]]; 

  const geojson: Feature<Geometry> = {
      type: 'Feature',
      geometry: {
          type: 'Polygon',
          coordinates: [closedCoordinates],
      },
      properties: {},
  };

  this.map!.addSource('polygon', {
      type: 'geojson',
      data: geojson,
  });

  // Add polygon fill layer
  this.map!.addLayer({
      id: 'polygon-layer',
      type: 'fill',
      source: 'polygon',
      layout: {},
      paint: {
          'fill-color': '#c3e8fa',
          'fill-opacity': 0.5,
      },
  });

  // Add border line
  this.map!.addLayer({
      id: 'polygon-border',
      type: 'line',
      source: 'polygon',
      layout: {},
      paint: {
          'line-color': '#20a6e8',
          'line-width': 2,
      },
  });

  this.drawGridLines(closedCoordinates);
}

 
plotGpsPoints(coordinates: number[][]) {
  const marker = new mapboxgl.Marker({ color: '#b40219' })
    .setLngLat([coordinates[0][0], coordinates[0][1]])
    .addTo(this.map!);

  this.map?.flyTo({
    center: [coordinates[0][0], coordinates[0][1]],
    zoom: 5,
  });

  this.map?.on('zoom', () => {
      const currentZoom = this.map!.getZoom();
      if (currentZoom > 10) { // Adjust the zoom level as needed
          marker.remove(); // Remove marker when zoomed in
      } else {
          marker.addTo(this.map!); // Add marker when zoomed out
      }
  });
}

// Function to calculate the centroid of a polygon
calculateCentroid = (coords: [number, number][]) => {
  let xSum = 0, ySum = 0, n = coords.length;
  coords.forEach(([x, y]) => {
    xSum += x;
    ySum += y;
  });
  return [xSum / n, ySum / n];
};

drawGridLines(coordinates: number[][]) {
  const polygonBounds = this.getPolygonBounds(coordinates);
  const numRows = this.plotdata[0].nRows;
  const numCols = this.plotdata[0].nRngs;
  // const numRows = this.maxRows;
  // const numCols = this.maxRows;  // Assuming square grid, you can change this if needed.

  const xStep = (polygonBounds.maxX - polygonBounds.minX) / numCols;
  const yStep = (polygonBounds.maxY - polygonBounds.minY) / numRows;
  // Store cell centers for later use
  const cellCenters = [] as any;
  const cellBoundaries = [] as any;
  for (let i = 1; i < numRows; i++) {
    const y = polygonBounds.minY + i * yStep;
    for (let j = 1; j < numCols; j++) {
      const x = polygonBounds.minX + j * xStep;
      const centerX = x - xStep / 2;
      const centerY = y - yStep / 2;
      cellCenters.push([centerX, centerY]);
      cellBoundaries.push([
        [x, y],
        [x + xStep, y],
        [x + xStep, y + yStep],
        [x, y + yStep],
        [x, y]
      ]);
    }
  }

  // Draw horizontal lines
  for (let i = 1; i < numRows; i++) {
    const y = polygonBounds.minY + i * yStep;
    const lineCoords = [
      [polygonBounds.minX, y],
      [polygonBounds.maxX, y]
    ];
    this.drawLine(lineCoords, `horizontal-line-${i}`);
  }

  // Draw vertical lines
  for (let i = 1; i < numCols; i++) {
    const x = polygonBounds.minX + i * xStep;
    const lineCoords = [
      [x, polygonBounds.minY],
      [x, polygonBounds.maxY]
    ];
    this.drawLine(lineCoords, `vertical-line-${i}`);
  }
  // Add text to specific cells on zooming
    this.addTextToCells(cellCenters, cellBoundaries, coordinates as any); // Add text to cells
}
// adding text to cells
addTextToCells(cellCenters: [number, number][], cellBoundaries: [number, number][][], polygonCoordinates: [number, number][]) {
  const texts = this.plotdata[0].plotinfo; // Your text for each cell
  let trialId: string;
  for (const element of this.plotdata[0].plotinfo) {
    if (element.TID.length > 12) {
      trialId = (element.TID).substring(8).slice(0, -4);
    } else {
      trialId = element.TID;
    }
  }
  texts.forEach((text, index) => {
      if (index < cellCenters.length) {
        const [x, y] = cellCenters[index]; // Destructuring the tuple
        this.addTextToMap(x, y, text.id, `text-${index}`, trialId, polygonCoordinates); // Add text to the map
        this.highlightCell(cellBoundaries[index], `highlight-${index}`); // Highlight the cell
      }
    });
}

// adding text cells to map
addTextToMap(x: number, y: number, text: string, textId: string, headingText: string, polygonCoordinates: [number, number][]) {
   // Calculate the centroid of the polygon
   const [centroidX, centroidY] = this.calculateCentroid(polygonCoordinates);

  // Check if the source already exists
  const existingSource = this.map!.getSource(textId);
  if (existingSource && 'setData' in existingSource) {
    // Update the existing source
    existingSource.setData({
      'type': 'Feature',
      'geometry': {
        'type': 'Point',
        'coordinates': [x, y]
      },
      properties: {
        'text': text
      }
    });
  } 
  else {
    // Add the source if it does not exist
    this.map!.addSource(textId, {
      'type': 'geojson',
      'data': {
        'type': 'Feature',
        'geometry': {
          'type': 'Point',
          'coordinates': [x, y]
        },
        properties: {
          'text': text
        }
      }
    });
  }
  // Add text to specific cells on zooming
  this.map?.on('zoom', () => {
    const currentZoom = this.map!.getZoom();
    if (currentZoom >= 16) {
      // Check if the text layer already exists before adding it
      if (!this.map?.getLayer(textId)) {
        this.map?.addLayer({
          'id': textId,
          'type': 'symbol',
          'source': textId,
          'layout': {
            'text-field': ['get', 'text'],
            'text-size': 16, // Increase text size
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'], // Specify font
            'text-anchor': 'center',
            'text-offset': [0, 0],
            'text-allow-overlap': true // Allow text to overlap
          },
          'paint': {
            'text-color': 'blue', // Change text color
            'text-halo-color': 'white', // Add a halo effect
            'text-halo-width': 2, // Width of the halo
            'text-opacity': 0.8 // Adjust opacity
          }
        });
      }
      // Remove the heading layer if it exists
      if (this.map?.getLayer('heading-layer')) {
        this.map?.removeLayer('heading-layer');
      }
    } else if (currentZoom >= 13 && currentZoom < 16) {
      // Add the heading layer at the centroid
      if (!this.map?.getLayer('heading-layer')) {
        this.map?.addLayer({
          id: 'heading-layer',
          type: 'symbol',
          source: {
            'type': 'geojson',
            'data': {
              'type': 'Feature',
              'geometry': {
                'type': 'Point',
                'coordinates': [centroidX, centroidY]
              },
              properties: {
                'text': headingText
              }
            }
          },
          layout: {
            'text-field': headingText,
            'text-size': 16,
            'text-font': ['Open Sans Bold'],
            'text-anchor': 'center', // Center the text
            'text-offset': [0, 0], // No offset, text will be exactly at the point
          },
          paint: {
            'text-color': 'black', // Set the text color
            'text-halo-color': 'white', // Optional: Add a halo effect for better visibility
            'text-halo-width': 2, // Width of the halo
            'text-opacity': 0.8 // Adjust opacity if needed
          }
        });
      }
      // Remove the text layer if it exists
      if (this.map?.getLayer(textId)) {
        this.map?.removeLayer(textId);
      }
    } else {
      // Remove both text and heading layers if they exist
      if (this.map?.getLayer(textId)) {
        this.map?.removeLayer(textId);
      }
      if (this.map?.getLayer('heading-layer')) {
        this.map?.removeLayer('heading-layer');
      }
    }
  });

}



// Highlight cells with texts
highlightCell(cellBounds: [number, number][], highlightId: string) {
  // Check if the source already exists
  if (this.map?.getSource(highlightId)) {
    this.map?.removeSource(highlightId);
  }
  // Add the source for the highlighted cell
  this.map?.addSource(highlightId, {
    'type': 'geojson',
    'data': {
      'type': 'Feature',
      'geometry': {
        'type': 'Polygon',
        'coordinates': [cellBounds]
      },
      properties:{}
    }
  });
  // Check if the layer already exists
  if (this.map?.getLayer(highlightId)) {
    this.map?.removeLayer(highlightId);
  }
  // Add the layer for the highlighted cell
  this.map?.addLayer({
    'id': highlightId,
    'type': 'fill',
    'source': highlightId,
    'layout': {},
    'paint': {
      'fill-color': 'yellow', // Background color
      'fill-opacity': 0.5, // Adjust opacity if needed
      'fill-outline-color': 'black', // Border color
      // 'fill-outline-width': 2 // Border thickness
    }
  });
}
 // Function to draw a line on the map using coordinates
 drawLine(coords: any[], lineId: string) {
  this.map!.addSource(lineId, {
    'type': 'geojson',
    'data': {
      'type': 'Feature',
      'geometry': {
        'type': 'LineString',
        'coordinates': coords
      },
      properties:{}
    }
  });

  this.map!.addLayer({
    'id': lineId,
    'type': 'line',
    'source': lineId,
    'layout': {},
    'paint': {
      'line-color': '#53b6bd',
      'line-width': 2
    }
  });
}
 // Function to calculate the bounding box of the polygon (min/max X and Y coordinates)
 getPolygonBounds(coords: any[]) {
  let minX = coords[0][0], maxX = coords[0][0];
  let minY = coords[0][1], maxY = coords[0][1];

  for (const coord of coords) {
    if (coord[0] < minX) minX = coord[0];
    if (coord[0] > maxX) maxX = coord[0];
    if (coord[1] < minY) minY = coord[1];
    if (coord[1] > maxY) maxY = coord[1];
  }

  return { minX, maxX, minY, maxY };
}
}
