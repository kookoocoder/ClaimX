"use client"

import React from "react"
import Spline from "@splinetool/react-spline"

export default function SplineBackground() {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none bg-black">
      {/* Spline 3D scene */}
      <div className="absolute top-0 left-0 w-full h-full z-[-2] scale-[1.2] origin-center">
        <Spline scene="https://prod.spline.design/UelzZnOTnD61YLM6/scene.splinecode" />
      </div>
    </div>
  )
} 