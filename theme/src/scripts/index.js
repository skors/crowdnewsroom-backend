"use strict";

if (module.hot) {
  module.hot.accept();
}

import "babel-polyfill";

import "./closest-polyfill.js";

import { Tooltip, OverflowMenu } from "carbon-components";
Tooltip.init(document.body);
OverflowMenu.init(document.body, { objMenuOffsetFlip: { top: 15, left: 0 } });
