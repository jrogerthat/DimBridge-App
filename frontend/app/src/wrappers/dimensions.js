import React from "react";
import useElementSize from "../hooks/useElementSize";

export function withDimensions(WrappedComponent) {
    const WithDimensions = (props) => {
        const [squareRef, {width, height}] = useElementSize();

        return (
            <div ref={squareRef} style={{height: "100%", width: '100%'}}>
                {width && <WrappedComponent {...props} dimensions={{width: width, height: height}}/>}
            </div>
        )
    }
    return WithDimensions;
}
