import React, { useLayoutEffect } from 'react'
import SearchSsrHidden1ox42mn from '../components/SearchSsrHidden1ox42mn.jsx'
import SearchMain from '../components/SearchMain.jsx'
import SvgSprites from '../components/SvgSprites.jsx'
import { useFramerAppear } from '../hooks/useFramerAppear.js'

export default function SearchPage() {
  useFramerAppear()

  useLayoutEffect(() => {
    const html = document.documentElement
    const body = document.body
    const root = document.getElementById('root')

    const previous = {
      htmlOverflow: html.style.overflow,
      htmlOverflowY: html.style.overflowY,
      htmlHeight: html.style.height,
      bodyOverflow: body.style.overflow,
      bodyOverflowY: body.style.overflowY,
      bodyHeight: body.style.height,
      bodyMinHeight: body.style.minHeight,
      rootOverflow: root?.style.overflow || '',
      rootOverflowY: root?.style.overflowY || '',
      rootHeight: root?.style.height || '',
      rootMinHeight: root?.style.minHeight || '',
    }

    html.style.overflow = 'visible'
    html.style.overflowY = 'auto'
    html.style.height = 'auto'

    body.style.overflow = 'visible'
    body.style.overflowY = 'auto'
    body.style.height = 'auto'
    body.style.minHeight = '100vh'

    if (root) {
      root.style.overflow = 'visible'
      root.style.overflowY = 'visible'
      root.style.height = 'auto'
      root.style.minHeight = '100vh'
    }

    return () => {
      html.style.overflow = previous.htmlOverflow
      html.style.overflowY = previous.htmlOverflowY
      html.style.height = previous.htmlHeight

      body.style.overflow = previous.bodyOverflow
      body.style.overflowY = previous.bodyOverflowY
      body.style.height = previous.bodyHeight
      body.style.minHeight = previous.bodyMinHeight

      if (root) {
        root.style.overflow = previous.rootOverflow
        root.style.overflowY = previous.rootOverflowY
        root.style.height = previous.rootHeight
        root.style.minHeight = previous.rootMinHeight
      }
    }
  }, [])

  return (
    <div
      className="framer-F8Qc9 framer-ksssmz"
      style={{ minHeight: '100vh', width: 'auto', overflow: 'visible', alignItems: 'stretch' }}
    >
      <style>
        {`
          .framer-F8Qc9.framer-ksssmz {
            overflow: visible;
            align-items: stretch;
          }

          .framer-F8Qc9 .framer-1u9asl6 {
            min-height: 100vh;
            height: auto;
            overflow: visible;
            align-items: stretch;
          }

          .framer-F8Qc9 .framer-14hieps {
            min-height: calc(100vh - 16px);
            height: auto;
            align-items: stretch;
            overflow: visible;
          }

          html,
          body,
          #root {
            min-height: 100vh;
            height: auto;
            overflow: visible !important;
            overflow-y: auto !important;
          }
        `}
      </style>
      <SvgSprites />
      <SearchSsrHidden1ox42mn />
      <div className="framer-1u9asl6" style={{ minHeight: '100vh', height: 'auto', overflow: 'visible', alignItems: 'stretch' }}>
        <div className="framer-14hieps" style={{ minHeight: 'calc(100vh - 16px)', height: 'auto', alignItems: 'stretch', overflow: 'visible' }}>
          <SearchMain />
        </div>
      </div>
    </div>
  )
}
