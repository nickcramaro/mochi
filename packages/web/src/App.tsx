import { useState } from 'react'
import { isLoggedIn } from './lib/api'
import AuthForm from './components/AuthForm'
import Dashboard from './components/Dashboard'

function App() {
  const [authed, setAuthed] = useState(isLoggedIn())

  if (!authed) {
    return <AuthForm onAuth={() => setAuthed(true)} />
  }

  return <Dashboard onLogout={() => setAuthed(false)} />
}

export default App
