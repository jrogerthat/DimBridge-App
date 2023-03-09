import {ResponsiveProjectionScatterChart} from "../charts/ScatterChart";
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import {useMemo, useState} from 'react'
import {useGetPixalPredicatesQuery} from "../../services/pixal";
import {isNil} from "../../utils";

/**
 * The projection panel. Contains everything related to the projection side of the DiMENsIoNAl BrIDge.
 * @param data The data to display. Currently requires the projection coordinates as well as the rest of the features,
 * (for easy coloring etc. later).
 * @returns {JSX.Element}
 */
export const ProjectionPanel = ({data}) => {
    const [selectionBounds, setSelectionBounds] = useState();

    /**
     * Filter to the selected IDs in the scatterplot.
     * This will move later.
     */
    const selectedIds = useMemo(() => {
        if (!isNil(selectionBounds)) {
            return data.filter(d => {
                return d.x > selectionBounds.x.min && d.x < selectionBounds.x.max && d.y > selectionBounds.y.min && d.y < selectionBounds.y.max;
            }).map(d => d.id);
        }
        return []

    }, [data, selectionBounds]);
    // console.log(selectionBounds)
    const skip = isNil(selectionBounds);
    // Fetch the pixal predicates
    // This will move later
    useGetPixalPredicatesQuery(['redwine', 'tsne', selectedIds],
        {
            skip,
        }
    );


    // We can hard code the column names here for now as the actual projection method doesn't _currently_ matter.
    const columnNames = {'xColumn': 'projX', 'yColumn': 'projY'};

    return (
        <Paper sx={{height: '90%', width: '90%', margin: 'auto', display: 'flex'}}>
            <Box sx={{margin: 'auto', height: '95%', width: '95%'}}>
                {data && <ResponsiveProjectionScatterChart data={data} columnNames={columnNames}
                                                           setSelectionBounds={setSelectionBounds}/>}
            </Box>
        </Paper>
    );
}