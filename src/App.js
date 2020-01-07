import React, { useEffect, useState } from 'react';
import './App.css';
import 'leaflet/dist/leaflet.css';
import { Map, TileLayer, Polyline, CircleMarker } from 'react-leaflet';

const App = () => {
  const [pos, setpos] = useState([])
  const [prev, setprev] = useState([])
  const [drawlist, setdrawlist] = useState([])
  const mqtt = require('async-mqtt')
  const host  = 'wss://meri.digitraffic.fi:61619/mqtt'
  const options = {
    reconnectPeriod: 5000,
    username: 'digitraffic',
    password: 'digitrafficPassword'
  }
  const client = mqtt.connect(host, options)

  //no reason to choose async-mqtt other than I got it to work first...somehow
  async function getconnection(){
    try {
      client.on('connect', function () {
      console.log('client connected')
      client.subscribe('vessels/230628000/locations')
      .then(
        client.on('message', async function(topic, message){
          console.log("message topic " + topic)
          let mess = await JSON.parse(message)
          let latest = mess.geometry.coordinates
          let lo = latest[1]
          let la = latest[0]
          console.log("lon lat ", lo, " ", la)
          console.log("pos ", pos)
          //set current position
          setpos([lo, la])         
        })
      )        
      })
    } catch (err){
      console.log("acync error: " + err)
      client.end()
    }
  }

  //adds line coordinates from previous to current position for polyline
  function addlinetolist(){
    if(prev.length > 0){  
      setdrawlist([...drawlist, [prev, pos]])
      console.log("addtolist finished, drawlist len: ", drawlist.length)
    }
  }

  //route "tail"
  let multipolyline = () => {
    if(drawlist.length >1){
      return <Polyline color='brown' positions={[drawlist]} />
    }
  }

  //marks vessel's current location on map
  let posmark = () => {
    if(pos.length >0 ){
      return <CircleMarker center={pos} color="green" radius={5} />
    }
  }

  //sanity check
  let waiting = () => {
    if(pos.length === 0){
      return "Waiting for position data..."
    }
  }

  useEffect(() => {
    addlinetolist()
    getconnection()
    setprev(pos)
    console.log("prev ", prev) 
  }, [pos])

  return (
    <div style={{height: '50vh', width:'100%'}}>
      <Map center={ [60,25] } zoom={10}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <TileLayer url="https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png" />
          {posmark()}
          {multipolyline()}
      </Map>
      <div>{waiting()}</div>
    </div>
    
  );
}
export default App;