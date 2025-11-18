import { CampaignBriefForm } from "./components/CampaignBriefForm";

function App() {
  return (
    <div className="container-page">
      <div className="flex justify-center py-6">
        <img src="/Sherbet Blue Logo.png" alt="Sherbet" className="h-16" />
      </div>
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          New Campaign Brief
        </h1>
        <p className="text-sm text-muted-foreground">
          Capture all the details we need to set up a new campaign job bag.
        </p>
      </header>
      <main>
        <CampaignBriefForm />
      </main>
    </div>
  );
}

export default App;
