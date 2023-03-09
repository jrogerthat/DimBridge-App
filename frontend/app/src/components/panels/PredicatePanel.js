import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import {useSelector} from "react-redux";
import {selectAllClauses} from "../../slices/clauseSlice";
import { selectAllPredicates } from '../../slices/predicateSlice';

const predicateDict = {
    "0": {score: .4, clauses: [{column: 'fixed acidity', min:8.0, max:11.2 }]},
    "1": {score: .3, clauses: [{column: 'residual sugar', min:1.2, max: 1.8}, {column: 'pH', min:3.04, max:3.11}]},
    "3": {score: .2, clauses: [{column: "free sulfur dioxide",  min:6, max: 11 }]}
}
/**
 * The predicate panel. Contains everything related to the predicates that form the DiMENsIoNAl BrIDge.
 * @returns {JSX.Element}
 */
export const PredicatePanel = () => {
    const predicatesTest = useSelector(selectAllPredicates);
    console.log('predicates', predicatesTest);
    let predicates = predicatesTest.length > 0 ? Object.entries(predicatesTest) : Object.entries(predicateDict);
    
    return (
        <Paper sx={{height: '90%', width: '90%', margin: 'auto'}}>
            <Box>
                {predicates && predicates.map(d => {
                    console.log('D', d)
                    return (
                        <div
                        className="predicate_nav" 
                        key={d[1].id}
                        style={{
                            backgroundColor:'#f5f5f5',
                            padding:5,
                            borderRadius:5,
                            margin:3,
                            display:'flex',
                            flexDirection:'row'
                        }}
                        >
                        <div style={{width:'70%'}}>
                            <div>{`Predicate Score: `}<span style={{fontWeight:800}}>{d[1].score ? d[1].score : "NA"}</span></div>
                            <div className='clause_wrap' style={{marginTop:10}}>
                            {
                            d[1].clauses.map(f => {
                                console.log('FFF',f)
                                return(
                                    <div 
                                    key={f[0]}
                                    style={{
                                        borderTop: "1px solid gray",
                                        backgroundColor: "#f0efef",
                                        padding: 3
                                    }}
                                    >
                                        <span>{`${f.column}: `}</span>{`${(f.min.toFixed(3))} - ${f.max.toFixed(3)}`}
                                    </div>
                                    )
                                })
                            }
                        </div>
                        </div>
                        <div style={{width: '30%', backgroundColor:'white'}}>

                        </div>
                        
                        </div>
                    )
                })}
            </Box>
        </Paper>
    );
}