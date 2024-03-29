import {useEffect, useState} from 'react';
import Paper from '@mui/material/Paper';
import {SPLOMScatterChart} from "../charts/ScatterChart";
import Box from '@mui/material/Box';
import useElementSize from "../../hooks/useElementSize";
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import {useDispatch, useSelector} from "react-redux";
import {addManualPredicate, selectAllDraftClauses, selectSelectedPredicateOrDraft} from "../../slices/predicateSlice";
import Typography from '@mui/material/Typography';

// Column label size in pixels.
const COLUMN_LABEL_SIZE_PX = 24;


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
    const {x, y, id, isFiltered, intersection, predNotBrush, brushNotPred, unselected, ...rest} = data[0];
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
 * The section containing the controls for the data panel.
 * @param data The raw data.
 * @param currentlyDisplayedColumns The columns currently selected for display.
 * @param setCurrentlyDisplayedColumns Function to set the currently displayed columns.
 * @returns {JSX.Element}
 */
const ControlSection = ({data, currentlyDisplayedColumns, setCurrentlyDisplayedColumns}) => {
    const dispatch = useDispatch();
    const clauses = useSelector(selectAllDraftClauses);

    const nonProjectionColumnNames = getNonProjectionColumnNames(data);

    // State for column autocomplete component
    const [selectedColumn, setSelectedColumn] = useState(nonProjectionColumnNames[0]);

    const isSelectedColumnDisplayed = currentlyDisplayedColumns.has(selectedColumn);

    return (
        <>
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
            }>{isSelectedColumnDisplayed ? 'Remove Column' : 'Add Column'}</Button>
            <Button variant={"outlined"} disabled={clauses.length < 1}
                    sx={{width: '30%', marginTop: 'auto', marginBottom: 'auto'}} onClick={() => {
                dispatch(addManualPredicate({clauses: clauses}))
            }
            }>Add Predicate</Button>
        </>
    )
}

/**
 * A scatter plot matrix.
 * @param data The raw data containing columns to potentially plot.
 * @param pairedSPLOMColumns The pairs of columns within data to actually plot.
 * @returns {JSX.Element}
 */
const ScatterPlotMatrix = ({data, pairedSPLOMColumns}) => {
    const [squareRef, {width, height}] = useElementSize();

    // Each row / column has each of the n currentlyDisplayedColumns in it
    // So we can get the size of each chart by dividing by currentlyDisplayedColumns length
    const scatterWidth = (width / pairedSPLOMColumns.length);
    const scatterHeight = ((height - COLUMN_LABEL_SIZE_PX) / pairedSPLOMColumns.length);

    return (
        <Box ref={squareRef}
             sx={{margin: 'auto', height: '95%', width: '95%', display: 'flex', flexDirection: 'column'}}>
            <Box sx={{width: '100%', height: COLUMN_LABEL_SIZE_PX, display: 'flex'}}>
                {pairedSPLOMColumns.map((row, i) => <Typography key={`label_${i}`}
                                                                sx={{margin: 'auto'}}>{row[0][1]}</Typography>)}
            </Box>
            {width && pairedSPLOMColumns.map((row, i) => {
                return (
                    <Box key={`row_${i}`} sx={{display: 'flex', height: scatterHeight}}>
                        {row.map(([c1, c2]) => {
                            const columnNames = {'xColumn': c1, 'yColumn': c2}

                            return (
                                <div key={`${c1}_${c2}`}>
                                    <SPLOMScatterChart data={data.map(d => {
                                        return {...d, x: d[c1], y: d[c2]}
                                    })} dimensions={{width: scatterWidth, height: scatterHeight}}
                                                       columnNames={columnNames}/>
                                </div>
                            )
                        })}
                    </Box>
                )
            })}
        </Box>
    )
}


/**
 * The data panel. Contains everything related to the data side of the DiMENsIoNAl BrIDge.
 * @param data The data to display. Currently requires just the features, and gets rid of the projection data.
 * (Projection data should be filtered out before here in the future)
 * @returns {JSX.Element}
 */
export const DataPanel = ({data}) => {
    // The columns currently displayed in the data panel
    const [currentlyDisplayedColumns, setCurrentlyDisplayedColumns] = useState(new Set());

    const selectedPredicate = useSelector(selectSelectedPredicateOrDraft);

    // We want to show all the columns the user has selected as well as any relevant
    // to the selected predicate.
    useEffect(() => {
        const temp = new Set(currentlyDisplayedColumns);
        Object.entries(selectedPredicate.clauses).forEach(([id]) => {
            if (!currentlyDisplayedColumns.has(id)) {
                temp.add(id);
            }
        });
        if (temp.size > currentlyDisplayedColumns.size) {
            setCurrentlyDisplayedColumns(temp);
        }
    }, [currentlyDisplayedColumns, setCurrentlyDisplayedColumns, selectedPredicate])

    // Pair the columns for display as a SPLOM.
    const pairedSPLOMColumns = pairColumnsForSPLOM(currentlyDisplayedColumns);

    return (
        <Box sx={{height: '90%', width: '90%', margin: 'auto', display: 'flex', flexDirection: 'column'}}>
            <Paper sx={{
                height: '15%',
                width: '100%',
                marginBottom: '5%',
                display: 'flex',
                justifyContent: 'space-evenly'
            }}>
                <ControlSection data={data} currentlyDisplayedColumns={currentlyDisplayedColumns}
                                setCurrentlyDisplayedColumns={setCurrentlyDisplayedColumns}/>
            </Paper>
            <Paper sx={{height: '80%', width: '100%', marginTop: '5%'}}>
                <ScatterPlotMatrix data={data} pairedSPLOMColumns={pairedSPLOMColumns}/>
            </Paper>
        </Box>
    );
}