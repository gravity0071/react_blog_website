import { BarChart } from "./components/BarChart"
const Home = () => {
  return (
    <div>
      <BarChart title={'satisfaction'} data={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']} count={[120, 200, 150, 80, 70, 110, 130]} />
    </div >
  )
}

export default Home
