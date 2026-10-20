import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { countries } from "countries-list";

function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    age: "",
    gender: "male",
    country: "India",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  // Auto-detect country from IP on mount
  useEffect(() => {
    fetch("http://ip-api.com/json/")
      .then((res) => res.json())
      .then((data) => {
        if (data.country) {
          setForm((prev) => ({ ...prev, country: data.country }));
        }
      })
      .catch((err) => console.log("Country detect error:", err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await register(
        form.name,
        form.email,
        form.password,
        Number(form.age),
        form.gender,
        form.country
      );
      navigate("/chat");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-lg p-8 w-full max-w-md border border-orange-500/30">
        <h1 className="text-3xl font-bold text-orange-500 text-center mb-6">
          📺 Iconic TV
        </h1>
        <h2 className="text-xl font-semibold text-white text-center mb-6">
          Create Account
        </h2>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-300 p-2 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <input
            type="text"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            className="w-full bg-black border border-orange-500/30 rounded px-3 py-2 text-white"
          />

          {/* Email */}
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            className="w-full bg-black border border-orange-500/30 rounded px-3 py-2 text-white"
          />

          {/* Password */}
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            className="w-full bg-black border border-orange-500/30 rounded px-3 py-2 text-white"
          />

          {/* Age */}
          <input
            type="number"
            placeholder="Age (18+)"
            value={form.age}
            onChange={(e) => setForm({ ...form, age: e.target.value })}
            required
            min="18"
            className="w-full bg-black border border-orange-500/30 rounded px-3 py-2 text-white"
          />

          {/* Gender */}
          <select
            value={form.gender}
            onChange={(e) => setForm({ ...form, gender: e.target.value })}
            className="w-full bg-black border border-orange-500/30 rounded px-3 py-2 text-white"
          >
            <option value="male">👦 Male</option>
            <option value="female">👧 Female</option>
            <option value="other">🧑 Other</option>
          </select>

          {/* Country — saare countries with emoji */}
          <select
            value={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value })}
            className="w-full bg-black border border-orange-500/30 rounded px-3 py-2 text-white"
          >
            {Object.entries(countries).map(([code, data]) => (
              <option key={code} value={data.name}>
                {data.emoji} {data.name}
              </option>
            ))}
          </select>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 py-3 rounded font-bold text-white transition"
          >
            {loading ? "Creating..." : "Register"}
          </button>
        </form>

        <p className="text-center text-gray-400 mt-4 text-sm">
          Have account?{" "}
          <Link to="/login" className="text-orange-400 hover:underline">
            Login
          </Link>
        </p>

        <p className="text-center text-xs text-gray-600 mt-4">
          18+ only. Demo project — no real money.
        </p>
      </div>
    </div>
  );
}

export default Register;