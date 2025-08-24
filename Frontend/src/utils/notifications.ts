export interface User {
    id: string;
    name: string;
    email: string;
    type: 'Player' | 'Owner';
    avatar?: string;
  }
  
  export interface Match {
    id: string;
    date: string;
    time: string;
    level: 'Beginner' | 'Intermediate' | 'Advanced';
    playersNeeded: number;
    organizer: string;
    organizerId: string;
    location: string;
    description?: string;
    joinedPlayers: string[];
    status: 'open' | 'full' | 'completed';
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
    registeredTeams: TournamentTeam[];
    status: 'open' | 'full' | 'completed';
  }
  
  export interface TournamentTeam {
    id: string;
    teamName: string;
    player1Name: string;
    player2Name: string;
    teamLeaderMobile: string;
    userId: string;
  }
  
  export interface Notification {
    id: string;
    type: 'match_request' | 'tournament_request' | 'match_accepted' | 'tournament_accepted';
    title: string;
    message: string;
    fromUserId: string;
    fromUserName: string;
    toUserId: string;
    matchId?: string;
    tournamentId?: string;
    teamData?: any;
    timestamp: Date;
    read: boolean;
    status: 'pending' | 'accepted' | 'rejected';
  }

// Mock notification storage (in real app, this would be a database)
let notifications: Notification[] = [
  {
    id: '1',
    type: 'match_request',
    title: 'Match Join Request',
    message: 'Sarah Chen wants to join your Intermediate match on Jan 20',
    fromUserId: '2',
    fromUserName: 'Sarah Chen',
    toUserId: '1',
    matchId: '1',
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    read: false,
    status: 'pending'
  },
  {
    id: '2',
    type: 'tournament_request',
    title: 'Tournament Registration',
    message: 'Team "Thunder Bolts" registered for Summer Championship',
    fromUserId: '3',
    fromUserName: 'Mike Johnson',
    toUserId: '1',
    tournamentId: '1',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    read: false,
    status: 'pending'
  }
];

export const getNotifications = (userId: string): Notification[] => {
  return notifications.filter(n => n.toUserId === userId).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

export const getUnreadCount = (userId: string): number => {
  return notifications.filter(n => n.toUserId === userId && !n.read).length;
};

export const markAsRead = (notificationId: string): void => {
  const notification = notifications.find(n => n.id === notificationId);
  if (notification) {
    notification.read = true;
  }
};

export const updateNotificationStatus = (notificationId: string, status: 'accepted' | 'rejected'): void => {
  const notification = notifications.find(n => n.id === notificationId);
  if (notification) {
    notification.status = status;
    notification.read = true;
  }
};

export const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): void => {
  const newNotification: Notification = {
    ...notification,
    id: Date.now().toString(),
    timestamp: new Date(),
    read: false
  };
  notifications.push(newNotification);
};
  
  export interface VideoAnalysis {
    id: string;
    userId: string;
    fileName: string;
    uploadDate: Date;
    analysis: {
      playerSpeed: number;
      reactionTime: number;
      accuracy: number;
      consistency: number;
      powerRating: number;
      recommendations: string[];
    };
    status: 'processing' | 'completed' | 'failed';
  }