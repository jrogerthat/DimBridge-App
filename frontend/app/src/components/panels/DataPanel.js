import Paper from '@mui/material/Paper';
import {ScatterChart} from "../charts/ScatterChart";
import Box from '@mui/material/Box';
import useElementSize from "../../hooks/useElementSize";

/**
 * Cartesian product of arrays.
 * @param a The arrays.
 * @returns {*} The cartesian products.
 */
const cartesian =
    (...a) => a.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())));

/**
 * Get the columns names that aren't x or y (the projection columns).
 * THIS SHOULD PROBABLY CHANGE IN THE FUTURE.
 * @param data The raw data and projection.
 * @returns {string[]} The column names that aren't x or y.
 */
const getNonProjectionColumnNames = (data) => {
    const {x, y, ...rest} = data[0];
    return Object.keys(rest);
}

/**
 * Get the column names for the SPLOM array.
 * @param data The raw data and projection.
 * @returns {*[][]} The column names for the SPLOM array.
 */
const getSPLOMColumnsArray = (data) => {
    const column_names = getNonProjectionColumnNames(data);
    const column_product = cartesian(column_names, column_names);
    const rows = column_names.map(d => []);
    column_product.forEach((d, i) => {
        rows[i % column_names.length].push(d)
    });
    return rows;
}

/**
 * The data panel. Contains everything related to the data side of the DiMENsIoNAl BrIDge.
 * @param data The data to display. Currently requires just the features, and gets rid of the projection data.
 * (Projection data should be filtered out before here in the future)
 * @returns {JSX.Element}
 */
export const DataPanel = ({data}) => {
    const [squareRef, {width, height}] = useElementSize();

    const splom_columns_array = getSPLOMColumnsArray(data);
    const scatter_width = (width / splom_columns_array.length);
    const scatter_height = (height / splom_columns_array.length);

    return (
        <Paper sx={{height: '90%', width: '90%', margin: 'auto', display: 'flex'}}>
            <Box ref={squareRef}
                 sx={{margin: 'auto', height: '95%', width: '95%', display: 'flex', flexDirection: 'column'}}>
                {width && splom_columns_array.map((row, i) => {
                    return (
                        <Box key={`row_${i}`} sx={{display: 'flex', height: scatter_height}}>
                            {row.map(([c1, c2]) => {
                                const scatter_column_names = {'xColumn': c1, 'yColumn': c2}

                                return (
                                    <div key={`${c1}_${c2}`}>
                                        <ScatterChart data={data.map(d => {
                                            return {...d, x: d[c1], y: d[c2]}
                                        })} dimensions={{width: scatter_width, height: scatter_height}}
                                                      column_names={scatter_column_names}/>
                                    </div>
                                )
                            })}
                        </Box>
                    )
                })}
            </Box>
        </Paper>
    );
}