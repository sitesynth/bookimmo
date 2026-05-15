import React from 'react'
import { useFramerAppear } from '../hooks/useFramerAppear.js'
import SvgSprites from '../components/SvgSprites.jsx'
import BookmarkSsrHidden11v7bsy from '../components/BookmarkSsrHidden11v7bsy.jsx'
import BookmarkSsrHidden1mnlorr from '../components/BookmarkSsrHidden1mnlorr.jsx'
import BookmarkMain from '../components/BookmarkMain.jsx'

export default function BookmarkPage() {
  useFramerAppear()
  return (
    <div className="framer-Q4TJj framer-0RYty framer-dzn1u5" style={{minHeight:'100vh',width:'auto'}}>
      <SvgSprites />
      <BookmarkSsrHidden11v7bsy />
      <BookmarkSsrHidden1mnlorr />
      <BookmarkMain />
    </div>
  )
}
