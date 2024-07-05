import { createBrowserRouter, RouterProvider } from "react-router-dom";

import { Cloud } from "./layout";
import ErrorPage from "./error-page";
import Home from "./routes/root";
import StartGame from "./routes/start";
import GameLobby from "./routes/play";
import { action as createGameAction } from "./actions/play";

function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Home />,
      errorElement: <ErrorPage />,
    },
    {
      path: "/play",
      action: createGameAction,
      element: <GameLobby />,
    },
    {
      path: "/play/:pin",
      element: <StartGame />,
    },
  ]);

  return (
    <div id="app">
      <RouterProvider router={router} />
      <Cloud direction="left" />
      <Cloud direction="right" />
    </div>
  );
}

export default App;
