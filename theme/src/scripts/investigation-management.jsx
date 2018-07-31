import React from "react";
import ReactDOM from "react-dom";
import { HashRouter, Route } from "react-router-dom";
import InvestigationDetails from "./investigation-details";
import InvestigationUsers from "./investigation-users";
import InvestigationTags from "./investigation-tags";
import {Redirect, Switch} from "react-router";
import {CarbonMenuLink} from "./utils";

function getInvestigationSlug(){
  const urlParts = window.location.pathname.split("/");
  return urlParts[urlParts.length - 1];
}

function hasSlug(){
  return !!getInvestigationSlug();
}

const App = () => (
  <HashRouter>
    <div>
      <nav data-tabs className="bx--tabs investigation-management__tabs" role="navigation">
          <ul className="bx--tabs__nav bx--tabs__nav--hidden" role="tablist">
            <CarbonMenuLink to="/details" label={gettext("Details")}/>
            {hasSlug() &&  <CarbonMenuLink to="/users" label={gettext("Users")}/> }
            {hasSlug() &&  <CarbonMenuLink to="/tags" label={gettext("Tags")}/> }
          </ul>
      </nav>
      <div>
        <Switch>
          <Route path="/details" component={InvestigationDetails} />
          <Route path="/users" component={InvestigationUsers} />
          <Route path="/tags" component={InvestigationTags} />
          <Route exact path="/">
            <Redirect to="/details" />
          </Route>
        </Switch>
      </div>
    </div>
  </HashRouter>
);

const rootElement = document.getElementById("investigation-details");
ReactDOM.render(<App />, rootElement);
