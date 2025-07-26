"use client";
import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
export function Barcode({ value, options }) {
    const ref = useRef(null);
    useEffect(() => {
        if (ref.current) {
            JsBarcode(ref.current, value, options);
        }
    }, [value, options]);
    return <svg ref={ref}/>;
}
;
