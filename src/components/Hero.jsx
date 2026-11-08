import React from 'react'
import HomeSearchForm from './HomeSearchForm.jsx'
import HeroTicker from './HeroTicker.jsx'
import HeroPill from './HeroPill.jsx'

export default function Hero() {
  return (
    <>
      <section className="framer-1oqa2t2" style={{gap: 40, padding: "172px 0 96px"}}><div className="framer-r6linc" data-framer-appear-id="r6linc" style={{}}><div className="framer-bkwk62"><div className="framer-1du093q"><div className="framer-1tvwn6d" style={{transform: "none"}}><h1 className="framer-text framer-styles-preset-lz3mo3" style={{'--framer-text-alignment': "center"}}>Your next <span style={{'--framer-text-color': "var(--token-5c28b080-63a4-416d-b638-2f3867ab529e, rgb(255, 102, 37))"}} className="framer-text">home</span></h1></div><div className="framer-lwwfas hidden-1woyh6i"><div className="framer-1ctuwx3"><div style={{position: "absolute", borderRadius: "inherit", top: "0", right: "0", bottom: "0", left: "0"}}><HeroPill /></div></div></div></div><div className="framer-1nob8pj"><div className="framer-hv0zx2" style={{transform: "none"}}><h1 className="framer-text framer-styles-preset-lz3mo3" style={{'--framer-text-alignment': "center"}}>in a new city, <span style={{'--framer-text-color': "var(--token-5c28b080-63a4-416d-b638-2f3867ab529e, rgb(255, 102, 37))"}} className="framer-text">by&nbsp;AI</span></h1></div></div></div><div className="framer-e74vho" style={{transform: "none", width: "100%", maxWidth: "none"}}><HeroTicker /></div></div><HomeSearchForm /></section>
    </>
  )
}
