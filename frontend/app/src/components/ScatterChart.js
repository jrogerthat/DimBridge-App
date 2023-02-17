import {useEffect, useRef} from "react";
import * as d3 from 'd3';
import {isNil} from "../utils";

/**
 * Append groups for a ScatterChart.
 * @param selection the selection to append the groups to.
 */
const appendGroups = (selection) => {
    selection.append('g').attr('id', 'circlesG')
    selection.append('g').attr('id', 'xAxisG');
    selection.append('g').attr('id', 'yAxisG');
}

/**
 * A ScatterPlot chart.
 * @param dimensions The dimensions of the chart. Consists of width and height. Cannot be None.
 * @param data The data to display. Consists of xy coordinates and...
 * @returns {JSX.Element}
 */
const ScatterChart = ({dimensions, data}) => {
    const scatterRef = useRef();

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

        }
    }, [data, dimensions]);

    return (
        <svg ref={scatterRef} width={dimensions.width} height={dimensions.height}/>
    )
}

export default ScatterChart;