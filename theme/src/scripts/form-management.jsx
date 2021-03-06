import React from 'react'
import ReactDOM from 'react-dom'
import { HashRouter, Redirect, Route } from 'react-router-dom'
import { Switch } from 'react-router'

import { CarbonMenuLink } from './utils'
import FormDetails from './form-details'
import FormInstanceSettings from './forminstance-settings'
import FormInstanceDetails from './forminstance-details'

function getUrlParams() {
  const pattern = /investigations\/([\w-]+)\/interviewers\/?([\w-]+)?/
  const [match, investigationSlug, formSlug] = window.location.pathname.match(
    pattern
  )
  return { investigationSlug, formSlug }
}

function hasSlug() {
  return !!getUrlParams().formSlug
}

const App = () => (
  <HashRouter>
    <div>
      <nav
        data-tabs
        className="bx--tabs investigation-management__tabs"
        role="navigation"
      >
        <ul className="bx--tabs__nav bx--tabs__nav--hidden" role="tablist">
          <CarbonMenuLink to="/form" label={gettext('Basics')} />
          <CarbonMenuLink
            to="/form_instance"
            disabled={!hasSlug()}
            label={gettext('Interviewer')}
          />
          <CarbonMenuLink
            to="/form_settings"
            disabled={!hasSlug()}
            label={gettext('Settings')}
          />
        </ul>
      </nav>
      <div>
        <Switch>
          <Route path="/form" component={FormDetails} />
          <Route path="/form_instance" component={FormInstanceDetails} />
          <Route path="/form_settings" component={FormInstanceSettings} />
          <Route exact path="/">
            <Redirect to="/form" />
          </Route>
        </Switch>
      </div>
    </div>
  </HashRouter>
)

const rootElement = document.getElementById('form-management')
ReactDOM.render(<App />, rootElement)
