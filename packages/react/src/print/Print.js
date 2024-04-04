
import { Button, Col, Row, Space } from "antd";
import React, { useRef } from "react";
import ReactToPrint, { useReactToPrint } from "react-to-print";

export const Printer = ({document: Document, data, printer}) => {
    const ref = useRef();
    data.ref = ref;
    console.log(document, data);
    printer.print = useReactToPrint({
      content: () => ref.current,
    });
    return (
      <div>
        {/* <ReactToPrint  
          trigger={() => trigger || <Button>STAMPA</Button>}
          content={() => ref.current}
        /> */}
        <Document {...data} ref={ref} />
      </div>
    );
};

