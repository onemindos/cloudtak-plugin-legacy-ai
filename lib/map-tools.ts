/**
 * map-tools.ts — CloudTAK map tools exposed to Legacy via CopilotKit useFrontendTool
 *
 * These tools are called by Legacy (or any AG-UI agent) through ToolCall events.
 * They execute in the browser with full access to the CloudTAK map store and COT API.
 *
 * Tool naming convention: map_<action> or cot_<action>
 * All coordinates are WGS84 decimal degrees.
 */



// Note: useFrontendTool is called inside a Vue component setup context.
// We register these via a dedicated composable mounted in AIPanel.vue.

export interface PlaceMarkerArgs {
    lat: number;
    lon: number;
    callsign: string;
    type?: string;       // MIL-STD-2525 code, e.g. 'a-f-G-U-C' friendly ground unit
    remarks?: string;
    group?: string;      // TAK group/color, e.g. 'Cyan', 'Red'
}

export interface DrawShapeArgs {
    shape: 'circle' | 'polygon' | 'route' | 'rectangle';
    coordinates: number[][];  // [[lat, lon], ...]
    callsign: string;
    remarks?: string;
}

export interface CenterMapArgs {
    lat: number;
    lon: number;
    zoom?: number;
}

export interface CotQueryArgs {
    filter?: string;         // callsign substring filter
    typePrefix?: string;     // e.g. 'a-f-' for friendly only
    maxResults?: number;
}

export interface MissionDetailArgs {
    missionName: string;
}

/**
 * Build the tool definitions. Called once at plugin install.
 * Handlers receive typed args and must return a JSON-serializable result.
 */
export function registerMapTools(): void {
    // Tools are registered in AIPanel.vue setup() via useFrontendTool
    // because they need access to the live map store (pinia).
    // This module exports the definitions and handler factories so the
    // panel can wire them with store access injected.

    console.log('[onemind-ai] map-tools module loaded — handlers registered in AIPanel');
}

/** Tool definitions for the AG-UI / CopilotKit runtime */
export const TOOL_DEFS = [
    {
        name: 'map_place_marker',
        description: 'Place a marker on the TAK map at the given coordinates. Use MIL-STD-2525 type codes (a-f-G-U-C friendly ground unit, a-h-G-U-C hostile, a-n-G neutral, a-u-G unknown).',
        parameters: {
            type: 'object',
            properties: {
                lat:      { type: 'number', description: 'Latitude, WGS84 decimal degrees' },
                lon:      { type: 'number', description: 'Longitude, WGS84 decimal degrees' },
                callsign: { type: 'string', description: 'Display name for the marker' },
                type:     { type: 'string', description: 'MIL-STD-2525 SIDC code, e.g. a-f-G-U-C' },
                remarks:  { type: 'string', description: 'Optional remarks text' },
            },
            required: ['lat', 'lon', 'callsign'],
        },
    },
    {
        name: 'map_center_on',
        description: 'Center and zoom the TAK map on a location.',
        parameters: {
            type: 'object',
            properties: {
                lat:  { type: 'number', description: 'Latitude' },
                lon:  { type: 'number', description: 'Longitude' },
                zoom: { type: 'number', description: 'Zoom level 1-22, default 14' },
            },
            required: ['lat', 'lon'],
        },
    },
    {
        name: 'cot_list_visible',
        description: 'List all CoT entities currently visible on the map, optionally filtered by callsign or type prefix.',
        parameters: {
            type: 'object',
            properties: {
                filter:     { type: 'string', description: 'Callsign substring filter (case-insensitive)' },
                typePrefix: { type: 'string', description: 'CoT type prefix filter, e.g. a-f- for friendly' },
                maxResults: { type: 'number', description: 'Max entities to return, default 50' },
            },
        },
    },
    {
        name: 'map_draw_shape',
        description: 'Draw a shape (circle, polygon, route, rectangle) on the TAK map.',
        parameters: {
            type: 'object',
            properties: {
                shape:       { type: 'string', enum: ['circle', 'polygon', 'route', 'rectangle'] },
                coordinates: { type: 'array', items: { type: 'array', items: { type: 'number' } },
                               description: 'Array of [lat, lon] pairs defining the shape' },
                callsign:    { type: 'string', description: 'Display name' },
                remarks:     { type: 'string' },
            },
            required: ['shape', 'coordinates', 'callsign'],
        },
    },
    {
        name: 'mission_subscribe',
        description: 'Subscribe to a TAK mission by name. Requires Approve/Deny confirmation from the operator.',
        parameters: {
            type: 'object',
            properties: {
                missionName: { type: 'string', description: 'Exact mission name to subscribe to' },
            },
            required: ['missionName'],
        },
    },
] as const;
