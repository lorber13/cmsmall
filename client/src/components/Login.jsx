import { useState } from "react";
import { Button, Container, Form, Spinner } from "react-bootstrap";
import { logIn } from "../API";
import { useNavigate } from "react-router-dom";

function Login(props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    logIn(username, password).then((user) => {
      props.setUser(user);
      props.setShow("back");
      props.setError("");
      setLoading(false);
      navigate("/back");
    }).catch((error) => {
      props.setError(error.message);
      setLoading(false);
    })
  }

  return <Container fluid>
    <Form onSubmit={handleSubmit}>
      <Form.Label>Email address</Form.Label>
      <Form.Control type="email" placeholder="Enter email" value={username} onChange={(event) => (setUsername(event.target.value))} />
      <Form.Label>Password</Form.Label>
      <Form.Control type="password" placeholder="Password" value={password} onChange={(event) => (setPassword(event.target.value))}/>
      <Button type="submit">{loading? <Spinner size="sm"></Spinner> : <>Submit</>}</Button>{' '}
      <Button onClick={() => {
          props.setShow("front");
          navigate("/front");
        }}>Cancel</Button>
    </Form>
  </Container>
}

export default Login