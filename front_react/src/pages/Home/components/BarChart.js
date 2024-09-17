import { useRef, useEffect } from 'react'
import * as echarts from 'echarts'

const BarChart = ({ title, data, count }) => {
  const chartRef = useRef(null)
  useEffect(() => {
    // 1. Create the chart instance
    const myChart = echarts.init(chartRef.current)
    // 2. Prepare the chart options
    const option = {
      title: {
        text: title
      },
      xAxis: {
        type: 'category',
        data: data
      },
      yAxis: {
        type: 'value'
      },
      series: [
        {
          data: count,
          type: 'bar'
        }
      ]
    }
    // 3. Render the chart
    myChart.setOption(option)
  }, [])

  return <div ref={chartRef} style={{ width: '400px', height: '300px' }}></div>
}

export { BarChart }