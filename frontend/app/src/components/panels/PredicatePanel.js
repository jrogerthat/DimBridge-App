import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import {useDispatch, useSelector} from "react-redux";
import {
    addPixalPredicates,
    selectAllDraftClauses,
    selectAllPredicates,
    selectAllComparisonIds,
    selectProjectionBrushSelectedIds,
    selectSelectedPredicateId,
    updateSelectedPredicateId
} from '../../slices/predicateSlice';
import {useGetPixalScoresQuery, useLazyGetPixalPredicatesQuery} from "../../services/pixal";
import {isNil} from "../../utils";
import Button from "@mui/material/Button";
import {useEffect, useMemo} from "react";


/**
 * The predicate panel. Contains everything related to the predicates that form the DiMENsIoNAl BrIDge.
 * @returns {JSX.Element}
 */
export const PredicatePanel = () => {
    const dispatch = useDispatch();
    const predicates = useSelector(selectAllPredicates);
    const comparisonIds = useSelector(selectAllComparisonIds);
    const selectedPredicateId = useSelector(selectSelectedPredicateId);
    const clauses = useSelector(selectAllDraftClauses);
    const projectionBrushSelectedIds = useSelector(selectProjectionBrushSelectedIds);
    const skip = isNil(projectionBrushSelectedIds) || predicates.length === 0;
    // const {data: scores} = useGetPixalScoresQuery(['redwine', projectionBrushSelectedIds, comparisonIds, predicates], {skip,});
    const {data: scores} = useGetPixalScoresQuery(['genes', projectionBrushSelectedIds, comparisonIds, predicates], {skip,});
    const [trigger, {data: pixalPredicates, isFetching: pixalPredicatesFetching}] = useLazyGetPixalPredicatesQuery();
    
    useEffect(() => {
        if (!isNil(pixalPredicates) && pixalPredicates.length > 0) {
            dispatch(addPixalPredicates(pixalPredicates));
        }
    }, [pixalPredicates, dispatch]);

    const scoredPredicates = useMemo(()=> {
        if (!isNil(predicates) && !isNil(scores))
        {
            return predicates.map(d => {
                return {...d, score: scores[d.id]}
            })
        }
    }, [predicates, scores]);

    return (
        <Box sx={{height: '90%', width: '90%', margin: 'auto', display: 'flex', flexDirection: 'column'}}>
            <Paper sx={{
                height: '15%',
                width: '100%',
                marginBottom: '5%',
                display: 'flex',
                justifyContent: 'space-evenly'
            }}>
                <Button variant={"outlined"} disabled={isNil(projectionBrushSelectedIds) || pixalPredicatesFetching}
                        sx={{width: '60%', marginTop: 'auto', marginBottom: 'auto'}} onClick={() => {
                    trigger(['genes', projectionBrushSelectedIds, comparisonIds]);
                    // trigger(['redwine', projectionBrushSelectedIds, comparisonIds]);
                }
                }>Get Predicates</Button>
            </Paper>
            <Paper sx={{height: '80%', width: '100%', marginTop: '5%', overflowY: 'scroll'}}>
                {
                    clauses.length > 0 && (
                        <div>
                            <PredicateDraft data={clauses}/>
                        </div>
                    )
                }
                {scoredPredicates && scoredPredicates.map(d => {
                    return (
                        <Predicate
                            key={`pred-${d.id}`}
                            predData={d}
                            selected={selectedPredicateId === d.id}/>
                    )
                })}
            </Paper>
        </Box>
    );
}

const Predicate = ({predData, selected}) => {

    const dispatch = useDispatch();
    const clauses = Object.entries(predData.clauses);
    const selectedPredicateId = useSelector(selectSelectedPredicateId);

    return (
        <div
        className="predicate_nav" 
        style={{
            backgroundColor: selected ? '#eeeeee' : '#FFF',
            // borderBottom: "1px solid #D4D4D4",
            padding:5,
            borderRadius:5,
            margin:3,
            display:'flex',
            flexDirection:'row',
            cursor:'pointer',
            border: selected ? "2px solid #D4D4D4" : "2px solid #eeeeee"
        }}
        onClick={() => (predData.id === selectedPredicateId) ? dispatch(updateSelectedPredicateId(null)) : dispatch(updateSelectedPredicateId(predData.id))}
        >
            <div style={{width: '100%'}}>
                <div><span style={{color: 'gray'}}>{`Predicate Score: `}</span>
                    <span style={{fontWeight: 800}}>{!isNil(predData.score) ? predData.score : "NA"}</span></div>
                <div className='clause_wrap' style={{marginTop: 10}}>
                    {
                        clauses.map(([column, data], i) => {
                            return (
                                <Feature key={`${i}-${column}`} clauseData={{column: column, ...data}}/>
                            )
                        })
                    }
                </div>
            </div>
        </div>
    )
}

const Feature = ({clauseData}) => {

    return (
        <div
            style={{
                borderTop: "1px solid #gray", //: "1px solid #D4D4D4",
                // backgroundColor: "#FFF",
                padding: 3
            }}
        >
            <span style={{color: 'gray'}}>{`${clauseData.column}: `}</span>
            <span style={{fontWeight: 700}}>{`${(clauseData.min.toFixed(3))} - ${clauseData.max.toFixed(3)}`}</span>
        </div>
    )
}

const PredicateDraft = ({data}) => {
    const dispatch = useDispatch();

    return (
        <div
            className="predicate_nav"
            style={{
                backgroundColor: '#FFF',
                border: "2px solid #b71c1c",
                padding: 5,
                borderRadius: 5,
                margin: 3,
                display: 'flex',
                flexDirection: 'row'
            }}
            onClick={() => dispatch(updateSelectedPredicateId(undefined))}
        >
            <div style={{width: '100%'}}>
                <div style={{display: 'flex', alignItems: 'center'}}>
                <span
                    style={{fontWeight: 800, color: '#b71c1c'}}
                >Predicate Draft</span></div>
                <div className='clause_wrap' style={{marginTop: 10}}>
                    {
                        data.map((f, i) => {
                            return (
                                <Feature key={`${i}-${f.column}`} clauseData={f}/>
                            )
                        })
                    }
                </div>
            </div>
        </div>
    )
}