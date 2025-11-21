import { CampaignBriefForm } from "./components/CampaignBriefForm";
import { AdminDashboard } from "./components/AdminDashboard";
import { useState } from "react";

function App() {
  const [demoTrigger, setDemoTrigger] = useState(0);
  const [showAdmin, setShowAdmin] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const handleAdminClick = () => {
    const password = prompt("Enter admin password:");
    if (password === "admin1234") {
      setShowAdmin(true);
    } else if (password !== null) {
      alert("Incorrect password");
    }
  };
  
  return (
    <div className="container-page">
      <div className="flex justify-center py-6">
        <img src="/Sherbet Blue Logo.png" alt="Sherbet" className="h-16" />
      </div>
      <header className="space-y-1 relative">
        <div className="absolute right-0 top-0 flex gap-2">
          <button
            onClick={() => setDemoTrigger(prev => prev + 1)}
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
          >
            Load Demo
          </button>
          <button
            onClick={handleAdminClick}
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
          >
            Admin
          </button>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          New Campaign Brief
        </h1>
        <p className="text-sm text-muted-foreground">
          Capture all the details we need to set up a new campaign job bag.
        </p>
      </header>
      <main>
        {submitted ? (
          <div className="mt-6 rounded-md border bg-card p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Brief submitted</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Thank you. Your campaign brief has been submitted successfully.
            </p>
            <button
              onClick={() => {
                setSubmitted(false);
                setDemoTrigger(0);
              }}
              className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
            >
              Submit another brief
            </button>
          </div>
        ) : (
          <CampaignBriefForm demoTrigger={demoTrigger} onSubmitted={() => setSubmitted(true)} />
        )}
      </main>
      {showAdmin && <AdminDashboard onClose={() => setShowAdmin(false)} />}
    </div>
  );
}

export default App;
