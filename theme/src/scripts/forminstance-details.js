import React, { Component } from "react";
import PropTypes from "prop-types";
import {
  StructuredListWrapper,
  StructuredListHead,
  StructuredListRow,
  StructuredListCell,
  StructuredListBody
} from "carbon-components-react";
import StructuredListSkeleton from "carbon-components-react/lib/components/StructuredList/StructuredList.Skeleton";
import { authorizedFetch, authorizedPOST } from "./api";
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
    console.log(this.props.frontendURL);
    return (
      <div>
        <h2> Your Interviewer </h2>
        <figure>
          <figcaption>
            Here is a preview of your interviewer. If you want to edit it, you
            can switch to expert mode.
          </figcaption>
          <iframe src={this.props.frontendURL} width="100%" height="600" />
        </figure>
      </div>
    );
  }
}

FormInstance.propTyes = {
  formInstance: PropTypes.object.isRequired,
  frontendURL: PropTypes.string.isRequired
};

export default class FormInstanceDetails extends Component {
  constructor(props) {
    super(props);
    this.state = {
      formInstance: null,
      form: null
    };

    this.selectTemplate = this.selectTemplate.bind(this);
    this.loadForm = this.loadForm.bind(this);
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

  async loadForm(){
    const form = await authorizedFetch(
      `/forms/forms/${this.urlParams.formSlug}`
    );

    this.setState({ form });

    const response = await authorizedFetch(
      `/forms/forms/${form.id}/form_instances?limit=1`
    );
    if (response.results.length) {
      this.setState({ formInstance: response.results[0] });
      // load most recent instance
    } else {
      this.setState({ formInstance: null });
    }
  }

  render() {
    if (this.state.formInstance === {}) {
      return <div>Loading</div>;
    }

    return (
      <div>
        {this.state.formInstance ? (
          <FormInstance
            formInstance={this.state.formInstance}
            frontendURL={this.state.form.frontend_url}
          />
        ) : (
          <PickTemplate callback={this.selectTemplate} />
        )}
      </div>
    );
  }
}
