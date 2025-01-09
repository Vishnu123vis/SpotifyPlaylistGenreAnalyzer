import React, {useState, useEffect} from 'react';
import axios from 'axios';
import {Bar} from 'react-chartjs-2';
import { Chart as ChartJS } from 'chart.js/auto'
import { Chart }            from 'react-chartjs-2'

function App () {
  const [playlist, setPlaylist] = useState(null);
  const [token, setToken] = useState(null);
  const [message, setMessage] = useState(null);
  const [chartData, setChartData] = useState({});

  const client_id = `${process.env.REACT_APP_CLIENT_ID}`;
  const client_secret = `${process.env.REACT_APP_CLIENT_SECRET}`;
  console.log(client_id);
  console.log(client_secret);

  let total;
  const track_hrefs_array = [];
  const artist_hrefs_array = [];
  const genres_array = [];
  const genre_count = {};
  

  useEffect(() => {

    axios('https://accounts.spotify.com/api/token', {
      headers: {
        'Content-Type' : 'application/x-www-form-urlencoded',
        'Authorization' : 'Basic ' + btoa(client_id + ':' + client_secret)      
      },
      data: 'grant_type=client_credentials',
      method: 'POST'
    })
    .then(tokenResponse => {      
      setToken(tokenResponse.data.access_token);
    });
  }, [client_id, client_secret]);


  const buttonToClick = (e) => {
    e.preventDefault();
    setMessage("Retreiving playlist info...");

    const playlist_id = playlist;
    const fieldsInput = 'tracks.items(track(href))%2Ctracks.total';
    const api_url = `https://api.spotify.com/v1/playlists/${playlist_id}?market=ES&fields=${fieldsInput}`;

    axios(api_url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      }
    }).then(response_2 => {
      setMessage("Retreiving artist info...");
      total = response_2.data.tracks.total;
      for (let i = 0; i < total; i++) {
          track_hrefs_array[i] = response_2.data.tracks.items[i].track.href;
      };

      const promisesForArtistQueries = track_hrefs_array.map(link => {
        return axios(link, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
          }
        });
      });

      Promise.all(promisesForArtistQueries).then(response_3 => {
        setMessage("Retreiving genre info...");
        for (let j = 0; j < total; j++) {
          artist_hrefs_array[j] = response_3[j].data.artists[0].href;
        };

        const promisesForGenreQueries = artist_hrefs_array.map(link => {
          return axios(link, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Authorization': 'Bearer ' + token,
              'Content-Type': 'application/json'
            }
          });
        });

        Promise.all(promisesForGenreQueries).then(response_4 => {
          setMessage("All done!");
          for (let k = 0; k < total; k++) {
            genres_array[k] = response_4[k].data.genres[0]
          }
          //console.log(genres_array);
          for (const element of genres_array) {
            if (genre_count[element]) {
              genre_count[element] += 1;
            } else {
              genre_count[element] = 1;
            }
          };
          console.log(genre_count);
          setChartData(genre_count);
        });
      });
    });
  };

  return (
    <div className="App">
      <h1>Spotify Playlist DNA</h1>
      Insert the id of a public Spotify playlist: <input type="text" value={playlist} onChange={event => setPlaylist(event.target.value)} /> <br />
      <button className="buttonToClickThing" onClick={buttonToClick}>Get DNA</button>
      {message && <p className="message">{message}</p>}
      <div>
      <Bar
          data={{
            labels: Object.keys(chartData),
            datasets: [
              {
                label: '# tracks',
                backgroundColor: 'rgba(75,192,192,1)',
                borderColor: 'rgba(0,0,0,1)',
                borderWidth: 2,
                data: Object.values(chartData)
              }
            ]
          }}
          options={{
            title:{
              display:true,
              text:'Averaged Rainfall per month',
              fontSize:20
            },
            legend:{
              display:true,
              position:'right'
            }
          }}
        />
      </div>
    </div>
  );
}

export default App;
