import React, {Component} from "react";
import ReactDOM from "react-dom";
import {Form, FormGroup, TextInput, Button} from "carbon-components-react";
import _ from "lodash";
import Notifications from "./notifications";

class NewInterviewer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      interviewer: {name: "", slug: ""},
      errors: {}
    };

    this.updateName = this.updateName.bind(this);
    this.updateSlug = this.updateSlug.bind(this);
  }

  get slugInValid() {
    return this.state.interviewer.slug && !this.state.interviewer.slug.match(/^[a-z-]+$/)
  }

  get isEdit(){
    return this.state.interviewer.id;
  }

  updateName(event) {
    const newProps = { name: event.target.value};

    if (!this.isEdit){
      newProps.slug = _.kebabCase(event.target.value)
    }

    this.setState(state => ({
      interviewer: {...state.interviewer, ...newProps}
    }));
  }

  updateSlug(event) {
    const slug = event.target.value;
    this.setState(state => (
      {interviewer: {...state.interviewer, slug}}
    ), this.validateSlug);
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
      const interviewer = Object.assign({}, this.state.interviewer);

//      authorizedPATCH(`/forms/investigations/${this.state.investigation.slug}`, {
//        body: JSON.stringify(investigation)
//      }).then(this.handleSuccess)
//        .catch(this.handleErrors);
//    } else {
//      authorizedPOST(`/forms/investigations`, {
//        body: JSON.stringify(this.state.investigation)
//      }).then(investigation => {
//        const newPathname = `${window.location.pathname}${investigation.slug}`;
//        const newHash = "#/users";
//        window.location.assign(`${location.origin}${newPathname}${newHash}`)
//      }).catch(this.handleErrors);
    }
  }

  render (){
    const name_error = _.get(this.state.errors, ["name", "0"]);
    let slug_error = _.get(this.state.errors, ["slug", "0"]);
    if (this.slugInValid) {
      slug_error = "The slug can only contain lowercase letters and hyphens (-)";
    }
    return (
      <Form>
        <FormGroup legendText="New Interviewer">
          <TextInput
            id="title"
            labelText="Interviewer title"
            value={this.state.interviewer.name}
            onChange={this.updateName}
            invalidText={name_error}
            invalid={name_error}
          />
          <TextInput
            id="slug"
            labelText="URL of the form"
            disabled={this.isEdit}
            onChange={this.updateSlug}
            value={this.state.interviewer.slug}
            invalidText={slug_error}
            invalid={slug_error}
          />
        </FormGroup>
        <Button onClick={this.sendToServer}>Choose and continue</Button>
      </Form>
    )
  }
};

const rootElement = document.getElementById("interviewer-new");
ReactDOM.render(<NewInterviewer />, rootElement);
