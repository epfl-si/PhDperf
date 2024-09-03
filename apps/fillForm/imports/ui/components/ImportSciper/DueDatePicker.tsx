import React from "react"
import dayjs from "dayjs";

import "flatpickr/dist/themes/light.css";
import Flatpickr from "react-flatpickr";


type DueDatePickerType = {
  value: Date | undefined,
  isNeeded: boolean,
  setDueDateCallback: (value: Date) => void,
}

export default function DueDatePicker(
  {
    value,
    isNeeded,  // show to the user that there is a need of this value ?
    setDueDateCallback
  }: DueDatePickerType
) {
  return (
    <div className="mt-2 form-row">
      <div className="form-check">
      <label className="form-check-label">Due date</label>
      <Flatpickr
        options={
          {
            allowInput: true,
            altInput: true,
            altInputClass: `form-control`,
            altFormat: "d.m.Y",
            dateFormat: "Y-m-d",
            // hack to remove the hour-minute-millisecond that invalidate the +1 day value
            minDate: new Date(dayjs().add(1, 'day').toDate().toDateString()),
            locale: {
              firstDayOfWeek: 1
            },
          }
        }
        defaultValue={ undefined }
        value={ value }
        onChange={
          (newDate) => setDueDateCallback(newDate[0])
        }
      />
      { isNeeded &&
        <span className="invalid-feedback">The due date is needed</span>
      }
    </div>
    </div>
  )
}
