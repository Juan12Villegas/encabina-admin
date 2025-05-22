import React, { useState, useEffect } from "react";
import axios from "axios";

export const MusicPlayer = () => {
    // State management
    const [searchQuery, setSearchQuery] = useState(""); // Search query
    const [searchResults, setSearchResults] = useState([]); // Search results
    const [currentTrack, setCurrentTrack] = useState(null); // Current track to play
    const [isPlaying, setIsPlaying] = useState(false); // Track is playing or not
    const [audio, setAudio] = useState(new Audio()); // Audio element

    // Function to search music using Free Music Archive API
    const searchMusic = async (query) => {
        if (query.trim() === "") {
            setSearchResults([]);
            return;
        }

        try {
            const response = await axios.get(
                `https://freemusicarchive.org/api/track_search?q=${encodeURIComponent(
                    query
                )}&limit=10`
            );
            setSearchResults(response.data.data);
        } catch (error) {
            console.error("Error searching music:", error);
            setSearchResults([]);
        }
    };

    // Handle play and pause functionality
    const togglePlayPause = () => {
        if (isPlaying) {
            audio.pause();
        } else {
            audio.play();
        }
        setIsPlaying(!isPlaying);
    };

    // Set the audio source and start playing when a track is selected
    const playTrack = (track) => {
        const newAudio = new Audio(track.track_url); // Set the track URL
        setAudio(newAudio);
        newAudio.play();
        setIsPlaying(true);
        setCurrentTrack(track);
    };

    // Handle search query change
    const handleSearchChange = (event) => {
        setSearchQuery(event.target.value);
    };

    // Effect to search music when the query changes
    useEffect(() => {
        const timeout = setTimeout(() => {
            searchMusic(searchQuery);
        }, 500); // Debounce the search to avoid too many requests

        return () => clearTimeout(timeout);
    }, [searchQuery]);

    return (
        <div className="music-player-container">
            <h2>Buscador y Reproductor de Música</h2>

            {/* Search Input */}
            <div className="search-bar">
                <input
                    type="text"
                    placeholder="Buscar música..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="search-input"
                />
            </div>

            {/* Search Results */}
            <div className="search-results">
                {searchResults.length > 0 ? (
                    <ul>
                        {searchResults.map((track) => (
                            <li
                                key={track.id}
                                onClick={() => playTrack(track)}
                                className="track-item"
                            >
                                <img
                                    src={track.artwork_url || "https://via.placeholder.com/50"}
                                    alt={track.title}
                                    className="track-thumbnail"
                                />
                                <div className="track-info">
                                    <h4>{track.title}</h4>
                                    <p>{track.artist}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No se encontraron resultados.</p>
                )}
            </div>

            {/* Player Controls */}
            {currentTrack && (
                <div className="player-controls">
                    <div className="current-track">
                        <img
                            src={currentTrack.artwork_url || "https://via.placeholder.com/50"}
                            alt={currentTrack.title}
                            className="current-track-thumbnail"
                        />
                        <div className="current-track-info">
                            <h3>{currentTrack.title}</h3>
                            <p>{currentTrack.artist}</p>
                        </div>
                    </div>

                    <div className="controls">
                        <button onClick={togglePlayPause} className="play-pause-btn">
                            {isPlaying ? "Pausa" : "Reproducir"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};