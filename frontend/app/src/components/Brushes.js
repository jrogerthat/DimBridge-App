import {useDispatch, useSelector} from "react-redux";
import React, {useEffect, useRef, useState} from "react";
import * as d3 from 'd3';
import {isNil} from "../utils";
import {
    removeDraftClause,
    selectSelectedPredicateOrDraft,
    setDraftClause,
    updateProjectionBrushSelectedIds,
    selectProjectionBrushSelectedIds,
    selectSelectedPredicateId,
    updateComparisonIds
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

const BrushSecondary = ({rootG, scales, columnNames, data}) => {
    const dispatch = useDispatch();
    const projectionBrushSelectedIds = useSelector(selectProjectionBrushSelectedIds);
    

    useEffect(()=> {
        // console.log('second brush activated', projectionBrushSelectedIds, isNil(projectionBrushSelectedIds));
        if(!isNil(projectionBrushSelectedIds)){
            

            /**
         * On brush end add a clause to the current predicate.
         * @param e The event.
         */
        const onBrushEnd = (e) => {
            if (!isNil(e) && !isNil(e.sourceEvent)) {

                console.log('e.selection',e.selection, e.sourceEvent);
                if (!isNil(e.selection)) {

                    console.log('e.selection',e.selection)
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

                    dispatch(updateComparisonIds(selectedIds));
                    console.log('BRUSH IDS TO CMOPARE', selectedIds)
                } else {
                    // dispatch(updateProjectionBrushSelectedIds(undefined));
                    console.log('NULL BRUSH');
                    // d3.select('#brush-for-compare').call(brush.clear);
                    // d3.select('#brush').call(d3.brush().clear);
                }
            }
        }

        const brush = d3.brush().keyModifiers(null).on('end', onBrushEnd)
        
        function dblclicked() {
            d3.select('#brush-for-compare').remove();//call(brush.clear);
            d3.select('#brush').call(d3.brush().clear);
            console.log('DOUBLE CLICK');
            dispatch(updateProjectionBrushSelectedIds(undefined));
        }

        console.log('test', d3.select('#brush-for-compare'))
        rootG
            .select('#brush-for-compare')
            .call(brush)
            .on('dblclick', dblclicked);

            rootG
                .select('#brush-for-compare')
                .select(".overlay")
                .on("mousedown.brush", (e) => {
                    if (e.shiftKey !== true)
                    {
                        e.stopPropagation()
                    }
                })

        }else{
            // console.log('BRUSH GROUP!!',d3.select('#brush-for-compare'))
            // console.log('first Brush',firstBrush)
            // d3.select('#brush-for-compare').style('pointer-events', 'none')//.call(d3.brush().clear)
            // d3.select('#brush-for-compare').selectAll('*').remove();
            
        }
    }, [projectionBrushSelectedIds])
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
    const projectionBrushSelectedIds = useSelector(selectProjectionBrushSelectedIds);
    const selectedPredicateId = useSelector(selectSelectedPredicateId);
    const [firstBrush, setFirstBrush] = useState(null);
   

    const groupTest = rootG.select('#brush-for-compare');
    const secondBrushG = groupTest.empty() ? rootG.append('g').attr('id', 'brush-for-compare') : groupTest;

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

        const brushMain = d3.brush().keyModifiers(null).on('end', onBrushEnd)

        function dblclickedMain() {
            console.log('is this firing')
            d3.select('#brush').call(brushMain.clear);
            d3.select('#brush-for-compare').call(d3.brush().clear);
            dispatch(updateProjectionBrushSelectedIds(undefined));
          }

        rootG
            .select('#brush')
            .call(brushMain)
            .on('dblclick', dblclickedMain);

        setFirstBrush(rootG.select('#brush'));


    }, [rootG, columnNames, dispatch, scales, data]);


    return (
        <React.Fragment>
            {/* {
                (!isNil(projectionBrushSelectedIds) && selectedPredicateId) &&  <BrushSecondary rootG={rootG} scales={scales} columnNames={columnNames} data={data}/>
            } */}
            <BrushSecondary rootG={rootG} scales={scales} columnNames={columnNames} data={data}/>
        </React.Fragment>
    )
}

