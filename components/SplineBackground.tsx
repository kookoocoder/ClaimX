"use client"

import React from "react"
import Spline from "@splinetool/react-spline"

export default function SplineBackground() {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      {/* Deep purple gradient overlay */}
      <div className="absolute inset-0 bg-gradient-radial from-purple-900/30 via-purple-800/20 to-black/50 z-[-1]"></div>
      
      {/* Additional top overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent z-[-1]"></div>
      
      {/* Spline 3D scene */}
      <div className="absolute top-0 left-0 w-full h-full z-[-2]">
        <Spline scene="https://prod.spline.design/UelzZnOTnD61YLM6/scene.splinecode" />
      </div>
    </div>
  )
} 