import React from "react"

export default function StartButton({nbSelected}: {nbSelected: number}) {
  return (
    <button
      type="button"
      className={"btn btn-primary"}
      disabled={nbSelected == 0}
      onClick={() => {}}>
      Start {nbSelected} PhD assessment{nbSelected > 1 && <>s</>}
    </button>
  )
}
