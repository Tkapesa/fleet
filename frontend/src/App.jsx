import { useMemo, useState } from 'react'
import { Link, Route, Routes, useNavigate } from 'react-router-dom'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000'

const RESOURCE_CONFIG = [
  {
    key: 'trucks',
    label: 'Trucks',
    path: '/trucks/',
    template: {
      license_plate: 'AB-1234',
      make: 'Volvo',
      model: 'FH16',
      year: 2021,
      capacity_tons: 24,
    },
  },
  {
    key: 'drivers',
    label: 'Drivers',
    path: '/drivers/',
    template: {
      full_name: 'Alex Driver',
      email: 'alex.driver@example.com',
      phone: '+1-555-0100',
      license_number: 'D1234567',
      license_class: 'class_a',
      license_expiry: '2030-12-31',
    },
  },
  {
    key: 'trips',
    label: 'Trips',
    path: '/trips/',
    template: {
      truck_id: 1,
      driver_id: 1,
      origin: 'Dallas, TX',
      destination: 'Phoenix, AZ',
      cargo_description: 'Construction materials',
      cargo_weight_tons: 8,
      scheduled_departure: '2026-07-20T09:00:00',
      notes: 'Deliver before noon if possible',
    },
  },
  {
    key: 'maintenance',
    label: 'Maintenance',
    path: '/maintenance-services/',
    template: {
      truck_id: 1,
      service_date: '2026-07-01T10:00:00',
      service_type: 'Oil Change',
      vendor: 'RoadPro Garage',
      mileage_km: 152300,
      cost: 420.5,
      notes: 'Replaced filters',
    },
  },
  {
    key: 'ifta',
    label: 'IFTA',
    path: '/ifta/',
    template: {
      truck_id: 1,
      period_start: '2026-04-01',
      period_end: '2026-06-30',
      jurisdiction: 'TX',
      miles_driven: 3500,
      gallons_purchased: 500,
      tax_rate_per_gallon: 0.2,
      fleet_mpg: 7,
    },
  },
]

const DEFAULT_REGISTER = {
  email: '',
  full_name: '',
  password: '',
  account_type: 'individual',
  company_name: '',
}

const DEFAULT_LOGIN = {
  email: '',
  password: '',
}

const DEFAULT_RESOURCE_STATE = {
  items: [],
  loading: false,
  error: '',
}

function buildHeaders(token, withJson = true) {
  const headers = {}
  if (withJson) {
    headers['Content-Type'] = 'application/json'
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  return headers
}

async function apiRequest(path, { method = 'GET', token, body } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: buildHeaders(token, body !== undefined),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (response.status === 204) {
    return null
  }

  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(payload?.detail ?? `Request failed with status ${response.status}`)
  }
  return payload
}

