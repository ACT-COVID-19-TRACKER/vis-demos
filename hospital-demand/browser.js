const vegaEmbed = require("vega-embed");

var vegaLiteSpec = {
  $schema: "https://vega.github.io/schema/vega-lite/v4.json",
  data: {
    url: "../data/cars.json"
  },
  encoding: {
    x: {
      field: "Year",
      type: "temporal",
      timeUnit: "year"
    }
  },
  layer: [
    {
      mark: { type: "errorband", extent: "ci" },
      encoding: {
        y: {
          field: "Miles_per_Gallon",
          type: "quantitative",
          title: "Mean of Miles per Gallon (95% CIs)"
        }
      }
    },
    {
      mark: "line",
      encoding: {
        y: {
          aggregate: "mean",
          field: "Miles_per_Gallon",
          type: "quantitative"
        }
      }
    }
  ]
};

vegaEmbed("#vis", vegaLiteSpec);
