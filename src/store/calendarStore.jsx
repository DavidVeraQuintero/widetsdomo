import { createContext, useContext, useReducer, useEffect } from 'react';

const STORAGE_KEY = 'calendar-events-v1';

const DEFAULT_STATE = { events: [], accounts: [], googleEvents: [] };

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const saved = JSON.parse(raw);
    return { 
      events: Array.isArray(saved.events) ? saved.events : [],
      accounts: Array.isArray(saved.accounts) ? saved.accounts : [],
      googleEvents: []
    };
  } catch {
    return DEFAULT_STATE;
  }
}

function persist(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ 
    events: state.events,
    accounts: state.accounts,
  }));
}

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_EVENT': {
      const next = { ...state, events: [...state.events, action.payload] };
      persist(next);
      return next;
    }
    case 'UPDATE_EVENT': {
      const next = { ...state, events: state.events.map(e => e.id === action.payload.id ? action.payload : e) };
      persist(next);
      return next;
    }
    case 'DELETE_EVENT': {
      const next = { ...state, events: state.events.filter(e => e.id !== action.id) };
      persist(next);
      return next;
    }
    case 'ADD_ACCOUNT': {
      const accounts = state.accounts.filter(a => a.id !== action.payload.id);
      accounts.push(action.payload);
      const next = { ...state, accounts };
      persist(next);
      return next;
    }
    case 'REMOVE_ACCOUNT': {
      const next = { ...state, accounts: state.accounts.filter(a => a.id !== action.id), googleEvents: state.googleEvents.filter(e => e.accountId !== action.id) };
      persist(next);
      return next;
    }
    case 'SET_GOOGLE_EVENTS': {
      const filtered = state.googleEvents.filter(e => e.accountId !== action.accountId);
      return { ...state, googleEvents: [...filtered, ...action.events] };
    }
    default:
      return state;
  }
}

const CalendarContext = createContext(null);

export function CalendarProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);

  // Sync Google events periodically
  useEffect(() => {
    async function syncAccount(account) {
      try {
        const timeMin = new Date();
        timeMin.setDate(1); // Inicio de mes
        timeMin.setHours(0,0,0,0);
        
        const timeMax = new Date();
        timeMax.setMonth(timeMax.getMonth() + 2); // Hasta dos meses adelante
        
        const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin.toISOString()}&timeMax=${timeMax.toISOString()}&singleEvents=true&orderBy=startTime`, {
          headers: { Authorization: `Bearer ${account.accessToken}` }
        });
        
        if (res.status === 401) {
          // Token expired, handle gracefully by ignoring or prompting re-login (for now we just remove or ignore)
          console.warn('Google token expired for', account.email);
          return;
        }

        const data = await res.json();
        if (data.items) {
          const events = data.items.map(item => {
            const start = item.start.dateTime || item.start.date;
            const end = item.end.dateTime || item.end.date;
            const startDate = new Date(start);
            const endDate = new Date(end);
            
            // Format to local date string YYYY-MM-DD
            let dateStr;
            if (item.start.date) {
              // Es un evento de todo el día, Google ya nos da el YYYY-MM-DD exacto
              dateStr = item.start.date;
            } else {
              // Es un evento con hora, ajustamos al timezone local
              const tzOffset = startDate.getTimezoneOffset() * 60000;
              const localISOTime = (new Date(startDate - tzOffset)).toISOString().slice(0, -1);
              dateStr = localISOTime.slice(0, 10);
            }
            
            const startStr = item.start.dateTime ? startDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Todo el día';
            
            let durationMin = Math.round((endDate - startDate) / 60000);
            if (!item.start.dateTime) durationMin = 24 * 60; // All day

            return {
              id: item.id,
              accountId: account.id,
              date: dateStr,
              title: item.summary || 'Sin título',
              startTime: startStr,
              duration: durationMin,
              isGoogle: true,
              accountColor: account.color || '#4285F4'
            };
          });
          
          dispatch({ type: 'SET_GOOGLE_EVENTS', accountId: account.id, events });
        }
      } catch (err) {
        console.error('Error syncing Google Calendar:', err);
      }
    }

    state.accounts.forEach(syncAccount);
    
    // Opcional: sync cada hora
    const interval = setInterval(() => {
      state.accounts.forEach(syncAccount);
    }, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [state.accounts]);

  return (
    <CalendarContext.Provider value={{ state, dispatch }}>
      {children}
    </CalendarContext.Provider>
  );
}

export function useCalendar() {
  return useContext(CalendarContext);
}
