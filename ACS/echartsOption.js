export default class Option {
  colors = ['#c23531', '#2f4554', '#61a0a8', '#d48265', '#91c7ae', '#749f83', '#ca8622', '#bda29a', '#6e7074', '#546570', '#c4ccd3']
  constructor(data) {
    this.legend = data.legend
    this.xAxis = data.xAxis[0]
    this.seriesData = []
    this.option = {}

    for (let i in data.seriesData) {
      const series = {
        name: data.legend[i],
        type: 'line',
        itemStyle: {
          color: this.getRandomColor(this.colors)
        },
        data: data.seriesData[i],
        markPoint: {
          data: this.makeMarkPoint(data.seriesData[i], data.abnormal[i], data.legend[i])
        }
      }
      this.seriesData.push(series)
    }

    this.option = {
      legend: {
        data: this.legend,
        top: 30
      },
      tooltip: {
        formatter: '{b}:<br>{c}'
      },
      // X轴
      xAxis: {
        data: this.xAxis
      },
      // Y轴
      yAxis: {},
      series: this.seriesData
    }
  }
  getRandomColor(colors) {
    const random = Math.floor(Math.random() * colors.length)
    return colors.splice(random, 1)[0]
  }

  makeMarkPoint(data, abnormal, name) {
    const result = []
    data.forEach((v, i) => {
      if (abnormal[i]) {
        const tempObj = {
          value: v,
          xAxis: i,
          yAxis: v,
          itemStyle: {
            color: '#F49919'
          }
        }
        result.push(tempObj)
      }
    })
    return result
  }

  getOption() {
    return this.option
  }
}