function App() {
  const navigate = useNavigate()
  const [token, setToken] = useState(() => localStorage.getItem('truckAppToken') ?? '')
  const [activeTab, setActiveTab] = useState('overview')
  const [registerForm, setRegisterForm] = useState(DEFAULT_REGISTER)
  const [loginForm, setLoginForm] = useState(DEFAULT_LOGIN)
  const [authMessage, setAuthMessage] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  const [resources, setResources] = useState(() =>
    RESOURCE_CONFIG.reduce((acc, resource) => {
      acc[resource.key] = DEFAULT_RESOURCE_STATE
      return acc
    }, {}),
  )

  const [createPayloads, setCreatePayloads] = useState(() =>
    RESOURCE_CONFIG.reduce((acc, resource) => {
      acc[resource.key] = JSON.stringify(resource.template, null, 2)
      return acc
    }, {}),
  )

  const [spendingSummary, setSpendingSummary] = useState([])
  const [summaryError, setSummaryError] = useState('')

  const fleetCount = useMemo(() => {
    return RESOURCE_CONFIG.reduce((total, resource) => {
      return total + (resources[resource.key]?.items?.length ?? 0)
    }, 0)
  }, [resources])

  function saveToken(nextToken) {
    if (!nextToken) {
      localStorage.removeItem('truckAppToken')
      setToken('')
      return
    }
    localStorage.setItem('truckAppToken', nextToken)
    setToken(nextToken)
  }

  function updateResourceState(resourceKey, partial) {
    setResources((current) => ({
      ...current,
      [resourceKey]: {
        ...current[resourceKey],
        ...partial,
      },
    }))
  }

  async function fetchResource(resource) {
    updateResourceState(resource.key, { loading: true, error: '' })
    try {
      const data = await apiRequest(resource.path, { token })
      updateResourceState(resource.key, { items: data ?? [], loading: false, error: '' })
    } catch (error) {
      updateResourceState(resource.key, {
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  async function fetchSpendingSummary() {
    setSummaryError('')
    try {
      const data = await apiRequest('/trucks/spending/summary', { token })
      setSpendingSummary(data ?? [])
    } catch (error) {
      setSummaryError(error instanceof Error ? error.message : 'Failed to load summary')
    }
  }

  async function refreshAllResources() {
    if (!token) {
      return
    }
    await Promise.all(RESOURCE_CONFIG.map((resource) => fetchResource(resource)))
    await fetchSpendingSummary()
    setAuthMessage('Data synced from backend.')
  }

  async function handleRegister(event) {
    event.preventDefault()
    setAuthLoading(true)
    setAuthMessage('')

    try {
      await apiRequest('/auth/register', {
        method: 'POST',
        body: registerForm,
      })
      setAuthMessage('Registration completed. You can log in now.')
      setRegisterForm(DEFAULT_REGISTER)
      navigate('/login')
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : 'Registration failed')
    } finally {
      setAuthLoading(false)
    }
  }

  async function handleLogin(event) {
    event.preventDefault()
    setAuthLoading(true)
    setAuthMessage('')

    try {
      const authData = await apiRequest('/auth/login', {
        method: 'POST',
        body: loginForm,
      })
      saveToken(authData.access_token)
      setAuthMessage('Login successful.')
      setActiveTab('overview')
      navigate('/')
      await refreshAllResources()
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : 'Login failed')
    } finally {
      setAuthLoading(false)
    }
  }

  async function handleCreateResource(resource) {
    try {
      const parsed = JSON.parse(createPayloads[resource.key])
      await apiRequest(resource.path, {
        method: 'POST',
        token,
        body: parsed,
      })
      setAuthMessage(`${resource.label} record created.`)
      await fetchResource(resource)
      if (resource.key === 'maintenance' || resource.key === 'ifta') {
        await fetchSpendingSummary()
      }
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : 'Failed to create record')
    }
  }

  function handleLogout() {
    saveToken('')
    setAuthMessage('Logged out.')
    setSpendingSummary([])
    setResources(
      RESOURCE_CONFIG.reduce((acc, resource) => {
        acc[resource.key] = DEFAULT_RESOURCE_STATE
        return acc
      }, {}),
    )
  }

  function renderAuthLink() {
    if (token) {
      return null
    }

    return (
      <div className="auth-nav">
        <Link className="button button-secondary" to="/signup">
          Sign up
        </Link>
        <Link className="button" to="/login">
          Login
        </Link>
      </div>
    )
  }

  return (
    <main className="page">
      <header className="hero">
        <p className="eyebrow">Fleet Operations Platform</p>
        <h1>Truck App Frontend</h1>
        <p className="hero-text">
          A React control center connected to your FastAPI backend for managing fleet assets,
          trip operations, maintenance, and IFTA reporting.
        </p>
        <div className="hero-actions">
          <button type="button" className="button" onClick={refreshAllResources} disabled={!token}>
            Sync Data
          </button>
          {token ? (
            <button type="button" className="button button-secondary" onClick={handleLogout}>
              Logout
            </button>
          ) : null}
        </div>
        {renderAuthLink()}
        <p className="token-status">API: {API_BASE_URL}</p>
      </header>

      <section className="status-grid">
        <article>
          <h2>Total Loaded Records</h2>
          <strong>{fleetCount}</strong>
        </article>
        <article>
          <h2>Token Status</h2>
          <strong>{token ? 'Authenticated' : 'Not logged in'}</strong>
        </article>
        <article>
          <h2>IFTA Spending Entries</h2>
          <strong>{spendingSummary.length}</strong>
        </article>
      </section>

      <Routes>
        <Route
          path="/signup"
          element={
            <section className="panel auth-panel">
              <div className="auth-header">
                <div>
                  <h2>Create account</h2>
                  <p className="auth-subtitle">Use this page to register a new account.</p>
                </div>
              </div>
              <form className="auth-form" onSubmit={handleRegister}>
                <input
                  required
                  placeholder="Email"
                  type="email"
                  value={registerForm.email}
                  onChange={(event) =>
                    setRegisterForm((current) => ({ ...current, email: event.target.value }))
                  }
                />
                <input
                  required
                  placeholder="Full name"
                  value={registerForm.full_name}
                  onChange={(event) =>
                    setRegisterForm((current) => ({ ...current, full_name: event.target.value }))
                  }
                />
                <input
                  required
                  placeholder="Password"
                  type="password"
                  value={registerForm.password}
                  onChange={(event) =>
                    setRegisterForm((current) => ({ ...current, password: event.target.value }))
                  }
                />
                <select
                  value={registerForm.account_type}
                  onChange={(event) =>
                    setRegisterForm((current) => ({ ...current, account_type: event.target.value }))
                  }
                >
                  <option value="individual">individual</option>
                  <option value="company">company</option>
                </select>
                <input
                  placeholder="Company name (required for company)"
                  value={registerForm.company_name}
                  onChange={(event) =>
                    setRegisterForm((current) => ({ ...current, company_name: event.target.value }))
                  }
                />
                <button type="submit" className="button" disabled={authLoading}>
                  Register
                </button>
              </form>
              {authMessage ? <p className="message">{authMessage}</p> : null}
            </section>
          }
        />
        <Route
          path="/login"
          element={
            <section className="panel auth-panel">
              <div className="auth-header">
                <div>
                  <h2>Sign in</h2>
                  <p className="auth-subtitle">Use this page to access your existing account.</p>
                </div>
              </div>
              <form className="auth-form" onSubmit={handleLogin}>
                <input
                  required
                  placeholder="Email"
                  type="email"
                  value={loginForm.email}
                  onChange={(event) => setLoginForm((current) => ({ ...current, email: event.target.value }))}
                />
                <input
                  required
                  placeholder="Password"
                  type="password"
                  value={loginForm.password}
                  onChange={(event) =>
                    setLoginForm((current) => ({ ...current, password: event.target.value }))
                  }
                />
                <button type="submit" className="button" disabled={authLoading}>
                  Login
                </button>
              </form>
              {authMessage ? <p className="message">{authMessage}</p> : null}
            </section>
          }
        />
        <Route
          path="/"
          element={
            <section className="panel">
        <h2>Data Modules</h2>
        <nav className="tabs">
          <button
            type="button"
            className={activeTab === 'overview' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          {RESOURCE_CONFIG.map((resource) => (
            <button
              key={resource.key}
              type="button"
              className={activeTab === resource.key ? 'tab active' : 'tab'}
              onClick={() => setActiveTab(resource.key)}
            >
              {resource.label}
            </button>
          ))}
        </nav>

        {activeTab === 'overview' ? (
          <div className="overview-grid">
            <article className="box">
              <h3>Truck Spending Summary</h3>
              {summaryError ? <p className="error">{summaryError}</p> : null}
              {spendingSummary.length === 0 ? (
                <p className="hint">No summary rows yet. Add maintenance or IFTA records first.</p>
              ) : (
                <pre>{JSON.stringify(spendingSummary, null, 2)}</pre>
              )}
            </article>
            <article className="box">
              <h3>Startup Checklist</h3>
              <ul className="checklist">
                <li>Register a user account.</li>
                <li>Login and sync data.</li>
                <li>Create at least one truck and one driver.</li>
                <li>Add trips, maintenance, and IFTA entries.</li>
              </ul>
            </article>
          </div>
        ) : (
          RESOURCE_CONFIG.filter((resource) => resource.key === activeTab).map((resource) => {
            const state = resources[resource.key] ?? DEFAULT_RESOURCE_STATE
            return (
              <article key={resource.key} className="resource-panel">
                <div className="resource-header">
                  <h3>{resource.label}</h3>
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => fetchResource(resource)}
                    disabled={!token || state.loading}
                  >
                    {state.loading ? 'Loading...' : 'Refresh'}
                  </button>
                </div>

                {state.error ? <p className="error">{state.error}</p> : null}

                <div className="resource-grid">
                  <div>
                    <h4>Create New {resource.label}</h4>
                    <textarea
                      value={createPayloads[resource.key]}
                      onChange={(event) =>
                        setCreatePayloads((current) => ({
                          ...current,
                          [resource.key]: event.target.value,
                        }))
                      }
                    />
                    <button
                      type="button"
                      className="button"
                      onClick={() => handleCreateResource(resource)}
                      disabled={!token}
                    >
                      Create Record
                    </button>
                  </div>

                  <div>
                    <h4>Loaded Records ({state.items.length})</h4>
                    <pre>{JSON.stringify(state.items, null, 2)}</pre>
                  </div>
                </div>
              </article>
            )
          })
        )}
            </section>
          }
        />
      </Routes>
    </main>
  )
}

export default App
