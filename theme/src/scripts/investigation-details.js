import React, {Component} from "react";
import {Form, FormGroup, TextInput, TextArea, FileUploader, Button} from "carbon-components-react";
import _ from "lodash";
import {authorizedFetch, authorizedPATCH, authorizedPOST} from "./api";
import Notifications from "./notifications";

export default class InvestigationDetails extends Component {
  constructor(props) {
    super(props);
    this.state = {
      investigation: {name: "", slug:""},
      errors: {}
    };

    this.updateName = this.updateName.bind(this);
    this.updateSlug = this.updateSlug.bind(this);
    this.updateField = this.updateField.bind(this);
    this.sendToServer = this.sendToServer.bind(this);
    this.updateLogo = this.updateLogo.bind(this);
    this.handleErrors = this.handleErrors.bind(this);
    this.handleSuccess = this.handleSuccess.bind(this);
  }

  componentDidMount() {
    const urlParts = window.location.pathname.split("/");
    const slug = urlParts[urlParts.length - 1];
    if (slug !== "" ){
      authorizedFetch(`/forms/investigations/${slug}`).then(investigation => {
        this.setState({investigation});
      })
    }
  }

  get isEdit(){
    return this.state.investigation.id;
  }

  get slugInValid() {
    return this.state.investigation.slug && !this.state.investigation.slug.match(/^[a-z-]+$/)
  }

  updateName(event) {
    const newProps = { name: event.target.value};

    if (!this.isEdit){
      newProps.slug = _.kebabCase(event.target.value)
    }

    this.setState(state => ({
      investigation: {...state.investigation, ...newProps}
    }));
  }

  updateSlug(event) {
    const slug = event.target.value;
    this.setState(state => (
      {investigation: {...state.investigation, slug}}
    ), this.validateSlug);
  }

  updateField(event) {
    const newProps = { [event.target.id]: event.target.value};
    this.setState(state => ({
      investigation: {...state.investigation, ...newProps}
    }))
  }

  updateLogo(event) {
    function getBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
      });
    }
    getBase64(event.target.files[0]).then(base64File => {
      this.setState(state => ({
        investigation: {...state.investigation, logo: base64File}
      }));
    });
  }

  handleErrors(exception) {
    Notifications.error("Something went wrong. Please check the form fields for details.");
    exception.response.json().then(errors => {
      this.setState({errors});
    });
  }

  handleSuccess(investigaiton){
    Notifications.success("Successfully updated investigation.");
    this.setState({errors: {}})
  }

  sendToServer() {
    if (this.isEdit) {
      // this is not pretty but we want to make sure that we only
      // send the `logo` property if the user added/changed the
      // logo (compared to them not touching an existing one)
      // we also do not want to send it if it is `null`
      const investigation = Object.assign({}, this.state.investigation);
      if ((investigation.logo && investigation.logo.startsWith("http")) || investigation.logo === null) {
        delete investigation.logo;
      }

      authorizedPATCH(`/forms/investigations/${this.state.investigation.slug}`, {
        body: JSON.stringify(investigation)
      }).then(this.handleSuccess)
        .catch(this.handleErrors);
    } else {
      authorizedPOST(`/forms/investigations`, {
        body: JSON.stringify(this.state.investigation)
      }).then(investigation => {
        window.location.pathname += `${investigation.slug}/users`
      }).catch(this.handleErrors);
    }

  }

  render() {
    const data_privacy_url_error = _.get(this.state.errors, ["data_privacy_url", "0"]);
    const name_error = _.get(this.state.errors, ["name", "0"]);
    let slug_error = _.get(this.state.errors, ["slug", "0"]);
    if (this.slugInValid) {
      slug_error = "The slug can only contain lowercase letters and hyphens (-)";
    }

    return (
      <Form>
        <FormGroup legendText="Name of your Investigation">
          <TextInput
            id="name"
            labelText="Name"
            value={this.state.investigation.name}
            onChange={this.updateName}
            invalidText={name_error}
            invalid={name_error}
          />
          <TextInput
            id="slug"
            labelText="URL of the form"
            disabled={this.isEdit}
            onChange={this.updateSlug}
            value={this.state.investigation.slug}
            invalidText={slug_error}
            invalid={slug_error}
          />

          <FormGroup legendText="Description">
            <TextArea
              id="short_description"
              labelText="Short Description"
              onChange={this.updateField}
              value={this.state.investigation.short_description}
            />
            <TextInput
              id="data_privacy_url"
              labelText="Data Privacy URL"
              invalidText={data_privacy_url_error}
              invalid={data_privacy_url_error}
              onChange={this.updateField}
              value={this.state.investigation.data_privacy_url}
            />
          </FormGroup>

          <FormGroup legendText="Visual Design">
            <div className="bx--file__container">
              <img className="investigation-details__filepreview" src={this.state.investigation.logo} />
              <FileUploader
                labelTitle="Upload"
                buttonLabel="Add file"
                filenameStatus="edit"
                accept={[".jpg", ".png", ".gif"]}
                name="file"
                onChange={this.updateLogo}
              />
            </div>
          </FormGroup>

        </FormGroup>
        <Button onClick={this.sendToServer}>Submit</Button>
      </Form>
    );
  }
}

