import React, {Component} from "react";
import ReactDOM from "react-dom";
import {Form, FormGroup, TextInput, TextArea, FileUploader, Button} from "carbon-components-react";
import _ from "lodash";
import {authorizedFetch, authorizedPATCH, authorizedPOST} from "./api";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      name: "",
      slug: "",
    };

    this.updateName = this.updateName.bind(this);
    this.updateSlug = this.updateSlug.bind(this);
    this.updateField = this.updateField.bind(this);
    this.sendToServer = this.sendToServer.bind(this);
  }

  componentDidMount() {
    const urlParts = window.location.pathname.split("/");
    const slug = urlParts[urlParts.length - 1];
    if (slug !== "" ){
      authorizedFetch(`/forms/investigations/${slug}`).then(investigation => {
        this.setState(investigation);
      })
    }
  }

  get isEdit(){
    return this.state.id;
  }

  get slugInValid() {
    return this.state.slug && !this.state.slug.match(/^[a-z-]+$/)
  }

  updateName(event) {
    const newState = { name: event.target.value}

    if (!this.isEdit){
      newState.slug = _.kebabCase(event.target.value)
    }

    this.setState(newState);
  }

  updateSlug(event) {
    this.setState( { slug: event.target.value },
      this.validateSlug
    );
  }

  updateField(event) {
    this.setState({
      [event.target.id]: event.target.value
    })
  }

  sendToServer() {
    if (this.isEdit) {
      authorizedPATCH(`/forms/investigations/${this.state.slug}`, {
        body: JSON.stringify(this.state)
      });
    } else {
      authorizedPOST(`/forms/investigations`, {
        body: JSON.stringify(this.state)
      }).then(investigation => {
        window.location.pathname += `${investigation.slug}/users`
      });
    }

  }

  render() {
    return (
      <Form>
        <FormGroup legendText="Name of your Investigation">
          <TextInput
            id="name"
            labelText="Name"
            value={this.state.name}
            onChange={this.updateName}
          />
          <TextInput
            id="slug"
            labelText="URL of the form"
            disabled={this.isEdit}
            onChange={this.updateSlug}
            value={this.state.slug}
            invalidText="The slug can only contain lowercase letters and hyphens (-)"
            invalid={this.slugInValid}
          />

          <FormGroup legendText="Description">
            <TextArea
              id="short_description"
              labelText="Short Description"
              onChange={this.updateField}
              value={this.state.short_description}
            />
            <TextInput
              id="data_privacy_url"
              labelText="Data Privacy URL"
              onChange={this.updateField}
              value={this.state.data_privacy_url}
            />
          </FormGroup>

        </FormGroup>
        <Button onClick={this.sendToServer}>Submit</Button>
      </Form>
    );
  }
}

const rootElement = document.getElementById("investigation-details");
ReactDOM.render(<App />, rootElement);
