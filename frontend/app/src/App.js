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

    /**
     * Adds an isFiltered boolean to each item based on the clauses in the selected predicate.
     */
    const transformedData = useMemo(() => {
        if (!isNil(data)) {
            if (isNil(selectedPredicate)) {
                return data;
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
    }, [data, selectedPredicate]);

    return (
        <Box sx={{height: '100%', width: '100%'}}>
            <CssBaseline/>
            <Header/>
            {isLoading && <LinearProgress/>}
            {isSuccess && transformedData && <Box
                sx={{height: 'calc(100% - 52px)', width: '100%', display: 'grid', gridTemplateColumns: '2fr 1fr 2fr'}}>
                <FlexBox>
                    <ProjectionPanel data={transformedData}/>
                </FlexBox>
                <FlexBox>
                    <PredicatePanel/>
                </FlexBox>
                <FlexBox>
                    <DataPanel data={transformedData} selectedPredicate={selectedPredicate}/>
                </FlexBox>
            </Box>}
        </Box>
    );
}

export default App;