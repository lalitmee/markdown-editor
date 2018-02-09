import React from "react";
import Remarkable from "remarkable";
import { Container, Header, Grid } from "semantic-ui-react";

class MarkdownEditor extends React.Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.state = { value: "Type some *markdown* here!" };
  }

  handleChange(e) {
    this.setState({ value: e.target.value });
  }

  getRawMarkup() {
    const md = new Remarkable();
    return { __html: md.render(this.state.value) };
  }

  render() {
    return (
      <div className="MarkdownEditor ui container">
        <Grid divided="vertically">
          <Grid.Row columns={2}>
            <Grid.Column>
              <Container textAlign="left">
                <Header as="h2">Input</Header>
                <textarea
                  rows="35"
                  cols="80"
                  onChange={this.handleChange}
                  defaultValue={this.state.value}
                />
              </Container>
            </Grid.Column>
            <Grid.Column>
              <Container>
                <Header as="h2">Output</Header>
                <div
                  className="content"
                  dangerouslySetInnerHTML={this.getRawMarkup()}
                />
              </Container>
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </div>
    );
  }
}

export default MarkdownEditor;
