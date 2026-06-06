import { createContext, useContext, useReducer } from 'react';

const STORAGE_KEY = 'calendar-events-v1';

const DEFAULT_STATE = { events: [] };

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const saved = JSON.parse(raw);
    return { events: Array.isArray(saved.events) ? saved.events : [] };
  } catch {
    return DEFAULT_STATE;
  }
}

function persist(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ events: state.events }));
}

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_EVENT': {
      const next = { ...state, events: [...state.events, action.payload] };
      persist(next);
      return next;
    }
    case 'UPDATE_EVENT': {
      const next = {
        ...state,
        events: state.events.map(e => e.id === action.payload.id ? action.payload : e),
      };
      persist(next);
      return next;
    }
    case 'DELETE_EVENT': {
      const next = { ...state, events: state.events.filter(e => e.id !== action.id) };
      persist(next);
      return next;
    }
    default:
      return state;
  }
}

const CalendarContext = createContext(null);

export function CalendarProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);
  return (
    <CalendarContext.Provider value={{ state, dispatch }}>
      {children}
    </CalendarContext.Provider>
  );
}

export function useCalendar() {
  return useContext(CalendarContext);
}
