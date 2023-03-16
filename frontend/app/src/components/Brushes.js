import {useDispatch, useSelector} from "react-redux";
import {useEffect, useRef, useState} from "react";
import * as d3 from 'd3';
import {isNil} from "../utils";
import {
    removeDraftClause,
    selectSelectedPredicateOrDraft,
    setDraftClause,
    updateProjectionBrushSelectedIds
} from "../slices/predicateSlice";

/**
 * Brush set up for SPLOM interactions.
 *
 * @param rootG The group to find the brushG on.
 * @param scales The scales necessary for the brush.
 * @param columnNames The columns/axes of the brush.
 * @returns {JSX.Element}
 */
export const SPLOMBrush = ({rootG, scales, columnNames}) => {
    const dispatch = useDispatch();
    const [brushState, setBrushState] = useState();
    const predicate = useSelector(selectSelectedPredicateOrDraft);
    const clause = predicate?.clauses[columnNames.xColumn];

    // Redraw chart on data or dimension change
    useEffect(() => {
        /**
         * On brush end add a clause to the current predicate.
         * @param e The event.
         */
        const onBrushEnd = (e) => {
            if (!isNil(e) && !isNil(e.sourceEvent)) {
                if (!isNil(e.selection)) {
                    // If there is a valid selection add its clause.
                    const xPixelSpace = e.selection;
                    const xDataSpace = xPixelSpace.map(scales.xScale.invert);
                    const xClause = {'column': columnNames.xColumn, 'min': xDataSpace[0], 'max': xDataSpace[1]}
                    dispatch(setDraftClause(xClause));
                } else {
                    // Otherwise remove any clause associated with this column.
                    dispatch(removeDraftClause(columnNames.xColumn));
                }
            }
        }

        const brush = d3.brushX().on('end', onBrushEnd);

        rootG
            .select('#brush')
            .call(brush);

        setBrushState((prevState) => {
            return brush
        })
    }, [rootG, columnNames.xColumn, dispatch, setBrushState, scales]);

    // Move or clear the brush when the clause related to the column of the chart changes
    useEffect(() => {
        if (!isNil(brushState)) {
            const brushG = rootG.select('#brush');

            if (!isNil(clause)) {
                brushG.call(brushState.move, [clause.min, clause.max].map(scales.xScale));
            } else {
                brushG.call(brushState.clear)
            }
        }
    }, [rootG, clause, brushState, scales]);

    return (
        <></>
    )
}

/**
 * Brush set up for the projection scatter interactions.
 *
 * @param rootG The group to find the brushG on.
 * @param scales The scales necessary for the brush.
 * @param columnNames The columns/axes of the brush.
 * @returns {JSX.Element}
 */
export const ProjectionBrush = ({rootG, scales, columnNames, data}) => {
    const dispatch = useDispatch();

    // Redraw chart on data or dimension change
    useEffect(() => {
        /**
         * On brush end add a clause to the current predicate.
         * @param e The event.
         */
        const onBrushEnd = (e) => {
            if (!isNil(e) && !isNil(e.sourceEvent)) {
                if (!isNil(e.selection)) {
                    // If there is a valid selection add its clause.
                    const pixelSpace = e.selection;

                    // y min and max should be swapped no?
                    const selectionBounds = {
                        'x': {
                            'min': scales.xScale.invert(pixelSpace[0][0]),
                            'max': scales.xScale.invert(pixelSpace[1][0])
                        },
                        'y': {
                            'min': scales.yScale.invert(pixelSpace[1][1]),
                            'max': scales.yScale.invert(pixelSpace[0][1])
                        }
                    };

                    const selectedIds = data.filter(d => {
                        return d.x > selectionBounds.x.min && d.x < selectionBounds.x.max && d.y > selectionBounds.y.min && d.y < selectionBounds.y.max;
                    }).map(d => d.id);

                    dispatch(updateProjectionBrushSelectedIds(selectedIds));
                } else {
                    dispatch(updateProjectionBrushSelectedIds(undefined));
                }
            }
        }

        const brush = d3.brush()
        .on('end', onBrushEnd)

        function dblclicked() {
            d3.select(this).call(brush.move, null);
            dispatch(updateProjectionBrushSelectedIds(undefined));
          }

        rootG
            .select('#brush')
            .call(brush)
            .on('dblclick', dblclicked);

    }, [rootG, columnNames, dispatch, scales, data]);

    return (
        <></>
    )
}