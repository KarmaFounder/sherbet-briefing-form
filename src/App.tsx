import { CampaignBriefForm } from "./components/CampaignBriefForm";
import { useState } from "react";

function App() {
  const [demoTrigger, setDemoTrigger] = useState(0);
  
  return (
    <div className="container-page">
      <div className="flex justify-center py-6">
        <img src="/Sherbet Blue Logo.png" alt="Sherbet" className="h-16" />
      </div>
      <header className="space-y-1 relative">
        <button
          onClick={() => setDemoTrigger(prev => prev + 1)}
          className="absolute right-0 top-0 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          Load Demo
        </button>
        <h1 className="text-2xl font-semibold tracking-tight">
          New Campaign Brief
        </h1>
        <p className="text-sm text-muted-foreground">
          Capture all the details we need to set up a new campaign job bag.
        </p>
      </header>
      <main>
        <CampaignBriefForm demoTrigger={demoTrigger} />
      </main>
    </div>
  );
}

export default App;
