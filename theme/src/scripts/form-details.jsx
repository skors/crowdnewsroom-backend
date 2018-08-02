import React, {Component} from "react";
import {Form, FormGroup, TextInput, Button} from "carbon-components-react";
import _ from "lodash";
import {authorizedFetch, authorizedPATCH, authorizedPOST} from "./api";
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

  get urlParams(){
    const pattern = /investigations\/([\w-]+)\/interviewers\/?([\w-]+)?/;
    const [match, investigationSlug, formSlug] = window.location.pathname.match(pattern);
    return {investigationSlug, formSlug}
  }

  componentDidMount() {
    const slug = this.urlParams.formSlug;
    if (slug){
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
    Notifications.error(gettext("Something went wrong. Please check the form fields for details."));
    exception.response.json().then(errors => {
      this.setState({errors});
    });
  }

  handleSuccess(form){
    Notifications.success(gettext("Successfully updated form."));
    this.setState({errors: {}})
  }

  createNewForm(){
    authorizedPOST(`/forms/investigations/${this.urlParams.investigationSlug}/forms`, {
      body: JSON.stringify(this.state.form)
    }).then(form => {
      const newPathname = `${window.location.pathname}/${form.slug}`;
      const newHash = "#/form_instance";
      window.location.assign(`${location.origin}${newPathname}${newHash}`);
    }).catch(this.handleErrors);
  }

  updateForm(){
    authorizedPATCH(`/forms/forms/${this.state.form.id}`, {
      body: JSON.stringify(this.state.form)
    }).then(this.handleSuccess)
    .catch(this.handleErrors);
  }

  sendToServer() {
    if (this.isEdit) {
      this.updateForm();
    } else {
      this.createNewForm();
    }
  }

  render (){
    const name_error = _.get(this.state.errors, ["name", "0"]);
    let slug_error = _.get(this.state.errors, ["slug", "0"]);
    if (this.slugInValid) {
      slug_error = gettext("The slug can only contain lowercase letters and hyphens (-)");
    }
    return (
      <Form>
        <FormGroup legendText={gettext("New Interviewer")}>
          <TextInput
            id="title"
            labelText={gettext("Interviewer title")}
            value={this.state.form.name}
            onChange={this.updateName}
            invalidText={name_error}
            invalid={name_error}
          />
          <TextInput
            id="slug"
            labelText={gettext("URL of the form")}
            disabled={this.isEdit}
            onChange={this.updateSlug}
            value={this.state.form.slug}
            invalidText={slug_error}
            invalid={slug_error}
          />
        </FormGroup>
        <Button onClick={this.sendToServer}>{gettext("Choose and continue")}</Button>
      </Form>
    )
  }
};
