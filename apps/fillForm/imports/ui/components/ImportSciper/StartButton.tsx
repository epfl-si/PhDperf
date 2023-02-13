import React from "react"

export default function StartButton({ nbSelected, total, isStarted, startFunc }:
{ nbSelected: number, total: number, isStarted: boolean, startFunc: () => void }
) {
  return (
    <button
      type="button"
      className={"btn btn-primary"}
      disabled={nbSelected == 0 || isStarted}
      onClick={ () => startFunc() }>
      Start {nbSelected} / {total} PhD assessment{nbSelected > 1 && <>s</>}
      { isStarted &&
        <>&nbsp;<span className="loader" /></>
      }
    </button>
  )
}
