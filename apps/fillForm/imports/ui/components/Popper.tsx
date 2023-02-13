import React, { useRef, useEffect } from 'react'
import { Options } from '@popperjs/core'
import { usePopper } from 'react-popper'
import _ from 'lodash'

export type PopperOptions = Omit<Partial<Options>, "strategy">

export function Popper(props: React.PropsWithChildren<{
  visible?: boolean,
  relativeTo: HTMLElement|null,
  onClickElsewhere?: () => any,
  options?: PopperOptions
}>) {
  const popperRef = useRef<HTMLDivElement>(null)

  const { styles, attributes } = usePopper(
    props.relativeTo,
    popperRef.current,
    props.options)

  useEffect(() => {
    if (! props.onClickElsewhere) return

    const onClickElsewhere = props.onClickElsewhere

    function handleDocumentClick(event : MouseEvent) {
      const clickedWhere = event.target as Element
      if (props.relativeTo?.contains(clickedWhere)) {
        return
      } else if (popperRef.current?.contains(clickedWhere)) {
        return
      } else {
        onClickElsewhere()
      }
    }

    document.addEventListener("mousedown", handleDocumentClick)
    return /* destructor */ () => {
      document.removeEventListener("mousedown", handleDocumentClick)
    }
  })

  const style = _.extend({}, styles.popper, (props.visible && popperRef.current) ? {} : {display: 'none'})

  return <div ref={popperRef} style={style} {...attributes.popper}>
    {props.children}
  </div>
}
