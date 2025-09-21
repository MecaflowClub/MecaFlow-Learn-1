import React from 'react'
import Navbar from '../components/Navbar'
import Hero from '../components/Hero' 
import SolidWorks from '../components/solidworks'
import LearningPath from '../components/LearningPath'
import How from '../components/How'
import Footer from '../components/Footer'
function Home() {
  return (
    <div>
      <Navbar />
      <Hero />
      <SolidWorks />
      <LearningPath />
      <How />
      <Footer />  
    </div>
  )
}

export default Home
