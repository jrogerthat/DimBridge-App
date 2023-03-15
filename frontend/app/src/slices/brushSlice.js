import { createSlice } from '@reduxjs/toolkit'

const initialState = { x: null, y: null  }

const counterSlice = createSlice({
  name: 'brush',
  initialState,
  reducers: {
    setProjectionBrushDimension(state, action) {
      state.x = action.payload.x;
      state.y = action.payload.y;
    },
  },
})

export const { setProjectionBrushDimension } = counterSlice.actions
export default counterSlice.reducer

// 'x': {
//     'min': scales.xScale.invert(pixelSpace[0][0]),
//     'max': scales.xScale.invert(pixelSpace[1][0])
// },
// 'y': {
//     'min': scales.yScale.invert(pixelSpace[1][1]),
//     'max': scales.yScale.invert(pixelSpace[0][1])
// }