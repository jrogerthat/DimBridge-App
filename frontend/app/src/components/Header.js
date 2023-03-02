import AppBar from '@mui/material/AppBar';
import Typography from '@mui/material/Typography';

export const Header = () => {
    return (
        <AppBar position="static" sx={{background: 'white', padding: "10px"}}>
            <Typography variant="h6" component="div" sx={{flexGrow: 1, color: 'GrayText'}}>DIMBRIDGE</Typography>
        </AppBar>
    );
}