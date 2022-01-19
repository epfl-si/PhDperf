import React from "react"

export default function StartButton({nbSelected, total}: {nbSelected: number, total: number}) {
  return (
    <button
      type="button"
      className={"btn btn-primary"}
      disabled={nbSelected == 0}
      onClick={() => {}}>
      Start {nbSelected} / {total} PhD assessment{nbSelected > 1 && <>s</>}
    </button>
  )
}
