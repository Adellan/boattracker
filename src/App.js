import React, { useEffect, useState, useRef } from 'react';
import './App.css';
import 'leaflet/dist/leaflet.css';
import { Map, TileLayer, Polyline, CircleMarker } from 'react-leaflet';

const App = () => {
  const [pos, setpos] = useState([])
  const [prev, setprev] = useState([])
  const [drawlist, setdrawlist] = useState([])
  //didn't quite get this ref stuff to work
  //const prev = usePrevious(pos)
  const mqtt = require('async-mqtt')
  const host  = 'wss://meri.digitraffic.fi:61619/mqtt'
  const options = {
    reconnectPeriod: 5000,
    username: 'digitraffic',
    password: 'digitrafficPassword'
  }
  const client = mqtt.connect(host, options)

  //no reason to choose async-mqtt other than I got it to work first...somehow
  async function getlocation(){
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
          console.log("lola ", lo, " ", la)
          setprev(pos)
          setpos([lo, la])

          //not sure if this is any better than inside useEffect()
          if(pos.length > 0 && prev.length > 0){
            addlinetolist(prev, pos)
            checklistlen()
            console.log("useeffect inside if, prev ", prev)
          }
        })
      )        
      })
    } catch (err){
      console.log("acync error: " + err)
      client.end()
    }
  }

  //causes errors in this program
  /*function usePrevious(value){
    const ref = useRef()
    useEffect(() => {
      ref.current = value
    })
    return ref.current
  }*/


  function checklistlen(){
    if(drawlist.length > 2000){
      drawlist.shift()
    }
    console.log("checklistlen function ", drawlist.length)
  }

  function addlinetolist(one, two){
    setdrawlist([...drawlist, [one, two]])
    console.log("linecoord at addtolist ", one, " ", two)
    console.log("addtolist finished, drawlist len: ", drawlist.length)
  }

  let multipolyline = () => {
    if(drawlist.length >1){
      return <Polyline color='brown' positions={[drawlist]} />
    }
  }

  let posmark = () => {
    if(pos.length >0 ){
      return <CircleMarker center={pos} color="green" radius={5} />
    }
  }

  let waiting = () => {
    if(pos.length === 0){
      return "Waiting for position data..."
    }
  }

  useEffect(() => {
    getlocation()
    //setprev(pos)
  })

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