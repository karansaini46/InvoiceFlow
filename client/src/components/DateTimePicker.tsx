import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { renderTimeViewClock } from '@mui/x-date-pickers/timeViewRenderers';
import dayjs from 'dayjs';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#f97316', // accent-primary
    },
    background: {
      paper: '#1e293b', // bg-surface
      default: '#0f172a', // bg-base
    },
    text: {
      primary: '#f8fafc',
      secondary: '#cbd5e1',
    },
    divider: '#334155',
  },
  typography: {
    fontFamily: 'Inter, "Segoe UI", Arial, sans-serif',
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#0f172a', // --bg-base
          border: '1px solid #334155', // --border-subtle
          backgroundImage: 'none',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
        }
      }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: 'var(--bg-base)',
          borderRadius: '6px',
          fontSize: '14px',
          height: '36px',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'var(--border-subtle)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'var(--border-strong)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#f97316',
          },
        },
        input: {
          padding: '0 12px',
          color: 'var(--text-primary)',
        }
      }
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          display: 'none'
        }
      }
    }
  }
});

interface Props {
  value: string;
  onChange: (value: string) => void;
  type: 'date' | 'time';
}

export function StyledDateTimePicker({ value, onChange, type }: Props) {
  const parsedValue = value 
    ? (type === 'time' ? dayjs(`2022-01-01T${value}`) : dayjs(value)) 
    : null;

  return (
    <ThemeProvider theme={darkTheme}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        {type === 'date' ? (
          <DatePicker 
            format="DD/MM/YYYY"
            value={parsedValue}
            onChange={(newValue) => {
              if (newValue) {
                onChange(newValue.format('YYYY-MM-DD'));
              }
            }}
            slotProps={{
              textField: { fullWidth: true }
            }}
          />
        ) : (
          <TimePicker 
            value={parsedValue}
            viewRenderers={{
              hours: renderTimeViewClock,
              minutes: renderTimeViewClock,
              seconds: renderTimeViewClock,
            }}
            onChange={(newValue) => {
              if (newValue) {
                onChange(newValue.format('HH:mm'));
              }
            }}
            slotProps={{
              textField: { fullWidth: true }
            }}
          />
        )}
      </LocalizationProvider>
    </ThemeProvider>
  );
}
