import React, { useState, useEffect, useRef } from 'react'

const NAV_LINKS = [
  { label: 'Properties', href: './dashboard-home' },
  { label: 'Search',     href: './search' },
  { label: 'Agent',      href: './agent' },
]

export default function Variant1() {
  const [open, setOpen] = useState(false)
  const hamburgerRef = useRef(null)
  useEffect(() => {
    const el = hamburgerRef.current
    if (!el) return
    const handler = (e) => { e.stopPropagation(); setOpen(o => !o) }
    el.addEventListener('click', handler, true)
    return () => el.removeEventListener('click', handler, true)
  }, [])
  return (
    <>
      <div className="framer-2u9hi5-container"><div className="ssr-variant hidden-1woyh6i"><nav className="framer-5bpAr framer-77SxD framer-Xjiaj framer-gd2645 framer-v-gd2645" data-framer-appear-id="gd2645" style={{backgroundColor: "rgb(255, 255, 255)", width: "100%", boxShadow: "none"}}><div className="framer-1dhgcv"><div className="framer-9226ck"><div className="framer-16ypxxq"><div className="framer-lxs3ee-container"><a className="framer-mnKiU framer-1qimhvi framer-v-1qimhvi framer-10mvgml" data-framer-appear-id="appear-95" style={{height: "100%", width: "100%"}} href="./"><div style={{imageRendering: "pixelated", flexShrink: "0", fill: "rgba(0,0,0,1)", color: "rgba(0,0,0,1)"}} className="framer-1h5i29g" aria-hidden="true"><div className="svgContainer" style={{width: "100%", height: "100%", aspectRatio: "inherit"}}><svg style={{width: "100%", height: "100%"}} viewBox="0 0 158 25"><use href="#svg-1511956643_7697"></use></svg></div></div></a></div></div><div className="framer-18pmje4"><div className="framer-1gis1pc" style={{transform: "none"}}><p className="framer-text framer-styles-preset-14npl34"><a className="framer-text framer-styles-preset-kik3y8" href="./dashboard-home">Properties</a></p></div><div className="framer-1q9s0om" style={{transform: "none"}}><p className="framer-text framer-styles-preset-14npl34"><a className="framer-text framer-styles-preset-kik3y8" href="./search">Search</a></p></div><div className="framer-nvewls" style={{transform: "none"}}><p className="framer-text framer-styles-preset-14npl34"><a className="framer-text framer-styles-preset-kik3y8" href="./agent">Agent</a></p></div></div><div className="framer-lkv6md"><div className="framer-9cx145"><div className="framer-wrxh7d-container"><a className="framer-6RxxZ framer-77SxD framer-YPkpu framer-1xc55fg framer-v-l1bsy7 framer-1ln4cau" style={{'--border-bottom-width': "0px", '--border-color': "rgba(0, 0, 0, 0)", '--border-left-width': "0px", '--border-right-width': "0px", '--border-style': "solid", '--border-top-width': "0px", '--u1ygwx': "10px 12px 10px 12px", backgroundColor: "rgb(25, 26, 32)", borderBottomLeftRadius: "4px", borderBottomRightRadius: "4px", borderTopLeftRadius: "4px", borderTopRightRadius: "4px", opacity: "1"}} href="./sign-up" tabIndex={0}><div className="framer-2k1xbr" style={{'--extracted-r6o4lv': "var(--variable-reference-a_9fcsebB-GyMnc0m4V)", '--framer-paragraph-spacing': "0px", '--variable-reference-a_9fcsebB-GyMnc0m4V': "var(--token-8162f168-ed62-49f3-b338-425fedfa1e6f, rgb(245, 245, 245))", transform: "none"}}><p className="framer-text framer-styles-preset-14npl34" style={{'--framer-text-color': "var(--extracted-r6o4lv, var(--variable-reference-a_9fcsebB-GyMnc0m4V))"}}>Sign Up</p></div></a></div><div className="framer-138gpz4-container"><a className="framer-6RxxZ framer-77SxD framer-YPkpu framer-1xc55fg framer-v-1v7bnxw framer-1ln4cau" style={{'--border-bottom-width': "1px", '--border-color': "var(--token-3991cae2-fa00-4648-803b-711c24c1718d, rgb(25, 26, 32)) /* {\"name\":\"Black\"} */", '--border-left-width': "1px", '--border-right-width': "1px", '--border-style': "solid", '--border-top-width': "1px", '--u1ygwx': "10px 12px 10px 12px", backgroundColor: "rgba(0, 0, 0, 0)", borderBottomLeftRadius: "4px", borderBottomRightRadius: "4px", borderTopLeftRadius: "4px", borderTopRightRadius: "4px", opacity: "1"}} data-border="true" href="./log-in" tabIndex={0}><div className="framer-2k1xbr" style={{'--extracted-r6o4lv': "var(--variable-reference-a_9fcsebB-GyMnc0m4V)", '--framer-paragraph-spacing': "0px", '--variable-reference-a_9fcsebB-GyMnc0m4V': "var(--token-3991cae2-fa00-4648-803b-711c24c1718d, rgb(25, 26, 32))", transform: "none"}}><p className="framer-text framer-styles-preset-14npl34" style={{'--framer-text-color': "var(--extracted-r6o4lv, var(--variable-reference-a_9fcsebB-GyMnc0m4V))"}}>Log In</p></div></a></div></div><div className="framer-1mofvx8"><div className="framer-du1f9q-container"><div></div></div></div></div></div></div></nav></div><div className="ssr-variant hidden-olbwcu hidden-72rtr7"><nav className="framer-5bpAr framer-77SxD framer-Xjiaj framer-gd2645 framer-v-151pn45" data-framer-appear-id="gd2645" style={{backgroundColor: "rgb(255, 255, 255)", width: "100%", boxShadow: "none"}}><div className="framer-1dhgcv"><div className="framer-9226ck"><div className="framer-16ypxxq"><div className="framer-lxs3ee-container"><a className="framer-mnKiU framer-1qimhvi framer-v-1qimhvi framer-10mvgml" data-framer-appear-id="appear-96" style={{height: "100%", width: "100%"}} href="./"><div style={{imageRendering: "pixelated", flexShrink: "0", fill: "rgba(0,0,0,1)", color: "rgba(0,0,0,1)"}} className="framer-1h5i29g" aria-hidden="true"><div className="svgContainer" style={{width: "100%", height: "100%", aspectRatio: "inherit"}}><svg style={{width: "100%", height: "100%"}} viewBox="0 0 158 25"><use href="#svg-1511956643_7697"></use></svg></div></div></a></div><div className="framer-1xxfa9s-container"><div ref={hamburgerRef} className="framer-iGm3Q framer-fg9or0 framer-v-17u84tm" tabIndex={0} style={{cursor:'pointer'}}><div style={{imageRendering: "pixelated", flexShrink: "0", fill: "rgba(0,0,0,1)", color: "rgba(0,0,0,1)"}} className="framer-1gyn1hq" aria-hidden="true"><div className="svgContainer" style={{width: "100%", height: "100%", aspectRatio: "inherit"}}><svg style={{width: "100%", height: "100%"}} viewBox="0 0 24 25"><use href="#svg-2108670625_372"></use></svg></div></div></div></div></div></div></div></nav>
        {open && (
          <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,zIndex:9998,backgroundColor:'rgba(0,0,0,0.3)'}} onClick={() => setOpen(false)}>
            <div style={{position:'absolute',top:0,left:0,right:0,backgroundColor:'rgb(255,255,255)',boxShadow:'0 4px 24px rgba(0,0,0,0.12)',padding:'80px 24px 32px',display:'flex',flexDirection:'column',gap:4}} onClick={e => e.stopPropagation()}>
              {NAV_LINKS.map(({label, href}) => (
                <a key={href} href={href} onClick={() => setOpen(false)}
                  style={{fontFamily:'"Lexend",sans-serif',fontSize:18,fontWeight:500,color:'rgb(25,26,32)',padding:'14px 0',borderBottom:'1px solid rgba(25,26,32,0.08)',textDecoration:'none'}}>
                  {label}
                </a>
              ))}
              <div style={{display:'flex',gap:12,marginTop:20}}>
                <a href="./sign-up" style={{flex:1,textAlign:'center',backgroundColor:'rgb(25,26,32)',color:'rgb(245,245,245)',padding:'12px',borderRadius:4,fontFamily:'"Lexend",sans-serif',fontSize:14,fontWeight:500,textDecoration:'none'}}>Sign Up</a>
                <a href="./log-in" style={{flex:1,textAlign:'center',border:'1px solid rgb(25,26,32)',color:'rgb(25,26,32)',padding:'12px',borderRadius:4,fontFamily:'"Lexend",sans-serif',fontSize:14,fontWeight:500,textDecoration:'none'}}>Log In</a>
              </div>
            </div>
          </div>
        )}
      </div></div>
    </>
  )
}
