// import { useState } from 'react'
// import heroImg from './assets/hero.png'
// import reactLogo from './assets/react.svg'
// import viteLogo from './assets/vite.svg'
import './App.css'

function App() {
  const firstName = 'David';
  const secondName = "Rob";

  return (
    <>
      {console.log("Customer is:", `${firstName + secondName}`)}
      <h1>{firstName + secondName}</h1>
    </>
  )
}

export default App
