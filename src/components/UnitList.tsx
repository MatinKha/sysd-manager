import { Table } from "antd";
import { useTableHeight } from "../hooks/TableHeightHook";
import { useContext, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";
import { SystemdUnit } from "../models/systemd";
import { UnitsContext } from "./UnitSplit";

interface UnitListProps {

}

export default function UnitList({ }: UnitListProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const tableHeight = useTableHeight(contentRef);
  const { isPending, error, data } = useQuery({ queryKey: ['targetList'], queryFn: () => invoke<SystemdUnit[]>('getUnits').then(c => c) });
  const UnitContext = useContext(UnitsContext);

  const onRow = (record: SystemdUnit) => ({
    onClick: () => {
      UnitContext.setSelectedUnit((prev: any) =>
        prev === record.unit ? null : record
      );
    },
    className: UnitContext.selectedUnit?.unit === record.unit ? 'selected-row' : '',
  });


  return <div style={{ height: "100%" }} ref={contentRef}>
    <Table
      locale={{ emptyText: "-" }}
      dataSource={data}
      scroll={{ y: tableHeight }}
      pagination={false}
      showHeader={true}
      rowKey={c => c.unit}
      onRow={onRow}
    >
      <Table.Column key="unit" title="Unit Name" dataIndex="unit" />
      <Table.Column key="load" title="Loaded" dataIndex="load" />
      <Table.Column key="active" title="Active" dataIndex="active" />
      <Table.Column key="Sub" title="Sub" dataIndex="Sub" />
      <Table.Column key="description" title="Description" dataIndex="description" />
    </Table>
  </div>;
}
