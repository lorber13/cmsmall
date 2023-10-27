import dayjs from "dayjs";
import { useEffect, useState } from "react"
import { Button, Col, Container, Form, Image, Row, Spinner } from "react-bootstrap"
import { addPage, editPage, getAuthors } from "../API";
import { useNavigate } from "react-router-dom";

function Modification(props) {
  const [title, setTitle] = useState(props.pageEdited.title? props.pageEdited.title : "");
  const [date, setDate] = useState(props.pageEdited.publicationDate? props.pageEdited.publicationDate : "");
  const [published, setPublished] = useState(props.pageEdited.publicationDate? true : false);
  const [author, setAuthor] = useState(props.pageEdited.author); // if we are in add, should remain undefined forever
  const [authorsList, setAuthorsList] = useState([]);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [authorsLoading, setAuthorsLoading] = useState(false);

  const [contents, setContents] = useState(props.pageEdited.contents? props.pageEdited.contents : []);

  const navigate = useNavigate();

  useEffect(() => {
    async function fetchAuthors() {
      try {
        if (props.show === "edit" && props.isAdmin) {
          setAuthorsLoading(true);
          const authors = await getAuthors();
          setAuthorsList(authors);
          setAuthorsLoading(false);
          props.setError("");
        }
      } catch (error) {
        props.setError(error.message);
        setAuthorsLoading(false);
      }
    }
    fetchAuthors();
  }, [props.show, props.isAdmin]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setConfirmLoading(true);
      if (props.show === "add")
        await addPage(title, published? date : undefined, contents);
      else
        await editPage(props.pageEdited.id, title, published? date : undefined, props.isAdmin? author : undefined, contents);
      props.setShow("back");
      setConfirmLoading(false);
      navigate("/back");
      props.setError("");
    } catch (error) {
      props.setError(error.message)
      setConfirmLoading(false);
    }
  }

  function checkIfAddable() {
    let isAtLeastAnHeaderPresent = false;
    let isAtLeastAContentNotHeaderPresent = false;
    for (const content of contents) {
      if (content.type == 'image' || content.type == 'paragraph')
        isAtLeastAContentNotHeaderPresent = true;
      if (content.type == 'header')
        isAtLeastAnHeaderPresent = true;
    }
    if (isAtLeastAContentNotHeaderPresent === false || isAtLeastAnHeaderPresent === false) {
      return false;
    }
    else return true;
  }

  function addContent(type) {
    const newContents = [...contents];
    switch (type) {
      case "header":
        newContents.push({
          type: "header",
          value: "New Header"
        })
        break;
      case "paragraph":
        newContents.push({
          type: "paragraph",
          value: "New paragraph."
        })
        break;
      case "image":
        newContents.push({
          type: "image",
          value: "racket.jpg"
        })
        break;
      default:
        break;
    }
    setContents(newContents);
  }

  function moveContentDown(pos) {
    const newContents = [...contents];
    const removed = newContents.splice(pos, 1)[0];
    newContents.splice(pos + 1, 0, removed);
    setContents(newContents);
  }

  function moveContentUp(pos) {
    const newContents = [...contents];
    const removed = newContents.splice(pos, 1)[0];
    newContents.splice(pos - 1, 0, removed);
    setContents(newContents);
  }

  function checkIfRemovable(pos) {
    const newContents = [...contents];
    newContents.splice(pos, 1);
    let isAtLeastAnHeaderPresent = false;
    let isAtLeastAContentNotHeaderPresent = false;
    for (const content of newContents) {
      if (content.type == 'image' || content.type == 'paragraph')
        isAtLeastAContentNotHeaderPresent = true;
      if (content.type == 'header')
        isAtLeastAnHeaderPresent = true;
    }
    if (isAtLeastAContentNotHeaderPresent === false || isAtLeastAnHeaderPresent === false) {
      return false;
    }
    else return true;
  }

  function editContentValue(contentPosition, newValue) {
    const newContents = contents.map((content, index) => {
      if (index == contentPosition) {
        return {
          type: content.type,
          value: newValue
        };
      } else return content;
    })
    setContents(newContents);
  }

  function remove(pos) {
    const newContents = [...contents];
    newContents.splice(pos, 1);
    setContents(newContents);
  }

  return <Container fluid>
    <Form onSubmit={handleSubmit}>
      <Row>
        <Col>
          <Form.Label>Page Title</Form.Label>
          <Form.Control type="text" placeholder="Insert Page Title" value={title} maxLength={50} onChange={(event) => (setTitle(event.target.value))} />
        </Col>
        <Col>
          <Form.Label>Publication Date</Form.Label>
          {props.show === "add" && <Form.Control disabled={!published} type="date" value={date} required min={dayjs().format("YYYY-MM-DD")} onChange={(event) => (setDate(event.target.value))}/>}
          {props.show === "edit" && <Form.Control disabled={!published} type="date" value={date} required min={props.pageEdited.creationDate} onChange={(event) => (setDate(event.target.value))}/>}
          <Form.Check type="checkbox" checked={published} onChange={(event) => setPublished(event.target.checked)} label="Publish it?"></Form.Check>
        </Col>
        {props.show === "edit" && <><Col><Form.Label>Modify Author</Form.Label>
        {!authorsLoading && <Form.Select value={author} onChange={(event) => setAuthor(event.target.value)} disabled={!props.isAdmin}>
          {authorsList.map((author, index) => {
            return <option key={index} value={author.name}>{author.name}</option>;
          })}
        </Form.Select>}
        {authorsLoading && <Spinner></Spinner>}
        </Col></>}
      </Row>
      {contents.map((content, pos) => {
        return <Row key={pos}>
          <Col>
            <EditableContent content={content} pos={pos} contentsNumber={contents.length} moveContentUp={moveContentUp} moveContentDown={moveContentDown} checkIfRemovable={checkIfRemovable} remove={remove} editContentValue={editContentValue}></EditableContent>
          </Col>
        </Row>
      })}
      <InsertContent addContent={addContent}/>
      <Row>
        <Col>
          {props.show === "edit" && <Button type="submit">{confirmLoading? <Spinner size="sm"></Spinner> : <>Edit Page</>}</Button>}
          {props.show === "add" && <Button disabled={!checkIfAddable()} type="submit">{confirmLoading? <Spinner size="sm"></Spinner> : <>Add Page</>}</Button>}
          {" "}
          <Button variant="primary" onClick={() => {
              props.setShow("back");
              navigate("/back");
            }}>Cancel Modifications</Button>
        </Col>
      </Row>
    </Form>
  </Container>
}

