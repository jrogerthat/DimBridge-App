import Paper from '@mui/material/Paper';
import {ScatterChart} from "../charts/ScatterChart";
import Box from '@mui/material/Box';
import useElementSize from "../../hooks/useElementSize";


const cartesian =
    (...a) => a.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())));

/**
 * The data panel. Contains everything related to the data side of the DiMENsIoNAl BrIDge.
 * @param data The data to display. Currently requires just the features, and gets rid of the projection data.
 * (Projection data should be filtered out before here in the future)
 * @returns {JSX.Element}
 */
export const DataPanel = ({data}) => {
    const [squareRef, {width, height}] = useElementSize();


    const {x, y, ...rest} = data[0];
    const columns = Object.keys(rest);
    const column_product = cartesian(columns, columns);
    const rows = columns.map(d => []);
    column_product.forEach((d, i) => {
        rows[i % columns.length].push(d)
    });
    const scatter_width = (width / columns.length);
    const scatter_height = (height / columns.length);

    console.log(`width: ${438}`);
    console.log(`height: ${454}`);

    return (
        <Paper sx={{height: '90%', width: '90%', margin: 'auto', display: 'flex'}}>
            <Box ref={squareRef}
                 sx={{margin: 'auto', height: '95%', width: '95%', display: 'flex', flexDirection: 'column'}}>
                {width && rows.map((row, i) => {
                    return (
                        <Box key={`row_${i}`} sx={{display: 'flex', height: scatter_height}}>
                            {row.map(([c1, c2]) => {
                                return (
                                    <div key={`${c1}_${c2}`}>
                                        <ScatterChart data={data.map(d => {
                                            return {...d, x: d[c1], y: d[c2]}
                                        })} dimensions={{width: scatter_width, height: scatter_height}}/>
                                    </div>
                                )
                            })}
                        </Box>
                    )
                })}
                {/*{width && column_product.map(([c1, c2], index) => {*/}
                {/*    console.log(width);*/}
                {/*    console.log(height);*/}

                {/*const scatter_width = (width / columns.length);*/}
                {/*const scatter_height = (height / columns.length);*/}

                {/*return (*/}
                {/*    <div key={`${c1}_${c2}`}>*/}
                {/*        <ScatterChart data={data.map(d => {*/}
                {/*            return {...d, x: d[c1], y: d[c2]}*/}
                {/*        })} dimensions={{width: scatter_width, height: scatter_height}}/>*/}
                {/*    </div>*/}
                {/*)*/}
                {/*})}*/}
            </Box>
        </Paper>
    );
}