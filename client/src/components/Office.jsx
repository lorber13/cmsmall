import { Button, Col, Container, Row, Spinner, Table } from "react-bootstrap"
import { deletePage, getPages, getPublishedPages } from "../API";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import Page from "./Page";
import { useNavigate } from "react-router-dom";

function Office(props) {
  const [pages, setPages] = useState([]);
  const [pageShowed, setPageShowed] = useState(-1);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  async function handleDelete(id) {
    try {
      setLoading(true);
      await deletePage(id);
      const newPages = await getPages();
      setLoading(false);
      setPages(newPages);
      setPageShowed(-1);
      props.setError("");
      navigate("/back");
    } catch (error) {
      props.setError(error.message);
      setLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    if (props.show === "front") {
      getPublishedPages().then((pages) => {
        setPages(pages);
        setPageShowed(-1);
        setLoading(false);
        props.setError("");
      }).catch((error) => {
        props.setError(error.message);
        setLoading(false);
      });
    } else if (props.show === "back") {
      getPages().then((pages) => {
        setPages(pages);
        setPageShowed(-1);
        setLoading(false);
        props.setError("");
      }).catch((error) => {
        props.setError(error.message);
        setLoading(false);
      })
    }
  }, [props.show])

  return <Container fluid>
    <Row>
      <Col>
        {!loading && <Table>
          <thead>
            <tr>
              <th>Title</th>
              {props.show === "back" && <th>Creation date</th>}
              <th>Publication date</th>
              <th>Author</th>
              {props.show === "front" && <th></th>}{/* view */}
              {props.show === "back" && <>
                <th>Status</th>
                <th></th>{/* view */}
                <th></th>{/* edit */}
                <th></th>{/* delete */}
              </>}
            </tr>
          </thead>
          <tbody>
            {pages.map((page, index) => {
              return <PageRow key={index} page={page} back={props.show === "back"} index={index} active={pageShowed === index} setPageShowed={setPageShowed} editable={page.author === props.user.name || props.user.admin} setShow={props.setShow} deletePage={handleDelete} setPageEdited={props.setPageEdited}></PageRow>
            })}
          </tbody>
        </Table>}
        {loading && <Spinner></Spinner>}
        {props.show === "back" && <Button onClick={() => {
            props.setShow("add");
            navigate("/add");
          }}><i className="bi bi-file-earmark-plus"></i></Button>}
      </Col>
      <Col>
        {pages.length != 0 && pageShowed >= 0 && <Page contents={pages[pageShowed].contents}></Page>}
      </Col>
    </Row>
  </Container>    
}

function PageRow(props) {
  const navigate = useNavigate();
  return <tr className={props.active? "table-active" : ""}>
    <td>{props.page.title}</td>
    {props.back && <td>{props.page.creationDate}</td>}
    <td>{props.page.publicationDate}</td>{/* can be undefined */}
    <td>{props.page.author}</td>
    {props.back && <td>
        {!props.page.publicationDate && <>Draft</>}
        {props.page.publicationDate && (dayjs(props.page.publicationDate).isBefore(dayjs())? <>Published</> : <>Scheduled</>)}
      </td>}
    <td><Button size="sm" onClick={() => {
      props.setPageShowed(props.index);
      if (props.back) {
        navigate(`/back/${props.page.id}`)
      } else {
        navigate(`/front/${props.page.id}`)
      }
    }}><i className="bi bi-eye-fill"></i></Button></td>
    {props.back && (props.editable? <td><Button size="sm" variant="outline-warning" onClick={() => {
        props.setShow("edit"); 
        props.setPageEdited(props.page);
        navigate(`/edit/${props.page.id}`);
      }}><i className="bi bi-pencil-square"></i></Button></td> : <td></td>)}
    {props.back && (props.editable? <td><Button size="sm" variant="outline-danger" onClick={() => props.deletePage(props.page.id)}><i className="bi bi-trash-fill"></i></Button></td> : <td></td>)}
  </tr>
}

export default Office