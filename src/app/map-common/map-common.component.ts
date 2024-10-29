import { Component, ElementRef, OnInit } from '@angular/core';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import * as d3 from 'd3';
import {
  Feature,
  GeoJsonProperties,
  Geometry,
  Polygon,
  Position,
} from 'geojson';
import { PlotData } from '../services/PlotData';

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
  data = [] as any;
  plotdata = PlotData;
  nRows: any;
  nRngs: any;
  minRow: any;
  minRng: any;
  groupedData = [] as any;
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
      style: 'mapbox://styles/mapbox/satellite-streets-v11',
      center: [-68.137343, 45.137451], // starting position [lng, lat]
      zoom: 15, // starting zoom
    });
    // sthis.map.rotateTo(90);
    this.map.on('load', () => {
      this.mapLoaded = true;
      const coords: [number, number][] = [];
      const seenCoords = new Set<string>();

      this.plotdata[0].data.forEach((item: any) => {
        for (const key in item) {
          if (item.hasOwnProperty(key)) {
            const entry = item[key];
            if (
              entry.abc.length > 0 &&
              entry.nRows &&
              entry.nRngs &&
              entry.minRng &&
              entry.minRow
            ) {
              this.nRows = entry.nRows;
              this.nRngs = entry.nRngs;
              this.minRng = entry.minRng;
              this.minRow = entry.minRow;
              entry.abc.forEach((coord: { long: number; lat: number }) => {
                const coordString = `${coord.long},${coord.lat}`;
                if (!seenCoords.has(coordString)) {
                  seenCoords.add(coordString);
                  coords.push([coord.long, coord.lat]);
                  this.data = coords;
                }
              });
            }
          }
        }
      });

      this.fetchGpsEndpoints();
    });
  }

  fetchGpsEndpoints() {
    if (this.data) {
      const coordinates = this.data;
      const fourthCord = this.calculateFourthCord(coordinates);
      coordinates.push(fourthCord);
      this.plotPolygon(coordinates);
      this.plotGpsPoints(coordinates);
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
    const x4 = x2 + x3 - x1;
    const y4 = y2 + y3 - y1;

    return [x4, y4];
  }

  // Given bounding box coordinates (min_lon, min_lat, max_lon, max_lat)
  bbox = [-123.1216, 49.2827, -123.1116, 49.2927];

  // Function to create square coordinates
  createSquare(bbox: number[]): number[][] {
    const centerLon = (bbox[0] + bbox[2]) / 2;
    const centerLat = (bbox[1] + bbox[3]) / 2;
    const sideLength = Math.max(bbox[2] - bbox[0], bbox[3] - bbox[1]);

    return [
      [centerLon - sideLength / 2, centerLat - sideLength / 2],
      [centerLon + sideLength / 2, centerLat - sideLength / 2],
      [centerLon + sideLength / 2, centerLat + sideLength / 2],
      [centerLon - sideLength / 2, centerLat + sideLength / 2],
      [centerLon - sideLength / 2, centerLat - sideLength / 2], // Close the square
    ];
  }

  // Function to calculate bounding box
  calculateBBox(geojson: Feature<Geometry>): number[] {
    let minX: any;
    let minY: any;
    let maxX: any;
    let maxY: any;

    if (
      geojson.geometry.type === 'Polygon' ||
      geojson.geometry.type === 'MultiPolygon'
    ) {
      const coordinates = geojson.geometry.coordinates[0];
      coordinates.forEach((coord) => {
        if (minX === undefined || coord[0] < minX) minX = coord[0];
        if (minY === undefined || coord[1] < minY) minY = coord[1];
        if (maxX === undefined || coord[0] > maxX) maxX = coord[0];
        if (maxY === undefined || coord[1] > maxY) maxY = coord[1];
      });
    } else {
      throw new Error('Unsupported geometry type');
    }

    return [minX, minY, maxX, maxY];
  }

  plotPolygon(coordinates: [number, number][]) {
    if (!this.mapLoaded) {
      console.log('map is not loaded');
      return;
    }

    const closedCoordinates: [number, number][] = [
      ...coordinates,
      coordinates[0],
    ];
    const geojson: Feature<Geometry> = {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [closedCoordinates],
      },
      properties: {},
    };

    const bbox = this.calculateBBox(geojson);
    const squareCoordinates: any = this.createSquare(bbox);
    const squareGeojson = {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [squareCoordinates],
      },
      properties: {},
    };

    this.map!.addSource('polygon', {
      type: 'geojson',
      data: squareGeojson as any,
    });

    this.map!.addLayer({
      id: 'polygon-layer',
      type: 'fill',
      source: 'polygon',
      layout: {},
      paint: {
        'fill-color': '#c3e8fa',
        'fill-opacity': 0.1,
      },
    });

    this.map!.addLayer({
      id: 'polygon-border',
      type: 'line',
      source: 'polygon',
      layout: {},
      paint: {
        'line-color': '#cceeff',
        'line-width': 1,
      },
    });

    this.groupedData = this.groupByTID(this.plotdata[0].plotinfo);
    console.log(this.groupedData);   
  this.drawGridLines(squareCoordinates);
}

  // Function to group plotinfo by TID
  groupByTID(plotData: any) {
    return plotData.reduce((acc: any, plot: any) => {
      if (!acc[plot.TID]) acc[plot.TID] = [];
      acc[plot.TID].push(plot);
      return acc;
    }, {});
  }

  drawGridLines(coordinates: number[][]) {
    const polygonBounds = this.getPolygonBounds(coordinates);
    const numRows = this.nRows;
    const numCols = this.nRngs;
    const xStep = (polygonBounds.maxX - polygonBounds.minX) / numCols;
    const yStep = (polygonBounds.maxY - polygonBounds.minY) / numRows;
    // Store cell centers and boundaries for later use
    const cellCenters = [] as any;
    const cellBoundaries = [] as any;
    for (let i = 0; i < numRows; i++) {
      const y = polygonBounds.minY + i * yStep;
      for (let j = 0; j < numCols; j++) {
        const x = polygonBounds.minX + j * xStep;
        const centerX = x + xStep / 2;
        const centerY = y + yStep / 2;
        cellCenters.push([centerX, centerY]);
        cellBoundaries.push([
          [x, y],
          [x + xStep, y],
          [x + xStep, y + yStep],
          [x, y + yStep],
          [x, y],
        ]);
      }
    }

    // Draw horizontal lines
    for (let i = 1; i < numRows; i++) {
      const y = polygonBounds.minY + i * yStep;
      const lineCoords = [
        [polygonBounds.minX, y],
        [polygonBounds.maxX, y],
      ];
      //  this.drawLine(lineCoords, `horizontal-line-${i}`);
    }

    // Draw vertical lines
    for (let i = 1; i < numCols; i++) {
      const x = polygonBounds.minX + i * xStep;
      const lineCoords = [
        [x, polygonBounds.minY],
        [x, polygonBounds.maxY],
      ];
       this.drawLine(lineCoords, `vertical-line-${i}`);
    }

    // Add text to specific cells on zooming
    this.addTextToCells(cellCenters, cellBoundaries, coordinates as any); // Add text to cells
  }

  // Function to calculate the bounding box of the polygon (min/max X and Y coordinates)
  getPolygonBounds(coords: any[]) {
    let minX = coords[0][0],
      maxX = coords[0][0];
    let minY = coords[0][1],
      maxY = coords[0][1];

    for (const coord of coords) {
      if (coord[0] < minX) minX = coord[0];
      if (coord[0] > maxX) maxX = coord[0];
      if (coord[1] < minY) minY = coord[1];
      if (coord[1] > maxY) maxY = coord[1];
    }

    return { minX, maxX, minY, maxY };
  }

  plotGpsPoints(coordinates: number[][]) {
    const marker = new mapboxgl.Marker({ color: '#b40219' })
      .setLngLat([coordinates[0][0], coordinates[0][1]])
      .addTo(this.map!);

    this.map?.flyTo({
      center: [coordinates[0][0], coordinates[0][1]],
      zoom: 15,
    });

    this.map?.on('zoom', () => {
      const currentZoom = this.map!.getZoom();
      if (currentZoom > 10) {
        // Adjust the zoom level as needed
        marker.remove(); // Remove marker when zoomed in
      } else {
        marker.addTo(this.map!); // Add marker when zoomed out
      }
    });
  }

  // Function to draw a line on the map using coordinates
  drawLine(
    coords: any[],
    lineId: string
  ) {
    // Check if the source already exists
    if (this.map?.getSource(lineId)) {
      this.map?.removeSource(lineId);
    }

    this.map!.addSource(lineId, {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: coords,
        },
        properties: {},
      },
    });

    // Check if the layer already exists
    if (this.map?.getLayer(lineId)) {
      this.map?.removeLayer(lineId);
    }

    this.map!.addLayer({
      id: lineId,
      type: 'line',
      source: lineId,
      layout: {},
      paint: {
        'line-color': '#7ecbf1',
        'line-width': 1,
      },
    });
  }

  // Function to calculate the centroid of a polygon
  calculateCentroid = (coords: [number, number][]) => {
    let xSum = 0,
      ySum = 0,
      n = coords.length;
    coords.forEach(([x, y]) => {
      xSum += x;
      ySum += y;
    });
    return [xSum / n, ySum / n];
  };

  // Adding text cells to map
  addTextToMap(
    x: number,
    y: number,
    text: string,
    textId: string,
    headingText: string,
    polygonCoordinates: [number, number][]
  ) {
    // Calculate the centroid of the polygon
    const [centroidX, centroidY] = this.calculateCentroid(polygonCoordinates);

    // Check if the source already exists
    const existingSource = this.map?.getSource(textId);
    if (existingSource && 'setData' in existingSource) {
      // Update the existing source
      existingSource.setData({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [x, y],
        },
        properties: {
          text: text,
        },
      });
    } else {
      // Add the source if it does not exist
      this.map?.addSource(textId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [x, y],
          },
          properties: {
            text: text,
          },
        },
      });
    }

    // Add or remove text layers based on zoom level
    this.map?.on('zoom', () => {
      const currentZoom = this.map!.getZoom();
      if (currentZoom >= 18) {
        // Check if the text layer already exists before adding it
        if (!this.map?.getLayer(textId)) {
          this.map?.addLayer({
            id: textId,
            type: 'symbol',
            source: textId,
            layout: {
              'text-field': ['get', 'text'],
              'text-size': 16, // Increase text size
              'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'], // Specify font
              'text-anchor': 'center',
              'text-offset': [0, 0],
              'text-allow-overlap': true, // Allow text to overlap
            },
            paint: {
              'text-color': 'blue', // Change text color
              'text-halo-color': 'white', // Add a halo effect
              'text-halo-width': 2, // Width of the halo
              'text-opacity': 0.8, // Adjust opacity
            },
          });
        }
        // Remove the heading layer if it exists
        if (this.map?.getLayer('heading-layer')) {
          this.map?.removeLayer('heading-layer');
        }
        if (this.map?.getSource('heading-layer')) {
          this.map?.removeSource('heading-layer');
        }
      } else if (currentZoom >= 13 && currentZoom < 16) {
        // Add the heading layer at the centroid
        if (!this.map?.getLayer('heading-layer')) {
          // Remove existing source if it exists
          if (this.map?.getSource('heading-layer')) {
            this.map?.removeSource('heading-layer');
          }
          this.map?.addSource('heading-layer', {
            type: 'geojson',
            data: {
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [centroidX, centroidY],
              },
              properties: {
                text: headingText,
              },
            },
          });
          this.map?.addLayer({
            id: 'heading-layer',
            type: 'symbol',
            source: 'heading-layer',
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
              'text-opacity': 0.8, // Adjust opacity if needed
            },
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
        if (this.map?.getSource('heading-layer')) {
          this.map?.removeSource('heading-layer');
        }
      }
    });
  }

  // highlighting borders
  highlightCell(cellBounds: [number, number][], highlightId: string) {
    if (this.map?.getSource(highlightId)) {
      this.map?.removeSource(highlightId);
    }

    this.map?.addSource(highlightId, {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [cellBounds],
        },
        properties: {},
      },
    });

    if (this.map?.getLayer(`${highlightId}-fill`)) {
      this.map?.removeLayer(`${highlightId}-fill`);
    }

    this.map?.addLayer({
      id: `${highlightId}-fill`,
      type: 'fill',
      source: highlightId,
      layout: {},
      paint: {
        'fill-color': '#cceeff',
        'fill-opacity': 0.3,
      },
    });

    if (this.map?.getLayer(`${highlightId}-line`)) {
      this.map?.removeLayer(`${highlightId}-line`);
    }

    this.map?.addLayer({
      id: `${highlightId}-line`,
      type: 'line',
      source: highlightId,
      layout: {},
      paint: {
        'line-color': '#7ecbf1', 
        'line-width': 2,
      },
    });
  }
  // Adding text to cells
  addTextToCells(
    cellCenters: [number, number][],
    cellBoundaries: [number, number][][],
    polygonCoordinates: [number, number][]
  ) {
    const texts = this.plotdata[0].plotinfo;
    let trialId: string;
    for (const element of texts) {
      trialId =
        element.TID.length > 12
          ? element.TID.substring(8).slice(0, -4)
          : element.TID;
    }
    texts.forEach((text: { PLTID: string }, index: number) => {
      if (index < cellCenters.length) {
        const [x, y] = cellCenters[index];
        this.highlightCell(cellBoundaries[index], `highlight-${index}`);
        this.addTextToMap(
          x,
          y,
          text.PLTID,
          `text-${index}`,
          trialId,
          polygonCoordinates
        );
      }
    });
  }
}
