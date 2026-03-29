import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Jogadores from "./pages/Jogadores";
import Perfil from "./pages/Perfil";
import Times from "./pages/Times";
import TeamDetail from "./pages/TeamDetail";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/jogadores" component={Jogadores} />
      <Route path="/perfil" component={Perfil} />
      <Route path="/times" component={Times} />
      <Route path="/times/:id" component={TeamDetail} />
      <Route path="/noticias"><Redirect to="/" /></Route>
      <Route path="/dashboard"><Redirect to="/" /></Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
