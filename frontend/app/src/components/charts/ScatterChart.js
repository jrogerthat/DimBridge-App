import {useEffect, useRef} from "react";
import * as d3 from 'd3';
import {isNil} from "../../utils";
import {withDimensions} from "../../wrappers/dimensions";
import {useDispatch} from "react-redux";
import {addClause, removeClause} from "../../slices/clauseSlice";
import {getChartBounds, getExtrema} from "./common";

// How far from the axes do we start drawing points
const BUFFER_PROPORTION = 1 / 20;


/**
 * Append groups for a ScatterChart.
 * @param selection the selection to append the groups to.
 */
const appendGroups = (selection) => {
    selection.append('g').attr('id', 'circlesG')
    selection.append('g').attr('id', 'xAxisG');
    selection.append('g').attr('id', 'yAxisG');
    selection.append('g').attr('id', 'brush');
}

/**
 * Create the scales based on the domain extrema and range dimensions.
 * @param minX The minimum of the feature that will be used for the X.
 * @param maxX The maximum of the feature that will be used for the X.
 * @param minY The minimum of the feature that will be used for the Y.
 * @param maxY The maximum of the feature that will be used for the Y.
 * @param startX The start of the range for the X.
 * @param endX The end of the range for the X.
 * @param startY The start of the range for the Y.
 * @param endY The end of the range for the Y.
 * @returns {{xScale: *, yScale: *}}
 */
const createScatterScales = ({minX, maxX, minY, maxY}, {startX, endX, startY, endY}) => {


    const xScaleBuffer = (maxX - minX) * BUFFER_PROPORTION;
    const yScaleBuffer = (maxY - minY) * BUFFER_PROPORTION;

    const xScale = d3.scaleLinear()
        .domain([minX - xScaleBuffer, maxX + xScaleBuffer])
        .range([startX, endX]);
    const yScale = d3.scaleLinear()
        .domain([minY - yScaleBuffer, maxY + yScaleBuffer])
        .range([startY, endY]);

    return {xScale, yScale};
}

/**
 * Create the axes for the plot.
 * @param rootG The rootG to find the axis groups on.
 * @param xScale The scale for the X.
 * @param yScale The scale for the Y.
 * @param startX How far from the left to start drawing the Y axis in pixel space.
 * @param startY How far from the bottom to start drawing the X axis in pixel space
 */
const callAxis = (rootG,
                  {xScale, yScale},
                  {startX, startY}) => {
    const xAxisG = rootG.select('#xAxisG');
    xAxisG.selectAll('*').remove();
    const yAxisG = rootG.select('#yAxisG');
    yAxisG.selectAll('*').remove();

    const xAxis = d3.axisBottom(xScale).tickFormat(() => '').tickSize(0);
    const yAxis = d3.axisLeft(yScale).tickFormat(() => '').tickSize(0);

    xAxisG
        .attr('class', 'axis')
        .attr('transform', `translate(0, ${startY})`)
        .call(xAxis);

    yAxisG
        .attr('class', 'axis')
        .attr('transform', `translate(${startX}, 0)`)
        .call(yAxis);
}

/**
 * Join the circles onto the plot.
 * @param rootG The rootG to find the circles G.
 * @param xScale The scale for the X.
 * @param yScale The scale for the Y.
 * @param data The data to plot.
 */
const joinCircles = (rootG,
                     {xScale, yScale},
                     data) => {
    const circlesG = rootG.select('#circlesG');

    circlesG
        .selectAll('circle')
        .data(data, d => d.id)
        .join('circle')
        .raise()
        .attr('r', 2)
        .attr('cx', function (d) {
            return xScale(d.x);
        })
        .attr('cy', function (d) {
            return yScale(d.y);
        })
        .style('stroke', 'black')
        .style('stroke-width', .25);

    circlesG
        .select('.selected')
        .style('fill', '#fff13b');
}


/**
 * A ScatterPlot chart.
 * @param dimensions The dimensions of the chart. Consists of width and height. Cannot be None.
 * @param data The data to display. Consists of xy coordinates and...
 * @param columnNames The name of the columns being displayed in this ScatterChart.
 * @returns {JSX.Element}
 */
export const ScatterChart = ({dimensions, data, columnNames}) => {
    const scatterRef = useRef();
    const dispatch = useDispatch();

    // Initial setup -- this runs once.
    useEffect(() => {
        // This if statement _should_ never fail
        if (!isNil(scatterRef.current)) {
            const rootG = d3.select(scatterRef.current);
            appendGroups(rootG);
        }
    }, []);

    // Redraw chart on data or dimension change
    useEffect(() => {
        if (!isNil(data) && !isNil(scatterRef.current)) {
            const rootG = d3.select(scatterRef.current);
            const scatterBounds = getChartBounds(dimensions);
            const extrema = getExtrema(data);
            const scales = createScatterScales(extrema, scatterBounds);
            callAxis(rootG, scales, {startX: scatterBounds.startX, startY: scatterBounds.startY});
            joinCircles(rootG, scales, data);

            /**
             * On brush end add a clause to the current predicate.
             * @param e The event.
             */
            const onBrushEnd = (e) => {
                if (!isNil(e)) {
                    if (!isNil(e.selection)) {
                        const xPixelSpace = e.selection;
                        const xDataSpace = xPixelSpace.map(scales.xScale.invert);
                        const xClause = {'column': columnNames.xColumn, 'min': xDataSpace[0], 'max': xDataSpace[1]}
                        dispatch(addClause(xClause));
                    } else {
                        dispatch(removeClause(columnNames.xColumn));
                    }
                }
            }

            rootG
                .select('#brush')
                .call(d3.brushX().on('end', onBrushEnd));
        }
        return () => dispatch(removeClause(columnNames.xColumn));
    }, [data, columnNames, dispatch, dimensions]);

    return (
        <svg ref={scatterRef} width={dimensions.width} height={dimensions.height}/>
    )
}

export const ResponsiveScatterChart = withDimensions(ScatterChart);