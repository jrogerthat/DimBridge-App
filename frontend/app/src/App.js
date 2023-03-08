import CssBaseline from '@mui/material/CssBaseline';
import {ProjectionPanel} from './components/panels/ProjectionPanel';
import {PredicatePanel} from './components/panels/PredicatePanel';
import {DataPanel} from './components/panels/DataPanel';
import Box from '@mui/material/Box';
import {Header} from "./components/Header";
import LinearProgress from '@mui/material/LinearProgress';
import {useGetDataQuery} from "./services/pixal";
import {styled} from '@mui/material/styles';


const FlexBox = styled(Box)(({theme}) => {
    return ({
        display: 'flex',
        height: '100%'
    })
});


function App() {
    // This grabs the data
    // I don't want to write a large explanation -- you can assume that at the moment
    // it won't refetch during the lifetime of the app
    const {data, isLoading, isSuccess} = useGetDataQuery(['redwine', 'tsne']);

    return (
        <Box sx={{height: '100%', width: '100%'}}>
            <CssBaseline/>
            <Header/>
            {isLoading && <LinearProgress/>}
            {isSuccess && data && <Box
                sx={{height: 'calc(100% - 52px)', width: '100%', display: 'grid', gridTemplateColumns: '2fr 1fr 2fr'}}>
                <FlexBox>
                    <ProjectionPanel data={data}/>
                </FlexBox>
                <FlexBox>
                    <PredicatePanel/>
                </FlexBox>
                <FlexBox>
                    {/* <DataPanel data={data}/> */}
                </FlexBox>
            </Box>}
        </Box>
    );
}

export default App;