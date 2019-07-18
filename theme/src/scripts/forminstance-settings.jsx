import React, { Component } from 'react'
import {
  Form,
  FormGroup,
  TextInput,
  TextArea,
  Button,
  SkeletonText,
  Select,
  SelectItem,
  SelectItemGroup
} from 'carbon-components-react'
import _ from 'lodash'
import { authorizedFetch, authorizedPATCH, authorizedPOST } from './api'
import Notifications from './notifications'

class FormInstanceSettingsEditor extends Component {
  constructor(props) {
    super(props)
    this.state = { ...props.formInstance }
    this.handleChange = this.handleChange.bind(this)
    this.save = this.save.bind(this)
  }

  handleChange(event) {
    this.setState({ [event.target.id]: event.target.value })
  }

  save() {
    authorizedPOST(`/forms/forms/${this.state.form}/form_instances`, {
      body: JSON.stringify(this.state)
    }).then(() => {
      window.location.reload()
      Notifications.success('Successfully updated form')
    })
  }

  render() {
    return (
      <Form onSubmit={this.save}>
        <FormGroup legendText={gettext('Email confirmation messages')}>
          <TextArea
            id="email_template"
            labelText={gettext('Email Template')}
            onChange={this.handleChange}
            value={this.state.email_template}
          />

          <TextArea
            id="email_template_html"
            labelText={gettext('HTML Email Template')}
            onChange={this.handleChange}
            value={this.state.email_template_html}
          />
        </FormGroup>

        <FormGroup legendText={gettext('URL to redirect after submission')}>
          <TextInput
            id="redirect_url_template"
            labelText={gettext('Redirect URL Template')}
            value={this.state.redirect_url_template}
            onChange={this.handleChange}
          />
        </FormGroup>

        <FormGroup legendText={gettext('Internationalization')}>
          <Select
            id="language"
            labelText={gettext('Language')}
            value={this.state.language}
            onChange={this.handleChange}
          >
            {Object.keys(this.state.language_choices).map(k => {
              return <SelectItem value={ k } text={ this.state.language_choices[k] } />
            })}
          </Select>
        </FormGroup>

        <Button type="submit">{gettext('Save')}</Button>
      </Form>
    )
  }
}

export default class FormInstanceSettings extends Component {
  constructor(props) {
    super(props)
    this.state = {
      formInstance: null,
      form: null,
      loading: true
    }

    this.loadForm = this.loadForm.bind(this)
  }

  get urlParams() {
    const pattern = /investigations\/([\w-]+)\/interviewers\/?([\w-]+)?/
    const [match, investigationSlug, formSlug] = window.location.pathname.match(
      pattern
    )
    return { investigationSlug, formSlug }
  }

  async componentDidMount() {
    return this.loadForm()
  }

  async loadForm() {
    const form = await authorizedFetch(
      `/forms/forms/${this.urlParams.formSlug}`
    )

    this.setState({ form })

    const response = await authorizedFetch(
      `/forms/forms/${form.id}/form_instances?limit=1`
    )
    if (response.results.length) {
      this.setState({ formInstance: response.results[0], loading: false })
      // load most recent instance
    } else {
      this.setState({ formInstance: null, loading: false })
    }
  }

  render() {
    if (this.state.loading) {
      return (
        <div>
          <SkeletonText paragraph />
          <br />
          <SkeletonText width="250px" lineCount={8} paragraph />
        </div>
      )
    }

    if (this.state.formInstance) {
      return (
        <FormInstanceSettingsEditor formInstance={this.state.formInstance} />
      )
    }

    return (
      <div>
        <p>{gettext('Please create an interviewer first.')}</p>
      </div>
    )

  }
}
