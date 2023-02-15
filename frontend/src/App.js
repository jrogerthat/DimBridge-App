import { useState } from 'react'
import './App.css';
import AppBar from '@mui/material/AppBar';
import Typography from '@mui/material/Typography';
import LeftSidebar from './components/leftSidebar';
import MainWrap from './components/mainWrap';

function App() {

   // new line start
  const [profileData, setProfileData] = useState(null);
  const [predEditMode, setPredEditMode] = useState(true);

 
  return (
    <div className="App">
      {/* <div className="header">PIXAL</div> */}
      <AppBar position="static" sx = {{ background: 'white', padding: "10px"}}>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: 'GrayText' }}>DIMBRIDGE</Typography>
      </AppBar>
      <div className="main-wrapper">
        <LeftSidebar></LeftSidebar>
        {/* {predEditMode ? (
          <PredicateExplore/>
        ): (
          
        )} */}
        <MainWrap/>
      </div>
    
    </div>
  );
}

export default App;