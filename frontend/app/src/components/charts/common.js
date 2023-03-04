import * as d3 from 'd3';

// How far into the svg do we draw the axes
const MARGINS_PROPORTION = 1 / 40;

/**
 * Calculate the bounds for a chart given full the dimensions of the SVG, as well as the
 * MARGINS_PROPORTION (Global).
 * @param dimensions The full dimensions of the SVG.
 * @returns {{endY: number, endX: number, startY: number, startX: number}}
 */
export const getChartBounds = (dimensions) => {
    const {width, height} = dimensions;
    const margins = {w: width * MARGINS_PROPORTION, h: height * MARGINS_PROPORTION};

    return {
        startX: margins.w,
        endX: (width - margins.w),
        startY: (height - margins.h),
        endY: margins.h
    }
}

/**
 * Get the extrema of a 2d array.
 * @param data The 2d array.
 * @returns {{minY: *, minX: *, maxY: *, maxX: *}}
 */
export const getExtrema = (data) => {
    const [minX, maxX] = d3.extent(data, d => d.x);
    const [minY, maxY] = d3.extent(data, d => d.y);

    return {minX, maxX, minY, maxY};
}