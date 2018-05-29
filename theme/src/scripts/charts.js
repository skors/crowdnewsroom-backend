"use strict";

if (module.hot) {
  module.hot.accept();
}

import Chart from "chart.js";
import moment from "moment";

const timeFormat = "MM/DD/YYYY HH:mm";

const makeChart = (labels, values) => {
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
        },
        tooltips: {
            callbacks: {
                label: (tooltipItem, data) => {
                    const count = tooltipItem.yLabel;
                    const unit = count === 1 ? "Contribution": "Contributions";
                    return `${count} ${unit}`;
                },
                title: (tooltipItem, data) => {
                    if (tooltipItem.length) {
                        return moment(tooltipItem[0].xLabel).format("ddd DD.MM.YYYY");
                    }
                    return "?"
                }
            }
        }
      }
    };

    var ctx = document.getElementById("canvas").getContext("2d");
    new Chart(ctx, config);
}

export { makeChart };
