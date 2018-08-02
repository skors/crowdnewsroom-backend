import React, { Component } from "react";
import PropTypes from "prop-types";
import {
  StructuredListWrapper,
  StructuredListHead,
  StructuredListRow,
  StructuredListCell,
  StructuredListBody,
  TextArea,
  Button,
  Form,
  FormLabel,
  FormGroup,
  TextInput, SkeletonText
} from "carbon-components-react";
import StructuredListSkeleton from "carbon-components-react/lib/components/StructuredList/StructuredList.Skeleton";
import { authorizedFetch, authorizedPOST } from "./api";

import { JsonEditor } from "jsoneditor-react";
import "jsoneditor-react/es/editor.min.css";

import Notifications from "./notifications";

function Template({ template, selectCallback }) {
  return (
    <StructuredListRow onClick={() => selectCallback(template.id)}>
      <StructuredListCell>{template.name}</StructuredListCell>
      <StructuredListCell>{template.description}</StructuredListCell>
    </StructuredListRow>
  );
}

class PickTemplate extends Component {
  constructor(props) {
    super(props);
    this.state = {
      templates: []
    };
  }

  componentDidMount() {
    authorizedFetch(`/forms/templates`).then(templates => {
      this.setState({ templates });
    });
  }

  render() {
    if (!this.state.templates.length) {
      return <StructuredListSkeleton />;
    }
    return (
      <div>
        <p> You can pick a template for this investigation from below: </p>

        <StructuredListWrapper selection>
          <StructuredListHead>
            <StructuredListRow head>
              <StructuredListCell head>Name</StructuredListCell>
              <StructuredListCell head>Description</StructuredListCell>
            </StructuredListRow>
          </StructuredListHead>
          <StructuredListBody>
            {this.state.templates.map(template => (
              <Template
                key={template.id}
                template={template}
                selectCallback={this.props.callback}
              />
            ))}
          </StructuredListBody>
        </StructuredListWrapper>
      </div>
    );
  }
}

class FormInstance extends Component {
  constructor(props) {
    super(props);
    this.state = { ...props.formInstance };
  }

  render() {
    return (
      <div>
        <h2> Your Interviewer </h2>
        <p>
        {gettext("You can check below how your form is looking and behaving now.")}
        </p>

        <iframe src={this.props.frontendURL} width="100%" height="600" />

        <p>
        {gettext("If you would like to tweak it, you can either contact CORRECTIV to make changes for you or you can enable expert mode.")}
        </p>

        <div style={{display: "flex", justifyContent: "space-around", margin: "3em auto"}}>
        <a href="mailto:crowdnewsroom@correctiv.org?subject=Customization%20for%20Crowdnewsroom%20interviewer" className="bx--btn bx--btn--primary">
          {gettext("Contact CORRECTIV for customization")}
        </a>

        <Button onClick={this.props.toggleExpertMode} kind="secondary">
          {gettext("Enable Expert mode")}
         </Button>
        </div>
      </div>
    );
  }
}

FormInstance.propTyes = {
  formInstance: PropTypes.object.isRequired,
  frontendURL: PropTypes.string.isRequired
};

function JSONField({ fieldName, label, onChange, value }) {
  function fakeEvent(newValue) {
    onChange({ target: { id: fieldName, value: newValue }});
  }
  return (
    <React.Fragment>
      <FormLabel htmlFor={fieldName}>{label}</FormLabel>
      <JsonEditor id={fieldName}
                  value={value}
                  onChange={fakeEvent}
                  onError={console.error}
                  allowedModes={["tree", "code", "text"]} />
    </React.Fragment>
  );
}

JSONField.propTypes = {
  fieldName: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.oneOf([PropTypes.array, PropTypes.object])
};


class FormInstanceEditor extends Component {
  constructor(props) {
    super(props);
    this.state = { ...props.formInstance };
    this.handleChange = this.handleChange.bind(this);
    this.save = this.save.bind(this);
  }

  handleChange(event) {
    this.setState({ [event.target.id]: event.target.value});
  }

