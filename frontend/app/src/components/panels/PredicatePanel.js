import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import {useDispatch, useSelector} from "react-redux";
import {selectAllPredicates, selectSelectedPredicateId, updateSelectedPredicateId} from '../../slices/predicateSlice';
import {selectAllClauses} from '../../slices/clauseSlice';


/**
 * The predicate panel. Contains everything related to the predicates that form the DiMENsIoNAl BrIDge.
 * @returns {JSX.Element}
 */
export const PredicatePanel = () => {
    const predicates = useSelector(selectAllPredicates);
    const selectedPredicateId = useSelector(selectSelectedPredicateId);
    const clauses = useSelector(selectAllClauses);

    return (
        <Paper sx={{height: '90%', width: '90%', margin: 'auto'}}>
            <Box>
                {
                    clauses.length > 0 && (
                        <div>
                            <PredicateDraft data={clauses}/>
                        </div>
                    )
                }
                {predicates && predicates.map(d => {
                    return (
                       <Predicate 
                       key={`pred-${d.id}`}
                       predData={d}
                       selected={selectedPredicateId === d.id}/>
                    )
                })}
            </Box>
        </Paper>
    );
}

const Predicate = ({predData, selected}) => {

    const dispatch = useDispatch();
    const clauses = Object.entries(predData.clauses);

    return(
        <div
        className="predicate_nav" 
        style={{
            backgroundColor:'#FFF',
            borderBottom: "1px solid #D4D4D4",
            padding:5,
            borderRadius:5,
            margin:3,
            display:'flex',
            flexDirection:'row'
        }}
        onClick={() => dispatch(updateSelectedPredicateId(predData.id))}
        >
        <div style={{width:'70%'}}>
            <div><span style={{color:'gray'}}>{`Predicate Score: `}</span>
            <span style={{fontWeight:800}}>{predData.score ? predData.score : "NA"}</span></div>
            <div className='clause_wrap' style={{marginTop:10}}>
            {
            clauses.map(([column, data], i) => {
                return(
                    <Feature key={`${i}-${column}`} clauseData={{id: column, ...data}} />
                    )
                })
            }
        </div>
        </div>
        <div style={{width: '30%', backgroundColor:'#FAFAFA'}}>
            heatmap here
        </div>
        
        </div>
    )
}

const Feature = ({clauseData}) => {

    return(
        <div 
        style={{
            borderTop: "1px solid #D4D4D4",
            backgroundColor: "#FFF",
            padding: 3
        }}
        >
            <span style={{color:'gray'}}>{`${clauseData.column}: `}</span>
            <span style={{fontWeight:700}}>{`${(clauseData.min.toFixed(3))} - ${clauseData.max.toFixed(3)}`}</span>
        </div>
    )
}

const PredicateDraft = ({data}) => {
    const dispatch = useDispatch();

    return(
        <div
        className="predicate_nav" 
        style={{
            backgroundColor:'#FFF',
            border: "2px solid #b71c1c",
            padding:5,
            borderRadius:5,
            margin:3,
            display:'flex',
            flexDirection:'row'
        }}
        onClick={() => dispatch(updateSelectedPredicateId(undefined))}
        >
        <div style={{width:'100%'}}>
            <div style={{display:'flex', alignItems:'center'}}>
                <span
                style={{fontWeight:800, color:'#b71c1c'}}
                >Predicate Draft</span></div>
            <div className='clause_wrap' style={{marginTop:10}}>
            {
            data.map((f, i) => {
                return(
                    <Feature key={`${i}-${f.column}`} clauseData={f} />
                    )
                })
            }
        </div>
        </div>
        </div>
    )
}