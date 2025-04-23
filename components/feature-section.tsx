import React from "react"
import { Upload, Search, CheckCircle, Zap, Award, ShieldCheck, BarChart4 } from "lucide-react"
import { motion } from "framer-motion"

export default function FeatureSection() {
  // Animation variants for staggered fade-in effect
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  }
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.6
      }
    }
  }

  return (
    <div className="w-full px-4 py-16">
      {/* How It Works Section */}
      <section className="max-w-7xl mx-auto mb-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-center text-slate-100 mb-4">
            How It Works
          </h2>
          <p className="text-slate-300 max-w-2xl mx-auto text-lg">
            Verify content ownership and detect plagiarism in just a few simple steps
          </p>
        </div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <motion.div variants={itemVariants} className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm border border-slate-700/50 rounded-xl p-8 hover:shadow-lg transition-all duration-300 hover:translate-y-[-5px] hover:border-slate-600/70 group">
            <div className="w-16 h-16 bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 transition-transform duration-300">
              <Upload className="h-8 w-8 text-slate-200" />
            </div>
            <h3 className="text-xl font-semibold text-slate-100 mb-3">Upload Your Content</h3>
            <p className="text-slate-300 leading-relaxed">
              Drag and drop or select any image you want to verify. Our system supports all common formats including JPG, PNG, WebP, and GIF with a generous 10MB size limit.
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm border border-slate-700/50 rounded-xl p-8 hover:shadow-lg transition-all duration-300 hover:translate-y-[-5px] hover:border-slate-600/70 group">
            <div className="w-16 h-16 bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 transition-transform duration-300">
              <Search className="h-8 w-8 text-slate-200" />
            </div>
            <h3 className="text-xl font-semibold text-slate-100 mb-3">AI Analysis</h3>
            <p className="text-slate-300 leading-relaxed">
              Our multi-agent AI system analyzes your image through four distinct phases: content analysis, dataset matching, similarity scoring, and comprehensive result generation.
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm border border-slate-700/50 rounded-xl p-8 hover:shadow-lg transition-all duration-300 hover:translate-y-[-5px] hover:border-slate-600/70 group">
            <div className="w-16 h-16 bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 transition-transform duration-300">
              <CheckCircle className="h-8 w-8 text-slate-200" />
            </div>
            <h3 className="text-xl font-semibold text-slate-100 mb-3">Results & Attribution</h3>
            <p className="text-slate-300 leading-relaxed">
              Receive detailed attribution reports with creator identification, confidence scores, and specific matched elements to verify the authenticity and ownership of your content.
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* Why Choose ClaimX Section */}
      <section className="max-w-7xl mx-auto py-14 mt-12 border-t border-slate-800/60">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-center text-slate-100 mb-4">
            Why Choose ClaimX
          </h2>
          <p className="text-slate-300 max-w-3xl mx-auto text-lg mb-4">
            Our platform combines speed, accuracy, and depth of analysis to provide the best content attribution solution
          </p>
        </div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <motion.div variants={itemVariants} className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm border border-slate-700/50 rounded-xl p-8 hover:shadow-lg transition-all duration-300 hover:translate-y-[-5px]">
            <div className="w-14 h-14 bg-indigo-900/50 rounded-xl flex items-center justify-center mb-5 shadow-lg">
              <Award className="h-7 w-7 text-indigo-300" />
            </div>
            <h3 className="text-xl font-semibold text-slate-100 mb-3">99% Accuracy</h3>
            <p className="text-slate-300 leading-relaxed">
              Our state-of-the-art AI algorithms achieve industry-leading 99% accuracy in creator identification, ensuring reliable results you can trust for content verification.
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm border border-slate-700/50 rounded-xl p-8 hover:shadow-lg transition-all duration-300 hover:translate-y-[-5px]">
            <div className="w-14 h-14 bg-emerald-900/50 rounded-xl flex items-center justify-center mb-5 shadow-lg">
              <Zap className="h-7 w-7 text-emerald-300" />
            </div>
            <h3 className="text-xl font-semibold text-slate-100 mb-3">Lightning Fast</h3>
            <p className="text-slate-300 leading-relaxed">
              With an average analysis time of just 3 seconds, our optimized processing pipeline delivers instant attribution results when you need them most.
            </p>
          </motion.div>
          
          <motion.div variants={itemVariants} className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm border border-slate-700/50 rounded-xl p-8 hover:shadow-lg transition-all duration-300 hover:translate-y-[-5px]">
            <div className="w-14 h-14 bg-amber-900/50 rounded-xl flex items-center justify-center mb-5 shadow-lg">
              <BarChart4 className="h-7 w-7 text-amber-300" />
            </div>
            <h3 className="text-xl font-semibold text-slate-100 mb-3">Vast Database</h3>
            <p className="text-slate-300 leading-relaxed">
              With over 5 million analyzed content items in our continuously growing database, we can identify and attribute content across a wide range of creators and styles.
            </p>
          </motion.div>
        </motion.div>
        
        <div className="mt-16 text-center">
          <p className="text-slate-300 mb-8 max-w-2xl mx-auto">
            Ready to verify the authenticity of your content? Try ClaimX today and join thousands of creators protecting their work.
          </p>
          <button 
            onClick={() => document.getElementById('upload-card')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-8 py-3 rounded-full bg-slate-800 hover:bg-slate-700 text-white text-base font-medium shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Get Started Now
          </button>
        </div>
      </section>
    </div>
  )
}