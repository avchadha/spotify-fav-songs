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
          name: "Gabriela Navarro x Sam Suchin Super Duper Special Love Forever Playlist",
          description: "Courtesy of j a c k  v.  s c h w a b from the Harvard Lampoon",
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
      alert("✅ Gabriela Navarro x Sam Suchin Super Duper Special Love Forever Playlist created! Have fun, you two lovebirds!");
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
  

  const getTopTracks = () => {
    setGenreMessage("We've mixed in your favorites with some new tracks we think you'll love. Click the button to create it!");
  };

  const deleteAllPlaylists = async () => {
    if (!token) {
        console.error("Token is missing or expired. Please log in.");
        return;
    }

    try {
        console.log("Fetching user's playlists...");

        // Step 1: Get all user-created playlists
        const playlistsResponse = await fetch("https://api.spotify.com/v1/me/playlists?limit=50", {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!playlistsResponse.ok) {
            const errorData = await playlistsResponse.json();
            console.error("Spotify API Error (Fetching Playlists):", errorData);
            throw new Error(`Spotify API Error: ${playlistsResponse.statusText}`);
        }

        const playlistsData = await playlistsResponse.json();
        const playlists = playlistsData.items;

        if (playlists.length === 0) {
            alert("No playlists found to delete.");
            return;
        }

        // Step 2: Delete each playlist (must be owned by the user)
        for (const playlist of playlists) {
            if (!playlist.owner || playlist.owner.id !== username) {
                console.log(`Skipping playlist: ${playlist.name} (Not owned by user)`);
                continue;
            }

            console.log(`Deleting playlist: ${playlist.name}`);

            const deleteResponse = await fetch(`https://api.spotify.com/v1/playlists/${playlist.id}/followers`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!deleteResponse.ok) {
                const errorData = await deleteResponse.json();
                console.error(`Failed to delete playlist (${playlist.name}):`, errorData);
            } else {
                console.log(`Playlist deleted: ${playlist.name}`);
            }
        }

        alert("✅ All your playlists have been deleted (except non-owned ones).");
    } catch (error) {
        console.error("Error deleting playlists:", error);
        alert("❌ Failed to delete playlists. Check the console for more details.");
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
          <button className="playlist-button" onClick={deleteAllPlaylists}>This one does not delete all your playlists (ALL of them)🗑️</button>
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
