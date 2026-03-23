import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Noticias from "./pages/Noticias";
import Jogadores from "./pages/Jogadores";
import Dashboard from "./pages/Dashboard";
import Perfil from "./pages/Perfil";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/noticias" component={Noticias} />
      <Route path="/jogadores" component={Jogadores} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/perfil" component={Perfil} />
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
