import {useEffect, useRef, useState} from "react";
import * as d3 from 'd3';
import {isNil} from "../../utils";
import {withDimensions} from "../../wrappers/dimensions";
import {getChartBounds, getExtrema} from "./common";
import { SPLOMBrush, ProjectionBrushes } from "../Brushes";
import {
    selectSelectedPredicateId
} from '../../slices/predicateSlice';
import {useSelector} from "react-redux";

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
    selection.append('g').attr('id', 'brush-for-compare');
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

const circleFill = (d, selectedPred) => {

    if (d.isFiltered && selectedPred) {
        return '#CF1603'; //red
    } else if (d.intersection) {
        return 'purple'
    } else if (d.predNotBrush) {
        return '#CF1603'; //red;
    } else if (d.brushNotPred) {
        return '#0371CF';
    } else {
        return 'gray';
    }
}

const circleRadius = (d) => {
    if (d.hasOwnProperty('isFiltered')) {
        if (d.isFiltered) {
            return 2.5
        } else {
            return 2
        }
    } else if (d.hasOwnProperty('unselected')) {
        if (d.unselected) {
            return 2;
        } else {
            return 2.5
        }
    } else {
        return 2;
    }
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
                     data,
                     selectedPred) => {
    const circlesG = rootG.select('#circlesG');

    circlesG
        .selectAll('circle')
        .data(data, d => d.id)
        .join('circle')
        .attr('r', (d) => circleRadius(d))
        .attr('cx', (d) => {
            return xScale(d.x);
        })
        .attr('cy', (d) => {
            return yScale(d.y);
        })
        .attr('fill', (d) => circleFill(d, selectedPred))
        .attr('opacity', (d) => d.unselected ? .4 : 1)
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
 * @param children
 * @returns {JSX.Element}
 */
export const ScatterChart = ({dimensions, data, columnNames, children}) => {
    const scatterRef = useRef();
    const [scaleState, setScaleState] = useState();
    const selectedPredicateId = useSelector(selectSelectedPredicateId);

    // Initial setup -- this runs once.
    useEffect(() => {
        // This if statement _should_ never fail
        if (!isNil(scatterRef.current)) {
            const rootG = d3.select(scatterRef.current);
            rootG.selectAll("*").remove();

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
            joinCircles(rootG, scales, data, selectedPredicateId);
            setScaleState(scales);
        }
    }, [data, dimensions, setScaleState]);

    return (
        <svg ref={scatterRef} width={dimensions.width} height={dimensions.height}>
            {children && scatterRef.current && scaleState && children(d3.select(scatterRef.current), scaleState, columnNames)}
        </svg>
    )
}

/**
 * Scatterplot for use in the SPLOM.
 *
 * @param data The data to display. Consists of xy coordinates and...
 * @param dimensions The dimensions of the chart. Consists of width and height. Cannot be None.
 * @param columnNames The name of the columns being displayed in this ScatterChart.
 * @returns {JSX.Element}
 */
export const SPLOMScatterChart = ({data, dimensions, columnNames}) => {
    return (
        <ScatterChart data={data} dimensions={dimensions} columnNames={columnNames}>
            {(rootG, scales, columnNames) => (
                <SPLOMBrush rootG={rootG} scales={scales} columnNames={columnNames}/>
            )}
        </ScatterChart>
    )
}

/**
 * Scatterplot for the projection.
 *
 * @param data The data to display. Consists of xy coordinates and...
 * @param dimensions The dimensions of the chart. Consists of width and height. Cannot be None.
 * @param columnNames The name of the columns being displayed in this ScatterChart.
 * @returns {JSX.Element}
 */
export const ProjectionScatterChart = ({data, dimensions, columnNames}) => {

    return (
        <ScatterChart data={data} dimensions={dimensions} columnNames={columnNames}>
            {(rootG, scales, columnNames) => (
                <ProjectionBrushes
                    rootG={rootG}
                    scales={scales}
                    columnNames={columnNames}
                    data={data}/>
            )}
        </ScatterChart>
    )
}


export const ResponsiveProjectionScatterChart = withDimensions(ProjectionScatterChart);