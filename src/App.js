import logo from './logo.svg';
import './App.css';
import Home from './components/Index';
// index.js or App.js
import '@fortawesome/fontawesome-free/css/all.min.css';


function App() {
  return (
    <div className="App">
      {/* Render the DAXPage component */}
      <Home />
    </div>
  );
}

export default App;
