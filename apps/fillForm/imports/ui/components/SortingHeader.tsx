import React from "react";
import {sortedByOrderPossibilities} from "/imports/ui/components/ImportSciper/List";

export const SortArrow = (
  { direction }:
    { direction : sortedByOrderPossibilities | 'neutral' }
) => <>
  { direction === 'asc' && <span className={ 'header-sortable-icon-arrow' }>▼</span> }
  { direction === 'desc' && <span className={ 'header-sortable-icon-arrow' }>▲</span> }
  { direction === 'neutral' && <span className={ 'header-sortable-icon-neutral' }>▽△</span> }
</>
