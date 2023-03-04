import Paper from '@mui/material/Paper';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import {useSelector} from "react-redux";
import {selectAllClauses} from "../../slices/clauseSlice";

/**
 * The predicate panel. Contains everything related to the predicates that form the DiMENsIoNAl BrIDge.
 * @returns {JSX.Element}
 */
export const PredicatePanel = () => {
    const predicates = useSelector(selectAllClauses);

    return (
        <Paper sx={{height: '90%', width: '90%', margin: 'auto'}}>
            <List sx={{height: '95%', width: '95%', margin: 'auto'}}>
                {predicates && predicates.map(d => {
                    return (
                        <ListItem key={d.column}>

                        </ListItem>
                    )
                })}
            </List>
        </Paper>
    );
}