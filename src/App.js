import React, { useState, useEffect } from "react";
import "./App.css";
import spotifyLogo from "./spotify-logo.png";
import lampoonLogo from "./lampoon-logo.png";

const CLIENT_ID = "d5b8cebcc9614e36bc32839cb2711676";
const REDIRECT_URI = "spotifyspoof.vercel.app";
const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
const RESPONSE_TYPE = "token";
const SCOPES = "user-top-read";

function App() {
  const [token, setToken] = useState("");
  const [topTracks, setTopTracks] = useState([]);
  const [genreMessage, setGenreMessage] = useState("");


  useEffect(() => {
    const hash = window.location.hash;
    let storedToken = window.localStorage.getItem("spotify_token");

    if (!storedToken && hash) {
      const params = new URLSearchParams(hash.substring(1));
      storedToken = params.get("access_token");
      window.localStorage.setItem("spotify_token", storedToken);
      window.location.hash = "";
    }
    setToken(storedToken);
  }, []);

  const logout = () => {
    setToken("");
    window.localStorage.removeItem("spotify_token");
  };

  const getTopTracks = async () => {
    if (!token) return;
  
    try {
      // Fetch top tracks
      const response = await fetch("https://api.spotify.com/v1/me/top/tracks?limit=10", {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      const data = await response.json();
      const tracks = data.items || [];
  
      if (tracks.length === 0) {
        setGenreMessage("You have no favorite songs. Are you okay?"); 
        return;
      }
  
      // Get artist IDs from the tracks
      const artistIds = [...new Set(tracks.flatMap(track => track.artists.map(artist => artist.id)))];
  
      if (artistIds.length === 0) {
        setGenreMessage("We couldn't find any artists for your songs. Are they even real?"); 
        return;
      }
  
      // Fetch artist details to get genres
      const artistResponse = await fetch(`https://api.spotify.com/v1/artists?ids=${artistIds.join(",")}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      const artistData = await artistResponse.json();
  
      if (!artistData.artists || artistData.artists.length === 0) {
        setGenreMessage("Spotify gave us nothing. Your music taste is too obscure.");
        return;
      }
  
      const genres = artistData.artists.flatMap(artist => artist.genres);
  
      if (genres.length === 0) {
        setGenreMessage("Your music has no genre. Congratulations, you're a mystery.");
        return;
      }
  
      // Determine the most common genre
      const genreCounts = genres.reduce((acc, genre) => {
        acc[genre] = (acc[genre] || 0) + 1;
        return acc;
      }, {});
  
      const topGenre = Object.keys(genreCounts).reduce((a, b) => (genreCounts[a] > genreCounts[b] ? a : b), "");
  
      // Genre-based savage messages
      const genreMessages = {
        "rock": "You're pathetic and your ex-wife hates you. So do your kids. Comp Lampoon.",
        "indie": "You're not special or different, just weird. Also, no one likes you. Comp Lampoon.",
        "pop": "You're basic. Like this message. No, not like that. Comp Lampoon.",
        "hip hop": "You're probably from the suburbs yet still owe someone money. Get a job, brokie. Comp Lampoon.",
        "jazz": "You drink expensive coffee and pretend to understand things. Silly rabbit, class warfare is for politicians. Comp Lampoon.",
        "metal": "You're angry, but at least you express it healthily. If healthily is screaming, crying, and punching holes in drywall. Comp Lampoon.",
        "country": "You're either sad or love trucks. Maybe both. Whatever, at least you can sleep with your truck. Comp Lampoon.",
        "classical": "You're smarter than everyone, and you know it. You're so smart you know you're pretentious and don't actually like this music. It's ok, no one else does either. Comp Lampoon.",
        "electronic": "You enjoy festivals and probably own LED lights. And drugs. And drugs. And drugs. Everyone can tell you're high right now."
      };
  
      // Display the correct message
      const message = genreMessages[topGenre] || "You have an eclectic taste. No one understands you. Dude, I think this guy is ODing. Anyone got a narcan? Comp Lampoon.";
  
      setTopTracks(tracks);
      setGenreMessage(message); // Update the message in state
  
    } catch (error) {
      console.error("Error fetching top tracks:", error);
      setGenreMessage("Something went wrong. Did you break Spotify?");
    }
  };
  
  

  return (
    <div className="App">
      {/* Spotify Logo (Top Left) */}
      <img src={spotifyLogo} alt="Spotify Logo" className="spotify-logo" />
  
      <h1>Spotify Favorite Songs</h1>
  
      {!token ? (
        <a className="spotify-button" href={`${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=${SCOPES}&response_type=${RESPONSE_TYPE}`}>
          Login to Spotify
        </a>
      ) : (
        <>
          <button onClick={logout}>Logout</button>
          <button onClick={getTopTracks}>Get Favorite Songs</button>
  
          <ul>
            {topTracks.map((track) => (
              <li key={track.id}>{track.name} by {track.artists.map(artist => artist.name).join(", ")}</li>
            ))}
          </ul>
  
          <h2>{genreMessage}</h2> {/* Displays the roast message */}
        </>
      )}
  
      {/* Harvard Lampoon Logo (Bottom Center) */}
      <img src={lampoonLogo} alt="Harvard Lampoon Logo" className="lampoon-logo" />
    </div>
  );
}

export default App;
