export interface User {
  id: string;
  name: string;
  email: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  type: 'Player' | 'Owner';
  phone: string;
  location?: string;
  courts?: number;
}

export interface Match {
  id: string;
  date: string;
  time: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  playersNeeded: number;
  organizer: string;
  location: string;
}

export interface Tournament {
  id: string;
  name: string;
  description: string;
  date: string;
  time: string;
  location: string;
  fee: number;
  maxTeams: number;
  organizer: string;
  organizerContact: string;
}