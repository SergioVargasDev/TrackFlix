import { useEffect, useRef, useState } from "react";
import StarRating from "./StarRating";
import { useMovies } from "./useMovies";
import { useLocalStorageState } from "./useLocalSTG";
import { useKey } from "./useKey";
import Logout from "./Logout";

const KEY = "ef1c10ab";

const average = (arr) =>
  arr.reduce((acc, cur, i, arr) => acc + cur / arr.length, 0);

export default function App({ setIsLoggedIn }) {
  const [query, setQuery] = useState("");

  const [selectedId, setSelectedId] = useState(null);

  const { movies, isLoading, error } = useMovies(query);

  const [watched, setWatched] = useLocalStorageState([], "watched");

  function handleSelectMovie(id) {
    setSelectedId((selectedId) => (id === selectedId ? null : id));
  }

  function handleCloseMovie() {
    setSelectedId(null);
  }

  useEffect(() => {
    const email = localStorage.getItem("userEmail");
    fetch(`${process.env.REACT_APP_BACKEND_URL}/user-movies?email=${email}`)
    .then((response) => response.json())
      .then((watchedMovies) => {
        setWatched(watchedMovies);  // Set watched movies list
      })
      .catch((error) => console.error("Error fetching movies:", error));
  }, [setWatched]); // Add setWatched to the dependency array
  

  function handleAddWatched(movie) {
    const email = localStorage.getItem("userEmail");
    console.log(email, movie);  // Debug: Check email and movie
    fetch(`${process.env.REACT_APP_BACKEND_URL}/add-movie`, 
      {
      
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, movie })
    })
      .then((response) => response.json())
      .then((updatedWatchedMovies) => {
        setWatched(updatedWatchedMovies);
      })
      .catch((error) => console.error("Error adding movie:", error));
  }
  
  

  function handleDeleteWatched(imdbID) {
    const email = localStorage.getItem("userEmail");  // Assuming you store the email after login
    fetch(`${process.env.REACT_APP_BACKEND_URL}/remove-movie`, 
      {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, imdbID })
    })
      .then((response) => response.json())
      .then((updatedWatchedMovies) => {
        setWatched(updatedWatchedMovies);  // Update local watched list
      })
      .catch((error) => console.error("Error removing movie:", error));
  }
  

  return (
    <>
      <LogoutLayout setIsLoggedIn={setIsLoggedIn} />
      <NavBar>
        <Logo />

        <Search query={query} setQuery={setQuery} />
        <Numresults movies={movies} />
      </NavBar>
      <Main>
        <Box>
          {isLoading && <Loader />}
          {!isLoading && !error && (
            <MovieList movies={movies} onSelectMovie={handleSelectMovie} />
          )}
          {error && <ErrorMessage message={error} />}
        </Box>
        <Box
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
          }}
        >
          {selectedId ? (
            <MovieDetails
              selectedId={selectedId}
              onCloseMovie={handleCloseMovie}
              onAddWatched={handleAddWatched}
              watched={watched}
            />
          ) : (
            <SelectMovie />
          )}
        </Box>
        <Box>
          <>
            <WatchedSummary watched={watched} />
            <WatchedMoviesList
              watched={watched}
              onDeleteWatched={handleDeleteWatched}
            />
          </>
        </Box>
      </Main>
    </>
  );
}
function LogoutLayout({ setIsLoggedIn }) {
  return (
    <nav className="nav-bar-logout">
      <Logout setIsLoggedIn={setIsLoggedIn} /> {/* Add Logout button here */}
    </nav>
  );
}

function SelectMovie() {
  return (
    <p className="selecciona">
      Selecciona una pelicula para ver su información
    </p>
  );
}
function Loader() {
  return <p className="loader">Loading...</p>;
}

function ErrorMessage({ message }) {
  return (
    <p className="error">
      <span>⛔️</span>
      {message}
    </p>
  );
}

// function NavBar({ children }) {
//   return <nav className="nav-bar">{children}</nav>;
// }

function NavBar({ children }) {
  return <nav className="nav-bar">{children}</nav>;
}

function Logo() {
  return (
    <div className="logo">
      <span role="img">🍿</span>
      <h1>TrackFlix</h1>
    </div>
  );
}

function Numresults({ movies }) {
  return (
    <p className="num-results">
      <strong>{movies.length}</strong> resultados encontrados
    </p>
  );
}

function Search({ query, setQuery }) {
  const inputEl = useRef(null);

  useKey("Enter", function () {
    if (document.activeElement === inputEl.current) return;
    inputEl.current.focus();
    setQuery("");
  });

  return (
    <input
      className="search"
      type="text"
      placeholder="Buscar pelicula..."
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      ref={inputEl}
    />
  );
}

function Main({ children }) {
  return <main className="main">{children}</main>;
}

function Box({ children }) {
  return <div className="box">{children}</div>;
}

