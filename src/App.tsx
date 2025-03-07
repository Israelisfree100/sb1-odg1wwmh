import React, { useState, useEffect, useRef } from 'react';
import { Music, Upload, Play, Pause, SkipForward, SkipBack, Plus, Trash2, Volume2, Wand2 } from 'lucide-react';
import { EssentiaWASM } from 'essentia.js';

interface Song {
  id: string;
  name: string;
  file: File;
  url: string;
  bpm?: number;
  key?: string;
  energy?: number;
  danceability?: number;
}

interface Playlist {
  id: string;
  name: string;
  songs: Song[];
}

function App() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSongIndex, setCurrentSongIndex] = useState<number>(-1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [volume, setVolume] = useState(1);
  const essentiaRef = useRef<any>(null);

  useEffect(() => {
    // Initialize Essentia.js
    const initEssentia = async () => {
      try {
        const essentia = await EssentiaWASM.init();
        essentiaRef.current = essentia;
      } catch (error) {
        console.error('Failed to initialize Essentia:', error);
      }
    };
    initEssentia();
  }, []);

  useEffect(() => {
    const savedPlaylists = localStorage.getItem('playlists');
    if (savedPlaylists) {
      try {
        const parsed = JSON.parse(savedPlaylists);
        setPlaylists(parsed);
        if (parsed.length > 0) {
          setCurrentPlaylist(parsed[0]);
        }
      } catch (e) {
        console.error('Error loading playlists:', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('playlists', JSON.stringify(playlists));
  }, [playlists]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error('Playback error:', e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  const analyzeSong = async (audioBuffer: AudioBuffer): Promise<Partial<Song>> => {
    const essentia = essentiaRef.current;
    if (!essentia) return {};

    try {
      const audioData = audioBuffer.getChannelData(0);
      const analysis = await essentia.BPMExtractor(audioData);
      const keyAnalysis = await essentia.KeyExtractor(audioData);
      const energyAnalysis = await essentia.Energy(audioData);
      const rhythmAnalysis = await essentia.RhythmExtractor2013(audioData);

      return {
        bpm: Math.round(analysis.bpm),
        key: keyAnalysis.key,
        energy: energyAnalysis.energy,
        danceability: rhythmAnalysis.danceability
      };
    } catch (error) {
      console.error('Error analyzing audio:', error);
      return {};
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !currentPlaylist) return;
    
    setIsAnalyzing(true);
    const newSongs: Song[] = [];

    for (const file of Array.from(e.target.files)) {
      const song: Song = {
        id: crypto.randomUUID(),
        name: file.name.replace(/\.[^/.]+$/, ""),
        file,
        url: URL.createObjectURL(file)
      };

      try {
        const arrayBuffer = await file.arrayBuffer();
        const audioContext = new AudioContext();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        const analysis = await analyzeSong(audioBuffer);
        Object.assign(song, analysis);
      } catch (error) {
        console.error('Error analyzing song:', error);
      }

      newSongs.push(song);
    }

    const updatedPlaylist = {
      ...currentPlaylist,
      songs: [...currentPlaylist.songs, ...newSongs]
    };

    setPlaylists(playlists.map(playlist => 
      playlist.id === currentPlaylist.id ? updatedPlaylist : playlist
    ));
    setCurrentPlaylist(updatedPlaylist);
    setIsAnalyzing(false);
  };

  const sortPlaylistByStyle = () => {
    if (!currentPlaylist) return;

    const sortedSongs = [...currentPlaylist.songs].sort((a, b) => {
      // Sort by energy level first
      if (a.energy && b.energy) {
        return b.energy - a.energy;
      }
      return 0;
    });

    const updatedPlaylist = {
      ...currentPlaylist,
      songs: sortedSongs
    };

    setPlaylists(playlists.map(playlist => 
      playlist.id === currentPlaylist.id ? updatedPlaylist : playlist
    ));
    setCurrentPlaylist(updatedPlaylist);
  };

  const sortPlaylistByBPM = () => {
    if (!currentPlaylist) return;

    const sortedSongs = [...currentPlaylist.songs].sort((a, b) => {
      if (a.bpm && b.bpm) {
        return a.bpm - b.bpm;
      }
      return 0;
    });

    const updatedPlaylist = {
      ...currentPlaylist,
      songs: sortedSongs
    };

    setPlaylists(playlists.map(playlist => 
      playlist.id === currentPlaylist.id ? updatedPlaylist : playlist
    ));
    setCurrentPlaylist(updatedPlaylist);
  };

  const createNewPlaylist = () => {
    const newPlaylist: Playlist = {
      id: crypto.randomUUID(),
      name: `Playlist ${playlists.length + 1}`,
      songs: []
    };
    setPlaylists([...playlists, newPlaylist]);
    setCurrentPlaylist(newPlaylist);
  };

  const deletePlaylist = (playlistId: string) => {
    setPlaylists(playlists.filter(p => p.id !== playlistId));
    if (currentPlaylist?.id === playlistId) {
      setCurrentPlaylist(null);
      setIsPlaying(false);
      setCurrentSongIndex(-1);
    }
  };

  const removeSong = (songId: string) => {
    if (!currentPlaylist) return;
    
    const songIndex = currentPlaylist.songs.findIndex(s => s.id === songId);
    if (songIndex === currentSongIndex) {
      setIsPlaying(false);
      setCurrentSongIndex(-1);
    }
    
    const updatedSongs = currentPlaylist.songs.filter(s => s.id !== songId);
    const updatedPlaylist = { ...currentPlaylist, songs: updatedSongs };
    
    setPlaylists(playlists.map(p => 
      p.id === currentPlaylist.id ? updatedPlaylist : p
    ));
    setCurrentPlaylist(updatedPlaylist);
  };

  const playSong = (index: number) => {
    setCurrentSongIndex(index);
    setIsPlaying(true);
  };

  const handleNext = () => {
    if (!currentPlaylist || currentSongIndex === -1) return;
    const nextIndex = (currentSongIndex + 1) % currentPlaylist.songs.length;
    setCurrentSongIndex(nextIndex);
    setIsPlaying(true);
  };

  const handlePrevious = () => {
    if (!currentPlaylist || currentSongIndex === -1) return;
    const prevIndex = (currentSongIndex - 1 + currentPlaylist.songs.length) % currentPlaylist.songs.length;
    setCurrentSongIndex(prevIndex);
    setIsPlaying(true);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 text-white">
      <div className="container mx-auto px-4 py-8 pb-32">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Music className="w-8 h-8" />
            <h1 className="text-3xl font-bold">AI Playlist Manager</h1>
          </div>
          <button
            onClick={createNewPlaylist}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Playlist
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-3 bg-white/10 rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4">Your Playlists</h2>
            <div className="space-y-2">
              {playlists.map(playlist => (
                <div
                  key={playlist.id}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                    currentPlaylist?.id === playlist.id
                      ? 'bg-purple-600'
                      : 'hover:bg-white/10'
                  }`}
                  onClick={() => setCurrentPlaylist(playlist)}
                >
                  <span className="truncate">{playlist.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deletePlaylist(playlist.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-9 bg-white/10 rounded-lg p-6">
            {currentPlaylist ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">{currentPlaylist.name}</h2>
                    <div className="flex gap-2">
                      <button
                        onClick={sortPlaylistByBPM}
                        className="text-sm bg-indigo-600 hover:bg-indigo-700 px-3 py-1 rounded transition-colors flex items-center gap-1"
                      >
                        <Wand2 className="w-4 h-4" />
                        Sort by BPM
                      </button>
                      <button
                        onClick={sortPlaylistByStyle}
                        className="text-sm bg-indigo-600 hover:bg-indigo-700 px-3 py-1 rounded transition-colors flex items-center gap-1"
                      >
                        <Wand2 className="w-4 h-4" />
                        Sort by Energy
                      </button>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg cursor-pointer transition-colors">
                    <Upload className="w-5 h-5" />
                    {isAnalyzing ? 'Analyzing...' : 'Add Songs'}
                    <input
                      type="file"
                      accept="audio/*"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={isAnalyzing}
                    />
                  </label>
                </div>

                <div className="space-y-2">
                  {currentPlaylist.songs.map((song, index) => (
                    <div
                      key={song.id}
                      className={`flex items-center justify-between bg-white/5 p-4 rounded-lg group ${
                        currentSongIndex === index ? 'bg-purple-600/30' : ''
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => {
                            if (currentSongIndex === index) {
                              setIsPlaying(!isPlaying);
                            } else {
                              playSong(index);
                            }
                          }}
                          className="p-2 rounded-full hover:bg-purple-600 transition-colors"
                        >
                          {currentSongIndex === index && isPlaying ? (
                            <Pause className="w-5 h-5" />
                          ) : (
                            <Play className="w-5 h-5" />
                          )}
                        </button>
                        <div>
                          <span className="font-medium">{song.name}</span>
                          {song.bpm && song.key && (
                            <div className="text-sm text-gray-400">
                              {song.bpm} BPM • Key: {song.key} • Energy: {song.energy?.toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => removeSong(song.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 hover:text-red-400 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {currentPlaylist.songs.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <Upload className="w-12 h-12 mx-auto mb-4" />
                    <p>Upload some songs to get started</p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <Music className="w-12 h-12 mx-auto mb-4" />
                <p>Select or create a playlist to get started</p>
              </div>
            )}
          </div>
        </div>

        {currentPlaylist && currentSongIndex !== -1 && (
          <audio
            ref={audioRef}
            src={currentPlaylist.songs[currentSongIndex].url}
            onEnded={handleNext}
            autoPlay
          />
        )}

        {currentPlaylist && currentPlaylist.songs.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-black/50 backdrop-blur-lg p-4">
            <div className="container mx-auto flex items-center justify-center gap-6">
              <button 
                onClick={handlePrevious}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <SkipBack className="w-6 h-6" />
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-4 bg-purple-600 hover:bg-purple-700 rounded-full transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6" />
                )}
              </button>
              <button 
                onClick={handleNext}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <SkipForward className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-2">
                <Volume2 className="w-5 h-5" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-24 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;