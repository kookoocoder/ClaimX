import React from "react"
import { Upload, Search, CheckCircle, Zap, Award } from "lucide-react"

export default function FeatureSection() {
  return (
    <div className="w-full mt-16 mb-6 px-4">
      {/* How It Works Section */}
      <section className="max-w-7xl mx-auto mt-24 mb-20">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-12">
          How It Works
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-purple-800/40 backdrop-blur-sm border border-purple-700/50 rounded-lg p-6">
            <div className="w-12 h-12 bg-purple-500/60 rounded-lg flex items-center justify-center mb-4">
              <Upload className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Upload Your Meme</h3>
            <p className="text-purple-100">
              Share the meme you want to analyze. We support all popular image formats.
            </p>
          </div>

          <div className="bg-purple-800/40 backdrop-blur-sm border border-purple-700/50 rounded-lg p-6">
            <div className="w-12 h-12 bg-purple-500/60 rounded-lg flex items-center justify-center mb-4">
              <Search className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">AI Analysis</h3>
            <p className="text-purple-100">
              Our advanced AI algorithms analyze visual elements, text content, and stylistic patterns.
            </p>
          </div>

          <div className="bg-purple-800/40 backdrop-blur-sm border border-purple-700/50 rounded-lg p-6">
            <div className="w-12 h-12 bg-purple-500/60 rounded-lg flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Results & Attribution</h3>
            <p className="text-purple-100">
              Get detailed results showing the likely creator and confidence score of the match.
            </p>
          </div>
        </div>
      </section>

      {/* Why Choose ClaimX Section */}
      <section className="max-w-7xl mx-auto py-12">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-6">
          Why Choose ClaimX
        </h2>
        <p className="text-center text-purple-100 max-w-3xl mx-auto mb-12">
          Our advanced platform provides accurate attribution with state-of-the-art AI technology.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-purple-800/40 backdrop-blur-sm border border-purple-700/50 rounded-lg p-6 flex">
            <div className="w-12 h-12 bg-purple-500/60 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
              <Award className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">High Accuracy</h3>
              <p className="text-purple-100">
                Our algorithms achieve over 95% accuracy in creator identification across millions of memes.
              </p>
            </div>
          </div>

          <div className="bg-purple-800/40 backdrop-blur-sm border border-purple-700/50 rounded-lg p-6 flex">
            <div className="w-12 h-12 bg-purple-500/60 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">Fast Analysis</h3>
              <p className="text-purple-100">
                Get results in seconds, not minutes. Our optimized processing pipeline delivers instant insights.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
} 