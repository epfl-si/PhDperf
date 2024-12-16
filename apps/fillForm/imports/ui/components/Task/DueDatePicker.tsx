import React from "react"
import dayjs from "dayjs";

import "flatpickr/dist/themes/light.css";
import Flatpickr from "react-flatpickr";


type DueDatePickerType = {
  value: Date | undefined,
  futureOnly: boolean,  // show and allow only days in the future  ?
  isNeeded: boolean,
  setDueDateCallback: (value: Date | undefined) => void,
  label?: string
}

export default function DueDatePicker(
  {
    value,
    futureOnly,
    isNeeded,  // show to the user that there is a need of this value ?
    setDueDateCallback,
    label = 'Due date'
  }: DueDatePickerType
) {
  return (
    <div className="mt-2 form-row">
      <div className="form-check">
      <label className="form-check-label">{ label }</label>
      <Flatpickr
        options={
          {
            allowInput: true,
            altInput: true,
            altInputClass: `form-control`,
            altFormat: "d.m.Y",
            dateFormat: "Y-m-d",
            // hack to remove the hour-minute-millisecond that invalidate the +1 day value
            minDate: futureOnly ?
              new Date(dayjs().add(1, 'day').toDate().toDateString()) : undefined,
            locale: {
              firstDayOfWeek: 1
            },
          }
        }
        defaultValue={ undefined }
        value={ value }
        onChange={ (selectedDates: Date[]) => {
          if (selectedDates.length == 0) {
            setDueDateCallback(undefined)
          } else {
            // when date is selected, the value is set back to local, aka GMT-2
            // that make it look like it is in the past. So set it to 12 hours, for less confusion
            const newDateMiddleOfTheDay = dayjs(selectedDates[0]).hour(14).toDate()
            setDueDateCallback(newDateMiddleOfTheDay)
          }
        }}
      />
      { isNeeded &&
        <span className="invalid-feedback">The due date is needed</span>
      }
    </div>
    </div>
  )
}
