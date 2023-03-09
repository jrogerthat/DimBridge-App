import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import {useSelector} from "react-redux";
import {selectAllClauses} from "../../slices/clauseSlice";

const predicateDict = {
    "0": {score: .4, attribute_values: {'fixed acidity' : [8.0, 11.2]}},
    "1": {score: .3, attribute_values: {'residual sugar': [1.2, 1.8], 'pH': [3.04, 3.11]}},
    "3": {score: .2, attribute_values: {"free sulfur dioxide": [6, 11]}}
}
/**
 * The predicate panel. Contains everything related to the predicates that form the DiMENsIoNAl BrIDge.
 * @returns {JSX.Element}
 */
export const PredicatePanel = () => {
    const predicatesTest = useSelector(selectAllClauses);
    console.log('predicates', predicatesTest);
    let predicates = Object.entries(predicateDict);
    
    return (
        <Paper sx={{height: '90%', width: '90%', margin: 'auto'}}>
            <Box>
                {predicates && predicates.map(d => {
                    return (
                        <div
                        className="predicate_nav" 
                        key={d[0]}
                        style={{
                            backgroundColor:'#f0efef',
                            padding:5,
                            borderRadius:5,
                            margin:3,
                            display:'flex',
                            flexDirection:'row'
                        }}
                        >
                        <div style={{width:'70%'}}>
                            <div>{`Predicate Score: `}<span style={{fontWeight:800}}>{d[1].score}</span></div>
                            <div className='clause_wrap' style={{marginTop:10}}>
                            {
                            Object.entries(d[1].attribute_values).map(f => {
                                console.log(f)
                                return(
                                    <div 
                                    key={f[0]}
                                    style={{
                                        borderTop: "1px solid gray",
                                        backgroundColor: "#dfdfdf",
                                        padding: 3
                                    }}
                                    >
                                        <span>{`${f[0]}: `}</span>{f[1].join(' - ')}
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