  save() {
    authorizedPOST(`/forms/forms/${this.state.form}/form_instances`, {
      body: JSON.stringify(this.state)
    }).then(() => {
      Notifications.success("Successfully updated form");
      this.props.toggleExpertMode();
    });
  }

  render() {
    return (
      <div>
        <Form onSubmit={this.save}>
          <FormGroup legendText={gettext("Interviewer steps and settings")}>
            <JSONField
              fieldName="form_json"
              value={this.state.form_json}
              label={gettext("Form JSON")}
              onChange={this.handleChange}
            />

            <JSONField
              fieldName="ui_schema_json"
              value={this.state.ui_schema_json}
              label={gettext("UI-Schema")}
              onChange={this.handleChange}
            />

            <JSONField
              fieldName="priority_fields"
              value={this.state.priority_fields}
              label={gettext("Fields to be shown on top for editors")}
              onChange={this.handleChange}
            />
          </FormGroup>

          <FormGroup legendText={gettext("Email confirmation messages")}>
            <TextArea
              id="email_template"
              labelText={gettext("Email Template")}
              onChange={this.handleChange}
              value={this.state.email_template}
            />

            <TextArea
              id="email_template_html"
              labelText={gettext("HTML Email Template")}
              onChange={this.handleChange}
              value={this.state.email_template_html}
            />
          </FormGroup>

          <FormGroup legendText={gettext("URL to redirect after submission")}>
            <TextInput
              id="redirect_url_template"
              labelText={gettext("Redirect URL Template")}
              value={this.state.redirect_url_template}
              onChange={this.handleChange}
            />
          </FormGroup>

          <Button type="submit">{gettext("Save")}</Button>
        </Form>
      </div>
    );
  }
}

export default class FormInstanceDetails extends Component {
  constructor(props) {
    super(props);
    this.state = {
      formInstance: null,
      form: null,
      editMode: false,
      loading: true,
    };

    this.selectTemplate = this.selectTemplate.bind(this);
    this.loadForm = this.loadForm.bind(this);
    this.toggleEdit = this.toggleEdit.bind(this);
  }

  get urlParams() {
    const pattern = /investigations\/([\w-]+)\/interviewers\/?([\w-]+)?/;
    const [match, investigationSlug, formSlug] = window.location.pathname.match(
      pattern
    );
    return { investigationSlug, formSlug };
  }

  async selectTemplate(templateId) {
    const template = await authorizedFetch(`/forms/templates/${templateId}`);
    authorizedPOST(`/forms/forms/${this.state.form.id}/form_instances`, {
      body: JSON.stringify(template)
    })
      .then(this.loadForm)
      .catch(console.error);
  }

  async componentDidMount() {
    return this.loadForm();
  }

  async loadForm() {
    const form = await authorizedFetch(
      `/forms/forms/${this.urlParams.formSlug}`
    );

    this.setState({ form });

    const response = await authorizedFetch(
      `/forms/forms/${form.id}/form_instances?limit=1`
    );
    if (response.results.length) {
      this.setState({ formInstance: response.results[0], loading: false });
      // load most recent instance
    } else {
      this.setState({ formInstance: null, loading: false });
    }
  }

  toggleEdit() {
    this.setState(state => ({editMode: !state.editMode }));
  }

  render() {
    if (this.state.loading) {
      return <div>
        <SkeletonText paragraph />
        <br/>
        <SkeletonText width="250px" lineCount={8} paragraph />
      </div>
    }

    if (this.state.formInstance && this.state.editMode){
      return <FormInstanceEditor
        toggleExpertMode={this.toggleEdit}
        formInstance={this.state.formInstance}
        frontendURL={this.state.form.frontend_url}
      />
    }

    if (this.state.formInstance){
      return <FormInstance
        toggleExpertMode={this.toggleEdit}
        formInstance={this.state.formInstance}
        frontendURL={this.state.form.frontend_url}
      />
    }

    return <PickTemplate callback={this.selectTemplate} />
  }
}
