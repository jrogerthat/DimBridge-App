import {ResponsiveProjectionScatterChart} from "../charts/ScatterChart";
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';

/**
 * The projection panel. Contains everything related to the projection side of the DiMENsIoNAl BrIDge.
 * @param data The data to display. Currently requires the projection coordinates as well as the rest of the features,
 * (for easy coloring etc. later).
 * @returns {JSX.Element}
 */
export const ProjectionPanel = ({data, selectedPredicate}) => {
    // We can hard code the column names here for now as the actual projection method doesn't _currently_ matter.
    const columnNames = {'xColumn': 'projX', 'yColumn': 'projY'};

    return (
        <Paper sx={{height: '90%', width: '90%', margin: 'auto', display: 'flex'}}>
            <Box sx={{margin: 'auto', height: '95%', width: '95%'}}>
                {data && <ResponsiveProjectionScatterChart data={data} selectedPredicate={selectedPredicate} columnNames={columnNames}/>}
            </Box>
        </Paper>
    );
}