import React from "react";
import ReactDOM from "react-dom";
import {HashRouter, Redirect, Route} from "react-router-dom";
import {Switch} from "react-router";

import {CarbonMenuLink} from "./utils";
import FormDetails from "./form-details";
import FormInstanceDetails from "./forminstance-details";

function getUrlParams(){
  const pattern = /investigations\/([\w-]+)\/interviewers\/?([\w-]+)?/;
  const [match, investigationSlug, formSlug] = window.location.pathname.match(pattern);
  return {investigationSlug, formSlug}
}

function hasSlug(){
  return !!getUrlParams().formSlug;
}

const App = () => (
  <HashRouter>
    <div>
      <nav data-tabs className="bx--tabs investigation-management__tabs" role="navigation">
        <ul className="bx--tabs__nav bx--tabs__nav--hidden" role="tablist">
          <CarbonMenuLink to="/form" label="Basics"/>
          {hasSlug() ? <CarbonMenuLink to="/form_instance" label="Configure interviewer"/> : null}
        </ul>
      </nav>
      <div>
        <Switch>
          <Route path="/form" component={FormDetails} />
          <Route path="/form_instance" component={FormInstanceDetails} />
          <Route exact path="/">
            <Redirect to="/form" />
          </Route>
        </Switch>
      </div>
    </div>
  </HashRouter>
);

const rootElement = document.getElementById("form-management");
ReactDOM.render(<App />, rootElement);