function EditableContent(props) {
  const imagePath = `http://localhost:3000/static/images/${props.content.value}`;
  return <>
    <Form.Label>{props.content.type}</Form.Label>{" "}
    {props.pos !== 0 && <><Button size="sm" onClick={() => props.moveContentUp(props.pos)}><i className="bi bi-arrow-up"></i></Button> </>}
    {props.pos !== props.contentsNumber - 1 && <><Button size="sm" onClick={() => props.moveContentDown(props.pos)}><i className="bi bi-arrow-down"></i></Button> </>}
    {props.checkIfRemovable(props.pos) && <Button size="sm" variant="outline-danger" onClick={() => props.remove(props.pos)} ><i className="bi bi-dash-circle-fill"></i></Button>}
    {props.content.type === "header" && <Form.Control type="text" value={props.content.value} onChange={(event) => (props.editContentValue(props.pos, event.target.value))} />}
    {props.content.type === "paragraph" && <Form.Control as="textarea" rows={3} value={props.content.value} onChange={(event) => (props.editContentValue(props.pos, event.target.value))} />}
    {props.content.type === "image" && <> 
      <Form.Select value={props.content.value} onChange={(event) => (props.editContentValue(props.pos, event.target.value))}>
        <option value="racket.jpg">Racket</option>
        <option value="ball.jpg">Ball</option>
        <option value="shot.jpg">Shot</option>
        <option value="play.jpg">Play</option>
      </Form.Select>
      <Image fluid src={imagePath} />
    </>}
  </>
}

function InsertContent(props) {
  const [type, setType] = useState("header");

  return <>
    <Row>
      <Form.Label>Insert new Content</Form.Label>
      <Col>
        <Form.Select value={type} onChange={(event) => setType(event.target.value)}>
          <option value="header">Header</option>
          <option value="image">Image</option>
          <option value="paragraph">Paragraph</option>
        </Form.Select>
      </Col>
      <Col>
        <Button onClick={() => props.addContent(type)}><i className="bi bi-plus-circle-fill"></i></Button>
      </Col>
    </Row>
  </>
}

export default Modification