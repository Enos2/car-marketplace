/* eslint-disable react-hooks/set-state-in-effect */
// =============================================================
// FILE: frontend/src/pages/Vehicles.jsx
// =============================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import { vehicleApi } from '../services/api';
import VehicleCard from '../components/VehicleCard';
import Pagination from '../components/Pagination';
import FilterSidebar from '../components/FilterSidebar';
import useDebounce from '../hooks/useDebounce';
import Reveal from '../components/Reveal';

const EMPTY_FILTERS = {};

export default function Vehicles() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('newest');

  const [items, setItems] = useState([]);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const debouncedSearch = useDebounce(searchInput, 450);

  const query = useMemo(() => {
    const q = { page, limit: 12, sort };
    if (debouncedSearch) q.q = debouncedSearch;
    if (filters.make) q.make = filters.make;
    if (filters.bodyType) q.bodyType = filters.bodyType;
    if (filters.fuelType) q.fuelType = filters.fuelType;
    if (filters.transmission) q.transmission = filters.transmission;
    if (filters.condition) q.condition = filters.condition;
    if (filters.county) q.county = filters.county;
    if (filters.minYear) q.minYear = filters.minYear;
    if (filters.maxYear) q.maxYear = filters.maxYear;
    if (filters.minPriceMajor) q.minPrice = Math.round(Number(filters.minPriceMajor) * 100);
    if (filters.maxPriceMajor) q.maxPrice = Math.round(Number(filters.maxPriceMajor) * 100);
    return q;
  }, [page, sort, debouncedSearch, filters]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    vehicleApi
      .list(query)
      .then((res) => {
        if (cancelled) return;
        setItems(res.data || []);
        setPages(res.pagination?.pages || 1);
        setTotal(res.pagination?.total || 0);
      })
      .catch((e) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [query]);

  useEffect(() => { setPage(1); }, [debouncedSearch, filters, sort]);

  const handleFilterChange = useCallback((next) => setFilters(next), []);
  const handleReset = useCallback(() => {
    setFilters(EMPTY_FILTERS);
    setSearchInput('');
    setSort('newest');
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <Reveal>
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">Vehicles</h1>
          <p className="mt-1 text-sm text-neutral-400">
            {loading ? 'Loading…' : `${total} listings`}
          </p>
        </div>
      </Reveal>

      <div className="grid grid-cols-1 lg:grid-cols-[16rem_1fr] gap-8">
        <FilterSidebar filters={filters} onChange={handleFilterChange} onReset={handleReset} />

        <div>
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search make, model, keyword…"
              className="flex-1 rounded border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:border-neutral-600"
            />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:border-neutral-600"
            >
              <option value="newest">Newest</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="mileage">Mileage: low</option>
            </select>
          </div>

          {error && (
            <div className="rounded border border-red-900 bg-red-950/40 p-4 text-sm text-red-300">
              Failed to load vehicles: {error}
            </div>
          )}

          {!error && !loading && items.length === 0 && (
            <div className="rounded border border-neutral-800 bg-neutral-900 p-8 text-center text-sm text-neutral-400">
              No vehicles match your filters.
            </div>
          )}

          {!error && items.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((v, i) => (
                <Reveal key={v._id} delay={(i % 3) * 40}>
                  <VehicleCard vehicle={v} />
                </Reveal>
              ))}
            </div>
          )}

          <Pagination page={page} pages={pages} onChange={setPage} />
        </div>
      </div>
    </div>
  );
}

// =============================================================
// END OF FILE: frontend/src/pages/Vehicles.jsx
// =============================================================