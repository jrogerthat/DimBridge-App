import {useState} from 'react';
import Paper from '@mui/material/Paper';
import {ScatterChart} from "../charts/ScatterChart";
import Box from '@mui/material/Box';
import useElementSize from "../../hooks/useElementSize";
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';

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
 * Pair the columns for display as a SPLOM.
 * This is the cartesian product formatted as follows:
 * [
 *   [[c1, c1], [c1,c2]],
 *   [[c2, c1], [c2, c2]],
 * ]
 *
 * @param columnNames The set column names to pair.
 * @returns {*[][]} The column name pairs for the SPLOM array.
 */
const pairColumnsForSPLOM = (columnNames) => {
    if (columnNames.size === 0) {
        return []
    }
    // Convert to a list because I'm lazy
    const columnNamesList = [...columnNames]
    const column_product = cartesian(columnNamesList, columnNamesList);
    const rows = columnNamesList.map(() => []);
    column_product.forEach((d, i) => {
        rows[i % columnNamesList.length].push(d)
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

    const nonProjectionColumnNames = getNonProjectionColumnNames(data);

    // State for column autocomplete component
    const [selectedColumn, setSelectedColumn] = useState(nonProjectionColumnNames[0]);

    // The columns currently displayed in the data panel
    const [currentlyDisplayedColumns, setCurrentlyDisplayedColumns] = useState(new Set());

    // Pair the columns for display as a SPLOM.
    const pairedSPLOMColumns = pairColumnsForSPLOM(currentlyDisplayedColumns);

    // Each row / column has each of the n currentlyDisplayedColumns in it
    // So we can get the size of each chart by dividing by currentlyDisplayedColumns length
    const scatterWidth = (width / pairedSPLOMColumns.length);
    const scatterHeight = (height / pairedSPLOMColumns.length);

    const isSelectedColumnDisplayed = currentlyDisplayedColumns.has(selectedColumn);

    return (
        <Box sx={{height: '90%', width: '90%', margin: 'auto', display: 'flex', flexDirection: 'column'}}>
            <Paper sx={{
                height: '15%',
                width: '100%',
                marginBottom: '5%',
                display: 'flex',
                justifyContent: 'space-evenly'
            }}>
                <Autocomplete
                    disablePortal
                    value={selectedColumn}
                    onChange={(e, d) => setSelectedColumn(d)}
                    id="column"
                    options={nonProjectionColumnNames}
                    sx={{width: '30%', marginTop: 'auto', marginBottom: 'auto'}}
                    renderInput={(params) => <TextField {...params} label="Column"/>}
                />
                <Button variant="outlined" color={isSelectedColumnDisplayed ? 'error' : 'primary'}
                        sx={{width: '30%', marginTop: 'auto', marginBottom: 'auto'}} onClick={() => {
                    // If the column is already displayed then we should remove it.
                    if (isSelectedColumnDisplayed) {
                        const temp = new Set(currentlyDisplayedColumns)
                        temp.delete(selectedColumn)
                        setCurrentlyDisplayedColumns(temp)
                    } else {
                        const temp = currentlyDisplayedColumns.size > 0 ? new Set(currentlyDisplayedColumns).add(selectedColumn) : new Set([selectedColumn]);
                        setCurrentlyDisplayedColumns(temp)
                    }
                }
                }>{isSelectedColumnDisplayed ? 'Remove' : 'Add'}</Button>
            </Paper>
            <Paper sx={{height: '80%', width: '100%', marginTop: '5%'}}>
                <Box ref={squareRef}
                     sx={{margin: 'auto', height: '95%', width: '95%', display: 'flex', flexDirection: 'column'}}>
                    {width && pairedSPLOMColumns.map((row, i) => {
                        return (
                            <Box key={`row_${i}`} sx={{display: 'flex', height: scatterHeight}}>
                                {row.map(([c1, c2]) => {
                                    const columnNames = {'xColumn': c1, 'yColumn': c2}

                                    return (
                                        <div key={`${c1}_${c2}`}>
                                            <ScatterChart data={data.map(d => {
                                                return {...d, x: d[c1], y: d[c2]}
                                            })} dimensions={{width: scatterWidth, height: scatterHeight}}
                                                          columns={columnNames}/>
                                        </div>
                                    )
                                })}
                            </Box>
                        )
                    })}
                </Box>
            </Paper>
        </Box>
    );
}