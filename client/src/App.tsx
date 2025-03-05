import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { queryClient } from "./lib/queryClient";
import { Navbar } from "./components/navbar";
import Home from "./pages/home";
import CreateListing from "./pages/create-listing";
import NotFound from "./pages/not-found";
import { NetworkBanner } from "./components/network-banner";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/create" component={CreateListing} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background flex flex-col">
        <NetworkBanner />
        <Navbar />
        <Router />
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;