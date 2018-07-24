import React from "react";
import ReactDOM from "react-dom";
import { HashRouter, Route, Link } from "react-router-dom";
import InvestigationDetails from "./investigation-details";
import InvestigationUsers from "./investigation-users";
import {Redirect, Switch} from "react-router";

const CarbonMenuLink = ({ label, to, activeOnlyWhenExact }) => {
  return <Route
    path={to}
    exact={activeOnlyWhenExact}
    children={({match}) => (
      <div className={match ? "bx--tabs__nav-item bx--tabs__nav-item--selected": "bx--tabs__nav-item" }>
        <Link to={to} className="bx--tabs__nav-link" role="tab">{label}</Link>
      </div>
    )}
  />
};

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
            <CarbonMenuLink to="/details" label="Details"/>
            {hasSlug() &&  <CarbonMenuLink to="/users" label="Users"/> }
          </ul>
      </nav>
      <div>
        <Switch>
          <Route path="/details" component={InvestigationDetails} />
          <Route path="/users" component={InvestigationUsers} />
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
