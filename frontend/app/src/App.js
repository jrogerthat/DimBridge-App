import CssBaseline from '@mui/material/CssBaseline';
import {ProjectionPanel} from './components/panels/ProjectionPanel';
import {PredicatePanel} from './components/panels/PredicatePanel';
import {DataPanel} from './components/panels/DataPanel';
import Box from '@mui/material/Box';
import {Header} from "./components/Header";
import LinearProgress from '@mui/material/LinearProgress';
import {useGetDataQuery} from "./services/pixal";
import {styled} from '@mui/material/styles';
import {useMemo} from "react";
import {useSelector} from "react-redux";
import { selectPrepredicateSelectedIds } from './slices/predicateSlice';
import {selectSelectedPredicateOrDraft} from "./app/commonSelectors";
import {isNil} from "./utils";


const FlexBox = styled(Box)(({theme}) => {
    return ({
        display: 'flex',
        height: '100%'
    })
});


function App() {
    // Can assume that it won't refetch during the lifetime of the app
    const {data, isLoading, isSuccess} = useGetDataQuery(['redwine', 'tsne']);
    const selectedPredicate = useSelector(selectSelectedPredicateOrDraft);
    const prepredicateSelectedIds = useSelector(selectPrepredicateSelectedIds);

    /**
     * Adds an isFiltered boolean to each item based on the clauses in the selected predicate.
     */

    const transformedData = useMemo(() => {
        console.log('transformed data firing');
        if (!isNil(data)) {
            if (isNil(selectedPredicate)) {
                return data;
            }else if((selectedPredicate.id !== 'draft') && !isNil(prepredicateSelectedIds)){
 
                let clauseArray = Object.entries(selectedPredicate.clauses);
                let fromPredicateIds = data.filter(f => {
                    let testArray = [];
                    clauseArray.forEach(([col, range])=> {
                        if(f[col] >= range.min && f[col] <= range.max) testArray.push(f)
                    })
                    return testArray.length === clauseArray.length;
                }).map(m => m.id);

                let inPredicateButNotBrushArray = fromPredicateIds.filter(f => prepredicateSelectedIds.indexOf(f) === -1);
                let inBrushButNotPredicateArray = prepredicateSelectedIds.filter(f => fromPredicateIds.indexOf(f) === -1);
                let intersectionArray = prepredicateSelectedIds.filter(f => fromPredicateIds.indexOf(f) !== -1);
              
                return data.map(d => {
                    
                    let unselected = false;
                    let predNotBrush = false;
                    let brushNotPred = false;
                    let intersection = false;
                    //is the datum in the intersection of the two?
                    if(intersectionArray.indexOf(d.id) !== -1){
                        intersection = true;
                    //is the datum in predicate but not brush selection
                    }else if(inPredicateButNotBrushArray.indexOf(d.id) !== -1){
                        predNotBrush = true;
                    //is datum in the brush but not predicate
                    }else if(inBrushButNotPredicateArray.indexOf(d.id) !== -1){
                        brushNotPred = true;
                    //is datum not involved in any of these selections
                    }else if(fromPredicateIds.indexOf(d.id) === -1 && prepredicateSelectedIds.indexOf(d.id) === -1){
                        unselected = true;
                    }
    
                    return ({...d, intersection: intersection, predNotBrush: predNotBrush, brushNotPred:brushNotPred, unselected:unselected})
                });
            }

            return data.map(d => {
                let isFiltered = false;
                Object.entries(selectedPredicate.clauses).forEach(([col, range]) => {
                    isFiltered = d[col] < range.min || d[col] > range.max ? true : isFiltered;
                })

                return ({...d, isFiltered: isFiltered})
            })
        }
        return undefined
    }, [data, selectedPredicate, prepredicateSelectedIds]);

    return (
        <Box sx={{height: '100%', width: '100%'}}>
            <CssBaseline/>
            <Header/>
            {isLoading && <LinearProgress/>}
            {isSuccess && transformedData && <Box
                sx={{height: 'calc(100% - 52px)', width: '100%', display: 'grid', gridTemplateColumns: '2fr 1fr 2fr'}}>
                <FlexBox>
                    <ProjectionPanel data={transformedData} />
                </FlexBox>
                <FlexBox>
                    <PredicatePanel />
                </FlexBox>
                <FlexBox>
                    <DataPanel data={transformedData} selectedPredicate={selectedPredicate}/>
                </FlexBox>
            </Box>}
        </Box>
    );
}

export default App;