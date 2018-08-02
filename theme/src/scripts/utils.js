import React from "react";
import {Link, Route} from "react-router-dom";

export function CarbonMenuLink({ label, to, activeOnlyWhenExact }) {
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

