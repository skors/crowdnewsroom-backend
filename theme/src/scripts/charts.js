"use strict";

if (module.hot) {
  module.hot.accept();
}

import Chart from "chart.js";

const timeFormat = "MM/DD/YYYY HH:mm";

window.makeChart = (labels, values) => {
    const color = Chart.helpers.color;
    const config = {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Contributions",
            backgroundColor: "rgb(74, 144, 226)",
            fill: false,
            data: values
          }
        ]
      },
      options: {
        legend: {display: false},
        scales: {
          xAxes: [ { type: "time", } ],
          yAxes: [
            {
              ticks: {
                beginAtZero: true
              }
            }
          ]
        }
      }
    };

    var ctx = document.getElementById("canvas").getContext("2d");
    new Chart(ctx, config);
}
