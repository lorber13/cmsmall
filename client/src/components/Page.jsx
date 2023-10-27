import { Image, Row } from "react-bootstrap";

function Page(props) {

  const contentsView = props.contents.map((content) => {
    let view = {};
    switch (content.type) {
      case 'header':
        view = <h4>{content.value}</h4>;
        break;
      case 'paragraph':
        view = <p>{content.value}</p>;
        break;
      case 'image':
        const imagePath = `http://localhost:3000/static/images/${content.value}`;
        view = <Image fluid src={imagePath} />;
        break;
      default:
        break;
    }
    return <Row key={content.position}>
      {view}
    </Row>
  })

  return <>
    {contentsView}
  </>
}

export default Page