import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import Layout from './components/Layout';
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Modification from './components/Modification';
import Office from './components/Office';
import Login from './components/Login';
import { useState } from 'react';

function App() {
  const [show, setShow] = useState("front");
  const [user, setUser] = useState({});
  const [error, setError] = useState("");
  const [pageEdited, setPageEdited] = useState({});

  return <BrowserRouter>
    <Routes>
      <Route path='/' element={<Layout show={show} setShow={setShow} user={user} setUser={setUser} error={error} setError={setError}/>}>
        <Route index element={<Office show={show} setShow={setShow} user={user} setError={setError} setPageEdited={setPageEdited}/>} />
        <Route path='front' element={<Office show={show} setShow={setShow} user={user} setError={setError} setPageEdited={setPageEdited}/>} />
        <Route path='front/:pageShowed' element={<Office show={show} user={user} setShow={setShow} setError={setError} setPageEdited={setPageEdited}/>} />
        <Route path='back' element={<Office show={show} user={user} setShow={setShow} setError={setError} setPageEdited={setPageEdited}/>} />
        <Route path='back/:pageShowed' element={<Office show={show} user={user} setShow={setShow} setError={setError} setPageEdited={setPageEdited}/>} />
        <Route path='login' element={<Login setUser={setUser} setShow={setShow} setError={setError}/>} />
        <Route path='edit/:id' element={<Modification isAdmin={user.admin} show={show} setShow={setShow} setError={setError} pageEdited={pageEdited}/>} />
        <Route path='add' element={<Modification show={show} setShow={setShow} setError={setError} pageEdited={{}}/>} />
      </Route>
    </Routes>
  </BrowserRouter>
}

export default App
