import {useDispatch, useSelector} from "react-redux";
import React, {useEffect, useRef, useState} from "react";
import * as d3 from 'd3';
import {isNil} from "../utils";
import {
    removeDraftClause,
    selectSelectedPredicateOrDraft,
    setDraftClause,
    updateProjectionBrushSelectedIds,
    updateComparisonIds
} from "../slices/predicateSlice";
import {useKeyPress} from "../hooks/useKeyPress";



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


const brushSelectionToIds = (pixelSpaceBounds, scales, data) => {
    // y min and max should be swapped no?
    const dataSpaceBounds = {
        'x': {
            'min': scales.xScale.invert(pixelSpaceBounds[0][0]),
            'max': scales.xScale.invert(pixelSpaceBounds[1][0])
        },
        'y': {
            'min': scales.yScale.invert(pixelSpaceBounds[1][1]),
            'max': scales.yScale.invert(pixelSpaceBounds[0][1])
        }
    };

    return data.filter(d => {
        return d.x > dataSpaceBounds.x.min && d.x < dataSpaceBounds.x.max && d.y > dataSpaceBounds.y.min && d.y < dataSpaceBounds.y.max;
    }).map(d => d.id);
}

const onBrushEndFactory = (dispatch, methodToDispatch, scales, data) => {
    return (e) => {
        if (!isNil(e) && !isNil(e.sourceEvent)) {
            if (!isNil(e.selection)) {
                dispatch(methodToDispatch(brushSelectionToIds(e.selection, scales, data)));
            } else {
                dispatch(methodToDispatch(undefined));
            }
        }
    }
}

/**
 * Brush set up for the projection scatter interactions.
 *
 * @param rootG The group to find the brushG on.
 * @param scales The scales necessary for the brush.
 * @param columnNames The columns/axes of the brush.
 * @param data The full data displayed.
 * @returns {JSX.Element}
 */
export const ProjectionBrushes = ({rootG, scales, columnNames, data}) => {
    const dispatch = useDispatch();
    const shiftPress = useKeyPress("Shift");

    // Redraw chart on data or dimension change
    useEffect(() => {

        const onBrushEndTarget = onBrushEndFactory(dispatch, updateProjectionBrushSelectedIds, scales, data);
        const onBrushEndReference = onBrushEndFactory(dispatch, updateComparisonIds, scales, data);

        const brushTargetG = d3.select('#brush');
        const brushReferenceG = d3.select('#brush-for-compare');
        const targetBrush = d3.brush().keyModifiers(null).on('end', onBrushEndTarget);
        const referenceBrush = d3.brush().keyModifiers(null).on('end', onBrushEndReference);

        const dblclicked = () => {
            brushTargetG.call(targetBrush.clear);
            brushReferenceG.call(referenceBrush.clear);
            dispatch(updateProjectionBrushSelectedIds(undefined));
        }

        brushTargetG.on('dblclick', dblclicked);
        brushReferenceG.on('dblclick', dblclicked);

        brushTargetG.call(targetBrush).select('.selection').attr('fill', 'pink');
        brushReferenceG.call(targetBrush).select('.selection').attr('fill', 'orange');

    }, [rootG, columnNames, dispatch, scales, data]);

    useEffect(() => {
        if (shiftPress)
        {
            d3.select('#brush-for-compare').raise();
        }
        else
        {
            d3.select('#brush').raise();
        }
    }, [shiftPress])


    return (
        <>
        </>
    )
}

