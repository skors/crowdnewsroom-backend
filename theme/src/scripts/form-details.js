import React, {Component} from "react";
import {Form, FormGroup, TextInput, Button} from "carbon-components-react";
import _ from "lodash";
import {authorizedFetch, authorizedPOST} from "./api";
import Notifications from "./notifications";

export default class FormDetails extends Component {
  constructor(props) {
    super(props);
    this.state = {
      form: {name: "", slug: ""},
      errors: {}
    };

    this.updateName = this.updateName.bind(this);
    this.updateSlug = this.updateSlug.bind(this);
    this.sendToServer = this.sendToServer.bind(this);
    this.handleErrors = this.handleErrors.bind(this);
    this.handleSuccess = this.handleSuccess.bind(this);
  }

  get slugInValid() {
    return this.state.form.slug && !this.state.form.slug.match(/^[a-z-]+$/)
  }

  get investigationSlug(){
    const pattern = /investigations\/([\w-]+)\//;
    const [match, investigationSlug] = window.location.pathname.match(pattern);
    return investigationSlug;
  }

  componentDidMount() {
    const urlParts = window.location.pathname.split("/");
    const slug = urlParts[urlParts.length - 2];
    if (slug !== "" ){
      authorizedFetch(`/forms/forms/${slug}`).then(form => {
        this.setState({form});
      })
    }
  }

  get isEdit(){
    return this.state.form.id;
  }

  updateName(event) {
    const newProps = { name: event.target.value};

    if (!this.isEdit){
      newProps.slug = _.kebabCase(event.target.value)
    }

    this.setState(state => ({
      form: {...state.form, ...newProps}
    }));
  }

  updateSlug(event) {
    const slug = event.target.value;
    this.setState(state => (
      {form: {...state.form, slug}}
    ), this.validateSlug);
  }

  handleErrors(exception) {
    Notifications.error("Something went wrong. Please check the form fields for details.");
    exception.response.json().then(errors => {
      this.setState({errors});
    });
  }

  handleSuccess(form){
    Notifications.success("Successfully updated form.");
    this.setState({errors: {}})
  }

  sendToServer() {
    authorizedPOST(`/forms/investigations/${this.investigationSlug}/forms`, {
      body: JSON.stringify(this.state.form)
    }).then(form => {
      const newPathname = `${window.location.pathname}/${form.slug}`;
      window.location.assign(`${location.origin}${newPathname}`)
    }).catch(this.handleErrors);
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
            value={this.state.form.name}
            onChange={this.updateName}
            invalidText={name_error}
            invalid={name_error}
          />
          <TextInput
            id="slug"
            labelText="URL of the form"
            disabled={this.isEdit}
            onChange={this.updateSlug}
            value={this.state.form.slug}
            invalidText={slug_error}
            invalid={slug_error}
          />
        </FormGroup>
        <Button onClick={this.sendToServer}>Choose and continue</Button>
      </Form>
    )
  }
};