function MovieList({ movies, onSelectMovie }) {
  return (
    <ul className="list list-movies">
      {movies?.map((movie) => (
        <Movie movie={movie} key={movie.imdbID} onSelectMovie={onSelectMovie} />
      ))}
    </ul>
  );
}
function Movie({ movie, onSelectMovie }) {
  return (
    <li onClick={() => onSelectMovie(movie.imdbID)}>
      <img src={movie.Poster} alt={`${movie.Title} poster`} />
      <h3>{movie.Title}</h3>
      <div>
        <p>
          <span>🗓</span>
          <span>{movie.Year}</span>
        </p>
      </div>
    </li>
  );
}

function MovieDetails({ selectedId, onCloseMovie, onAddWatched, watched }) {
  const [movie, setMovie] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [userRating, setUserRating] = useState("");

  const countRef = useRef(0);

  useEffect(() => {
    if (userRating) countRef.current += 1;
  }, [userRating]);

  // Ensure watched is an array before using .map()
  const isWatched = Array.isArray(watched) && watched.some((movie) => movie.imdbID === selectedId);
  const watchedUserRating = Array.isArray(watched)
    ? watched.find((movie) => movie.imdbID === selectedId)?.userRating
    : null;

  const {
    Title: title,
    Year: year,
    Poster: poster,
    Runtime: runtime,
    imdbRating,
    Plot: plot,
    Released: released,
    Actors: actors,
    Director: director,
    Genre: genre,
  } = movie;

  function handleAdd() {
    const newWatchedMovie = {
      imdbID: selectedId,
      title,
      year,
      poster,
      imdbRating: Number(imdbRating),
      runtime: Number(runtime.split(" ").at(0)),
      userRating,
      countRatingDecisions: countRef.current,
    };
    onAddWatched(newWatchedMovie);
    onCloseMovie();
  }

  useEffect(() => {
    async function getMovieDetails() {
      setIsLoading(true);
      const res = await fetch(
        `http://www.omdbapi.com/?apikey=${KEY}&i=${selectedId}`
      );
      const data = await res.json();
      setMovie(data);
      setIsLoading(false);
    }
    getMovieDetails();
  }, [selectedId]);

  useEffect(() => {
    if (!title) return;
    document.title = `Movie | ${title} `;

    return function () {
      document.title = "TrackFlix";
    };
  }, [title]);

  useKey("Escape", onCloseMovie);

  return (
    <div className="details">
      {isLoading ? (
        <Loader />
      ) : (
        <>
          <header>
            <button className="btn-back" onClick={onCloseMovie}>
              {" "}
              &larr;
            </button>
            <img src={poster} alt={`Poster of ${movie} movie`} />
            <div className="details-overview">
              <h2>{title}</h2>
              <p>
                {released} &bull; {runtime}
              </p>
              <p>{genre}</p>
              <p>
                <span>⭐️</span>
                {imdbRating} IMDb rating
              </p>
            </div>
          </header>
          <section>
            <div className="rating">
              {!isWatched ? (
                <>
                  <StarRating
                    maxRating={10}
                    size={24}
                    onSetRating={setUserRating}
                  />
                  {userRating > 0 && (
                    <button className="btn-add" onClick={handleAdd}>
                      + Agregar a lista
                    </button>
                  )}
                </>
              ) : (
                <p>
                  Ya tienes esta película en tu lista con {watchedUserRating}{" "}
                  ⭐️{" "}
                </p>
              )}
            </div>

            <p>
              <em>{plot}</em>
              <p>Reparto: {actors}</p>
              <p>Dirigido por: {director}</p>
            </p>
          </section>
        </>
      )}
    </div>
  );
}


function WatchedSummary({ watched }) {
  if (!Array.isArray(watched)) return null; // Add this guard to ensure watched is an array

  const avgImdbRating = average(watched.map((movie) => movie.imdbRating));
  const avgUserRating = average(watched.map((movie) => movie.userRating));
  const avgRuntime = average(watched.map((movie) => movie.runtime));
  return (
    <div className="summary">
      <h2>Tu lista</h2>
      <div>
        <p>
          <span>#️⃣</span>
          <span>{watched.length} peliculas</span>
        </p>
        <p>
          <span>⭐️</span>
          <span>{avgImdbRating.toFixed(2)}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{avgUserRating.toFixed(2)}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{avgRuntime} min</span>
        </p>
      </div>
    </div>
  );
}

function WatchedMoviesList({ watched, onDeleteWatched }) {
  if (!Array.isArray(watched)) return null; // Guard against non-array

  return (
    <ul className="list">
      {watched.map((movie) => (
        <WatchedMovie
          movie={movie}
          key={movie.imdbID}
          onDeleteWatched={onDeleteWatched}
        />
      ))}
    </ul>
  );
}

function WatchedMovie({ movie, onDeleteWatched }) {
  return (
    <li>
      <img src={movie.poster} alt={`${movie.title} poster`} />
      <h3>{movie.title}</h3>
      <div>
        <p>
          <span>⭐️</span>
          <span>{movie.imdbRating}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{movie.userRating}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{movie.runtime} min</span>
        </p>

        <button
          className="btn-delete"
          onClick={() => onDeleteWatched(movie.imdbID)}
        >
          X
        </button>
      </div>
    </li>
  );
}
