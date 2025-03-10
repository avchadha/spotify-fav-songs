import React, { useState, useEffect } from "react";
import "./App.css";
import spotifyLogo from "./spotify-logo.png";
import lampoonLogo from "./lampoon-logo.png";

// Use environment variables (Set these in a `.env` file or directly in your hosting service)
const CLIENT_ID = process.env.REACT_APP_SPOTIFY_CLIENT_ID || "d5b8cebcc9614e36bc32839cb2711676";
const REDIRECT_URI = process.env.REACT_APP_SPOTIFY_REDIRECT_URI || "https://spotifyspoof.vercel.app"; // Ensure this matches the registered Spotify Redirect URI
const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
const RESPONSE_TYPE = "token";
const SCOPES = "playlist-modify-public playlist-modify-private user-read-private user-read-email"; //NEW SHIT


function App() {
  const [token, setToken] = useState("");
  const [topTracks, setTopTracks] = useState([]);
  const [genreMessage, setGenreMessage] = useState("");
  const [username, setUsername] = useState(""); // NEW STUFF REMOVE IF BREAK

  // Handle token retrieval, validation, and expiration
  useEffect(() => {
    const hash = window.location.hash;
    let storedToken = window.localStorage.getItem("spotify_token");
    let tokenExpiration = window.localStorage.getItem("spotify_token_expiry");

    if (!storedToken && hash) {
      const params = new URLSearchParams(hash.substring(1));
      storedToken = params.get("access_token");
      const expiresIn = parseInt(params.get("expires_in"), 10) || 3600; // Default to 1 hour

      if (storedToken) {
        const expiryTime = Date.now() + expiresIn * 1000; // Convert to milliseconds
        window.localStorage.setItem("spotify_token", storedToken);
        window.localStorage.setItem("spotify_token_expiry", expiryTime);
        window.location.hash = "";

        fetchSpotifyUserProfile(storedToken); // NEW STUFF REMOVE IF BREAK
      }
    }

    if (storedToken && tokenExpiration && Date.now() > tokenExpiration) {
      logout();
    } else {
      setToken(storedToken);
      fetchSpotifyUserProfile(storedToken); //NEW STUFF REMOVE IF BREAK
    }
  }, []);

  const logout = () => {
    setToken("");
    window.localStorage.removeItem("spotify_token");
    window.localStorage.removeItem("spotify_token_expiry");
  };

  const fetchSpotifyUserProfile = async (token) => { 
    try {
      const response = await fetch("https://api.spotify.com/v1/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      if (!response.ok) throw new Error("Failed to fetch user profile");
  
      const data = await response.json();
      setUsername(data.display_name);
      window.localStorage.setItem("spotify_username", data.display_name);
    } catch (error) {
      console.error("Error fetching Spotify profile:", error);
    }
  };
  
  const createChocolateRainPlaylist = async () => {
    if (!token) {
      console.error("No token available, please log in first.");
      return;
    }
  
    try {
      // Step 1: Get the user's Spotify ID
      const userResponse = await fetch("https://api.spotify.com/v1/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      if (!userResponse.ok) throw new Error("Failed to fetch user profile");
  
      const userData = await userResponse.json();
      const userId = userData.id;
  
      // Step 2: Create a new playlist
      const playlistResponse = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Gabriela Navarro x Sam Suchin Super Duper Special Playlist",
          description: "Courtesy of j A c k  V.  s C h w a b from the Harvard Lampoon",
          public: false,
        }),
      });
  
      if (!playlistResponse.ok) {
        const errorData = await playlistResponse.json();
        console.error("Spotify API Error (Playlist Creation):", errorData);
        throw new Error(`Failed to create playlist: ${errorData.error.message}`);
      }
  
      const playlistData = await playlistResponse.json();
      const playlistId = playlistData.id;
  
      console.log("Playlist created:", playlistData.name);
  
      // Step 3: Find the song "Chocolate Rain" (South Park)
      const trackUri = await searchChocolateRain();
  
      if (!trackUri) {
        console.error("Could not find Chocolate Rain (South Park) on Spotify.");
        return;
      }
  
      // Step 4: Add 100 copies of the song to the new playlist
      const trackUris = new Array(100).fill(trackUri);
  
      const addTrackResponse = await fetch(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ uris: trackUris }),
        }
      );
  
      if (!addTrackResponse.ok) throw new Error("Failed to add song to playlist");
  
      console.log("100 copies of Chocolate Rain added to playlist!");
      alert("✅ Gabriela Navarro x Sam Suchin Super Duper Special Playlist created.");
    } catch (error) {
      console.error("Error creating playlist:", error);
      alert("❌ Failed to create playlist. Try again!");
    }
  };
  
  const searchChocolateRain = async () => {
    try {
      const searchResponse = await fetch(
        `https://api.spotify.com/v1/search?q=Circus%20Music&type=track&limit=1`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
  
      if (!searchResponse.ok) throw new Error("Failed to search for song");
  
      const searchData = await searchResponse.json();
  
      if (searchData.tracks.items.length === 0) {
        console.error("No results found for Chocolate Rain (South Park)");
        return null;
      }
  
      const trackUri = searchData.tracks.items[0].uri;
      console.log("Found song:", searchData.tracks.items[0].name);
      return trackUri;
    } catch (error) {
      console.error("Error searching for song:", error);
      return null;
    }
  };
  

  const getTopTracks = async () => {
    if (!token) return;

    try {
      const response = await fetch("https://api.spotify.com/v1/me/top/tracks?limit=10", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout(); // Log out if token is expired
        } else {
          throw new Error(`Spotify API Error: ${response.statusText}`);
        }
      }

      const data = await response.json();
      const tracks = data.items || [];

      if (tracks.length === 0) {
        setGenreMessage("You have no favorite songs. Are you okay?");
        return;
      }

      const artistIds = [...new Set(tracks.flatMap(track => track.artists.map(artist => artist.id)))];

      if (artistIds.length === 0) {
        setGenreMessage("We couldn't find any artists for your songs. Are they even real?");
        return;
      }

      // Fetch artist genres
      const artistResponse = await fetch(`https://api.spotify.com/v1/artists?ids=${artistIds.join(",")}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!artistResponse.ok) {
        throw new Error(`Spotify API Error: ${artistResponse.statusText}`);
      }

      const artistData = await artistResponse.json();
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

      // Genre-based messages
      const genreMessages = {
        rock: "You're pathetic and your ex-wife hates you. So do your kids. Comp Lampoon.",
        indie: "You're not special or different, just weird. Also, no one likes you. Comp Lampoon.",
        pop: "You're basic. Like this message. No, not like that. Comp Lampoon.",
        "hip hop": "You're probably from the suburbs yet still owe someone money. Get a job, brokie. Comp Lampoon.",
        jazz: "You drink expensive coffee and pretend to understand things. Silly rabbit, class warfare is for politicians. Comp Lampoon.",
        metal: "You're angry, but at least you express it healthily. If healthily is screaming, crying, and punching holes in drywall. Comp Lampoon.",
        country: "You're either sad or love trucks. Maybe both. Whatever, at least you can sleep with your truck. Comp Lampoon.",
        classical: "You're smarter than everyone, and you know it. You're so smart you know you're pretentious and don't actually like this music. It's ok, no one else does either. Comp Lampoon.",
        electronic: "You enjoy festivals and probably own LED lights. And drugs. And drugs. And drugs. Everyone can tell you're high right now.",
      };

      const message = genreMessages[topGenre] || "You have an eclectic taste. No one understands you. Dude, I think this guy is ODing. Anyone got a Narcan? Comp Lampoon.";

      setTopTracks(tracks);
      setGenreMessage(message);

    } catch (error) {
      console.error("Error fetching top tracks:", error);
      setGenreMessage("Something went wrong. Did you break Spotify?");
    }
  };

  return (
    <div className="App">
      {/* Spotify Logo Over Left Panel */}
      <img src={spotifyLogo} alt="Spotify Logo" className="spotify-logo" />

      {/* Background Panels (1/4 screen width each) */}
      <div className="background-container">
        <div className="background-panel left-panel"></div>
        <div className="background-panel right-panel"></div>
      </div>

      
      <h1>Spotify Taste Analyzer</h1>

      {!token ? (
        <a
          className="spotify-button"
          href={`${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${SCOPES}&response_type=${RESPONSE_TYPE}`}
        >
          Log in to Spotify
        </a>
      ) : (
        <>
          
          <button onClick={getTopTracks}>Get Favorite Songs</button>
          <button className="playlist-button" onClick={createChocolateRainPlaylist}>Create Special Playlist 🌧️🎵</button>
          <button onClick={logout}>Logout</button>

          <ul>
            {topTracks.map((track) => (
              <li key={track.id}>{track.name} by {track.artists.map(artist => artist.name).join(", ")}</li>
            ))}
          </ul>

          <h2 className="roast-message">{genreMessage}</h2>

        </>
      )}

      <img src={lampoonLogo} alt="Harvard Lampoon Logo" className="lampoon-logo" />
    </div>
  );
}

export default App;
