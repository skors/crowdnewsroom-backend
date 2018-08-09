import React from "react";
import {Link, Route} from "react-router-dom";

export function CarbonMenuLink({ label, to, activeOnlyWhenExact, disabled }) {
  return <Route
    path={to}
    exact={activeOnlyWhenExact}
    children={({match}) => (
      <div className={match ? "bx--tabs__nav-item bx--tabs__nav-item--selected": "bx--tabs__nav-item" }>
        {disabled?
          <span className="bx--tabs__nav-link--disabled">{label}</span>:
          <Link to={to} className="bx--tabs__nav-link" role="tab">{label}</Link>
        }
      </div>
    )}
  />}


