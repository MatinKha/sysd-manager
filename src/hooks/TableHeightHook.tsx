import { RefObject, useLayoutEffect, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

export const useTableHeight = (ref: RefObject<Element | null>) => {
  const [tableHeight, setTableHeight] = useState<number>();
  const resizeTable = useDebouncedCallback(
    () => {
      const node = ref.current;
      if (!node) {
        return;
      }
      const { height } = node.getBoundingClientRect();
      setTableHeight(height - 55 - 48);
    },
    100,
    {
      trailing: true,
      maxWait: 100,
    },
  );

  useLayoutEffect(() => {
    resizeTable();
    window.addEventListener('resize', resizeTable);

    return () => {
      window.removeEventListener('resize', resizeTable);
    };
  }, [resizeTable]);

  return tableHeight;
};

