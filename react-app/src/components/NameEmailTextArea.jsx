import React from 'react'
import styles from './NameEmailTextArea.module.css'

export default function NameEmailTextArea() {
  return (
    <>
      <div className="framer-69e41a">
                                <div className="framer-16zm4qx">
                                    <label className="framer-s5w404"
                                        ><div className="framer-form-text-input framer-form-input-wrapper framer-scsdmc">
                                            <input
                                                type="text"
                                                name="Name"
                                                placeholder="Jane Smith"
                                                className="framer-form-input framer-form-input-empty"
                                            /></div></label
                                    ><label className="framer-1j2kmcl"
                                        ><div className="framer-form-text-input framer-form-input-wrapper framer-cofb8a">
                                            <input
                                                type="email"
                                                name="Email"
                                                placeholder="Email"
                                                className="framer-form-input framer-form-input-empty"
                                            /></div
                                    ></label>
                                </div>
                                <label className="framer-1xzyr1q"
                                    ><div className="framer-form-text-input framer-form-input-wrapper framer-1ozfi3a">
                                        <textarea
                                            name="Email"
                                            placeholder="Hello book.immo"
                                            className="framer-form-input"
                                        ></textarea></div
                                ></label>
                            </div>
    </>
  )
}
