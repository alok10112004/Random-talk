import { useState, useEffect } from "react";
import "./CountryList.css";

function CountryList({ onSelect, selectedCountry }) {
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("http://localhost:5000/api/countries")
      .then((res) => res.json())
      .then((data) => {
        setCountries(data.countries || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error:", err);
        setLoading(false);
      });
  }, []);

  const filtered = countries.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <p style={{ textAlign: "center", padding: 40 }}>Loading...</p>;
  }

  return (
    <div className="country-container">
      <h2 className="country-title">🌍 All countries</h2>

      <input
        type="text"
        className="country-search"
        placeholder="Search country..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="country-grid">
        {filtered.map((c) => (
          <div
            key={c.code}
            className={`country-item ${
              selectedCountry === c.code ? "selected" : ""
            }`}
            onClick={() => onSelect(c)}
          >
            <img src={c.flagUrl} alt={c.name} className="country-flag-img" />
            <span className="country-name">{c.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CountryList;