import { Splitter } from "antd";
import UnitList from "./UnitList";
import { createContext, useState } from "react";
import UnitDescription from "./UnitDescription";
import { SystemdUnit } from "../models/systemd";

interface UnitState {
  selectedUnit: SystemdUnit | null,
  setSelectedUnit: any,

}
export const UnitsContext = createContext<UnitState>({
  selectedUnit: null,
  setSelectedUnit: () => null,

})

export default function UnitSplit() {
  const [selectedUnit, setSelectedUnit] = useState(null);
  return (
    <UnitsContext value={{ selectedUnit, setSelectedUnit }}>
      <Splitter>
        <Splitter.Panel defaultSize="40%">
          <UnitList />
        </Splitter.Panel>
        <Splitter.Panel>
          <UnitDescription />
        </Splitter.Panel>
      </Splitter >
    </UnitsContext>
  );
}
