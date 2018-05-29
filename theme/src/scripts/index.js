'use strict'

if (module.hot) {
  module.hot.accept()
}

import 'babel-polyfill'

// style
import "../styles/main.sass";
import "expose-loader?charts!./charts.js"
import "./charts.js"
