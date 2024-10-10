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
  for (let i = 1; i < numRows; i++) {
    const y = polygonBounds.minY + i * yStep;
    for (let j = 1; j < numCols; j++) {
      const x = polygonBounds.minX + j * xStep;
      const centerX = x - xStep / 2;
      const centerY = y - yStep / 2;
      cellCenters.push([centerX, centerY]);
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
    this.addTextToCells(cellCenters); // Add text to cells
}
// adding text to cells
addTextToCells(cellCenters: [number, number][]) {
  const texts = this.plotdata[0].plotinfo; // Your text for each cell
  // const colors = ['red', 'blue', 'green', 'orange', 'purple']; // Example color array
    texts.forEach((text, index) => {
      if (index < cellCenters.length) {
        const [x, y] = cellCenters[index]; // Destructuring the tuple
        // const color = colors[index % colors.length]; // Cycle through colors
        this.addTextToMap(x, y, text.PLTID, `text-${index}`); // Pass color to the method
      }
    });
}

// adding text cells to map
addTextToMap(x: number, y: number, text: string, textId: string) {
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
        // Check if the layer already exists before adding it
        if (!this.map!.getLayer(textId)) {
            this.map!.addLayer({
                'id': textId,
                'type': 'symbol',
                'source': textId,
                'layout': {
                    'text-field': ['get', 'text'],
                    'text-size': 12,
                    'text-anchor': 'center',
                    'text-offset': [0, 0]
                },
                'paint': {
                    'text-color': 'red'
                }
            });
        }
    } else {
        // Check if the layer exists before removing it
        if (this.map!.getLayer(textId)) {
            this.map!.removeLayer(textId);
        }
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
