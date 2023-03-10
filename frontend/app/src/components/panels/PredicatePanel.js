import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import {useSelector} from "react-redux";
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
   
    let predicates = predicatesTest.length > 0 ? Object.entries(predicatesTest) : Object.entries(predicateDict);
    
    return (
        <Paper sx={{height: '90%', width: '90%', margin: 'auto'}}>
            <Box>
                {predicates && predicates.map(d => {
                    console.log('d', d)
                    return (
                       <Predicate 
                       key={`pred-${d[0]}`}
                       predData={d[1]}/>
                    )
                })}
            </Box>
        </Paper>
    );
}

const Predicate = ({predData}) => {

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
        >
        <div style={{width:'70%'}}>
            <div><span style={{color:'gray'}}>{`Predicate Score: `}</span>
            <span style={{fontWeight:800}}>{predData.score ? predData.score : "NA"}</span></div>
            <div className='clause_wrap' style={{marginTop:10}}>
            {
            predData.clauses.map((f, i) => {
                return(
                    <Feature key={`${i}-${f.column}`} clauseData={f} />
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