import { useEffect, useState } from "react";
import { Alert, Button, Container, Form, Navbar, Spinner } from "react-bootstrap";
import { getSiteTitle, logOut, setAPITitle } from "../API";
import { Outlet, useNavigate } from "react-router-dom";

function Layout(props) {
  const [title, setTitle] = useState("");
  const [editTitle, setEditTitle] = useState(false);
  const [loading, setLoading] = useState(true);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [editTitleLoading, setEditTitleLoading] = useState(false);

  const navigate = useNavigate();

  async function handleSiteModification() {
    try {
      setEditTitleLoading(true);
      await setAPITitle(title);
      const newTitle = await getSiteTitle();
      setEditTitleLoading(false);
      setTitle(newTitle);
      setEditTitle(false);
      props.setError("");
    } catch (error) {
      props.setError(error.message);
      setEditTitleLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    getSiteTitle().then((title) => {
      setLoading(false);
      setTitle(title);
    }).catch((error) => {
      props.setError(error.message);
      setLoading(false);
    })
  }, []);

  return <>
    <Navbar bg="light">
      <Container fluid>
        {!editTitle && !loading && <Navbar.Brand>{title}
        {props.user.admin && props.show === "back" && <> <Button size="sm" onClick={() => setEditTitle(true)}><i className="bi bi-pencil-fill"></i></Button></>}
        </Navbar.Brand>}
        {loading && <Spinner></Spinner>}
        {editTitle && <Navbar.Text><Form onSubmit={(event) => {event.preventDefault()}}>
          <Form.Control type="text" placeholder="Insert Site Title" value={title} maxLength={20} onChange={(event) => (setTitle(event.target.value))} />
        </Form><Button size="sm" onClick={handleSiteModification}>{editTitleLoading? <Spinner size="sm"></Spinner> : <i className="bi bi-check"></i>}</Button></Navbar.Text>}
        <Navbar.Text>
          {props.user.name && props.show === "front" && <>Front Office <Button variant="outline-primary" onClick={() => {
              props.setShow("back");
              navigate("/back");
            }}>Back Office</Button> </>}
          {props.user.name && props.show === "back" && <>Back Office <Button variant="outline-primary" onClick={() => {
              props.setShow("front");
              navigate("/front");
            }}>Front Office</Button> </>}
        </Navbar.Text>
        <Navbar.Text>
          {props.user.name && <>{props.user.name} </>}
          {props.show !== "login" && (props.user.name? <Button onClick={async () => {
              try {
                setButtonLoading(true);
                const result = await logOut();
                props.setUser({}); 
                props.setShow("front");
                setButtonLoading(false);
                if (props.show !== "front") {
                  navigate("/front");
                }
              } catch (error) {
                props.setError(error.message);
                setButtonLoading(false);
              }
            }}>{buttonLoading? <Spinner size="sm"></Spinner> : <>Logout</>}</Button> : <Button onClick={() => {
                props.setShow("login");
                navigate("/login");
              }}>Login</Button>)}
        </Navbar.Text>
      </Container>
    </Navbar>
    <Outlet />
    {props.error !== "" && <Alert variant="danger">{props.error}</Alert>}
  </>
}

export default Layout