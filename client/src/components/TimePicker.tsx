import type { ICellEditorParams } from "ag-grid-community";

const TimeCellEditor = ((props: ICellEditorParams) => {
    return (
        <input
            type="time"
            defaultValue={props.value || ""}
            onChange={(e) => {
                const newValue = e.target.value;

                props.node.setDataValue(props.column.getColId(), newValue);
            }}
            autoFocus
            className="w-full h-full px-1 outline-none"
        />
    );
});

export default TimeCellEditor;