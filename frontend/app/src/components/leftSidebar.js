import '../App.css';
import Button from '@mui/material/Button';


function LeftSidebar({predEditMode, setPredEditMode}) {

  return (
    <div className="left-sidebar">
      <div className="data-picker">
        top box
      </div>
      <div className="predicate-nav">
        second box
      </div>
    </div>
  );
}

export default LeftSidebar;
