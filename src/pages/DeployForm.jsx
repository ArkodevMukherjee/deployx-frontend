import { useState, useEffect } from "react";
import { useNavigate } from "react-router";

const API_URL = "https://neurastack.xyz";
const GITHUB_APP_INSTALL_URL =
  "https://github.com/apps/deploywebsite1234/installations/new";

const DeployForm = () => {
  const [repositories, setRepositories] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [branchName, setBranchName] = useState("main");
  const [environment, setEnvironment] = useState("production");
  const [installationId, setInstallationId] = useState(null);

  const [projectType, setProjectType] = useState("react");

  const [projectUrl, setProjectUrl] = useState("");
  const [isUrlValid, setIsUrlValid] = useState(true);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");

  /* ---------- Helpers ---------- */

  const validateUrl = (value) => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  };

  const isUrlMode = projectUrl.length > 0;
  const isGithubMode = Boolean(installationId);

  /* ---------- GitHub OAuth Exchange ---------- */

  useEffect(() => {
    if (!code || !token) return;

    const exchangeCode = async () => {
      try {
        const res = await fetch(`${API_URL}/deploy/exchange`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ code }),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          setInstallationId(data.installation_id);
          setProjectUrl(""); // hard switch to GitHub mode
        } else {
          setMessage({ text: "GitHub exchange failed", type: "error" });
        }
      } catch {
        setMessage({ text: "Network error during GitHub exchange", type: "error" });
      }
    };

    exchangeCode();
  }, [code, token]);

  /* ---------- Fetch Repositories ---------- */

  useEffect(() => {
    if (!installationId) return;

    const fetchRepositories = async () => {
      try {
        const res = await fetch(
          `${API_URL}/deploy/repositories?installation_id=${installationId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const data = await res.json();
        setRepositories(data.repositories || []);
      } catch {
        setMessage({ text: "Failed to load repositories", type: "error" });
      }
    };

    fetchRepositories();
  }, [installationId, token]);

  /* ---------- Auto-clear messages ---------- */

  useEffect(() => {
    if (!message.text) return;
    const t = setTimeout(() => setMessage({ text: "", type: "" }), 5000);
    return () => clearTimeout(t);
  }, [message]);

  /* ---------- Handlers ---------- */

  const handleUrlChange = (e) => {
    const value = e.target.value.trim();
    setProjectUrl(value);
    setIsUrlValid(value ? validateUrl(value) : true);

    if (value) {
      setInstallationId(null); // hard switch to URL mode
      setSelectedRepo(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isUrlMode && !isUrlValid) {
      setMessage({ text: "Invalid URL", type: "error" });
      return;
    }

    if (!isUrlMode && (!installationId || !selectedRepo)) {
      setMessage({ text: "Select a repository", type: "error" });
      return;
    }

    const payload = {
      isUrlDeployment: isUrlMode,
      environment,
      projectType,
      ...(isUrlMode
        ? { url: projectUrl }
        : {
            installationId: Number(installationId),
            repoId: selectedRepo.repoId,
            repoName: selectedRepo.name,
            fullName: selectedRepo.fullName,
            branchName,
          }),
    };

    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/deploy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        navigate("/dashboard");
      } else {
        setMessage({ text: data.message || "Deployment failed", type: "error" });
      }
    } catch {
      setMessage({ text: "Network error", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  /* ---------- UI ---------- */

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-2xl font-bold mb-6 text-center">Deploy Your Project</h1>

        {/* URL INPUT */}
        <div className="mb-6">
          <label className="block text-sm font-semibold mb-2">Deploy via URL</label>
          <input
            disabled={isGithubMode}
            value={projectUrl}
            onChange={handleUrlChange}
            placeholder="https://example.com"
            className={`w-full px-4 py-3 rounded-xl border ${
              isGithubMode
                ? "bg-gray-100 cursor-not-allowed"
                : isUrlValid
                ? "border-gray-200"
                : "border-red-400"
            }`}
          />
        </div>

        {/* GITHUB INSTALL */}
        {!installationId && (
          <button
            disabled={isUrlMode}
            onClick={() => window.location.href = GITHUB_APP_INSTALL_URL}
            className={`w-full py-3 mb-6 rounded-xl font-semibold ${
              isUrlMode
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            Install GitHub App
          </button>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* PROJECT TYPE */}
          <select
            value={projectType}
            onChange={(e) => setProjectType(e.target.value)}
            className="w-full px-4 py-3 border rounded-xl"
          >
            <option value="react">React</option>
            <option value="static">Static Website</option>
            <option value="django">Django</option>
            <option value="fastapi">FastAPI</option>
            <option value="flask">Flask</option>
          </select>

          {/* REPO SELECT */}
          <select
            disabled={!isGithubMode}
            value={selectedRepo?.repoId || ""}
            onChange={(e) =>
              setSelectedRepo(
                repositories.find(r => String(r.repoId) === e.target.value)
              )
            }
            className="w-full px-4 py-3 border rounded-xl"
          >
            <option value="" disabled>Select Repository</option>
            {repositories.map(repo => (
              <option key={repo.repoId} value={repo.repoId}>
                {repo.fullName}
              </option>
            ))}
          </select>

          {!isUrlMode && (
            <input
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
              className="w-full px-4 py-3 border rounded-xl"
              placeholder="Branch"
            />
          )}

          <button
            disabled={loading}
            className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold"
          >
            {loading ? "Deploying..." : "Deploy"}
          </button>
        </form>

        {message.text && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 text-red-700">
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeployForm;