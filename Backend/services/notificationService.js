import { createNotification, createBulkNotifications } from '../models/notificationModel.js';
import pool from '../db.js';

/**
 * Enhanced Notification Service
 * Handles all notification types for matches and tournaments
 */

// Match Notifications
export const MatchNotifications = {
  // When a match is created
  async matchCreated(matchId, creatorId) {
    try {
      const matchResult = await pool.query(
        'SELECT * FROM matches WHERE id = $1',
        [matchId]
      );
      
      if (matchResult.rows.length === 0) return;
      
      const match = matchResult.rows[0];
      
      // Notify creator
      await createNotification({
        user_id: creatorId,
        type: 'match_created',
        title: 'Match Created Successfully',
        message: `Your ${match.level_of_game} match on ${new Date(match.date_time).toLocaleDateString()} at ${match.location} is now available for players to join.`,
        related_id: matchId,
        related_type: 'match'
      });

      // Notify all users who might be interested (same skill level)
      const interestedUsersResult = await pool.query(
        `SELECT DISTINCT u.id, u.fullname 
         FROM users u 
         WHERE u.level_of_game = $1 
         AND u.id != $2 
         AND u.notification_preferences->>'match_created' != 'false'
         LIMIT 50`,
        [match.level_of_game, creatorId]
      );

      if (interestedUsersResult.rows.length > 0) {
        const notifications = interestedUsersResult.rows.map(user => ({
          user_id: user.id,
          type: 'new_match_available',
          title: 'New Match Available',
          message: `A new ${match.level_of_game} match is available on ${new Date(match.date_time).toLocaleDateString()} at ${match.location}. Join now!`,
          related_id: matchId,
          related_type: 'match'
        }));

        await createBulkNotifications(notifications);
      }

      console.log(`✅ Match created notifications sent for match ${matchId}`);
    } catch (error) {
      console.error('Error sending match created notifications:', error);
    }
  },

  // When a match is updated
  async matchUpdated(matchId, creatorId, changes) {
    try {
      const matchResult = await pool.query(
        'SELECT * FROM matches WHERE id = $1',
        [matchId]
      );
      
      if (matchResult.rows.length === 0) return;
      
      const match = matchResult.rows[0];

      // Get all participants (accepted join requests + direct participants)
      const participantsResult = await pool.query(
        `SELECT DISTINCT u.id, u.fullname
         FROM users u
         WHERE u.id IN (
           SELECT user_id FROM join_requests WHERE match_id = $1 AND status = 'accepted'
           UNION
           SELECT user_id FROM matchparticipants WHERE match_id = $1
         ) AND u.id != $2`,
        [matchId, creatorId]
      );

      if (participantsResult.rows.length > 0) {
        const changesList = Object.keys(changes).join(', ');
        const notifications = participantsResult.rows.map(user => ({
          user_id: user.id,
          type: 'match_updated',
          title: 'Match Updated',
          message: `The match on ${new Date(match.date_time).toLocaleDateString()} at ${match.location} has been updated. Changes: ${changesList}`,
          related_id: matchId,
          related_type: 'match'
        }));

        await createBulkNotifications(notifications);
      }

      console.log(`✅ Match updated notifications sent for match ${matchId}`);
    } catch (error) {
      console.error('Error sending match updated notifications:', error);
    }
  },

  // When a match is deleted/cancelled
  async matchDeleted(matchId, creatorId, matchData) {
    try {
      // Get all participants before deletion
      const participantsResult = await pool.query(
        `SELECT DISTINCT u.id, u.fullname
         FROM users u
         WHERE u.id IN (
           SELECT user_id FROM join_requests WHERE match_id = $1 AND status = 'accepted'
           UNION
           SELECT user_id FROM matchparticipants WHERE match_id = $1
         ) AND u.id != $2`,
        [matchId, creatorId]
      );

      if (participantsResult.rows.length > 0) {
        const notifications = participantsResult.rows.map(user => ({
          user_id: user.id,
          type: 'match_cancelled',
          title: 'Match Cancelled',
          message: `The match on ${new Date(matchData.date_time).toLocaleDateString()} at ${matchData.location} has been cancelled by the organizer.`,
          related_id: matchId,
          related_type: 'match'
        }));

        await createBulkNotifications(notifications);
      }

      console.log(`✅ Match cancelled notifications sent for match ${matchId}`);
    } catch (error) {
      console.error('Error sending match cancelled notifications:', error);
    }
  },

  // When a player sends a join request
  async joinRequestSent(matchId, requesterId, requestId) {
    try {
      const matchResult = await pool.query(
        'SELECT m.*, u.fullname as creator_name FROM matches m JOIN users u ON m.user_id = u.id WHERE m.id = $1',
        [matchId]
      );
      
      const requesterResult = await pool.query(
        'SELECT fullname FROM users WHERE id = $1',
        [requesterId]
      );

      if (matchResult.rows.length === 0 || requesterResult.rows.length === 0) return;
      
      const match = matchResult.rows[0];
      const requester = requesterResult.rows[0];

      // Notify match creator
      await createNotification({
        user_id: match.user_id,
        type: 'match_join_request',
        title: 'New Join Request',
        message: `${requester.fullname} wants to join your ${match.level_of_game} match on ${new Date(match.date_time).toLocaleDateString()}. Review their request now.`,
        related_id: matchId,
        related_type: 'match'
      });

      // Notify requester
      await createNotification({
        user_id: requesterId,
        type: 'join_request_sent',
        title: 'Join Request Sent',
        message: `Your request to join the ${match.level_of_game} match on ${new Date(match.date_time).toLocaleDateString()} has been sent to ${match.creator_name}.`,
        related_id: matchId,
        related_type: 'match'
      });

      console.log(`✅ Join request notifications sent for match ${matchId}`);
    } catch (error) {
      console.error('Error sending join request notifications:', error);
    }
  },

  // When a join request is approved/rejected
  async joinRequestDecision(matchId, requesterId, creatorId, status, requestId) {
    try {
      const matchResult = await pool.query(
        'SELECT * FROM matches WHERE id = $1',
        [matchId]
      );
      
      const requesterResult = await pool.query(
        'SELECT fullname FROM users WHERE id = $1',
        [requesterId]
      );

      if (matchResult.rows.length === 0 || requesterResult.rows.length === 0) return;
      
      const match = matchResult.rows[0];
      const requester = requesterResult.rows[0];

      // Notify requester about decision
      const statusMessage = status === 'accepted' 
        ? `Great news! Your request to join the ${match.level_of_game} match on ${new Date(match.date_time).toLocaleDateString()} has been accepted. You can now chat with other players!`
        : `Your request to join the ${match.level_of_game} match on ${new Date(match.date_time).toLocaleDateString()} has been declined.`;
      
      await createNotification({
        user_id: requesterId,
        type: status === 'accepted' ? 'join_request_accepted' : 'join_request_declined',
        title: status === 'accepted' ? 'Join Request Accepted!' : 'Join Request Declined',
        message: statusMessage,
        related_id: matchId,
        related_type: 'match'
      });

      // If accepted, notify creator and other participants
      if (status === 'accepted') {
        // Notify creator
        await createNotification({
          user_id: creatorId,
          type: 'match_partner_joined',
          title: 'Player Joined Your Match',
          message: `${requester.fullname} has joined your ${match.level_of_game} match on ${new Date(match.date_time).toLocaleDateString()}. Your match is getting ready!`,
          related_id: matchId,
          related_type: 'match'
        });

        // Notify other participants about new player
        const otherParticipantsResult = await pool.query(
          `SELECT DISTINCT u.id, u.fullname
           FROM users u
           WHERE u.id IN (
             SELECT user_id FROM join_requests WHERE match_id = $1 AND status = 'accepted' AND user_id != $2
             UNION
             SELECT user_id FROM matchparticipants WHERE match_id = $1 AND user_id != $2
           ) AND u.id != $3`,
          [matchId, requesterId, creatorId]
        );

        if (otherParticipantsResult.rows.length > 0) {
          const notifications = otherParticipantsResult.rows.map(user => ({
            user_id: user.id,
            type: 'new_player_joined',
            title: 'New Player Joined',
            message: `${requester.fullname} has joined your match on ${new Date(match.date_time).toLocaleDateString()}. Say hello in the chat!`,
            related_id: matchId,
            related_type: 'match'
          }));

          await createBulkNotifications(notifications);
        }
      }

      console.log(`✅ Join request decision notifications sent for match ${matchId}`);
    } catch (error) {
      console.error('Error sending join request decision notifications:', error);
    }
  }
};

// Tournament Notifications
export const TournamentNotifications = {
  // When a tournament is created
  async tournamentCreated(tournamentId, ownerId) {
    try {
      const tournamentResult = await pool.query(
        'SELECT * FROM tournaments WHERE id = $1',
        [tournamentId]
      );
      
      if (tournamentResult.rows.length === 0) return;
      
      const tournament = tournamentResult.rows[0];
      
      // Notify owner
      await createNotification({
        user_id: ownerId,
        type: 'tournament_created',
        title: 'Tournament Created Successfully',
        message: `Your tournament "${tournament.name}" on ${new Date(tournament.date).toLocaleDateString()} has been created and is now open for registrations.`,
        related_id: tournamentId,
        related_type: 'tournament'
      });

      // Notify all users about new tournament
      const allUsersResult = await pool.query(
        `SELECT id, fullname 
         FROM users 
         WHERE id != $1 
         AND notification_preferences->>'tournament_created' != 'false'
         LIMIT 100`,
        [ownerId]
      );

      if (allUsersResult.rows.length > 0) {
        const notifications = allUsersResult.rows.map(user => ({
          user_id: user.id,
          type: 'new_tournament_available',
          title: 'New Tournament Available',
          message: `"${tournament.name}" tournament is now open for registration! Date: ${new Date(tournament.date).toLocaleDateString()}, Location: ${tournament.location}`,
          related_id: tournamentId,
          related_type: 'tournament'
        }));

        await createBulkNotifications(notifications);
      }

      console.log(`✅ Tournament created notifications sent for tournament ${tournamentId}`);
    } catch (error) {
      console.error('Error sending tournament created notifications:', error);
    }
  },

  // When a tournament is updated
  async tournamentUpdated(tournamentId, ownerId, changes) {
    try {
      const tournamentResult = await pool.query(
        'SELECT * FROM tournaments WHERE id = $1',
        [tournamentId]
      );
      
      if (tournamentResult.rows.length === 0) return;
      
      const tournament = tournamentResult.rows[0];

      // Get all registered players
      const registeredPlayersResult = await pool.query(
        `SELECT DISTINCT u.id, u.fullname
         FROM users u
         JOIN tournament_registrations tr ON u.id = tr.user_id
         WHERE tr.tournament_id = $1 AND u.id != $2`,
        [tournamentId, ownerId]
      );

      if (registeredPlayersResult.rows.length > 0) {
        const changesList = Object.keys(changes).join(', ');
        const notifications = registeredPlayersResult.rows.map(user => ({
          user_id: user.id,
          type: 'tournament_updated',
          title: 'Tournament Updated',
          message: `The tournament "${tournament.name}" has been updated. Changes: ${changesList}. Please review the updated details.`,
          related_id: tournamentId,
          related_type: 'tournament'
        }));

        await createBulkNotifications(notifications);
      }

      console.log(`✅ Tournament updated notifications sent for tournament ${tournamentId}`);
    } catch (error) {
      console.error('Error sending tournament updated notifications:', error);
    }
  },

  // When a tournament is deleted
  async tournamentDeleted(tournamentId, ownerId, tournamentData) {
    try {
      // Get all registered players before deletion
      const registeredPlayersResult = await pool.query(
        `SELECT DISTINCT u.id, u.fullname
         FROM users u
         JOIN tournament_registrations tr ON u.id = tr.user_id
         WHERE tr.tournament_id = $1 AND u.id != $2`,
        [tournamentId, ownerId]
      );

      if (registeredPlayersResult.rows.length > 0) {
        const notifications = registeredPlayersResult.rows.map(user => ({
          user_id: user.id,
          type: 'tournament_cancelled',
          title: 'Tournament Cancelled',
          message: `The tournament "${tournamentData.name}" scheduled for ${new Date(tournamentData.date).toLocaleDateString()} has been cancelled by the organizer.`,
          related_id: tournamentId,
          related_type: 'tournament'
        }));

        await createBulkNotifications(notifications);
      }

      console.log(`✅ Tournament cancelled notifications sent for tournament ${tournamentId}`);
    } catch (error) {
      console.error('Error sending tournament cancelled notifications:', error);
    }
  },

  // When a player registers for a tournament
  async playerRegistered(tournamentId, playerId, registrationId) {
    try {
      const tournamentResult = await pool.query(
        'SELECT t.*, u.fullname as owner_name FROM tournaments t JOIN users u ON t.owner_id = u.id WHERE t.id = $1',
        [tournamentId]
      );
      
      const playerResult = await pool.query(
        'SELECT fullname FROM users WHERE id = $1',
        [playerId]
      );

      if (tournamentResult.rows.length === 0 || playerResult.rows.length === 0) return;
      
      const tournament = tournamentResult.rows[0];
      const player = playerResult.rows[0];

      // Notify tournament owner
      await createNotification({
        user_id: tournament.owner_id,
        type: 'tournament_registration',
        title: 'New Tournament Registration',
        message: `${player.fullname} has registered for your tournament "${tournament.name}". Check your tournament dashboard for details.`,
        related_id: tournamentId,
        related_type: 'tournament'
      });

      // Notify player
      await createNotification({
        user_id: playerId,
        type: 'tournament_registration_confirmed',
        title: 'Tournament Registration Confirmed',
        message: `You have successfully registered for "${tournament.name}" on ${new Date(tournament.date).toLocaleDateString()}. Good luck!`,
        related_id: tournamentId,
        related_type: 'tournament'
      });

      console.log(`✅ Tournament registration notifications sent for tournament ${tournamentId}`);
    } catch (error) {
      console.error('Error sending tournament registration notifications:', error);
    }
  }
};

// General notification utilities
export const NotificationUtils = {
  // Send system-wide announcement
  async sendSystemAnnouncement(title, message, type = 'announcement') {
    try {
      const allUsersResult = await pool.query(
        'SELECT id FROM users WHERE notification_preferences->\'system_announcements\' != \'false\''
      );

      if (allUsersResult.rows.length > 0) {
        const notifications = allUsersResult.rows.map(user => ({
          user_id: user.id,
          type,
          title,
          message,
          related_id: null,
          related_type: 'system'
        }));

        await createBulkNotifications(notifications);
      }

      console.log(`✅ System announcement sent to ${allUsersResult.rows.length} users`);
    } catch (error) {
      console.error('Error sending system announcement:', error);
    }
  },

  // Send maintenance notification
  async sendMaintenanceNotification(startTime, endTime, description) {
    try {
      const title = 'Scheduled Maintenance';
      const message = `System maintenance is scheduled from ${new Date(startTime).toLocaleString()} to ${new Date(endTime).toLocaleString()}. ${description}`;
      
      await this.sendSystemAnnouncement(title, message, 'maintenance');
    } catch (error) {
      console.error('Error sending maintenance notification:', error);
    }
  }
};

export default {
  MatchNotifications,
  TournamentNotifications,
  NotificationUtils
};