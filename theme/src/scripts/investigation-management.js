import React from "react";
import ReactDOM from "react-dom";
import { HashRouter, Route, Link } from "react-router-dom";
import InvestigationDetails from "./investigation-details";
import InvestigationUsers from "./investigation-users";

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

const App = () => (
  <HashRouter>
    <div>
      <nav data-tabs className="bx--tabs" role="navigation">
          <ul className="bx--tabs__nav bx--tabs__nav--hidden" role="tablist">
            <CarbonMenuLink to="/details" label="Details"/>
            <CarbonMenuLink to="/users" label="Users"/>
          </ul>
      </nav>
      <div>
        <Route path="/details" component={InvestigationDetails} />
        <Route path="/users" component={InvestigationUsers} />
      </div>
    </div>
  </HashRouter>
);

const rootElement = document.getElementById("investigation-details");
ReactDOM.render(<App />, rootElement);
